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
        const [users] = await pool.query('SELECT id, username, role FROM users');
        console.log('--- ALL USERS IN DB ---');
        console.table(users);
    } catch (e) {
        console.error("ERROR:", e.message);
    }
    pool.end();
}

run();
