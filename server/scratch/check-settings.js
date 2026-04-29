const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'admin',
        database: process.env.DB_NAME || 'pos_abadi'
    });

    try {
        const [rows] = await conn.query("SELECT `key`, `value` FROM settings WHERE `key` LIKE 'store_%' OR `key` LIKE 'landing_%'");
        console.log('--- STORE SETTINGS IN DB ---');
        rows.forEach(r => {
            console.log(`${r.key}: ${r.value}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await conn.end();
    }
})();
