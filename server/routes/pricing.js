const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// 1. GET /api/pricing/categories-products
// Fetch categories and products for the select dropdowns
router.get('/form-data', verifyToken, async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT id, name FROM categories ORDER BY name ASC');
        const [products] = await pool.query('SELECT id, name AS nama_produk, category_id, buy_price, sell_price AS harga_dasar, unit AS satuan FROM products ORDER BY name ASC');
        res.json({ categories, products });
    } catch (error) {
        console.error('Error fetching form data for pricing:', error);
        res.status(500).json({ message: 'Gagal memuat data kategori dan produk.' });
    }
});

// 2. GET /api/pricing/rules/:product_id
// Fetch all existing rules for a specific product
router.get('/rules/:product_id', verifyToken, async (req, res) => {
    try {
        const [rules] = await pool.query(`
            SELECT * FROM tiered_pricing_rules 
            WHERE product_id = ? 
            ORDER BY urutan_tier ASC
        `, [req.params.product_id]);
        res.json(rules);
    } catch (error) {
        console.error('Error fetching pricing rules:', error);
        res.status(500).json({ message: 'Gagal memuat aturan harga.' });
    }
});

// 3. POST /api/pricing/rules
// Save or update pricing rules for a product
router.post('/rules', verifyToken, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const { product_id, rules } = req.body; // rules is an array of objects
        const userId = req.user.id; // From verifyToken

        // 1. Dapatkan rules lama untuk logging
        const [oldRules] = await conn.query('SELECT * FROM tiered_pricing_rules WHERE product_id = ? ORDER BY urutan_tier ASC', [product_id]);

        // 2. Hapus rules yang ada sekarang
        await conn.query('DELETE FROM tiered_pricing_rules WHERE product_id = ?', [product_id]);

        // 3. Insert rules baru
        if (rules && rules.length > 0) {
            const values = rules.map((r, index) => [
                product_id,
                r.min_kuantitas,
                r.max_kuantitas || null,
                r.diskon_persen || 0,
                r.harga_per_unit_akhir,
                index + 1 // urutan_tier
            ]);

            await conn.query(`
                INSERT INTO tiered_pricing_rules 
                (product_id, min_kuantitas, max_kuantitas, diskon_persen, harga_per_unit_akhir, urutan_tier) 
                VALUES ?
            `, [values]);
        }

        // 4. Catat ke pricing_logs
        const [newRules] = await conn.query('SELECT * FROM tiered_pricing_rules WHERE product_id = ? ORDER BY urutan_tier ASC', [product_id]);

        await conn.query(`
            INSERT INTO pricing_logs (product_id, user_id, payload_sebelum, payload_sesudah) 
            VALUES (?, ?, ?, ?)
        `, [
            product_id,
            userId,
            JSON.stringify(oldRules),
            JSON.stringify(newRules)
        ]);

        await conn.commit();
        res.status(200).json({ success: true, message: 'Berhasil menyimpan aturan harga berjenjang.' });
    } catch (error) {
        await conn.rollback();
        console.error('Error saving pricing rules:', error);
        res.status(500).json({ message: 'Gagal menyimpan aturan harga.' });
    } finally {
        conn.release();
    }
});

// 4. GET /api/pricing/logs
// Fetch pricing change history logs
router.get('/logs', verifyToken, async (req, res) => {
    try {
        const [logs] = await pool.query(`
            SELECT 
                l.id, l.created_at, l.payload_sebelum, l.payload_sesudah,
                u.name AS user_name, u.role AS user_role,
                p.name AS product_name
            FROM pricing_logs l
            JOIN users u ON l.user_id = u.id
            JOIN products p ON l.product_id = p.id
            ORDER BY l.created_at DESC
            LIMIT 100
        `);

        // Parse the payloads for display logic if necessary, or let frontend do it
        const formattedLogs = logs.map(log => {
            const before = JSON.parse(log.payload_sebelum || '[]');
            const after = JSON.parse(log.payload_sesudah || '[]');

            let action = 'UPDATE';
            if (before.length === 0 && after.length > 0) action = 'CREATE';
            if (before.length > 0 && after.length === 0) action = 'DELETE';

            // Create a simple text summary of the changes
            let changes = `Update ${after.length} tingkatan diskon`;
            if (action === 'CREATE') changes = `Menerapkan ${after.length} tingkatan diskon baru`;
            if (action === 'DELETE') changes = `Menghapus semua aturan diskon`;

            return {
                ...log,
                action,
                changes
            };
        });

        res.json(formattedLogs);
    } catch (error) {
        console.error('Error fetching pricing logs:', error);
        res.status(500).json({ message: 'Gagal memuat riwayat perubahan harga.' });
    }
});

// 5. POST /api/pricing/calculate
// API for POS or Order Input to calculate tiered pricing on the fly
router.post('/calculate', verifyToken, async (req, res) => {
    try {
        const { product_id, quantity } = req.body;

        if (!product_id || !quantity || quantity <= 0) {
            return res.status(400).json({ message: 'Parameter tidak valid.' });
        }

        const [productRows] = await pool.query('SELECT sell_price FROM products WHERE id = ?', [product_id]);
        if (productRows.length === 0) return res.status(404).json({ message: 'Produk tidak ditemukan.' });

        const basePrice = productRows[0].sell_price;

        const [rules] = await pool.query(`
            SELECT harga_per_unit_akhir, diskon_persen 
            FROM tiered_pricing_rules 
            WHERE product_id = ?
                AND min_kuantitas <= ?
                    AND(max_kuantitas IS NULL OR max_kuantitas >= ?)
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

        // Kalau tidak ada tier yang match, kembali ke harga normal
        res.json({
            is_grosir: false,
            harga_normal: basePrice,
            harga_grosir: basePrice,
            diskon_persen: 0,
            total: quantity * basePrice
        });

    } catch (error) {
        console.error('Error calculating tiered price:', error);
        res.status(500).json({ message: 'Gagal menghitung harga.' });
    }
});



// 5. GET /api/pricing/binding
router.get('/binding', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, name, sell_price AS price FROM products WHERE category_id = (SELECT id FROM categories WHERE name LIKE '%jilid%' LIMIT 1)");
        if (rows.length > 0) return res.json(rows);
        throw new Error('Not found in products');
    } catch (error) {
        res.json([
            { id: 'b1', name: 'Jilid Lakban Biasa', price: 3000 },
            { id: 'b2', name: 'Jilid Spiral Kawat', price: 15000 },
            { id: 'b3', name: 'Jilid Soft Cover', price: 25000 },
            { id: 'b4', name: 'Jilid Hard Cover', price: 45000 }
        ]);
    }
});

// 6. GET /api/pricing/print
router.get('/print', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, name, sell_price AS price FROM products WHERE category_id = (SELECT id FROM categories WHERE name LIKE '%print%' LIMIT 1)");
        if (rows.length > 0) return res.json(rows);
        throw new Error('Not found in products');
    } catch (error) {
        res.json([
            { id: 'p1', name: 'Print B/W A4', price: 500 },
            { id: 'p2', name: 'Print Warna A4', price: 1000 },
            { id: 'p3', name: 'Print Foto 4R', price: 2500 },
            { id: 'p4', name: 'Print Sticker A3+', price: 15000 }
        ]);
    }
});

// 7. GET /api/pricing/public/all (Public for Landing Page)
router.get('/public/all', async (req, res) => {
    try {
        const [binding] = await pool.query("SELECT id, name, sell_price AS price FROM products WHERE category_id = (SELECT id FROM categories WHERE name LIKE '%jilid%' LIMIT 1)");
        const [print] = await pool.query("SELECT id, name, sell_price AS price FROM products WHERE category_id = (SELECT id FROM categories WHERE name LIKE '%print%' LIMIT 1)");
        res.json({
            binding: binding.length > 0 ? binding : [
                { id: 'b1', name: 'Jilid Lakban Biasa', price: 3000 },
                { id: 'b2', name: 'Jilid Spiral Kawat', price: 15000 }
            ],
            print: print.length > 0 ? print : [
                { id: 'p1', name: 'Print B/W A4', price: 500 },
                { id: 'p2', name: 'Print Warna A4', price: 1000 }
            ]
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data harga publik' });
    }
});

module.exports = router;
