const mysql = require('mysql2/promise');

async function createDatabase() {
    // Konfigurasi koneksi (Tanpa nama database karena kita mau buat databasenya)
    const config = {
        host: '127.0.0.1',
        user: 'root',
        password: 'admin' // Password sesuai info user
    };

    try {
        console.log('🔗 Mencoba menyambung ke MySQL...');
        const connection = await mysql.createConnection(config);
        
        console.log('🔨 Membuat database pos_abadi...');
        await connection.query('CREATE DATABASE IF NOT EXISTS pos_abadi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        
        console.log('✅ Database pos_abadi berhasil dibuat!');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Gagal membuat database:', error.message);
        console.log('\nTips: Jika Anda memiliki password MySQL, beritahu saya agar saya bisa menyesuaikan script-nya.');
        process.exit(1);
    }
}

createDatabase();
