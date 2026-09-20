const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { masterPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const { logActivity } = require('../utils/logger');

// GET all users (Admin only)
router.get('/', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT id, name, username, role, is_active FROM users');
        res.json(rows.map(r => ({
            ...r,
            isActive: Boolean(r.is_active)
        })));
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal mengambil data pengguna' });
    }
});

// POST new user
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { name, username, password, role, isActive } = req.body;

        if (!name || !username || !role || !password || String(password).length < 8) {
            return res.status(400).json({ message: 'Nama, username, role, dan password minimal 8 karakter wajib diisi' });
        }

        const [existing] = await req.db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) return res.status(400).json({ message: 'Username sudah terpakai' });

        const hashed = await bcrypt.hash(password, 10);

        // Use req.db to insert into tenant's database
        const [result] = await req.db.query(
            'INSERT INTO users (name, username, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
            [name, username, hashed, role, isActive]
        );

        // Log activity
        await logActivity(req.user.id, 'CREATE_USER', name, `Tambah user baru: ${username} (${role})`, req.ip, req.user.name);

        res.json({ id: result.insertId, name, username, role, isActive });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal menambah pengguna' });
    }
});

// PUT update user
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, username, password, role, isActive } = req.body;
        const is_active = isActive ? 1 : 0;

        const [existing] = await req.db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
        if (existing.length > 0) return res.status(400).json({ message: 'Username sudah dipakai' });

        if (password && password.trim() !== '') {
            const hashed = await bcrypt.hash(password, 10);
            await req.db.query(
                'UPDATE users SET name=?, username=?, password=?, role=?, is_active=? WHERE id=?',
                [name, username, hashed, role, is_active, id]
            );
        } else {
            await req.db.query(
                'UPDATE users SET name=?, username=?, role=?, is_active=? WHERE id=?',
                [name, username, role, is_active, id]
            );
        }

        // Log activity
        await logActivity(req.user.id, 'UPDATE_USER', name, `Update data user: ${username}`, req.ip, req.user.name);

        res.json({ message: 'Pengguna berhasil diperbarui' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal memperbarui pengguna' });
    }
});

// DELETE user
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        if (String(id) === String(req.user.id)) return res.status(400).json({ message: 'Admin tidak dapat menghapus akun sendiri' });
        const [adminCount] = await req.db.query("SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin' AND is_active = 1");
        const [targetUser] = await req.db.query('SELECT role, is_active FROM users WHERE id = ?', [id]);
        if (targetUser.length && targetUser[0].role === 'admin' && targetUser[0].is_active && Number(adminCount[0].cnt) <= 1) {
            return res.status(400).json({ message: 'Tidak dapat menghapus admin aktif terakhir' });
        }
        const [userArr] = await req.db.query('SELECT name, username FROM users WHERE id = ?', [id]);
        const userName = userArr.length > 0 ? userArr[0].name : 'Unknown';

        await req.db.query('DELETE FROM users WHERE id = ?', [id]);

        // Log activity
        await logActivity(req.user.id, 'DELETE_USER', userName, `Hapus user ID: ${id}`, req.ip, req.user.name);

        res.json({ message: 'Pengguna berhasil dihapus' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal menghapus pengguna' });
    }
});

module.exports = router;
