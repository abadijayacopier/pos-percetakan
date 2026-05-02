const { getActivePool } = require('./server/config/database');

async function check() {
    try {
        const db = await getActivePool();
        console.log('--- EMPLOYEES TABLE ---');
        const [rows] = await db.query('DESCRIBE employees');
        console.log(JSON.stringify(rows, null, 2));
        
        console.log('--- USERS TABLE ---');
        const [uRows] = await db.query('DESCRIBE users');
        console.log(JSON.stringify(uRows, null, 2));
    } catch (e) {
        console.error('ERROR:', e.message);
    }
    process.exit();
}

check();
