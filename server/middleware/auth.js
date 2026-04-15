const jwt = require('jsonwebtoken');
const { getTenantPool, masterPool } = require('../config/database');
const TenantManager = require('../utils/tenantManager');

/**
 * verifyToken: Verifies the JWT and injects the tenant-specific database pool.
 * Also enforces subscription-based access control.
 */
const verifyToken = async (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Akses Ditolak! Token tidak ditemukan.' });
    }

    try {
        const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
        const verified = jwt.verify(tokenString, process.env.JWT_SECRET);
        const { getActivePool } = require('../config/database');
        req.user = verified;

        const isStandalone = (process.env.APP_MODE || '').trim() === 'standalone';

        // 1. Standalone Mode Logic
        if (isStandalone) {
            req.db = await getActivePool(req);
            req.user.subscriptionStatus = 'active';
            if (!req.user.shopId) req.user.shopId = 1; // Ensure shopId exists for standalone
            return next();
        }

        // 2. SaaS Mode Logic
        if (req.user.shopId) {
            const [shops] = await masterPool.query(
                'SELECT db_name, subscription_status FROM shops WHERE id = ?',
                [req.user.shopId]
            );

            if (shops.length === 0) {
                return res.status(404).json({ message: 'Toko tidak ditemukan.' });
            }

            const shop = shops[0];
            req.user.subscriptionStatus = shop.subscription_status;

            const isRenewalRequest = req.path.includes('/subscriptions/renew') || req.path.includes('/settings');

            if (shop.subscription_status === 'expired' && !isRenewalRequest && req.method !== 'GET') {
                return res.status(403).json({
                    message: 'Langganan Anda telah berakhir. Silakan lakukan perpanjangan.',
                    isExpired: true
                });
            }

            if (shop.db_name) {
                req.db = getTenantPool(shop.db_name);
            }
        }

        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error.message);
        res.status(401).json({ message: 'Akses Ditolak! Token tidak valid.' });
    }
};

/**
 * requireRole: Restricts access based on user role.
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Akses Dilarang!' });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    requireRole
};
