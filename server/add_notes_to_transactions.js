require('dotenv').config();
const { getActivePool, initSqlite, currentDbType } = require('./config/database');

const migrate = async () => {
    try {
        console.log('🚀 Menambahkan kolom notes ke tabel transactions...');

        if (currentDbType === 'sqlite') {
            const db = await initSqlite();
            const tableInfo = await db.all('PRAGMA table_info(transactions)');
            const columns = tableInfo.map(c => c.name);

            if (!columns.includes('notes')) {
                await db.exec('ALTER TABLE transactions ADD COLUMN notes TEXT DEFAULT NULL');
                console.log('✅ SQLite: Kolom notes berhasil ditambahkan.');
            } else {
                console.log('ℹ️ SQLite: Kolom notes sudah ada.');
            }
        } else {
            const pool = await getActivePool();
            const [rows] = await pool.query('SHOW COLUMNS FROM transactions');
            const columns = rows.map(r => r.Field);

            if (!columns.includes('notes')) {
                await pool.query('ALTER TABLE transactions ADD COLUMN notes TEXT DEFAULT NULL');
                console.log('✅ MySQL: Kolom notes berhasil ditambahkan.');
            } else {
                console.log('ℹ️ MySQL: Kolom notes sudah ada.');
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Migrasi Gagal:', error.message);
        process.exit(1);
    }
};

migrate();
