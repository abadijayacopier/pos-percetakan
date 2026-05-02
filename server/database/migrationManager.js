const { getActivePool, currentDbType } = require('../config/database');

const runMigrations = async () => {
    try {
        console.log('🚀 Checking database migrations...');
        const db = await getActivePool();

        if (currentDbType === 'sqlite') {
            const tableInfo = await db.all('PRAGMA table_info(transactions)');
            const columns = tableInfo.map(c => c.name);

            if (!columns.includes('notes')) {
                console.log('➕ SQLite: Adding notes column to transactions...');
                await db.exec('ALTER TABLE transactions ADD COLUMN notes TEXT DEFAULT NULL');
            }
            if (!columns.includes('customer_wa')) {
                console.log('➕ SQLite: Adding customer_wa column to transactions...');
                await db.exec('ALTER TABLE transactions ADD COLUMN customer_wa VARCHAR(20) DEFAULT NULL');
            }
            if (!columns.includes('tax_amount')) {
                console.log('➕ SQLite: Adding tax_amount column to transactions...');
                await db.exec('ALTER TABLE transactions ADD COLUMN tax_amount INTEGER DEFAULT 0');
            }
        } else {
            const [rows] = await db.query('SHOW COLUMNS FROM transactions');
            const columns = rows.map(r => r.Field);

            if (!columns.includes('notes')) {
                console.log('➕ MySQL: Adding notes column to transactions...');
                await db.query('ALTER TABLE transactions ADD COLUMN notes TEXT DEFAULT NULL');
            }
            if (!columns.includes('customer_wa')) {
                console.log('➕ MySQL: Adding customer_wa column to transactions...');
                await db.query('ALTER TABLE transactions ADD COLUMN customer_wa VARCHAR(20) DEFAULT NULL AFTER customer_name');
            }
            if (!columns.includes('tax_amount')) {
                console.log('➕ MySQL: Adding tax_amount column to transactions...');
                await db.query('ALTER TABLE transactions ADD COLUMN tax_amount INTEGER DEFAULT 0 AFTER discount');
            }

            // Ensure log_notifikasi_wa exists
            const createLogTable = `
                CREATE TABLE IF NOT EXISTS log_notifikasi_wa (
                    id_log INT AUTO_INCREMENT PRIMARY KEY,
                    id_transaksi VARCHAR(50),
                    status_kirim ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
                    pesan_error TEXT,
                    waktu_kirim DATETIME DEFAULT CURRENT_TIMESTAMP,
                    jumlah_percobaan INT DEFAULT 0,
                    FOREIGN KEY (id_transaksi) REFERENCES transactions(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
            `;
            await db.query(createLogTable);
        }

        // --- SALARY & TAX MIGRATION ---
        try {
            const { migrate: migrateSalary } = require('./migrate_salary_tax');
            await migrateSalary();
        } catch (salErr) {
            console.error('⚠️ Salary Migration Error:', salErr.message);
        }

        console.log('✅ Migrations checked and applied!');
    } catch (error) {
        console.error('❌ Migration Error:', error.message);
        // Don't crash the server, but log it
    }
};

module.exports = { runMigrations };
