const fs = require('fs');
const path = require('path');
const { masterPool, getTenantPool } = require('../config/database');

/**
 * TenantManager: Handles all multi-tenant logic
 */
class TenantManager {
    /**
     * Get a shop's database name from the Master DB
     * @param {number|string} shopId 
     */
    static async getShopDBName(shopIdentifier) {
        try {
            const [rows] = await masterPool.query(
                'SELECT id, db_name, status FROM shops WHERE subdomain = ? OR id = ?',
                [shopIdentifier, shopIdentifier]
            );

            if (rows.length === 0) return null;

            const shop = rows[0];
            if (shop.status !== 'active' && shop.status !== 'trial') return null;

            return { dbName: shop.db_name, shopId: shop.id };
        } catch (error) {
            console.error(`Error fetching DB name for shop ${shopIdentifier}:`, error.message);
            throw error;
        }
    }

    /**
     * Create a new tenant database and initialize it
     * @param {Object} shopData { shop_name, owner_email, subdomain }
     */
    static async createTenant(shopData) {
        const connection = await masterPool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Register in Master DB
            const [result] = await connection.query(
                'INSERT INTO shops (shop_name, subdomain, db_name, owner_email) VALUES (?, ?, ?, ?)',
                [shopData.shop_name, shopData.subdomain, 'pending', shopData.owner_email]
            );

            const shopId = result.insertId;
            const dbName = `shop_db_${shopId}`;

            // 2. Update Master with real DB name
            await connection.query('UPDATE shops SET db_name = ? WHERE id = ?', [dbName, shopId]);

            // 3. Create the Physical Database
            await connection.query(`CREATE DATABASE \`${dbName}\``);

            // 4. Initialize Schema from Master SQL
            await this.initializeTenantSchema(dbName);

            await connection.commit();
            console.log(`✅ Tenant ${dbName} created and initialized successfully!`);
            return { shopId, dbName };
        } catch (error) {
            await connection.rollback();
            console.error('❌ Failed to create tenant:', error.message);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Run the base schema SQL on a new tenant database
     * @param {string} dbName 
     */
    static async initializeTenantSchema(dbName) {
        const sqlPath = path.join(__dirname, '../database/pos_abadi_latest.sql');
        let sql = fs.readFileSync(sqlPath, 'utf8');

        // Clean up DB specific lines
        sql = sql.replace(/CREATE DATABASE IF NOT EXISTS `pos_abadi`;/g, '');
        sql = sql.replace(/USE `pos_abadi`;/g, '');

        const pool = getTenantPool(dbName);

        try {
            // CRITICAL: Disable foreign key checks for the dump
            const setupSql = 'SET FOREIGN_KEY_CHECKS = 0;';
            const finishSql = 'SET FOREIGN_KEY_CHECKS = 1;';

            // Execute in order
            await pool.query(setupSql);
            await pool.query(sql);
            await pool.query(finishSql);

            console.log(`✅ Schema initialized for ${dbName}`);
        } catch (error) {
            console.error(`❌ Failed to initialize schema for ${dbName}:`, error.message);
            throw error;
        }
    }
}

module.exports = TenantManager;
