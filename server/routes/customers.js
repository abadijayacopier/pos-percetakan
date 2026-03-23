const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { customerSchema } = require('../validations/customerSchema');

// 1. GET Semua Pelanggan
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM customers ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat master pelanggan' });
    }
});

// 2. GET Riwayat Transaksi Seorang Pelanggan
router.get('/:id/history', verifyToken, async (req, res) => {
    try {
        const [transactions] = await pool.query('SELECT * FROM transactions WHERE customer_id = ? ORDER BY date DESC', [req.params.id]);
        const [printOrders] = await pool.query('SELECT * FROM print_orders WHERE customer_id = ? ORDER BY created_at DESC', [req.params.id]);
        const [serviceOrders] = await pool.query('SELECT * FROM service_orders WHERE customer_id = ? ORDER BY created_at DESC', [req.params.id]);

        res.json({
            transactions,
            printOrders,
            serviceOrders
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat riwayat transaksi' });
    }
});

// 3. POST Tambah Pelanggan Baru
router.post('/', verifyToken, requireRole(['admin', 'kasir']), validate(customerSchema), async (req, res) => {
    try {
        const { name, phone, address, type, company } = req.body;
        const newId = 'c' + Date.now();

        await pool.query(`
            INSERT INTO customers (id, name, phone, address, type, company)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [newId, name, phone || null, address || null, type || 'walkin', company || null]);

        res.status(201).json({ message: 'Pelanggan berhasil ditambahkan!', id: newId });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menyimpan pelanggan baru' });
    }
});

// 4. PUT Update Pelanggan
router.put('/:id', verifyToken, requireRole(['admin', 'kasir']), validate(customerSchema), async (req, res) => {
    try {
        const { name, phone, address, type, company } = req.body;

        await pool.query(`
            UPDATE customers SET name = ?, phone = ?, address = ?, type = ?, company = ?
            WHERE id = ?
        `, [name, phone || null, address || null, type, company || null, req.params.id]);

        res.json({ message: 'Data pelanggan berhasil diperbarui!' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui data pelanggan' });
    }
});

// 5. DELETE Pelanggan
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
        res.json({ message: 'Pelanggan berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus pelanggan, mungkin data masih terpakai' });
    }
});

module.exports = router;
