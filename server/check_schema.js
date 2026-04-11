const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });

    try {
        const tables = ['transactions', 'customers', 'products', 'service_orders'];
        for (const table of tables) {
            const [rows] = await pool.query(`DESCRIBE ${table}`);
            console.log(`--- ${table} schema ---`);
            rows.forEach(r => console.log(JSON.stringify(r)));
            console.log('\n');
        }
    } catch (error) {
        console.error('Database Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
