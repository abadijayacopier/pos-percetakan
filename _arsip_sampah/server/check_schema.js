const { pool } = require('./config/database');

async function checkSchema() {
    try {
        const [rows] = await pool.query('DESCRIBE service_orders');
        console.log('--- service_orders table schema ---');
        console.table(rows);

        const [sparepartsRows] = await pool.query('DESCRIBE service_spareparts');
        console.log('\n--- service_spareparts table schema ---');
        console.table(sparepartsRows);

        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
}

checkSchema();
