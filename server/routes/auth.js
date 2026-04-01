const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username dan password harus diisi!' });
        }

        const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND is_active = true', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Username tidak ditemukan atau dinonaktifkan.' });
        }

        const user = rows[0];

        // Verify password via bcrypt
        const validPass = await bcrypt.compare(password, user.password);

        if (!validPass) {
            return res.status(401).json({ message: 'Password salah!' });
        }

        // Buat JWT Token
        const token = jwt.sign(
            { id: user.id, name: user.name, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Activity Log
        await pool.query('INSERT INTO activity_log (user_id, user_name, action, detail) VALUES (?, ?, ?, ?)',
            [user.id, user.name, 'login', `Login sebagai ${user.role}`]);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

module.exports = router;
