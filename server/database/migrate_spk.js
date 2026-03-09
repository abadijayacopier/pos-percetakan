/**
 * migrate_spk.js
 * Migrasi tabel untuk workflow SPK (Surat Perintah Kerja)
 * Tabel: spk, spk_logs, spk_payments, spk_handovers, wa_config
 */
'use strict';

const { pool } = require('../config/database');

async function run() {
    const conn = await pool.getConnection();
    try {
        await conn.query(`SET NAMES utf8mb4`);

        // ══════════════════════════════════════════════════════════
        // 1. TABEL SPK — Master Surat Perintah Kerja
        // ══════════════════════════════════════════════════════════
        await conn.query(`
            CREATE TABLE IF NOT EXISTS spk (
                id VARCHAR(50) PRIMARY KEY,
                spk_number VARCHAR(50) UNIQUE NOT NULL,
                customer_id VARCHAR(50) NULL,
                customer_name VARCHAR(150) NOT NULL,
                customer_phone VARCHAR(30) NULL,
                customer_company VARCHAR(150) NULL,
                
                -- Produk & Spesifikasi
                product_name VARCHAR(200) NOT NULL,
                product_qty INT NOT NULL DEFAULT 1,
                product_unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
                specs_material TEXT NULL,
                specs_finishing TEXT NULL,
                specs_notes TEXT NULL,
                
                -- Biaya
                biaya_cetak DECIMAL(12,2) NOT NULL DEFAULT 0,
                biaya_material DECIMAL(12,2) NOT NULL DEFAULT 0,
                biaya_finishing DECIMAL(12,2) NOT NULL DEFAULT 0,
                biaya_desain DECIMAL(12,2) NOT NULL DEFAULT 0,
                biaya_lainnya DECIMAL(12,2) NOT NULL DEFAULT 0,
                total_biaya DECIMAL(12,2) NOT NULL DEFAULT 0,
                dp_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                sisa_tagihan DECIMAL(12,2) NOT NULL DEFAULT 0,
                
                -- Status & Assignment
                status ENUM(
                    'Menunggu Antrian',
                    'Dalam Proses Cetak',
                    'Finishing',
                    'Quality Control',
                    'Selesai',
                    'Siap Diambil',
                    'Diambil'
                ) NOT NULL DEFAULT 'Menunggu Antrian',
                priority ENUM('Rendah', 'Normal', 'Tinggi', 'Urgent') NOT NULL DEFAULT 'Normal',
                assigned_to VARCHAR(50) NULL,
                
                -- Waktu
                deadline DATETIME NULL,
                completed_at DATETIME NULL,
                created_by VARCHAR(50) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- Referensi
                offset_order_id VARCHAR(50) NULL,
                
                CONSTRAINT fk_spk_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
                CONSTRAINT fk_spk_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
                CONSTRAINT fk_spk_created FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB COMMENT='Master Surat Perintah Kerja'
        `);
        console.log('✅ Tabel spk');

        // ══════════════════════════════════════════════════════════
        // 2. TABEL SPK_LOGS — Log Aktivitas Produksi
        // ══════════════════════════════════════════════════════════
        await conn.query(`
            CREATE TABLE IF NOT EXISTS spk_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                spk_id VARCHAR(50) NOT NULL,
                user_id VARCHAR(50) NULL,
                action VARCHAR(100) NOT NULL,
                description TEXT NULL,
                old_value VARCHAR(100) NULL,
                new_value VARCHAR(100) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT fk_spklog_spk FOREIGN KEY (spk_id) REFERENCES spk(id) ON DELETE CASCADE,
                CONSTRAINT fk_spklog_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB COMMENT='Log aktivitas produksi SPK'
        `);
        console.log('✅ Tabel spk_logs');

        // ══════════════════════════════════════════════════════════
        // 3. TABEL SPK_PAYMENTS — Riwayat Pembayaran
        // ══════════════════════════════════════════════════════════
        await conn.query(`
            CREATE TABLE IF NOT EXISTS spk_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                spk_id VARCHAR(50) NOT NULL,
                payment_type ENUM('DP', 'Pelunasan') NOT NULL DEFAULT 'Pelunasan',
                method ENUM('Tunai', 'QRIS', 'Transfer') NOT NULL DEFAULT 'Tunai',
                amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                bank_ref VARCHAR(100) NULL,
                status ENUM('Pending', 'Berhasil', 'Gagal') NOT NULL DEFAULT 'Berhasil',
                paid_by VARCHAR(50) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT fk_spkpay_spk FOREIGN KEY (spk_id) REFERENCES spk(id) ON DELETE CASCADE,
                CONSTRAINT fk_spkpay_user FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB COMMENT='Riwayat pembayaran SPK'
        `);
        console.log('✅ Tabel spk_payments');

        // ══════════════════════════════════════════════════════════
        // 4. TABEL SPK_HANDOVERS — Serah Terima Barang
        // ══════════════════════════════════════════════════════════
        await conn.query(`
            CREATE TABLE IF NOT EXISTS spk_handovers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                spk_id VARCHAR(50) NOT NULL,
                received_by_name VARCHAR(150) NOT NULL,
                received_by_phone VARCHAR(30) NULL,
                signature_data LONGTEXT NULL,
                photo_evidence TEXT NULL,
                notes TEXT NULL,
                handed_by VARCHAR(50) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT fk_spkho_spk FOREIGN KEY (spk_id) REFERENCES spk(id) ON DELETE CASCADE,
                CONSTRAINT fk_spkho_user FOREIGN KEY (handed_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB COMMENT='Bukti serah terima barang'
        `);
        console.log('✅ Tabel spk_handovers');

        // ══════════════════════════════════════════════════════════
        // 5. TABEL WA_CONFIG — Konfigurasi WhatsApp API
        // ══════════════════════════════════════════════════════════
        await conn.query(`
            CREATE TABLE IF NOT EXISTS wa_config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                config_key VARCHAR(100) UNIQUE NOT NULL,
                config_value TEXT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB COMMENT='Konfigurasi API WhatsApp'
        `);
        console.log('✅ Tabel wa_config');

        // ══════════════════════════════════════════════════════════
        // SEED: Data default wa_config
        // ══════════════════════════════════════════════════════════
        await conn.query(`
            INSERT IGNORE INTO wa_config (config_key, config_value) VALUES
            ('api_url', 'https://api.fonnte.com/send'),
            ('api_token', ''),
            ('template_spk_selesai', 'Halo {nama}, pesanan *{produk}* (SPK: {spk_number}) Anda sudah selesai dan siap diambil. Sisa tagihan: *Rp {sisa_tagihan}*. Terima kasih! 🙏'),
            ('template_invoice', 'Halo {nama}, berikut invoice untuk pesanan Anda:\\n\\nNo. SPK: {spk_number}\\nProduk: {produk}\\nTotal: Rp {total}\\nDP: Rp {dp}\\nSisa: Rp {sisa}\\n\\nTerima kasih! 🧾'),
            ('auto_notify_on_complete', 'true')
        `);
        console.log('✅ Seed wa_config defaults');

        // ══════════════════════════════════════════════════════════
        // SEED: Data contoh SPK untuk testing
        // ══════════════════════════════════════════════════════════
        const [existingUsers] = await conn.query('SELECT id FROM users LIMIT 1');
        const userId = existingUsers.length > 0 ? existingUsers[0].id : null;

        const [existingCustomers] = await conn.query('SELECT id, name, phone FROM customers LIMIT 3');

        const sampleSPKs = [
            {
                id: 'spk-001', spk_number: 'SPK-2024-00001',
                customer_id: existingCustomers[0]?.id || null,
                customer_name: existingCustomers[0]?.name || 'Budi Santoso',
                customer_phone: existingCustomers[0]?.phone || '0812-3456-7890',
                customer_company: 'PT. Maju Bersama',
                product_name: 'Brosur A4 Full Color', product_qty: 500, product_unit: 'lembar',
                specs_material: 'Art Paper 150gr', specs_finishing: 'Laminasi Glossy',
                specs_notes: 'Warna harus cerah, pastikan gambar tidak pecah',
                biaya_cetak: 750000, biaya_material: 200000, biaya_finishing: 150000,
                biaya_desain: 100000, biaya_lainnya: 0, total_biaya: 1200000,
                dp_amount: 500000, sisa_tagihan: 700000,
                status: 'Dalam Proses Cetak', priority: 'Tinggi',
                assigned_to: userId, created_by: userId,
                deadline: '2024-10-25 15:00:00'
            },
            {
                id: 'spk-002', spk_number: 'SPK-2024-00002',
                customer_id: existingCustomers[1]?.id || null,
                customer_name: existingCustomers[1]?.name || 'Ahmad Subarjo',
                customer_phone: existingCustomers[1]?.phone || '0857-1122-3344',
                customer_company: 'PT. Kreatif Digital Indonesia',
                product_name: 'Buku Nota A5 NCR 3 Ply', product_qty: 50, product_unit: 'buku',
                specs_material: 'NCR Top Putih, Middle Pink, Bottom Kuning',
                specs_finishing: 'Jilid Lem Panas, Nomorator 001-500, Porporasi',
                specs_notes: 'Nomorator harus berurutan tanpa lompat',
                biaya_cetak: 500000, biaya_material: 150000, biaya_finishing: 200000,
                biaya_desain: 50000, biaya_lainnya: 0, total_biaya: 900000,
                dp_amount: 300000, sisa_tagihan: 600000,
                status: 'Menunggu Antrian', priority: 'Normal',
                assigned_to: userId, created_by: userId,
                deadline: '2024-10-28 17:00:00'
            },
            {
                id: 'spk-003', spk_number: 'SPK-2024-00003',
                customer_id: existingCustomers[2]?.id || null,
                customer_name: existingCustomers[2]?.name || 'Siti Rahmawati',
                customer_phone: existingCustomers[2]?.phone || '0878-9988-7766',
                customer_company: null,
                product_name: 'Kartu Nama Premium Spot UV', product_qty: 5, product_unit: 'box',
                specs_material: 'Art Carton 310gr', specs_finishing: 'Spot UV, Laminasi Doff',
                specs_notes: 'Desain dari pelanggan, file sudah ready',
                biaya_cetak: 175000, biaya_material: 50000, biaya_finishing: 75000,
                biaya_desain: 0, biaya_lainnya: 0, total_biaya: 300000,
                dp_amount: 300000, sisa_tagihan: 0,
                status: 'Selesai', priority: 'Normal',
                assigned_to: userId, created_by: userId,
                deadline: '2024-10-22 12:00:00',
                completed_at: '2024-10-21 16:30:00'
            }
        ];

        for (const spk of sampleSPKs) {
            await conn.query(`
                INSERT IGNORE INTO spk (
                    id, spk_number, customer_id, customer_name, customer_phone, customer_company,
                    product_name, product_qty, product_unit, specs_material, specs_finishing, specs_notes,
                    biaya_cetak, biaya_material, biaya_finishing, biaya_desain, biaya_lainnya,
                    total_biaya, dp_amount, sisa_tagihan,
                    status, priority, assigned_to, created_by, deadline, completed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                spk.id, spk.spk_number, spk.customer_id, spk.customer_name, spk.customer_phone, spk.customer_company,
                spk.product_name, spk.product_qty, spk.product_unit, spk.specs_material, spk.specs_finishing, spk.specs_notes,
                spk.biaya_cetak, spk.biaya_material, spk.biaya_finishing, spk.biaya_desain, spk.biaya_lainnya,
                spk.total_biaya, spk.dp_amount, spk.sisa_tagihan,
                spk.status, spk.priority, spk.assigned_to, spk.created_by, spk.deadline, spk.completed_at || null
            ]);
        }
        console.log('✅ Seed 3 contoh SPK');

        // Seed sample logs
        if (userId) {
            await conn.query(`
                INSERT IGNORE INTO spk_logs (spk_id, user_id, action, description, old_value, new_value) VALUES
                ('spk-001', ?, 'STATUS_CHANGE', 'SPK Baru Dibuat', NULL, 'Menunggu Antrian'),
                ('spk-001', ?, 'STATUS_CHANGE', 'Status berubah ke Dalam Proses Cetak', 'Menunggu Antrian', 'Dalam Proses Cetak'),
                ('spk-001', ?, 'PAYMENT', 'Uang muka (DP) diterima: Rp 500.000', NULL, '500000'),
                ('spk-002', ?, 'STATUS_CHANGE', 'SPK Baru Dibuat', NULL, 'Menunggu Antrian'),
                ('spk-003', ?, 'STATUS_CHANGE', 'SPK Baru Dibuat', NULL, 'Menunggu Antrian'),
                ('spk-003', ?, 'STATUS_CHANGE', 'Status berubah ke Selesai', 'Quality Control', 'Selesai')
            `, [userId, userId, userId, userId, userId, userId]);

            // Seed sample payment
            await conn.query(`
                INSERT IGNORE INTO spk_payments (spk_id, payment_type, method, amount, status, paid_by) VALUES
                ('spk-001', 'DP', 'Tunai', 500000, 'Berhasil', ?),
                ('spk-002', 'DP', 'Transfer', 300000, 'Berhasil', ?),
                ('spk-003', 'DP', 'QRIS', 300000, 'Berhasil', ?)
            `, [userId, userId, userId]);
        }
        console.log('✅ Seed spk_logs & spk_payments');

        console.log('\n🎉 Migrasi SPK Workflow Berhasil!');
    } catch (err) {
        console.error('\n❌ Migrasi SPK GAGAL:', err.message);
    } finally {
        conn.release();
        process.exit(0);
    }
}

run();
