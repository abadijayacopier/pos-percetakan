const { pool } = require('../config/database');

const fixCharset = async () => {
    try {
        const conn = await pool.getConnection();
        console.log('Fixing wa_config charset to utf8mb4...');
        await conn.query('ALTER TABLE wa_config CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        await conn.query('ALTER TABLE wa_config MODIFY config_value TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('✅ Charset fixed!');
        conn.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to fix charset:', err.message);
        process.exit(1);
    }
};

fixCharset();
