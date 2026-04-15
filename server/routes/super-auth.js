const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { masterPool } = require('../config/database');

// POST /api/super-auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const [rows] = await masterPool.query('SELECT * FROM platform_admins WHERE username = ? AND is_active = true', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const admin = rows[0];
        const validPass = await bcrypt.compare(password, admin.password);

        if (!validPass) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                id: admin.id,
                name: admin.name,
                username: admin.username,
                isPlatformAdmin: true
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                username: admin.username
            }
        });

    } catch (error) {
        console.error('Super Admin Login Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
