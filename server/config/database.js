const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Config pool connection ke MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'pos_abadi',
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    multipleStatements: true,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Function test connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Berhasil terhubung ke database MySQL!');
        connection.release();
        return true;
    } catch (error) {
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.error(`❌ Database '${process.env.DB_NAME}' tidak ditemukan! Silakan buat database terlebih dahulu.`);
        } else {
            console.error('❌ Gagal terhubung ke MySQL:', error.message);
        }
        return false;
    }
};

module.exports = {
    pool,
    testConnection
};
