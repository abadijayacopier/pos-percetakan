const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'pos_abadi'
    });
    try {
        const tables = ['material_movements', 'order_items', 'service_spareparts'];
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
