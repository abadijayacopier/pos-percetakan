const mysql = require('mysql2/promise');
require('dotenv').config();

const fixMaterialsDocker = async () => {
    try {
        const pool = mysql.createPool({
            host: '127.0.0.1',
            port: 3307,
            user: 'root',
            password: process.env.DB_PASS || 'admin',
            database: process.env.DB_NAME || 'pos_abadi'
        });

        const connection = await pool.getConnection();
        console.log('Running ALTER TABLE for materials on DOCKER DB (port 3307)...');

        try {
            await connection.query('ALTER TABLE materials CHANGE COLUMN nama nama_bahan VARCHAR(100) NOT NULL');
            console.log('✅ Column "nama" renamed to "nama_bahan"');
        } catch (e) {
            console.log('⚠ Could not rename column - Error:', e.message);
        }

        try {
            await connection.query('ALTER TABLE materials ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER harga_jual');
            console.log('✅ Column "is_active" added');
        } catch (e) {
            console.log('⚠ Could not add column "is_active" - Error:', e.message);
        }

        connection.release();
        console.log('✅ Materials table schema fixed in Docker!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
};

fixMaterialsDocker();
