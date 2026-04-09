const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

router.get('/stats', verifyToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Omset Hari Ini (Dari Cash Flow IN)
        const [cashToday] = await pool.query(
            "SELECT SUM(amount) as omset FROM cash_flow WHERE type = 'in' AND date LIKE ?",
            [`${today}%`]
        );

        // Omset Trx count tetap dari transactions untuk volume
        const [trxToday] = await pool.query(
            "SELECT COUNT(id) as trxCount FROM transactions WHERE date LIKE ?",
            [`${today}%`]
        );

        // 2. Saldo (Total Cash Flow in - out)
        const [cashFlow] = await pool.query(
            "SELECT SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END) as saldo FROM cash_flow"
        );

        // 3. Pending Print (Dari dp_tasks)
        const [pendingPrint] = await pool.query(
            "SELECT COUNT(id) as count FROM dp_tasks WHERE status NOT IN ('diambil', 'batal')"
        );

        // 4. Pending Service (Dari service)
        const [pendingService] = await pool.query(
            "SELECT COUNT(id) as count FROM service WHERE status NOT IN ('diambil', 'batal', 'selesai')"
        );

        // 5. Low Stock
        const [lowStock] = await pool.query(
            "SELECT COUNT(id) as count FROM products WHERE stock <= IFNULL(min_stock, 0)"
        );

        // 6. Weekly Data (Last 7 days dari Cash Flow IN)
        const weeklyData = [];
        const monthlyData = [];

        // Single query for last 30 days of data to be efficient
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];

        const [periodTrx] = await pool.query(
            "SELECT DATE(date) as date, SUM(amount) as total FROM cash_flow WHERE type = 'in' AND date >= ? GROUP BY DATE(date) ORDER BY DATE(date)",
            [`${startDate} 00:00:00`]
        );

        // Map data for easy lookup
        const dataMap = {};
        periodTrx.forEach(row => {
            const dateStr = new Date(row.date).toISOString().split('T')[0];
            dataMap[dateStr] = parseFloat(row.total || 0);
        });

        // Generate full arrays with zero-filled gaps
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const dataPoint = {
                label: i < 7 ? d.toLocaleDateString('id-ID', { weekday: 'short' }).toUpperCase() : `${d.getDate()}/${d.getMonth() + 1}`,
                total: dataMap[dateStr] || 0,
                fullDate: dateStr
            };

            monthlyData.push(dataPoint);
            if (i < 7) {
                weeklyData.push(dataPoint);
            }
        }

        // 7. Activity Log (Last 10)
        let activityLog = [];
        try {
            const [logs] = await pool.query("SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 10");
            activityLog = logs;
        } catch (e) {
            try {
                const [logs2] = await pool.query("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10");
                activityLog = logs2;
            } catch (err) { }
        }

        res.json({
            omset: parseFloat(cashToday[0]?.omset || 0),
            trxCount: trxToday[0]?.trxCount || 0,
            saldo: parseFloat(cashFlow[0]?.saldo || 0),
            pendingPrintCount: pendingPrint[0]?.count || 0,
            pendingServiceCount: pendingService[0]?.count || 0,
            lowStockCount: lowStock[0]?.count || 0,
            weeklyData,
            monthlyData,
            activityLog
        });

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ message: 'Gagal memuat statistik dashboard' });
    }
});

module.exports = router;
