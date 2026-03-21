const { pool } = require('../config/database');

const MIGRATION_NAME = 'migrate_suppliers';

async function migrate() {
    console.log(`\n=== MENJALANKAN MIGRASI: ${MIGRATION_NAME} ===`);

    let conn;
    try {
        conn = await pool.getConnection();

        // Buat tabel Suppliers
        await conn.query(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                contact_person VARCHAR(100),
                phone VARCHAR(20),
                address TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Tabel `suppliers` berhasil diverifikasi/dibuat.');

        console.log(`=== MIGRASI ${MIGRATION_NAME} SELESAI ===\n`);
        process.exit(0);
    } catch (error) {
        console.error(`❌ GAGAL MENJALANKAN MIGRASI ${MIGRATION_NAME}:`, error);
        process.exit(1);
    } finally {
        if (conn) {
            conn.release();
        }
    }
}

migrate();
