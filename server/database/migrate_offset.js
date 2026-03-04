/**
 * migrate_offset.js
 * Migrasi untuk fitur Cetak Offset & Nota
 */
'use strict';

const { pool } = require('../config/database');

async function run() {
    const conn = await pool.getConnection();
    try {
        await conn.query(`SET NAMES utf8mb4`);

        // Reset tables (development only, safe since it's just created)
        await conn.query(`SET FOREIGN_KEY_CHECKS = 0`);
        await conn.query(`DROP TABLE IF EXISTS offset_orders, design_sessions, pricing_rules, product_options, offset_products`);
        await conn.query(`SET FOREIGN_KEY_CHECKS = 1`);

        // 1. offset_products
        await conn.query(`
            CREATE TABLE IF NOT EXISTS offset_products (
                id VARCHAR(50) PRIMARY KEY,
                nama_produk VARCHAR(100) NOT NULL,
                deskripsi_singkat TEXT,
                harga_base DECIMAL(10,2) NOT NULL DEFAULT 0,
                satuan VARCHAR(20) NOT NULL,
                is_best_seller BOOLEAN DEFAULT FALSE,
                image_url VARCHAR(500)
            ) ENGINE=InnoDB COMMENT='Master Katalog Produk Offset';
        `);
        console.log('✅ Tabel offset_products');

        // 2. product_options
        await conn.query(`
            CREATE TABLE IF NOT EXISTS product_options (
                id VARCHAR(50) PRIMARY KEY,
                product_id VARCHAR(50) NOT NULL,
                kategori_opsi ENUM('Ukuran', 'Rangkap', 'Finishing', 'Bahan', 'Lainnya') NOT NULL,
                label_opsi VARCHAR(100) NOT NULL,
                tambahan_biaya DECIMAL(10,2) NOT NULL DEFAULT 0,
                CONSTRAINT fk_po_product FOREIGN KEY (product_id) REFERENCES offset_products(id) ON DELETE CASCADE
            ) ENGINE=InnoDB COMMENT='Variabel spesifikasi produk';
        `);
        console.log('✅ Tabel product_options');

        // 3. offset_orders
        await conn.query(`
            CREATE TABLE IF NOT EXISTS offset_orders (
                id VARCHAR(50) PRIMARY KEY,
                order_number VARCHAR(50) UNIQUE NOT NULL,
                product_id VARCHAR(50) NULL,
                customer_id VARCHAR(50) NULL,
                qty INT NOT NULL DEFAULT 1,
                spesifikasi_json TEXT NULL,
                total_estimasi_produksi DECIMAL(12,2) NOT NULL DEFAULT 0,
                total_biaya_desain DECIMAL(12,2) NOT NULL DEFAULT 0,
                grand_total DECIMAL(12,2) NOT NULL DEFAULT 0,
                status_order ENUM('Pending', 'Printing', 'Finished') NOT NULL DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_oo_product FOREIGN KEY (product_id) REFERENCES offset_products(id) ON DELETE SET NULL,
                CONSTRAINT fk_oo_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
            ) ENGINE=InnoDB COMMENT='Pesanan cetak offset';
        `);
        console.log('✅ Tabel offset_orders');

        // 4. design_sessions
        await conn.query(`
            CREATE TABLE IF NOT EXISTS design_sessions (
                id VARCHAR(50) PRIMARY KEY,
                technician_id VARCHAR(50) NULL,
                order_id VARCHAR(50) NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME NULL,
                current_duration INT NOT NULL DEFAULT 0,
                hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 50000,
                status ENUM('Running', 'Paused', 'Completed') NOT NULL DEFAULT 'Running',
                CONSTRAINT fk_ds_technician FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
                CONSTRAINT fk_ds_order FOREIGN KEY (order_id) REFERENCES offset_orders(id) ON DELETE SET NULL
            ) ENGINE=InnoDB COMMENT='Timer Desain per order offset';
        `);
        console.log('✅ Tabel design_sessions');

        // 5. pricing_rules
        await conn.query(`
            CREATE TABLE IF NOT EXISTS pricing_rules (
                id VARCHAR(50) PRIMARY KEY,
                product_id VARCHAR(50) NOT NULL,
                min_qty INT NOT NULL DEFAULT 0,
                max_qty INT NOT NULL DEFAULT 0,
                unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
                CONSTRAINT fk_pr_product FOREIGN KEY (product_id) REFERENCES offset_products(id) ON DELETE CASCADE
            ) ENGINE=InnoDB COMMENT='Harga grosir/berjenjang offset';
        `);
        console.log('✅ Tabel pricing_rules');

        // Seed Default offset_products
        await conn.query(`
            INSERT IGNORE INTO offset_products (id, nama_produk, deskripsi_singkat, harga_base, satuan, is_best_seller) VALUES
            ('op1', 'Cetak Nota', 'Rangkap/NCR (2-4 Ply) - Ukuran Custom (A4, A5, 1/3 A4)', 25000, 'buku', TRUE),
            ('op2', 'Cetak Buku', 'Hard/Soft Cover Laminating - Jumlah Buku Min. 50 Eks', 50000, 'eks', FALSE),
            ('op3', 'Cetak Kalender', 'Kalender Dinding & Meja - Kertas Art Paper / Ivory', 15000, 'pcs', FALSE),
            ('op4', 'Kartu Nama', 'Standar & Premium (Spot UV) - Min. Order 1 Box (100 lbr)', 35000, 'box', FALSE)
        `);
        console.log('✅ Seed Default Data: offset_products');

        // Seed product_options untuk Nota
        await conn.query(`
            INSERT IGNORE INTO product_options (id, product_id, kategori_opsi, label_opsi, tambahan_biaya) VALUES
            ('po1', 'op1', 'Rangkap', '2 Ply', 0),
            ('po2', 'op1', 'Rangkap', '3 Ply', 5000),
            ('po3', 'op1', 'Rangkap', '4 Ply', 10000),
            ('po4', 'op1', 'Ukuran', 'A4 (21 x 29.7 cm)', 15000),
            ('po5', 'op1', 'Ukuran', 'A5 (14.8 x 21 cm)', 0),
            ('po6', 'op1', 'Ukuran', '1/3 A4 (10 x 21 cm)', -5000)
        `);
        console.log('✅ Seed Default Data: product_options (Nota)');

        console.log('\n🎉 Migrasi Offset Berhasil Dijalankan!');
    } catch (err) {
        console.error('\n❌ Migrasi Offset GAGAL:', err.message);
    } finally {
        conn.release();
        process.exit(0);
    }
}

run();
