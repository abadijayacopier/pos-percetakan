const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const initializeMasterDB = async () => {
    const masterDB = process.env.MASTER_DB_NAME || 'pos_system_master';

    // Initial connection without specifying DB to create it
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
    });

    console.log(`🚀 Initializing Master Database: ${masterDB}...`);

    try {
        // 1. Create Master DB
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${masterDB}\``);
        await connection.query(`USE \`${masterDB}\``);

        // 2. Create Shops Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS shops (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_name VARCHAR(255) NOT NULL,
                subdomain VARCHAR(100) UNIQUE,
                db_name VARCHAR(100) UNIQUE NOT NULL,
                owner_email VARCHAR(255) NOT NULL,
                status ENUM('active', 'suspended', 'trial', 'expired') DEFAULT 'trial',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expiry_date TIMESTAMP NULL,
                subscription_plan VARCHAR(50) DEFAULT 'basic'
            )
        `);

        // 3. Create Master Users Table (Admin access to SaaS dashboard)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS system_admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('superadmin', 'support') DEFAULT 'superadmin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Master Database & Tables initialized successfully!');
    } catch (error) {
        console.error('❌ Failed to initialize Master DB:', error.message);
    } finally {
        await connection.end();
    }
};

initializeMasterDB();
