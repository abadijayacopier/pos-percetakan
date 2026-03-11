/**
 * migrate_design_operator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Migrasi untuk fitur Operator Desain:
 *   - ALTER users.role → tambah 'desainer'
 *   - CREATE design_assignments → penugasan pesanan ke operator desain
 *   - SEED 2 user desainer contoh
 *
 * Cara menjalankan:
 *   node database/migrate_design_operator.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function run() {
    const conn = await pool.getConnection();
    try {
        await conn.query(`SET NAMES utf8mb4`);

        // ── 1. ALTER users.role ENUM → tambah 'desainer' ──────────────────────
        console.log('  ⏳  Mengubah ENUM role di tabel users...');
        await conn.query(`
            ALTER TABLE users
            MODIFY role ENUM('admin','kasir','operator','teknisi','desainer') NOT NULL
        `);
        console.log('  ✅  Role "desainer" berhasil ditambahkan ke ENUM users.role');

        // ── 2. CREATE design_assignments ──────────────────────────────────────
        await conn.query(`
            CREATE TABLE IF NOT EXISTS design_assignments (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                task_id       VARCHAR(50)    NOT NULL
                                COMMENT 'ID pesanan dari dp_tasks (localStorage)',
                designer_id   VARCHAR(50)    NOT NULL
                                COMMENT 'FK ke users (role=desainer)',
                status        ENUM('ditugaskan','dikerjakan','selesai','dibatalkan')
                                NOT NULL DEFAULT 'ditugaskan',
                assigned_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
                started_at    DATETIME       NULL
                                COMMENT 'Waktu operator klik Mulai Desain',
                finished_at   DATETIME       NULL
                                COMMENT 'Waktu operator klik Selesai Desain',
                catatan       TEXT           NULL,
                created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
                updated_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                CONSTRAINT fk_da_designer FOREIGN KEY (designer_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB COMMENT='Penugasan pesanan cetak ke operator desain'
        `);
        console.log('  ✅  Tabel design_assignments berhasil dibuat');

        // ── 3. SEED user desainer contoh ──────────────────────────────────────
        const password = await bcrypt.hash('desainer123', 10);

        await conn.query(`
            INSERT IGNORE INTO users (id, name, username, password, role, is_active)
            VALUES
                ('des001', 'Andi Desainer', 'andi_desain', ?, 'desainer', TRUE),
                ('des002', 'Budi Desainer', 'budi_desain', ?, 'desainer', TRUE)
        `, [password, password]);
        console.log('  ✅  Seed data: 2 operator desain (andi_desain / budi_desain, password: desainer123)');

        console.log('\n🎉  Migrasi Operator Desain selesai!\n');
        conn.release();
        process.exit(0);

    } catch (err) {
        conn.release();
        console.error('\n❌  Migrasi GAGAL:', err.message);
        if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('   → Database "pos_abadi" belum ada.');
        }
        process.exit(1);
    }
}

run();
