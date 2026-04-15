const TenantManager = require('../utils/tenantManager');
const { getTenantPool } = require('../config/database');

/**
 * Middleware: Select and Inject Tenant Database Pool
 */
const selectTenant = async (req, res, next) => {
    // 1. Get shopId from req.user (populated by verifyToken)
    // For registration or some public routes, shopId might come from headers
    const shopId = req.user ? req.user.shopId : req.header('X-Shop-Id');

    if (!shopId) {
        // If it's a public route that doesn't need DB or handled elsewhere
        return next();
    }

    try {
        // 2. Resolve DB Name
        const result = await TenantManager.getShopDBName(shopId);

        if (!result) {
            return res.status(404).json({ message: 'Toko tidak ditemukan atau tidak aktif.' });
        }

        // 3. Inject Tenant Pool
        req.db = getTenantPool(result.dbName);

        next();
    } catch (error) {
        console.error('Tenant Selection Error:', error.message);
        res.status(500).json({ message: 'Terjadi kesalahan saat memproses data toko.' });
    }
};

module.exports = { selectTenant };
