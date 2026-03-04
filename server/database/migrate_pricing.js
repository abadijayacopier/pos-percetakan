require('dotenv').config();
const { pool } = require('../config/database');

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('Memulai migrasi skema tabel Harga Grosir & Berjenjang...');

        // Menonaktifkan foreign key checks untuk drop table
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.query('DROP TABLE IF EXISTS pricing_logs');
        await conn.query('DROP TABLE IF EXISTS tiered_pricing_rules');
        await conn.query('DROP TABLE IF EXISTS products');
        await conn.query('DROP TABLE IF EXISTS categories');
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');

        // 1. Tabel Kategori (categories)
        console.log('Membuat tabel categories...');
        await conn.query(`
            CREATE TABLE categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_kategori VARCHAR(100) NOT NULL UNIQUE
            )
        `);
        console.log('✓ Tabel categories berhasil dibuat.');

        // 2. Tabel Produk (products)
        console.log('Membuat tabel products...');
        await conn.query(`
            CREATE TABLE products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_produk VARCHAR(200) NOT NULL,
                kategori_id INT NOT NULL,
                harga_dasar DECIMAL(10,2) NOT NULL DEFAULT 0,
                satuan VARCHAR(50) NOT NULL,
                FOREIGN KEY (kategori_id) REFERENCES categories(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Tabel products berhasil dibuat.');

        // 3. Tabel Aturan Harga Berjenjang (tiered_pricing_rules)
        console.log('Membuat tabel tiered_pricing_rules...');
        await conn.query(`
            CREATE TABLE tiered_pricing_rules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                min_kuantitas INT NOT NULL,
                max_kuantitas INT DEFAULT NULL,
                diskon_persen DECIMAL(5,2) DEFAULT 0,
                harga_per_unit_akhir DECIMAL(10,2) NOT NULL,
                urutan_tier INT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Tabel tiered_pricing_rules berhasil dibuat.');

        // 4. Tabel Log Perubahan Harga (pricing_logs)
        console.log('Membuat tabel pricing_logs...');
        await conn.query(`
            CREATE TABLE pricing_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                user_id INT NOT NULL,
                payload_sebelum TEXT,
                payload_sesudah TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Tabel pricing_logs berhasil dibuat.');

        // --- SEEDING DATA DUMMY ---
        console.log('\nMenyisipkan data contoh (seeding)...');

        // Seed Kategori
        await conn.query(`
            INSERT INTO categories (nama_kategori) VALUES 
            ('Digital Printing'), ('Offset'), ('ATK (Alat Tulis Kantor)')
        `);

        // Seed Produk
        await conn.query(`
            INSERT INTO products (nama_produk, kategori_id, harga_dasar, satuan) VALUES 
            ('Buku Nota A5 NCR 2 Play', 2, 25000, 'Buku'),
            ('Kartu Nama Premium 260gr', 2, 35000, 'Box'),
            ('Banner Outdoor (m2)', 1, 20000, 'Meter')
        `);

        // Seed Harga Berjenjang (Buku Nota - ID 1)
        await conn.query(`
            INSERT INTO tiered_pricing_rules 
            (product_id, min_kuantitas, max_kuantitas, diskon_persen, harga_per_unit_akhir, urutan_tier) 
            VALUES 
            (1, 1, 10, 0, 25000, 1),
            (1, 11, 50, 10, 22500, 2),
            (1, 51, NULL, 25, 18750, 3)
        `);

        // Seed Harga Berjenjang (Kartu Nama - ID 2)
        await conn.query(`
            INSERT INTO tiered_pricing_rules 
            (product_id, min_kuantitas, max_kuantitas, diskon_persen, harga_per_unit_akhir, urutan_tier) 
            VALUES 
            (2, 1, 5, 0, 35000, 1),
            (2, 6, 20, 5, 33250, 2),
            (2, 21, NULL, 15, 29750, 3)
        `);

        // Seed Setup Log Harga (Asumsi user_id = 1 adalah admin)
        await conn.query(`
            INSERT INTO pricing_logs (product_id, user_id, payload_sebelum, payload_sesudah) VALUES
            (1, 1, NULL, '{"action": "CREATE_INITIAL", "tiers": 3}')
        `);

        console.log('✓ Data contoh berhasil disisipkan.');

        console.log('\n✅ Migrasi tabel Harga Grosir & Berjenjang SELECTSELESAI!');

    } catch (error) {
        console.error('\n❌ Terjadi kesalahan saat migrasi:', error);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

migrate();
