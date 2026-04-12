const { pool } = require('../config/database');

const migrate = async () => {
    try {
        console.log('🚀 Memulai migrasi log_notifikasi_wa...');

        // 1. Tambah kolom customer_wa ke tabel transactions jika belum ada
        const [trxColumns] = await pool.query('SHOW COLUMNS FROM transactions LIKE "customer_wa"');
        if (trxColumns.length === 0) {
            console.log('➕ Menambahkan kolom customer_wa ke tabel transactions...');
            await pool.query('ALTER TABLE transactions ADD COLUMN customer_wa VARCHAR(20) DEFAULT NULL AFTER customer_name');
        } else {
            console.log('✅ Kolom customer_wa sudah ada.');
        }

        // 2. Buat tabel log_notifikasi_wa
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
        console.log('✅ Tabel log_notifikasi_wa siap.');

        console.log('🎉 Migrasi WhatsApp Logging selesai!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migrasi Gagal:', error);
        process.exit(1);
    }
};

migrate();
