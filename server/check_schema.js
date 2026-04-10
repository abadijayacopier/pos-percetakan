const { pool } = require('./config/database');

async function checkSchema() {
    try {
        const [rows] = await pool.query('DESCRIBE service_orders');
        console.log('--- service_orders columns ---');
        console.table(rows);

        const [spRows] = await pool.query('DESCRIBE service_spareparts');
        console.log('--- service_spareparts columns ---');
        console.table(spRows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
