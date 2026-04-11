const { pool } = require('./config/database');

async function getCreate() {
    try {
        const [rows] = await pool.query('SHOW CREATE TABLE service_spareparts');
        console.log(rows[0]['Create Table']);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

getCreate();
