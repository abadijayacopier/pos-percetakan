const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// GET all logs (limited to 500 for performance)
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(`
            SELECT al.id, al.user_id, al.user_name, al.action, al.detail, al.timestamp
            FROM activity_log al
            ORDER BY al.id DESC
            LIMIT 500
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
