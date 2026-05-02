const { getActivePool } = require('../config/database');

async function patch() {
    try {
        console.log('--- Database Patch Started ---');
        const db = await getActivePool();
        
        console.log('Checking service_orders table...');
        const [columns] = await db.query('SHOW COLUMNS FROM service_orders');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('dp_amount')) {
            console.log('Adding dp_amount to service_orders...');
            await db.query('ALTER TABLE service_orders ADD COLUMN dp_amount INT DEFAULT 0 AFTER labor_cost');
            console.log('✅ Column dp_amount added.');
        } else {
            console.log('Column dp_amount already exists.');
        }

        console.log('Checking service_spareparts table...');
        const [spColumns] = await db.query('SHOW COLUMNS FROM service_spareparts');
        const spColumnNames = spColumns.map(c => c.Field);

        if (!spColumnNames.includes('product_id')) {
            console.log('Adding product_id to service_spareparts...');
            await db.query('ALTER TABLE service_spareparts ADD COLUMN product_id VARCHAR(50) AFTER id');
            await db.query('ALTER TABLE service_spareparts ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL');
            console.log('✅ Column product_id added with foreign key.');
        } else {
            console.log('Column product_id already exists.');
        }

        console.log('--- Database Patch Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database Patch Failed:', error.message);
        process.exit(1);
    }
}

patch();
