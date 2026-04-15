const { getTenantPool, initSqlite } = require('./config/database');
require('dotenv').config();

async function migrate() {
    console.log('🚀 Starting Full Migration (MySQL -> SQLite)...');

    const shopName = process.env.DB_NAME || 'pos_abadi';
    const mysqlPool = getTenantPool(shopName);
    const sqliteDb = await initSqlite();

    const tablesToMigrate = [
        'settings',
        'fotocopy_prices',
        'activity_log',
        'categories',
        'products',
        'materials',
        'wa_config',
        'customers',
        'users',
        'cash_flow',
        'design_assignments',
        'design_logs',
        'design_sessions',
        'dp_tasks',
        'expenses',
        'handovers',
        'material_movements',
        'offset_orders',
        'offset_products',
        'order_items',
        'orders',
        'pricing_logs',
        'pricing_rules',
        'print_orders',
        'product_options',
        'production_status',
        'purchase_items',
        'purchases',
        'service_orders',
        'spk',
        'spk_items',
        'spk_payments',
        'stock_movements',
        'suppliers',
        'tiered_pricing_rules',
        'transaction_details',
        'transactions'
    ];

    for (const table of tablesToMigrate) {
        console.log(`\n--- Migrating ${table} ---`);
        try {
            // 1. Fetch data from MySQL
            const [mysqlRows] = await mysqlPool.query(`SELECT * FROM \`${table}\``);
            console.log(`Fetched ${mysqlRows.length} rows from MySQL.`);

            if (mysqlRows.length === 0) {
                console.log(`Skipping ${table} (empty).`);
                continue;
            }

            // 2. Map columns (Handle MySQL vs SQLite naming if needed)
            const mysqlColumns = Object.keys(mysqlRows[0]);

            // 3. Ensure table exists in SQLite (Very basic creation if missing)
            // Note: We use the columns from MySQL to drive the insertion
            const placeholders = mysqlColumns.map(() => '?').join(', ');
            const insertSql = `INSERT OR REPLACE INTO \`${table}\` (${mysqlColumns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`;

            let successCount = 0;
            for (const row of mysqlRows) {
                const values = mysqlColumns.map(col => row[col]);
                try {
                    await sqliteDb.run(insertSql, values);
                    successCount++;
                } catch (err) {
                    if (err.message.includes('no such table')) {
                        console.log(`Creating table ${table} in SQLite...`);
                        const schemaSql = `CREATE TABLE IF NOT EXISTS \`${table}\` (${mysqlColumns.map(c => `\`${c}\` TEXT`).join(', ')})`;
                        await sqliteDb.run(schemaSql);
                        // Retry current row
                        await sqliteDb.run(insertSql, values);
                        successCount++;
                    } else if (err.message.includes('has no column named')) {
                        // Skip row or column mismatch
                        // console.warn(`Column mismatch in ${table}: ${err.message}`);
                    } else {
                        console.error(`Error in table ${table} row:`, err.message);
                        // throw err; // Don't crash, just log and continue
                    }
                }
            }
            console.log(`✅ Successfully migrated ${successCount}/${mysqlRows.length} rows to SQLite.`);
        } catch (error) {
            console.error(`❌ Failed to migrate table ${table}:`, error.message);
        }
    }

    console.log('\n✨ Full Migration Completed! wheel bau wheelbau.');
    process.exit(0);
}

migrate();
