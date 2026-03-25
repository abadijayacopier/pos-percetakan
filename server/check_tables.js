const { pool } = require('./config/database');

async function checkTables() {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        console.log('--- TABLES ---');
        console.log(tables.map(t => Object.values(t)[0]).join(', '));
        console.log('--- END TABLES ---');
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        process.exit(0);
    }
}
checkTables();
