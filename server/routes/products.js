const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// 1. GET Semua Produk (Publik untuk user yang login)
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
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

// 1b. GET Produk (Publik tanpa auth untuk Landing Page)
router.get('/public', async (req, res) => {
    try {
        const [rows] = await pool.query(`
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
        const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
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

        await pool.query(
            'INSERT INTO categories (id, name, emoji) VALUES (?, ?, ?)',
            [newId, name, emoji || '📁']
        );
        res.status(201).json({ message: 'Kategori berhasil ditambahkan!', id: newId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menambah kategori' });
    }
});

// 3. POST Tambah Produk Baru (Kasir & Admin)
router.post('/', verifyToken, requireRole(['kasir', 'admin']), upload.single('image'), async (req, res) => {
    try {
        const { code, name, categoryId, buyPrice, sellPrice, stock, minStock, unit, emoji } = req.body;
        const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : null;

        // Cek apakah kode unik
        const [existing] = await pool.query('SELECT id FROM products WHERE code = ?', [code]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Kode produk ini sudah dipakai!' });
        }

        const validCategoryId = (categoryId && categoryId !== 'null' && categoryId !== 'undefined' && String(categoryId).trim() !== '') ? categoryId : null;

        const newId = 'p' + Date.now();
        await pool.query(`
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

// 4. PUT Update Produk (Kasir & Admin)
router.put('/:id', verifyToken, requireRole(['kasir', 'admin']), upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, categoryId, buyPrice, sellPrice, stock, minStock, unit, emoji } = req.body;
        const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : null;

        // Pastikan code tidak nabrak punya orang lain
        const [existing] = await pool.query('SELECT id FROM products WHERE code = ? AND id != ?', [code, id]);
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

        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }

        res.json({ message: 'Produk berhasil diperbarui!', image: imageUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal update produk' });
    }
});

// 5. DELETE Hapus Produk (Hanya Admin)
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }

        res.json({ message: 'Produk berhasil dihapus!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menghapus produk (Mungkin karena sudah digunakan pada transaksi)' });
    }
});

// 6. POST Stok Opname (Sesuaikan Stok Aktual Fisik)
router.post('/:id/opname', verifyToken, requireRole(['admin', 'kasir', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        const { actualStock, notes } = req.body;

        if (actualStock === undefined || actualStock < 0) {
            return res.status(400).json({ message: 'Stok aktual harus diisi dengan angka valid' });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Cek stok sistem saat ini
            const [rows] = await connection.query('SELECT stock, name FROM products WHERE id = ?', [id]);
            if (rows.length === 0) throw new Error('Produk tidak ditemukan');

            const systemStock = rows[0].stock;
            const diff = actualStock - systemStock;

            // Jika sama, abaikan saja
            if (diff === 0) {
                await connection.rollback();
                connection.release();
                return res.json({ message: 'Stok sudah sesuai, tidak ada selisih.' });
            }

            // Update stok di tabel produk
            await connection.query('UPDATE products SET stock = ? WHERE id = ?', [actualStock, id]);

            // Catat ke stock_movements (tipe 'adjust')
            await connection.query(
                `INSERT INTO stock_movements (product_id, type, qty, reference, notes) 
                 VALUES (?, 'adjust', ?, 'Opname', ?)`,
                [id, diff, notes || `Penyesuaian stok opname (${systemStock} -> ${actualStock})`]
            );

            // Jika ada selisih, catat aktivitas kasir yang mengopname
            await connection.query(
                'INSERT INTO activity_log (user_id, user_name, action, detail) VALUES (?, ?, ?, ?)',
                [req.user.id, req.user.name, 'stok_opname', `Opname ${rows[0].name}: Fisik ${actualStock} (Selisih ${diff > 0 ? '+' + diff : diff})`]
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

module.exports = router;
