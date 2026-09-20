'use strict';

const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * Antrian pembayaran pesanan produksi.
 * Sumber:
 * - Digital Printing -> dp_tasks
 * - Offset -> spk
 *
 * Prinsip:
 * 1. Pesanan masuk ke kasir sebelum produksi.
 * 2. Kasir dapat mencari pelanggan / jenis cetakan.
 * 3. Pembayaran/DP dicatat server-side.
 * 4. Setelah ada pembayaran, pesanan dilepas ke antrian produksi.
 */
router.get('/production-orders', verifyToken, requireRole(['kasir', 'admin', 'operator']), async (req, res) => {
    try {
        const q = String(req.query.search || '').trim();
        const like = `%${q}%`;

        const [digital] = await req.db.query(`
            SELECT
                t.id,
                t.id AS reference_id,
                'digital' AS source,
                'Digital Printing' AS source_label,
                t.customerId AS customer_id,
                t.customerName AS customer_name,
                t.title AS print_type,
                t.material_name,
                t.qty,
                t.material_price,
                t.design_price,
                (COALESCE(t.material_price,0) + COALESCE(t.design_price,0)) AS total_amount,
                COALESCE(t.dp_amount,0) AS paid_amount,
                GREATEST(0, (COALESCE(t.material_price,0) + COALESCE(t.design_price,0)) - COALESCE(t.dp_amount,0)) AS remaining_amount,
                t.status,
                t.created_at,
                c.phone AS customer_phone
            FROM dp_tasks t
            LEFT JOIN customers c ON c.id = t.customerId
            WHERE t.status NOT IN ('batal','selesai','diambil')
              AND COALESCE(t.dp_amount,0) < (COALESCE(t.material_price,0) + COALESCE(t.design_price,0))
              AND (? = '' OR t.customerName LIKE ? OR t.title LIKE ? OR t.material_name LIKE ? OR t.id LIKE ?)
            ORDER BY t.created_at DESC
        `, [q, like, like, like, like]);

        const [offset] = await req.db.query(`
            SELECT
                s.id,
                s.id AS reference_id,
                'offset' AS source,
                'Offset Printing' AS source_label,
                s.customer_id,
                s.customer_name,
                s.product_name AS print_type,
                s.specs_material AS material_name,
                s.product_qty AS qty,
                s.biaya_cetak,
                s.biaya_material,
                s.biaya_finishing,
                s.biaya_desain,
                s.biaya_lainnya,
                s.total_biaya AS total_amount,
                s.dp_amount AS paid_amount,
                GREATEST(0, s.sisa_tagihan) AS remaining_amount,
                s.status,
                s.created_at,
                COALESCE(c.phone, s.customer_phone) AS customer_phone
            FROM spk s
            LEFT JOIN customers c ON c.id = s.customer_id
            WHERE s.kategori = 'Cetak Offset'
              AND LOWER(s.status) NOT IN ('batal','diambil','siap diambil')
              AND COALESCE(s.sisa_tagihan,0) > 0
              AND (? = '' OR s.customer_name LIKE ? OR s.product_name LIKE ? OR s.specs_material LIKE ? OR s.spk_number LIKE ?)
            ORDER BY s.created_at DESC
        `, [q, like, like, like, like]);

        const data = [...digital, ...offset]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({
            data,
            summary: {
                total: data.length,
                digital: digital.length,
                offset: offset.length,
                total_remaining: data.reduce((sum, x) => sum + Number(x.remaining_amount || 0), 0)
            }
        });
    } catch (error) {
        console.error('GET cashier production orders:', error);
        res.status(500).json({ message: 'Gagal memuat antrian pembayaran produksi', error: error.message });
    }
});

router.post('/production-orders/:source/:id/pay', verifyToken, requireRole(['kasir', 'admin']), async (req, res) => {
    const conn = await req.db.getConnection();
    try {
        await conn.beginTransaction();

        const source = String(req.params.source).toLowerCase();
        const amount = Number(req.body.amount);
        const method = String(req.body.method || 'tunai');
        const notes = req.body.notes ? String(req.body.notes) : null;

        if (!['digital', 'offset'].includes(source)) {
            return res.status(400).json({ message: 'Sumber pesanan tidak valid' });
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Nominal pembayaran harus lebih dari 0' });
        }

        if (source === 'digital') {
            const [[task]] = await conn.query('SELECT * FROM dp_tasks WHERE id = ? FOR UPDATE', [req.params.id]);
            if (!task) return res.status(404).json({ message: 'Pesanan digital printing tidak ditemukan' });
            if (['batal', 'selesai', 'diambil'].includes(String(task.status).toLowerCase())) {
                return res.status(409).json({ message: 'Pesanan sudah tidak dapat diproses' });
            }

            const total = Number(task.material_price || 0) + Number(task.design_price || 0);
            const currentPaid = Number(task.dp_amount || 0);
            const remaining = Math.max(0, total - currentPaid);
            if (amount > remaining) {
                return res.status(400).json({ message: 'Pembayaran melebihi sisa tagihan', remaining });
            }

            const newPaid = currentPaid + amount;
            const fullyPaid = newPaid >= total;
            await conn.query(
                `UPDATE dp_tasks
                 SET dp_amount = ?, is_paid = ?, status = 'produksi'
                 WHERE id = ?`,
                [newPaid, fullyPaid ? 1 : 0, task.id]
            );

            const [[detail]] = await conn.query(
                `SELECT transaction_id
                 FROM transaction_details
                 WHERE note = ?
                 ORDER BY transaction_id DESC
                 LIMIT 1
                 FOR UPDATE`,
                [task.id]
            );

            if (detail?.transaction_id) {
                const [[trx]] = await conn.query(
                    'SELECT id, paid, total, customer_id FROM transactions WHERE id = ? FOR UPDATE',
                    [detail.transaction_id]
                );
                if (trx) {
                    const trxPaid = Number(trx.paid || 0) + amount;
                    await conn.query(
                        `UPDATE transactions
                         SET paid = ?, payment_type = ?, status = ?, notes = COALESCE(?, notes)
                         WHERE id = ?`,
                        [trxPaid, method, trxPaid >= Number(trx.total || total) ? 'paid' : 'debt', notes, trx.id]
                    );
                }
            }

            await conn.query(
                `INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
                 VALUES (?, CURDATE(), 'in', ?, ?, ?, ?)`,
                [
                    'cf-dp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
                    currentPaid > 0 ? 'Pelunasan Digital Printing' : 'DP Digital Printing',
                    amount,
                    `${currentPaid > 0 ? 'Pelunasan' : 'DP'} Digital Printing ${task.id} - ${task.customerName || 'Umum'}`,
                    task.id
                ]
            );

            if (task.customerId) {
                await conn.query(
                    'UPDATE customers SET total_spend = total_spend + ? WHERE id = ?',
                    [amount, task.customerId]
                );
            }

            await conn.query(
                'INSERT INTO activity_log (user_id, user_name, action, target, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
                [req.user.id, req.user.name, 'CASHIER_PRODUCTION_PAYMENT', 'Digital Printing', `${task.id} dibayar Rp ${amount.toLocaleString('id-ID')}; status produksi=produksi`, req.ip || null]
            );

            await conn.commit();
            return res.json({
                message: fullyPaid ? 'Pelunasan berhasil. Pesanan siap produksi.' : 'DP berhasil. Pesanan dilepas ke produksi.',
                source,
                id: task.id,
                total,
                paid: newPaid,
                remaining: Math.max(0, total - newPaid),
                production_status: 'produksi'
            });
        }

        const [[spk]] = await conn.query('SELECT * FROM spk WHERE id = ? FOR UPDATE', [req.params.id]);
        if (!spk) return res.status(404).json({ message: 'SPK offset tidak ditemukan' });
        if (['batal', 'diambil', 'Siap Diambil'].includes(String(spk.status))) {
            return res.status(409).json({ message: 'SPK sudah tidak dapat diproses' });
        }

        const total = Number(spk.total_biaya || 0);
        const currentPaid = Number(spk.dp_amount || 0);
        const remaining = Math.max(0, Number(spk.sisa_tagihan ?? (total - currentPaid)));
        if (amount > remaining) {
            return res.status(400).json({ message: 'Pembayaran melebihi sisa tagihan', remaining });
        }

        const newPaid = currentPaid + amount;
        const newRemaining = Math.max(0, total - newPaid);
        const paymentType = currentPaid > 0 ? 'Pelunasan' : 'DP';

        await conn.query(
            `INSERT INTO spk_payments (spk_id, payment_type, method, amount, bank_ref, paid_by)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [spk.id, paymentType, method, amount, req.body.bank_ref || null, req.user.id]
        );

        await conn.query(
            `UPDATE spk
             SET dp_amount = ?, sisa_tagihan = ?, status = CASE
                 WHEN LOWER(status) IN ('menunggu pembayaran','pending') THEN 'Menunggu Antrian'
                 ELSE status
             END
             WHERE id = ?`,
            [newPaid, newRemaining, spk.id]
        );

        await conn.query(
            `INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
             VALUES (?, CURDATE(), 'in', ?, ?, ?, ?)`,
            [
                'cf-spk-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
                paymentType === 'DP' ? 'DP SPK' : 'Pelunasan SPK',
                amount,
                `${paymentType} SPK ${spk.spk_number} - ${spk.customer_name || 'Umum'}`,
                spk.id
            ]
        );

        if (spk.customer_id) {
            await conn.query(
                'UPDATE customers SET total_spend = total_spend + ? WHERE id = ?',
                [amount, spk.customer_id]
            );
        }

        await conn.query(
            'INSERT INTO activity_log (user_id, user_name, action, target, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, req.user.name, 'CASHIER_PRODUCTION_PAYMENT', 'Offset Printing', `${spk.spk_number} dibayar Rp ${amount.toLocaleString('id-ID')}; status produksi=${newRemaining <= 0 ? 'lunas' : 'Menunggu Antrian'}`, req.ip || null]
        );

        await conn.commit();
        res.json({
            message: newRemaining <= 0 ? 'Pelunasan berhasil. Pesanan siap produksi.' : 'DP berhasil. Pesanan dilepas ke produksi.',
            source,
            id: spk.id,
            total,
            paid: newPaid,
            remaining: newRemaining,
            production_status: 'Menunggu Antrian'
        });
    } catch (error) {
        await conn.rollback();
        console.error('POST cashier production payment:', error);
        res.status(500).json({ message: 'Gagal memproses pembayaran produksi', error: error.message });
    } finally {
        conn.release();
    }
});

module.exports = router;
