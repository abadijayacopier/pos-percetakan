const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/database');
const fs = require('fs');

async function dump() {
    try {
        console.log('Starting DB Dump...');
        const [tables] = await pool.query('SHOW TABLES');
        const dbName = 'pos_abadi';
        let fullSql = `-- POS ABADI JAYA DATABASE DUMP\n-- Generated on ${new Date().toISOString()}\n\n`;
        fullSql += `CREATE DATABASE IF NOT EXISTS \`${dbName}\`;\nUSE \`${dbName}\`;\n\n`;

        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];

            // Get Create Table
            const [createRes] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
            fullSql += `-- Structure for table \`${tableName}\`\n`;
            fullSql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            fullSql += createRes[0]['Create Table'] + ';\n\n';

            // Get Data
            const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
            if (rows.length > 0) {
                fullSql += `-- Data for table \`${tableName}\`\n`;
                const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');

                for (const row of rows) {
                    const values = Object.values(row).map(v => {
                        if (v === null) return 'NULL';
                        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
                        if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
                        return v;
                    }).join(', ');
                    fullSql += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
                }
                fullSql += '\n';
            }
        }

        const outputPath = path.join(__dirname, 'pos_abadi_latest.sql');
        fs.writeFileSync(outputPath, fullSql);
        console.log(`✅ Dump complete: ${outputPath}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Dump failed:', err);
        process.exit(1);
    }
}

dump();
