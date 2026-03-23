const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'pos_abadi'
    });

    try {
        const [res] = await pool.query('SHOW CREATE TABLE transactions');
        console.log('--- TRANSACTIONS ---');
        console.log(res[0]['Create Table']);

        const [res2] = await pool.query('SHOW CREATE TABLE transaction_details');
        console.log('--- TRANSACTION_DETAILS ---');
        console.log(res2[0]['Create Table']);
    } catch (e) {
        console.error("ERROR:", e.message);
    }
    pool.end();
}

run();
