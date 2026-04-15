const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const TenantManager = require('../utils/tenantManager');

// 1. GET /api/pricing/form-data
router.get('/form-data', verifyToken, async (req, res) => {
    try {
        const [categories] = await req.db.query('SELECT id, name FROM categories ORDER BY name ASC');
        const [products] = await req.db.query('SELECT id, name AS nama_produk, category_id, buy_price, sell_price AS harga_dasar, unit AS satuan FROM products ORDER BY name ASC');
        res.json({ categories, products });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat data kategori.' });
    }
});

// 2. GET /api/pricing/rules/:product_id
router.get('/rules/:product_id', verifyToken, async (req, res) => {
    try {
        const [rules] = await req.db.query(`
            SELECT * FROM tiered_pricing_rules 
            WHERE product_id = ? 
            ORDER BY urutan_tier ASC
        `, [req.params.product_id]);
        res.json(rules);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat aturan harga.' });
    }
});

// 3. POST /api/pricing/rules
router.post('/rules', verifyToken, async (req, res) => {
    const conn = await req.db.getConnection();
    try {
        await conn.beginTransaction();
        const { product_id, rules } = req.body;

        const [oldRules] = await conn.query('SELECT * FROM tiered_pricing_rules WHERE product_id = ? ORDER BY urutan_tier ASC', [product_id]);
        await conn.query('DELETE FROM tiered_pricing_rules WHERE product_id = ?', [product_id]);

        if (rules && rules.length > 0) {
            const values = rules.map((r, index) => [
                product_id,
                r.min_kuantitas,
                r.max_kuantitas || null,
                r.diskon_persen || 0,
                r.harga_per_unit_akhir,
                index + 1
            ]);

            await conn.query(`
                INSERT INTO tiered_pricing_rules 
                (product_id, min_kuantitas, max_kuantitas, diskon_persen, harga_per_unit_akhir, urutan_tier) 
                VALUES ?
            `, [values]);
        }

        const [newRules] = await conn.query('SELECT * FROM tiered_pricing_rules WHERE product_id = ? ORDER BY urutan_tier ASC', [product_id]);
        await conn.query(`
            INSERT INTO pricing_logs (product_id, user_id, payload_sebelum, payload_sesudah) 
            VALUES (?, ?, ?, ?)
        `, [product_id, req.user.id, JSON.stringify(oldRules), JSON.stringify(newRules)]);

        await conn.commit();
        res.status(200).json({ success: true, message: 'Berhasil menyimpan aturan harga.' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: 'Gagal menyimpan aturan harga.' });
    } finally {
        conn.release();
    }
});

// 4. GET /api/pricing/logs
router.get('/logs', verifyToken, async (req, res) => {
    try {
        const [logs] = await req.db.query(`
            SELECT l.id, l.created_at, l.payload_sebelum, l.payload_sesudah,
                   u.name AS user_name, u.role AS user_role, p.name AS product_name
            FROM pricing_logs l
            JOIN users u ON l.user_id = u.id
            JOIN products p ON l.product_id = p.id
            ORDER BY l.created_at DESC LIMIT 100
        `);

        const formattedLogs = logs.map(log => {
            const before = JSON.parse(log.payload_sebelum || '[]');
            const after = JSON.parse(log.payload_sesudah || '[]');
            let action = 'UPDATE';
            if (before.length === 0 && after.length > 0) action = 'CREATE';
            if (before.length > 0 && after.length === 0) action = 'DELETE';
            return {
                ...log,
                action,
                changes: action === 'DELETE' ? 'Menghapus diskon' : `Update ${after.length} tingkatan diskon`
            };
        });

        res.json(formattedLogs);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat riwayat.' });
    }
});

// 5. POST /api/pricing/calculate
router.post('/calculate', verifyToken, async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        if (!product_id || !quantity || quantity <= 0) return res.status(400).json({ message: 'Parameter tidak valid.' });

        const [productRows] = await req.db.query('SELECT sell_price FROM products WHERE id = ?', [product_id]);
        if (productRows.length === 0) return res.status(404).json({ message: 'Produk tidak ditemukan.' });

        const basePrice = productRows[0].sell_price;
        const [rules] = await req.db.query(`
            SELECT harga_per_unit_akhir, diskon_persen FROM tiered_pricing_rules 
            WHERE product_id = ? AND min_kuantitas <= ? AND (max_kuantitas IS NULL OR max_kuantitas >= ?)
            ORDER BY urutan_tier DESC LIMIT 1
        `, [product_id, quantity, quantity]);

        if (rules.length > 0) {
            const rule = rules[0];
            return res.json({
                is_grosir: true,
                harga_normal: basePrice,
                harga_grosir: rule.harga_per_unit_akhir,
                diskon_persen: rule.diskon_persen,
                total: quantity * rule.harga_per_unit_akhir
            });
        }

        res.json({
            is_grosir: false,
            harga_normal: basePrice,
            harga_grosir: basePrice,
            diskon_persen: 0,
            total: quantity * basePrice
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghitung harga.' });
    }
});

// 6. GET /api/pricing/binding
router.get('/binding', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query("SELECT id, name, sell_price AS price FROM products WHERE category_id = (SELECT id FROM categories WHERE name LIKE '%jilid%' LIMIT 1)");
        if (rows.length > 0) return res.json(rows);
        throw new Error('Not found');
    } catch (error) {
        res.json([{ id: 'b1', name: 'Jilid Lakban Biasa', price: 3000 }, { id: 'b2', name: 'Jilid Spiral Kawat', price: 15000 }]);
    }
});

// 7. GET /api/pricing/print
router.get('/print', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query("SELECT id, name, sell_price AS price FROM products WHERE category_id = (SELECT id FROM categories WHERE name LIKE '%print%' LIMIT 1)");
        if (rows.length > 0) return res.json(rows);
        throw new Error('Not found');
    } catch (error) {
        res.json([{ id: 'p1', name: 'Print B/W A4', price: 500 }, { id: 'p2', name: 'Print Warna A4', price: 1000 }]);
    }
});

// 8. GET /api/pricing/public/all (Public for Landing Page)
router.get('/public/all', async (req, res) => {
    try {
        const shopId = req.headers['x-shop-id'] || 'default';
        const tenantDb = await TenantManager.getPoolForShop(shopId);
        if (!tenantDb) return res.status(404).json({ message: 'Shop not found' });

        const [binding] = await tenantDb.query("SELECT id, name, sell_price AS price FROM products WHERE category_id = (SELECT id FROM categories WHERE name LIKE '%jilid%' LIMIT 1)");
        const [print] = await tenantDb.query("SELECT id, name, sell_price AS price FROM products WHERE category_id = (SELECT id FROM categories WHERE name LIKE '%print%' LIMIT 1)");

        res.json({
            binding: binding.length > 0 ? binding : [{ id: 'b1', name: 'Jilid Lakban Biasa', price: 3000 }],
            print: print.length > 0 ? print : [{ id: 'p1', name: 'Print B/W A4', price: 500 }]
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data harga publik' });
    }
});

module.exports = router;
