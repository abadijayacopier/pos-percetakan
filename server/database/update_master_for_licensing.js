const { masterPool } = require('../config/database');
require('dotenv').config();

async function updateMasterSchema() {
    console.log('🚀 Updating Master Database Schema for SaaS Licensing...');

    if (process.env.APP_MODE !== 'saas') {
        console.warn('⚠️ Mode bukan SaaS. Skrip ini hanya untuk database Master VPS.');
        // Still allow for testing if forced
    }

    try {
        const queries = [
            `ALTER TABLE shops ADD COLUMN IF NOT EXISTS license_key VARCHAR(255) DEFAULT NULL;`,
            `ALTER TABLE shops ADD COLUMN IF NOT EXISTS hwid_lock VARCHAR(255) DEFAULT NULL;`,
            `ALTER TABLE shops ADD COLUMN IF NOT EXISTS max_devices INT DEFAULT 1;`,
            `ALTER TABLE shops ADD COLUMN IF NOT EXISTS license_expires_at TIMESTAMP NULL;`,
            `ALTER TABLE shops ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP NULL;`,
            `ALTER TABLE shops ADD COLUMN IF NOT EXISTS last_hwid_update TIMESTAMP NULL;`
        ];

        for (const sql of queries) {
            console.log(`Executing: ${sql}`);
            try {
                await masterPool.query(sql);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(' - Column already exists, skipping.');
                } else {
                    console.error(` - Error: ${err.message}`);
                }
            }
        }

        console.log('\n✅ Master Database Schema updated successfully! wheel bau wheelbau.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to update Master DB:', error.message);
        process.exit(1);
    }
}

updateMasterSchema();
