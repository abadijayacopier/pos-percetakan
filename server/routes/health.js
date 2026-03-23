const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/db-status', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        connection.release();
        return res.json({ connected: true, message: 'Database Connected' });
    } catch (error) {
        console.error('DB Status Error:', error.message);
        return res.status(500).json({ connected: false, message: 'Database Disconnected', error: error.message });
    }
});

module.exports = router;
