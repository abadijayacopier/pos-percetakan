'use strict';
const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// ─── Helper: generate order number ────────────────────────────────────────
async function generateOrderNumber(conn) {
    const prefix = 'ORD';
    const year = new Date().getFullYear().toString().slice(-2);
    const [rows] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM orders WHERE order_number LIKE ?`,
        [`${prefix}-${year}%`]
    );
    const seq = String(rows[0].cnt + 1).padStart(4, '0');
    return `${prefix}-${year}${seq}`;
}

// ── GET list semua order ────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(`
            SELECT
                o.id, o.order_number, o.customer_name, o.total_harga,
                COALESCE(SUM(oi.design_cost), 0) AS total_design_cost,
                o.status_pembayaran, o.dp_amount, o.remaining,
                o.metode_pembayaran, o.deadline, o.catatan,
                o.created_at,
                COUNT(oi.id) AS jumlah_item,
                u.name AS kasir_name
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN users u ON u.id = o.user_id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: 'Gagal mengambil data order', error: e.message });
    }
});

// ── GET detail order ─────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [[order]] = await req.db.query(
            `SELECT o.*, u.name AS kasir_name
             FROM orders o LEFT JOIN users u ON u.id = o.user_id
             WHERE o.id = ?`, [req.params.id]
        );
        if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });

        const [items] = await req.db.query(`
            SELECT oi.*,
                   m.nama_bahan, m.satuan,
                   ps.status AS production_status,
                   ps.catatan_teknis, ps.link_file_desain,
                   ps.foto_sebelum, ps.foto_sesudah, ps.id AS ps_id
            FROM order_items oi
            LEFT JOIN materials m ON m.id = oi.material_id
            LEFT JOIN production_status ps ON ps.order_item_id = oi.id
            WHERE oi.order_id = ?
        `, [req.params.id]);

        const totalDesignCost = (items || []).reduce((acc, it) => acc + (it.design_cost || 0), 0);
        res.json({ ...order, items, total_design_cost: totalDesignCost });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── POST buat order baru ───────────────────────────────────────────────────
router.post('/', verifyToken, requireRole(['kasir', 'admin', 'operator']), async (req, res) => {
    const conn = await req.db.getConnection();
    try {
        await conn.beginTransaction();

        const {
            customer_id, customer_name, metode_pembayaran,
            dp_amount, deadline, catatan,
            items
        } = req.body;

        if (!items || !items.length) {
            return res.status(400).json({ message: 'Minimal satu item diperlukan' });
        }

        const [userCheck] = await conn.query('SELECT id FROM users WHERE id = ?', [req.user.id]);
        const validUserId = userCheck.length > 0 ? req.user.id : null;

        const orderId = 'ord' + Date.now();
        const orderNo = await generateOrderNumber(conn);
        const totalHarga = items.reduce((sum, i) => sum + (parseInt(i.subtotal) || 0), 0);
        const dp = parseInt(dp_amount) || 0;
        const remaining = totalHarga - dp;

        const safeMetode = metode_pembayaran && metode_pembayaran.trim() ? metode_pembayaran.trim() : null;
        const safeDeadline = deadline && deadline.trim() ? deadline.trim() : null;

        await conn.query(
            `INSERT INTO orders
             (id, order_number, customer_id, customer_name, user_id,
              total_harga, status_pembayaran, dp_amount, remaining,
              metode_pembayaran, deadline, catatan)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [orderId, orderNo, customer_id && customer_id.trim() ? customer_id.trim() : null, customer_name || 'Umum', validUserId, totalHarga, dp >= totalHarga && totalHarga > 0 ? 'lunas' : dp > 0 ? 'dp' : 'belum_bayar', dp, remaining, safeMetode, safeDeadline, catatan && catatan.trim() ? catatan.trim() : null]
        );

        const VALID_LAYANAN = ['digital_printing', 'offset', 'atk', 'jilid', 'fotocopy', 'jasa_desain', 'lainnya'];

        for (const item of items) {
            const itemId = 'oi' + Date.now() + Math.random().toString(36).slice(2, 6);
            const sub = parseInt(item.subtotal) || 0;
            const safeLayanan = VALID_LAYANAN.includes(item.layanan) ? item.layanan : 'digital_printing';
            const safeMaterialId = item.material_id && item.material_id.trim() ? item.material_id.trim() : null;
            const ukP = parseFloat(item.ukuran_p) || null;
            const ukL = parseFloat(item.ukuran_l) || null;
            const luasTotal = (ukP && ukL) ? parseFloat((ukP * ukL).toFixed(4)) : null;

            await conn.query(
                `INSERT INTO order_items
                 (id, order_id, layanan, nama_item, material_id,
                  ukuran_p, ukuran_l, luas_total, quantity, harga_satuan, subtotal, design_cost,
                  file_desain, catatan)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [itemId, orderId, safeLayanan, item.nama_item.trim(), safeMaterialId, ukP, ukL, luasTotal, parseInt(item.quantity) || 1, parseInt(item.harga_satuan) || 0, sub, 0, item.file_desain && item.file_desain.trim() ? item.file_desain.trim() : null, item.catatan && item.catatan.trim() ? item.catatan.trim() : null]
            );

            await conn.query(`INSERT INTO production_status (order_item_id, status) VALUES (?, 'menunggu')`, [itemId]);

            if (safeMaterialId) {
                const deduction = (safeLayanan === 'digital_printing' && luasTotal)
                    ? (parseFloat(luasTotal) * (parseInt(item.quantity) || 1))
                    : (parseInt(item.quantity) || 1);

                await conn.query(`UPDATE materials SET stok_saat_ini = GREATEST(0, stok_saat_ini - ?) WHERE id = ?`, [deduction, safeMaterialId]);
                await conn.query(
                    `INSERT INTO material_movements (material_id, tipe, jumlah, satuan, referensi, catatan, user_id)
                     SELECT ?, 'keluar', ?, satuan, ?, ?, ? FROM materials WHERE id = ?`,
                    [safeMaterialId, deduction, orderNo, `Order ${orderNo} - ${item.nama_item}`, validUserId, safeMaterialId]
                );
            }
        }

        if (dp > 0) {
            await conn.query(
                `INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
                 VALUES (?, CURDATE(), 'in', 'DP Cetak', ?, ?, ?)`,
                ['cf' + Date.now(), dp, `DP Order ${orderNo}`, orderId]
            );
        }

        if (customer_id && customer_id.trim()) {
            await conn.query('UPDATE customers SET total_trx = total_trx + 1, total_spend = total_spend + ? WHERE id = ?', [dp, customer_id.trim()]);
        }

        await conn.commit();
        res.status(201).json({ message: 'Order berhasil dibuat', id: orderId, order_number: orderNo });
    } catch (e) {
        await conn.rollback();
        res.status(500).json({ message: 'Gagal menyimpan order', detail: e.message });
    } finally {
        conn.release();
    }
});

// ── PATCH update status pembayaran ────────────────────────────────────────
router.patch('/:id/status-bayar', verifyToken, requireRole(['kasir', 'admin']), async (req, res) => {
    const conn = await req.db.getConnection();
    try {
        await conn.beginTransaction();
        const { bayar_tambahan, metode_pembayaran } = req.body;
        const tambahan = parseInt(bayar_tambahan) || 0;

        const [[order]] = await conn.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (!order) throw new Error('Order tidak ditemukan');

        const newDp = order.dp_amount + tambahan;
        const newRemaining = Math.max(0, order.total_harga - newDp);
        const newStatus = newRemaining === 0 ? 'lunas' : newDp > 0 ? 'dp' : 'belum_bayar';

        await conn.query(`UPDATE orders SET dp_amount=?, remaining=?, status_pembayaran=?, metode_pembayaran=COALESCE(?,metode_pembayaran) WHERE id=?`, [newDp, newRemaining, newStatus, metode_pembayaran || null, req.params.id]);

        if (tambahan > 0) {
            await conn.query(
                `INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
                 VALUES (?, CURDATE(), 'in', 'Pelunasan Cetak', ?, ?, ?)`,
                ['cf' + Date.now(), tambahan, `Pelunasan ${order.order_number}`, req.params.id]
            );
        }

        await conn.commit();
        res.json({ message: 'Pembayaran diperbarui', status: newStatus, remaining: newRemaining });
    } catch (e) {
        await conn.rollback();
        res.status(500).json({ message: e.message });
    } finally {
        conn.release();
    }
});

// ── PATCH update status produksi item (Kanban drag) ───────────────────────
router.patch('/items/:itemId/status', verifyToken, requireRole(['kasir', 'admin', 'operator']), async (req, res) => {
    try {
        const { status, catatan_teknis, link_file_desain } = req.body;
        const allowed = ['menunggu', 'desain', 'approval', 'cetak', 'finishing', 'siap_diambil', 'selesai', 'batal'];
        if (!allowed.includes(status)) return res.status(400).json({ message: 'Status tidak valid' });

        await req.db.query(
            `UPDATE production_status
             SET status=?, catatan_teknis=COALESCE(?,catatan_teknis),
                 link_file_desain=COALESCE(?,link_file_desain), operator_id=?
             WHERE order_item_id=?`,
            [status, catatan_teknis || null, link_file_desain || null, req.user.id, req.params.itemId]
        );
        res.json({ message: 'Status produksi diperbarui' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── DELETE batalkan order ──────────────────────────────────────────────────
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        await req.db.query(
            `UPDATE production_status ps
             INNER JOIN order_items oi ON oi.id = ps.order_item_id
             SET ps.status = 'batal'
             WHERE oi.order_id = ?`,
            [req.params.id]
        );
        res.json({ message: 'Order dibatalkan' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
