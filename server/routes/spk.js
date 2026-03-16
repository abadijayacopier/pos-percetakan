'use strict';
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// ══════════════════════════════════════════════════════════════
// 1. GET /api/spk — Daftar SPK + filter + search
// ══════════════════════════════════════════════════════════════
router.get('/', verifyToken, async (req, res) => {
    try {
        const { status, search, priority } = req.query;
        let sql = `
            SELECT s.*, u.name AS assigned_name
            FROM spk s
            LEFT JOIN users u ON u.id = s.assigned_to
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'Semua') {
            sql += ' AND s.status = ?';
            params.push(status);
        }
        if (priority) {
            sql += ' AND s.priority = ?';
            params.push(priority);
        }
        if (req.query.kategori) {
            sql += ' AND s.kategori = ?';
            params.push(req.query.kategori);
        }
        if (search) {
            sql += ' AND (s.spk_number LIKE ? OR s.customer_name LIKE ? OR s.product_name LIKE ?)';
            const q = `%${search}%`;
            params.push(q, q, q);
        }

        sql += ' ORDER BY s.created_at DESC';
        const [rows] = await pool.query(sql, params);

        // Hitung ringkasan jumlah per status (dengan kondisi yang sama)
        let countSql = `SELECT status, COUNT(*) as count FROM spk WHERE 1=1`;
        let totalSql = `SELECT COUNT(*) as total FROM spk WHERE 1=1`;
        let countParams = [];

        if (req.query.kategori) {
            countSql += ' AND kategori = ?';
            totalSql += ' AND kategori = ?';
            countParams.push(req.query.kategori);
        }

        countSql += ' GROUP BY status';

        const [summary] = await pool.query(countSql, countParams);
        const [total] = await pool.query(totalSql, countParams);

        res.json({
            data: rows,
            summary: {
                total: total[0][0].total,
                byStatus: summary.reduce((acc, r) => { acc[r.status] = r.count; return acc; }, {})
            }
        });
    } catch (error) {
        console.error('GET /api/spk error:', error);
        res.status(500).json({ message: 'Gagal mengambil daftar SPK' });
    }
});

// ══════════════════════════════════════════════════════════════
// 2. GET /api/spk/:id — Detail SPK lengkap (+ logs, payments)
// ══════════════════════════════════════════════════════════════
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [spkRows] = await pool.query(`
            SELECT s.*, 
                   u1.name AS assigned_name, 
                   u2.name AS created_by_name
            FROM spk s
            LEFT JOIN users u1 ON u1.id = s.assigned_to
            LEFT JOIN users u2 ON u2.id = s.created_by
            WHERE s.id = ?
        `, [req.params.id]);

        if (!spkRows.length) return res.status(404).json({ message: 'SPK tidak ditemukan' });

        const [logs] = await pool.query(`
            SELECT l.*, u.name AS user_name
            FROM spk_logs l
            LEFT JOIN users u ON u.id = l.user_id
            WHERE l.spk_id = ?
            ORDER BY l.created_at DESC
        `, [req.params.id]);

        const [payments] = await pool.query(`
            SELECT p.*, u.name AS paid_by_name
            FROM spk_payments p
            LEFT JOIN users u ON u.id = p.paid_by
            WHERE p.spk_id = ?
            ORDER BY p.created_at DESC
        `, [req.params.id]);

        const [handover] = await pool.query(
            'SELECT * FROM spk_handovers WHERE spk_id = ? ORDER BY created_at DESC LIMIT 1',
            [req.params.id]
        );

        res.json({
            ...spkRows[0],
            logs,
            payments,
            handover: handover[0] || null
        });
    } catch (error) {
        console.error('GET /api/spk/:id error:', error);
        res.status(500).json({ message: 'Gagal mengambil detail SPK' });
    }
});

// ══════════════════════════════════════════════════════════════
// 3. POST /api/spk — Buat SPK baru
// ══════════════════════════════════════════════════════════════
router.post('/', verifyToken, requireRole(['admin', 'kasir', 'operator']), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const {
            customer_id, customer_name, customer_phone, customer_company,
            product_name, product_qty, product_unit, kategori,
            specs_material, specs_finishing, specs_notes,
            biaya_cetak, biaya_material, biaya_finishing, biaya_desain, biaya_lainnya,
            dp_amount, priority, assigned_to, deadline
        } = req.body;

        const total_biaya = (biaya_cetak || 0) + (biaya_material || 0) + (biaya_finishing || 0) +
            (biaya_desain || 0) + (biaya_lainnya || 0);
        const sisa_tagihan = total_biaya - (dp_amount || 0);

        const id = 'spk-' + Date.now();
        // Generate SPK number: SPK-YYYY-NNNNN
        const year = new Date().getFullYear();
        const [countRows] = await conn.query(
            "SELECT COUNT(*) as cnt FROM spk WHERE spk_number LIKE ?", [`SPK-${year}-%`]
        );
        const nextNum = String((countRows[0].cnt || 0) + 1).padStart(5, '0');
        const spk_number = `SPK-${year}-${nextNum}`;

        // Verifikasi keberadaan user id untuk menghindari Foreign Key error jika session kadaluarsa/reset DB
        const [usr] = await conn.query('SELECT id FROM users WHERE id = ?', [req.user.id]);
        const validUserId = usr.length > 0 ? req.user.id : null;

        await conn.query(`
            INSERT INTO spk (
                id, spk_number, customer_id, customer_name, customer_phone, customer_company,
                product_name, product_qty, product_unit, kategori, specs_material, specs_finishing, specs_notes,
                biaya_cetak, biaya_material, biaya_finishing, biaya_desain, biaya_lainnya,
                total_biaya, dp_amount, sisa_tagihan,
                priority, assigned_to, created_by, deadline
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id, spk_number, customer_id || null, customer_name, customer_phone || null, customer_company || null,
            product_name, product_qty || 1, product_unit || 'pcs', kategori || 'Cetak Offset',
            specs_material || null, specs_finishing || null, specs_notes || null,
            biaya_cetak || 0, biaya_material || 0, biaya_finishing || 0, biaya_desain || 0, biaya_lainnya || 0,
            total_biaya, dp_amount || 0, sisa_tagihan,
            priority || 'Normal', assigned_to || null, validUserId, deadline || null
        ]);

        // Log: SPK dibuat
        await conn.query(
            'INSERT INTO spk_logs (spk_id, user_id, action, description, new_value) VALUES (?, ?, ?, ?, ?)',
            [id, validUserId, 'STATUS_CHANGE', 'SPK Baru Dibuat', 'Menunggu Antrian']
        );

        // Catat DP jika ada
        if (dp_amount > 0) {
            await conn.query(
                'INSERT INTO spk_payments (spk_id, payment_type, method, amount, paid_by) VALUES (?, ?, ?, ?, ?)',
                [id, 'DP', 'Tunai', dp_amount, validUserId]
            );
        }

        await conn.commit();
        res.status(201).json({ message: 'SPK berhasil dibuat!', id, spk_number });
    } catch (error) {
        await conn.rollback();
        console.error('POST /api/spk error:', error);
        res.status(500).json({ message: 'Gagal membuat SPK: ' + error.message });
    } finally {
        conn.release();
    }
});

// ══════════════════════════════════════════════════════════════
// 4. PATCH /api/spk/:id/status — Update status + auto-log
// ══════════════════════════════════════════════════════════════
router.patch('/:id/status', verifyToken, requireRole(['admin', 'kasir', 'operator']), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { status } = req.body;

        const [current] = await conn.query('SELECT status FROM spk WHERE id = ?', [req.params.id]);
        if (!current.length) return res.status(404).json({ message: 'SPK tidak ditemukan' });

        const oldStatus = current[0].status;
        const updates = { status };
        if (status === 'Selesai') updates.completed_at = new Date();

        await conn.query('UPDATE spk SET ? WHERE id = ?', [updates, req.params.id]);

        await conn.query(
            'INSERT INTO spk_logs (spk_id, user_id, action, description, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
            [req.params.id, req.user.id, 'STATUS_CHANGE', `Status berubah: ${oldStatus} → ${status}`, oldStatus, status]
        );

        await conn.commit();
        res.json({ message: 'Status SPK diperbarui', oldStatus, newStatus: status });
    } catch (error) {
        await conn.rollback();
        console.error('PATCH status error:', error);
        res.status(500).json({ message: 'Gagal update status' });
    } finally {
        conn.release();
    }
});

// ══════════════════════════════════════════════════════════════
// 5. PATCH /api/spk/:id/finalize — Hitung biaya akhir
// ══════════════════════════════════════════════════════════════
router.patch('/:id/finalize', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    try {
        const { biaya_cetak, biaya_material, biaya_finishing, biaya_desain, biaya_lainnya } = req.body;

        const [current] = await pool.query('SELECT dp_amount FROM spk WHERE id = ?', [req.params.id]);
        if (!current.length) return res.status(404).json({ message: 'SPK tidak ditemukan' });

        const total_biaya = (biaya_cetak || 0) + (biaya_material || 0) + (biaya_finishing || 0) +
            (biaya_desain || 0) + (biaya_lainnya || 0);
        const sisa_tagihan = total_biaya - current[0].dp_amount;

        await pool.query(`
            UPDATE spk SET biaya_cetak=?, biaya_material=?, biaya_finishing=?, biaya_desain=?, biaya_lainnya=?,
            total_biaya=?, sisa_tagihan=? WHERE id=?
        `, [biaya_cetak || 0, biaya_material || 0, biaya_finishing || 0, biaya_desain || 0, biaya_lainnya || 0,
            total_biaya, sisa_tagihan, req.params.id]);

        res.json({ message: 'Biaya akhir diperbarui', total_biaya, sisa_tagihan });
    } catch (error) {
        console.error('PATCH finalize error:', error);
        res.status(500).json({ message: 'Gagal memperbarui biaya' });
    }
});

// ══════════════════════════════════════════════════════════════
// 6. POST /api/spk/:id/pay — Catat pembayaran
// ══════════════════════════════════════════════════════════════
router.post('/:id/pay', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { amount, method, payment_type, bank_ref } = req.body;

        const [current] = await conn.query('SELECT sisa_tagihan, spk_number FROM spk WHERE id = ?', [req.params.id]);
        if (!current.length) return res.status(404).json({ message: 'SPK tidak ditemukan' });

        await conn.query(
            'INSERT INTO spk_payments (spk_id, payment_type, method, amount, bank_ref, paid_by) VALUES (?, ?, ?, ?, ?, ?)',
            [req.params.id, payment_type || 'Pelunasan', method || 'Tunai', amount, bank_ref || null, req.user.id]
        );

        const newSisa = Math.max(0, current[0].sisa_tagihan - amount);
        await conn.query('UPDATE spk SET sisa_tagihan = ?, dp_amount = dp_amount + ? WHERE id = ?',
            [newSisa, amount, req.params.id]);

        // Log
        await conn.query(
            'INSERT INTO spk_logs (spk_id, user_id, action, description, new_value) VALUES (?, ?, ?, ?, ?)',
            [req.params.id, req.user.id, 'PAYMENT', `Pembayaran ${method}: Rp ${amount.toLocaleString('id-ID')}`, String(amount)]
        );

        // Jika lunas & status Selesai → ubah ke Siap Diambil
        if (newSisa <= 0) {
            await conn.query("UPDATE spk SET status = 'Siap Diambil' WHERE id = ? AND status = 'Selesai'", [req.params.id]);
        }

        // Catat ke cash_flow
        const cashFlowId = 'cf-spk-' + Date.now();
        const date = new Date().toISOString().split('T')[0];
        await conn.query(
            `INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id) VALUES (?, ?, 'in', ?, ?, ?, ?)`,
            [cashFlowId, date, payment_type === 'DP' ? 'DP SPK' : 'Pelunasan SPK', amount,
                `${payment_type || 'Pelunasan'} SPK ${current[0].spk_number}`, req.params.id]
        );

        await conn.commit();
        res.json({ message: 'Pembayaran berhasil dicatat', sisa_tagihan: newSisa });
    } catch (error) {
        await conn.rollback();
        console.error('POST pay error:', error);
        res.status(500).json({ message: 'Gagal memproses pembayaran' });
    } finally {
        conn.release();
    }
});

// ══════════════════════════════════════════════════════════════
// 7. POST /api/spk/:id/handover — Serah terima barang
// ══════════════════════════════════════════════════════════════
router.post('/:id/handover', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { received_by_name, received_by_phone, signature_data, photo_evidence, notes } = req.body;

        await conn.query(`
            INSERT INTO spk_handovers (spk_id, received_by_name, received_by_phone, signature_data, photo_evidence, notes, handed_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [req.params.id, received_by_name, received_by_phone || null, signature_data || null,
        photo_evidence || null, notes || null, req.user.id]);

        await conn.query("UPDATE spk SET status = 'Diambil' WHERE id = ?", [req.params.id]);

        await conn.query(
            'INSERT INTO spk_logs (spk_id, user_id, action, description, new_value) VALUES (?, ?, ?, ?, ?)',
            [req.params.id, req.user.id, 'HANDOVER', `Barang diserahkan kepada ${received_by_name}`, 'Diambil']
        );

        await conn.commit();
        res.json({ message: 'Serah terima berhasil dicatat' });
    } catch (error) {
        await conn.rollback();
        console.error('POST handover error:', error);
        res.status(500).json({ message: 'Gagal mencatat serah terima' });
    } finally {
        conn.release();
    }
});

// ══════════════════════════════════════════════════════════════
// 8. GET /api/spk/payments/qris — Monitor transaksi QRIS
// ══════════════════════════════════════════════════════════════
router.get('/payments/qris', verifyToken, async (req, res) => {
    try {
        const [transactions] = await pool.query(`
            SELECT p.*, s.spk_number, s.customer_name,
                   u.name AS cashier_name
            FROM spk_payments p
            JOIN spk s ON s.id = p.spk_id
            LEFT JOIN users u ON u.id = p.paid_by
            WHERE p.method = 'QRIS'
            ORDER BY p.created_at DESC
            LIMIT 100
        `);

        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_tx,
                SUM(CASE WHEN status='Berhasil' THEN 1 ELSE 0 END) as success_tx,
                SUM(CASE WHEN status='Pending' THEN 1 ELSE 0 END) as pending_tx,
                SUM(CASE WHEN status='Berhasil' THEN amount ELSE 0 END) as total_amount
            FROM spk_payments WHERE method = 'QRIS'
        `);

        res.json({ transactions, stats: stats[0] });
    } catch (error) {
        console.error('GET qris error:', error);
        res.status(500).json({ message: 'Gagal mengambil data QRIS' });
    }
});

module.exports = router;
