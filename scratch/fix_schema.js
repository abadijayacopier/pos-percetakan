const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

async function fixSchema() {
    const configPath = path.join(__dirname, '..', 'server', 'database', 'db-config.json');
    let cfg = {};
    try {
        if (fs.existsSync(configPath)) {
            cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    } catch (e) {
        console.error('Gagal membaca db-config.json');
        process.exit(1);
    }

    const connection = await mysql.createConnection({
        host: cfg.DB_HOST || 'localhost',
        user: cfg.DB_USER || 'root',
        password: cfg.DB_PASS || 'admin',
        database: cfg.DB_NAME || 'pos_abadi'
    });

    console.log('--- Memulai Perbaikan Schema ---');

    try {
        // 1. Fix activity_log
        console.log('Memeriksa activity_log...');
        const [columns] = await connection.query('SHOW COLUMNS FROM activity_log');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('target')) {
            console.log('Menambahkan kolom "target" ke activity_log...');
            await connection.query('ALTER TABLE activity_log ADD COLUMN target VARCHAR(50) DEFAULT NULL AFTER action');
        }

        if (!columnNames.includes('ip_address')) {
            console.log('Menambahkan kolom "ip_address" ke activity_log...');
            await connection.query('ALTER TABLE activity_log ADD COLUMN ip_address VARCHAR(45) DEFAULT NULL AFTER detail');
        }

        // 2. Fix print_orders (jika total_harga belum diganti ke total_price)
        // Sebenarnya di migrate.js sudah total_price, tapi jaga-jaga
        console.log('Memeriksa print_orders...');
        const [printCols] = await connection.query('SHOW COLUMNS FROM print_orders');
        const printColNames = printCols.map(c => c.Field);
        if (printColNames.includes('total_harga') && !printColNames.includes('total_price')) {
            console.log('Rename total_harga -> total_price di print_orders...');
            await connection.query('ALTER TABLE print_orders CHANGE total_harga total_price INT NOT NULL');
        }

        console.log('✅ Schema berhasil diperbaiki!');
    } catch (err) {
        console.error('❌ Gagal memperbaiki schema:', err.message);
    } finally {
        await connection.end();
    }
}

fixSchema();
