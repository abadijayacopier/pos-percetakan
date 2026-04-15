'use strict';
const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/wa-config
router.get('/', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT config_key, config_value FROM wa_config');
        const config = rows.reduce((acc, r) => { acc[r.config_key] = r.config_value; return acc; }, {});
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil konfigurasi WA' });
    }
});

// PUT /api/wa-config
router.put('/', verifyToken, requireRole(['admin']), async (req, res) => {
    const conn = await req.db.getConnection();
    try {
        await conn.beginTransaction();
        const configEntries = Object.entries(req.body);

        for (const [key, value] of configEntries) {
            await conn.query(
                'INSERT INTO wa_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
                [key, value, value]
            );
        }

        await conn.commit();
        res.json({ message: 'Konfigurasi WA berhasil disimpan' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: 'Gagal menyimpan konfigurasi WA' });
    } finally {
        conn.release();
    }
});

module.exports = router;
