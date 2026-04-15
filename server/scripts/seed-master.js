const bcrypt = require('bcryptjs');
const path = require('path');
const { masterPool } = require('../config/database');

async function seedAdmin() {
    console.log('--- Seeding Super Admin ---');
    const connection = await masterPool.getConnection();
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.query(
            'INSERT IGNORE INTO platform_admins (username, password, name) VALUES (?, ?, ?)',
            ['superadmin', hashedPassword, 'Master Admin']
        );
        console.log('✅ Super Admin seeded: superadmin / admin123');
    } catch (error) {
        console.error('❌ Seeding Failed:', error.message);
    } finally {
        connection.release();
        process.exit();
    }
}

seedAdmin();
