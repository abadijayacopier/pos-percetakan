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
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');

        // 1. Tabel Aturan Harga Berjenjang (tiered_pricing_rules)
        console.log('Membuat tabel tiered_pricing_rules...');
        await conn.query(`
            CREATE TABLE tiered_pricing_rules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id VARCHAR(50) NOT NULL,
                min_kuantitas INT NOT NULL,
                max_kuantitas INT DEFAULT NULL,
                diskon_persen DECIMAL(5,2) DEFAULT 0,
                harga_per_unit_akhir DECIMAL(10,2) NOT NULL,
                urutan_tier INT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Tabel tiered_pricing_rules berhasil dibuat.');

        // 2. Tabel Log Perubahan Harga (pricing_logs)
        console.log('Membuat tabel pricing_logs...');
        await conn.query(`
            CREATE TABLE pricing_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id VARCHAR(50) NOT NULL,
                user_id VARCHAR(50) NOT NULL,
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

        // Kita menyisipkan kategori dummy ke tabel categories yang sudah ada 
        const dummyCategoryId = 'cat-dummy-1';
        await conn.query(`
            INSERT IGNORE INTO categories (id, name, type) VALUES 
            (?, 'Percetakan Offset', 'percetakan_supply')
        `, [dummyCategoryId]);

        // Seed Produk ke tabel existing products
        const dummyProduct1 = 'prod-dummy-1';
        const dummyProduct2 = 'prod-dummy-2';
        await conn.query(`
            INSERT IGNORE INTO products (id, code, name, category_id, buy_price, sell_price, stock, unit) VALUES 
            (?, 'PR-OFF-01', 'Buku Nota A5 NCR 2 Play', ?, 15000, 25000, 100, 'Buku'),
            (?, 'PR-OFF-02', 'Kartu Nama Premium 260gr', ?, 20000, 35000, 50, 'Box')
        `, [dummyProduct1, dummyCategoryId, dummyProduct2, dummyCategoryId]);

        // Seed Harga Berjenjang (Buku Nota)
        await conn.query(`
            INSERT INTO tiered_pricing_rules 
            (product_id, min_kuantitas, max_kuantitas, diskon_persen, harga_per_unit_akhir, urutan_tier) 
            VALUES 
            (?, 1, 10, 0, 25000, 1),
            (?, 11, 50, 10, 22500, 2),
            (?, 51, NULL, 25, 18750, 3)
        `, [dummyProduct1, dummyProduct1, dummyProduct1]);

        // Seed Harga Berjenjang (Kartu Nama)
        await conn.query(`
            INSERT INTO tiered_pricing_rules 
            (product_id, min_kuantitas, max_kuantitas, diskon_persen, harga_per_unit_akhir, urutan_tier) 
            VALUES 
            (?, 1, 5, 0, 35000, 1),
            (?, 6, 20, 5, 33250, 2),
            (?, 21, NULL, 15, 29750, 3)
        `, [dummyProduct2, dummyProduct2, dummyProduct2]);

        // Cari satu admin untuk user_id di log
        const [users] = await conn.query('SELECT id FROM users LIMIT 1');
        const adminId = users.length > 0 ? users[0].id : null;

        if (adminId) {
            await conn.query(`
                INSERT INTO pricing_logs (product_id, user_id, payload_sebelum, payload_sesudah) VALUES
                (?, ?, NULL, '{"action": "CREATE_INITIAL", "tiers": 3}')
            `, [dummyProduct1, adminId]);
        }

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
