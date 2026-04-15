const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// 1. GET Semua Order Percetakan (Kanban Board)
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(`
            SELECT id, order_no AS orderNo, customer_id AS customerId, customer_name AS customerName, 
                   type, description, specs, qty, unit, total_price AS totalPrice, dp_amount AS dpAmount, 
                   remaining, shipping_cost AS shippingCost, deadline, status, notes, created_at AS createdAt
            FROM print_orders ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data pesanan' });
    }
});

// 1a. GET Bahan Digital Printing
router.get('/digital-materials', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM digital_printing ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data bahan digital' });
    }
});

// 1b. GET Bahan Cetak Offset
router.get('/offset-materials', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM offset_printing ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data bahan offset' });
    }
});

// 2. POST Order Percetakan Baru
router.post('/', verifyToken, requireRole(['operator', 'admin', 'kasir']), async (req, res) => {
    const connection = await req.db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            orderNo, customerId, customerName, type, description, specs,
            qty, unit, totalPrice, dpAmount, shippingCost, deadline, notes, status
        } = req.body;

        const remaining = (totalPrice + (shippingCost || 0)) - dpAmount;
        const newId = 'po' + Date.now();

        await connection.query(`
            INSERT INTO print_orders 
            (id, order_no, customer_id, customer_name, type, description, specs, qty, unit, total_price, dp_amount, remaining, shipping_cost, deadline, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [newId, orderNo, customerId || null, customerName, type, description, specs, qty, unit, totalPrice, dpAmount, remaining, shippingCost || 0, deadline || null, status || 'pending', notes]);

        if (dpAmount > 0) {
            const cashFlowId = 'cf' + Date.now();
            const date = new Date().toISOString().split('T')[0];
            await connection.query(`
                INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
                VALUES (?, ?, 'in', 'DP Cetak', ?, ?, ?)
            `, [cashFlowId, date, dpAmount, `DP Order Cetak ${orderNo}`, newId]);
        }

        if (customerId) {
            await connection.query('UPDATE customers SET total_trx = total_trx + 1, total_spend = total_spend + ? WHERE id = ?', [dpAmount || 0, customerId]);
        }

        await connection.commit();
        res.status(201).json({ message: 'Order cetak dibuat!', id: newId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Gagal membuat order' });
    } finally {
        connection.release();
    }
});

// 3. PATCH Update Status (Kanban)
router.patch('/:id/status', verifyToken, requireRole(['operator', 'admin', 'kasir']), async (req, res) => {
    try {
        const { status } = req.body;
        await req.db.query('UPDATE print_orders SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: 'Status berhasil diperbarui!' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal update status' });
    }
});

// 4. POST Pelunasan Tagihan
router.post('/:id/pay', verifyToken, requireRole(['kasir', 'admin']), async (req, res) => {
    const connection = await req.db.getConnection();
    try {
        await connection.beginTransaction();
        const { orderNo, payAmount } = req.body;

        await connection.query('UPDATE print_orders SET remaining = remaining - ?, dp_amount = dp_amount + ? WHERE id = ?', [payAmount, payAmount, req.params.id]);

        const cashFlowId = 'cf' + Date.now();
        const date = new Date().toISOString().split('T')[0];

        await connection.query(`
            INSERT INTO cash_flow(id, date, type, category, amount, description, reference_id)
            VALUES(?, ?, 'in', 'Pelunasan Cetak', ?, ?, ?)
        `, [cashFlowId, date, payAmount, `Pelunasan Cetak ${orderNo}`, req.params.id]);

        const [orderRows] = await connection.query('SELECT customer_id FROM print_orders WHERE id = ?', [req.params.id]);
        if (orderRows.length > 0 && orderRows[0].customer_id) {
            await connection.query('UPDATE customers SET total_spend = total_spend + ? WHERE id = ?', [payAmount, orderRows[0].customer_id]);
        }

        await connection.commit();
        res.json({ message: 'Pembayaran sisa tagihan berhasil dicatat!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Gagal memproses pelunasan' });
    } finally {
        connection.release();
    }
});

module.exports = router;
