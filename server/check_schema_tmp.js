const { pool } = require('./config/database');

async function checkDb() {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        console.log("Tables:", tables);

        for (let row of tables) {
            let tableName = Object.values(row)[0];
            if (tableName === 'categories' || tableName === 'units' || tableName === 'materials' || tableName === 'products') {
                const [cols] = await pool.query(`DESCRIBE ${tableName}`);
                console.log(`\nTable ${tableName}:`);
                console.log(cols);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkDb();
