'use strict';
const { pool } = require('../config/database');

async function run() {
    const conn = await pool.getConnection();
    try {
        await conn.query(`SET NAMES utf8mb4`);

        console.log('⏳ Creating dp_tasks table...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS dp_tasks (
                id              VARCHAR(50) PRIMARY KEY,
                status          VARCHAR(50) NOT NULL DEFAULT 'menunggu_desain',
                customerName    VARCHAR(100) NULL,
                customerId      VARCHAR(50) NULL,
                title           VARCHAR(200) NULL,
                material_id     VARCHAR(50) NULL,
                material_name   VARCHAR(100) NULL,
                dimensions_w    DECIMAL(10,2) NULL,
                dimensions_h    DECIMAL(10,2) NULL,
                material_price  DECIMAL(15,2) DEFAULT 0,
                design_price    DECIMAL(15,2) DEFAULT 0,
                priority        VARCHAR(50) DEFAULT 'normal',
                pesan_desainer  TEXT NULL,
                type            VARCHAR(50) DEFAULT 'digital',
                file_url        TEXT NULL,
                qty             INT DEFAULT 1,
                designer_id     VARCHAR(50) NULL,
                designer_name   VARCHAR(100) NULL,
                operator_id     VARCHAR(50) NULL,
                operator_name   VARCHAR(100) NULL,
                started_at      DATETIME NULL,
                finished_at     DATETIME NULL,
                dp_amount       DECIMAL(15,2) DEFAULT 0,
                is_paid         BOOLEAN DEFAULT FALSE,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB COMMENT='Digital Printing tasks (formerly from localStorage)';
        `);
        console.log('✅ dp_tasks table created!');

        console.log('\\n🎉 Migration complete!\\n');
        conn.release();
        process.exit(0);
    } catch (err) {
        conn.release();
        console.error('\\n❌ Migration FAILED:', err.message);
        process.exit(1);
    }
}

run();
