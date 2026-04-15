const { initSqlite, getTenantPool } = require('./config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

(async () => {
    try {
        console.log('--- Migrating Settings from MySQL to SQLite ---');

        const sqliteDb = await initSqlite();
        const mysqlPool = getTenantPool(process.env.DB_NAME || 'pos_abadi');

        const [mysqlRows] = await mysqlPool.query('SELECT `key`, `value` FROM settings');
        console.log(`Found ${mysqlRows.length} settings in MySQL.`);

        for (const row of mysqlRows) {
            console.log(`Migrating ${row.key}...`);
            await sqliteDb.run(
                'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
                [row.key, row.value]
            );
        }

        console.log('✅ Migration COMPLETED.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration FAILED:', error);
        process.exit(1);
    }
})();
