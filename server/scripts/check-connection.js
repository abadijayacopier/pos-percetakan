const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const host = process.env.DB_HOST || '127.0.0.1';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASS || 'admin';
    const database = process.env.DB_NAME || 'pos_abadi';

    console.log(`🔍 Mencoba koneksi ke ${host} (User: ${user}, DB: ${database})...`);
    
    try {
        const conn = await mysql.createConnection({
            host,
            user,
            password,
            database
        });
        console.log('✅ Koneksi BERHASIL!');
        
        const [rows] = await conn.query('SHOW TABLES');
        console.log(`📊 Total tabel ditemukan: ${rows.length}`);
        
        await conn.end();
    } catch (err) {
        console.error('❌ Koneksi GAGAL:');
        console.error(`   Message: ${err.message}`);
        console.error(`   Code: ${err.code}`);
        console.error(`   Host: ${host}`);
        
        if (err.code === 'ECONNREFUSED') {
            console.log('\n💡 TIPS: Pastikan MySQL Server sudah berjalan.');
            console.log('   Jika menggunakan Docker, pastikan container db sudah UP.');
            console.log('   Jika menggunakan XAMPP/Laragon, pastikan service MySQL sudah START.');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 TIPS: Password atau Username salah. Cek file .env Anda.');
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            console.log(`\n💡 TIPS: Database "${database}" belum dibuat.`);
            console.log('   Coba jalankan: npm run migrate (di folder server)');
        }
    }
}

check();
