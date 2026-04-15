const { initSqlite } = require('../config/database');

const initSchema = async () => {
    try {
        const db = await initSqlite();
        console.log('--- Initializing SQLite Schema ---');

        // 1. Users
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT CHECK(role IN ('admin', 'kasir', 'operator', 'teknisi', 'desainer')) NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Categories
        await db.exec(`
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT CHECK(type IN ('atk', 'fotocopy_supply', 'percetakan_supply', 'sparepart')) NOT NULL,
                emoji TEXT
            )
        `);

        // 3. Products
        await db.exec(`
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                category_id TEXT,
                buy_price INTEGER NOT NULL DEFAULT 0,
                sell_price INTEGER NOT NULL DEFAULT 0,
                stock INTEGER NOT NULL DEFAULT 0,
                min_stock INTEGER NOT NULL DEFAULT 0,
                unit TEXT DEFAULT 'pcs',
                emoji TEXT,
                image TEXT DEFAULT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
            )
        `);

        // 4. Customers
        await db.exec(`
            CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT,
                address TEXT,
                type TEXT DEFAULT 'walkin',
                company TEXT,
                total_trx INTEGER DEFAULT 0,
                total_spend INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 5. Transactions
        await db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                invoice_no TEXT UNIQUE NOT NULL,
                date DATETIME NOT NULL,
                customer_id TEXT,
                customer_name TEXT DEFAULT 'Umum',
                user_id TEXT,
                user_name TEXT,
                type TEXT DEFAULT 'sale',
                subtotal INTEGER NOT NULL,
                discount INTEGER DEFAULT 0,
                total INTEGER NOT NULL,
                paid INTEGER DEFAULT 0,
                change_amount INTEGER DEFAULT 0,
                payment_type TEXT DEFAULT 'tunai',
                status TEXT DEFAULT 'unpaid',
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // 6. Transaction Details
        await db.exec(`
            CREATE TABLE IF NOT EXISTS transaction_details (
                id TEXT PRIMARY KEY,
                transaction_id TEXT NOT NULL,
                product_id TEXT,
                name TEXT NOT NULL,
                qty INTEGER NOT NULL,
                price INTEGER NOT NULL,
                subtotal INTEGER NOT NULL,
                discount INTEGER DEFAULT 0,
                FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
            )
        `);

        // 7. Print Orders
        await db.exec(`
            CREATE TABLE IF NOT EXISTS print_orders (
                id TEXT PRIMARY KEY,
                order_no TEXT UNIQUE NOT NULL,
                customer_id TEXT,
                customer_name TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                specs TEXT,
                qty INTEGER NOT NULL,
                unit TEXT DEFAULT 'pcs',
                total_price INTEGER NOT NULL,
                dp_amount INTEGER DEFAULT 0,
                remaining INTEGER DEFAULT 0,
                shipping_cost INTEGER DEFAULT 0,
                deadline DATE,
                status TEXT DEFAULT 'pending',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
            )
        `);

        // 8. Service Orders
        await db.exec(`
            CREATE TABLE IF NOT EXISTS service_orders (
                id TEXT PRIMARY KEY,
                service_no TEXT UNIQUE NOT NULL,
                customer_id TEXT,
                customer_name TEXT NOT NULL,
                phone TEXT,
                machine_info TEXT NOT NULL,
                serial_no TEXT,
                complaint TEXT NOT NULL,
                condition_physic TEXT,
                diagnosis TEXT,
                labor_cost INTEGER DEFAULT 0,
                total_cost INTEGER DEFAULT 0,
                status TEXT DEFAULT 'diterima',
                technician_id TEXT,
                warranty_end DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
                FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // 9. Service Spareparts
        await db.exec(`
            CREATE TABLE IF NOT EXISTS service_spareparts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_order_id TEXT NOT NULL,
                name TEXT NOT NULL,
                qty INTEGER NOT NULL,
                price INTEGER NOT NULL,
                FOREIGN KEY (service_order_id) REFERENCES service_orders(id) ON DELETE CASCADE
            )
        `);

        // 10. Suppliers
        await db.exec(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                contact_person TEXT,
                phone TEXT,
                address TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 11. Purchases
        await db.exec(`
            CREATE TABLE IF NOT EXISTS purchases (
                id TEXT PRIMARY KEY,
                invoice_no TEXT UNIQUE NOT NULL,
                supplier_id TEXT,
                supplier_name TEXT NOT NULL DEFAULT 'Umum',
                date DATETIME NOT NULL,
                total_amount INTEGER NOT NULL DEFAULT 0,
                payment_status TEXT CHECK(payment_status IN ('lunas','hutang')) DEFAULT 'lunas',
                notes TEXT,
                user_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
            )
        `);

        // 12. Purchase Items
        await db.exec(`
            CREATE TABLE IF NOT EXISTS purchase_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                purchase_id TEXT NOT NULL,
                item_type TEXT CHECK(item_type IN ('product','material')) NOT NULL,
                item_id TEXT NOT NULL,
                item_name TEXT NOT NULL,
                qty REAL NOT NULL,
                unit_cost INTEGER NOT NULL DEFAULT 0,
                subtotal INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
            )
        `);

        // 13. Materials
        await db.exec(`
            CREATE TABLE IF NOT EXISTS materials (
                id TEXT PRIMARY KEY,
                barcode TEXT UNIQUE,
                nama_bahan TEXT NOT NULL,
                kategori TEXT NOT NULL DEFAULT 'digital',
                satuan TEXT NOT NULL DEFAULT 'pcs',
                stok_saat_ini REAL DEFAULT 0,
                stok_minimum REAL DEFAULT 0,
                lokasi_rak TEXT,
                supplier_id TEXT,
                harga_modal INTEGER DEFAULT 0,
                harga_jual INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                keterangan TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
            )
        `);

        // 14. Cash Flow
        await db.exec(`
            CREATE TABLE IF NOT EXISTS cash_flow (
                id TEXT PRIMARY KEY,
                date DATE NOT NULL,
                type TEXT CHECK(type IN ('in', 'out')) NOT NULL,
                category TEXT NOT NULL,
                amount INTEGER NOT NULL,
                description TEXT,
                reference_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 15. Stock Movements
        await db.exec(`
            CREATE TABLE IF NOT EXISTS stock_movements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id TEXT NOT NULL,
                type TEXT CHECK(type IN ('in', 'out', 'adjust')) NOT NULL,
                qty INTEGER NOT NULL,
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                reference TEXT,
                notes TEXT,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);

        // 16. Material Movements
        await db.exec(`
            CREATE TABLE IF NOT EXISTS material_movements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                material_id TEXT NOT NULL,
                tipe TEXT CHECK(tipe IN ('masuk', 'keluar', 'penyesuaian')) NOT NULL,
                jumlah REAL NOT NULL,
                satuan TEXT NOT NULL,
                referensi TEXT,
                catatan TEXT,
                user_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // 17. Activity Log
        await db.exec(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                user_name TEXT,
                action TEXT NOT NULL,
                target TEXT,
                ip_address TEXT,
                detail TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // 18. Settings
        await db.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT
            )
        `);

        // 19. Fotocopy Prices Master
        await db.exec(`
            CREATE TABLE IF NOT EXISTS fotocopy_prices (
                id TEXT PRIMARY KEY,
                paper TEXT CHECK(paper IN ('HVS A4', 'HVS F4', 'HVS A3')) NOT NULL,
                color TEXT CHECK(color IN ('bw', 'color')) NOT NULL,
                side TEXT CHECK(side IN ('1', '2')) NOT NULL,
                price INTEGER NOT NULL,
                label TEXT NOT NULL
            )
        `);

        // 20. Handovers
        await db.exec(`
            CREATE TABLE IF NOT EXISTS handovers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id TEXT NOT NULL,
                invoice_no TEXT,
                customer_name TEXT,
                receiver_name TEXT,
                receiver_phone TEXT,
                notes TEXT,
                handover_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                handover_by TEXT,
                FOREIGN KEY (handover_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // 21. SPK
        await db.exec(`
            CREATE TABLE IF NOT EXISTS spk (
                id TEXT PRIMARY KEY,
                spk_number TEXT UNIQUE NOT NULL,
                customer_id TEXT,
                customer_name TEXT NOT NULL,
                customer_phone TEXT,
                customer_company TEXT,
                product_name TEXT NOT NULL,
                product_qty INTEGER NOT NULL DEFAULT 1,
                product_unit TEXT NOT NULL DEFAULT 'pcs',
                specs_material TEXT,
                specs_finishing TEXT,
                specs_notes TEXT,
                biaya_cetak REAL NOT NULL DEFAULT 0,
                biaya_material REAL NOT NULL DEFAULT 0,
                biaya_finishing REAL NOT NULL DEFAULT 0,
                biaya_desain REAL NOT NULL DEFAULT 0,
                biaya_lainnya REAL NOT NULL DEFAULT 0,
                total_biaya REAL NOT NULL DEFAULT 0,
                dp_amount REAL NOT NULL DEFAULT 0,
                sisa_tagihan REAL NOT NULL DEFAULT 0,
                status TEXT DEFAULT 'Menunggu Antrian',
                priority TEXT DEFAULT 'Normal',
                assigned_to TEXT,
                deadline DATETIME,
                completed_at DATETIME,
                created_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                offset_order_id TEXT,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
                FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // 22. SPK Logs
        await db.exec(`
            CREATE TABLE IF NOT EXISTS spk_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                spk_id TEXT NOT NULL,
                user_id TEXT,
                action TEXT NOT NULL,
                description TEXT,
                old_value TEXT,
                new_value TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (spk_id) REFERENCES spk(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // 23. SPK Payments
        await db.exec(`
            CREATE TABLE IF NOT EXISTS spk_payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                spk_id TEXT NOT NULL,
                payment_type TEXT DEFAULT 'Pelunasan',
                method TEXT DEFAULT 'Tunai',
                amount REAL NOT NULL DEFAULT 0,
                bank_ref TEXT,
                status TEXT DEFAULT 'Berhasil',
                paid_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (spk_id) REFERENCES spk(id) ON DELETE CASCADE,
                FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // 24. SPK Handovers
        await db.exec(`
            CREATE TABLE IF NOT EXISTS spk_handovers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                spk_id TEXT NOT NULL,
                received_by_name TEXT NOT NULL,
                received_by_phone TEXT,
                signature_data TEXT,
                photo_evidence TEXT,
                notes TEXT,
                handed_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (spk_id) REFERENCES spk(id) ON DELETE CASCADE,
                FOREIGN KEY (handed_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // 25. WA Config
        await db.exec(`
            CREATE TABLE IF NOT EXISTS wa_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                config_key TEXT UNIQUE NOT NULL,
                config_value TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Triggers for updated_at (Not natively supported with DEFAULT, so we use triggers)
        const tablesWithUpdatedAt = ['products', 'print_orders', 'service_orders', 'purchases', 'materials', 'spk', 'wa_config'];
        for (const table of tablesWithUpdatedAt) {
            await db.exec(`
                CREATE TRIGGER IF NOT EXISTS trg_update_at_${table}
                AFTER UPDATE ON ${table}
                BEGIN
                    UPDATE ${table} SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id ${table === 'wa_config' || table === 'service_spareparts' ? 'OR id = OLD.id' : ''};
                END
            `);
        }

        // Add some default data (WA Config)
        const row = await db.get('SELECT COUNT(*) as count FROM wa_config');
        if (row.count === 0) {
            await db.exec(`
                INSERT INTO wa_config (config_key, config_value) VALUES
                ('api_url', 'https://api.fonnte.com/send'),
                ('api_token', ''),
                ('template_spk_selesai', 'Halo {nama}, pesanan *{produk}* (SPK: {spk_number}) Anda sudah selesai dan siap diambil. Sisa tagihan: *Rp {sisa_tagihan}*. Terima kasih! 🙏'),
                ('template_invoice', 'Halo {nama}, berikut invoice untuk pesanan Anda:\\n\\nNo. SPK: {spk_number}\\nProduk: {produk}\\nTotal: Rp {total}\\nDP: Rp {dp}\\nSisa: Rp {sisa}\\n\\nTerima kasih! 🧾'),
                ('auto_notify_on_complete', 'true')
            `);
        }

        console.log('✅ SQLite Schema Initialized Successfully (25 Tables)');
        process.exit(0);
    } catch (error) {
        console.error('❌ Gagal Inisialisasi SQLite:', error);
        process.exit(1);
    }
};

initSchema();
