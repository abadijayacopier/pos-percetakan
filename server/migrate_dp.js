const { pool } = require('./config/database');

async function migrate() {
    try {
        console.log('Adding dp_amount column...');
        await pool.query('ALTER TABLE service_orders ADD COLUMN dp_amount INT DEFAULT 0 AFTER labor_cost');
        console.log('Success!');
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Column already exists.');
            process.exit(0);
        }
        console.error(err);
        process.exit(1);
    }
}

migrate();
