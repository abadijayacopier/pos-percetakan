const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

/**
 * GET /api/health/db-status
 * Checks the database connectivity. 
 * If a token is provided with a Shop ID, it checks that specific tenant's database.
 * Otherwise, it checks the master database.
 */
router.get('/db-status', verifyToken, async (req, res) => {
    try {
        // Use injected tenant pool from selectTenant middleware, or fallback to master
        const targetPool = req.db || masterPool;

        if (!targetPool) {
            throw new Error('No database pool available.');
        }

        const connection = await targetPool.getConnection();
        connection.release();

        return res.json({
            connected: true,
            message: 'Database Connected',
            scope: req.db ? 'Tenant' : 'Master',
            shopId: req.user ? req.user.shopId : null
        });
    } catch (error) {
        console.error('DB Status Error:', error.message);
        return res.status(500).json({
            connected: false,
            message: 'Database Disconnected',
            error: error.message
        });
    }
});

module.exports = router;
