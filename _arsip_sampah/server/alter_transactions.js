require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || 'admin',
    database: process.env.DB_NAME || 'pos_abadi',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function alterTable() {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to database. Altering table...");

        await connection.query(`
            ALTER TABLE transactions
            MODIFY COLUMN type VARCHAR(50) DEFAULT 'sale',
            MODIFY COLUMN payment_type VARCHAR(50) DEFAULT 'tunai';
        `);

        console.log("Table altered successfully!");
        connection.release();
        process.exit(0);
    } catch (error) {
        console.error("Error altering table:", error);
        process.exit(1);
    }
}

alterTable();
