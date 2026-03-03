const { pool } = require('../config/database');

async function fixEnum() {
    try {
        const connection = await pool.getConnection();
        console.log('Altering service_orders status ENUM...');
        await connection.query(`
      ALTER TABLE service_orders
      MODIFY COLUMN status ENUM('diterima', 'diagnosa', 'approval', 'tunggu_part', 'pengerjaan', 'testing', 'selesai', 'diambil', 'batal') DEFAULT 'diterima'
    `);
        console.log('✅ ALTER TABLE SUCCESS');
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixEnum();
