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

async function fixSchema() {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to database. Fixing ID columns...");

        // 1. Fix Transactions table
        console.log("Altering transactions table...");
        await connection.query(`
            ALTER TABLE transactions 
            MODIFY COLUMN id VARCHAR(50) NOT NULL,
            MODIFY COLUMN customer_id VARCHAR(50) NULL,
            MODIFY COLUMN user_id VARCHAR(50) NULL;
        `);

        // 2. Fix Transaction Details table
        console.log("Altering transaction_details table...");
        await connection.query(`
            ALTER TABLE transaction_details 
            MODIFY COLUMN id VARCHAR(50) NOT NULL,
            MODIFY COLUMN transaction_id VARCHAR(50) NOT NULL,
            MODIFY COLUMN product_id VARCHAR(50) NULL;
        `);

        // 3. Fix other tables that might have varchar IDs but are currently ints
        const tablesToFix = ['cash_flow', 'stock_movements', 'activity_log'];
        for (const table of tablesToFix) {
             console.log(`Altering ${table} table...`);
             try {
                 await connection.query(`ALTER TABLE ${table} MODIFY COLUMN id VARCHAR(50) NOT NULL;`);
             } catch (e) {
                 console.warn(`Could not fix ${table}.id: ${e.message}`);
             }
        }

        console.log("Schema fixed successfully!");
        connection.release();
        process.exit(0);
    } catch (error) {
        console.error("Error fixing schema:", error);
        process.exit(1);
    }
}

fixSchema();
