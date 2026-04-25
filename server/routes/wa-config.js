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
    let conn;
    try {
        conn = await req.db.getConnection();
        const configEntries = Object.entries(req.body);

        const { currentDbType } = require('../config/database');

        // Use transaction if supported
        if (conn.beginTransaction) {
            await conn.beginTransaction();
        }

        for (const [key, value] of configEntries) {
            // Convert everything to string for config_value
            const val = (value === null || value === undefined) ? null : String(value);

            if (currentDbType === 'sqlite') {
                await conn.query(
                    'INSERT INTO wa_config (config_key, config_value) VALUES (?, ?) ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value',
                    [key, val]
                );
            } else {
                await conn.query(
                    'INSERT INTO wa_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
                    [key, val, val]
                );
            }
        }

        if (conn.commit) {
            await conn.commit();
        }
        res.json({ message: 'Konfigurasi WA berhasil disimpan' });
    } catch (error) {
        console.error('Save WA Config Error:', error);
        if (conn && conn.rollback) {
            try { await conn.rollback(); } catch (e) { }
        }

        // Auto-fix for MySQL Emoji support (Incorrect string value error)
        if (error.errno === 1366 || (error.message && error.message.includes('Incorrect string value'))) {
            try {
                const fixConn = await req.db.getConnection();
                await fixConn.query('ALTER TABLE wa_config CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
                await fixConn.query('ALTER TABLE wa_config MODIFY config_value TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
                fixConn.release();
                return res.status(500).json({ 
                    message: 'Emoji terdeteksi. Sistem telah mengaktifkan dukungan emoji di database secara otomatis. Silakan klik "Simpan Perubahan" sekali lagi.',
                    error: 'Charset Updated'
                });
            } catch (fixErr) {
                console.error('Failed to auto-fix charset:', fixErr);
            }
        }

        res.status(500).json({ 
            message: 'Gagal menyimpan konfigurasi WA', 
            error: error.message 
        });
    } finally {
        if (conn && conn.release) conn.release();
    }
});

module.exports = router;
