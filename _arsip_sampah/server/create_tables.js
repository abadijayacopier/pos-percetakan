require('dotenv').config();
const { pool } = require('./config/database');

async function create() {
    try {
        await pool.query('CREATE TABLE IF NOT EXISTS digital_printing (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), price_per_m2 INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
        await pool.query('CREATE TABLE IF NOT EXISTS offset_printing (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), type VARCHAR(50), price INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');

        const [r] = await pool.query('SELECT COUNT(*) as c FROM digital_printing');
        if (r[0].c === 0) {
            await pool.query("INSERT INTO digital_printing (name, price_per_m2) VALUES ('Frontlite Standard 280gr', 25000), ('Frontlite High-Res 340gr', 35000), ('Albatros', 65000), ('Bannertrans / Backlite', 75000)");
        }
        console.log('OK');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
create();
