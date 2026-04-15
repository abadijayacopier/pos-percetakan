const { masterPool, getTenantPool } = require('../config/database');
const jwt = require('jsonwebtoken');
const LicenseManager = require('../utils/licenseManager');

/**
 * licenseGuard: Dual-Mode guard for SaaS (Cloud) or Standalone (Offline)
 */
const licenseGuard = async (req, res, next) => {
    const exemptPaths = [
        '/api/health',
        '/api/auth/login',
        '/api/super-auth',
        '/api/super-admin',
        '/api/settings/public',
        '/api/settings/license'
    ];

    if (exemptPaths.some(p => req.path.startsWith(p))) {
        return next();
    }

    try {
        // --- 1. STANDALONE (OFFLINE) MODE ---
        if (process.env.APP_MODE === 'standalone') {
            const { getActivePool } = require('../config/database');
            const db = await getActivePool();

            let rows;
            if (process.env.DB_TYPE === 'sqlite') {
                rows = await db.all('SELECT `value` FROM settings WHERE `key` = ?', ['license_key']);
            } else {
                const [dbRows] = await db.query('SELECT `value` FROM settings WHERE `key` = ?', ['license_key']);
                rows = dbRows;
            }

            if (!rows || rows.length === 0 || !rows[0].value) {
                return res.status(403).json({
                    error: 'LICENSE_REQUIRED',
                    message: 'Aplikasi belum diaktivasi (Offline Mode). Silakan hubungi pengembang. Developer: Supriyanto WA 085655620979'
                });
            }

            const manager = new LicenseManager();
            const result = manager.verifyLicense(rows[0].value);

            if (!result.isValid) {
                return res.status(403).json({
                    error: 'LICENSE_INVALID',
                    message: result.message
                });
            }

            req.license = result;
            return next();
        }

        // --- 2. SAAS (ONLINE) MODE ---
        const authHeader = req.headers['authorization'];
        const shopIdHeader = req.headers['x-shop-id'];
        let shopId = shopIdHeader;
        let userHwid = 'GLOBAL';

        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
                if (decoded && decoded.shopId) shopId = decoded.shopId;
                if (decoded && decoded.hwid) userHwid = decoded.hwid;
            } catch (e) { }
        }

        if (!shopId) return next();

        const [shops] = await masterPool.query(
            'SELECT status, subscription_status, hwid_lock, license_expires_at, trial_ends_at FROM shops WHERE id = ?',
            [shopId]
        );

        if (shops.length === 0) return next();
        const shop = shops[0];

        // A. Pengecekan Status Toko
        if (shop.status === 'suspended') {
            return res.status(403).json({ error: 'SHOP_SUSPENDED', message: 'Toko Anda telah dinonaktifkan oleh administrator pusat.' });
        }

        // B. Pengecekan Hardware Lock (Hanya untuk Admin/Owner)
        if (shop.hwid_lock && userHwid !== 'GLOBAL' && shop.hwid_lock !== userHwid) {
            return res.status(403).json({
                error: 'HARDWARE_MISMATCH',
                message: 'Akses SaaS ditolak: Akun ini terkunci pada perangkat lain.'
            });
        }

        // C. Pengecekan Masa Aktif
        const now = new Date();
        const isTrial = shop.subscription_status === 'trial';
        const isExpired = shop.subscription_status === 'expired';

        if (isTrial && shop.trial_ends_at && new Date(shop.trial_ends_at) < now) {
            return res.status(403).json({ error: 'TRIAL_EXPIRED', message: 'Masa percobaan (Trial) Anda telah berakhir. Silakan hubungi d: 085655620979.' });
        }

        if (isExpired || (shop.license_expires_at && new Date(shop.license_expires_at) < now)) {
            return res.status(403).json({ error: 'SUBSCRIPTION_EXPIRED', message: 'Masa aktif langganan toko ini telah habis. Silakan lakukan perpanjangan.' });
        }

        next();
    } catch (e) {
        console.error('License Guard Error:', e);
        next();
    }
};

module.exports = licenseGuard;
