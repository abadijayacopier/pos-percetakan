const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const jwt = require('jsonwebtoken');

// Middleware specifically for Platform Admins
const verifyPlatformAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Missing token' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err || !decoded.isPlatformAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        req.admin = decoded;
        next();
    });
};

// GET /api/super-admin/shops - List all shops
router.get('/shops', verifyPlatformAdmin, async (req, res) => {
    try {
        const [rows] = await masterPool.query('SELECT * FROM shops ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shops' });
    }
});

// POST /api/super-admin/shops/:id/suspend - Suspend shop
router.post('/shops/:id/suspend', verifyPlatformAdmin, async (req, res) => {
    try {
        await masterPool.query('UPDATE shops SET subscription_status = ? WHERE id = ?', ['expired', req.params.id]);
        res.json({ message: 'Shop suspended successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error suspending shop' });
    }
});

// POST /api/super-admin/shops/:id/activate - Manual Activate/Extend
router.post('/shops/:id/activate', verifyPlatformAdmin, async (req, res) => {
    try {
        const { plan, durationMonths } = req.body;
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + (durationMonths || 1));

        await masterPool.query(
            'UPDATE shops SET subscription_status = ?, subscription_plan = ?, expiry_date = ? WHERE id = ?',
            ['active', plan || 'basic', expiryDate, req.params.id]
        );

        res.json({ message: 'Shop activated/extended successfully', expiryDate });
    } catch (error) {
        res.status(500).json({ message: 'Error activating shop' });
    }
});

// GET /api/super-admin/stats - Platform Overview
router.get('/stats', verifyPlatformAdmin, async (req, res) => {
    try {
        const [totalShops] = await masterPool.query('SELECT COUNT(*) as count FROM shops');
        const [activeShops] = await masterPool.query('SELECT COUNT(*) as count FROM shops WHERE subscription_status = "active"');
        const [pendingPayments] = await masterPool.query('SELECT COUNT(*) as count FROM subscription_payments WHERE status = "pending"');

        res.json({
            totalShops: totalShops[0].count,
            activeShops: activeShops[0].count,
            pendingPayments: pendingPayments[0].count
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

module.exports = router;
