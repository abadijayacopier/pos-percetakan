const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { z } = require('zod');
const crypto = require('crypto');

// Validation Schema
const cashFlowSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
    type: z.enum(['in', 'out']),
    category: z.string().min(1, "Kategori wajib diisi"),
    amount: z.number().positive("Jumlah harus lebih dari 0"),
    description: z.string().optional(),
    reference: z.string().optional()
});

// 1. GET Semua Data Arus Kas (Buku Kas)
router.get('/', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM cash_flow ORDER BY date DESC, created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data arus kas' });
    }
});

// 2. GET Statistik Ringkasan (Dashboard)
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Total Kas & Pendapatan Harian
        const [[cashFlow]] = await req.db.query('SELECT SUM(CASE WHEN type="in" THEN amount ELSE 0 END) as totalIn, SUM(CASE WHEN type="out" THEN amount ELSE 0 END) as totalOut FROM cash_flow');
        const [[todaySales]] = await req.db.query('SELECT SUM(total) as val FROM transactions WHERE date LIKE ? AND status = "paid"', [`${today}%`]);
        const [[todayIn]] = await req.db.query('SELECT SUM(amount) as val FROM cash_flow WHERE date = ? AND type = "in"', [today]);

        // Count Data
        const [[trxCount]] = await req.db.query('SELECT COUNT(*) as val FROM transactions WHERE date LIKE ?', [`${today}%`]);
        const [[pendingPrint]] = await req.db.query('SELECT COUNT(*) as val FROM print_orders WHERE status NOT IN ("selesai", "diambil", "batal")');
        const [[pendingService]] = await req.db.query('SELECT COUNT(*) as val FROM service_orders WHERE status NOT IN ("selesai", "diambil", "batal")');
        const [[lowStock]] = await req.db.query('SELECT COUNT(*) as val FROM products WHERE stock <= min_stock');

        // Data Grafik Seminggu Terakhir
        const [chartData] = await req.db.query(`
            SELECT DATE(date) as label, SUM(total) as total 
            FROM transactions 
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status = 'paid'
            GROUP BY DATE(date) 
            ORDER BY DATE(date) ASC
        `);

        // Recent activity from tenant's own log
        const [recentActivity] = await req.db.query('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 10');

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

// 3. POST Entri Kas Baru
router.post('/', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    try {
        const validatedData = cashFlowSchema.parse(req.body);
        const { date, type, category, amount, description, reference } = validatedData;

        const newId = crypto.randomUUID();
        await req.db.query(`
            INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [newId, date, type, category, amount, description, reference || '']);

        res.status(201).json({ message: 'Entri kas berhasil dicatat!', id: newId });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        res.status(500).json({ message: 'Gagal mencatat entri kas' });
    }
});

// 4. PUT Update Entri Kas
router.put('/:id', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    try {
        const validatedData = cashFlowSchema.parse(req.body);
        const { date, type, category, amount, description, reference } = validatedData;

        const [result] = await req.db.query(`
            UPDATE cash_flow SET date=?, type=?, category=?, amount=?, description=?, reference_id=?
            WHERE id=?
        `, [date, type, category, amount, description || null, reference || null, req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Entri kas tidak ditemukan' });
        }

        res.json({ message: 'Entri kas berhasil diperbarui!' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        res.status(500).json({ message: 'Gagal memperbarui entri kas' });
    }
});

// 5. DELETE Entri Kas
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const [result] = await req.db.query('DELETE FROM cash_flow WHERE id=?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Entri kas tidak ditemukan' });
        }
        res.json({ message: 'Entri kas berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus entri kas' });
    }
});

module.exports = router;
