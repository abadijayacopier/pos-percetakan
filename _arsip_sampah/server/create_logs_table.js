const { pool } = require('./config/database');

async function createActivityLogTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(50) NULL,
                action VARCHAR(255) NOT NULL,
                target VARCHAR(255) NULL,
                details TEXT NULL,
                ip_address VARCHAR(45) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('Table activity_logs created successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error creating table:', err);
        process.exit(1);
    }
}

createActivityLogTable();
