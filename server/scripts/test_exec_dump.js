const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function testExecuteDump() {
    try {
        const dumpPath = path.join(__dirname, '../temp/backup_test.sql');
        let sqlContent = fs.readFileSync(dumpPath, 'utf8');

        // Extract table names
        const tableNames = [];
        const regex = /CREATE TABLE IF NOT EXISTS `([^`]+)`/g;
        let match;
        while ((match = regex.exec(sqlContent)) !== null) {
            tableNames.push(match[1]);
        }

        console.log('Tables to drop:', tableNames);

        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'admin',
            database: 'pos_abadi',
            multipleStatements: true
        });

        console.log('Connected.');
        await connection.query('SET FOREIGN_KEY_CHECKS=0');
        
        for (const tableName of tableNames) {
            await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
        }

        console.log('Tables dropped. Executing dump...');
        await connection.query(sqlContent);
        await connection.query('SET FOREIGN_KEY_CHECKS=1');
        
        console.log('Success!');
        connection.end();
    } catch (e) {
        console.error('Execution error:', e);
    }
}

testExecuteDump();
