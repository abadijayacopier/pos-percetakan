/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: activity_log
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `target` varchar(50) DEFAULT NULL,
  `detail` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB AUTO_INCREMENT = 238 DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: attendance
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `clock_in` datetime DEFAULT NULL,
  `clock_out` datetime DEFAULT NULL,
  `work_hours` decimal(5, 2) DEFAULT '0.00',
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: cash_flow
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `cash_flow` (
  `id` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `type` enum('in', 'out') NOT NULL,
  `category` varchar(50) NOT NULL,
  `amount` int(11) NOT NULL,
  `description` text,
  `reference_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: categories
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `categories` (
  `id` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `type` enum(
  'atk',
  'fotocopy_supply',
  'percetakan_supply',
  'sparepart'
  ) NOT NULL,
  `emoji` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: customers
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `customers` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `type` enum('walkin', 'corporate', 'vip', 'service') DEFAULT 'walkin',
  `company` varchar(100) DEFAULT NULL,
  `total_trx` int(11) DEFAULT '0',
  `total_spend` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: design_assignments
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `design_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` varchar(50) NOT NULL COMMENT 'ID pesanan dari dp_tasks (localStorage)',
  `designer_id` varchar(50) NOT NULL COMMENT 'FK ke users (role=desainer)',
  `status` enum('ditugaskan', 'dikerjakan', 'selesai', 'dibatalkan') NOT NULL DEFAULT 'ditugaskan',
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `started_at` datetime DEFAULT NULL COMMENT 'Waktu operator klik Mulai Desain',
  `finished_at` datetime DEFAULT NULL COMMENT 'Waktu operator klik Selesai Desain',
  `catatan` text,
  `file_hasil_desain` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_da_designer` (`designer_id`),
  CONSTRAINT `fk_da_designer` FOREIGN KEY (`designer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 11 DEFAULT CHARSET = utf8 COMMENT = 'Penugasan pesanan cetak ke operator desain';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: design_logs
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `design_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_item_id` varchar(50) NOT NULL,
  `technician_id` varchar(50) DEFAULT NULL COMMENT 'User yang menjalankan timer',
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL COMMENT 'NULL = timer masih berjalan',
  `total_durasi_menit` int(11) DEFAULT NULL COMMENT 'Durasi manual (menit)',
  `tarif_per_jam` int(11) NOT NULL DEFAULT '50000' COMMENT 'Tarif desain saat sesi dicatat (Rp/jam)',
  `total_biaya_desain` int(11) DEFAULT NULL COMMENT 'Biaya desain (Rp)',
  `catatan` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_dl_order_item` (`order_item_id`),
  KEY `fk_dl_technician` (`technician_id`),
  CONSTRAINT `fk_dl_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dl_technician` FOREIGN KEY (`technician_id`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8 COMMENT = 'Log sesi timer jasa desain';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: design_sessions
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `design_sessions` (
  `id` varchar(50) NOT NULL,
  `technician_id` varchar(50) DEFAULT NULL,
  `order_id` varchar(50) DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `current_duration` int(11) NOT NULL DEFAULT '0',
  `hourly_rate` decimal(10, 2) NOT NULL DEFAULT '50000.00',
  `status` enum('Running', 'Paused', 'Completed') NOT NULL DEFAULT 'Running',
  PRIMARY KEY (`id`),
  KEY `fk_ds_technician` (`technician_id`),
  KEY `fk_ds_order` (`order_id`),
  CONSTRAINT `fk_ds_order` FOREIGN KEY (`order_id`) REFERENCES `offset_orders` (`id`) ON DELETE
  SET
  NULL,
  CONSTRAINT `fk_ds_technician` FOREIGN KEY (`technician_id`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Timer Desain per order offset';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: digital_printing
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `digital_printing` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `price` decimal(15, 2) DEFAULT '0.00',
  `unit` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: dp_tasks
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `dp_tasks` (
  `id` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'menunggu_desain',
  `customerName` varchar(100) DEFAULT NULL,
  `customerId` varchar(50) DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `material_id` varchar(50) DEFAULT NULL,
  `material_name` varchar(100) DEFAULT NULL,
  `dimensions_w` decimal(10, 2) DEFAULT NULL,
  `dimensions_h` decimal(10, 2) DEFAULT NULL,
  `material_price` decimal(15, 2) DEFAULT '0.00',
  `design_price` decimal(15, 2) DEFAULT '0.00',
  `priority` varchar(50) DEFAULT 'normal',
  `pesan_desainer` text,
  `type` varchar(50) DEFAULT 'digital',
  `file_url` text,
  `qty` int(11) DEFAULT '1',
  `designer_id` varchar(50) DEFAULT NULL,
  `designer_name` varchar(100) DEFAULT NULL,
  `operator_id` varchar(50) DEFAULT NULL,
  `operator_name` varchar(100) DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `finished_at` datetime DEFAULT NULL,
  `dp_amount` decimal(15, 2) DEFAULT '0.00',
  `is_paid` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `denda_batal` decimal(15, 2) DEFAULT '0.00',
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Digital Printing tasks (formerly from localStorage)';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: employee_loans
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `employee_loans` (
  `id` varchar(50) NOT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  `amount` decimal(15, 2) DEFAULT NULL,
  `remaining_amount` decimal(15, 2) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `description` text,
  `status` varchar(50) DEFAULT 'unpaid',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: employees
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `employees` (
  `id` varchar(50) NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `nik` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `position` varchar(100) DEFAULT NULL,
  `salary_type` varchar(50) DEFAULT 'monthly',
  `base_salary` decimal(15, 2) DEFAULT '0.00',
  `hourly_rate` decimal(15, 2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: expenses
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `expenses` (
  `id` varchar(50) NOT NULL,
  `kategori` varchar(80) NOT NULL COMMENT 'Listrik, Gaji, Sewa, Pembelian Bahan, dll.',
  `nominal` int(11) NOT NULL DEFAULT '0',
  `tanggal` date NOT NULL,
  `keterangan` text,
  `bukti_foto` varchar(500) DEFAULT NULL COMMENT 'Path / URL foto struk/bukti',
  `requested_by` varchar(50) DEFAULT NULL COMMENT 'User yang mengajukan pengeluaran',
  `status_approval` enum('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `approved_by` varchar(50) DEFAULT NULL COMMENT 'Owner / admin yang menyetujui',
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_exp_requester` (`requested_by`),
  KEY `fk_exp_approver` (`approved_by`),
  CONSTRAINT `fk_exp_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL,
  CONSTRAINT `fk_exp_requester` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Pengeluaran operasional dengan approval';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: fotocopy_prices
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `fotocopy_prices` (
  `id` varchar(50) NOT NULL,
  `paper` enum('HVS A4', 'HVS F4', 'HVS A3') NOT NULL,
  `color` enum('bw', 'color') NOT NULL,
  `side` enum('1', '2') NOT NULL,
  `price` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: handovers
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `handovers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receiver_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receiver_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `handover_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `handover_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: material_movements
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `material_movements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `material_id` varchar(50) NOT NULL,
  `tipe` enum('masuk', 'keluar', 'penyesuaian') NOT NULL,
  `jumlah` decimal(10, 2) NOT NULL COMMENT 'Selalu positif; tipe menentukan arah',
  `satuan` varchar(20) NOT NULL,
  `referensi` varchar(100) DEFAULT NULL COMMENT 'order_item_id atau nomor pembelian bahan',
  `catatan` text,
  `user_id` varchar(50) DEFAULT NULL,
  `tanggal` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mm_material` (`material_id`),
  KEY `fk_mm_user` (`user_id`),
  CONSTRAINT `fk_mm_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Mutasi / riwayat stok bahan cetak';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: materials
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `materials` (
  `id` varchar(50) NOT NULL,
  `barcode` varchar(50) DEFAULT NULL,
  `nama_bahan` varchar(100) NOT NULL,
  `kategori` varchar(50) NOT NULL DEFAULT 'digital',
  `satuan` varchar(50) NOT NULL DEFAULT 'm2',
  `harga_modal` int(11) NOT NULL DEFAULT '0' COMMENT 'Harga pokok / modal per satuan (Rp)',
  `harga_jual` int(11) NOT NULL DEFAULT '0' COMMENT 'Harga jual ke pelanggan per satuan (Rp)',
  `stok_saat_ini` decimal(10, 2) NOT NULL DEFAULT '0.00' COMMENT 'Stok tersedia dalam satuan bahan',
  `stok_minimum` decimal(10, 2) NOT NULL DEFAULT '0.00' COMMENT 'Batas minimum sebelum notifikasi',
  `lokasi_rak` varchar(100) DEFAULT NULL,
  `supplier_id` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `barcode` (`barcode`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Master bahan cetak';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: offset_orders
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `offset_orders` (
  `id` varchar(50) NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `product_id` varchar(50) DEFAULT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  `qty` int(11) NOT NULL DEFAULT '1',
  `spesifikasi_json` text,
  `total_estimasi_produksi` decimal(12, 2) NOT NULL DEFAULT '0.00',
  `total_biaya_desain` decimal(12, 2) NOT NULL DEFAULT '0.00',
  `grand_total` decimal(12, 2) NOT NULL DEFAULT '0.00',
  `status_order` enum('Pending', 'Printing', 'Finished') NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `fk_oo_product` (`product_id`),
  KEY `fk_oo_customer` (`customer_id`),
  CONSTRAINT `fk_oo_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE
  SET
  NULL,
  CONSTRAINT `fk_oo_product` FOREIGN KEY (`product_id`) REFERENCES `offset_products` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Pesanan cetak offset';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: offset_printing
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `offset_printing` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `price` decimal(15, 2) DEFAULT '0.00',
  `unit` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: offset_products
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `offset_products` (
  `id` varchar(50) NOT NULL,
  `nama_produk` varchar(100) NOT NULL,
  `deskripsi_singkat` text,
  `harga_base` decimal(10, 2) NOT NULL DEFAULT '0.00',
  `satuan` varchar(20) NOT NULL,
  `is_best_seller` tinyint(1) DEFAULT '0',
  `image_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Master Katalog Produk Offset';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: order_items
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` varchar(50) NOT NULL,
  `order_id` varchar(50) NOT NULL,
  `layanan` enum(
  'digital_printing',
  'offset',
  'atk',
  'jilid',
  'fotocopy',
  'jasa_desain',
  'lainnya'
  ) NOT NULL DEFAULT 'digital_printing',
  `nama_item` varchar(150) NOT NULL COMMENT 'Deskripsi singkat: Banner Warung Makan, Stiker Logo, dll.',
  `material_id` varchar(50) DEFAULT NULL COMMENT 'FK ke materials (NULL untuk jasa desain / ATK)',
  `ukuran_p` decimal(8, 2) DEFAULT NULL COMMENT 'Panjang dalam meter (untuk banner/stiker)',
  `ukuran_l` decimal(8, 2) DEFAULT NULL COMMENT 'Lebar dalam meter',
  `luas_total` decimal(10, 4) DEFAULT NULL COMMENT 'Dihitung: p × l (m²)',
  `quantity` int(11) NOT NULL DEFAULT '1',
  `harga_satuan` int(11) NOT NULL DEFAULT '0' COMMENT 'Per m² atau per pcs, sesuai satuan material',
  `subtotal` int(11) NOT NULL DEFAULT '0' COMMENT 'Dihitung: luas_total × harga_satuan × quantity, atau qty × harga',
  `file_desain` varchar(500) DEFAULT NULL COMMENT 'Path / URL file desain pelanggan',
  `catatan` text,
  PRIMARY KEY (`id`),
  KEY `fk_oi_order` (`order_id`),
  KEY `fk_oi_material` (`material_id`),
  CONSTRAINT `fk_oi_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE
  SET
  NULL,
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Item detail per pesanan';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: orders
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `orders` (
  `id` varchar(50) NOT NULL,
  `order_number` varchar(50) NOT NULL COMMENT 'Nomor cantik: ORD-9021, dsb.',
  `customer_id` varchar(50) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL DEFAULT 'Umum',
  `user_id` varchar(50) DEFAULT NULL COMMENT 'Kasir / operator yang membuat order',
  `total_harga` int(11) NOT NULL DEFAULT '0',
  `status_pembayaran` enum('belum_bayar', 'dp', 'lunas') NOT NULL DEFAULT 'belum_bayar',
  `dp_amount` int(11) NOT NULL DEFAULT '0',
  `remaining` int(11) NOT NULL DEFAULT '0' COMMENT 'Sisa tagihan = total_harga - dp_amount',
  `metode_pembayaran` enum('tunai', 'transfer', 'qris', 'hutang') DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `catatan` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `fk_orders_customer` (`customer_id`),
  KEY `fk_orders_user` (`user_id`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE
  SET
  NULL,
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Induk pesanan percetakan (multi-item)';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: pricing_logs
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `pricing_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` varchar(50) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `payload_sebelum` text,
  `payload_sesudah` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `pricing_logs_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pricing_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: pricing_rules
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `pricing_rules` (
  `id` varchar(50) NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `min_qty` int(11) NOT NULL DEFAULT '0',
  `max_qty` int(11) NOT NULL DEFAULT '0',
  `unit_price` decimal(10, 2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `fk_pr_product` (`product_id`),
  CONSTRAINT `fk_pr_product` FOREIGN KEY (`product_id`) REFERENCES `offset_products` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Harga grosir/berjenjang offset';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: print_orders
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `print_orders` (
  `id` varchar(50) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `type` varchar(100) NOT NULL,
  `description` text,
  `specs` text,
  `qty` int(11) NOT NULL,
  `unit` varchar(20) DEFAULT 'pcs',
  `total_price` int(11) NOT NULL,
  `dp_amount` int(11) DEFAULT '0',
  `remaining` int(11) DEFAULT '0',
  `shipping_cost` int(11) DEFAULT '0',
  `deadline` date DEFAULT NULL,
  `status` enum(
  'pending',
  'desain',
  'approval',
  'cetak',
  'selesai',
  'diambil',
  'batal'
  ) DEFAULT 'pending',
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `print_orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: product_options
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `product_options` (
  `id` varchar(50) NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `kategori_opsi` enum('Ukuran', 'Rangkap', 'Finishing', 'Bahan', 'Lainnya') NOT NULL,
  `label_opsi` varchar(100) NOT NULL,
  `tambahan_biaya` decimal(10, 2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `fk_po_product` (`product_id`),
  CONSTRAINT `fk_po_product` FOREIGN KEY (`product_id`) REFERENCES `offset_products` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Variabel spesifikasi produk';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: production_status
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `production_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_item_id` varchar(50) NOT NULL COMMENT 'Satu item → satu baris progres',
  `status` enum(
  'menunggu',
  'desain',
  'approval',
  'cetak',
  'finishing',
  'siap_diambil',
  'selesai',
  'batal'
  ) NOT NULL DEFAULT 'menunggu',
  `catatan_teknis` text,
  `link_file_desain` varchar(500) DEFAULT NULL COMMENT 'URL file final dari galeri / cloud',
  `foto_sebelum` varchar(500) DEFAULT NULL,
  `foto_sesudah` varchar(500) DEFAULT NULL,
  `operator_id` varchar(50) DEFAULT NULL COMMENT 'Operator yang update status terakhir',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_item_id` (`order_item_id`),
  KEY `fk_ps_operator` (`operator_id`),
  CONSTRAINT `fk_ps_operator` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL,
  CONSTRAINT `fk_ps_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8 COMMENT = 'Status produksi per item pesanan';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: products
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `products` (
  `id` varchar(50) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category_id` varchar(50) DEFAULT NULL,
  `buy_price` int(11) NOT NULL DEFAULT '0',
  `sell_price` int(11) NOT NULL DEFAULT '0',
  `stock` int(11) NOT NULL DEFAULT '0',
  `min_stock` int(11) NOT NULL DEFAULT '0',
  `unit` varchar(20) DEFAULT 'pcs',
  `emoji` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: purchase_items
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `purchase_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_id` varchar(50) NOT NULL,
  `item_type` enum('product', 'material') NOT NULL,
  `item_id` varchar(50) NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `qty` decimal(10, 2) NOT NULL,
  `unit_cost` int(11) NOT NULL DEFAULT '0',
  `subtotal` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_purchase_items_parent` (`purchase_id`),
  CONSTRAINT `fk_purchase_items_parent` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8 COMMENT = 'Detail item dari transaksi pembelian';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: purchases
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `purchases` (
  `id` varchar(50) NOT NULL,
  `invoice_no` varchar(50) NOT NULL,
  `supplier_id` varchar(50) DEFAULT NULL,
  `supplier_name` varchar(100) NOT NULL DEFAULT 'Umum',
  `date` datetime NOT NULL,
  `total_amount` int(11) NOT NULL DEFAULT '0',
  `payment_status` enum('lunas', 'hutang') NOT NULL DEFAULT 'lunas',
  `notes` text,
  `user_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  KEY `fk_purchases_user` (`user_id`),
  CONSTRAINT `fk_purchases_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Daftar transaksi barang masuk / pembelian';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: salaries
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `salaries` (
  `id` varchar(50) NOT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  `period_month` int(11) DEFAULT NULL,
  `period_year` int(11) DEFAULT NULL,
  `base_processing_salary` decimal(15, 2) DEFAULT '0.00',
  `attendance_bonus` decimal(15, 2) DEFAULT '0.00',
  `overtime_pay` decimal(15, 2) DEFAULT '0.00',
  `loan_deduction` decimal(15, 2) DEFAULT '0.00',
  `other_deductions` decimal(15, 2) DEFAULT '0.00',
  `net_salary` decimal(15, 2) DEFAULT '0.00',
  `status` varchar(50) DEFAULT 'draft',
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: service_orders
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `service_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_no` varchar(50) NOT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `machine_info` varchar(100) NOT NULL,
  `serial_no` varchar(50) DEFAULT NULL,
  `complaint` text NOT NULL,
  `condition_physic` text,
  `diagnosis` text,
  `labor_cost` int(11) DEFAULT '0',
  `dp_amount` decimal(15, 2) DEFAULT '0.00',
  `total_cost` int(11) DEFAULT '0',
  `status` enum(
  'diterima',
  'diagnosa',
  'approval',
  'tunggu_part',
  'pengerjaan',
  'testing',
  'selesai',
  'diambil',
  'batal'
  ) DEFAULT 'diterima',
  `technician_id` varchar(50) DEFAULT NULL,
  `warranty_end` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `service_no` (`service_no`),
  KEY `customer_id` (`customer_id`),
  KEY `technician_id` (`technician_id`),
  CONSTRAINT `service_orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE
  SET
  NULL,
  CONSTRAINT `service_orders_ibfk_2` FOREIGN KEY (`technician_id`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: service_spareparts
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `service_spareparts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_order_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `qty` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  `product_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `service_order_id` (`service_order_id`),
  KEY `fk_sparepart_product` (`product_id`),
  CONSTRAINT `fk_sparepart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE
  SET
  NULL,
  CONSTRAINT `service_spareparts_ibfk_1` FOREIGN KEY (`service_order_id`) REFERENCES `service_orders` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: settings
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE = InnoDB AUTO_INCREMENT = 58 DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: spk
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `spk` (
  `id` varchar(50) NOT NULL,
  `spk_number` varchar(50) NOT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  `customer_name` varchar(150) NOT NULL,
  `customer_phone` varchar(30) DEFAULT NULL,
  `customer_company` varchar(150) DEFAULT NULL,
  `product_name` varchar(200) NOT NULL,
  `product_qty` int(11) NOT NULL DEFAULT '1',
  `product_unit` varchar(30) NOT NULL DEFAULT 'pcs',
  `kategori` varchar(50) DEFAULT 'Cetak Offset',
  `specs_material` text,
  `specs_finishing` text,
  `specs_notes` text,
  `biaya_cetak` decimal(12, 2) NOT NULL DEFAULT '0.00',
  `biaya_material` decimal(12, 2) NOT NULL DEFAULT '0.00',
  `biaya_finishing` decimal(12, 2) NOT NULL DEFAULT '0.00',
  `biaya_desain` decimal(12, 2) NOT NULL DEFAULT '0.00',
  `biaya_lainnya` decimal(12, 2) NOT NULL DEFAULT '0.00',
  `total_biaya` decimal(12, 2) NOT NULL DEFAULT '0.00',
  `dp_amount` decimal(12, 2) NOT NULL DEFAULT '0.00',
  `sisa_tagihan` decimal(12, 2) NOT NULL DEFAULT '0.00',
  `status` enum(
  'Menunggu Antrian',
  'Dalam Proses Cetak',
  'Finishing',
  'Quality Control',
  'Selesai',
  'Siap Diambil',
  'Diambil',
  'Batal'
  ) DEFAULT 'Menunggu Antrian',
  `priority` enum('Rendah', 'Normal', 'Tinggi', 'Urgent') NOT NULL DEFAULT 'Normal',
  `assigned_to` varchar(50) DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `offset_order_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `spk_number` (`spk_number`),
  KEY `fk_spk_customer` (`customer_id`),
  KEY `fk_spk_assigned` (`assigned_to`),
  KEY `fk_spk_created` (`created_by`),
  CONSTRAINT `fk_spk_assigned` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL,
  CONSTRAINT `fk_spk_created` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL,
  CONSTRAINT `fk_spk_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Master Surat Perintah Kerja';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: spk_handovers
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `spk_handovers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `spk_id` varchar(50) NOT NULL,
  `received_by_name` varchar(150) NOT NULL,
  `received_by_phone` varchar(30) DEFAULT NULL,
  `signature_data` longtext,
  `photo_evidence` text,
  `notes` text,
  `handed_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_spkho_spk` (`spk_id`),
  KEY `fk_spkho_user` (`handed_by`),
  CONSTRAINT `fk_spkho_spk` FOREIGN KEY (`spk_id`) REFERENCES `spk` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_spkho_user` FOREIGN KEY (`handed_by`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COMMENT = 'Bukti serah terima barang';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: spk_logs
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `spk_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `spk_id` varchar(50) NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `description` text,
  `old_value` varchar(100) DEFAULT NULL,
  `new_value` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_spklog_spk` (`spk_id`),
  KEY `fk_spklog_user` (`user_id`),
  CONSTRAINT `fk_spklog_spk` FOREIGN KEY (`spk_id`) REFERENCES `spk` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_spklog_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB AUTO_INCREMENT = 51 DEFAULT CHARSET = utf8 COMMENT = 'Log aktivitas produksi SPK';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: spk_payments
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `spk_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `spk_id` varchar(50) NOT NULL,
  `payment_type` enum('DP', 'Pelunasan') NOT NULL DEFAULT 'Pelunasan',
  `method` enum('Tunai', 'QRIS', 'Transfer') NOT NULL DEFAULT 'Tunai',
  `amount` decimal(12, 2) NOT NULL DEFAULT '0.00',
  `bank_ref` varchar(100) DEFAULT NULL,
  `status` enum('Pending', 'Berhasil', 'Gagal') NOT NULL DEFAULT 'Berhasil',
  `paid_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_spkpay_spk` (`spk_id`),
  KEY `fk_spkpay_user` (`paid_by`),
  CONSTRAINT `fk_spkpay_spk` FOREIGN KEY (`spk_id`) REFERENCES `spk` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_spkpay_user` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8 COMMENT = 'Riwayat pembayaran SPK';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: stock_movements
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` varchar(50) NOT NULL,
  `type` enum('in', 'out', 'adjust') NOT NULL,
  `qty` int(11) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reference` varchar(100) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: suppliers
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: tiered_pricing_rules
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `tiered_pricing_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` varchar(50) NOT NULL,
  `min_kuantitas` int(11) NOT NULL,
  `max_kuantitas` int(11) DEFAULT NULL,
  `diskon_persen` decimal(5, 2) DEFAULT '0.00',
  `harga_per_unit_akhir` decimal(10, 2) NOT NULL,
  `urutan_tier` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `tiered_pricing_rules_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 7 DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: transaction_details
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `transaction_details` (
  `id` varchar(50) NOT NULL,
  `transaction_id` varchar(50) NOT NULL,
  `product_id` varchar(50) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `qty` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  `subtotal` int(11) NOT NULL,
  `discount` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `transaction_id` (`transaction_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `transaction_details_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transaction_details_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: transactions
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` varchar(50) NOT NULL,
  `invoice_no` varchar(50) NOT NULL,
  `date` datetime NOT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  `customer_name` varchar(100) DEFAULT 'Umum',
  `customer_wa` varchar(20) DEFAULT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `type` varchar(50) DEFAULT 'sale',
  `subtotal` int(11) NOT NULL,
  `discount` int(11) DEFAULT '0',
  `tax_amount` int(11) DEFAULT '0',
  `total` int(11) NOT NULL,
  `paid` int(11) DEFAULT '0',
  `change_amount` int(11) DEFAULT '0',
  `payment_type` varchar(50) DEFAULT 'tunai',
  `status` varchar(50) DEFAULT 'unpaid',
  `notes` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  KEY `customer_id` (`customer_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE
  SET
  NULL,
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: users
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin', 'kasir', 'operator', 'teknisi', 'desainer') NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: wa_config
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `wa_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL,
  `config_value` text,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`)
) ENGINE = InnoDB AUTO_INCREMENT = 8 DEFAULT CHARSET = utf8 COMMENT = 'Konfigurasi API WhatsApp';

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: activity_log
# ------------------------------------------------------------

INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    1,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-09 07:24:26'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    2,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-09 17:35:48'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    3,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-09 17:48:17'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    4,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-09 21:08:34'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    5,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-10 00:52:07'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    6,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-10 12:32:23'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    7,
    'u1',
    'Admin Utama',
    'Tugaskan Desainer',
    NULL,
    'Pesanan ORD-9177 ditugaskan ke Andi Desainer',
    NULL,
    '2026-03-10 12:40:10'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    8,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-10 12:41:47'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    9,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-10 12:47:34'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    10,
    'des001',
    'Andi Desainer',
    'Mulai Desain',
    NULL,
    'Operator mulai mengerjakan pesanan ORD-9177',
    NULL,
    '2026-03-10 12:47:46'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    11,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-10 12:55:20'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    12,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-10 12:59:40'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    13,
    'u1',
    'Admin Utama',
    'Tugaskan Desainer',
    NULL,
    'Pesanan ORD-8330 ditugaskan ke Budi Desainer',
    NULL,
    '2026-03-10 13:40:09'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    14,
    'u3',
    'Operator Cetak',
    'login',
    NULL,
    'Login sebagai operator',
    NULL,
    '2026-03-10 13:45:52'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    15,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-10 13:46:09'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    16,
    'u4',
    'Teknisi Abadi',
    'login',
    NULL,
    'Login sebagai teknisi',
    NULL,
    '2026-03-10 13:46:14'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    17,
    'u2',
    'Kasir Depan',
    'login',
    NULL,
    'Login sebagai kasir',
    NULL,
    '2026-03-10 13:46:35'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    18,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-10 13:46:42'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    19,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-10 13:57:43'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    20,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-10 13:57:55'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    21,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-10 13:57:59'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    22,
    'des001',
    'Andi Desainer',
    'Selesai Desain',
    NULL,
    'Operator menyelesaikan desain pesanan ORD-9177',
    NULL,
    '2026-03-10 13:58:14'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    23,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-10 13:58:19'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    24,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-10 13:58:22'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    25,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-10 13:58:28'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    26,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-10 13:58:54'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    27,
    'u1',
    'Admin Utama',
    'Tugaskan Desainer',
    NULL,
    'Pesanan ORD-6334 ditugaskan ke Andi Desainer',
    NULL,
    '2026-03-10 13:59:03'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    28,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-10 13:59:07'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    29,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-10 13:59:19'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    30,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-10 14:11:33'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    31,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-10 14:27:18'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    32,
    'des001',
    'Andi Desainer',
    'Mulai Desain',
    NULL,
    'Operator mulai mengerjakan pesanan ORD-6334',
    NULL,
    '2026-03-10 14:27:31'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    33,
    'des001',
    'Andi Desainer',
    'Selesai Desain',
    NULL,
    'Operator menyelesaikan desain pesanan ORD-6334',
    NULL,
    '2026-03-10 14:27:55'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    34,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-10 14:28:01'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    35,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-10 14:39:49'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    36,
    'u1',
    'Admin Utama',
    'Tugaskan Desainer',
    NULL,
    'Pesanan ORD-2966 ditugaskan ke Andi Desainer',
    NULL,
    '2026-03-10 14:43:45'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    37,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-10 14:44:29'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    38,
    'des001',
    'Andi Desainer',
    'Mulai Desain',
    NULL,
    'Operator mulai mengerjakan pesanan ORD-2966',
    NULL,
    '2026-03-10 14:45:01'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    39,
    'des001',
    'Andi Desainer',
    'Selesai Desain',
    NULL,
    'Operator menyelesaikan desain pesanan ORD-2966',
    NULL,
    '2026-03-10 14:45:57'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    40,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-10 14:46:11'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    41,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-11 11:16:32'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    42,
    'u1',
    'Admin Utama',
    'Tugaskan Desainer',
    NULL,
    'Pesanan ORD-8287 ditugaskan ke Andi Desainer',
    NULL,
    '2026-03-11 11:23:48'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    43,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-11 11:23:58'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    44,
    'des001',
    'Andi Desainer',
    'Mulai Desain',
    NULL,
    'Operator mulai mengerjakan pesanan ORD-8287',
    NULL,
    '2026-03-11 11:24:03'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    45,
    'des001',
    'Andi Desainer',
    'Selesai Desain',
    NULL,
    'Operator menyelesaikan desain pesanan ORD-8287',
    NULL,
    '2026-03-11 11:24:08'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    46,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-11 11:24:12'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    47,
    'u1',
    'Admin Utama',
    'Tugaskan Desainer',
    NULL,
    'Pesanan ORD-3511 ditugaskan ke Supri',
    NULL,
    '2026-03-11 11:41:24'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    48,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-11 11:41:30'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    49,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-11 11:41:56'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    50,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-11 11:43:06'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    51,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-11 11:43:16'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    52,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-11 11:47:36'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    53,
    'des1773155248207',
    'Supri',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-11 11:52:54'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    54,
    'des1773155248207',
    'Supri',
    'Mulai Desain',
    NULL,
    'Operator mulai mengerjakan pesanan ORD-3511',
    NULL,
    '2026-03-11 11:53:06'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    55,
    'des1773155248207',
    'Supri',
    'Selesai Desain',
    NULL,
    'Operator menyelesaikan desain pesanan ORD-3511',
    NULL,
    '2026-03-11 11:53:23'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    56,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-11 11:53:30'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    57,
    'u1',
    'Admin Utama',
    'Tugaskan Desainer',
    NULL,
    'Pesanan ORD-6955 ditugaskan ke Andi Desainer',
    NULL,
    '2026-03-11 12:09:30'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    58,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-11 12:11:48'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    59,
    'des001',
    'Andi Desainer',
    'Mulai Desain',
    NULL,
    'Operator mulai mengerjakan pesanan ORD-6955',
    NULL,
    '2026-03-11 12:11:51'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    60,
    'des001',
    'Andi Desainer',
    'Selesai Desain',
    NULL,
    'Operator menyelesaikan desain pesanan ORD-6955',
    NULL,
    '2026-03-11 12:11:54'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    61,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-11 12:12:01'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    62,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-13 16:50:34'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    63,
    'u2',
    'Kasir Depan',
    'login',
    NULL,
    'Login sebagai kasir',
    NULL,
    '2026-03-13 17:09:39'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    64,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-13 18:35:18'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    65,
    'u1',
    'Admin Utama',
    'Tugaskan Desainer',
    NULL,
    'Pesanan ORD-2768 ditugaskan ke Andi Desainer',
    NULL,
    '2026-03-14 01:48:47'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    66,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-14 02:34:24'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    67,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 02:35:22'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    68,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 07:18:43'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    69,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 07:33:35'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    70,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 07:35:54'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    71,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 07:36:26'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    72,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 07:48:12'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    73,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 07:53:21'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    74,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-14 07:54:48'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    75,
    'u4',
    'Teknisi Abadi',
    'login',
    NULL,
    'Login sebagai teknisi',
    NULL,
    '2026-03-14 07:56:14'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    76,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 07:56:50'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    77,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 08:52:07'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    78,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 09:14:00'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    79,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 09:37:04'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    80,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 09:54:22'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    81,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 11:15:34'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    82,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 11:25:39'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    83,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 11:26:42'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    84,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 11:29:57'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    85,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 11:42:08'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    86,
    'u2',
    'Kasir Depan',
    'login',
    NULL,
    'Login sebagai kasir',
    NULL,
    '2026-03-14 11:50:15'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    87,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 12:01:18'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    88,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 15:48:21'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    89,
    'u4',
    'Teknisi Abadi',
    'login',
    NULL,
    'Login sebagai teknisi',
    NULL,
    '2026-03-14 15:55:36'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    90,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 16:16:18'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    91,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 16:24:16'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    92,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-14 17:08:37'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    93,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-15 02:45:42'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    94,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-15 02:54:04'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    95,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-15 03:41:14'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    96,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-15 08:50:48'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    97,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-15 09:16:28'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    98,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-15 10:57:33'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    99,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-15 10:57:41'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    100,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-15 11:24:06'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    101,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-15 11:58:36'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    102,
    'des002',
    'Budi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-15 12:18:53'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    103,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-15 12:19:04'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    104,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-15 15:35:17'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    105,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-15 16:39:48'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    106,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-15 18:04:37'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    107,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-15 18:05:34'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    108,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-15 18:06:48'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    109,
    'u1',
    'Admin Utama',
    'Tugaskan Desainer',
    NULL,
    'Pesanan ORD-4309 ditugaskan ke Supri',
    NULL,
    '2026-03-15 21:46:50'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    110,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-16 05:59:12'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    111,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-16 06:06:14'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    112,
    'des1773155248207',
    'Supri',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-16 11:06:55'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    113,
    'des1773155248207',
    'Supri',
    'Mulai Desain',
    NULL,
    'Operator mulai mengerjakan pesanan ORD-4309',
    NULL,
    '2026-03-16 11:26:27'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    114,
    'des1773155248207',
    'Supri',
    'Selesai Desain',
    NULL,
    'Operator menyelesaikan desain pesanan ORD-4309',
    NULL,
    '2026-03-16 11:26:53'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    115,
    'des1773155248207',
    'Supri',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-16 11:58:07'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    116,
    'des1773155248207',
    'Supri',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-16 12:01:07'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    117,
    'des1773155248207',
    'Supri',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-16 12:03:03'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    118,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-16 12:13:27'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    119,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-16 12:28:05'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    120,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-16 12:48:30'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    121,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-16 12:54:13'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    122,
    'des1773155248207',
    'Supri',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-16 12:54:32'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    123,
    'des1773155248207',
    'Supri',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-16 12:56:13'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    124,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-16 16:51:50'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    125,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-16 17:03:20'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    126,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-16 17:04:30'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    127,
    'des1773155248207',
    'Supri',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-16 17:12:31'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    128,
    'u2',
    'Kasir Depan',
    'login',
    NULL,
    'Login sebagai kasir',
    NULL,
    '2026-03-16 17:21:10'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    129,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-16 17:21:27'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    130,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-16 17:51:29'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    131,
    'des1773155248207',
    'Supri',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-03-16 17:53:18'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    132,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-16 17:53:38'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    133,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-17 00:17:56'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    134,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-17 10:48:53'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    135,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-17 12:15:59'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    136,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-17 12:37:45'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    137,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-17 17:41:50'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    138,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-17 17:44:36'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    139,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-17 17:50:50'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    140,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-17 17:52:28'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    141,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-17 18:16:42'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    142,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-18 00:26:19'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    143,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-18 17:39:29'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    144,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-19 14:31:31'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    145,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-19 15:00:08'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    146,
    'u1',
    'Admin Utama',
    'Tugaskan Desainer',
    NULL,
    'Pesanan ORD-1202 ditugaskan ke Supri',
    NULL,
    '2026-03-21 05:02:00'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    147,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-21 05:07:11'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    148,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-22 06:13:14'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    149,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-22 06:13:44'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    150,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-22 06:14:08'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    151,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-22 06:19:33'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    152,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-22 06:25:36'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    154,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-22 09:28:47'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    155,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202603-2545 (500)',
    NULL,
    '2026-03-22 09:57:45'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    156,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202603-2987 (500)',
    NULL,
    '2026-03-22 09:58:30'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    157,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-22 11:11:13'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    158,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-22 11:40:57'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    159,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-22 12:03:28'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    160,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202603-7418 (1000)',
    NULL,
    '2026-03-22 12:50:55'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    161,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202603-2152 (1000)',
    NULL,
    '2026-03-22 12:51:48'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    162,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-22 14:13:17'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    163,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-23 10:06:50'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    164,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-23 17:01:38'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    165,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202603-2871 (50000)',
    NULL,
    '2026-03-24 00:56:32'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    166,
    'u1',
    'Admin Utama',
    'delete_transaction',
    NULL,
    'Hapus & Void TRX t1774313792008',
    NULL,
    '2026-03-24 01:00:33'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    167,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202603-9614 (3000)',
    NULL,
    '2026-03-24 05:06:40'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    168,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202603-8700 (6250)',
    NULL,
    '2026-03-24 09:14:33'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    169,
    'u1',
    'Admin Utama',
    'edit_transaction',
    NULL,
    'Edit Transaksi t1774343673551 ',
    NULL,
    '2026-03-24 09:20:56'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    170,
    'u1',
    'Admin Utama',
    'edit_transaction',
    NULL,
    'Edit Transaksi t1774343673551 ',
    NULL,
    '2026-03-24 09:21:01'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    171,
    'u1',
    'Admin Utama',
    'edit_transaction',
    NULL,
    'Edit Transaksi t1774343673551 ',
    NULL,
    '2026-03-24 09:21:53'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    172,
    'u1',
    'Admin Utama',
    'delete_transaction',
    NULL,
    'Hapus & Void TRX t1774343673551',
    NULL,
    '2026-03-24 09:39:38'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    173,
    'u1',
    'Admin Utama',
    'edit_transaction',
    NULL,
    'Edit Transaksi t1774328800360 ',
    NULL,
    '2026-03-24 17:35:18'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    174,
    'u1',
    'Admin Utama',
    'edit_transaction',
    NULL,
    'Edit Transaksi t1774328800360 ',
    NULL,
    '2026-03-24 17:40:48'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    175,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202603-2662 (1000)',
    NULL,
    '2026-03-24 17:44:37'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    176,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202603-9586 (1000)',
    NULL,
    '2026-03-24 17:55:22'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    177,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202603-4246 (6250)',
    NULL,
    '2026-03-25 01:22:20'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    178,
    'u1',
    'Admin Utama',
    'delete_transaction',
    NULL,
    'Hapus & Void TRX t1774401740124',
    NULL,
    '2026-03-25 01:30:46'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    179,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202603-6443 (1000)',
    NULL,
    '2026-03-25 05:23:00'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    180,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202603-9989 (6250)',
    NULL,
    '2026-03-25 09:55:02'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    181,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202603-1505 (7500)',
    NULL,
    '2026-03-25 11:33:31'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    182,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-31 15:34:12'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    183,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-03-31 15:37:35'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    184,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202603-8009 (750)',
    NULL,
    '2026-03-31 15:37:48'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    185,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-04-01 15:27:38'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    186,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-04-01 15:35:44'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    187,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-04-01 15:39:11'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    188,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202604-1522 (750)',
    NULL,
    '2026-04-01 15:41:29'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    189,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202604-3417 (1000)',
    NULL,
    '2026-04-01 15:42:04'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    190,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-04-02 09:21:58'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    191,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-04-02 09:31:11'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    192,
    'u2',
    'Kasir Depan',
    'login',
    NULL,
    'Login sebagai kasir',
    NULL,
    '2026-04-02 09:32:16'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    193,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-04-02 09:36:15'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    194,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202604-4887 (5500)',
    NULL,
    '2026-04-02 10:02:23'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    195,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202604-8791 (15000)',
    NULL,
    '2026-04-02 10:15:39'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    196,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-04-02 10:43:40'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    197,
    'des001',
    'Andi Desainer',
    'login',
    NULL,
    'Login sebagai desainer',
    NULL,
    '2026-04-02 10:44:41'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    198,
    'des001',
    'Andi Desainer',
    'Mulai Desain',
    NULL,
    'Operator mulai mengerjakan pesanan ORD-2768',
    NULL,
    '2026-04-02 10:44:57'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    199,
    'des001',
    'Andi Desainer',
    'Selesai Desain',
    NULL,
    'Operator menyelesaikan desain pesanan ORD-2768',
    NULL,
    '2026-04-02 10:45:11'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    200,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-04-02 10:45:15'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    201,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202604-4603 (250)',
    NULL,
    '2026-04-02 12:05:27'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    202,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202604-5961 (500)',
    NULL,
    '2026-04-02 12:23:11'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    203,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202604-2863 (250)',
    NULL,
    '2026-04-02 12:23:59'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    204,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202604-4827 (500)',
    NULL,
    '2026-04-02 12:32:08'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    205,
    'u1',
    'Admin Utama',
    'add_transaction',
    NULL,
    'Invoice TRX-202604-7178 (250)',
    NULL,
    '2026-04-02 12:38:41'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    206,
    'u1',
    'Admin Utama',
    'delete_transaction',
    NULL,
    'Hapus & Void TRX t1775133521084',
    NULL,
    '2026-04-02 12:51:21'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    207,
    'u1',
    'Admin Utama',
    'delete_transaction',
    NULL,
    'Hapus & Void TRX t1775133128268',
    NULL,
    '2026-04-02 12:51:23'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    208,
    'u1',
    'Admin Utama',
    'delete_transaction',
    NULL,
    'Hapus & Void TRX t1775132639220',
    NULL,
    '2026-04-02 12:51:25'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    209,
    'u1',
    'Admin Utama',
    'delete_transaction',
    NULL,
    'Hapus & Void TRX t1775132591045',
    NULL,
    '2026-04-02 12:51:28'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    210,
    'u1',
    'Admin Utama',
    'delete_transaction',
    NULL,
    'Hapus & Void TRX t1775131527142',
    NULL,
    '2026-04-02 12:51:31'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    211,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-04-02 13:05:31'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    212,
    'u1',
    'Admin Utama',
    'login',
    NULL,
    'Login sebagai admin',
    NULL,
    '2026-04-09 11:10:58'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    213,
    'u1',
    'Admin Utama',
    'RESTORE_DB',
    'System',
    'Memulihkan database MySQL',
    '::1',
    '2026-05-18 20:49:00'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    214,
    'u1',
    'Admin Utama',
    'ACTIVATE_LICENSE',
    'License',
    'Aktivasi produk untuk Abadi Jaya Copier',
    '::1',
    '2026-05-18 20:49:13'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    215,
    'u1',
    'Admin Utama',
    'UPDATE_SETTINGS',
    'System',
    'Update 49 pengaturan sistem',
    '::1',
    '2026-05-21 16:57:25'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    216,
    'u1',
    'Admin Utama',
    'CREATE_CUSTOMER',
    'KPRI  LEMBEYAN',
    'Tambah pelanggan: KPRI  LEMBEYAN',
    '::1',
    '2026-05-21 17:02:03'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    217,
    'u1',
    'Admin Utama',
    'CREATE_PRODUCT',
    'CETAK ID CARD',
    'Tambah produk: CETAK ID CARD (PRD-MPFBRITS)',
    '::1',
    '2026-05-21 17:05:21'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    218,
    'u1',
    'Admin Utama',
    'UPDATE_PRODUCT',
    'CETAK ID CARD',
    'Update produk: CETAK ID CARD',
    '::1',
    '2026-05-21 17:05:52'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    219,
    'u1',
    'Admin Utama',
    'ADD_TRANSACTION',
    'Transaction',
    'Invoice TRX-202605-5898 total 1584000',
    '::1',
    '2026-05-21 17:06:30'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    220,
    'u1',
    'Admin Utama',
    'UPDATE_SETTINGS',
    'System',
    'Update 49 pengaturan sistem',
    '::1',
    '2026-05-21 17:07:25'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    221,
    'u1',
    'Admin Utama',
    'ADD_TRANSACTION',
    'Transaction',
    'Invoice TRX-202605-3936 total 21250',
    '::1',
    '2026-05-21 17:09:13'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    222,
    'u1',
    'Admin Utama',
    'payment',
    'Transaction',
    'Pelunasan TRX-202604-8791: 0 via tunai',
    '::1',
    '2026-05-21 17:24:36'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    223,
    'u1',
    'Admin Utama',
    'payment',
    'Transaction',
    'Pelunasan TRX-202604-4887: 0 via tunai',
    '::1',
    '2026-05-21 17:24:39'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    224,
    'u1',
    'Admin Utama',
    'payment',
    'Transaction',
    'Pelunasan TRX-202604-3417: 0 via tunai',
    '::1',
    '2026-05-21 17:24:42'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    225,
    'u1',
    'Admin Utama',
    'payment',
    'Transaction',
    'Pelunasan TRX-202604-1522: 0 via tunai',
    '::1',
    '2026-05-21 17:24:44'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    226,
    'u1',
    'Admin Utama',
    'payment',
    'Transaction',
    'Pelunasan TRX-202603-8009: 0 via tunai',
    '::1',
    '2026-05-21 17:24:46'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    227,
    'u1',
    'Admin Utama',
    'payment',
    'Transaction',
    'Pelunasan TRX-202603-1505: -500 via tunai',
    '::1',
    '2026-05-21 17:24:48'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    228,
    'u1',
    'Admin Utama',
    'payment',
    'Transaction',
    'Pelunasan TRX-202603-9989: 0 via tunai',
    '::1',
    '2026-05-21 17:24:49'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    229,
    'u1',
    'Admin Utama',
    'payment',
    'Transaction',
    'Pelunasan TRX-202603-6443: 0 via tunai',
    '::1',
    '2026-05-21 17:24:51'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    230,
    'u1',
    'Admin Utama',
    'payment',
    'Transaction',
    'Pelunasan TRX-202603-2545: -500 via tunai',
    '::1',
    '2026-05-21 17:24:54'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    231,
    'u1',
    'Admin Utama',
    'payment',
    'Transaction',
    'Pelunasan TRX-202603-2987: -500 via tunai',
    '::1',
    '2026-05-21 17:24:55'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    232,
    'u1',
    'Admin Utama',
    'payment',
    'Transaction',
    'Pelunasan TRX-202603-7418: 0 via tunai',
    '::1',
    '2026-05-21 17:24:56'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    233,
    'u1',
    'Admin Utama',
    'payment',
    'Transaction',
    'Pelunasan TRX-202603-2152: 0 via tunai',
    '::1',
    '2026-05-21 17:24:58'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    234,
    'u1',
    'Admin Utama',
    'payment',
    'Transaction',
    'Pelunasan TRX-202603-2662: 0 via tunai',
    '::1',
    '2026-05-21 17:25:01'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    235,
    'u1',
    'Admin Utama',
    'payment',
    'Transaction',
    'Pelunasan TRX-202603-9586: 0 via tunai',
    '::1',
    '2026-05-21 17:25:03'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    236,
    'u1',
    'Admin Utama',
    'UPDATE_SETTINGS',
    'System',
    'Update 49 pengaturan sistem',
    '::1',
    '2026-05-22 19:15:21'
  );
INSERT INTO
  `activity_log` (
    `id`,
    `user_id`,
    `user_name`,
    `action`,
    `target`,
    `detail`,
    `ip_address`,
    `timestamp`
  )
VALUES
  (
    237,
    'u1',
    'Admin Utama',
    'UPDATE_SETTINGS',
    'System',
    'Update 49 pengaturan sistem',
    '::1',
    '2026-05-22 19:15:52'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: attendance
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: cash_flow
# ------------------------------------------------------------

INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1774416180886',
    '2026-03-24',
    'in',
    'Penjualan',
    1000,
    'Penjualan service - TRX-202603-6443',
    't1774416180876',
    '2026-03-25 05:23:00'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1774432502923',
    '2026-03-24',
    'in',
    'Penjualan',
    6250,
    'Penjualan service - TRX-202603-9989',
    't1774432502919',
    '2026-03-25 09:55:02'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1774438411962',
    '2026-03-24',
    'in',
    'Penjualan',
    7500,
    'Penjualan service - TRX-202603-1505',
    't1774438411959',
    '2026-03-25 11:33:31'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1774971468700',
    '2026-03-30',
    'in',
    'Penjualan',
    750,
    'Penjualan service - TRX-202603-8009',
    't1774971468692',
    '2026-03-31 15:37:48'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1775058089943',
    '2026-03-31',
    'in',
    'Penjualan',
    750,
    'Penjualan service - TRX-202604-1522',
    't1775058089937',
    '2026-04-01 15:41:29'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1775058124148',
    '2026-03-31',
    'in',
    'Penjualan',
    1000,
    'Penjualan service - TRX-202604-3417',
    't1775058124133',
    '2026-04-01 15:42:04'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1775124143838',
    '2026-04-01',
    'in',
    'Penjualan',
    5500,
    'Penjualan service - TRX-202604-4887',
    't1775124143835',
    '2026-04-02 10:02:23'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1775124939086',
    '2026-04-01',
    'in',
    'Penjualan',
    15000,
    'Penjualan service - TRX-202604-8791',
    't1775124939081',
    '2026-04-02 10:15:39'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1779358153483',
    '2026-05-21',
    'in',
    'Penjualan',
    21250,
    'Penjualan Cetak - TRX-202605-3936',
    't1779358153481',
    '2026-05-21 17:09:13'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1779359076473',
    '2026-05-21',
    'in',
    'Penjualan',
    0,
    'Pelunasan TRX-202604-8791',
    't1775124939081',
    '2026-05-21 17:24:36'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1779359079410',
    '2026-05-21',
    'in',
    'Penjualan',
    0,
    'Pelunasan TRX-202604-4887',
    't1775124143835',
    '2026-05-21 17:24:39'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1779359082848',
    '2026-05-21',
    'in',
    'Penjualan',
    0,
    'Pelunasan TRX-202604-3417',
    't1775058124133',
    '2026-05-21 17:24:42'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1779359084468',
    '2026-05-21',
    'in',
    'Penjualan',
    0,
    'Pelunasan TRX-202604-1522',
    't1775058089937',
    '2026-05-21 17:24:44'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1779359086796',
    '2026-05-21',
    'in',
    'Penjualan',
    0,
    'Pelunasan TRX-202603-8009',
    't1774971468692',
    '2026-05-21 17:24:46'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1779359088097',
    '2026-05-21',
    'in',
    'Penjualan',
    -500,
    'Pelunasan TRX-202603-1505',
    't1774438411959',
    '2026-05-21 17:24:48'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1779359089812',
    '2026-05-21',
    'in',
    'Penjualan',
    0,
    'Pelunasan TRX-202603-9989',
    't1774432502919',
    '2026-05-21 17:24:49'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1779359091710',
    '2026-05-21',
    'in',
    'Penjualan',
    0,
    'Pelunasan TRX-202603-6443',
    't1774416180876',
    '2026-05-21 17:24:51'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1779359094074',
    '2026-05-21',
    'in',
    'Penjualan',
    -500,
    'Pelunasan TRX-202603-2545',
    't1774173465448',
    '2026-05-21 17:24:54'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1779359095460',
    '2026-05-21',
    'in',
    'Penjualan',
    -500,
    'Pelunasan TRX-202603-2987',
    't1774173510749',
    '2026-05-21 17:24:55'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1779359096974',
    '2026-05-21',
    'in',
    'Penjualan',
    0,
    'Pelunasan TRX-202603-7418',
    't1774183855102',
    '2026-05-21 17:24:56'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1779359098609',
    '2026-05-21',
    'in',
    'Penjualan',
    0,
    'Pelunasan TRX-202603-2152',
    't1774183908254',
    '2026-05-21 17:24:58'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1779359101652',
    '2026-05-21',
    'in',
    'Penjualan',
    0,
    'Pelunasan TRX-202603-2662',
    't1774374277322',
    '2026-05-21 17:25:01'
  );
INSERT INTO
  `cash_flow` (
    `id`,
    `date`,
    `type`,
    `category`,
    `amount`,
    `description`,
    `reference_id`,
    `created_at`
  )
VALUES
  (
    'cf1779359103619',
    '2026-05-21',
    'in',
    'Penjualan',
    0,
    'Pelunasan TRX-202603-9586',
    't1774374922291',
    '2026-05-21 17:25:03'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: categories
# ------------------------------------------------------------

INSERT INTO
  `categories` (`id`, `name`, `type`, `emoji`)
VALUES
  ('buku-4277', 'Buku', 'atk', '?');
INSERT INTO
  `categories` (`id`, `name`, `type`, `emoji`)
VALUES
  (
    'cat-dummy-1',
    'Percetakan Offset',
    'percetakan_supply',
    NULL
  );
INSERT INTO
  `categories` (`id`, `name`, `type`, `emoji`)
VALUES
  ('idcard-1857', 'IDCARD', 'atk', '?');
INSERT INTO
  `categories` (`id`, `name`, `type`, `emoji`)
VALUES
  ('kertas-2867', 'KERTAS', 'atk', '?');
INSERT INTO
  `categories` (`id`, `name`, `type`, `emoji`)
VALUES
  ('polpen-4484', 'POLPEN', 'atk', '?');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: customers
# ------------------------------------------------------------

INSERT INTO
  `customers` (
    `id`,
    `name`,
    `phone`,
    `address`,
    `type`,
    `company`,
    `total_trx`,
    `total_spend`,
    `created_at`
  )
VALUES
  (
    'c1775132386225',
    'BALAI DESA KEDIREN',
    '085655620979',
    'KEDIREN',
    'walkin',
    'Instansi Desa',
    0,
    0,
    '2026-04-02 12:19:46'
  );
INSERT INTO
  `customers` (
    `id`,
    `name`,
    `phone`,
    `address`,
    `type`,
    `company`,
    `total_trx`,
    `total_spend`,
    `created_at`
  )
VALUES
  (
    'c1779357723907',
    'KPRI  LEMBEYAN',
    '08133134322',
    'LEMBEYAN',
    'walkin',
    'KOP MART',
    1,
    0,
    '2026-05-21 17:02:03'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: design_assignments
# ------------------------------------------------------------

INSERT INTO
  `design_assignments` (
    `id`,
    `task_id`,
    `designer_id`,
    `status`,
    `assigned_at`,
    `started_at`,
    `finished_at`,
    `catatan`,
    `file_hasil_desain`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    1,
    'ORD-9177',
    'des001',
    'selesai',
    '2026-03-10 12:40:10',
    '2026-03-10 12:47:46',
    '2026-03-10 13:58:14',
    NULL,
    NULL,
    '2026-03-10 12:40:10',
    '2026-03-10 13:58:14'
  );
INSERT INTO
  `design_assignments` (
    `id`,
    `task_id`,
    `designer_id`,
    `status`,
    `assigned_at`,
    `started_at`,
    `finished_at`,
    `catatan`,
    `file_hasil_desain`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    2,
    'ORD-8330',
    'des002',
    'ditugaskan',
    '2026-03-10 13:40:09',
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-03-10 13:40:09',
    '2026-03-10 13:40:09'
  );
INSERT INTO
  `design_assignments` (
    `id`,
    `task_id`,
    `designer_id`,
    `status`,
    `assigned_at`,
    `started_at`,
    `finished_at`,
    `catatan`,
    `file_hasil_desain`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    3,
    'ORD-6334',
    'des001',
    'selesai',
    '2026-03-10 13:59:03',
    '2026-03-10 14:27:31',
    '2026-03-10 14:27:55',
    'siap cetak',
    NULL,
    '2026-03-10 13:59:03',
    '2026-03-10 14:27:55'
  );
INSERT INTO
  `design_assignments` (
    `id`,
    `task_id`,
    `designer_id`,
    `status`,
    `assigned_at`,
    `started_at`,
    `finished_at`,
    `catatan`,
    `file_hasil_desain`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    4,
    'ORD-2966',
    'des001',
    'selesai',
    '2026-03-10 14:43:45',
    '2026-03-10 14:45:01',
    '2026-03-10 14:45:57',
    'Siap cetak mata ayam 5',
    NULL,
    '2026-03-10 14:43:45',
    '2026-03-10 14:45:57'
  );
INSERT INTO
  `design_assignments` (
    `id`,
    `task_id`,
    `designer_id`,
    `status`,
    `assigned_at`,
    `started_at`,
    `finished_at`,
    `catatan`,
    `file_hasil_desain`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    5,
    'ORD-8287',
    'des001',
    'selesai',
    '2026-03-11 11:23:48',
    '2026-03-11 11:24:03',
    '2026-03-11 11:24:08',
    NULL,
    NULL,
    '2026-03-11 11:23:48',
    '2026-03-11 11:24:08'
  );
INSERT INTO
  `design_assignments` (
    `id`,
    `task_id`,
    `designer_id`,
    `status`,
    `assigned_at`,
    `started_at`,
    `finished_at`,
    `catatan`,
    `file_hasil_desain`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    6,
    'ORD-3511',
    'des1773155248207',
    'selesai',
    '2026-03-11 11:41:24',
    '2026-03-11 11:53:06',
    '2026-03-11 11:53:23',
    NULL,
    NULL,
    '2026-03-11 11:41:24',
    '2026-03-11 11:53:23'
  );
INSERT INTO
  `design_assignments` (
    `id`,
    `task_id`,
    `designer_id`,
    `status`,
    `assigned_at`,
    `started_at`,
    `finished_at`,
    `catatan`,
    `file_hasil_desain`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    7,
    'ORD-6955',
    'des001',
    'selesai',
    '2026-03-11 12:09:30',
    '2026-03-11 12:11:51',
    '2026-03-11 12:11:54',
    NULL,
    NULL,
    '2026-03-11 12:09:30',
    '2026-03-11 12:11:54'
  );
INSERT INTO
  `design_assignments` (
    `id`,
    `task_id`,
    `designer_id`,
    `status`,
    `assigned_at`,
    `started_at`,
    `finished_at`,
    `catatan`,
    `file_hasil_desain`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    8,
    'ORD-2768',
    'des001',
    'selesai',
    '2026-03-14 01:48:47',
    '2026-04-02 10:44:57',
    '2026-04-02 10:45:11',
    NULL,
    NULL,
    '2026-03-14 01:48:47',
    '2026-04-02 10:45:11'
  );
INSERT INTO
  `design_assignments` (
    `id`,
    `task_id`,
    `designer_id`,
    `status`,
    `assigned_at`,
    `started_at`,
    `finished_at`,
    `catatan`,
    `file_hasil_desain`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    9,
    'ORD-4309',
    'des1773155248207',
    'selesai',
    '2026-03-15 21:46:50',
    '2026-03-16 11:26:27',
    '2026-03-16 11:26:53',
    NULL,
    NULL,
    '2026-03-15 21:46:50',
    '2026-03-16 11:26:53'
  );
INSERT INTO
  `design_assignments` (
    `id`,
    `task_id`,
    `designer_id`,
    `status`,
    `assigned_at`,
    `started_at`,
    `finished_at`,
    `catatan`,
    `file_hasil_desain`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    10,
    'ORD-1202',
    'des1773155248207',
    'ditugaskan',
    '2026-03-21 05:02:00',
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-03-21 05:02:00',
    '2026-03-21 05:02:00'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: design_logs
# ------------------------------------------------------------

INSERT INTO
  `design_logs` (
    `id`,
    `order_item_id`,
    `technician_id`,
    `start_time`,
    `end_time`,
    `total_durasi_menit`,
    `tarif_per_jam`,
    `total_biaya_desain`,
    `catatan`,
    `created_at`
  )
VALUES
  (
    1,
    'oi17730411013352rd6',
    'u1',
    '2026-03-09 07:25:15',
    '2026-03-09 07:25:27',
    NULL,
    50000,
    NULL,
    NULL,
    '2026-03-09 07:25:15'
  );
INSERT INTO
  `design_logs` (
    `id`,
    `order_item_id`,
    `technician_id`,
    `start_time`,
    `end_time`,
    `total_durasi_menit`,
    `tarif_per_jam`,
    `total_biaya_desain`,
    `catatan`,
    `created_at`
  )
VALUES
  (
    2,
    'oi17730411013352rd6',
    'u1',
    '2026-03-09 07:28:10',
    '2026-03-09 07:28:20',
    NULL,
    50000,
    NULL,
    NULL,
    '2026-03-09 07:28:10'
  );
INSERT INTO
  `design_logs` (
    `id`,
    `order_item_id`,
    `technician_id`,
    `start_time`,
    `end_time`,
    `total_durasi_menit`,
    `tarif_per_jam`,
    `total_biaya_desain`,
    `catatan`,
    `created_at`
  )
VALUES
  (
    3,
    'oi1773041922898ldnh',
    'u1',
    '2026-03-09 07:39:10',
    '2026-03-09 07:39:45',
    NULL,
    50000,
    NULL,
    NULL,
    '2026-03-09 07:39:10'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: design_sessions
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: digital_printing
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: dp_tasks
# ------------------------------------------------------------

INSERT INTO
  `dp_tasks` (
    `id`,
    `status`,
    `customerName`,
    `customerId`,
    `title`,
    `material_id`,
    `material_name`,
    `dimensions_w`,
    `dimensions_h`,
    `material_price`,
    `design_price`,
    `priority`,
    `pesan_desainer`,
    `type`,
    `file_url`,
    `qty`,
    `designer_id`,
    `designer_name`,
    `operator_id`,
    `operator_name`,
    `started_at`,
    `finished_at`,
    `dp_amount`,
    `is_paid`,
    `created_at`,
    `updated_at`,
    `denda_batal`
  )
VALUES
  (
    'ORD-2088',
    'batal',
    'Pelanggan Umum',
    'c1774175866060',
    'Laminasi Glossy (4x3m)',
    'mat010',
    'Laminasi Glossy',
    4.00,
    3.00,
    420000.00,
    0.00,
    'normal',
    'Jdjdkkaka',
    'digital',
    NULL,
    1,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0.00,
    0,
    '2026-03-23 17:02:36',
    '2026-03-24 00:51:19',
    0.00
  );
INSERT INTO
  `dp_tasks` (
    `id`,
    `status`,
    `customerName`,
    `customerId`,
    `title`,
    `material_id`,
    `material_name`,
    `dimensions_w`,
    `dimensions_h`,
    `material_price`,
    `design_price`,
    `priority`,
    `pesan_desainer`,
    `type`,
    `file_url`,
    `qty`,
    `designer_id`,
    `designer_name`,
    `operator_id`,
    `operator_name`,
    `started_at`,
    `finished_at`,
    `dp_amount`,
    `is_paid`,
    `created_at`,
    `updated_at`,
    `denda_batal`
  )
VALUES
  (
    'ORD-6920',
    'batal',
    'Pelanggan Umum',
    'c1774175866060',
    'Frontlite Standard 280gr (2x1m)',
    'mat001',
    'Frontlite Standard 280gr',
    2.00,
    1.00,
    50000.00,
    0.00,
    'normal',
    NULL,
    'digital',
    NULL,
    1,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0.00,
    0,
    '2026-03-24 00:56:31',
    '2026-03-24 00:56:38',
    0.00
  );
INSERT INTO
  `dp_tasks` (
    `id`,
    `status`,
    `customerName`,
    `customerId`,
    `title`,
    `material_id`,
    `material_name`,
    `dimensions_w`,
    `dimensions_h`,
    `material_price`,
    `design_price`,
    `priority`,
    `pesan_desainer`,
    `type`,
    `file_url`,
    `qty`,
    `designer_id`,
    `designer_name`,
    `operator_id`,
    `operator_name`,
    `started_at`,
    `finished_at`,
    `dp_amount`,
    `is_paid`,
    `created_at`,
    `updated_at`,
    `denda_batal`
  )
VALUES
  (
    'ORD-8740',
    'batal',
    'CLARA PRINTING',
    'c1774175866060',
    'Laminasi Glossy (3x1m)',
    'mat010',
    'Laminasi Glossy',
    3.00,
    1.00,
    105000.00,
    0.00,
    'normal',
    NULL,
    'digital',
    NULL,
    1,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0.00,
    0,
    '2026-03-24 00:53:44',
    '2026-03-24 00:54:12',
    0.00
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: employee_loans
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: employees
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: expenses
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: fotocopy_prices
# ------------------------------------------------------------

INSERT INTO
  `fotocopy_prices` (`id`, `paper`, `color`, `side`, `price`, `label`)
VALUES
  (
    'fc1',
    'HVS A4',
    'bw',
    '1',
    250,
    'HVS A4 - B/W - 1 Sisi'
  );
INSERT INTO
  `fotocopy_prices` (`id`, `paper`, `color`, `side`, `price`, `label`)
VALUES
  (
    'fc2',
    'HVS A4',
    'bw',
    '2',
    400,
    'HVS A4 - B/W - Bolak-balik'
  );
INSERT INTO
  `fotocopy_prices` (`id`, `paper`, `color`, `side`, `price`, `label`)
VALUES
  (
    'fc3',
    'HVS F4',
    'bw',
    '1',
    250,
    'HVS F4 - B/W - 1 Sisi'
  );
INSERT INTO
  `fotocopy_prices` (`id`, `paper`, `color`, `side`, `price`, `label`)
VALUES
  (
    'fc4',
    'HVS F4',
    'bw',
    '2',
    400,
    'HVS F4 - B/W - Bolak-balik'
  );
INSERT INTO
  `fotocopy_prices` (`id`, `paper`, `color`, `side`, `price`, `label`)
VALUES
  (
    'fc5',
    'HVS A3',
    'bw',
    '1',
    1000,
    'HVS A3 - B/W - 1 Sisi'
  );
INSERT INTO
  `fotocopy_prices` (`id`, `paper`, `color`, `side`, `price`, `label`)
VALUES
  (
    'fc6',
    'HVS A4',
    'color',
    '1',
    1000,
    'HVS A4 - Warna - 1 Sisi'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: handovers
# ------------------------------------------------------------

INSERT INTO
  `handovers` (
    `id`,
    `transaction_id`,
    `invoice_no`,
    `customer_name`,
    `receiver_name`,
    `receiver_phone`,
    `notes`,
    `handover_date`,
    `handover_by`
  )
VALUES
  (
    1,
    't1774173510749',
    'TRX-202603-2987',
    'Umum',
    'Umum',
    '',
    '',
    '2026-04-01 15:37:31',
    'Admin'
  );
INSERT INTO
  `handovers` (
    `id`,
    `transaction_id`,
    `invoice_no`,
    `customer_name`,
    `receiver_name`,
    `receiver_phone`,
    `notes`,
    `handover_date`,
    `handover_by`
  )
VALUES
  (
    2,
    't1774183855102',
    'TRX-202603-7418',
    'Umum',
    'Umum',
    '',
    '',
    '2026-04-01 15:37:35',
    'Admin'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: material_movements
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: materials
# ------------------------------------------------------------

INSERT INTO
  `materials` (
    `id`,
    `barcode`,
    `nama_bahan`,
    `kategori`,
    `satuan`,
    `harga_modal`,
    `harga_jual`,
    `stok_saat_ini`,
    `stok_minimum`,
    `lokasi_rak`,
    `supplier_id`,
    `is_active`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'mat001',
    NULL,
    'Frontlite Standard 280gr',
    'digital',
    'm2',
    15000,
    25000,
    50.00,
    5.00,
    NULL,
    NULL,
    1,
    '2026-03-04 15:57:40',
    '2026-03-04 15:57:40'
  );
INSERT INTO
  `materials` (
    `id`,
    `barcode`,
    `nama_bahan`,
    `kategori`,
    `satuan`,
    `harga_modal`,
    `harga_jual`,
    `stok_saat_ini`,
    `stok_minimum`,
    `lokasi_rak`,
    `supplier_id`,
    `is_active`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'mat002',
    NULL,
    'Frontlite High-Res 340gr',
    'digital',
    'm2',
    22000,
    35000,
    30.00,
    5.00,
    NULL,
    NULL,
    1,
    '2026-03-04 15:57:40',
    '2026-03-04 15:57:40'
  );
INSERT INTO
  `materials` (
    `id`,
    `barcode`,
    `nama_bahan`,
    `kategori`,
    `satuan`,
    `harga_modal`,
    `harga_jual`,
    `stok_saat_ini`,
    `stok_minimum`,
    `lokasi_rak`,
    `supplier_id`,
    `is_active`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'mat003',
    NULL,
    'Albatros',
    'digital',
    'm2',
    45000,
    65000,
    20.00,
    3.00,
    NULL,
    NULL,
    1,
    '2026-03-04 15:57:40',
    '2026-03-04 15:57:40'
  );
INSERT INTO
  `materials` (
    `id`,
    `barcode`,
    `nama_bahan`,
    `kategori`,
    `satuan`,
    `harga_modal`,
    `harga_jual`,
    `stok_saat_ini`,
    `stok_minimum`,
    `lokasi_rak`,
    `supplier_id`,
    `is_active`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'mat004',
    NULL,
    'Bannertrans / Backlite',
    'digital',
    'm2',
    50000,
    75000,
    15.00,
    3.00,
    NULL,
    NULL,
    1,
    '2026-03-04 15:57:40',
    '2026-03-04 15:57:40'
  );
INSERT INTO
  `materials` (
    `id`,
    `barcode`,
    `nama_bahan`,
    `kategori`,
    `satuan`,
    `harga_modal`,
    `harga_jual`,
    `stok_saat_ini`,
    `stok_minimum`,
    `lokasi_rak`,
    `supplier_id`,
    `is_active`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'mat005',
    NULL,
    'Vinyl Stiker Glossy',
    'digital',
    'm2',
    30000,
    50000,
    25.00,
    5.00,
    NULL,
    NULL,
    1,
    '2026-03-04 15:57:40',
    '2026-03-04 15:57:40'
  );
INSERT INTO
  `materials` (
    `id`,
    `barcode`,
    `nama_bahan`,
    `kategori`,
    `satuan`,
    `harga_modal`,
    `harga_jual`,
    `stok_saat_ini`,
    `stok_minimum`,
    `lokasi_rak`,
    `supplier_id`,
    `is_active`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'mat006',
    NULL,
    'Vinyl Stiker Matte',
    'digital',
    'm2',
    32000,
    55000,
    20.00,
    5.00,
    NULL,
    NULL,
    1,
    '2026-03-04 15:57:40',
    '2026-03-04 15:57:40'
  );
INSERT INTO
  `materials` (
    `id`,
    `barcode`,
    `nama_bahan`,
    `kategori`,
    `satuan`,
    `harga_modal`,
    `harga_jual`,
    `stok_saat_ini`,
    `stok_minimum`,
    `lokasi_rak`,
    `supplier_id`,
    `is_active`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'mat007',
    NULL,
    'HVS A4 70gr',
    'offset',
    'rim',
    30000,
    45000,
    10.00,
    2.00,
    NULL,
    NULL,
    1,
    '2026-03-04 15:57:40',
    '2026-03-04 15:57:40'
  );
INSERT INTO
  `materials` (
    `id`,
    `barcode`,
    `nama_bahan`,
    `kategori`,
    `satuan`,
    `harga_modal`,
    `harga_jual`,
    `stok_saat_ini`,
    `stok_minimum`,
    `lokasi_rak`,
    `supplier_id`,
    `is_active`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'mat008',
    NULL,
    'HVS F4 70gr',
    'offset',
    'rim',
    33000,
    50000,
    10.00,
    2.00,
    NULL,
    NULL,
    1,
    '2026-03-04 15:57:40',
    '2026-03-04 15:57:40'
  );
INSERT INTO
  `materials` (
    `id`,
    `barcode`,
    `nama_bahan`,
    `kategori`,
    `satuan`,
    `harga_modal`,
    `harga_jual`,
    `stok_saat_ini`,
    `stok_minimum`,
    `lokasi_rak`,
    `supplier_id`,
    `is_active`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'mat009',
    NULL,
    'Art Paper 120gr',
    'offset',
    'lembar',
    500,
    900,
    500.00,
    50.00,
    NULL,
    NULL,
    1,
    '2026-03-04 15:57:40',
    '2026-03-04 15:57:40'
  );
INSERT INTO
  `materials` (
    `id`,
    `barcode`,
    `nama_bahan`,
    `kategori`,
    `satuan`,
    `harga_modal`,
    `harga_jual`,
    `stok_saat_ini`,
    `stok_minimum`,
    `lokasi_rak`,
    `supplier_id`,
    `is_active`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'mat010',
    NULL,
    'Laminasi Glossy',
    'digital',
    'm2',
    20000,
    35000,
    30.00,
    5.00,
    NULL,
    NULL,
    1,
    '2026-03-04 15:57:40',
    '2026-03-04 15:57:40'
  );
INSERT INTO
  `materials` (
    `id`,
    `barcode`,
    `nama_bahan`,
    `kategori`,
    `satuan`,
    `harga_modal`,
    `harga_jual`,
    `stok_saat_ini`,
    `stok_minimum`,
    `lokasi_rak`,
    `supplier_id`,
    `is_active`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'mat1773453500949',
    'SKU-308399',
    'Material Test 2',
    'Digital',
    'pcs',
    10000,
    15000,
    50.00,
    10.00,
    NULL,
    NULL,
    1,
    '2026-03-14 01:58:20',
    '2026-03-14 01:58:20'
  );
INSERT INTO
  `materials` (
    `id`,
    `barcode`,
    `nama_bahan`,
    `kategori`,
    `satuan`,
    `harga_modal`,
    `harga_jual`,
    `stok_saat_ini`,
    `stok_minimum`,
    `lokasi_rak`,
    `supplier_id`,
    `is_active`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'mat1773577514880',
    'SKU-447201',
    'Art Paper 260',
    'offset',
    'lembar',
    250000,
    425000,
    100.00,
    10.00,
    NULL,
    '1',
    1,
    '2026-03-15 12:25:14',
    '2026-03-15 12:25:14'
  );
INSERT INTO
  `materials` (
    `id`,
    `barcode`,
    `nama_bahan`,
    `kategori`,
    `satuan`,
    `harga_modal`,
    `harga_jual`,
    `stok_saat_ini`,
    `stok_minimum`,
    `lokasi_rak`,
    `supplier_id`,
    `is_active`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'mat1779357661900',
    'SKU-589555',
    'ID CARD',
    'digital',
    'pcs',
    4500,
    8000,
    500.00,
    0.00,
    NULL,
    '5b0aed99-f413-423d-bdb0-b67670636438',
    0,
    '2026-05-21 17:01:01',
    '2026-05-21 17:03:31'
  );
INSERT INTO
  `materials` (
    `id`,
    `barcode`,
    `nama_bahan`,
    `kategori`,
    `satuan`,
    `harga_modal`,
    `harga_jual`,
    `stok_saat_ini`,
    `stok_minimum`,
    `lokasi_rak`,
    `supplier_id`,
    `is_active`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'mat1779357849021',
    'SKU-817888',
    'ID CARD',
    'offset',
    'pcs',
    4500,
    8000,
    500.00,
    5.00,
    NULL,
    '5b0aed99-f413-423d-bdb0-b67670636438',
    1,
    '2026-05-21 17:04:09',
    '2026-05-21 17:04:09'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: offset_orders
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: offset_printing
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: offset_products
# ------------------------------------------------------------

INSERT INTO
  `offset_products` (
    `id`,
    `nama_produk`,
    `deskripsi_singkat`,
    `harga_base`,
    `satuan`,
    `is_best_seller`,
    `image_url`
  )
VALUES
  (
    'op1',
    'Cetak Nota',
    'Rangkap/NCR (2-4 Ply) - Ukuran Custom (A4, A5, 1/3 A4)',
    25000.00,
    'buku',
    1,
    NULL
  );
INSERT INTO
  `offset_products` (
    `id`,
    `nama_produk`,
    `deskripsi_singkat`,
    `harga_base`,
    `satuan`,
    `is_best_seller`,
    `image_url`
  )
VALUES
  (
    'op2',
    'Cetak Buku',
    'Hard/Soft Cover Laminating - Jumlah Buku Min. 50 Eks',
    50000.00,
    'eks',
    0,
    NULL
  );
INSERT INTO
  `offset_products` (
    `id`,
    `nama_produk`,
    `deskripsi_singkat`,
    `harga_base`,
    `satuan`,
    `is_best_seller`,
    `image_url`
  )
VALUES
  (
    'op3',
    'Cetak Kalender',
    'Kalender Dinding & Meja - Kertas Art Paper / Ivory',
    15000.00,
    'pcs',
    0,
    NULL
  );
INSERT INTO
  `offset_products` (
    `id`,
    `nama_produk`,
    `deskripsi_singkat`,
    `harga_base`,
    `satuan`,
    `is_best_seller`,
    `image_url`
  )
VALUES
  (
    'op4',
    'Kartu Nama',
    'Standar & Premium (Spot UV) - Min. Order 1 Box (100 lbr)',
    35000.00,
    'box',
    0,
    NULL
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: order_items
# ------------------------------------------------------------

INSERT INTO
  `order_items` (
    `id`,
    `order_id`,
    `layanan`,
    `nama_item`,
    `material_id`,
    `ukuran_p`,
    `ukuran_l`,
    `luas_total`,
    `quantity`,
    `harga_satuan`,
    `subtotal`,
    `file_desain`,
    `catatan`
  )
VALUES
  (
    'oi17730411013352rd6',
    'ord1773041101325',
    'digital_printing',
    'Banner',
    'mat001',
    3.00,
    0.80,
    2.4000,
    1,
    25000,
    60000,
    NULL,
    NULL
  );
INSERT INTO
  `order_items` (
    `id`,
    `order_id`,
    `layanan`,
    `nama_item`,
    `material_id`,
    `ukuran_p`,
    `ukuran_l`,
    `luas_total`,
    `quantity`,
    `harga_satuan`,
    `subtotal`,
    `file_desain`,
    `catatan`
  )
VALUES
  (
    'oi1773041922898ldnh',
    'ord1773041922897',
    'digital_printing',
    'Banner Wrung',
    'mat004',
    2.00,
    1.00,
    2.0000,
    1,
    75000,
    150000,
    NULL,
    NULL
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: orders
# ------------------------------------------------------------

INSERT INTO
  `orders` (
    `id`,
    `order_number`,
    `customer_id`,
    `customer_name`,
    `user_id`,
    `total_harga`,
    `status_pembayaran`,
    `dp_amount`,
    `remaining`,
    `metode_pembayaran`,
    `deadline`,
    `catatan`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'ord1773041101325',
    'ORD-260001',
    NULL,
    'umum',
    'u1',
    60000,
    'belum_bayar',
    0,
    60000,
    'tunai',
    '2026-03-08',
    NULL,
    '2026-03-09 07:25:01',
    '2026-03-09 07:25:01'
  );
INSERT INTO
  `orders` (
    `id`,
    `order_number`,
    `customer_id`,
    `customer_name`,
    `user_id`,
    `total_harga`,
    `status_pembayaran`,
    `dp_amount`,
    `remaining`,
    `metode_pembayaran`,
    `deadline`,
    `catatan`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'ord1773041922897',
    'ORD-260002',
    NULL,
    'Alamsyah',
    'u1',
    150000,
    'belum_bayar',
    0,
    150000,
    'tunai',
    '2026-03-18',
    NULL,
    '2026-03-09 07:38:42',
    '2026-03-09 07:38:42'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: pricing_logs
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: pricing_rules
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: print_orders
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: product_options
# ------------------------------------------------------------

INSERT INTO
  `product_options` (
    `id`,
    `product_id`,
    `kategori_opsi`,
    `label_opsi`,
    `tambahan_biaya`
  )
VALUES
  ('po1', 'op1', 'Rangkap', '2 Ply', 0.00);
INSERT INTO
  `product_options` (
    `id`,
    `product_id`,
    `kategori_opsi`,
    `label_opsi`,
    `tambahan_biaya`
  )
VALUES
  ('po2', 'op1', 'Rangkap', '3 Ply', 5000.00);
INSERT INTO
  `product_options` (
    `id`,
    `product_id`,
    `kategori_opsi`,
    `label_opsi`,
    `tambahan_biaya`
  )
VALUES
  ('po3', 'op1', 'Rangkap', '4 Ply', 10000.00);
INSERT INTO
  `product_options` (
    `id`,
    `product_id`,
    `kategori_opsi`,
    `label_opsi`,
    `tambahan_biaya`
  )
VALUES
  (
    'po4',
    'op1',
    'Ukuran',
    'A4 (21 x 29.7 cm)',
    15000.00
  );
INSERT INTO
  `product_options` (
    `id`,
    `product_id`,
    `kategori_opsi`,
    `label_opsi`,
    `tambahan_biaya`
  )
VALUES
  ('po5', 'op1', 'Ukuran', 'A5 (14.8 x 21 cm)', 0.00);
INSERT INTO
  `product_options` (
    `id`,
    `product_id`,
    `kategori_opsi`,
    `label_opsi`,
    `tambahan_biaya`
  )
VALUES
  (
    'po6',
    'op1',
    'Ukuran',
    '1/3 A4 (10 x 21 cm)',
    -5000.00
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: production_status
# ------------------------------------------------------------

INSERT INTO
  `production_status` (
    `id`,
    `order_item_id`,
    `status`,
    `catatan_teknis`,
    `link_file_desain`,
    `foto_sebelum`,
    `foto_sesudah`,
    `operator_id`,
    `updated_at`
  )
VALUES
  (
    1,
    'oi17730411013352rd6',
    'selesai',
    NULL,
    NULL,
    NULL,
    NULL,
    'u1',
    '2026-03-09 07:31:57'
  );
INSERT INTO
  `production_status` (
    `id`,
    `order_item_id`,
    `status`,
    `catatan_teknis`,
    `link_file_desain`,
    `foto_sebelum`,
    `foto_sesudah`,
    `operator_id`,
    `updated_at`
  )
VALUES
  (
    2,
    'oi1773041922898ldnh',
    'selesai',
    NULL,
    NULL,
    NULL,
    NULL,
    'u1',
    '2026-03-09 07:40:14'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: products
# ------------------------------------------------------------

INSERT INTO
  `products` (
    `id`,
    `code`,
    `name`,
    `category_id`,
    `buy_price`,
    `sell_price`,
    `stock`,
    `min_stock`,
    `unit`,
    `emoji`,
    `updated_at`,
    `image`
  )
VALUES
  (
    'p1774274054490',
    'PRD-MN38YLWI',
    'Kertas HVS F4 75gr',
    'kertas-2867',
    45000,
    55000,
    5,
    1,
    'rim',
    '?',
    '2026-03-23 13:54:14',
    NULL
  );
INSERT INTO
  `products` (
    `id`,
    `code`,
    `name`,
    `category_id`,
    `buy_price`,
    `sell_price`,
    `stock`,
    `min_stock`,
    `unit`,
    `emoji`,
    `updated_at`,
    `image`
  )
VALUES
  (
    'p1774438374225',
    'TZ501',
    'POLPEN GEL INK PEN',
    'polpen-4484',
    2500,
    5000,
    12,
    2,
    'pcs',
    '?',
    '2026-03-25 11:32:54',
    NULL
  );
INSERT INTO
  `products` (
    `id`,
    `code`,
    `name`,
    `category_id`,
    `buy_price`,
    `sell_price`,
    `stock`,
    `min_stock`,
    `unit`,
    `emoji`,
    `updated_at`,
    `image`
  )
VALUES
  (
    'p1775132313853',
    'PRD-MNHFY3FS',
    'Kertas Cover',
    'kertas-2867',
    350,
    750,
    100,
    10,
    'lembar',
    '?',
    '2026-04-02 12:18:33',
    NULL
  );
INSERT INTO
  `products` (
    `id`,
    `code`,
    `name`,
    `category_id`,
    `buy_price`,
    `sell_price`,
    `stock`,
    `min_stock`,
    `unit`,
    `emoji`,
    `updated_at`,
    `image`
  )
VALUES
  (
    'p1779357921608',
    'PRD-MPFBRITS',
    'CETAK ID CARD',
    'idcard-1857',
    4500,
    8000,
    500,
    4,
    'pcs',
    '?',
    '2026-05-21 17:05:52',
    '/uploads/products/product-1779357921279-429680326.jpg'
  );
INSERT INTO
  `products` (
    `id`,
    `code`,
    `name`,
    `category_id`,
    `buy_price`,
    `sell_price`,
    `stock`,
    `min_stock`,
    `unit`,
    `emoji`,
    `updated_at`,
    `image`
  )
VALUES
  (
    'prod-dummy-1',
    'SIDU32',
    'Buku Tulis SIDU 32',
    'buku-4277',
    2500,
    3500,
    12,
    2,
    'Buku',
    NULL,
    '2026-03-22 14:21:14',
    NULL
  );
INSERT INTO
  `products` (
    `id`,
    `code`,
    `name`,
    `category_id`,
    `buy_price`,
    `sell_price`,
    `stock`,
    `min_stock`,
    `unit`,
    `emoji`,
    `updated_at`,
    `image`
  )
VALUES
  (
    'prod-dummy-2',
    'BPN-Tizzo',
    'Polpen Tizzo 1 mm',
    'cat-dummy-1',
    3499,
    7000,
    12,
    2,
    'Box',
    NULL,
    '2026-03-22 14:22:12',
    NULL
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: purchase_items
# ------------------------------------------------------------

INSERT INTO
  `purchase_items` (
    `id`,
    `purchase_id`,
    `item_type`,
    `item_id`,
    `item_name`,
    `qty`,
    `unit_cost`,
    `subtotal`
  )
VALUES
  (
    1,
    'PURC-1774179657396',
    'product',
    'prod-dummy-1',
    'Buku Nota A5 NCR 2 Play',
    1.00,
    15001,
    15001
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: purchases
# ------------------------------------------------------------

INSERT INTO
  `purchases` (
    `id`,
    `invoice_no`,
    `supplier_id`,
    `supplier_name`,
    `date`,
    `total_amount`,
    `payment_status`,
    `notes`,
    `user_id`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'PURC-1774179657396',
    'INV-657396',
    NULL,
    'Umum',
    '2026-03-21 17:00:00',
    15001,
    'lunas',
    'Testing',
    'u1',
    '2026-03-22 11:40:57',
    '2026-03-22 11:40:57'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: salaries
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: service_orders
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: service_spareparts
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: settings
# ------------------------------------------------------------

INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (1, 'tarif_desain_per_jam', '50000');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (2, 'ppn_persen', '0');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (3, 'nama_toko', 'Abadi Jaya Copier');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (4, 'alamat_toko', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (5, 'no_whatsapp_toko', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (6, 'store_name', 'FOTOCOPY ABADI JAYA');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (
    7,
    'store_address',
    'Dsn. Selungguh Rt 06 Desa Kediren Kec. Lembeyan, Kab. Magetan'
  );
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (8, 'store_phone', '085655620979');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (
    9,
    'store_maps_url',
    'https://maps.app.goo.gl/DD3kUGfTmqaZ9iDd7'
  );
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (
    10,
    'store_logo',
    'data:image/webp;base64,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'
  );
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (11, 'landing_logo', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (12, 'landing_favicon', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (13, 'receipt_footer', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (14, 'printer_size', 'lx310');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (15, 'printer_name', 'EPSON LX-310');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (16, 'paper_size', 'wartel');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (17, 'auto_print', 'true');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (18, 'landing_gallery', '[]');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (
    19,
    'fc_discounts',
    '[{\"id\":\"1\",\"minQty\":100,\"discountPerSheet\":50},{\"id\":\"2\",\"minQty\":500,\"discountPerSheet\":75}]'
  );
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (20, 'midtrans_key', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (21, 'midtrans_is_production', 'false');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (22, 'dana_number', '085655620979');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (23, 'dana_name', 'SUPRIYANTO');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (24, 'bank_name', 'BANK BCA');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (25, 'bank_account', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (26, 'bank_account_name', 'SUPRIYANTO');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (
    27,
    'print_prices',
    '[{\"id\":\"1774179838786\",\"paper\":\"HVS A4 EPSON\",\"color\":\"bw\",\"price\":\"500\"},{\"id\":\"1774179843217\",\"paper\":\"HVS A4 EPSON\",\"color\":\"color\",\"price\":\"1000\"},{\"id\":\"1774179893993\",\"paper\":\"PRIN KERTAS COVER EPSON\",\"color\":\"bw\",\"price\":\"1500\"},{\"id\":\"1774179915393\",\"paper\":\"PRINT COPY A4 F4 CANON\",\"color\":\"bw\",\"price\":\"250\"},{\"id\":\"1774328770287\",\"paper\":\"CETAK FOTO 3R\",\"color\":\"color\",\"price\":\"3000\"}]'
  );
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (
    28,
    'binding_prices',
    '[{\"id\":\"1774179864153\",\"name\":\"JILID BIASA PLASTIK\",\"price\":\"3500\"},{\"id\":\"1774179879153\",\"name\":\"JILID BIASA COVER\",\"price\":\"3500\"},{\"id\":\"1775124089100\",\"name\":\"Laminating A4 & F4\",\"price\":\"4000\"}]'
  );
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (
    29,
    'kategori_bahan',
    '[\"digital\",\"offset\",\"atk\",\"finishing\"]'
  );
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (
    30,
    'satuan_unit',
    '[\"lembar\",\"roll\",\"m2\",\"pcs\",\"box\",\"rim\",\"kg\",\"liter\",\"set\"]'
  );
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (31, 'install_date', '2026-05-18T13:39:05.059Z');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (
    32,
    'license_key',
    'QWJhZGkgSmF5YSBDb3BpZXI6OjoyMDMwLTEyLTMxOjo6OThDQTlGMDlENzc3NEM0ODM0QkFDQUYwRTIyRDFCMjk6Ojp7fTo6OjA2OWU3ODhjNTQ3N2I1Y2M='
  );
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (33, 'store_email', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (34, 'tax_enabled', 'false');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (35, 'tax_percentage', '11');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (36, 'fingerprint_ip', '192.168.1.201');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (37, 'fingerprint_port', '4370');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (38, 'telegram_bot_token', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (39, 'telegram_chat_id', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (40, 'telegram_enabled', 'false');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (41, 'telegram_stok_kritis', 'true');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (42, 'telegram_laporan_kasir', 'true');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (43, 'telegram_security_alert', 'false');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (44, 'telegram_error_monitoring', 'false');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (45, 'wa_gateway_url', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (46, 'wa_api_key', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (47, 'wa_session_name', 'default');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (48, 'wa_sender_number', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (
    49,
    'wa_template_inv',
    'Halo *{{name}}*, pesanan Anda *#{{invoice}}* sebesar *{{total}}* sedang kami proses. Terima kasih!'
  );
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (
    50,
    'wa_template_process',
    'Halo *{{name}}*, pesanan *#{{invoice}}* sedang dalam proses produksi/pengerjaan.'
  );
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (
    51,
    'wa_template_done',
    'Halo *{{name}}*, pesanan *#{{invoice}}* sudah selesai dan siap diambil. Silakan datang ke toko.'
  );
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (
    52,
    'wa_template_kasir',
    'LAPORAN KASIR: Transaksi baru *#{{invoice}}* senilai *{{total}}* oleh *{{user}}*.'
  );
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (53, 'cdn_account_id', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (54, 'cdn_bucket_name', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (55, 'cdn_access_key', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (56, 'cdn_secret_key', '');
INSERT INTO
  `settings` (`id`, `key`, `value`)
VALUES
  (57, 'cdn_custom_domain', '');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: spk
# ------------------------------------------------------------

INSERT INTO
  `spk` (
    `id`,
    `spk_number`,
    `customer_id`,
    `customer_name`,
    `customer_phone`,
    `customer_company`,
    `product_name`,
    `product_qty`,
    `product_unit`,
    `kategori`,
    `specs_material`,
    `specs_finishing`,
    `specs_notes`,
    `biaya_cetak`,
    `biaya_material`,
    `biaya_finishing`,
    `biaya_desain`,
    `biaya_lainnya`,
    `total_biaya`,
    `dp_amount`,
    `sisa_tagihan`,
    `status`,
    `priority`,
    `assigned_to`,
    `deadline`,
    `completed_at`,
    `created_by`,
    `created_at`,
    `updated_at`,
    `offset_order_id`
  )
VALUES
  (
    'spk-001',
    'SPK-2024-00001',
    NULL,
    'Budi Santoso',
    '0812-3456-7890',
    'PT. Maju Bersama',
    'Brosur A4 Full Color',
    500,
    'lembar',
    'Cetak Offset',
    'Art Paper 150gr',
    'Laminasi Glossy',
    'Warna harus cerah, pastikan gambar tidak pecah',
    750000.00,
    200000.00,
    150000.00,
    100000.00,
    0.00,
    1200000.00,
    500000.00,
    700000.00,
    'Batal',
    'Tinggi',
    NULL,
    '2024-10-25 08:00:00',
    NULL,
    NULL,
    '2026-03-04 21:16:18',
    '2026-03-24 02:38:11',
    NULL
  );
INSERT INTO
  `spk` (
    `id`,
    `spk_number`,
    `customer_id`,
    `customer_name`,
    `customer_phone`,
    `customer_company`,
    `product_name`,
    `product_qty`,
    `product_unit`,
    `kategori`,
    `specs_material`,
    `specs_finishing`,
    `specs_notes`,
    `biaya_cetak`,
    `biaya_material`,
    `biaya_finishing`,
    `biaya_desain`,
    `biaya_lainnya`,
    `total_biaya`,
    `dp_amount`,
    `sisa_tagihan`,
    `status`,
    `priority`,
    `assigned_to`,
    `deadline`,
    `completed_at`,
    `created_by`,
    `created_at`,
    `updated_at`,
    `offset_order_id`
  )
VALUES
  (
    'spk-002',
    'SPK-2024-00002',
    NULL,
    'Ahmad Subarjo',
    '0857-1122-3344',
    'PT. Kreatif Digital Indonesia',
    'Buku Nota A5 NCR 3 Ply',
    50,
    'buku',
    'Cetak Offset',
    'NCR Top Putih, Middle Pink, Bottom Kuning',
    'Jilid Lem Panas, Nomorator 001-500, Porporasi',
    'Nomorator harus berurutan tanpa lompat',
    500000.00,
    150000.00,
    200000.00,
    50000.00,
    0.00,
    900000.00,
    300000.00,
    600000.00,
    'Batal',
    'Normal',
    NULL,
    '2024-10-28 10:00:00',
    NULL,
    NULL,
    '2026-03-04 21:16:18',
    '2026-03-24 02:38:09',
    NULL
  );
INSERT INTO
  `spk` (
    `id`,
    `spk_number`,
    `customer_id`,
    `customer_name`,
    `customer_phone`,
    `customer_company`,
    `product_name`,
    `product_qty`,
    `product_unit`,
    `kategori`,
    `specs_material`,
    `specs_finishing`,
    `specs_notes`,
    `biaya_cetak`,
    `biaya_material`,
    `biaya_finishing`,
    `biaya_desain`,
    `biaya_lainnya`,
    `total_biaya`,
    `dp_amount`,
    `sisa_tagihan`,
    `status`,
    `priority`,
    `assigned_to`,
    `deadline`,
    `completed_at`,
    `created_by`,
    `created_at`,
    `updated_at`,
    `offset_order_id`
  )
VALUES
  (
    'spk-003',
    'SPK-2024-00003',
    NULL,
    'Siti Rahmawati',
    '0878-9988-7766',
    NULL,
    'Kartu Nama Premium Spot UV',
    5,
    'box',
    'Cetak Offset',
    'Art Carton 310gr',
    'Spot UV, Laminasi Doff',
    'Desain dari pelanggan, file sudah ready',
    175000.00,
    50000.00,
    75000.00,
    0.00,
    0.00,
    300000.00,
    300000.00,
    0.00,
    'Selesai',
    'Normal',
    NULL,
    '2024-10-22 05:00:00',
    '2024-10-21 09:30:00',
    NULL,
    '2026-03-04 21:16:18',
    '2026-03-04 21:16:18',
    NULL
  );
INSERT INTO
  `spk` (
    `id`,
    `spk_number`,
    `customer_id`,
    `customer_name`,
    `customer_phone`,
    `customer_company`,
    `product_name`,
    `product_qty`,
    `product_unit`,
    `kategori`,
    `specs_material`,
    `specs_finishing`,
    `specs_notes`,
    `biaya_cetak`,
    `biaya_material`,
    `biaya_finishing`,
    `biaya_desain`,
    `biaya_lainnya`,
    `total_biaya`,
    `dp_amount`,
    `sisa_tagihan`,
    `status`,
    `priority`,
    `assigned_to`,
    `deadline`,
    `completed_at`,
    `created_by`,
    `created_at`,
    `updated_at`,
    `offset_order_id`
  )
VALUES
  (
    'spk-1772663358560',
    'SPK-2026-00001',
    NULL,
    'Pelanggan Walk-in',
    NULL,
    NULL,
    'Offset - Nota NCR',
    1,
    'pcs',
    'Cetak Offset',
    'HVS 80gr',
    NULL,
    'Ukuran: A4',
    166500.00,
    0.00,
    0.00,
    0.00,
    0.00,
    166500.00,
    0.00,
    166500.00,
    'Batal',
    'Normal',
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-03-04 22:29:18',
    '2026-03-24 05:19:01',
    NULL
  );
INSERT INTO
  `spk` (
    `id`,
    `spk_number`,
    `customer_id`,
    `customer_name`,
    `customer_phone`,
    `customer_company`,
    `product_name`,
    `product_qty`,
    `product_unit`,
    `kategori`,
    `specs_material`,
    `specs_finishing`,
    `specs_notes`,
    `biaya_cetak`,
    `biaya_material`,
    `biaya_finishing`,
    `biaya_desain`,
    `biaya_lainnya`,
    `total_biaya`,
    `dp_amount`,
    `sisa_tagihan`,
    `status`,
    `priority`,
    `assigned_to`,
    `deadline`,
    `completed_at`,
    `created_by`,
    `created_at`,
    `updated_at`,
    `offset_order_id`
  )
VALUES
  (
    'spk-1772663365357',
    'SPK-2026-00002',
    NULL,
    'Pelanggan Walk-in',
    NULL,
    NULL,
    'Offset - Nota NCR',
    1,
    'pcs',
    'Cetak Offset',
    'HVS 80gr',
    NULL,
    'Ukuran: A4',
    166500.00,
    0.00,
    0.00,
    0.00,
    0.00,
    166500.00,
    0.00,
    166500.00,
    'Batal',
    'Normal',
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-03-04 22:29:25',
    '2026-03-24 05:18:59',
    NULL
  );
INSERT INTO
  `spk` (
    `id`,
    `spk_number`,
    `customer_id`,
    `customer_name`,
    `customer_phone`,
    `customer_company`,
    `product_name`,
    `product_qty`,
    `product_unit`,
    `kategori`,
    `specs_material`,
    `specs_finishing`,
    `specs_notes`,
    `biaya_cetak`,
    `biaya_material`,
    `biaya_finishing`,
    `biaya_desain`,
    `biaya_lainnya`,
    `total_biaya`,
    `dp_amount`,
    `sisa_tagihan`,
    `status`,
    `priority`,
    `assigned_to`,
    `deadline`,
    `completed_at`,
    `created_by`,
    `created_at`,
    `updated_at`,
    `offset_order_id`
  )
VALUES
  (
    'spk-1772671781533',
    'SPK-2026-00003',
    NULL,
    'Pelanggan Walk-in',
    NULL,
    NULL,
    'Offset - Nota NCR',
    1,
    'pcs',
    'Cetak Offset',
    'HVS 80gr',
    NULL,
    'Ukuran: A4',
    166500.00,
    0.00,
    0.00,
    0.00,
    0.00,
    166500.00,
    0.00,
    166500.00,
    'Batal',
    'Normal',
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-03-05 00:49:41',
    '2026-03-24 02:37:56',
    NULL
  );
INSERT INTO
  `spk` (
    `id`,
    `spk_number`,
    `customer_id`,
    `customer_name`,
    `customer_phone`,
    `customer_company`,
    `product_name`,
    `product_qty`,
    `product_unit`,
    `kategori`,
    `specs_material`,
    `specs_finishing`,
    `specs_notes`,
    `biaya_cetak`,
    `biaya_material`,
    `biaya_finishing`,
    `biaya_desain`,
    `biaya_lainnya`,
    `total_biaya`,
    `dp_amount`,
    `sisa_tagihan`,
    `status`,
    `priority`,
    `assigned_to`,
    `deadline`,
    `completed_at`,
    `created_by`,
    `created_at`,
    `updated_at`,
    `offset_order_id`
  )
VALUES
  (
    'spk-1772702283189',
    'SPK-2026-00004',
    NULL,
    'Pelanggan Walk-in',
    NULL,
    NULL,
    'Offset - Buku / Katalog',
    1,
    'pcs',
    'Cetak Offset',
    'HVS 80gr',
    NULL,
    'Ukuran: A4',
    22200.00,
    0.00,
    0.00,
    0.00,
    0.00,
    22200.00,
    0.00,
    22200.00,
    'Batal',
    'Normal',
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-03-05 09:18:03',
    '2026-03-24 02:38:02',
    NULL
  );
INSERT INTO
  `spk` (
    `id`,
    `spk_number`,
    `customer_id`,
    `customer_name`,
    `customer_phone`,
    `customer_company`,
    `product_name`,
    `product_qty`,
    `product_unit`,
    `kategori`,
    `specs_material`,
    `specs_finishing`,
    `specs_notes`,
    `biaya_cetak`,
    `biaya_material`,
    `biaya_finishing`,
    `biaya_desain`,
    `biaya_lainnya`,
    `total_biaya`,
    `dp_amount`,
    `sisa_tagihan`,
    `status`,
    `priority`,
    `assigned_to`,
    `deadline`,
    `completed_at`,
    `created_by`,
    `created_at`,
    `updated_at`,
    `offset_order_id`
  )
VALUES
  (
    'spk-1773042102613',
    'SPK-2026-00005',
    NULL,
    'Pelanggan Walk-in',
    NULL,
    NULL,
    'Offset - Buku / Katalog',
    1,
    'pcs',
    'Cetak Offset',
    'HVS 80gr',
    NULL,
    'Ukuran: A4',
    22200.00,
    0.00,
    0.00,
    0.00,
    0.00,
    22200.00,
    0.00,
    22200.00,
    'Batal',
    'Normal',
    NULL,
    NULL,
    NULL,
    'u1',
    '2026-03-09 07:41:42',
    '2026-03-24 02:38:05',
    NULL
  );
INSERT INTO
  `spk` (
    `id`,
    `spk_number`,
    `customer_id`,
    `customer_name`,
    `customer_phone`,
    `customer_company`,
    `product_name`,
    `product_qty`,
    `product_unit`,
    `kategori`,
    `specs_material`,
    `specs_finishing`,
    `specs_notes`,
    `biaya_cetak`,
    `biaya_material`,
    `biaya_finishing`,
    `biaya_desain`,
    `biaya_lainnya`,
    `total_biaya`,
    `dp_amount`,
    `sisa_tagihan`,
    `status`,
    `priority`,
    `assigned_to`,
    `deadline`,
    `completed_at`,
    `created_by`,
    `created_at`,
    `updated_at`,
    `offset_order_id`
  )
VALUES
  (
    'spk-1773098134509',
    'SPK-2026-00007',
    NULL,
    'Pelanggan Walk-in',
    NULL,
    NULL,
    'Offset - Nota NCR',
    1,
    'pcs',
    'Cetak Offset',
    'HVS 80gr',
    NULL,
    'Ukuran: A4',
    166500.00,
    0.00,
    0.00,
    0.00,
    0.00,
    166500.00,
    0.00,
    166500.00,
    'Batal',
    'Normal',
    NULL,
    NULL,
    NULL,
    'u1',
    '2026-03-09 23:15:34',
    '2026-03-24 02:37:28',
    NULL
  );
INSERT INTO
  `spk` (
    `id`,
    `spk_number`,
    `customer_id`,
    `customer_name`,
    `customer_phone`,
    `customer_company`,
    `product_name`,
    `product_qty`,
    `product_unit`,
    `kategori`,
    `specs_material`,
    `specs_finishing`,
    `specs_notes`,
    `biaya_cetak`,
    `biaya_material`,
    `biaya_finishing`,
    `biaya_desain`,
    `biaya_lainnya`,
    `total_biaya`,
    `dp_amount`,
    `sisa_tagihan`,
    `status`,
    `priority`,
    `assigned_to`,
    `deadline`,
    `completed_at`,
    `created_by`,
    `created_at`,
    `updated_at`,
    `offset_order_id`
  )
VALUES
  (
    'spk-1773103251989',
    'SPK-2026-00008',
    NULL,
    'Pelanggan Walk-in',
    NULL,
    NULL,
    'Offset - Buku / Katalog',
    1,
    'pcs',
    'Cetak Offset',
    'HVS 80gr',
    NULL,
    'Ukuran: A4',
    22200.00,
    0.00,
    0.00,
    0.00,
    0.00,
    22200.00,
    0.00,
    22200.00,
    'Batal',
    'Normal',
    NULL,
    NULL,
    NULL,
    'u1',
    '2026-03-10 00:40:51',
    '2026-03-24 02:37:26',
    NULL
  );
INSERT INTO
  `spk` (
    `id`,
    `spk_number`,
    `customer_id`,
    `customer_name`,
    `customer_phone`,
    `customer_company`,
    `product_name`,
    `product_qty`,
    `product_unit`,
    `kategori`,
    `specs_material`,
    `specs_finishing`,
    `specs_notes`,
    `biaya_cetak`,
    `biaya_material`,
    `biaya_finishing`,
    `biaya_desain`,
    `biaya_lainnya`,
    `total_biaya`,
    `dp_amount`,
    `sisa_tagihan`,
    `status`,
    `priority`,
    `assigned_to`,
    `deadline`,
    `completed_at`,
    `created_by`,
    `created_at`,
    `updated_at`,
    `offset_order_id`
  )
VALUES
  (
    'spk-1773103417393',
    'SPK-2026-00009',
    NULL,
    'Pelanggan Walk-in',
    NULL,
    NULL,
    'Offset - Nota NCR',
    1,
    'pcs',
    'Cetak Offset',
    'HVS 80gr',
    NULL,
    'Ukuran: A4',
    166500.00,
    0.00,
    0.00,
    0.00,
    0.00,
    166500.00,
    0.00,
    166500.00,
    'Batal',
    'Normal',
    NULL,
    NULL,
    NULL,
    'u1',
    '2026-03-10 00:43:37',
    '2026-03-24 02:37:24',
    NULL
  );
INSERT INTO
  `spk` (
    `id`,
    `spk_number`,
    `customer_id`,
    `customer_name`,
    `customer_phone`,
    `customer_company`,
    `product_name`,
    `product_qty`,
    `product_unit`,
    `kategori`,
    `specs_material`,
    `specs_finishing`,
    `specs_notes`,
    `biaya_cetak`,
    `biaya_material`,
    `biaya_finishing`,
    `biaya_desain`,
    `biaya_lainnya`,
    `total_biaya`,
    `dp_amount`,
    `sisa_tagihan`,
    `status`,
    `priority`,
    `assigned_to`,
    `deadline`,
    `completed_at`,
    `created_by`,
    `created_at`,
    `updated_at`,
    `offset_order_id`
  )
VALUES
  (
    'spk-1773114059156',
    'SPK-2026-00010',
    NULL,
    'Pelanggan Walk-in',
    NULL,
    NULL,
    'Offset - Buku / Katalog',
    1,
    'pcs',
    'Cetak Offset',
    'HVS 80gr',
    NULL,
    'Ukuran: A4',
    22200.00,
    0.00,
    0.00,
    0.00,
    0.00,
    22200.00,
    0.00,
    22200.00,
    'Batal',
    'Normal',
    NULL,
    NULL,
    NULL,
    'u1',
    '2026-03-10 03:40:59',
    '2026-03-24 02:37:20',
    NULL
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: spk_handovers
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: spk_logs
# ------------------------------------------------------------

INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    1,
    'spk-1772663358560',
    NULL,
    'STATUS_CHANGE',
    'SPK Baru Dibuat',
    NULL,
    'Menunggu Antrian',
    '2026-03-04 22:29:18'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    2,
    'spk-1772663365357',
    NULL,
    'STATUS_CHANGE',
    'SPK Baru Dibuat',
    NULL,
    'Menunggu Antrian',
    '2026-03-04 22:29:25'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    3,
    'spk-1772671781533',
    NULL,
    'STATUS_CHANGE',
    'SPK Baru Dibuat',
    NULL,
    'Menunggu Antrian',
    '2026-03-05 00:49:41'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    4,
    'spk-1772702283189',
    NULL,
    'STATUS_CHANGE',
    'SPK Baru Dibuat',
    NULL,
    'Menunggu Antrian',
    '2026-03-05 09:18:03'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    5,
    'spk-1773042102613',
    'u1',
    'STATUS_CHANGE',
    'SPK Baru Dibuat',
    NULL,
    'Menunggu Antrian',
    '2026-03-09 07:41:42'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    10,
    'spk-1773098134509',
    'u1',
    'STATUS_CHANGE',
    'SPK Baru Dibuat',
    NULL,
    'Menunggu Antrian',
    '2026-03-09 23:15:34'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    11,
    'spk-1773103251989',
    'u1',
    'STATUS_CHANGE',
    'SPK Baru Dibuat',
    NULL,
    'Menunggu Antrian',
    '2026-03-10 00:40:51'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    12,
    'spk-1773103417393',
    'u1',
    'STATUS_CHANGE',
    'SPK Baru Dibuat',
    NULL,
    'Menunggu Antrian',
    '2026-03-10 00:43:37'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    13,
    'spk-1773114059156',
    'u1',
    'STATUS_CHANGE',
    'SPK Baru Dibuat',
    NULL,
    'Menunggu Antrian',
    '2026-03-10 03:40:59'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    14,
    'spk-1773114059156',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Menunggu Antrian → Dalam Proses Cetak',
    'Menunggu Antrian',
    'Dalam Proses Cetak',
    '2026-03-10 03:41:27'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    15,
    'spk-1773114059156',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Dalam Proses Cetak → Finishing',
    'Dalam Proses Cetak',
    'Finishing',
    '2026-03-10 03:41:28'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    16,
    'spk-1773114059156',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Finishing → Quality Control',
    'Finishing',
    'Quality Control',
    '2026-03-10 03:41:30'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    17,
    'spk-1773114059156',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Quality Control → Menunggu Antrian',
    'Quality Control',
    'Menunggu Antrian',
    '2026-03-10 03:41:31'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    19,
    'spk-001',
    'u1',
    'STATUS_CHANGE',
    'SPK Baru Dibuat',
    NULL,
    'Menunggu Antrian',
    '2026-03-13 15:35:38'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    20,
    'spk-001',
    'u1',
    'STATUS_CHANGE',
    'Status berubah ke Dalam Proses Cetak',
    'Menunggu Antrian',
    'Dalam Proses Cetak',
    '2026-03-13 15:35:38'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    21,
    'spk-001',
    'u1',
    'PAYMENT',
    'Uang muka (DP) diterima: Rp 500.000',
    NULL,
    '500000',
    '2026-03-13 15:35:38'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    22,
    'spk-002',
    'u1',
    'STATUS_CHANGE',
    'SPK Baru Dibuat',
    NULL,
    'Menunggu Antrian',
    '2026-03-13 15:35:38'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    23,
    'spk-003',
    'u1',
    'STATUS_CHANGE',
    'SPK Baru Dibuat',
    NULL,
    'Menunggu Antrian',
    '2026-03-13 15:35:38'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    24,
    'spk-003',
    'u1',
    'STATUS_CHANGE',
    'Status berubah ke Selesai',
    'Quality Control',
    'Selesai',
    '2026-03-13 15:35:38'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    26,
    'spk-1773042102613',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Menunggu Antrian → Dalam Proses Cetak',
    'Menunggu Antrian',
    'Dalam Proses Cetak',
    '2026-03-14 02:24:41'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    28,
    'spk-1772671781533',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Menunggu Antrian → Dalam Proses Cetak',
    'Menunggu Antrian',
    'Dalam Proses Cetak',
    '2026-03-15 12:21:39'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    36,
    'spk-1773103417393',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Menunggu Antrian → Finishing',
    'Menunggu Antrian',
    'Finishing',
    '2026-03-15 23:00:41'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    37,
    'spk-1773103417393',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Finishing → Menunggu Antrian',
    'Finishing',
    'Menunggu Antrian',
    '2026-03-24 02:08:32'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    40,
    'spk-1773114059156',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Menunggu Antrian → Batal',
    'Menunggu Antrian',
    'Batal',
    '2026-03-24 02:37:20'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    41,
    'spk-1773103417393',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Menunggu Antrian → Batal',
    'Menunggu Antrian',
    'Batal',
    '2026-03-24 02:37:24'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    42,
    'spk-1773103251989',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Menunggu Antrian → Batal',
    'Menunggu Antrian',
    'Batal',
    '2026-03-24 02:37:26'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    43,
    'spk-1773098134509',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Menunggu Antrian → Batal',
    'Menunggu Antrian',
    'Batal',
    '2026-03-24 02:37:28'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    44,
    'spk-1772671781533',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Dalam Proses Cetak → Batal',
    'Dalam Proses Cetak',
    'Batal',
    '2026-03-24 02:37:56'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    45,
    'spk-1772702283189',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Menunggu Antrian → Batal',
    'Menunggu Antrian',
    'Batal',
    '2026-03-24 02:38:02'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    46,
    'spk-1773042102613',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Dalam Proses Cetak → Batal',
    'Dalam Proses Cetak',
    'Batal',
    '2026-03-24 02:38:05'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    47,
    'spk-002',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Menunggu Antrian → Batal',
    'Menunggu Antrian',
    'Batal',
    '2026-03-24 02:38:09'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    48,
    'spk-001',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Dalam Proses Cetak → Batal',
    'Dalam Proses Cetak',
    'Batal',
    '2026-03-24 02:38:11'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    49,
    'spk-1772663365357',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Menunggu Antrian → Batal',
    'Menunggu Antrian',
    'Batal',
    '2026-03-24 05:18:59'
  );
INSERT INTO
  `spk_logs` (
    `id`,
    `spk_id`,
    `user_id`,
    `action`,
    `description`,
    `old_value`,
    `new_value`,
    `created_at`
  )
VALUES
  (
    50,
    'spk-1772663358560',
    'u1',
    'STATUS_CHANGE',
    'Status berubah: Menunggu Antrian → Batal',
    'Menunggu Antrian',
    'Batal',
    '2026-03-24 05:19:01'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: spk_payments
# ------------------------------------------------------------

INSERT INTO
  `spk_payments` (
    `id`,
    `spk_id`,
    `payment_type`,
    `method`,
    `amount`,
    `bank_ref`,
    `status`,
    `paid_by`,
    `created_at`
  )
VALUES
  (
    1,
    'spk-001',
    'DP',
    'Tunai',
    500000.00,
    NULL,
    'Berhasil',
    'u1',
    '2026-03-13 15:35:38'
  );
INSERT INTO
  `spk_payments` (
    `id`,
    `spk_id`,
    `payment_type`,
    `method`,
    `amount`,
    `bank_ref`,
    `status`,
    `paid_by`,
    `created_at`
  )
VALUES
  (
    2,
    'spk-002',
    'DP',
    'Transfer',
    300000.00,
    NULL,
    'Berhasil',
    'u1',
    '2026-03-13 15:35:38'
  );
INSERT INTO
  `spk_payments` (
    `id`,
    `spk_id`,
    `payment_type`,
    `method`,
    `amount`,
    `bank_ref`,
    `status`,
    `paid_by`,
    `created_at`
  )
VALUES
  (
    3,
    'spk-003',
    'DP',
    'QRIS',
    300000.00,
    NULL,
    'Berhasil',
    'u1',
    '2026-03-13 15:35:38'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: stock_movements
# ------------------------------------------------------------

INSERT INTO
  `stock_movements` (
    `id`,
    `product_id`,
    `type`,
    `qty`,
    `date`,
    `reference`,
    `notes`
  )
VALUES
  (
    1,
    'prod-dummy-1',
    'in',
    1,
    '2026-03-22 11:40:57',
    'PURC-1774179657396',
    'Restock Barang Masuk'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: suppliers
# ------------------------------------------------------------

INSERT INTO
  `suppliers` (
    `id`,
    `name`,
    `contact_person`,
    `phone`,
    `address`,
    `notes`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '5b0aed99-f413-423d-bdb0-b67670636438',
    'PERCETAKAN AN NUR MEDIA',
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-05-21 17:00:56',
    '2026-05-21 17:00:56'
  );
INSERT INTO
  `suppliers` (
    `id`,
    `name`,
    `contact_person`,
    `phone`,
    `address`,
    `notes`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    'b8c0a98b-e476-44a3-a54e-f27e490eaba1',
    'ATLANTIK PONOROGO',
    'ANING',
    '081200562456',
    'Ponorogo',
    'Jadwal kirim setiap hari rabu',
    '2026-03-22 14:11:34',
    '2026-03-22 14:11:34'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: tiered_pricing_rules
# ------------------------------------------------------------

INSERT INTO
  `tiered_pricing_rules` (
    `id`,
    `product_id`,
    `min_kuantitas`,
    `max_kuantitas`,
    `diskon_persen`,
    `harga_per_unit_akhir`,
    `urutan_tier`
  )
VALUES
  (1, 'prod-dummy-1', 1, 10, 0.00, 25000.00, 1);
INSERT INTO
  `tiered_pricing_rules` (
    `id`,
    `product_id`,
    `min_kuantitas`,
    `max_kuantitas`,
    `diskon_persen`,
    `harga_per_unit_akhir`,
    `urutan_tier`
  )
VALUES
  (2, 'prod-dummy-1', 11, 50, 10.00, 22500.00, 2);
INSERT INTO
  `tiered_pricing_rules` (
    `id`,
    `product_id`,
    `min_kuantitas`,
    `max_kuantitas`,
    `diskon_persen`,
    `harga_per_unit_akhir`,
    `urutan_tier`
  )
VALUES
  (3, 'prod-dummy-1', 51, NULL, 25.00, 18750.00, 3);
INSERT INTO
  `tiered_pricing_rules` (
    `id`,
    `product_id`,
    `min_kuantitas`,
    `max_kuantitas`,
    `diskon_persen`,
    `harga_per_unit_akhir`,
    `urutan_tier`
  )
VALUES
  (4, 'prod-dummy-2', 1, 5, 0.00, 35000.00, 1);
INSERT INTO
  `tiered_pricing_rules` (
    `id`,
    `product_id`,
    `min_kuantitas`,
    `max_kuantitas`,
    `diskon_persen`,
    `harga_per_unit_akhir`,
    `urutan_tier`
  )
VALUES
  (5, 'prod-dummy-2', 6, 20, 5.00, 33250.00, 2);
INSERT INTO
  `tiered_pricing_rules` (
    `id`,
    `product_id`,
    `min_kuantitas`,
    `max_kuantitas`,
    `diskon_persen`,
    `harga_per_unit_akhir`,
    `urutan_tier`
  )
VALUES
  (6, 'prod-dummy-2', 21, NULL, 15.00, 29750.00, 3);

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: transaction_details
# ------------------------------------------------------------

INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1774173465451704',
    't1774173465448',
    NULL,
    'Fotocopy HVS A4 (B/W, 1 Sisi)',
    2,
    250,
    500,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1774173510751947',
    't1774173510749',
    NULL,
    'Fotocopy HVS A4 (B/W, 1 Sisi)',
    2,
    250,
    500,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1774183855106734',
    't1774183855102',
    NULL,
    'Fotocopy HVS A4 (B/W, 1 Sisi)',
    4,
    250,
    1000,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1774183908258516',
    't1774183908254',
    NULL,
    'Fotocopy HVS A4 (B/W, 1 Sisi)',
    4,
    250,
    1000,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1774328800369781',
    't1774328800360',
    NULL,
    'Print CETAK FOTO 3R (Warna)',
    1,
    3000,
    3000,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td177437427732492',
    't1774374277322',
    NULL,
    'Fotocopy HVS A4 (B/W, 1 Sisi)',
    4,
    250,
    1000,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1774374922292915',
    't1774374922291',
    NULL,
    'Fotocopy HVS A4 (B/W, 1 Sisi)',
    4,
    250,
    1000,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1774416180878371',
    't1774416180876',
    NULL,
    'Fotocopy HVS A4 (B/W, 1 Sisi)',
    4,
    250,
    1000,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1774432502922163',
    't1774432502919',
    NULL,
    'Print PRINT COPY A4 F4 CANON (B/W)',
    25,
    250,
    6250,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1774438411961605',
    't1774438411959',
    NULL,
    'POLPEN GEL INK PEN',
    1,
    5000,
    5000,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td177443841196227',
    't1774438411959',
    NULL,
    'Fotocopy HVS F4 (B/W, 1 Sisi)',
    10,
    250,
    2500,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1774971468698825',
    't1774971468692',
    NULL,
    'Fotocopy HVS A4 (B/W, 1 Sisi)',
    3,
    250,
    750,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1775058089941390',
    't1775058089937',
    NULL,
    'Fotocopy HVS A4 (B/W, 1 Sisi)',
    3,
    250,
    750,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1775058124135298',
    't1775058124133',
    NULL,
    'Fotocopy HVS A4 (B/W, 1 Sisi)',
    4,
    250,
    1000,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1775124143837626',
    't1775124143835',
    NULL,
    'Laminating A4 & F4',
    1,
    4000,
    4000,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1775124143837631',
    't1775124143835',
    NULL,
    'Print PRIN KERTAS COVER EPSON (B/W)',
    1,
    1500,
    1500,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td17751249390843',
    't1775124939081',
    NULL,
    'Fotocopy HVS A4 (B/W, 1 Sisi)',
    40,
    250,
    10000,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1775124939085335',
    't1775124939081',
    NULL,
    'Print HVS A4 EPSON (Warna)',
    1,
    1000,
    1000,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1775124939085341',
    't1775124939081',
    NULL,
    'Fotocopy HVS A4 (B/W, Bolak-balik)',
    10,
    400,
    4000,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1779357990463194',
    't1779357990460',
    NULL,
    'CETAK ID CARD',
    198,
    8000,
    1584000,
    0
  );
INSERT INTO
  `transaction_details` (
    `id`,
    `transaction_id`,
    `product_id`,
    `name`,
    `qty`,
    `price`,
    `subtotal`,
    `discount`
  )
VALUES
  (
    'td1779358153482406',
    't1779358153481',
    NULL,
    'Print PRINT COPY A4 F4 CANON BW (1 Sisi)',
    85,
    250,
    21250,
    0
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: transactions
# ------------------------------------------------------------

INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1774173465448',
    'TRX-202603-2545',
    '2026-03-22 02:57:45',
    NULL,
    'Fotocopy Anggun ',
    NULL,
    'u1',
    'Admin Utama',
    'service',
    500,
    0,
    0,
    500,
    500,
    500,
    'tunai',
    'paid',
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1774173510749',
    'TRX-202603-2987',
    '2026-03-22 02:58:30',
    NULL,
    'Umum',
    NULL,
    'u1',
    'Admin Utama',
    'service',
    500,
    0,
    0,
    500,
    500,
    500,
    'tunai',
    'paid',
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1774183855102',
    'TRX-202603-7418',
    '2026-03-22 05:50:55',
    NULL,
    'Umum',
    NULL,
    'u1',
    'Admin Utama',
    'service',
    1000,
    0,
    0,
    1000,
    1000,
    0,
    'tunai',
    'paid',
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1774183908254',
    'TRX-202603-2152',
    '2026-03-22 05:51:48',
    NULL,
    'Umum',
    NULL,
    'u1',
    'Admin Utama',
    'service',
    1000,
    0,
    0,
    1000,
    1000,
    0,
    'tunai',
    'paid',
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1774328800360',
    'TRX-202603-9614',
    '2026-03-23 22:06:40',
    NULL,
    'Umum',
    NULL,
    'u1',
    'Admin Utama',
    'service',
    3000,
    0,
    0,
    3000,
    3000,
    0,
    'tunai',
    'paid',
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1774374277322',
    'TRX-202603-2662',
    '2026-03-24 10:44:37',
    NULL,
    'Umum',
    NULL,
    'u1',
    'Admin Utama',
    'service',
    1000,
    0,
    0,
    1000,
    1000,
    0,
    'tunai',
    'paid',
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1774374922291',
    'TRX-202603-9586',
    '2026-03-24 10:55:22',
    NULL,
    'Umum',
    NULL,
    'u1',
    'Admin Utama',
    'service',
    1000,
    0,
    0,
    1000,
    1000,
    0,
    'tunai',
    'paid',
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1774416180876',
    'TRX-202603-6443',
    '2026-03-24 22:23:02',
    NULL,
    'Umum',
    NULL,
    'u1',
    'Admin Utama',
    'service',
    1000,
    0,
    0,
    1000,
    1000,
    0,
    'tunai',
    'paid',
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1774432502919',
    'TRX-202603-9989',
    '2026-03-25 02:55:02',
    NULL,
    'nogrek',
    NULL,
    'u1',
    'Admin Utama',
    'service',
    6250,
    0,
    0,
    6250,
    6250,
    0,
    'tunai',
    'paid',
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1774438411959',
    'TRX-202603-1505',
    '2026-03-25 04:33:31',
    NULL,
    'Umum',
    NULL,
    'u1',
    'Admin Utama',
    'service',
    7500,
    0,
    0,
    7500,
    7500,
    500,
    'tunai',
    'paid',
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1774971468692',
    'TRX-202603-8009',
    '2026-03-31 08:37:48',
    NULL,
    'Umum',
    NULL,
    'u1',
    'Admin Utama',
    'service',
    750,
    0,
    0,
    750,
    750,
    0,
    'tunai',
    'paid',
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1775058089937',
    'TRX-202604-1522',
    '2026-04-01 08:41:29',
    NULL,
    'Umum',
    NULL,
    'u1',
    'Admin Utama',
    'service',
    750,
    0,
    0,
    750,
    750,
    0,
    'tunai',
    'paid',
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1775058124133',
    'TRX-202604-3417',
    '2026-04-01 08:42:04',
    NULL,
    'Umum',
    NULL,
    'u1',
    'Admin Utama',
    'service',
    1000,
    0,
    0,
    1000,
    1000,
    0,
    'tunai',
    'paid',
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1775124143835',
    'TRX-202604-4887',
    '2026-04-02 03:02:23',
    NULL,
    'Umum',
    NULL,
    'u1',
    'Admin Utama',
    'service',
    5500,
    0,
    0,
    5500,
    5500,
    0,
    'tunai',
    'paid',
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1775124939081',
    'TRX-202604-8791',
    '2026-04-02 03:15:39',
    NULL,
    'Umum',
    NULL,
    'u1',
    'Admin Utama',
    'service',
    15000,
    0,
    0,
    15000,
    15000,
    0,
    'tunai',
    'paid',
    NULL
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1779357990460',
    'TRX-202605-5898',
    '2026-05-21 17:06:30',
    'c1779357723907',
    'KPRI  LEMBEYAN',
    '08133134322',
    'u1',
    'Admin Utama',
    '',
    1584000,
    0,
    0,
    1584000,
    1000000,
    0,
    'hutang',
    'pending',
    'ID CARD KOP MART'
  );
INSERT INTO
  `transactions` (
    `id`,
    `invoice_no`,
    `date`,
    `customer_id`,
    `customer_name`,
    `customer_wa`,
    `user_id`,
    `user_name`,
    `type`,
    `subtotal`,
    `discount`,
    `tax_amount`,
    `total`,
    `paid`,
    `change_amount`,
    `payment_type`,
    `status`,
    `notes`
  )
VALUES
  (
    't1779358153481',
    'TRX-202605-3936',
    '2026-05-21 17:09:13',
    NULL,
    'Umum',
    NULL,
    'u1',
    'Admin Utama',
    'Cetak',
    21250,
    0,
    0,
    21250,
    21250,
    0,
    'tunai',
    'paid',
    ''
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: users
# ------------------------------------------------------------

INSERT INTO
  `users` (
    `id`,
    `name`,
    `username`,
    `password`,
    `role`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    'des001',
    'Andi Desainer',
    'andi_desain',
    '$2a$10$qH6Xe3vsVF4ZP4ekmECF9ePmwQH3aqbLPjJKRYsbxo9dBx2jC9Kfm',
    'desainer',
    1,
    '2026-03-10 12:18:43'
  );
INSERT INTO
  `users` (
    `id`,
    `name`,
    `username`,
    `password`,
    `role`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    'des002',
    'Budi Desainer',
    'budi_desain',
    '$2a$10$./2MZydw8grJfzjbpUdbHuiPk1xh1mriBJhL1LGHVrsBotoHjKwXO',
    'desainer',
    1,
    '2026-03-10 12:18:43'
  );
INSERT INTO
  `users` (
    `id`,
    `name`,
    `username`,
    `password`,
    `role`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    'des1773155248207',
    'Supri',
    'supri',
    '$2a$10$Gpt3slKgpqFRnqxIPZnSi.e.KdvUF2DfZNa/r71ltP/6.oyUgC/ZW',
    'operator',
    1,
    '2026-03-10 15:07:28'
  );
INSERT INTO
  `users` (
    `id`,
    `name`,
    `username`,
    `password`,
    `role`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    'u1',
    'Admin Utama',
    'admin',
    '$2a$10$sJc8EuUZHYd0PIN9PoJ7v.D8j9IyFVpmVLbqWYmgJJdjIEWgNZwWC',
    'admin',
    1,
    '2026-03-09 07:24:14'
  );
INSERT INTO
  `users` (
    `id`,
    `name`,
    `username`,
    `password`,
    `role`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    'u2',
    'Kasir Depan',
    'kasir',
    '$2a$10$nJ91ov6hlHTdswjXsdvgW.lQedMkO6mOAe52HnftxW3GFd56uWTGe',
    'kasir',
    1,
    '2026-03-09 07:24:14'
  );
INSERT INTO
  `users` (
    `id`,
    `name`,
    `username`,
    `password`,
    `role`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    'u3',
    'Operator Cetak',
    'operator',
    '$2a$10$vUwRgB40Xe4mamOJhZPyOuJCc3tTjLb/MN5sZcPy2hjffTudz2tR.',
    'operator',
    1,
    '2026-03-09 07:24:14'
  );
INSERT INTO
  `users` (
    `id`,
    `name`,
    `username`,
    `password`,
    `role`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    'u4',
    'Teknisi Abadi',
    'teknisi',
    '$2a$10$V1At.JViIPLmIQSoxhbUM.w0BgGUHtqIsXGcNZa8gtH33gdDjsUn.',
    'teknisi',
    1,
    '2026-03-09 07:24:14'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: wa_config
# ------------------------------------------------------------

INSERT INTO
  `wa_config` (`id`, `config_key`, `config_value`, `updated_at`)
VALUES
  (
    1,
    'api_url',
    'https://api.fonnte.com/send',
    '2026-03-04 21:16:18'
  );
INSERT INTO
  `wa_config` (`id`, `config_key`, `config_value`, `updated_at`)
VALUES
  (2, 'api_token', 'admin123', '2026-03-10 13:41:51');
INSERT INTO
  `wa_config` (`id`, `config_key`, `config_value`, `updated_at`)
VALUES
  (
    3,
    'template_spk_selesai',
    'Halo {nama}, pesanan *{produk}* (SPK: {spk_number}) Anda sudah selesai dan siap diambil. Sisa tagihan: *Rp {sisa_tagihan}*. Terima kasih! ?',
    '2026-03-04 21:16:18'
  );
INSERT INTO
  `wa_config` (`id`, `config_key`, `config_value`, `updated_at`)
VALUES
  (
    4,
    'template_invoice',
    'Halo {nama}, berikut invoice untuk pesanan Anda:\n\nNo. SPK: {spk_number}\nProduk: {produk}\nTotal: Rp {total}\nDP: Rp {dp}\nSisa: Rp {sisa}\n\nTerima kasih! ?',
    '2026-03-04 21:16:18'
  );
INSERT INTO
  `wa_config` (`id`, `config_key`, `config_value`, `updated_at`)
VALUES
  (
    5,
    'auto_notify_on_complete',
    'true',
    '2026-03-04 21:16:18'
  );
INSERT INTO
  `wa_config` (`id`, `config_key`, `config_value`, `updated_at`)
VALUES
  (
    7,
    'phone_number',
    '85655620979',
    '2026-03-10 13:41:51'
  );

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
