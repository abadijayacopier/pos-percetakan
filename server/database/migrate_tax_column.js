const { initSqlite } = require('../config/database');

const migrate = async () => {
    try {
        const db = await initSqlite();
        console.log('--- Adding tax_amount to transactions ---');

        await db.exec(`
            ALTER TABLE transactions ADD COLUMN tax_amount INTEGER DEFAULT 0;
        `);

        console.log('✅ tax_amount added successfully');
        process.exit(0);
    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('ℹ️ tax_amount already exists');
            process.exit(0);
        }
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }
};

migrate();
