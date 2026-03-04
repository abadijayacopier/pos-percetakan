const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || ''
    });

    const dbName = process.env.DB_NAME || 'pos_abadi';
    console.log(`Dropping and recreating database: ${dbName}`);

    try {
        await pool.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
        await pool.query(`CREATE DATABASE \`${dbName}\``);
        console.log('✅ Database dropped and recreated successfully.');
    } catch (e) {
        console.error('Failed to wipe db:', e);
    } finally {
        await pool.end();
        process.exit();
    }
}
run();
