const { pool } = require('./config/database');

async function test() {
    try {
        const [designLogs] = await pool.query("SHOW TABLES LIKE 'design_logs'");
        console.log('design_logs:', designLogs.length > 0 ? 'EXIST' : 'MISSING');

        const [prodStatus] = await pool.query("SHOW TABLES LIKE 'production_status'");
        console.log('production_status:', prodStatus.length > 0 ? 'EXIST' : 'MISSING');

        const [orders] = await pool.query("SHOW TABLES LIKE 'orders'");
        console.log('orders:', orders.length > 0 ? 'EXIST' : 'MISSING');

    } catch (e) {
        console.error('DB Error:', e);
    } finally {
        await pool.end();
    }
}

test();
