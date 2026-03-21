const { pool } = require('../config/database');

async function run() {
    const conn = await pool.getConnection();
    try {
        await conn.query(`SET NAMES utf8mb4`);

        // 1. PURCHASES (Head of the transaction)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS purchases (
                id VARCHAR(50) PRIMARY KEY,
                invoice_no VARCHAR(50) UNIQUE NOT NULL,
                supplier_id VARCHAR(50) NULL,
                supplier_name VARCHAR(100) NOT NULL DEFAULT 'Umum',
                date DATETIME NOT NULL,
                total_amount INT NOT NULL DEFAULT 0,
                payment_status ENUM('lunas','hutang') NOT NULL DEFAULT 'lunas',
                notes TEXT NULL,
                user_id VARCHAR(50) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_purchases_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB COMMENT='Daftar transaksi barang masuk / pembelian'
        `);
        console.log('✅ Tabel purchases dibuat');

        // 2. PURCHASE ITEMS (Details)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS purchase_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                purchase_id VARCHAR(50) NOT NULL,
                item_type ENUM('product','material') NOT NULL,
                item_id VARCHAR(50) NOT NULL,
                item_name VARCHAR(150) NOT NULL,
                qty DECIMAL(10,2) NOT NULL,
                unit_cost INT NOT NULL DEFAULT 0,
                subtotal INT NOT NULL DEFAULT 0,
                CONSTRAINT fk_purchase_items_parent FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
            ) ENGINE=InnoDB COMMENT='Detail item dari transaksi pembelian'
        `);
        console.log('✅ Tabel purchase_items dibuat');

        console.log('\\n🎉 Migrasi purchases selesai!\\n');
        conn.release();
        process.exit(0);

    } catch (err) {
        conn.release();
        console.error('\\n❌ Migrasi GAGAL:', err.message);
        process.exit(1);
    }
}

run();
