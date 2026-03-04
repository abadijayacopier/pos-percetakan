/**
 * migrate_percetakan.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Migrasi tambahan untuk fitur Digital Printing:
 *   - materials          : Master bahan cetak (menggantikan tabel ad-hoc digital_printing/offset_printing)
 *   - orders             : Induk pesanan percetakan (multi-item, menggantikan print_orders yang single-item)
 *   - order_items        : Detail item per pesanan (supports kalkulasi banner otomatis)
 *   - design_logs        : Log waktu desain (timer desain per item)
 *   - production_status  : Progres produksi per item
 *   - expenses           : Pengeluaran operasional dengan approval
 *
 * Catatan: Tabel yang sudah ada di migrate.js (users, customers, cash_flow,
 *          settings, dll.) TIDAK disentuh di sini — IF NOT EXISTS memastikan aman.
 *
 * Cara menjalankan:
 *   node database/migrate_percetakan.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const { pool } = require('../config/database');

async function run() {
    const conn = await pool.getConnection();
    try {
        // ── 0. Pastikan charset default aman untuk emoji ──────────────────────
        await conn.query(`SET NAMES utf8mb4`);

        // ─────────────────────────────────────────────────────────────────────
        // 1. MATERIALS  —  Master bahan cetak digital & offset
        // ─────────────────────────────────────────────────────────────────────
        await conn.query(`
            CREATE TABLE IF NOT EXISTS materials (
                id            VARCHAR(50)     PRIMARY KEY,
                nama_bahan    VARCHAR(100)    NOT NULL,
                kategori      ENUM('digital','offset','atk','lainnya')  NOT NULL DEFAULT 'digital',
                satuan        ENUM('m2','lembar','rim','pcs','roll')     NOT NULL DEFAULT 'm2',
                harga_modal   INT             NOT NULL DEFAULT 0
                                COMMENT 'Harga pokok / modal per satuan (Rp)',
                harga_jual    INT             NOT NULL DEFAULT 0
                                COMMENT 'Harga jual ke pelanggan per satuan (Rp)',
                stok_saat_ini DECIMAL(10,2)   NOT NULL DEFAULT 0
                                COMMENT 'Stok tersedia dalam satuan bahan',
                stok_minimum  DECIMAL(10,2)   NOT NULL DEFAULT 0
                                COMMENT 'Batas minimum sebelum notifikasi',
                is_active     BOOLEAN         NOT NULL DEFAULT TRUE,
                created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
                updated_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Master bahan cetak'
        `);
        console.log('  ✅  Tabel materials');

        // ─────────────────────────────────────────────────────────────────────
        // 2. ORDERS  —  Induk pesanan percetakan (multi-item)
        //    Menggantikan print_orders yang hanya satu jenis item per order.
        //    Tabel print_orders lama TIDAK dihapus agar data lama aman.
        // ─────────────────────────────────────────────────────────────────────
        await conn.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id                 VARCHAR(50)   PRIMARY KEY,
                order_number       VARCHAR(50)   UNIQUE NOT NULL
                                     COMMENT 'Nomor cantik: ORD-9021, dsb.',
                customer_id        VARCHAR(50)   NULL,
                customer_name      VARCHAR(100)  NOT NULL DEFAULT 'Umum',
                user_id            VARCHAR(50)   NULL
                                     COMMENT 'Kasir / operator yang membuat order',
                total_harga        INT           NOT NULL DEFAULT 0,
                status_pembayaran  ENUM('belum_bayar','dp','lunas')  NOT NULL DEFAULT 'belum_bayar',
                dp_amount          INT           NOT NULL DEFAULT 0,
                remaining          INT           NOT NULL DEFAULT 0
                                     COMMENT 'Sisa tagihan = total_harga - dp_amount',
                metode_pembayaran  ENUM('tunai','transfer','qris','hutang')  NULL,
                deadline           DATE          NULL,
                catatan            TEXT          NULL,
                created_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
                updated_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                CONSTRAINT fk_orders_customer  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
                CONSTRAINT fk_orders_user      FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Induk pesanan percetakan (multi-item)'
        `);
        console.log('  ✅  Tabel orders');

        // ─────────────────────────────────────────────────────────────────────
        // 3. ORDER_ITEMS  —  Detail item dalam satu pesanan
        //    Mendukung: banner (hitung luas × harga/m²), ATK (qty × harga/pcs), dll.
        // ─────────────────────────────────────────────────────────────────────
        await conn.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id           VARCHAR(50)   PRIMARY KEY,
                order_id     VARCHAR(50)   NOT NULL,
                layanan      ENUM('digital_printing','offset','atk','jilid','fotocopy','jasa_desain','lainnya')
                               NOT NULL DEFAULT 'digital_printing',
                nama_item    VARCHAR(150)  NOT NULL
                               COMMENT 'Deskripsi singkat: Banner Warung Makan, Stiker Logo, dll.',
                material_id  VARCHAR(50)   NULL
                               COMMENT 'FK ke materials (NULL untuk jasa desain / ATK)',
                ukuran_p     DECIMAL(8,2)  NULL COMMENT 'Panjang dalam meter (untuk banner/stiker)',
                ukuran_l     DECIMAL(8,2)  NULL COMMENT 'Lebar dalam meter',
                luas_total   DECIMAL(10,4) GENERATED ALWAYS AS (ukuran_p * ukuran_l) STORED
                               COMMENT 'Otomatis dihitung: p × l (m²)',
                quantity     INT           NOT NULL DEFAULT 1,
                harga_satuan INT           NOT NULL DEFAULT 0
                               COMMENT 'Per m² atau per pcs, sesuai satuan material',
                subtotal     INT           NOT NULL DEFAULT 0
                               COMMENT 'Dihitung: luas_total × harga_satuan × quantity, atau qty × harga',
                file_desain  VARCHAR(500)  NULL COMMENT 'Path / URL file desain pelanggan',
                catatan      TEXT          NULL,

                CONSTRAINT fk_oi_order    FOREIGN KEY (order_id)    REFERENCES orders(id)    ON DELETE CASCADE,
                CONSTRAINT fk_oi_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Item detail per pesanan'
        `);
        console.log('  ✅  Tabel order_items');

        // ─────────────────────────────────────────────────────────────────────
        // 4. DESIGN_LOGS  —  Rekaman timer jasa desain per item
        //    Setiap sesi mulai/jeda/selesai dicatat di sini.
        // ─────────────────────────────────────────────────────────────────────
        await conn.query(`
            CREATE TABLE IF NOT EXISTS design_logs (
                id                   INT AUTO_INCREMENT PRIMARY KEY,
                order_item_id        VARCHAR(50)  NOT NULL,
                technician_id        VARCHAR(50)  NULL
                                       COMMENT 'User yang menjalankan timer',
                start_time           DATETIME     NOT NULL,
                end_time             DATETIME     NULL
                                       COMMENT 'NULL = timer masih berjalan',
                total_durasi_menit   INT          GENERATED ALWAYS AS (
                                         TIMESTAMPDIFF(MINUTE, start_time, end_time)
                                     ) STORED
                                       COMMENT 'Durasi otomatis (menit)',
                tarif_per_jam        INT          NOT NULL DEFAULT 50000
                                       COMMENT 'Tarif desain saat sesi dicatat (Rp/jam)',
                total_biaya_desain   INT          GENERATED ALWAYS AS (
                                         ROUND((TIMESTAMPDIFF(SECOND, start_time, COALESCE(end_time, start_time)) / 3600.0) * tarif_per_jam)
                                     ) STORED
                                       COMMENT 'Biaya desain otomatis (Rp)',
                catatan              TEXT         NULL,
                created_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_dl_order_item  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
                CONSTRAINT fk_dl_technician  FOREIGN KEY (technician_id) REFERENCES users(id)       ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Log sesi timer jasa desain'
        `);
        console.log('  ✅  Tabel design_logs');

        // ─────────────────────────────────────────────────────────────────────
        // 5. PRODUCTION_STATUS  —  Progres produksi per item (one-to-one)
        // ─────────────────────────────────────────────────────────────────────
        await conn.query(`
            CREATE TABLE IF NOT EXISTS production_status (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                order_item_id   VARCHAR(50)  NOT NULL UNIQUE
                                  COMMENT 'Satu item → satu baris progres',
                status          ENUM('menunggu','desain','approval','cetak','finishing','siap_diambil','selesai','batal')
                                  NOT NULL DEFAULT 'menunggu',
                catatan_teknis  TEXT         NULL,
                link_file_desain VARCHAR(500) NULL COMMENT 'URL file final dari galeri / cloud',
                foto_sebelum    VARCHAR(500) NULL,
                foto_sesudah    VARCHAR(500) NULL,
                operator_id     VARCHAR(50)  NULL
                                  COMMENT 'Operator yang update status terakhir',
                updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                CONSTRAINT fk_ps_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
                CONSTRAINT fk_ps_operator   FOREIGN KEY (operator_id)   REFERENCES users(id)       ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Status produksi per item pesanan'
        `);
        console.log('  ✅  Tabel production_status');

        // ─────────────────────────────────────────────────────────────────────
        // 6. EXPENSES  —  Pengeluaran operasional dengan alur approval
        // ─────────────────────────────────────────────────────────────────────
        await conn.query(`
            CREATE TABLE IF NOT EXISTS expenses (
                id              VARCHAR(50)  PRIMARY KEY,
                kategori        VARCHAR(80)  NOT NULL
                                  COMMENT 'Listrik, Gaji, Sewa, Pembelian Bahan, dll.',
                nominal         INT          NOT NULL DEFAULT 0,
                tanggal         DATE         NOT NULL,
                keterangan      TEXT         NULL,
                bukti_foto      VARCHAR(500) NULL COMMENT 'Path / URL foto struk/bukti',
                requested_by    VARCHAR(50)  NULL COMMENT 'User yang mengajukan pengeluaran',
                status_approval ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
                approved_by     VARCHAR(50)  NULL COMMENT 'Owner / admin yang menyetujui',
                approved_at     DATETIME     NULL,
                created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_exp_requester FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
                CONSTRAINT fk_exp_approver  FOREIGN KEY (approved_by)  REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Pengeluaran operasional dengan approval'
        `);
        console.log('  ✅  Tabel expenses');

        // ─────────────────────────────────────────────────────────────────────
        // 7. MATERIAL_MOVEMENTS  —  Mutasi stok bahan cetak (audit trail)
        //    Stok di tabel materials akan di-UPDATE setiap ada mutasi di sini.
        // ─────────────────────────────────────────────────────────────────────
        await conn.query(`
            CREATE TABLE IF NOT EXISTS material_movements (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                material_id   VARCHAR(50)  NOT NULL,
                tipe          ENUM('masuk','keluar','penyesuaian') NOT NULL,
                jumlah        DECIMAL(10,2) NOT NULL COMMENT 'Selalu positif; tipe menentukan arah',
                satuan        VARCHAR(20)  NOT NULL,
                referensi     VARCHAR(100) NULL COMMENT 'order_item_id atau nomor pembelian bahan',
                catatan       TEXT         NULL,
                user_id       VARCHAR(50)  NULL,
                tanggal       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_mm_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
                CONSTRAINT fk_mm_user     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Mutasi / riwayat stok bahan cetak'
        `);
        console.log('  ✅  Tabel material_movements');

        // ─────────────────────────────────────────────────────────────────────
        // 8. DEFAULT SETTINGS  —  Sisipkan nilai tarif desain default
        //    (tabel settings sudah ada di migrate.js)
        // ─────────────────────────────────────────────────────────────────────
        await conn.query(`
            INSERT IGNORE INTO settings (\`key\`, value) VALUES
            ('tarif_desain_per_jam', '50000'),
            ('ppn_persen',           '0'),
            ('nama_toko',            'Abadi Jaya Copier'),
            ('alamat_toko',          ''),
            ('no_whatsapp_toko',     '')
        `);
        console.log('  ✅  Default settings (tarif desain, PPN, nama toko)');

        // ─────────────────────────────────────────────────────────────────────
        // 9. SEED MATERIALS  —  Data bahan awal (bannert, vinyl, dll.)
        // ─────────────────────────────────────────────────────────────────────
        await conn.query(`
            INSERT IGNORE INTO materials (id, nama_bahan, kategori, satuan, harga_modal, harga_jual, stok_saat_ini, stok_minimum) VALUES
            ('mat001', 'Frontlite Standard 280gr',  'digital', 'm2',     15000,  25000, 50,  5),
            ('mat002', 'Frontlite High-Res 340gr',  'digital', 'm2',     22000,  35000, 30,  5),
            ('mat003', 'Albatros',                   'digital', 'm2',     45000,  65000, 20,  3),
            ('mat004', 'Bannertrans / Backlite',     'digital', 'm2',     50000,  75000, 15,  3),
            ('mat005', 'Vinyl Stiker Glossy',        'digital', 'm2',     30000,  50000, 25,  5),
            ('mat006', 'Vinyl Stiker Matte',         'digital', 'm2',     32000,  55000, 20,  5),
            ('mat007', 'HVS A4 70gr',                'offset',  'rim',    30000,  45000, 10,  2),
            ('mat008', 'HVS F4 70gr',                'offset',  'rim',    33000,  50000, 10,  2),
            ('mat009', 'Art Paper 120gr',            'offset',  'lembar',    500,   900, 500, 50),
            ('mat010', 'Laminasi Glossy',            'digital', 'm2',     20000,  35000, 30,  5)
        `);
        console.log('  ✅  Seed data: 10 bahan cetak awal');

        console.log('\n🎉  Migrasi percetakan selesai! 7 tabel berhasil dibuat.\n');
        conn.release();
        process.exit(0);

    } catch (err) {
        conn.release();
        console.error('\n❌  Migrasi GAGAL:', err.message);
        if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('   → Database "pos_abadi" belum ada. Jalankan: CREATE DATABASE pos_abadi;');
        }
        process.exit(1);
    }
}

run();
