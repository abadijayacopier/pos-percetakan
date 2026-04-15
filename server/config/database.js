const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Path Resolution for EXE (Standalone) vs Dev
const isExe = process.pkg ? true : false;
const basePath = isExe ? path.dirname(process.execPath) : path.join(__dirname, '..');

// Ensure database relative paths work in both modes
const configPath = path.join(basePath, 'database', 'db-config.json');
let externalConfig = {};

try {
    if (fs.existsSync(configPath)) {
        externalConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (e) {
    console.warn('⚠️ db-config.json invalid or missing, using .env defaults.');
}

const dbConfig = {
    host: externalConfig.DB_HOST || process.env.DB_HOST || '127.0.0.1',
    user: externalConfig.DB_USER || process.env.DB_USER || 'root',
    password: externalConfig.DB_PASS || process.env.DB_PASS || '',
    multipleStatements: true
};

// Mode Logic: Prioritize external config (Switcher) over .env
const currentMode = externalConfig.APP_MODE || process.env.APP_MODE || 'standalone';
const currentDbType = externalConfig.DB_TYPE || process.env.DB_TYPE || 'sqlite';

let sqliteDb = null;

/**
 * Initialize SQLite connection (for Standalone/Offline mode)
 */
const initSqlite = async () => {
    if (sqliteDb) return sqliteDb;

    // In EXE mode, prioritize database folder next to the exe
    const dbPath = process.env.SQLITE_PATH || path.join(basePath, 'database', 'pos.sqlite');

    // Ensure database folder exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    sqliteDb = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Add MySQL-compatible query shim
    sqliteDb.query = async (sql, params) => {
        try {
            // mysql2 uses ? for params, SQLite also uses ?
            const rows = await sqliteDb.all(sql, params);
            return [rows, []]; // Return [rows, fields] format
        } catch (error) {
            console.error('SQLite Query Error:', error.message, 'SQL:', sql);
            throw error;
        }
    };

    // Add MySQL-compatible getConnection shim (returns a proxy for the existing connection)
    sqliteDb.getConnection = async () => {
        return {
            query: sqliteDb.query,
            release: () => { }
        };
    };

    return sqliteDb;
};

// 1. Master Pool (Fixed connection to index DB in SaaS mode)
const masterPool = currentMode === 'saas' ? mysql.createPool({
    ...dbConfig,
    database: process.env.MASTER_DB_NAME || 'pos_system_master'
}) : null;

// 2. Standalone Pool (MySQL fallback for Offline mode if chosen by user)
const standalonePool = currentMode === 'standalone' && currentDbType !== 'sqlite'
    ? mysql.createPool({ ...dbConfig, database: process.env.DB_NAME || 'pos_abadi' })
    : null;

// 3. Tenant Pools Cache (SaaS Mode only)
const tenantPools = new Map();

/**
 * Get the appropriate database pool/connection
 */
const getActivePool = async (req) => {
    if (currentMode === 'standalone') {
        if (currentDbType === 'sqlite') {
            return await initSqlite();
        }
        return standalonePool;
    }
    return req.db || masterPool;
};

/**
 * Get or create a MySQL pool for a specific tenant (SaaS Mode)
 */
const getTenantPool = (dbName) => {
    if (tenantPools.has(dbName)) return tenantPools.get(dbName);
    const pool = mysql.createPool({ ...dbConfig, database: dbName });
    tenantPools.set(dbName, pool);
    return pool;
};

const testConnection = async (poolOrDb) => {
    try {
        if (currentDbType === 'sqlite') {
            const db = await initSqlite();
            await db.get('SELECT 1');
            return true;
        }

        // If poolOrDb is not provided, use the appropriate one based on currentMode
        const target = poolOrDb || (currentMode === 'standalone' ? standalonePool : masterPool);

        if (!target) {
            console.error('❌ Database Connection Error: No active pool found for current mode.');
            return false;
        }

        const connection = await target.getConnection();
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database Connection Error:', error.message);
        return false;
    }
};

module.exports = {
    masterPool,
    getTenantPool,
    getActivePool,
    initSqlite,
    testConnection,
    currentMode,
    currentDbType
};
