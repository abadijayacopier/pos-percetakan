const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// 1. GET Semua Data Arus Kas (Buku Kas)
router.get('/', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cash_flow ORDER BY date DESC, created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data arus kas' });
    }
});

// 2. GET Statistik Ringkasan (Untuk DashboardPage)
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Total Kas & Pendapatan Harian
        const [[cashFlow]] = await pool.query('SELECT SUM(CASE WHEN type="in" THEN amount ELSE 0 END) as totalIn, SUM(CASE WHEN type="out" THEN amount ELSE 0 END) as totalOut FROM cash_flow');
        const [[todaySales]] = await pool.query('SELECT SUM(total) as val FROM transactions WHERE date LIKE ? AND status = "paid"', [`${today}%`]);
        const [[todayIn]] = await pool.query('SELECT SUM(amount) as val FROM cash_flow WHERE date = ? AND type = "in"', [today]);

        // Count Data
        const [[trxCount]] = await pool.query('SELECT COUNT(*) as val FROM transactions WHERE date LIKE ?', [`${today}%`]);
        const [[pendingPrint]] = await pool.query('SELECT COUNT(*) as val FROM print_orders WHERE status NOT IN ("selesai", "diambil", "batal")');
        const [[pendingService]] = await pool.query('SELECT COUNT(*) as val FROM service_orders WHERE status NOT IN ("selesai", "diambil", "batal")');
        const [[lowStock]] = await pool.query('SELECT COUNT(*) as val FROM products WHERE stock <= min_stock');

        // Data Grafik Seminggu Terakhir
        const [chartData] = await pool.query(`
            SELECT DATE(date) as label, SUM(total) as total 
            FROM transactions 
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status = 'paid'
            GROUP BY DATE(date) 
            ORDER BY DATE(date) ASC
        `);

        // Transaksi / Modifikasi Paling Baru
        const [recentActivity] = await pool.query('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 10');

        res.json({
            saldo: (cashFlow.totalIn || 0) - (cashFlow.totalOut || 0),
            todaySales: todaySales.val || 0,
            todayIn: todayIn.val || 0,
            trxCount: trxCount.val || 0,
            pendingPrint: pendingPrint.val || 0,
            pendingService: pendingService.val || 0,
            lowStock: lowStock.val || 0,
            chartData: chartData.map(c => ({
                label: new Date(c.label).toLocaleDateString('id-ID', { weekday: 'short' }),
                total: parseInt(c.total)
            })),
            activityLog: recentActivity
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal memuat statistik dashboard' });
    }
});

// 3. POST Entri Kas Baru (Masuk/Keluar)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { date, type, category, amount, description, reference } = req.body;
        const newId = 'cf' + Date.now();
        await pool.query(`
            INSERT INTO cash_flow (id, date, type, category, amount, description, reference)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [newId, date, type, category, amount, description, reference || '']);
        res.status(201).json({ message: 'Entri kas berhasil dicatat!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mencatat entri kas' });
    }
});

// 4. PUT Update Entri Kas
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { date, type, category, amount, description, reference } = req.body;
        await pool.query(`
            UPDATE cash_flow SET date=?, type=?, category=?, amount=?, description=?, reference=?
            WHERE id=?
        `, [date, type, category, amount, description, reference || '', req.params.id]);
        res.json({ message: 'Entri kas berhasil diperbarui!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal memperbarui entri kas' });
    }
});

// 5. DELETE Entri Kas
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM cash_flow WHERE id=?', [req.params.id]);
        res.json({ message: 'Entri kas berhasil dihapus!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menghapus entri kas' });
    }
});

module.exports = router;
