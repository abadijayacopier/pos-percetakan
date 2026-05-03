const { masterPool, getTenantPool, currentMode, currentDbType } = require('../config/database');
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
        if (currentMode === 'standalone') {
            const { getActivePool, currentDbType } = require('../config/database');
            const db = await getActivePool();

            let rows;
            if (currentDbType === 'sqlite') {
                rows = await db.all('SELECT `value` FROM settings WHERE `key` = ?', ['license_key']);
            } else {
                const [dbRows] = await db.query('SELECT `value` FROM settings WHERE `key` = ?', ['license_key']);
                rows = dbRows;
            }

            // --- Cek Masa Trial 3 Hari ---
            let installDateRows;
            if (currentDbType === 'sqlite') {
                installDateRows = await db.all('SELECT `value` FROM settings WHERE `key` = ?', ['install_date']);
            } else {
                const [idRows] = await db.query('SELECT `value` FROM settings WHERE `key` = ?', ['install_date']);
                installDateRows = idRows;
            }

            let installDate = installDateRows && installDateRows.length > 0 ? new Date(installDateRows[0].value) : null;
            if (!installDate) {
                // Set pertama kali diinstal
                installDate = new Date();
                if (currentDbType === 'sqlite') {
                    await db.run('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', ['install_date', installDate.toISOString()]);
                } else {
                    await db.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', ['install_date', installDate.toISOString()]);
                }
            }

            const msPerDay = 1000 * 60 * 60 * 24;
            const daysSinceInstall = (new Date() - installDate) / msPerDay;
            const isTrial = daysSinceInstall <= 3;
            const trialDaysLeft = Math.max(0, Math.ceil(3 - daysSinceInstall));

            if (!rows || rows.length === 0 || !rows[0].value) {
                if (isTrial) {
                    req.license = { isValid: true, isTrial: true, trialDaysLeft, message: `Mode Trial Aktif (${trialDaysLeft} Hari Tersisa)` };
                    return next();
                }

                return res.status(403).json({
                    error: 'LICENSE_REQUIRED',
                    message: 'Masa trial 3 hari telah habis. Aplikasi belum diaktivasi (Offline Mode). Silakan hubungi pengembang. Developer: Supriyanto WA 085655620979',
                    trialExpired: true
                });
            }

            const manager = new LicenseManager();
            const result = manager.verifyLicense(rows[0].value);

            if (!result.isValid) {
                if (isTrial) {
                    req.license = { isValid: true, isTrial: true, trialDaysLeft, message: `Lisensi Invalid. Mode Trial Aktif (${trialDaysLeft} Hari Tersisa)` };
                    return next();
                }

                return res.status(403).json({
                    error: 'LICENSE_INVALID',
                    message: result.message + '. Masa trial juga telah habis.',
                    trialExpired: true
                });
            }

            req.license = { ...result, isTrial: false };
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
