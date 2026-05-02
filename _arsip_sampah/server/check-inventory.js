const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'pos_abadi'
    });

    try {
        console.log("Checking products...");
        const [p] = await conn.query('SELECT p.*, c.name as category_name, c.emoji as category_emoji FROM products p LEFT JOIN categories c ON p.category_id = c.id LIMIT 1');
        console.log('Products OK, count: ' + p.length);

        console.log("Checking categories...");
        const [c] = await conn.query('SELECT * FROM categories LIMIT 1');
        console.log('Categories OK, count: ' + c.length);

        console.log("Checking suppliers...");
        const [s] = await conn.query('SELECT * FROM suppliers LIMIT 1');
        console.log('Suppliers OK, count: ' + s.length);
    } catch (err) {
        console.error('MySQL Error:', err.message);
    } finally {
        await conn.end();
    }
})();
