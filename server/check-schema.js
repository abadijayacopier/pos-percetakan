const { pool } = require('./config/database');

async function check() {
    try {
        const [rows] = await pool.query('SHOW COLUMNS FROM spk;');
        console.log("SPK Columns: ", rows.map(r => r.Field).join(', '));
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}
check();
