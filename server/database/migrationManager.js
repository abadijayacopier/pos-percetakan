const { getActivePool, currentDbType } = require('../config/database');

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║         PUSAT KENDALI DATABASE (DATABASE LOCK) - UNIFIED PRO MAX         ║
 * ║    Menyatukan Seluruh Modul: Digital Printing, Offset, SPK, & Finance     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
const runMigrations = async () => {
    try {
        console.log('🚀 Checking database integrity & migrations...');
        const db = await getActivePool();

        if (currentDbType === 'sqlite') {
            await ensureUnifiedTablesSQLite(db);
            await patchUnifiedColumnsSQLite(db);
        } else {
            await ensureUnifiedTablesMySQL(db);
        }

        console.log('✅ Database unified & locked!');
    } catch (error) {
        console.error('❌ Migration Error:', error.message);
    }
};

/**
 * STRUKTUR TABEL UNTUK SQLITE (STANDALONE)
 */
async function ensureUnifiedTablesSQLite(db) {
    const schemas = [
        // 1. CORE MODULE
        `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, username TEXT UNIQUE, password TEXT, role TEXT, is_active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT, phone TEXT, address TEXT, type TEXT DEFAULT 'walkin', company TEXT, total_trx INTEGER DEFAULT 0, total_spend INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT, type TEXT, emoji TEXT)`,
        `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT, category_id TEXT, buy_price INTEGER DEFAULT 0, sell_price INTEGER DEFAULT 0, stock INTEGER DEFAULT 0, min_stock INTEGER DEFAULT 0, unit TEXT DEFAULT 'pcs', emoji TEXT, image TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
        
        // 2. TRANSACTION & FINANCE
        `CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, invoice_no TEXT UNIQUE, date DATETIME, customer_id TEXT, customer_name TEXT, user_id TEXT, user_name TEXT, type TEXT, subtotal INTEGER, discount INTEGER, total INTEGER, paid INTEGER, change_amount INTEGER, payment_type TEXT, tax_amount INTEGER DEFAULT 0, status TEXT DEFAULT 'unpaid', notes TEXT, customer_wa TEXT)`,
        `CREATE TABLE IF NOT EXISTS transaction_details (id TEXT PRIMARY KEY, transaction_id TEXT, product_id TEXT, name TEXT, qty INTEGER, price INTEGER, subtotal INTEGER, discount INTEGER)`,
        `CREATE TABLE IF NOT EXISTS cash_flow (id TEXT PRIMARY KEY, date DATE, type TEXT, category TEXT, amount INTEGER, description TEXT, reference_id TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        
        // 3. DIGITAL PRINTING (TASK-BASED)
        `CREATE TABLE IF NOT EXISTS dp_tasks (
            id TEXT PRIMARY KEY, status TEXT DEFAULT 'menunggu_desain', 
            customerName TEXT, customerId TEXT, title TEXT, 
            material_id TEXT, material_name TEXT, 
            dimensions_w REAL DEFAULT 0, dimensions_h REAL DEFAULT 0, 
            material_price REAL DEFAULT 0, design_price REAL DEFAULT 0, 
            priority TEXT DEFAULT 'normal', pesan_desainer TEXT, 
            type TEXT DEFAULT 'digital', qty INTEGER DEFAULT 1, 
            dp_amount REAL DEFAULT 0, is_paid INTEGER DEFAULT 0, 
            file_url TEXT, designer_id TEXT, designer_name TEXT, 
            operator_id TEXT, operator_name TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // 4. PRINTING (MULTI-ITEM ARCHITECTURE)
        `CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, order_number TEXT UNIQUE, customer_id TEXT, customer_name TEXT, user_id TEXT, total_harga INTEGER, status_pembayaran TEXT DEFAULT 'belum_bayar', dp_amount INTEGER, remaining INTEGER, metode_pembayaran TEXT, deadline DATE, catatan TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT, layanan TEXT, nama_item TEXT, material_id TEXT, ukuran_p REAL, ukuran_l REAL, luas_total REAL, quantity INTEGER, harga_satuan INTEGER, subtotal INTEGER, file_desain TEXT, catatan TEXT)`,
        `CREATE TABLE IF NOT EXISTS materials (id TEXT PRIMARY KEY, barcode TEXT, nama_bahan TEXT, kategori TEXT, satuan TEXT, harga_modal INTEGER DEFAULT 0, harga_jual INTEGER DEFAULT 0, stok_saat_ini REAL DEFAULT 0, stok_minimum REAL DEFAULT 0, is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS design_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, order_item_id TEXT, technician_id TEXT, start_time DATETIME, end_time DATETIME, total_durasi_menit INTEGER, tarif_per_jam INTEGER DEFAULT 50000, total_biaya_desain INTEGER, catatan TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS production_status (id INTEGER PRIMARY KEY AUTOINCREMENT, order_item_id TEXT UNIQUE, status TEXT DEFAULT 'menunggu', catatan_teknis TEXT, link_file_desain TEXT, foto_sebelum TEXT, foto_sesudah TEXT, operator_id TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        
        // 5. OFFSET PRINTING
        `CREATE TABLE IF NOT EXISTS offset_products (id TEXT PRIMARY KEY, nama_produk TEXT, deskripsi_singkat TEXT, harga_base REAL DEFAULT 0, satuan TEXT, is_best_seller INTEGER DEFAULT 0, image_url TEXT)`,
        `CREATE TABLE IF NOT EXISTS offset_orders (id TEXT PRIMARY KEY, order_number TEXT UNIQUE, product_id TEXT, customer_id TEXT, qty INTEGER DEFAULT 1, spesifikasi_json TEXT, total_estimasi_produksi REAL DEFAULT 0, total_biaya_desain REAL DEFAULT 0, grand_total REAL DEFAULT 0, status_order TEXT DEFAULT 'Pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS design_sessions (id TEXT PRIMARY KEY, technician_id TEXT, order_id TEXT, start_time DATETIME, end_time DATETIME, current_duration INTEGER DEFAULT 0, hourly_rate REAL DEFAULT 50000, status TEXT DEFAULT 'Running')`,
        
        // 6. SPK WORKFLOW
        `CREATE TABLE IF NOT EXISTS spk (id TEXT PRIMARY KEY, spk_number TEXT UNIQUE, customer_id TEXT, customer_name TEXT, product_name TEXT, product_qty INTEGER, product_unit TEXT, total_biaya REAL, dp_amount REAL, sisa_tagihan REAL, status TEXT DEFAULT 'Menunggu Antrian', priority TEXT DEFAULT 'Normal', assigned_to TEXT, deadline DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS spk_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, spk_id TEXT, user_id TEXT, action TEXT, description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS spk_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, spk_id TEXT, payment_type TEXT, method TEXT, amount REAL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        
        // 7. SYSTEM & CONFIG
        `CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE, value TEXT)`,
        `CREATE TABLE IF NOT EXISTS wa_config (id INTEGER PRIMARY KEY AUTOINCREMENT, config_key TEXT UNIQUE, config_value TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS activity_log (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, user_name TEXT, action TEXT, target TEXT, ip_address TEXT, detail TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`
    ];

    for (const sql of schemas) {
        await db.exec(sql);
    }
}

/**
 * AUTO-PATCH KOLOM UNTUK SQLITE
 */
async function patchUnifiedColumnsSQLite(db) {
    const patches = [
        { table: 'customers', columns: ['total_trx', 'total_spend'] },
        { table: 'transactions', columns: ['customer_wa', 'tax_amount', 'notes'] },
        { table: 'dp_tasks', columns: ['customerName', 'customerId', 'dimensions_w', 'dimensions_h', 'dp_amount', 'pesan_desainer'] },
        { table: 'materials', columns: ['is_active', 'harga_modal', 'harga_jual'] }
    ];

    for (const patch of patches) {
        const tableInfo = await db.all(`PRAGMA table_info(${patch.table})`);
        const existing = tableInfo.map(c => c.name);
        for (const col of patch.columns) {
            if (!existing.includes(col)) {
                console.log(`➕ Patching ${patch.table}: Adding ${col}...`);
                const type = col.includes('amount') || col.includes('price') || col.includes('total') ? 'REAL DEFAULT 0' : 'TEXT DEFAULT NULL';
                await db.exec(`ALTER TABLE ${patch.table} ADD COLUMN ${col} ${type}`);
            }
        }
    }
}

/**
 * STRUKTUR TABEL UNTUK MYSQL (PRODUCTION)
 */
async function ensureUnifiedTablesMySQL(db) {
    // MySQL logic with InnoDB support
    await db.query(`
        CREATE TABLE IF NOT EXISTS dp_tasks (
            id VARCHAR(50) PRIMARY KEY, status VARCHAR(50) DEFAULT 'menunggu_desain',
            customerName VARCHAR(100), customerId VARCHAR(50), title VARCHAR(200),
            material_id VARCHAR(50), material_name VARCHAR(100),
            dimensions_w DECIMAL(10,2) DEFAULT 0, dimensions_h DECIMAL(10,2) DEFAULT 0,
            material_price DECIMAL(15,2) DEFAULT 0, design_price DECIMAL(15,2) DEFAULT 0,
            priority VARCHAR(20) DEFAULT 'normal', pesan_desainer TEXT,
            type VARCHAR(50) DEFAULT 'digital', qty INT DEFAULT 1,
            dp_amount DECIMAL(15,2) DEFAULT 0, is_paid TINYINT(1) DEFAULT 0,
            designer_id VARCHAR(50), designer_name VARCHAR(100),
            operator_id VARCHAR(50), operator_name VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);
    
    // Add other critical MySQL schemas as needed...
}

module.exports = { runMigrations };
