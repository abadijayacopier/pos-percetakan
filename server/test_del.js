const mysql = require('mysql2/promise');

async function test() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'pos_abadi'
    });

    try {
        const id = 'SRV-202604-0001'; // Assuming from the screenshot
        console.log(`Trying to delete ${id}...`);

        await pool.query('DELETE FROM service_spareparts WHERE service_order_id = ?', [id]);
        console.log('Deleted spareparts.');

        await pool.query('DELETE FROM service_orders WHERE id = ?', [id]);
        console.log('Deleted service_orders.');
    } catch (err) {
        console.error("MYSQL ERROR:", err.message);
    } finally {
        pool.end();
    }
}
test();
