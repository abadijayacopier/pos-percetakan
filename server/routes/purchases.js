const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { z } = require('zod');
const crypto = require('crypto');

const purchaseSchema = z.object({
    supplier_id: z.preprocess(v => (v === '' || v === undefined) ? null : v, z.string().nullable().optional()),
    supplier_name: z.string().optional().default('Umum'),
    date: z.string().optional(),
    total_amount: z.coerce.number().min(0, "Total harus positif"),
    payment_status: z.enum(['lunas', 'hutang']).optional().default('lunas'),
    notes: z.string().optional().nullable(),
    items: z.array(z.object({
        type: z.enum(['product', 'material']),
        id: z.string().min(1, "ID item wajib"),
        name: z.string().min(1, "Nama item wajib"),
        qty: z.coerce.number().positive("Jumlah wajib positif"),
        cost: z.coerce.number().min(0, "Harga modal wajib positif"),
        subtotal: z.coerce.number().min(0, "Subtotal wajib positif"),
        unit: z.string().optional()
    }).passthrough()).min(1, "Minimal harus ada satu item")
}).passthrough();

// GET all purchases
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM purchases ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET specific purchase
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [purchases] = await req.db.query('SELECT * FROM purchases WHERE id = ?', [req.params.id]);
        if (purchases.length === 0) return res.status(404).json({ message: 'Not found' });

        const [items] = await req.db.query('SELECT * FROM purchase_items WHERE purchase_id = ?', [req.params.id]);
        res.json({ ...purchases[0], items });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST new purchase
router.post('/', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    const conn = await req.db.getConnection();
    try {
        const validatedData = purchaseSchema.parse(req.body);
        const { supplier_id, supplier_name, date, total_amount, payment_status, notes, items } = validatedData;

        await conn.beginTransaction();
        const purchase_id = 'PURC-' + crypto.randomUUID().split('-')[0].toUpperCase() + '-' + Date.now().toString().slice(-4);
        const invoice_no = 'INV-' + Date.now().toString().slice(-6);

        await conn.query(
            `INSERT INTO purchases (id, invoice_no, supplier_id, supplier_name, date, total_amount, payment_status, notes, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [purchase_id, invoice_no, supplier_id || null, supplier_name, date || new Date(), total_amount, payment_status, notes || null, req.user.id]
        );

        for (const item of items) {
            await conn.query(
                `INSERT INTO purchase_items (purchase_id, item_type, item_id, item_name, qty, unit_cost, subtotal)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [purchase_id, item.type, item.id, item.name, item.qty, item.cost, item.subtotal]
            );

            if (item.type === 'product') {
                await conn.query('UPDATE products SET stock = stock + ?, buy_price = ? WHERE id = ?', [item.qty, item.cost, item.id]);
                await conn.query(
                    `INSERT INTO stock_movements (product_id, type, qty, reference, notes) VALUES (?, 'in', ?, ?, 'Restock Barang Masuk')`,
                    [item.id, item.qty, purchase_id]
                );
            } else if (item.type === 'material') {
                await conn.query('UPDATE materials SET stok_saat_ini = stok_saat_ini + ?, harga_modal = ? WHERE id = ?', [item.qty, item.cost, item.id]);
                await conn.query(
                    `INSERT INTO material_movements (material_id, tipe, jumlah, satuan, referensi, catatan, user_id) VALUES (?, 'masuk', ?, ?, ?, 'Restock Barang Masuk', ?)`,
                    [item.id, item.qty, item.unit || 'pcs', purchase_id, req.user.id]
                );
            }
        }

        if (payment_status === 'lunas' && total_amount > 0) {
            const cfId = 'cf' + Date.now();
            const cfDate = date ? date.split('T')[0] : new Date().toISOString().split('T')[0];
            await conn.query(
                `INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
                VALUES (?, ?, 'out', 'Pembelian', ?, ?, ?)`,
                [cfId, cfDate, total_amount, `Pembelian ${supplier_name} - ${invoice_no}`, purchase_id]
            );
        }

        await conn.query(
            'INSERT INTO activity_log (user_id, user_name, action, detail) VALUES (?, ?, ?, ?)',
            [req.user.id, req.user.name, 'ADD_PURCHASE', `Pembelian ${invoice_no} total Rp ${total_amount.toLocaleString('id-ID')} dari ${supplier_name}`]
        );

        await conn.commit();
        res.status(201).json({ message: 'Pembelian berhasil dicatat', id: purchase_id });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: 'Gagal mencatat pembelian', error: err.message });
    } finally {
        conn.release();
    }
});

// DELETE a purchase
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    const conn = await req.db.getConnection();
    try {
        const purchaseId = req.params.id;
        const [purchases] = await conn.query('SELECT * FROM purchases WHERE id = ?', [purchaseId]);
        if (purchases.length === 0) return res.status(404).json({ message: 'Pembelian tidak ditemukan' });

        const purchase = purchases[0];
        await conn.beginTransaction();

        const [items] = await conn.query('SELECT * FROM purchase_items WHERE purchase_id = ?', [purchaseId]);
        for (const item of items) {
            if (item.item_type === 'product') {
                await conn.query('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [item.qty, item.item_id]);
            } else if (item.item_type === 'material') {
                await conn.query('UPDATE materials SET stok_saat_ini = GREATEST(0, stok_saat_ini - ?) WHERE id = ?', [item.qty, item.item_id]);
            }
        }

        await conn.query('DELETE FROM purchase_items WHERE purchase_id = ?', [purchaseId]);
        await conn.query('DELETE FROM cash_flow WHERE reference_id = ?', [purchaseId]);
        await conn.query('DELETE FROM purchases WHERE id = ?', [purchaseId]);

        await conn.query(
            'INSERT INTO activity_log (user_id, user_name, action, detail) VALUES (?, ?, ?, ?)',
            [req.user.id, req.user.name, 'DELETE_PURCHASE', `Hapus pembelian ${purchase.invoice_no}`]
        );

        await conn.commit();
        res.json({ message: 'Pembelian berhasil dihapus' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: 'Gagal menghapus pembelian', error: err.message });
    } finally {
        conn.release();
    }
});

module.exports = router;
