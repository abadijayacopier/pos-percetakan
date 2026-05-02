const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// GET all logs (limited to 500 for performance)
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(`
            SELECT 
                id, 
                user_id, 
                user_name as username, 
                action, 
                target, 
                detail as details, 
                ip_address, 
                timestamp as created_at
            FROM activity_log
            ORDER BY id DESC
            LIMIT 500
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
