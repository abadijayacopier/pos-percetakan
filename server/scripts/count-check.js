const { pool } = require('../config/database');
async function check() {
    try {
        const [u] = await pool.query('SELECT COUNT(*) as c FROM users');
        const [c] = await pool.query('SELECT COUNT(*) as c FROM categories');
        const [p] = await pool.query('SELECT COUNT(*) as c FROM products');
        console.log(`Users: ${u[0].c}`);
        console.log(`Categories: ${c[0].c}`);
        console.log(`Products: ${p[0].c}`);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
check();
