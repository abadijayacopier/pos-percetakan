const { getActivePool, initSqlite, currentDbType } = require('../config/database');

const patch = async () => {
    try {
        console.log('🚀 Memulai patch database untuk tabel transactions...');

        if (currentDbType === 'sqlite') {
            const db = await initSqlite();

            // SQLite: Check and add columns
            const tableInfo = await db.all('PRAGMA table_info(transactions)');
            const columns = tableInfo.map(c => c.name);

            if (!columns.includes('customer_wa')) {
                console.log('➕ SQLite: Menambahkan kolom customer_wa...');
                await db.exec('ALTER TABLE transactions ADD COLUMN customer_wa VARCHAR(20) DEFAULT NULL');
            }

            if (!columns.includes('tax_amount')) {
                console.log('➕ SQLite: Menambahkan kolom tax_amount...');
                await db.exec('ALTER TABLE transactions ADD COLUMN tax_amount INTEGER DEFAULT 0');
            }

            // Check settings table
            await db.exec('CREATE TABLE IF NOT EXISTS settings (`id` INTEGER PRIMARY KEY AUTO_INCREMENT, `key` VARCHAR(100) UNIQUE NOT NULL, `value` TEXT)');

        } else {
            const pool = await getActivePool();

            // MySQL: Check and add columns
            const [rows] = await pool.query('SHOW COLUMNS FROM transactions');
            const columns = rows.map(r => r.Field);

            if (!columns.includes('customer_wa')) {
                console.log('➕ MySQL: Menambahkan kolom customer_wa...');
                await pool.query('ALTER TABLE transactions ADD COLUMN customer_wa VARCHAR(20) DEFAULT NULL AFTER customer_name');
            }

            if (!columns.includes('tax_amount')) {
                console.log('➕ MySQL: Menambahkan kolom tax_amount...');
                await pool.query('ALTER TABLE transactions ADD COLUMN tax_amount INTEGER DEFAULT 0 AFTER discount');
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
            await pool.query(createLogTable);
        }

        console.log('✅ Patch database selesai!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Patch Gagal:', error);
        process.exit(1);
    }
};

patch();
