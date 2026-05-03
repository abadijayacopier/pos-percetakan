const { getActivePool } = require('../config/database');

/**
 * Middleware untuk menempelkan instance database (pool/sqlite) ke setiap request.
 * Memungkinkan rute untuk menggunakan req.db.query() secara universal.
 */
const dbMiddleware = async (req, res, next) => {
    try {
        req.db = await getActivePool(req);
        next();
    } catch (error) {
        console.error('❌ Database Middleware Error:', error.message);
        res.status(500).json({ 
            message: 'Internal Server Error: Database Connection Failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = dbMiddleware;
