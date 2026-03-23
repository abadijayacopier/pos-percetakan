const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { verifyToken, verifyRole } = require('../middleware/auth');

// GET all users (Admin only recommended, but we verifyToken here)
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, username, role, is_active FROM users');
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
router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, username, password, role, isActive } = req.body;
        // Check existing
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) return res.status(400).json({ message: 'Username sudah terpakai' });

        const hashed = await bcrypt.hash(password || '123456', 10);
        const [result] = await pool.query(
            'INSERT INTO users (name, username, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
            [name, username, hashed, role, isActive]
        );
        res.json({ id: result.insertId, name, username, role, isActive });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal menambah pengguna' });
    }
});

// PUT update user
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, username, password, role, isActive } = req.body;
        const is_active = isActive ? 1 : 0;

        // Check existing username (not self)
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
        if (existing.length > 0) return res.status(400).json({ message: 'Username sudah dipakai' });

        if (password && password.trim() !== '') {
            const hashed = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE users SET name=?, username=?, password=?, role=?, is_active=? WHERE id=?',
                [name, username, hashed, role, is_active, id]
            );
        } else {
            await pool.query(
                'UPDATE users SET name=?, username=?, role=?, is_active=? WHERE id=?',
                [name, username, role, is_active, id]
            );
        }
        res.json({ message: 'Pengguna berhasil diperbarui' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal memperbarui pengguna' });
    }
});

// DELETE user
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'Pengguna berhasil dihapus' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal menghapus pengguna' });
    }
});

module.exports = router;
