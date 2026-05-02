const { pool } = require('./config/database');

async function checkSchema() {
    try {
        console.log('--- SCANNING SERVICE_ORDERS SCHEMA ---');
        const [columns] = await pool.query('DESCRIBE service_orders');
        console.log('Columns:', columns.map(c => `${c.Field} (${c.Type})`));

        const [customersCols] = await pool.query('DESCRIBE customers');
        console.log('Customers:', customersCols.map(c => `${c.Field} (${c.Type})`));

        const [usersCols] = await pool.query('DESCRIBE users');
        console.log('Users:', usersCols.map(c => `${c.Field} (${c.Type})`));

        const [idCheck] = await pool.query('SHOW CREATE TABLE service_orders');
        console.log('Create Table:', idCheck[0]['Create Table']);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSchema();
