'use strict';
const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// ── Ambil tarif desain dari settings ──────────────────────────────────────
async function getTarif(db) {
    try {
        const [rows] = await db.query("SELECT value FROM settings WHERE `key`='tarif_desain_per_jam'");
        return parseInt(rows[0]?.value) || 50000;
    } catch {
        return 50000;
    }
}

// ── GET sesi aktif user ────────────────────────────────
router.get('/active', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(
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
        const [rows] = await req.db.query(
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

        const [active] = await req.db.query(
            'SELECT id FROM design_logs WHERE technician_id = ? AND end_time IS NULL',
            [req.user.id]
        );
        if (active.length) {
            return res.status(409).json({ message: 'Masih ada sesi timer aktif.', active_id: active[0].id });
        }

        const tarif = await getTarif(req.db);
        const [result] = await req.db.query(
            `INSERT INTO design_logs (order_item_id, technician_id, start_time, tarif_per_jam, catatan)
             VALUES (?, ?, NOW(), ?, ?)`,
            [order_item_id, req.user.id, tarif, catatan || null]
        );

        await req.db.query(
            `UPDATE production_status SET status = 'desain', operator_id = ? WHERE order_item_id = ?`,
            [req.user.id, order_item_id]
        );

        res.status(201).json({ message: 'Timer dimulai', id: result.insertId, tarif_per_jam: tarif });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── PATCH stop ──────────────────────────────────────────
router.patch('/:id/stop', verifyToken, async (req, res) => {
    try {
        const { catatan } = req.body;
        const [rows] = await req.db.query(
            'SELECT * FROM design_logs WHERE id = ? AND technician_id = ?',
            [req.params.id, req.user.id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Sesi tidak ditemukan' });
        if (rows[0].end_time) return res.status(400).json({ message: 'Sesi sudah selesai' });

        const logBefore = rows[0];
        const orderItemId = logBefore.order_item_id;
        const startTime = logBefore.start_time;
        const tarif = logBefore.tarif_per_jam;
        const endNow = new Date();
        const durationMin = Math.ceil((endNow.getTime() - new Date(startTime).getTime()) / 60000);
        const biayaBaru = Math.round((durationMin / 60) * tarif);

        await req.db.query(
            `UPDATE design_logs 
             SET end_time = NOW(), catatan = COALESCE(?, catatan),
                 total_durasi_menit = COALESCE(total_durasi_menit, 0) + ?,
                 total_biaya_desain = COALESCE(total_biaya_desain, 0) + ?
             WHERE id = ?`,
            [catatan || null, durationMin, biayaBaru, req.params.id]
        );

        if (orderItemId) {
            await req.db.query(
                `UPDATE order_items SET design_cost = COALESCE(design_cost, 0) + ? WHERE id = ?`,
                [biayaBaru, orderItemId]
            );
        }

        await req.db.query(
            `UPDATE production_status SET status = 'approval', operator_id = ? WHERE order_item_id = ?`,
            [req.user.id, rows[0].order_item_id]
        );

        const [[updated]] = await req.db.query('SELECT * FROM design_logs WHERE id = ?', [req.params.id]);
        res.json({ message: 'Timer selesai', log: updated });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── PATCH pause ───────────
router.patch('/:id/pause', verifyToken, async (req, res) => {
    try {
        await req.db.query(
            'UPDATE design_logs SET end_time = NOW() WHERE id = ? AND technician_id = ? AND end_time IS NULL',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Timer dijeda.' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
