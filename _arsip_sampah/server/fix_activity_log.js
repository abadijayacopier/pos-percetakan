const { getActivePool } = require('./config/database');

async function migrate() {
    try {
        const pool = await getActivePool();
        console.log('Checking activity_log table...');

        // 1. Check if activity_log exists
        const [tables] = await pool.query('SHOW TABLES LIKE "activity_log"');
        if (tables.length === 0) {
            console.log('Creating activity_log table...');
            await pool.query(`
                CREATE TABLE activity_log (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NULL,
                    user_name VARCHAR(100) NULL,
                    action VARCHAR(50) NOT NULL,
                    target VARCHAR(255) NULL,
                    detail TEXT NULL,
                    ip_address VARCHAR(45) NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
        } else {
            console.log('Table activity_log exists, checking columns...');
            const [columns] = await pool.query('DESCRIBE activity_log');
            const colNames = columns.map(c => c.Field);

            if (!colNames.includes('target')) {
                console.log('Adding "target" column...');
                await pool.query('ALTER TABLE activity_log ADD COLUMN target VARCHAR(255) NULL AFTER action');
            }
            if (!colNames.includes('ip_address')) {
                console.log('Adding "ip_address" column...');
                await pool.query('ALTER TABLE activity_log ADD COLUMN ip_address VARCHAR(45) NULL AFTER target');
            }
            if (!colNames.includes('user_name')) {
                console.log('Adding "user_name" column...');
                await pool.query('ALTER TABLE activity_log ADD COLUMN user_name VARCHAR(100) NULL AFTER user_id');
            }
        }

        console.log('✅ Activity log schema updated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
