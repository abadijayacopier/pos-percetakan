const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

router.get('/stats', verifyToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Omset & Trx Hari Ini
        const [trxToday] = await pool.query(
            "SELECT SUM(total) as omset, COUNT(id) as trxCount FROM transactions WHERE date LIKE ?", 
            [`${today}%`]
        );

        // 2. Saldo (Cash Flow in - out)
        const [cashFlow] = await pool.query(
            "SELECT SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END) as saldo FROM cash_flow"
        );

        // 3. Pending Print
        let pendingPrintCount = 0;
        try {
           const [pendingPrint] = await pool.query(
              "SELECT COUNT(id) as count FROM print_orders WHERE status NOT IN ('selesai', 'diambil', 'batal')"
           );
           pendingPrintCount = pendingPrint[0]?.count || 0;
        } catch(e) { /* table might not exist or diff schema */ }

        // 4. Pending Service
        let pendingServiceCount = 0;
        try {
           const [pendingService] = await pool.query(
              "SELECT COUNT(id) as count FROM service_orders WHERE status NOT IN ('selesai', 'diambil', 'batal')"
           );
           pendingServiceCount = pendingService[0]?.count || 0;
        } catch(e) { }

        // 5. Low Stock
        const [lowStock] = await pool.query(
            "SELECT COUNT(id) as count FROM products WHERE stock <= IFNULL(min_stock, 0)"
        );

        // 6. Weekly Data (Last 7 days)
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const labelDay = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
            
            const [dayTrx] = await pool.query(
                "SELECT SUM(total) as sumTotal FROM transactions WHERE date LIKE ?", 
                [`${labelDay}%`]
            );
            
            weeklyData.push({
                label: dayName.toUpperCase(),
                total: dayTrx[0]?.sumTotal || 0
            });
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
            } catch(err) {}
        }

        res.json({
            omset: trxToday[0]?.omset || 0,
            trxCount: trxToday[0]?.trxCount || 0,
            saldo: cashFlow[0]?.saldo || 0,
            pendingPrintCount,
            pendingServiceCount,
            lowStockCount: lowStock[0]?.count || 0,
            weeklyData,
            activityLog
        });
        
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ message: 'Gagal memuat statistik dashboard' });
    }
});

module.exports = router;
