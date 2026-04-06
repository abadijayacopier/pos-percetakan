const { pool } = require('../config/database');
async function check() {
    try {
        const [rows] = await pool.query(`
            SELECT p.name as product_name, c.name as category_name, c.type as category_type
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
        `);
        console.log('Result:', JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
check();
