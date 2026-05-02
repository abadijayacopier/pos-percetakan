const mysqldump = require('mysqldump');
const path = require('path');
const fs = require('fs');

/**
 * Automatic Daily Backup Utility
 * Runs without external dependencies like node-cron
 */

const BACKUP_DIR = path.join(__dirname, '../backups');
const BACKUP_HOUR = 1; // 01:00 AM

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function runBackup() {
    try {
        const { currentDbType } = require('../config/database');
        const today = new Date().toISOString().split('T')[0];
        
        if (currentDbType === 'sqlite') {
            const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../database/pos.sqlite');
            const fileName = `backup_${today}.sqlite`;
            const filePath = path.join(BACKUP_DIR, fileName);

            if (fs.existsSync(filePath)) {
                console.log(`[Backup] Today's SQLite backup already exists: ${fileName}`);
                return;
            }

            if (fs.existsSync(dbPath)) {
                fs.copyFileSync(dbPath, filePath);
                console.log(`[Backup] ✅ Success (SQLite): ${fileName}`);
                cleanOldBackups(30);
            } else {
                console.warn(`[Backup] ⚠️ Source SQLite file not found: ${dbPath}`);
            }
            return;
        }

        // MySQL Mode
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS ? process.env.DB_PASS.trim() : '',
            database: process.env.DB_NAME || 'pos_abadi'
        };

        const fileName = `backup_${today}.sql`;
        const filePath = path.join(BACKUP_DIR, fileName);

        if (fs.existsSync(filePath)) {
            console.log(`[Backup] Today's MySQL backup already exists: ${fileName}`);
            return;
        }

        console.log(`[Backup] Starting daily backup for ${dbConfig.database}...`);

        await mysqldump({
            connection: dbConfig,
            dumpToFile: filePath,
        });

        console.log(`[Backup] ✅ Success (MySQL): ${fileName}`);
        cleanOldBackups(30);

    } catch (error) {
        console.error('[Backup] ❌ Error:', error.message);
    }
}

function cleanOldBackups(days) {
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        const now = Date.now();
        const expiry = days * 24 * 60 * 60 * 1000;

        files.forEach(file => {
            if (file.startsWith('backup_') && file.endsWith('.sql')) {
                const filePath = path.join(BACKUP_DIR, file);
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > expiry) {
                    fs.unlinkSync(filePath);
                    console.log(`[Backup] 🗑️ Deleted old backup: ${file}`);
                }
            }
        });
    } catch (e) {
        console.error('[Backup] Error cleaning old backups:', e);
    }
}

function initAutoBackup() {
    console.log(`[Backup] Scheduler initialized. Target time: ${BACKUP_HOUR.toString().padStart(2, '0')}:00 daily.`);
    
    // Initial check on startup
    runBackup();

    // Check every hour
    setInterval(() => {
        const now = new Date();
        if (now.getHours() === BACKUP_HOUR) {
            runBackup();
        }
    }, 60 * 60 * 1000); 
}

module.exports = { initAutoBackup, runBackup };
