const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TenantManager = require('../utils/tenantManager');
const { getTenantPool } = require('../config/database');

const uploadDir = path.join(__dirname, '../public/uploads/products');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

// 1. GET Semua Produk (Authenticated)
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(`
      SELECT p.id, p.code, p.name, p.category_id as categoryId, 
             p.buy_price as buyPrice, p.sell_price as sellPrice, 
             p.stock, p.min_stock as minStock, p.unit, p.emoji, p.image,
             c.name as category_name, c.emoji as category_emoji 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name ASC
    `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal memuat produk' });
    }
});

// 1b. GET Produk (Publik untuk Landing Page - SaaS Aware)
router.get('/public', async (req, res) => {
    try {
        const shopId = req.query.shopId || req.header('X-Shop-Id');
        if (!shopId) return res.status(400).json({ message: 'Shop ID diperlukan untuk melihat katalog.' });

        const dbName = await TenantManager.getShopDBName(shopId);
        if (!dbName) return res.status(404).json({ message: 'Toko tidak ditemukan.' });

        const tenantDb = getTenantPool(dbName);

        const [rows] = await tenantDb.query(`
      SELECT p.id, p.code, p.name, p.category_id as categoryId, 
             p.sell_price as sellPrice, 
             p.stock, p.unit, p.emoji,
             c.name as category_name, c.emoji as category_emoji 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock > 0
      ORDER BY p.name ASC
    `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal memuat katalog produk' });
    }
});


// 2. GET Kategori Produk
router.get('/categories', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM categories ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil kategori' });
    }
});

// 2b. POST Tambah Kategori Produk Baru
router.post('/categories', verifyToken, requireRole(['kasir', 'admin']), async (req, res) => {
    try {
        const { name, emoji } = req.body;
        if (!name) return res.status(400).json({ message: 'Nama kategori wajib diisi' });

        const newId = name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20) + '-' + Date.now().toString().slice(-4);

        await req.db.query(
            'INSERT INTO categories (id, name, emoji) VALUES (?, ?, ?)',
            [newId, name, emoji || '📁']
        );
        res.status(201).json({ message: 'Kategori berhasil ditambahkan!', id: newId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menambah kategori' });
    }
});

// 3. POST Tambah Produk Baru
router.post('/', verifyToken, requireRole(['kasir', 'admin']), upload.single('image'), async (req, res) => {
    try {
        const { code, name, categoryId, buyPrice, sellPrice, stock, minStock, unit, emoji } = req.body;
        const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : null;

        const [existing] = await req.db.query('SELECT id FROM products WHERE code = ?', [code]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Kode produk ini sudah dipakai!' });
        }

        const validCategoryId = (categoryId && categoryId !== 'null' && categoryId !== 'undefined' && String(categoryId).trim() !== '') ? categoryId : null;

        const newId = 'p' + Date.now();
        await req.db.query(`
      INSERT INTO products 
      (id, code, name, category_id, buy_price, sell_price, stock, min_stock, unit, emoji, image) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [newId, code, name, validCategoryId, buyPrice, sellPrice, stock, minStock, unit, emoji || '📦', imageUrl]);

        res.status(201).json({ message: 'Produk berhasil ditambahkan!', id: newId, image: imageUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menyimpan produk' });
    }
});

// 4. PUT Update Produk
router.put('/:id', verifyToken, requireRole(['kasir', 'admin']), upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, categoryId, buyPrice, sellPrice, stock, minStock, unit, emoji } = req.body;
        const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : null;

        const [existing] = await req.db.query('SELECT id FROM products WHERE code = ? AND id != ?', [code, id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Kode produk sudah dipakai oleh produk lain!' });
        }

        const validCategoryId = (categoryId && categoryId !== 'null' && categoryId !== 'undefined' && String(categoryId).trim() !== '') ? categoryId : null;

        let query = `
      UPDATE products 
      SET code = ?, name = ?, category_id = ?, buy_price = ?, sell_price = ?, 
          stock = ?, min_stock = ?, unit = ?, emoji = ?
    `;
        let params = [code, name, validCategoryId, buyPrice, sellPrice, stock, minStock, unit, emoji];

        if (imageUrl) {
            query += `, image = ?`;
            params.push(imageUrl);
        }

        query += ` WHERE id = ?`;
        params.push(id);

        const [result] = await req.db.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }

        res.json({ message: 'Produk berhasil diperbarui!', image: imageUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal update produk' });
    }
});

// 5. DELETE Hapus Produk
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await req.db.query('DELETE FROM products WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }

        res.json({ message: 'Produk berhasil dihapus!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menghapus produk (Mungkin karena sudah digunakan pada transaksi)' });
    }
});

// 6. POST Stok Opname (Individual)
router.post('/:id/opname', verifyToken, requireRole(['admin', 'kasir', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        const { actualStock, notes } = req.body;

        if (actualStock === undefined || actualStock < 0) {
            return res.status(400).json({ message: 'Stok aktual harus diisi dengan angka valid' });
        }

        const connection = await req.db.getConnection();
        try {
            await connection.beginTransaction();

            const [rows] = await connection.query('SELECT stock, name FROM products WHERE id = ?', [id]);
            if (rows.length === 0) throw new Error('Produk tidak ditemukan');

            const systemStock = rows[0].stock;
            const diff = actualStock - systemStock;

            if (diff === 0) {
                await connection.rollback();
                connection.release();
                return res.json({ message: 'Stok sudah sesuai, tidak ada selisih.' });
            }

            await connection.query('UPDATE products SET stock = ? WHERE id = ?', [actualStock, id]);

            await connection.query(
                `INSERT INTO stock_movements (product_id, type, qty, reference, notes) 
                 VALUES (?, 'adjust', ?, 'Opname', ?)`,
                [id, diff, notes || `Penyesuaian stok opname (${systemStock} -> ${actualStock})`]
            );

            // Log activity manually or using refined logger
            await connection.query(
                'INSERT INTO activity_log (user_id, user_name, action, target, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
                [req.user.id, req.user.name, 'STOK_OPNAME', 'Product', `Opname ${rows[0].name}: Fisik ${actualStock} (Selisih ${diff})`, req.ip || null]
            );

            await connection.commit();
            res.json({ message: 'Stok Opname berhasil disimpan', actualStock, diff });
        } catch (dbErr) {
            await connection.rollback();
            throw dbErr;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ message: error.message || 'Gagal melakukan stok opname' });
    }
});

// 7. GET Stock History
router.get('/:id/history', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM stock_movements WHERE product_id = ? ORDER BY date DESC LIMIT 100', [req.params.id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil history stok' });
    }
});

// 8. POST Import Produk (Bulk)
router.post('/import', verifyToken, requireRole(['admin']), async (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Data produk tidak valid' });
    }

    const connection = await req.db.getConnection();
    try {
        await connection.beginTransaction();
        
        for (const item of items) {
            const { code, name, category, buyPrice, sellPrice, stock, minStock, unit } = item;
            
            if (!name) continue; // Skip items without names
            
            const productCode = code || ('PRD-' + Math.random().toString(36).substr(2, 9).toUpperCase());

            // Category lookup
            let finalCategoryId = null;
            if (category) {
                const [cats] = await connection.query('SELECT id FROM categories WHERE name = ? OR id = ?', [category, category]);
                if (cats.length > 0) {
                    finalCategoryId = cats[0].id;
                } else {
                    // Auto-create category if it doesn't exist
                    const newCatId = category.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20) + '-' + Date.now().toString().slice(-4);
                    await connection.query('INSERT INTO categories (id, name, emoji) VALUES (?, ?, ?)', [newCatId, category, '📦']);
                    finalCategoryId = newCatId;
                }
            }

            // Check if exists by code
            const [existing] = await connection.query('SELECT id FROM products WHERE code = ?', [productCode]);
            
            if (existing.length > 0) {
                // Update
                await connection.query(`
                    UPDATE products 
                    SET name = ?, category_id = ?, buy_price = ?, sell_price = ?, 
                        stock = ?, min_stock = ?, unit = ?
                    WHERE code = ?
                `, [name, finalCategoryId, buyPrice || 0, sellPrice || 0, stock || 0, minStock || 0, unit || 'pcs', productCode]);
            } else {
                // Insert
                const newId = 'p' + Date.now() + Math.random().toString(36).substr(2, 5);
                await connection.query(`
                    INSERT INTO products 
                    (id, code, name, category_id, buy_price, sell_price, stock, min_stock, unit, emoji) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [newId, productCode, name, finalCategoryId, buyPrice || 0, sellPrice || 0, stock || 0, minStock || 0, unit || 'pcs', '📦']);
            }
        }

        await connection.commit();
        res.json({ message: `Berhasil mengimpor ${items.length} produk` });
    } catch (error) {
        await connection.rollback();
        console.error('Import error:', error);
        res.status(500).json({ message: 'Gagal mengimpor data produk' });
    } finally {
        connection.release();
    }
});

module.exports = router;
