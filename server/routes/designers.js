'use strict';
/**
 * routes/designers.js
 * CRUD Operator Desain + Penugasan + Start/Stop Desain
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// ── GET semua desainer + status (kosong/sibuk) ────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
    try {
        const [designers] = await pool.query(`
            SELECT u.id, u.name, u.username, u.is_active, u.created_at,
                   da.id AS active_assignment_id,
                   da.task_id AS active_task_id,
                   da.status AS assignment_status,
                   da.started_at,
                   da.assigned_at
            FROM users u
            LEFT JOIN design_assignments da
                ON da.designer_id = u.id
                AND da.status IN ('ditugaskan','dikerjakan')
            WHERE u.role = 'desainer'
            ORDER BY u.name
        `);

        // Group: satu desainer bisa punya maks 1 tugas aktif
        const map = {};
        designers.forEach(row => {
            if (!map[row.id]) {
                map[row.id] = {
                    id: row.id,
                    name: row.name,
                    username: row.username,
                    is_active: row.is_active,
                    created_at: row.created_at,
                    status_kerja: 'kosong',
                    active_task: null
                };
            }
            if (row.active_assignment_id) {
                map[row.id].status_kerja = 'sibuk';
                map[row.id].active_task = {
                    assignment_id: row.active_assignment_id,
                    task_id: row.active_task_id,
                    status: row.assignment_status,
                    started_at: row.started_at,
                    assigned_at: row.assigned_at
                };
            }
        });

        res.json(Object.values(map));
    } catch (e) {
        res.status(500).json({ message: 'Gagal mengambil data desainer', error: e.message });
    }
});

// ── POST tambah desainer baru ─────────────────────────────────────────────────
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { name, username, password } = req.body;
        if (!name || !username || !password) {
            return res.status(400).json({ message: 'Nama, username, dan password wajib diisi' });
        }

        // Cek username unik
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Username sudah digunakan' });
        }

        const id = 'des' + Date.now();
        const hashed = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO users (id, name, username, password, role, is_active) VALUES (?, ?, ?, ?, 'desainer', TRUE)`,
            [id, name, username, hashed]
        );

        res.status(201).json({ message: 'Operator desain berhasil ditambahkan', id });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── PUT update desainer ───────────────────────────────────────────────────────
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { name, username, is_active, password } = req.body;

        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            await pool.query(
                `UPDATE users SET name = ?, username = ?, is_active = ?, password = ? WHERE id = ? AND role = 'desainer'`,
                [name, username, is_active !== undefined ? is_active : true, hashed, req.params.id]
            );
        } else {
            await pool.query(
                `UPDATE users SET name = ?, username = ?, is_active = ? WHERE id = ? AND role = 'desainer'`,
                [name, username, is_active !== undefined ? is_active : true, req.params.id]
            );
        }
        res.json({ message: 'Data desainer berhasil diperbarui' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── DELETE (soft-delete) desainer ─────────────────────────────────────────────
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        await pool.query(`UPDATE users SET is_active = FALSE WHERE id = ? AND role = 'desainer'`, [req.params.id]);
        res.json({ message: 'Operator desain berhasil dinonaktifkan' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── GET semua penugasan (admin monitoring) ────────────────────────────────────
router.get('/assignments', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT da.*, u.name AS designer_name
            FROM design_assignments da
            JOIN users u ON da.designer_id = u.id
            ORDER BY da.created_at DESC
            LIMIT 50
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── POST tugaskan pesanan ke desainer ─────────────────────────────────────────
router.post('/assign', verifyToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { task_id, designer_id } = req.body;
        if (!task_id || !designer_id) {
            return res.status(400).json({ message: 'task_id dan designer_id wajib diisi' });
        }

        // Cek desainer tidak sedang sibuk
        const [busy] = await pool.query(
            `SELECT id FROM design_assignments WHERE designer_id = ? AND status IN ('ditugaskan','dikerjakan')`,
            [designer_id]
        );
        if (busy.length > 0) {
            return res.status(400).json({ message: 'Operator desain sedang sibuk dengan tugas lain' });
        }

        // Cek task belum ditugaskan ke orang lain
        const [existing] = await pool.query(
            `SELECT id FROM design_assignments WHERE task_id = ? AND status IN ('ditugaskan','dikerjakan')`,
            [task_id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Pesanan ini sudah ditugaskan ke operator lain' });
        }

        await pool.query(
            `INSERT INTO design_assignments (task_id, designer_id, status) VALUES (?, ?, 'ditugaskan')`,
            [task_id, designer_id]
        );

        // Log activity
        const [designer] = await pool.query('SELECT name FROM users WHERE id = ?', [designer_id]);
        await pool.query(
            `INSERT INTO activity_log (user_id, user_name, action, detail) VALUES (?, ?, ?, ?)`,
            [req.user.id, req.user.name, 'Tugaskan Desainer', `Pesanan ${task_id} ditugaskan ke ${designer[0]?.name}`]
        );

        res.status(201).json({ message: 'Pesanan berhasil ditugaskan ke operator desain' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── GET tugas milik desainer yang login ────────────────────────────────────────
router.get('/my-tasks', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT da.*
            FROM design_assignments da
            WHERE da.designer_id = ?
            ORDER BY
                CASE da.status
                    WHEN 'dikerjakan' THEN 1
                    WHEN 'ditugaskan' THEN 2
                    WHEN 'selesai' THEN 3
                    WHEN 'dibatalkan' THEN 4
                END,
                da.created_at DESC
            LIMIT 20
        `, [req.user.id]);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── PATCH mulai desain ────────────────────────────────────────────────────────
router.patch('/tasks/:id/start', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM design_assignments WHERE id = ? AND designer_id = ?`,
            [req.params.id, req.user.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Penugasan tidak ditemukan' });
        }
        if (rows[0].status !== 'ditugaskan') {
            return res.status(400).json({ message: 'Hanya tugas berstatus "ditugaskan" yang bisa dimulai' });
        }

        await pool.query(
            `UPDATE design_assignments SET status = 'dikerjakan', started_at = NOW() WHERE id = ?`,
            [req.params.id]
        );

        await pool.query(
            `INSERT INTO activity_log (user_id, user_name, action, detail) VALUES (?, ?, ?, ?)`,
            [req.user.id, req.user.name, 'Mulai Desain', `Operator mulai mengerjakan pesanan ${rows[0].task_id}`]
        );

        res.json({ message: 'Desain dimulai', started_at: new Date().toISOString() });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── PATCH selesai desain ──────────────────────────────────────────────────────
router.patch('/tasks/:id/finish', verifyToken, async (req, res) => {
    try {
        const { catatan, file_hasil_desain } = req.body;
        const [rows] = await pool.query(
            `SELECT * FROM design_assignments WHERE id = ? AND designer_id = ?`,
            [req.params.id, req.user.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Penugasan tidak ditemukan' });
        }
        if (rows[0].status !== 'dikerjakan') {
            return res.status(400).json({ message: 'Hanya tugas yang sedang dikerjakan yang bisa diselesaikan' });
        }

        await pool.query(
            `UPDATE design_assignments SET status = 'selesai', finished_at = NOW(), catatan = ?, file_hasil_desain = ? WHERE id = ?`,
            [catatan || null, file_hasil_desain || null, req.params.id]
        );

        await pool.query(
            `INSERT INTO activity_log (user_id, user_name, action, detail) VALUES (?, ?, ?, ?)`,
            [req.user.id, req.user.name, 'Selesai Desain', `Operator menyelesaikan desain pesanan ${rows[0].task_id}`]
        );

        res.json({ message: 'Desain selesai', finished_at: new Date().toISOString() });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
