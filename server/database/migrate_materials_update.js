const { pool } = require('../config/database');

async function migrate() {
    console.log('🔄 Memulai update tabel materials...');
    try {
        const conn = await pool.getConnection();

        try {
            console.log('1. Mengubah struktur kolom pada tabel materials...');

            // Menambahkan kolom baru jika belum ada
            // Kita coba tambahkan satu per satu dan hiraukan error jika kolom sudah ada.
            const addColumns = [
                'ALTER TABLE materials ADD COLUMN barcode VARCHAR(50) UNIQUE DEFAULT NULL AFTER id',
                'ALTER TABLE materials ADD COLUMN lokasi_rak VARCHAR(100) DEFAULT NULL AFTER stok_minimum',
                'ALTER TABLE materials ADD COLUMN supplier_id VARCHAR(50) DEFAULT NULL AFTER lokasi_rak'
            ];

            for (const sql of addColumns) {
                try {
                    await conn.query(sql);
                    console.log(` ✅ Eksekusi berhasil: ${sql.split('ADD COLUMN')[1]}`);
                } catch (e) {
                    if (e.code === 'ER_DUP_FIELDNAME') {
                        console.log(` ℹ️ Kolom sudah ada, di-skip: ${sql.split('ADD COLUMN')[1]}`);
                    } else {
                        throw e;
                    }
                }
            }

            // Mengubah tipe ENUM menjadi VARCHAR pada kategori dan satuan agar dinamis
            console.log('2. Mengubah tipe enum kategori dan satuan ke VARCHAR(50)...');
            await conn.query(`
                ALTER TABLE materials 
                MODIFY COLUMN kategori VARCHAR(50) NOT NULL DEFAULT 'digital',
                MODIFY COLUMN satuan VARCHAR(50) NOT NULL DEFAULT 'm2'
            `);
            console.log(' ✅ Berhasil mengubah tipe kategori dan satuan.');

            console.log('\n✅ UPDATE DATABASE SELESAI!');
        } finally {
            conn.release();
            await pool.end();
        }
    } catch (err) {
        console.error('❌ Terjadi kesalahan migrasi:', err);
        process.exit(1);
    }
}

migrate();
