const { pool } = require('./config/database');

async function migrate() {
    const connection = await pool.getConnection();
    try {
        console.log('Starting migration...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // 1. Modifikasi service_orders.id ke INT AUTO_INCREMENT
        // Kita harus berhati-hati jika ada data yang sudah ada. 
        // Jika data lama adalah string, kita mungkin perlu membersihkannya.
        // Tapi biasanya id di sini baru dibuat atau kosong jika gagal terus.
        console.log('Converting service_orders.id to INT...');
        await connection.query('ALTER TABLE service_orders MODIFY id INT AUTO_INCREMENT');

        // 2. Modifikasi service_spareparts.service_order_id ke INT
        console.log('Converting service_spareparts.service_order_id to INT...');
        await connection.query('ALTER TABLE service_spareparts MODIFY service_order_id INT');

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Migration SUCCESSFUL');
        process.exit(0);
    } catch (error) {
        console.error('Migration FAILED:', error);
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        process.exit(1);
    } finally {
        connection.release();
    }
}

migrate();
