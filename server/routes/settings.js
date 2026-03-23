const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// GET Semua Settings
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT `key`, `value` FROM settings');
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal memuat pengaturan' });
    }
});

// GET Public Settings (Hanya untuk Landing Page)
router.get('/public', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT `key`, `value` FROM settings WHERE `key` LIKE 'landing_%' OR `key` LIKE 'store_%' OR `key` IN ('print_prices', 'binding_prices')");
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal memuat fitur publik' });
    }
});

// POST Simpan Multiple Settings
router.post('/', verifyToken, async (req, res) => {
    try {
        const settings = req.body; // expects array [{key, value}]
        if (!Array.isArray(settings)) return res.status(400).json({ message: 'Format data salah' });

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            for (const s of settings) {
                const [existing] = await connection.query('SELECT `key` FROM settings WHERE `key` = ?', [s.key]);
                if (existing.length > 0) {
                    await connection.query('UPDATE settings SET `value` = ? WHERE `key` = ?', [s.value, s.key]);
                } else {
                    await connection.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', [s.key, s.value]);
                }
            }
            await connection.commit();
            res.json({ message: 'Pengaturan berhasil disimpan' });
        } catch (dbErr) {
            await connection.rollback();
            throw dbErr;
        } finally {
            connection.release();
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal menyimpan pengaturan' });
    }
});

// GET Activity Logs
router.get('/logs', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 200');
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal memuat log' });
    }
});

// GET Master Data for frontend (Kategori & Satuan)
router.get('/master', verifyToken, async (req, res) => {
    try {
        const [kategoriRows] = await pool.query('SELECT value FROM settings WHERE `key` = ?', ['kategori_bahan']);
        const [satuanRows] = await pool.query('SELECT value FROM settings WHERE `key` = ?', ['satuan_unit']);

        let kategori_bahan = ["digital", "offset", "atk", "finishing"];
        let satuan_unit = ["lembar", "roll", "m2", "pcs", "box", "rim", "kg", "liter", "set"];

        if (kategoriRows.length > 0) {
            try {
                kategori_bahan = JSON.parse(kategoriRows[0].value);
            } catch (e) {
                console.error("Error parsing kategori_bahan:", e);
            }
        } else {
            // Seed defaults
            await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', ['kategori_bahan', JSON.stringify(kategori_bahan)]);
        }

        if (satuanRows.length > 0) {
            try {
                satuan_unit = JSON.parse(satuanRows[0].value);
            } catch (e) {
                console.error("Error parsing satuan_unit:", e);
            }
        } else {
            // Seed defaults
            await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', ['satuan_unit', JSON.stringify(satuan_unit)]);
        }

        res.json({
            kategori_bahan,
            satuan_unit
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal mengambil master data' });
    }
});

// POST Add new Master Data item
router.post('/master', verifyToken, async (req, res) => {
    try {
        const { type, value } = req.body; // type = 'kategori_bahan' or 'satuan_unit', value = 'string'

        if (!type || !value) {
            return res.status(400).json({ message: 'Type dan Value harus diisi' });
        }

        if (type !== 'kategori_bahan' && type !== 'satuan_unit') {
            return res.status(400).json({ message: 'Type tidak valid' });
        }

        const [rows] = await pool.query('SELECT value FROM settings WHERE `key` = ?', [type]);
        let currentArray = [];

        if (rows.length > 0) {
            try {
                currentArray = JSON.parse(rows[0].value);
            } catch (e) {
                currentArray = [];
            }
        }

        // Avoid duplicates case-insensitively
        const isDuplicate = currentArray.some(item => item.toLowerCase() === value.toLowerCase());
        if (!isDuplicate) {
            currentArray.push(value);

            if (rows.length > 0) {
                await pool.query('UPDATE settings SET `value` = ? WHERE `key` = ?', [JSON.stringify(currentArray), type]);
            } else {
                await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', [type, JSON.stringify(currentArray)]);
            }
        }

        res.json({ message: 'Berhasil menambahkan master data', data: currentArray });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal menambahkan master data' });
    }
});

module.exports = router;
