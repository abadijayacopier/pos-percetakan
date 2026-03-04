'use strict';
/**
 * routes/design-logs.js
 * Timer Jasa Desain — integrasi ke DB
 *
 *   POST   /start          → mulai sesi (insert dengan end_time NULL)
 *   PATCH  /:id/stop       → selesai sesi (update end_time = NOW())
 *   PATCH  /:id/pause      → sama dengan stop (buat sesi baru saat lanjut)
 *   GET    /item/:itemId   → semua sesi log untuk satu order_item
 *   GET    /active         → cek sesi aktif milik user saat ini
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// ── Ambil tarif desain dari settings ──────────────────────────────────────
async function getTarif() {
    try {
        const [rows] = await pool.query("SELECT value FROM settings WHERE `key`='tarif_desain_per_jam'");
        return parseInt(rows[0]?.value) || 50000;
    } catch {
        return 50000;
    }
}

// ── GET sesi aktif user (end_time IS NULL) ────────────────────────────────
router.get('/active', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT dl.*, oi.nama_item, o.order_number
             FROM design_logs dl
             JOIN order_items oi ON oi.id = dl.order_item_id
             JOIN orders o ON o.id = oi.order_id
             WHERE dl.technician_id = ? AND dl.end_time IS NULL
             ORDER BY dl.start_time DESC LIMIT 1`,
            [req.user.id]
        );
        res.json(rows[0] || null);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── GET semua log untuk satu order_item ───────────────────────────────────
router.get('/item/:itemId', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT dl.*, u.name AS technician_name
             FROM design_logs dl
             LEFT JOIN users u ON u.id = dl.technician_id
             WHERE dl.order_item_id = ?
             ORDER BY dl.start_time DESC`,
            [req.params.itemId]
        );
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── POST mulai sesi timer ─────────────────────────────────────────────────
router.post('/start', verifyToken, async (req, res) => {
    try {
        const { order_item_id, catatan } = req.body;
        if (!order_item_id) return res.status(400).json({ message: 'order_item_id wajib diisi' });

        // Pastikan tidak ada sesi aktif lain
        const [active] = await pool.query(
            'SELECT id FROM design_logs WHERE technician_id = ? AND end_time IS NULL',
            [req.user.id]
        );
        if (active.length) {
            return res.status(409).json({ message: 'Masih ada sesi timer aktif. Selesaikan dulu sebelum mulai sesi baru.', active_id: active[0].id });
        }

        const tarif = await getTarif();
        const [result] = await pool.query(
            `INSERT INTO design_logs (order_item_id, technician_id, start_time, tarif_per_jam, catatan)
             VALUES (?, ?, NOW(), ?, ?)`,
            [order_item_id, req.user.id, tarif, catatan || null]
        );

        // Update status produksi ke 'desain'
        await pool.query(
            `UPDATE production_status SET status = 'desain', operator_id = ? WHERE order_item_id = ?`,
            [req.user.id, order_item_id]
        );

        res.status(201).json({ message: 'Timer dimulai', id: result.insertId, tarif_per_jam: tarif });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── PATCH stop / selesaikan sesi ──────────────────────────────────────────
router.patch('/:id/stop', verifyToken, async (req, res) => {
    try {
        const { catatan } = req.body;
        const [rows] = await pool.query(
            'SELECT * FROM design_logs WHERE id = ? AND technician_id = ?',
            [req.params.id, req.user.id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Sesi tidak ditemukan atau bukan milik Anda' });
        if (rows[0].end_time) return res.status(400).json({ message: 'Sesi sudah selesai' });

        await pool.query(
            `UPDATE design_logs SET end_time = NOW(), catatan = COALESCE(?, catatan) WHERE id = ?`,
            [catatan || null, req.params.id]
        );

        // Ambil data terbaru (generated columns sudah terhitung)
        const [[updated]] = await pool.query('SELECT * FROM design_logs WHERE id = ?', [req.params.id]);
        res.json({ message: 'Timer selesai', log: updated });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── PATCH pause (= stop, tapi frontend akan tampilkan "dijeda") ───────────
router.patch('/:id/pause', verifyToken, async (req, res) => {
    try {
        await pool.query(
            'UPDATE design_logs SET end_time = NOW() WHERE id = ? AND technician_id = ? AND end_time IS NULL',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Timer dijeda. Buat sesi baru untuk melanjutkan.' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
