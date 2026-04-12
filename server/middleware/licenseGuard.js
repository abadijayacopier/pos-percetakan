const LicenseManager = require('../utils/licenseManager');
const { pool } = require('../config/database');

const licenseGuard = async (req, res, next) => {
    // Abaikan check untuk health check atau login tertentu jika perlu
    // Abaikan check untuk health check, login, dan status lisensi
    const exemptPaths = [
        '/api/health',
        '/api/auth/login',
        '/api/settings/license'
    ];

    if (exemptPaths.some(p => req.path.startsWith(p) || req.originalUrl.startsWith(p))) {
        return next();
    }

    try {
        const [rows] = await pool.query('SELECT `value` FROM settings WHERE `key` = ?', ['license_key']);

        if (rows.length === 0 || !rows[0].value) {
            return res.status(403).json({
                error: 'LICENSE_REQUIRED',
                message: 'Aplikasi belum diaktivasi. Silakan hubungi pengembang SUPRIYANTO 085655620979'
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

        // Simpan info lisensi di request jika diperlukan
        req.license = result;
        next();
    } catch (e) {
        console.error('License Check Error:', e);
        next(); // Lanjut jika ada error DB agar tidak mematikan app total saat debug
    }
};

module.exports = licenseGuard;
