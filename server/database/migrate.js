const { pool } = require('../config/database');

const createTables = async () => {
  try {
    const connection = await pool.getConnection();

    // 1. Users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'kasir', 'operator', 'teknisi') NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Categories
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        type ENUM('atk', 'fotocopy_supply', 'percetakan_supply', 'sparepart') NOT NULL,
        emoji VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      )
    `);

    // 3. Products
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        category_id VARCHAR(50),
        buy_price INT NOT NULL DEFAULT 0,
        sell_price INT NOT NULL DEFAULT 0,
        stock INT NOT NULL DEFAULT 0,
        min_stock INT NOT NULL DEFAULT 0,
        unit VARCHAR(20) DEFAULT 'pcs',
        emoji VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // 4. Customers
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        type ENUM('walkin', 'corporate', 'vip', 'service') DEFAULT 'walkin',
        company VARCHAR(100),
        total_trx INT DEFAULT 0,
        total_spend INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Transactions (POS / Kasir)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        invoice_no VARCHAR(50) UNIQUE NOT NULL,
        date DATETIME NOT NULL,
        customer_id VARCHAR(50),
        customer_name VARCHAR(100) DEFAULT 'Umum',
        user_id VARCHAR(50),
        user_name VARCHAR(100),
        type ENUM('sale', 'fotocopy') DEFAULT 'sale',
        subtotal INT NOT NULL,
        discount INT DEFAULT 0,
        total INT NOT NULL,
        paid INT DEFAULT 0,
        change_amount INT DEFAULT 0,
        payment_type ENUM('tunai', 'transfer', 'qris', 'hutang') NOT NULL,
        status ENUM('paid', 'unpaid') NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 6. Transaction Details (Items)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transaction_details (
        id VARCHAR(50) PRIMARY KEY,
        transaction_id VARCHAR(50) NOT NULL,
        product_id VARCHAR(50),
        name VARCHAR(100) NOT NULL,
        qty INT NOT NULL,
        price INT NOT NULL,
        subtotal INT NOT NULL,
        discount INT DEFAULT 0,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);

    // 7. Print Orders (Percetakan)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS print_orders (
        id VARCHAR(50) PRIMARY KEY,
        order_no VARCHAR(50) UNIQUE NOT NULL,
        customer_id VARCHAR(50),
        customer_name VARCHAR(100) NOT NULL,
        type VARCHAR(100) NOT NULL,
        description TEXT,
        specs TEXT,
        qty INT NOT NULL,
        unit VARCHAR(20) DEFAULT 'pcs',
        total_price INT NOT NULL,
        dp_amount INT DEFAULT 0,
        remaining INT DEFAULT 0,
        shipping_cost INT DEFAULT 0,
        deadline DATE,
        status ENUM('pending', 'desain', 'approval', 'cetak', 'selesai', 'diambil', 'batal') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      )
    `);

    // 8. Service Orders (Service Mesin)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS service_orders (
        id VARCHAR(50) PRIMARY KEY,
        service_no VARCHAR(50) UNIQUE NOT NULL,
        customer_id VARCHAR(50),
        customer_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        machine_info VARCHAR(100) NOT NULL,
        serial_no VARCHAR(50),
        complaint TEXT NOT NULL,
        condition_physic TEXT,
        diagnosis TEXT,
        labor_cost INT DEFAULT 0,
        total_cost INT DEFAULT 0,
        status ENUM('diterima', 'diagnosa', 'approval', 'tunggu_part', 'pengerjaan', 'testing', 'selesai', 'diambil', 'batal') DEFAULT 'diterima',
        technician_id VARCHAR(50),
        warranty_end DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 9. Extra Table for Service Spareparts as JSON (for simplicity, or separate table. We'll use a JSON text field inside service_orders or separate table)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS service_spareparts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_order_id VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        qty INT NOT NULL,
        price INT NOT NULL,
        FOREIGN KEY (service_order_id) REFERENCES service_orders(id) ON DELETE CASCADE
      )
    `);

    // 10. Cash Flow / Keuangan
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cash_flow (
        id VARCHAR(50) PRIMARY KEY,
        date DATE NOT NULL,
        type ENUM('in', 'out') NOT NULL,
        category VARCHAR(50) NOT NULL,
        amount INT NOT NULL,
        description TEXT,
        reference_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 11. Stock Movements
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id VARCHAR(50) NOT NULL,
        type ENUM('in', 'out', 'adjust') NOT NULL,
        qty INT NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reference VARCHAR(100),
        notes TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // 12. Activity Log
    await connection.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50),
        user_name VARCHAR(100),
        action VARCHAR(50) NOT NULL,
        detail TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 13. Settings / Pengaturan
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        \`key\` VARCHAR(100) UNIQUE NOT NULL,
        value TEXT
      )
    `);

    // 14. Fotocopy Prices Master
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fotocopy_prices (
        id VARCHAR(50) PRIMARY KEY,
        paper ENUM('HVS A4', 'HVS F4', 'HVS A3') NOT NULL,
        color ENUM('bw', 'color') NOT NULL,
        side ENUM('1', '2') NOT NULL,
        price INT NOT NULL,
        label VARCHAR(100) NOT NULL
      )
    `);

    // 15. SPK (Surat Perintah Kerja)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS spk (
        id VARCHAR(50) PRIMARY KEY,
        spk_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id VARCHAR(50) NULL,
        customer_name VARCHAR(150) NOT NULL,
        customer_phone VARCHAR(30) NULL,
        customer_company VARCHAR(150) NULL,
        product_name VARCHAR(200) NOT NULL,
        product_qty INT NOT NULL DEFAULT 1,
        product_unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
        specs_material TEXT NULL,
        specs_finishing TEXT NULL,
        specs_notes TEXT NULL,
        biaya_cetak DECIMAL(12,2) NOT NULL DEFAULT 0,
        biaya_material DECIMAL(12,2) NOT NULL DEFAULT 0,
        biaya_finishing DECIMAL(12,2) NOT NULL DEFAULT 0,
        biaya_desain DECIMAL(12,2) NOT NULL DEFAULT 0,
        biaya_lainnya DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_biaya DECIMAL(12,2) NOT NULL DEFAULT 0,
        dp_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        sisa_tagihan DECIMAL(12,2) NOT NULL DEFAULT 0,
        status ENUM('Menunggu Antrian', 'Dalam Proses Cetak', 'Finishing', 'Quality Control', 'Selesai', 'Siap Diambil', 'Diambil') NOT NULL DEFAULT 'Menunggu Antrian',
        priority ENUM('Rendah', 'Normal', 'Tinggi', 'Urgent') NOT NULL DEFAULT 'Normal',
        assigned_to VARCHAR(50) NULL,
        deadline DATETIME NULL,
        completed_at DATETIME NULL,
        created_by VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        offset_order_id VARCHAR(50) NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    // 16. SPK Logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS spk_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        spk_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NULL,
        action VARCHAR(100) NOT NULL,
        description TEXT NULL,
        old_value VARCHAR(100) NULL,
        new_value VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (spk_id) REFERENCES spk(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    // 17. SPK Payments
    await connection.query(`
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
        FOREIGN KEY (spk_id) REFERENCES spk(id) ON DELETE CASCADE,
        FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    // 18. SPK Handovers
    await connection.query(`
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
        FOREIGN KEY (spk_id) REFERENCES spk(id) ON DELETE CASCADE,
        FOREIGN KEY (handed_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    // 19. WA Config
    await connection.query(`
      CREATE TABLE IF NOT EXISTS wa_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value TEXT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    // Seed WA Config if empty
    const [waRows] = await connection.query('SELECT COUNT(*) as count FROM wa_config');
    if (waRows[0].count === 0) {
      await connection.query(`
        INSERT INTO wa_config (config_key, config_value) VALUES
        ('api_url', 'https://api.fonnte.com/send'),
        ('api_token', ''),
        ('template_spk_selesai', 'Halo {nama}, pesanan *{produk}* (SPK: {spk_number}) Anda sudah selesai dan siap diambil. Sisa tagihan: *Rp {sisa_tagihan}*. Terima kasih! 🙏'),
        ('template_invoice', 'Halo {nama}, berikut invoice untuk pesanan Anda:\\n\\nNo. SPK: {spk_number}\\nProduk: {produk}\\nTotal: Rp {total}\\nDP: Rp {dp}\\nSisa: Rp {sisa}\\n\\nTerima kasih! 🧾'),
        ('auto_notify_on_complete', 'true')
      `);
    }

    console.log('✅ Semua tabel (19 tabel) berhasil dibuat atau sudah ada.');
    connection.release();
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('❌ GAGAL: Database "pos_abadi" belum ada! Jalankan di database MySQL: CREATE DATABASE pos_abadi;');
    } else {
      console.error('❌ GAGAL membuat tabel:', err.message);
    }
    process.exit(1);
  }
};

createTables();
