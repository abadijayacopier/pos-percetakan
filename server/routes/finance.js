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
        // Self-healing: Fix inconsistent PENJUALAN amounts in SQLite compatible way
        await req.db.query(`
            UPDATE cash_flow 
            SET amount = (SELECT total FROM transactions WHERE transactions.id = cash_flow.reference_id)
            WHERE category = 'Penjualan' 
            AND EXISTS (
                SELECT 1 FROM transactions 
                WHERE transactions.id = cash_flow.reference_id 
                AND transactions.total < cash_flow.amount
                AND transactions.status IN ('paid', 'completed')
            )
        `);

        const [rows] = await req.db.query('SELECT * FROM cash_flow ORDER BY date DESC, created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Finance GET error:', error);
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

        // Data Grafik Seminggu Terakhir (SQLite compatible)
        const [chartData] = await req.db.query(`
            SELECT DATE(date) as label, SUM(total) as total 
            FROM transactions 
            WHERE date >= date('now', '-7 days') AND status = 'paid'
            GROUP BY DATE(date) 
            ORDER BY DATE(date) ASC
        `);

        // Recent activity from tenant's own log
        const [recentActivity] = await req.db.query('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 10');

        res.json({
            saldo: (cashFlow?.totalIn || 0) - (cashFlow?.totalOut || 0),
            todaySales: todaySales?.val || 0,
            todayIn: todayIn?.val || 0,
            trxCount: trxCount?.val || 0,
            pendingPrint: pendingPrint?.val || 0,
            pendingService: pendingService?.val || 0,
            lowStock: lowStock?.val || 0,
            chartData: chartData.map(c => ({
                label: new Date(c.label).toLocaleDateString('id-ID', { weekday: 'short' }),
                total: parseInt(c.total || 0)
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

// 6. POST Reconcile (Sync Transactions with Cash Flow)
router.post('/reconcile', verifyToken, requireRole(['admin']), async (req, res) => {
    const connection = await req.db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get all relevant transactions
        const [transactions] = await connection.query(`
            SELECT id, invoice_no, date, paid, total, status 
            FROM transactions 
            WHERE status IN ('paid', 'debt', 'completed', 'pending')
        `);

        let fixedCount = 0;
        let totalFixedAmount = 0;

        for (const trx of transactions) {
            // 2. Get existing cash flow entries for this transaction
            const [cashEntries] = await connection.query(
                'SELECT SUM(amount) as totalActual FROM cash_flow WHERE reference_id = ? AND type = "in"',
                [trx.id]
            );

            const actualAmount = cashEntries[0]?.totalActual || 0;
            const expectedAmount = trx.paid || 0;

            // 3. If there's a discrepancy, fix it
            if (expectedAmount > actualAmount) {
                const diff = expectedAmount - actualAmount;
                const cashFlowId = 'sync-' + trx.id + '-' + Date.now();
                
                await connection.query(`
                    INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
                    VALUES (?, ?, 'in', 'Penjualan', ?, ?, ?)
                `, [
                    cashFlowId, 
                    trx.date.slice(0, 10), 
                    diff, 
                    `Sync - Penjualan ${trx.invoice_no || trx.id}`, 
                    trx.id
                ]);

                fixedCount++;
                totalFixedAmount += diff;
            }
        }

        await connection.commit();
        res.json({ 
            message: `Rekonsiliasi selesai. ${fixedCount} transaksi diperbaiki.`,
            fixedCount,
            totalFixedAmount
        });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Reconciliation error:', error);
        res.status(500).json({ message: 'Gagal menjalankan rekonsiliasi' });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
