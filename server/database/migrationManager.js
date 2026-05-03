const { getActivePool, currentDbType, ensureMySQLDatabaseExists } = require('../config/database');

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║         PUSAT KENDALI DATABASE (DATABASE LOCK) - UNIFIED PRO MAX         ║
 * ║    Menyatukan Seluruh Modul: Digital Printing, Offset, SPK, & Finance     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
const runMigrations = async () => {
    try {
        console.log('🚀 Checking database integrity & migrations...');

        // 0. Auto-Create MySQL Database if missing
        if (currentDbType === 'mysql') {
            await ensureMySQLDatabaseExists();
        }

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
            operator_id TEXT, operator_name TEXT, denda_batal REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // 4. PRINTING (MULTI-ITEM ARCHITECTURE)
        `CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, order_number TEXT UNIQUE, customer_id TEXT, customer_name TEXT, user_id TEXT, total_harga INTEGER, status_pembayaran TEXT DEFAULT 'belum_bayar', dp_amount INTEGER, remaining INTEGER, metode_pembayaran TEXT, deadline DATE, catatan TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT, layanan TEXT, nama_item TEXT, material_id TEXT, ukuran_p REAL, ukuran_l REAL, luas_total REAL, quantity INTEGER, harga_satuan INTEGER, subtotal INTEGER, file_desain TEXT, catatan TEXT)`,
        `CREATE TABLE IF NOT EXISTS materials (id TEXT PRIMARY KEY, barcode TEXT, nama_bahan TEXT, kategori TEXT, satuan TEXT, harga_modal INTEGER DEFAULT 0, harga_jual INTEGER DEFAULT 0, stok_saat_ini REAL DEFAULT 0, stok_minimum REAL DEFAULT 0, is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS design_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, order_item_id TEXT, technician_id TEXT, start_time DATETIME, end_time DATETIME, total_durasi_menit INTEGER, tarif_per_jam INTEGER DEFAULT 50000, total_biaya_desain INTEGER, catatan TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS production_status (id INTEGER PRIMARY KEY AUTOINCREMENT, order_item_id TEXT UNIQUE, status TEXT DEFAULT 'menunggu', catatan_teknis TEXT, link_file_desain TEXT, foto_sebelum TEXT, foto_sesudah TEXT, operator_id TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS print_orders (
            id TEXT PRIMARY KEY, order_no TEXT UNIQUE, customer_id TEXT, customer_name TEXT, 
            type TEXT, description TEXT, specs TEXT, qty INTEGER, unit TEXT, 
            total_price REAL DEFAULT 0, dp_amount REAL DEFAULT 0, remaining REAL DEFAULT 0, 
            shipping_cost REAL DEFAULT 0, deadline DATETIME, status TEXT DEFAULT 'pending', notes TEXT, 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS digital_printing (id TEXT PRIMARY KEY, name TEXT, price REAL DEFAULT 0, unit TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS offset_printing (id TEXT PRIMARY KEY, name TEXT, price REAL DEFAULT 0, unit TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        
        // 5. OFFSET PRINTING
        `CREATE TABLE IF NOT EXISTS offset_products (id TEXT PRIMARY KEY, nama_produk TEXT, deskripsi_singkat TEXT, harga_base REAL DEFAULT 0, satuan TEXT, is_best_seller INTEGER DEFAULT 0, image_url TEXT)`,
        `CREATE TABLE IF NOT EXISTS offset_orders (id TEXT PRIMARY KEY, order_number TEXT UNIQUE, product_id TEXT, customer_id TEXT, qty INTEGER DEFAULT 1, spesifikasi_json TEXT, total_estimasi_produksi REAL DEFAULT 0, total_biaya_desain REAL DEFAULT 0, grand_total REAL DEFAULT 0, status_order TEXT DEFAULT 'Pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS design_sessions (id TEXT PRIMARY KEY, technician_id TEXT, order_id TEXT, start_time DATETIME, end_time DATETIME, current_duration INTEGER DEFAULT 0, hourly_rate REAL DEFAULT 50000, status TEXT DEFAULT 'Running')`,
        
        // 6. SPK WORKFLOW
        `CREATE TABLE IF NOT EXISTS spk (
            id TEXT PRIMARY KEY, spk_number TEXT UNIQUE, customer_id TEXT, customer_name TEXT, 
            customer_phone TEXT, customer_company TEXT,
            product_name TEXT, product_qty INTEGER, product_unit TEXT, kategori TEXT,
            specs_material TEXT, specs_finishing TEXT, specs_notes TEXT,
            biaya_cetak REAL DEFAULT 0, biaya_material REAL DEFAULT 0, biaya_finishing REAL DEFAULT 0, 
            biaya_desain REAL DEFAULT 0, biaya_lainnya REAL DEFAULT 0,
            total_biaya REAL, dp_amount REAL, sisa_tagihan REAL, 
            status TEXT DEFAULT 'Menunggu Antrian', priority TEXT DEFAULT 'Normal', 
            assigned_to TEXT, created_by TEXT, deadline DATETIME, completed_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS spk_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, spk_id TEXT, user_id TEXT, action TEXT, description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS spk_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, spk_id TEXT, payment_type TEXT, method TEXT, amount REAL, bank_ref TEXT, paid_by TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        
        // 7. SYSTEM & CONFIG
        `CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE, value TEXT)`,
        `CREATE TABLE IF NOT EXISTS wa_config (id INTEGER PRIMARY KEY AUTOINCREMENT, config_key TEXT UNIQUE, config_value TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS activity_log (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, user_name TEXT, action TEXT, target TEXT, ip_address TEXT, detail TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`,
 
        // 8. SERVICE MODULE (SERVICE_ORDERS)
        `CREATE TABLE IF NOT EXISTS service_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT, service_no TEXT UNIQUE, customer_id TEXT, 
            customer_name TEXT, phone TEXT, machine_info TEXT, serial_no TEXT, 
            complaint TEXT, condition_physic TEXT, diagnosis TEXT, 
            labor_cost REAL DEFAULT 0, dp_amount REAL DEFAULT 0, total_cost REAL DEFAULT 0, 
            status TEXT DEFAULT 'diterima', technician_id TEXT, warranty_end DATETIME, 
            photo TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS service_spareparts (
            id INTEGER PRIMARY KEY AUTOINCREMENT, service_order_id INTEGER, 
            name TEXT, qty INTEGER DEFAULT 1, price REAL DEFAULT 0, product_id TEXT
        )`,

        // 9. HR & PAYROLL MODULE
        `CREATE TABLE IF NOT EXISTS employees (
            id TEXT PRIMARY KEY, user_id TEXT, name TEXT, nik TEXT, phone TEXT, 
            address TEXT, position TEXT, salary_type TEXT DEFAULT 'monthly', 
            base_salary REAL DEFAULT 0, hourly_rate REAL DEFAULT 0, is_active INTEGER DEFAULT 1, 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id TEXT, date DATE, 
            clock_in DATETIME, clock_out DATETIME, work_hours REAL DEFAULT 0, 
            notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS employee_loans (
            id TEXT PRIMARY KEY, employee_id TEXT, amount REAL, remaining_amount REAL, 
            date DATE, description TEXT, status TEXT DEFAULT 'unpaid', 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS salaries (
            id TEXT PRIMARY KEY, employee_id TEXT, period_month INTEGER, period_year INTEGER, 
            base_processing_salary REAL DEFAULT 0, attendance_bonus REAL DEFAULT 0, 
            overtime_pay REAL DEFAULT 0, loan_deduction REAL DEFAULT 0, 
            other_deductions REAL DEFAULT 0, net_salary REAL DEFAULT 0, 
            status TEXT DEFAULT 'draft', paid_at DATETIME, 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // 10. DESIGNER ASSIGNMENTS
        `CREATE TABLE IF NOT EXISTS design_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT, designer_id TEXT, 
            status TEXT DEFAULT 'ditugaskan', started_at DATETIME, 
            finished_at DATETIME, assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
            catatan TEXT, file_hasil_desain TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS suppliers (
            id TEXT PRIMARY KEY, name TEXT, contact_person TEXT, phone TEXT, 
            address TEXT, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS purchases (
            id TEXT PRIMARY KEY, invoice_no TEXT UNIQUE, supplier_id TEXT, supplier_name TEXT, 
            date DATETIME, total_amount REAL DEFAULT 0, payment_status TEXT DEFAULT 'lunas', 
            notes TEXT, user_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS purchase_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT, purchase_id TEXT, item_type TEXT, 
            item_id TEXT, item_name TEXT, qty REAL DEFAULT 0, unit_cost REAL DEFAULT 0, 
            subtotal REAL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS stock_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT, product_id TEXT, type TEXT, 
            qty REAL, reference TEXT, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS material_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT, material_id TEXT, tipe TEXT, 
            jumlah REAL, satuan TEXT, referensi TEXT, catatan TEXT, 
            user_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS spk_handovers (
            id INTEGER PRIMARY KEY AUTOINCREMENT, spk_id TEXT, handover_by TEXT, 
            received_by TEXT, condition TEXT, photo TEXT, 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    ];
 
    for (const sql of schemas) {
        try {
            const tableName = sql.match(/IF NOT EXISTS (\w+)/)?.[1];
            await db.exec(sql);
            if (tableName) console.log(`✅ Table checked/created: ${tableName}`);
        } catch (e) {
            console.error(`❌ SQL Error during table creation: ${e.message}`);
        }
    }
}
 
/**
 * AUTO-PATCH KOLOM UNTUK SQLITE
 */
async function patchUnifiedColumnsSQLite(db) {
    const patches = [
        { table: 'customers', columns: ['total_trx', 'total_spend'] },
        { table: 'transactions', columns: ['customer_wa', 'tax_amount', 'notes'] },
        { table: 'dp_tasks', columns: ['customerName', 'customerId', 'dimensions_w', 'dimensions_h', 'dp_amount', 'pesan_desainer', 'denda_batal'] },
        { table: 'materials', columns: ['is_active', 'harga_modal', 'harga_jual'] },
        { table: 'service_orders', columns: ['dp_amount'] },
        { table: 'spk', columns: ['kategori', 'customer_phone', 'customer_company', 'specs_material', 'specs_finishing', 'specs_notes', 'biaya_cetak', 'biaya_material', 'biaya_finishing', 'biaya_desain', 'biaya_lainnya', 'created_by', 'completed_at'] },
        { table: 'spk_payments', columns: ['bank_ref', 'paid_by'] }
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
    const schemas = [
        `CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), username VARCHAR(50) UNIQUE, password VARCHAR(255), role VARCHAR(50), is_active TINYINT(1) DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS customers (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), phone VARCHAR(20), address TEXT, type VARCHAR(50) DEFAULT 'walkin', company VARCHAR(100), total_trx INT DEFAULT 0, total_spend DECIMAL(15,2) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), type VARCHAR(50), emoji VARCHAR(10)) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, code VARCHAR(50) UNIQUE, name VARCHAR(200), category_id VARCHAR(50), buy_price DECIMAL(15,2) DEFAULT 0, sell_price DECIMAL(15,2) DEFAULT 0, stock DECIMAL(10,2) DEFAULT 0, min_stock DECIMAL(10,2) DEFAULT 0, unit VARCHAR(20) DEFAULT 'pcs', emoji VARCHAR(10), image TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        
        `CREATE TABLE IF NOT EXISTS transactions (id VARCHAR(50) PRIMARY KEY, invoice_no VARCHAR(50) UNIQUE, date DATETIME, customer_id VARCHAR(50), customer_name VARCHAR(100), user_id VARCHAR(50), user_name VARCHAR(100), type VARCHAR(50), subtotal DECIMAL(15,2), discount DECIMAL(15,2), total DECIMAL(15,2), paid DECIMAL(15,2), change_amount DECIMAL(15,2), payment_type VARCHAR(50), tax_amount DECIMAL(15,2) DEFAULT 0, status VARCHAR(50) DEFAULT 'unpaid', notes TEXT, customer_wa VARCHAR(20)) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS transaction_details (id VARCHAR(50) PRIMARY KEY, transaction_id VARCHAR(50), product_id VARCHAR(50), name VARCHAR(200), qty DECIMAL(10,2), price DECIMAL(15,2), subtotal DECIMAL(15,2), discount DECIMAL(15,2)) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS cash_flow (id VARCHAR(50) PRIMARY KEY, date DATE, type VARCHAR(20), category VARCHAR(100), amount DECIMAL(15,2), description TEXT, reference_id VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        
        `CREATE TABLE IF NOT EXISTS dp_tasks (
            id VARCHAR(50) PRIMARY KEY, status VARCHAR(50) DEFAULT 'menunggu_desain', 
            customerName VARCHAR(100), customerId VARCHAR(50), title VARCHAR(200), 
            material_id VARCHAR(50), material_name VARCHAR(100), 
            dimensions_w DECIMAL(10,2) DEFAULT 0, dimensions_h DECIMAL(10,2) DEFAULT 0, 
            material_price DECIMAL(15,2) DEFAULT 0, design_price DECIMAL(15,2) DEFAULT 0, 
            priority VARCHAR(20) DEFAULT 'normal', pesan_desainer TEXT, 
            type VARCHAR(50) DEFAULT 'digital', qty INT DEFAULT 1, 
            dp_amount DECIMAL(15,2) DEFAULT 0, is_paid TINYINT(1) DEFAULT 0, 
            file_url TEXT, designer_id VARCHAR(50), designer_name VARCHAR(100), 
            operator_id VARCHAR(50), operator_name VARCHAR(100), denda_batal DECIMAL(15,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB`,
        
        `CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, order_number VARCHAR(50) UNIQUE, customer_id VARCHAR(50), customer_name VARCHAR(100), user_id VARCHAR(50), total_harga DECIMAL(15,2), status_pembayaran VARCHAR(50) DEFAULT 'belum_bayar', dp_amount DECIMAL(15,2), remaining DECIMAL(15,2), metode_pembayaran VARCHAR(50), deadline DATE, catatan TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS order_items (id VARCHAR(50) PRIMARY KEY, order_id VARCHAR(50), layanan VARCHAR(100), nama_item VARCHAR(200), material_id VARCHAR(50), ukuran_p DECIMAL(10,2), ukuran_l DECIMAL(10,2), luas_total DECIMAL(10,2), quantity INT, harga_satuan DECIMAL(15,2), subtotal DECIMAL(15,2), file_desain TEXT, catatan TEXT) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS materials (id VARCHAR(50) PRIMARY KEY, barcode VARCHAR(50), nama_bahan VARCHAR(200), kategori VARCHAR(100), satuan VARCHAR(20), harga_modal DECIMAL(15,2) DEFAULT 0, harga_jual DECIMAL(15,2) DEFAULT 0, stok_saat_ini DECIMAL(10,2) DEFAULT 0, stok_minimum DECIMAL(10,2) DEFAULT 0, is_active TINYINT(1) DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS design_logs (id INT AUTO_INCREMENT PRIMARY KEY, order_item_id VARCHAR(50), technician_id VARCHAR(50), start_time DATETIME, end_time DATETIME, total_durasi_menit INT, tarif_per_jam DECIMAL(15,2) DEFAULT 50000, total_biaya_desain DECIMAL(15,2), catatan TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS production_status (id INT AUTO_INCREMENT PRIMARY KEY, order_item_id VARCHAR(50) UNIQUE, status VARCHAR(50) DEFAULT 'menunggu', catatan_teknis TEXT, link_file_desain TEXT, foto_sebelum TEXT, foto_sesudah TEXT, operator_id VARCHAR(50), updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        
        `CREATE TABLE IF NOT EXISTS spk (
            id VARCHAR(50) PRIMARY KEY, spk_number VARCHAR(50) UNIQUE, customer_id VARCHAR(50), customer_name VARCHAR(100), 
            customer_phone VARCHAR(20), customer_company VARCHAR(100),
            product_name VARCHAR(200), product_qty INT, product_unit VARCHAR(20), kategori VARCHAR(50),
            specs_material TEXT, specs_finishing TEXT, specs_notes TEXT,
            biaya_cetak DECIMAL(15,2) DEFAULT 0, biaya_material DECIMAL(15,2) DEFAULT 0, biaya_finishing DECIMAL(15,2) DEFAULT 0, 
            biaya_desain DECIMAL(15,2) DEFAULT 0, biaya_lainnya DECIMAL(15,2) DEFAULT 0,
            total_biaya DECIMAL(15,2), dp_amount DECIMAL(15,2), sisa_tagihan DECIMAL(15,2), 
            status VARCHAR(50) DEFAULT 'Menunggu Antrian', priority VARCHAR(20) DEFAULT 'Normal', 
            assigned_to VARCHAR(50), created_by VARCHAR(50), deadline DATETIME, completed_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS spk_payments (id INT AUTO_INCREMENT PRIMARY KEY, spk_id VARCHAR(50), payment_type VARCHAR(50), method VARCHAR(50), amount DECIMAL(15,2), bank_ref VARCHAR(100), paid_by VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        
        `CREATE TABLE IF NOT EXISTS settings (id INT AUTO_INCREMENT PRIMARY KEY, \`key\` VARCHAR(100) UNIQUE, value TEXT) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS wa_config (id INT AUTO_INCREMENT PRIMARY KEY, config_key VARCHAR(100) UNIQUE, config_value TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS activity_log (id INT AUTO_INCREMENT PRIMARY KEY, user_id VARCHAR(50), user_name VARCHAR(100), action VARCHAR(100), target VARCHAR(100), ip_address VARCHAR(45), detail TEXT, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        
        `CREATE TABLE IF NOT EXISTS service_orders (
            id INT AUTO_INCREMENT PRIMARY KEY, service_no VARCHAR(50) UNIQUE, customer_id VARCHAR(50), 
            customer_name VARCHAR(100), phone VARCHAR(20), machine_info TEXT, serial_no VARCHAR(100), 
            complaint TEXT, condition_physic TEXT, diagnosis TEXT, 
            labor_cost DECIMAL(15,2) DEFAULT 0, dp_amount DECIMAL(15,2) DEFAULT 0, total_cost DECIMAL(15,2) DEFAULT 0, 
            status VARCHAR(50) DEFAULT 'diterima', technician_id VARCHAR(50), warranty_end DATETIME, 
            photo TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS employees (
            id VARCHAR(50) PRIMARY KEY, user_id VARCHAR(50), name VARCHAR(100), nik VARCHAR(50), phone VARCHAR(20), 
            address TEXT, position VARCHAR(100), salary_type VARCHAR(50) DEFAULT 'monthly', 
            base_salary DECIMAL(15,2) DEFAULT 0, hourly_rate DECIMAL(15,2) DEFAULT 0, is_active TINYINT(1) DEFAULT 1, 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS salaries (
            id VARCHAR(50) PRIMARY KEY, employee_id VARCHAR(50), period_month INT, period_year INT, 
            base_processing_salary DECIMAL(15,2) DEFAULT 0, attendance_bonus DECIMAL(15,2) DEFAULT 0, 
            overtime_pay DECIMAL(15,2) DEFAULT 0, loan_deduction DECIMAL(15,2) DEFAULT 0, 
            other_deductions DECIMAL(15,2) DEFAULT 0, net_salary DECIMAL(15,2) DEFAULT 0, 
            status VARCHAR(50) DEFAULT 'draft', paid_at DATETIME, 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB`,
        
        `CREATE TABLE IF NOT EXISTS print_orders (
            id VARCHAR(50) PRIMARY KEY, order_no VARCHAR(50) UNIQUE, customer_id VARCHAR(50), customer_name VARCHAR(100), 
            type VARCHAR(50), description TEXT, specs TEXT, qty INT, unit VARCHAR(20), 
            total_price DECIMAL(15,2) DEFAULT 0, dp_amount DECIMAL(15,2) DEFAULT 0, remaining DECIMAL(15,2) DEFAULT 0, 
            shipping_cost DECIMAL(15,2) DEFAULT 0, deadline DATETIME, status VARCHAR(50) DEFAULT 'pending', notes TEXT, 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS digital_printing (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), price DECIMAL(15,2) DEFAULT 0, unit VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS offset_printing (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), price DECIMAL(15,2) DEFAULT 0, unit VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS offset_products (id VARCHAR(50) PRIMARY KEY, nama_produk VARCHAR(200), deskripsi_singkat TEXT, harga_base DECIMAL(15,2) DEFAULT 0, satuan VARCHAR(20), is_best_seller TINYINT(1) DEFAULT 0, image_url TEXT) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS offset_orders (id VARCHAR(50) PRIMARY KEY, order_number VARCHAR(50) UNIQUE, product_id VARCHAR(50), customer_id VARCHAR(50), qty INT DEFAULT 1, spesifikasi_json TEXT, total_estimasi_produksi DECIMAL(15,2) DEFAULT 0, total_biaya_desain DECIMAL(15,2) DEFAULT 0, grand_total DECIMAL(15,2) DEFAULT 0, status_order VARCHAR(50) DEFAULT 'Pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS design_sessions (id VARCHAR(50) PRIMARY KEY, technician_id VARCHAR(50), order_id VARCHAR(50), start_time DATETIME, end_time DATETIME, current_duration INT DEFAULT 0, hourly_rate DECIMAL(15,2) DEFAULT 50000, status VARCHAR(50) DEFAULT 'Running') ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS spk_logs (id INT AUTO_INCREMENT PRIMARY KEY, spk_id VARCHAR(50), user_id VARCHAR(50), action VARCHAR(100), description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS service_spareparts (id INT AUTO_INCREMENT PRIMARY KEY, service_order_id INT, name VARCHAR(200), qty INT DEFAULT 1, price DECIMAL(15,2) DEFAULT 0, product_id VARCHAR(50)) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS attendance (id INT AUTO_INCREMENT PRIMARY KEY, employee_id VARCHAR(50), date DATE, clock_in DATETIME, clock_out DATETIME, work_hours DECIMAL(5,2) DEFAULT 0, notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS employee_loans (id VARCHAR(50) PRIMARY KEY, employee_id VARCHAR(50), amount DECIMAL(15,2), remaining_amount DECIMAL(15,2), date DATE, description TEXT, status VARCHAR(50) DEFAULT 'unpaid', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS design_assignments (id INT AUTO_INCREMENT PRIMARY KEY, task_id VARCHAR(50), designer_id VARCHAR(50), status VARCHAR(50) DEFAULT 'ditugaskan', started_at DATETIME, finished_at DATETIME, assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, catatan TEXT, file_hasil_desain TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS suppliers (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), contact_person VARCHAR(100), phone VARCHAR(20), address TEXT, notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS purchases (id VARCHAR(50) PRIMARY KEY, invoice_no VARCHAR(50) UNIQUE, supplier_id VARCHAR(50), supplier_name VARCHAR(100), date DATETIME, total_amount DECIMAL(15,2) DEFAULT 0, payment_status VARCHAR(50) DEFAULT 'lunas', notes TEXT, user_id VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS purchase_items (id INT AUTO_INCREMENT PRIMARY KEY, purchase_id VARCHAR(50), item_type VARCHAR(50), item_id VARCHAR(50), item_name VARCHAR(200), qty DECIMAL(10,2) DEFAULT 0, unit_cost DECIMAL(15,2) DEFAULT 0, subtotal DECIMAL(15,2) DEFAULT 0) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS stock_movements (id INT AUTO_INCREMENT PRIMARY KEY, product_id VARCHAR(50), type VARCHAR(20), qty DECIMAL(10,2), reference VARCHAR(100), notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS material_movements (id INT AUTO_INCREMENT PRIMARY KEY, material_id VARCHAR(50), tipe VARCHAR(20), jumlah DECIMAL(10,2), satuan VARCHAR(20), referensi VARCHAR(100), catatan TEXT, user_id VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
        `CREATE TABLE IF NOT EXISTS spk_handovers (id INT AUTO_INCREMENT PRIMARY KEY, spk_id VARCHAR(50), handover_by VARCHAR(100), received_by VARCHAR(100), \`condition\` TEXT, photo TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`
    ];

    for (const sql of schemas) {
        try {
            await db.query(sql);
        } catch (e) {
            console.error(`❌ MySQL Migration Error on schema: ${e.message}`);
        }
    }

    // --- Seed Default Users (if empty) ---
    try {
        const [userRows] = await db.query('SELECT COUNT(*) as count FROM users');
        if (userRows[0].count === 0) {
            console.log('🌱 Seeding default users (Admin, Kasir, Desainer)...');
            const bcrypt = require('bcryptjs');
            const adminPass = await bcrypt.hash('admin123', 10);
            const kasirPass = await bcrypt.hash('kasir123', 10);
            const desainerPass = await bcrypt.hash('desainer123', 10);

            await db.query(`
                INSERT INTO users (id, name, username, password, role) VALUES 
                ('u1', 'Admin Utama', 'admin', ?, 'admin'),
                ('u2', 'Kasir Depan', 'kasir', ?, 'kasir'),
                ('u3', 'Desainer Pro', 'desainer', ?, 'desainer')
            `, [adminPass, kasirPass, desainerPass]);
            console.log('✅ Default users created successfully!');
        }
    } catch (e) {
        console.error(`❌ MySQL Seed Error: ${e.message}`);
    }
}

module.exports = { runMigrations };
