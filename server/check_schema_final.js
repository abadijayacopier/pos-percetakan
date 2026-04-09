const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'admin',
        database: process.env.DB_NAME || 'pos_abadi'
    });
    try {
        const tables = ['dp_tasks', 'service_orders', 'transactions', 'cash_flow', 'stock_movements'];
        for (const table of tables) {
            console.log(`\nTable: ${table}`);
            const [columns] = await connection.query(`DESCRIBE ${table}`);
            console.table(columns);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}

checkSchema();
