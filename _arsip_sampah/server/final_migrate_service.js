const { pool } = require('./config/database');

async function migrate() {
    const connection = await pool.getConnection();
    try {
        console.log('Starting migration...');

        // 1. Drop existing FK constraint
        console.log('Dropping foreign key constraint service_spareparts_ibfk_1...');
        try {
            await connection.query('ALTER TABLE service_spareparts DROP FOREIGN KEY service_spareparts_ibfk_1');
        } catch (e) {
            console.log('Constraint might not exist or already dropped:', e.message);
        }

        // 2. Modifikasi service_orders.id ke INT AUTO_INCREMENT
        console.log('Converting service_orders.id to INT AUTO_INCREMENT...');
        await connection.query('ALTER TABLE service_orders MODIFY id INT AUTO_INCREMENT');

        // 3. Modifikasi service_spareparts.service_order_id ke INT
        console.log('Converting service_spareparts.service_order_id to INT...');
        await connection.query('ALTER TABLE service_spareparts MODIFY service_order_id INT');

        // 4. Re-add FK constraint
        console.log('Re-adding foreign key constraint...');
        await connection.query('ALTER TABLE service_spareparts ADD CONSTRAINT service_spareparts_ibfk_1 FOREIGN KEY (service_order_id) REFERENCES service_orders (id) ON DELETE CASCADE');

        console.log('Migration SUCCESSFUL');
        process.exit(0);
    } catch (error) {
        console.error('Migration FAILED:', error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

migrate();
