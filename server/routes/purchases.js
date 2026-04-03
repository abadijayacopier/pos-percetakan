const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const { z } = require('zod');
const crypto = require('crypto');

// Validation Schema
const purchaseSchema = z.object({
    supplier_id: z.string().optional().nullable(),
    supplier_name: z.string().optional().default('Umum'),
    date: z.string().optional(),
    total_amount: z.number().min(0, "Total harus positif"),
    payment_status: z.enum(['lunas', 'hutang']).optional().default('lunas'),
    notes: z.string().optional().nullable(),
    items: z.array(z.object({
        type: z.enum(['product', 'material']),
        id: z.string().min(1, "ID item wajib"),
        name: z.string().min(1, "Nama item wajib"),
        qty: z.number().positive("Jumlah wajib positif"),
        cost: z.number().min(0, "Harga modal wajib positif"),
        subtotal: z.number().min(0, "Subtotal wajib positif"),
        unit: z.string().optional()
    })).min(1, "Minimal harus ada satu item")
});

// GET all purchases
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM purchases ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET specific purchase and its items
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [purchases] = await pool.query('SELECT * FROM purchases WHERE id = ?', [req.params.id]);
        if (purchases.length === 0) return res.status(404).json({ message: 'Not found' });

        const [items] = await pool.query('SELECT * FROM purchase_items WHERE purchase_id = ?', [req.params.id]);
        res.json({ ...purchases[0], items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST new purchase
router.post('/', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const validatedData = purchaseSchema.parse(req.body);
        const { supplier_id, supplier_name, date, total_amount, payment_status, notes, items } = validatedData;

        await conn.beginTransaction();

        const purchase_id = 'PURC-' + crypto.randomUUID().split('-')[0].toUpperCase() + '-' + Date.now().toString().slice(-4);
        const invoice_no = 'INV-' + Date.now().toString().slice(-6);
        const user_id = req.user?.id || null;

        await conn.query(
            `INSERT INTO purchases (id, invoice_no, supplier_id, supplier_name, date, total_amount, payment_status, notes, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [purchase_id, invoice_no, supplier_id || null, supplier_name, date || new Date(), total_amount, payment_status, notes || null, user_id]
        );

        for (const item of items) {
            // Insert into purchase_items
            await conn.query(
                `INSERT INTO purchase_items (purchase_id, item_type, item_id, item_name, qty, unit_cost, subtotal)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [purchase_id, item.type, item.id, item.name, item.qty, item.cost, item.subtotal]
            );

            // Update stock and logs
            if (item.type === 'product') {
                // Products
                await conn.query('UPDATE products SET stock = stock + ?, buy_price = ? WHERE id = ?', [item.qty, item.cost, item.id]);
                await conn.query(
                    `INSERT INTO stock_movements (product_id, type, qty, reference, notes) VALUES (?, 'in', ?, ?, 'Restock Barang Masuk')`,
                    [item.id, item.qty, purchase_id]
                );
            } else if (item.type === 'material') {
                // Materials
                await conn.query('UPDATE materials SET stok_saat_ini = stok_saat_ini + ?, harga_modal = ? WHERE id = ?', [item.qty, item.cost, item.id]);
                await conn.query(
                    `INSERT INTO material_movements (material_id, tipe, jumlah, satuan, referensi, catatan, user_id) VALUES (?, 'masuk', ?, ?, ?, 'Restock Barang Masuk', ?)`,
                    [item.id, item.qty, item.unit || 'pcs', purchase_id, user_id]
                );
            }
        }

        await conn.commit();
        res.status(201).json({ message: 'Pembelian berhasil dicatat', id: purchase_id });
    } catch (err) {
        await conn.rollback();
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        console.error(err);
        res.status(500).json({ message: 'Gagal mencatat pembelian', error: err.message });
    } finally {
        conn.release();
    }
});

module.exports = router;
