'use strict';
const { pool } = require('../config/database');

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`SET NAMES utf8mb4`);
    await conn.query(`
      ALTER TABLE order_items
      ADD COLUMN design_cost DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER subtotal
    `);
    console.log('✅ Tabel order_items.design_cost added');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
