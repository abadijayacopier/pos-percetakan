const { pool } = require('../config/database');
async function check() {
    try {
        const [rows] = await pool.query('SELECT id, code, name, category_id FROM products');
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
check();
