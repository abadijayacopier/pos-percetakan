const express = require('express');
const router = express.Router();
const { masterPool, getTenantPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const TenantManager = require('../utils/tenantManager');
const LicenseManager = require('../utils/licenseManager');

// GET Semua Settings (Authenticated)
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT `key`, `value` FROM settings');
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal memuat pengaturan' });
    }
});

// GET Public Settings (Landing Page - SaaS Aware)
router.get('/public', async (req, res) => {
    try {
        const shopId = req.query.shopId || req.header('X-Shop-Id');

        const isStandalone = (process.env.APP_MODE || '').trim() === 'standalone';
        const isSqlite = (process.env.DB_TYPE || '').trim() === 'sqlite';

        // Standalone Mode: Bypass TenantManager
        if (isStandalone) {
            const { getActivePool } = require('../config/database');
            const db = await getActivePool();
            const query = "SELECT `key`, `value` FROM settings WHERE `key` LIKE 'landing_%' OR `key` LIKE 'store_%' OR `key` IN ('print_prices', 'binding_prices', 'tarif_desain_per_jam')";

            let rows;
            if (isSqlite && typeof db.all === 'function') {
                rows = await db.all(query);
            } else if (typeof db.query === 'function') {
                const [dbRows] = await db.query(query);
                rows = dbRows;
            } else {
                throw new Error('Unsupported database object type for mode: ' + (isSqlite ? 'sqlite' : 'mysql'));
            }
            return res.json(rows);
        }

        if (!shopId) return res.status(400).json({ message: 'Shop ID diperlukan (SaaS Mode).' });

        const result = await TenantManager.getShopDBName(shopId);
        if (!result) return res.status(404).json({ message: 'Toko tidak ditemukan.' });

        const tenantDb = getTenantPool(result.dbName);
        const [rows] = await tenantDb.query("SELECT `key`, `value` FROM settings WHERE `key` LIKE 'landing_%' OR `key` LIKE 'store_%' OR `key` IN ('print_prices', 'binding_prices', 'tarif_desain_per_jam')");
        res.json(rows);
    } catch (e) {
        console.error('Settings Public Error:', e);
        res.status(500).json({ message: 'Gagal memuat fitur publik: ' + e.message });
    }
});

// POST Simpan Multiple Settings
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const settings = req.body;
        if (!Array.isArray(settings)) return res.status(400).json({ message: 'Format data salah' });

        const connection = await req.db.getConnection();
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

            // Manual Activity Log to Tenant DB
            await connection.query(
                'INSERT INTO activity_log (user_id, user_name, action, target, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
                [req.user.id, req.user.name, 'UPDATE_SETTINGS', 'System', `Update ${settings.length} pengaturan sistem`, req.ip || null]
            );

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

// GET License Status (Dual-Mode Aware)
router.get('/license', verifyToken, async (req, res) => {
    try {
        // --- 1. STANDALONE (OFFLINE) MODE ---
        if (process.env.APP_MODE === 'standalone') {
            const [rows] = await req.db.query('SELECT `value` FROM settings WHERE `key` = ?', ['license_key']);
            const manager = new LicenseManager();
            const result = manager.verifyLicense(rows[0]?.value || '');

            return res.json({
                activated: result.isValid,
                message: result.message || 'Status Lisensi Offline',
                expiryDate: result.expiryDate,
                clientName: result.clientName,
                hardwareId: LicenseManager.getHardwareId()
            });
        }

        // --- 2. SAAS (ONLINE) MODE ---
        const [shops] = await masterPool.query(
            'SELECT shop_name, subscription_status, expiry_date, subscription_plan FROM shops WHERE id = ?',
            [req.user.shopId]
        );

        if (shops.length === 0) {
            return res.json({ activated: false, message: 'Shop not found' });
        }

        const shop = shops[0];
        res.json({
            activated: shop.subscription_status === 'active' || shop.subscription_status === 'trial',
            status: shop.subscription_status,
            expiryDate: shop.expiry_date,
            plan: shop.subscription_plan,
            clientName: shop.shop_name,
            hardwareId: 'SaaS-Cloud-ID',
            isSaaS: true
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal memuat info lisensi' });
    }
});

/**
 * POST /api/settings/license
 * Activate/Save license key
 */
router.post('/license', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { licenseKey } = req.body;
        if (!licenseKey) return res.status(400).json({ message: 'Kode lisensi diperlukan' });

        if (process.env.APP_MODE === 'standalone') {
            const manager = new LicenseManager();
            const result = manager.verifyLicense(licenseKey);

            if (!result.isValid) {
                return res.status(400).json({ message: result.message || 'Lisensi tidak valid' });
            }

            // Save to DB
            const [existing] = await req.db.query('SELECT `key` FROM settings WHERE `key` = ?', ['license_key']);
            if (existing.length > 0) {
                await req.db.query('UPDATE settings SET `value` = ? WHERE `key` = ?', [licenseKey, 'license_key']);
            } else {
                await req.db.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', ['license_key', licenseKey]);
            }

            // Log action
            await req.db.query(
                'INSERT INTO activity_log (user_id, user_name, action, target, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
                [req.user.id, req.user.name, 'ACTIVATE_LICENSE', 'License', `Aktivasi produk untuk ${result.clientName}`, req.ip || null]
            );

            return res.json({
                success: true,
                message: 'Aktivasi berhasil',
                clientName: result.clientName
            });
        }

        res.status(400).json({ message: 'Mode SaaS tidak menggunakan endpoint ini.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal memproses aktivasi: ' + e.message });
    }
});

/**
 * DELETE /api/settings/license
 * Reset/Remove license key
 */
router.delete('/license', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        if (process.env.APP_MODE === 'standalone') {
            await req.db.query('DELETE FROM settings WHERE `key` = ?', ['license_key']);

            // Log action
            await req.db.query(
                'INSERT INTO activity_log (user_id, user_name, action, target, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
                [req.user.id, req.user.name, 'RESET_LICENSE', 'License', 'Menghapus lisensi offline (Ganti PC)', req.ip || null]
            );

            return res.json({ success: true, message: 'Lisensi offline berhasil direset.' });
        }

        // SaaS Reset logic: Usually just an alert that it's managed by Cloud
        res.json({
            success: true,
            message: 'Mode SaaS: Lisensi dikelola secara terpusat oleh sistem cloud.'
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal mereset lisensi: ' + e.message });
    }
});

// GET Activity Logs (Tenant Specific)
router.get('/logs', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(`
            SELECT 
                al.id, 
                al.user_id, 
                al.user_name, 
                al.action, 
                al.detail as details, 
                al.target,
                al.ip_address,
                al.timestamp as created_at
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

module.exports = router;
