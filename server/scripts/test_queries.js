const { pool } = require('../config/database');

const testQueries = async () => {
    try {
        const connection = await pool.getConnection();

        console.log('Testing Products...');
        try {
            await connection.query('SELECT *, updated_at AS updatedAt FROM products ORDER BY category_id, name');
            console.log('✅ Products query OK');
        } catch (e) {
            console.log('❌ Products error:', e.message);
        }

        console.log('Testing Materials...');
        try {
            await connection.query('SELECT *, updated_at AS updatedAt FROM materials ORDER BY kategori, nama_bahan');
            console.log('✅ Materials query OK');
        } catch (e) {
            console.log('❌ Materials error:', e.message);
        }

        console.log('Testing Suppliers...');
        try {
            await connection.query('SELECT * FROM suppliers ORDER BY name');
            console.log('✅ Suppliers query OK');
        } catch (e) {
            console.log('❌ Suppliers error:', e.message);
        }

        connection.release();
        process.exit(0);
    } catch (e) {
        console.error('Fatal:', e);
        process.exit(1);
    }
};

testQueries();
