#!/usr/bin/env node
'use strict';

/**
 * Create a MySQL logical backup.
 * Required env: DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME.
 * Optional: BACKUP_DIR (default: ./backups)
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');

const required = ['DB_HOST','DB_USER','DB_NAME'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
const dir = path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'));
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const file = path.join(dir, `pos_abadi_${stamp}.sql`);

const args = ['-h', process.env.DB_HOST, '-P', process.env.DB_PORT || '3306', '-u', process.env.DB_USER, '--single-transaction', '--routines', '--triggers', '--events', process.env.DB_NAME];
const env = { ...process.env, MYSQL_PWD: process.env.DB_PASS || '' };

execFile('mysqldump', args, { env, maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
  if (error) {
    console.error(stderr || error.message);
    process.exit(1);
  }
  fs.writeFileSync(file, stdout, 'utf8');
  console.log(`Backup created: ${file}`);
});
