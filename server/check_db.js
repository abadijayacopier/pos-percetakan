const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'pos_abadi'
    });
    try {
        const [rows] = await connection.query('SHOW TABLES');
        const tables = rows.map(r => Object.values(r)[0]);
        console.log('TABLES_LIST:' + JSON.stringify(tables));
    } catch (e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}

checkTables();
