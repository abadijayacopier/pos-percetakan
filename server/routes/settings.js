const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const LicenseManager = require('../utils/licenseManager');
const { verifyToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'temp/' });
const fs = require('fs');

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
        const [rows] = await pool.query("SELECT `key`, `value` FROM settings WHERE `key` LIKE 'landing_%' OR `key` LIKE 'store_%' OR `key` IN ('print_prices', 'binding_prices', 'tarif_desain_per_jam')");
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal memuat fitur publik' });
    }
});

// POST Simpan Multiple Settings
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
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

            // Activity Log
            const { logActivity } = require('../utils/logger');
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            await logActivity(req.user.id, 'UPDATE_SETTINGS', 'settings', `Update ${settings.length} pengaturan sistem`, ip);

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
        const [rows] = await pool.query(`
            SELECT al.id, al.user_id, al.user_name, al.action, al.detail
            FROM activity_log al
            ORDER BY al.id DESC
            LIMIT 200
        `);
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
router.post('/master', verifyToken, requireRole(['admin']), async (req, res) => {
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

// GET Backup Data (SQL)
router.get('/backup', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const TABLES = [
            'settings', 'users', 'customers', 'products', 'suppliers',
            'orders', 'order_items', 'production_status', 'transactions',
            'transaction_details', 'fotocopy_prices', 'stock_movements',
            'activity_log', 'design_logs', 'purchases', 'service_orders',
            'service_spareparts', 'cash_flow', 'categories', 'dp_tasks',
            'materials', 'offset_orders', 'offset_products', 'pricing_logs',
            'pricing_rules', 'print_orders', 'product_options', 'purchase_items',
            'spk', 'spk_handovers', 'spk_logs', 'spk_payments', 'tiered_pricing_rules',
            'wa_config'
        ];

        let sqlDump = `-- POS Abadi Jaya System Backup\n`;
        sqlDump += `-- Generated on ${new Date().toISOString()}\n\n`;
        sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

        for (const table of TABLES) {
            try {
                const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
                if (rows.length > 0) {
                    sqlDump += `-- Dumping data for table \`${table}\`\n`;
                    const columns = Object.keys(rows[0]);

                    // Break inserts into chunks of 100 rows to avoid huge single statements
                    const chunkSize = 100;
                    for (let i = 0; i < rows.length; i += chunkSize) {
                        const chunk = rows.slice(i, i + chunkSize);
                        sqlDump += `INSERT INTO \`${table}\` (\`${columns.join('`,`')}\`) VALUES\n`;

                        const valStrings = chunk.map(row => {
                            const values = columns.map(col => {
                                const val = row[col];
                                if (val === null) return 'NULL';
                                if (typeof val === 'number') return val;
                                // Handle Date objects correctly for MySQL strings
                                if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                                // Escape single quotes for strings
                                return `'${String(val).replace(/'/g, "''")}'`;
                            });
                            return `(${values.join(',')})`;
                        });

                        sqlDump += valStrings.join(',\n') + ';\n';
                    }
                    sqlDump += `\n`;
                }
            } catch (err) {
                console.warn(`Table ${table} not found or error, skipping dump...`);
            }
        }

        sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;

        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename=pos_backup_${new Date().toISOString().slice(0, 10)}.sql`);
        res.send(sqlDump);

        // Log this action
        const { logActivity } = require('../utils/logger');
        await logActivity(req.user.id, 'BACKUP_DATA', 'system', 'Eksport data ke file SQL', req.ip);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal melakukan backup' });
    }
});


// POST Restore Data (SQL/JSON)
router.post('/restore', verifyToken, requireRole(['admin']), upload.single('backup'), async (req, res) => {
    let connection;
    try {
        if (!req.file) return res.status(400).json({ message: 'File backup tidak ditemukan' });

        const rawContent = fs.readFileSync(req.file.path, 'utf8');
        const isSql = req.file.originalname.endsWith('.sql') || rawContent.trim().startsWith('--') || rawContent.trim().startsWith('SET ');

        connection = await pool.getConnection();

        if (isSql) {
            // Restore via SQL Script (New Format)
            // MySQL2 with multipleStatements can execute the whole chunk
            await connection.query(rawContent);
        } else {
            // Restore via JSON (Legacy Format)
            try {
                const data = JSON.parse(rawContent);
                await connection.beginTransaction();
                await connection.query('SET FOREIGN_KEY_CHECKS = 0');

                const TABLES = Object.keys(data);
                for (const table of TABLES) {
                    const rows = data[table];
                    if (!Array.isArray(rows)) continue;
                    await connection.query(`DELETE FROM \`${table}\``);
                    if (rows.length > 0) {
                        const columns = Object.keys(rows[0]);
                        const values = rows.map(r => columns.map(c => r[c]));
                        const query = `INSERT INTO \`${table}\` (\`${columns.join('`,`')}\`) VALUES ?`;
                        await connection.query(query, [values]);
                    }
                }
                await connection.query('SET FOREIGN_KEY_CHECKS = 1');
                await connection.commit();
            } catch (jsonErr) {
                throw new Error('Format file tidak dikenali atau JSON tidak valid: ' + jsonErr.message);
            }
        }

        fs.unlinkSync(req.file.path); // Cleanup temp file

        // Log this action
        const { logActivity } = require('../utils/logger');
        await logActivity(req.user.id, 'RESTORE_DATA', 'system', `Data dipulihkan dari file ${isSql ? 'SQL' : 'JSON'}`, req.ip);

        res.json({ message: 'Data berhasil dipulihkan' });
    } catch (e) {
        if (connection && !isSql) await connection.rollback();
        console.error('Restore failed:', e);
        res.status(500).json({ message: 'Gagal memulihkan data: ' + e.message });
    } finally {
        if (connection) connection.release();
    }
});


// GET Status Lisensi
router.get('/license', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT `value` FROM settings WHERE `key` = ?', ['license_key']);
        if (rows.length === 0 || !rows[0].value) {
            return res.json({
                activated: false,
                hardwareId: LicenseManager.getHardwareId()
            });
        }

        const manager = new LicenseManager();
        const result = manager.verifyLicense(rows[0].value);

        console.log('[LICENSE_DEBUG] Raw Result:', result); // Penting untuk cek isi objek

        res.json({
            activated: result.isValid,
            clientName: result.clientName || result.client || '',
            expiryDate: result.expiryDate || result.expiry || '',
            features: result.features || {},
            hardwareId: LicenseManager.getHardwareId(),
            message: result.message
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal memuat status lisensi' });
    }
});

// POST Aktivasi Lisensi
router.post('/license', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { licenseKey } = req.body;
        if (!licenseKey) return res.status(400).json({ message: 'Kode lisensi harus diisi' });

        const manager = new LicenseManager();
        const result = manager.verifyLicense(licenseKey);

        if (!result.isValid) {
            return res.status(400).json({ message: result.message });
        }

        // Simpan ke database
        const [existing] = await pool.query('SELECT `key` FROM settings WHERE `key` = ?', ['license_key']);
        if (existing.length > 0) {
            await pool.query('UPDATE settings SET `value` = ? WHERE `key` = ?', [licenseKey, 'license_key']);
        } else {
            await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', ['license_key', licenseKey]);
        }

        // Log Aktivitas
        const { logActivity } = require('../utils/logger');
        await logActivity(req.user.id, 'ACTIVATE_LICENSE', 'license', `Aplikasi diaktivasi untuk ${result.clientName}`, req.ip);

        res.json({
            message: 'Aktivasi Berhasil!',
            clientName: result.clientName,
            expiryDate: result.expiryDate,
            features: result.features,
            hardwareId: result.hardwareId
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal melakukan aktivasi' });
    }
});

// DELETE Reset Lisensi (Misal ganti PC)
router.delete('/license', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        await pool.query('DELETE FROM settings WHERE `key` = ?', ['license_key']);

        // Log Aktivitas
        const { logActivity } = require('../utils/logger');
        await logActivity(req.user.id, 'RESET_LICENSE', 'license', 'Lisensi aplikasi telah dihapus/direset', req.ip);

        res.json({ message: 'Lisensi berhasil direset. Aplikasi kembali ke mode belum aktivasi.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal mereset lisensi' });
    }
});

module.exports = router;
