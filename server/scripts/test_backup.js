const mysqldump = require('mysqldump');
const path = require('path');
const fs = require('fs');

async function testBackup() {
    try {
        const configPath = path.join(__dirname, '../database/db-config.json');
        let externalConfig = {};
        if (fs.existsSync(configPath)) {
            externalConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }

        const dbName = externalConfig.DB_NAME || 'pos_abadi';
        const dumpPath = path.join(__dirname, `../temp/backup_test.sql`);

        console.log('Starting mysqldump for db:', dbName);
        
        await mysqldump({
            connection: {
                host: externalConfig.DB_HOST || '127.0.0.1',
                user: externalConfig.DB_USER || 'root',
                password: externalConfig.DB_PASS || '',
                database: dbName,
            },
            dumpToFile: dumpPath,
        });
        
        console.log('Backup success!');
    } catch (e) {
        console.error('Backup error:', e);
    }
}

testBackup();
