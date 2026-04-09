const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'admin',
        database: process.env.DB_NAME || 'pos_abadi'
    });

    try {
        console.log('\n--- Counts check ---');
        const [counts] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM products) as product_count,
                (SELECT COUNT(*) FROM customers) as customer_count,
                (SELECT COUNT(*) FROM materials) as material_count,
                (SELECT COUNT(*) FROM dp_tasks) as order_count
        `);
        console.table(counts);

        const [dataProd] = await pool.query('SELECT id, name, type, stock FROM products LIMIT 5');
        console.table(dataProd);

    } catch (e) {
        console.error("ERROR:", e.message);
    }
    pool.end();
}

run();
