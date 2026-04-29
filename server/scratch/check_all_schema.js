const { pool } = require('../config/database');

async function check() {
    try {
        const tables = ['transactions', 'transaction_details'];
        for (const table of tables) {
            console.log(`\n--- ${table} ---`);
            const [rows] = await pool.query(`SHOW COLUMNS FROM ${table};`);
            console.table(rows);
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}
check();
