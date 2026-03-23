const { pool } = require('../config/database');

async function migrateHandovers() {
    try {
        console.log('Mulai migrasi tabel handovers...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS handovers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                transaction_id VARCHAR(50) NOT NULL,
                invoice_no VARCHAR(50),
                customer_name VARCHAR(100),
                receiver_name VARCHAR(100),
                receiver_phone VARCHAR(20),
                notes TEXT,
                handover_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                handover_by VARCHAR(50)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Berhasil membuat tabel handovers');
        process.exit(0);
    } catch (error) {
        console.error('❌ Gagal:', error);
        process.exit(1);
    }
}
migrateHandovers();
