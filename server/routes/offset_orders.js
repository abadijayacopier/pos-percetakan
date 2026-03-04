const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// 1. GET /api/offset-orders/form-data
// Mengambil data untuk dropdown (customers, produk offset, dll)
router.get('/form-data', verifyToken, async (req, res) => {
    try {
        const [customers] = await pool.query('SELECT id, name, phone FROM customers ORDER BY name ASC');
        const [products] = await pool.query('SELECT id, nama_produk, harga_base, satuan, is_best_seller FROM offset_products ORDER BY nama_produk ASC');

        // Sengaja mengirim array kosong jika tabel belum ada isinya untuk opsi
        // (opsional: ambil product_options dan pricing_rules jika kalkulasi butuh dari server)

        res.json({ customers, products });
    } catch (error) {
        console.error('Error fetching form data:', error);
        res.status(500).json({ message: 'Gagal memuat data form.' });
    }
});

// 2. POST /api/offset-orders
// Menyimpan pesanan offset baru
router.post('/', verifyToken, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            customer_id,
            spesifikasi,      // Object berisi kategori, material, ukuran, finishing, catatan
            qty,
            total_estimasi,
            metode_pembayaran
        } = req.body;

        // Validasi input
        if (!qty || qty <= 0) throw new Error('Jumlah pesanan tidak valid.');

        // 1. Ambil Harga Dasar & Kalkulasi Harga Grosir dari DB
        const [productRows] = await conn.query('SELECT sell_price FROM products WHERE id = ?', [spesifikasi.product_id || 1]);
        const basePrice = productRows.length > 0 ? productRows[0].sell_price : 5000;

        const [rules] = await conn.query(`
            SELECT harga_per_unit_akhir 
            FROM tiered_pricing_rules 
            WHERE product_id = ? AND min_kuantitas <= ? AND (max_kuantitas IS NULL OR max_kuantitas >= ?)
            ORDER BY urutan_tier DESC LIMIT 1
        `, [spesifikasi.product_id || 1, qty, qty]);

        const hargaSatuan = rules.length > 0 ? rules[0].harga_per_unit_akhir : basePrice;

        // 2. Kalkulasi Biaya Tambahan (Material, Finishing, dsb)
        // Di aplikasi penuh ini dikueri dari DB, disini kita simulasi sesuai frontend 
        const biayaCetak = hargaSatuan * qty;
        const biayaMaterial = (spesifikasi.material || '').includes('Carton') ? 125000 : 75000;
        const biayaFinishing = (spesifikasi.finishing || []).includes('Laminasi Glossy') ? 75000 : 0;
        const biayaDesain = 50000;

        let calculatedGrandTotal = biayaCetak + biayaMaterial + biayaFinishing + biayaDesain;

        // Buat order_number: OFF-{TIMESTAMP}
        const orderNumber = `OFF-${Date.now()}`;
        const orderId = `oo-${Date.now()}`;

        // Insert ke tabel offset_orders
        await conn.query(`
            INSERT INTO offset_orders (
                id, order_number, customer_id, qty, spesifikasi_json, 
                total_estimasi_produksi, grand_total, status_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
        `, [
            orderId,
            orderNumber,
            customer_id || null, // null jika tamu
            qty,
            JSON.stringify(spesifikasi),
            calculatedGrandTotal,
            calculatedGrandTotal
        ]);

        // (Opsional) Jika perlu mencatat ke transaksi / cash_flow langsung
        // Tergantung workflow yang disepakati, tapi kita simpan ordernya dulu.

        await conn.commit();
        res.status(201).json({
            success: true,
            message: 'Pesanan cetak offset berhasil dibuat!',
            order_id: orderId,
            order_number: orderNumber
        });

    } catch (error) {
        await conn.rollback();
        console.error('Error creating offset order:', error);
        res.status(400).json({ message: error.message || 'Gagal membuat pesanan.' });
    } finally {
        conn.release();
    }
});

module.exports = router;
