const { initSqlite } = require('../config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
    try {
        const db = await initSqlite();
        console.log('--- Seeding SQLite Data ---');

        // 1. Admin User
        const password = await bcrypt.hash('admin123', 10);
        await db.run(`
            INSERT OR IGNORE INTO users (id, name, username, password, role, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        `, ['admin-uuid', 'Administrator', 'admin', password, 'admin', 1]);

        // 2. Sample Categories
        const categories = [
            ['cat-1', 'ATK & Kertas', 'atk', '📝'],
            ['cat-2', 'Fotocopy', 'fotocopy_supply', '📠'],
            ['cat-3', 'Percetakan', 'percetakan_supply', '🖨️'],
            ['cat-4', 'Sparepart Service', 'sparepart', '🛠️']
        ];

        for (const cat of categories) {
            await db.run('INSERT OR IGNORE INTO categories (id, name, type, emoji) VALUES (?, ?, ?, ?)', cat);
        }

        // 3. System Settings (Branding)
        const settings = [
            ['store_name', 'POS ABADI JAYA'],
            ['store_address', 'Dsn. Selungguh Rt 06 Desa Kediren Kec. Lembeyan, Kab. Magetan'],
            ['store_phone', '085655620979'],
            ['store_maps_url', 'https://maps.app.goo.gl/DD3kUGfTmqaZ9iDd7'],
            ['printer_size', '80mm'],
            ['paper_size', 'A4'],
            ['auto_print', 'true'],
            ['tarif_desain_per_jam', '50000']
        ];

        for (const [key, value] of settings) {
            await db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
        }

        console.log('✅ SQLite Seeding Completed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Gagal:', error);
        process.exit(1);
    }
};

seedData();
