const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { customerSchema } = require('../validations/customerSchema');

// 1. GET Semua Pelanggan
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(`
            SELECT c.*, 
                    CAST(COALESCE(t_stats.total_trx, 0) + COALESCE(s_stats.total_trx, 0) + COALESCE(p_stats.total_trx, 0) AS SIGNED) as totalTrx,
                    CAST(COALESCE(t_stats.total_spend, 0) + COALESCE(s_stats.total_spend, 0) + COALESCE(p_stats.total_spend, 0) AS DECIMAL(20,2)) as totalSpend
            FROM customers c
            LEFT JOIN (
                SELECT customer_id, 
                       COUNT(id) as total_trx,
                       SUM(CASE WHEN status IN ('paid', 'completed') THEN total ELSE paid END) as total_spend
                FROM transactions
                GROUP BY customer_id
            ) t_stats ON c.id = t_stats.customer_id
            LEFT JOIN (
                SELECT customer_id, 
                       COUNT(id) as total_trx,
                       SUM(total_cost) as total_spend
                FROM service_orders
                GROUP BY customer_id
            ) s_stats ON c.id = s_stats.customer_id
            LEFT JOIN (
                SELECT customer_id, 
                       COUNT(id) as total_trx,
                       SUM(total_harga) as total_spend
                FROM print_orders
                GROUP BY customer_id
            ) p_stats ON c.id = p_stats.customer_id
            ORDER BY c.name ASC
        `);
        res.json(rows);
    } catch (error) {
        console.warn('Complex customer query failed (likely missing tables), falling back to simple query.', error.message);
        try {
            // Fallback for when service_orders or print_orders do not exist
            const [rows] = await req.db.query(`
                SELECT c.*, 
                       CAST(COALESCE(t_stats.total_trx, 0) AS SIGNED) as totalTrx,
                       CAST(COALESCE(t_stats.total_spend, 0) AS DECIMAL(20,2)) as totalSpend
                FROM customers c
                LEFT JOIN (
                    SELECT customer_id, 
                           COUNT(id) as total_trx,
                           SUM(CASE WHEN status IN ('paid', 'completed') THEN total ELSE paid END) as total_spend
                    FROM transactions
                    GROUP BY customer_id
                ) t_stats ON c.id = t_stats.customer_id
                ORDER BY c.name ASC
            `);
            res.json(rows);
        } catch (fallbackError) {
            console.error('Fallback customer query also failed.', fallbackError.message);
            
            // Ultra-fallback: Just return the raw customers
            try {
                const [rows] = await req.db.query('SELECT * FROM customers ORDER BY name ASC');
                res.json(rows);
            } catch (fatalError) {
                res.status(500).json({ message: 'Gagal memuat master pelanggan' });
            }
        }
    }
});

// 2. GET Riwayat Transaksi Seorang Pelanggan
router.get('/:id/history', verifyToken, async (req, res) => {
    try {
        const [transactions] = await req.db.query('SELECT * FROM transactions WHERE customer_id = ? ORDER BY date DESC', [req.params.id]);

        // Use req.db for all shop-specific tables
        const [printOrders] = await req.db.query('SELECT * FROM print_orders WHERE customer_id = ? ORDER BY created_at DESC', [req.params.id]);
        const [serviceOrders] = await req.db.query('SELECT * FROM service_orders WHERE customer_id = ? ORDER BY created_at DESC', [req.params.id]);

        res.json({
            transactions,
            printOrders,
            serviceOrders
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat riwayat transaksi' });
    }
});

const { logActivity } = require('../utils/logger');

// 3. POST Tambah Pelanggan Baru
router.post('/', verifyToken, requireRole(['admin', 'kasir']), validate(customerSchema), async (req, res) => {
    try {
        const { name, phone, address, type, company } = req.body;
        const newId = 'c' + Date.now();

        await req.db.query(`
            INSERT INTO customers (id, name, phone, address, type, company)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [newId, name, phone || null, address || null, type || 'walkin', company || null]);

        // Log activity
        await logActivity(req.user.id, 'CREATE_CUSTOMER', name, `Tambah pelanggan: ${name}`, req.ip, req.user.name);

        res.status(201).json({ message: 'Pelanggan berhasil ditambahkan!', id: newId });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menyimpan pelanggan baru' });
    }
});

// 4. PUT Update Pelanggan
router.put('/:id', verifyToken, requireRole(['admin', 'kasir']), validate(customerSchema), async (req, res) => {
    try {
        const { name, phone, address, type, company } = req.body;

        await req.db.query(`
            UPDATE customers SET name = ?, phone = ?, address = ?, type = ?, company = ?
            WHERE id = ?
        `, [name, phone || null, address || null, type, company || null, req.params.id]);

        // Log activity
        await logActivity(req.user.id, 'UPDATE_CUSTOMER', name, `Update pelanggan: ${name}`, req.ip, req.user.name);

        res.json({ message: 'Data pelanggan berhasil diperbarui!' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui data pelanggan' });
    }
});

// 5. DELETE Pelanggan
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const [custArr] = await req.db.query('SELECT name FROM customers WHERE id = ?', [id]);
        const custName = custArr.length > 0 ? custArr[0].name : 'Unknown';

        await req.db.query('DELETE FROM customers WHERE id = ?', [req.params.id]);

        // Log activity
        await logActivity(req.user.id, 'DELETE_CUSTOMER', custName, `Hapus pelanggan ID: ${id}`, req.ip, req.user.name);

        res.json({ message: 'Pelanggan berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus pelanggan, mungkin data masih terpakai' });
    }
});

module.exports = router;
