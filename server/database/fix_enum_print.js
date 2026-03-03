require('dotenv').config({ path: __dirname + '/../.env' });
const { pool } = require('../config/database');

async function fixEnumPrint() {
    try {
        const connection = await pool.getConnection();
        console.log('Altering print_orders status ENUM...');
        await connection.query(`
      ALTER TABLE print_orders
      MODIFY COLUMN status ENUM('pending', 'desain', 'approval', 'cetak', 'selesai', 'diambil', 'batal') DEFAULT 'pending'
    `);
        console.log('✅ ALTER TABLE print_orders SUCCESS');
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixEnumPrint();
