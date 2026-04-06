const { pool } = require('../config/database');

const fixMaterials = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Running ALTER TABLE for materials...');

        try {
            await connection.query('ALTER TABLE materials CHANGE COLUMN nama nama_bahan VARCHAR(100) NOT NULL');
            console.log('✅ Column "nama" renamed to "nama_bahan"');
        } catch (e) {
            console.log('⚠ Could not rename column (maybe it was already renamed) - Error:', e.message);
        }

        try {
            await connection.query('ALTER TABLE materials ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER harga_jual');
            console.log('✅ Column "is_active" added');
        } catch (e) {
            console.log('⚠ Could not add column "is_active" (maybe it already exists) - Error:', e.message);
        }

        connection.release();
        console.log('✅ Materials table schema fixed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
};

fixMaterials();
