/**
 * reset-password.js
 * Reset password semua user ke password default dengan bcrypt hash baru
 * Jalankan: node database/reset-password.js
 */
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const USERS = [
    { username: 'admin', password: 'admin123', name: 'Admin' },
    { username: 'kasir', password: 'kasir123', name: 'Kasir' },
    { username: 'operator', password: 'operator123', name: 'Operator' },
    { username: 'teknisi', password: 'teknisi123', name: 'Teknisi' },
];

const resetPasswords = async () => {
    console.log('\n🔐 Reset Password Database — Abadi Jaya POS\n');

    try {
        // Cek user yang ada di database dulu
        const [existing] = await pool.query('SELECT id, username, name, role, password FROM users');

        if (existing.length === 0) {
            console.log('⚠️  Tidak ada user di database!');
            console.log('   Jalankan dulu: npm run migrate && npm run seed\n');
            process.exit(1);
        }

        console.log('User yang ditemukan di database:');
        existing.forEach(u => {
            const isHashed = u.password.startsWith('$2a$') || u.password.startsWith('$2b$');
            console.log(`  - ${u.username.padEnd(12)} (${u.role.padEnd(10)}) | Hash: ${isHashed ? '✅ bcrypt' : '⚠️  plain text'}`);
        });
        console.log('');

        // Reset password setiap user
        for (const u of USERS) {
            const hashed = await bcrypt.hash(u.password, 10);
            const [result] = await pool.query(
                'UPDATE users SET password = ? WHERE username = ?',
                [hashed, u.username]
            );

            if (result.affectedRows > 0) {
                console.log(`  ✅ ${u.username.padEnd(12)} → password direset ke "${u.password}"`);
            } else {
                console.log(`  ⚠️  ${u.username.padEnd(12)} → tidak ditemukan di database (skip)`);
            }
        }

        console.log('\n📋 Ringkasan Password Default:');
        console.log('  ┌─────────────┬──────────────┐');
        console.log('  │ Username    │ Password     │');
        console.log('  ├─────────────┼──────────────┤');
        USERS.forEach(u => {
            console.log(`  │ ${u.username.padEnd(11)} │ ${u.password.padEnd(12)} │`);
        });
        console.log('  └─────────────┴──────────────┘');
        console.log('\n✨ Reset password selesai! Silakan login kembali.\n');

    } catch (err) {
        console.error('❌ Gagal reset password:', err.message);
        if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('   Database "pos_abadi" tidak ditemukan!');
        }
    } finally {
        await pool.end();
        process.exit(0);
    }
};

resetPasswords();
