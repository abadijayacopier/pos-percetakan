const isExe = process.pkg ? true : false;
const basePath = isExe ? path.dirname(process.execPath) : path.join(__dirname, '..');

// Sync database folder existence
const dbDir = path.join(basePath, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const configPath = path.join(basePath, 'database', 'db-config.json');

console.log('--- KONEKSI DATABASE POS ABADI JAYA ---');
console.log('1. Database Online (MySQL Cloud)');
console.log('2. Database Lokal (SQLLite)');

rl.question('\nPilih mode database (1/2): ', (choice) => {
    if (choice === '1') {
        console.log('\n--- Input Koneksi MySQL Online ---');
        rl.question('Host (default: localhost): ', (host) => {
            rl.question('User (default: root): ', (user) => {
                rl.question('Password: ', (pass) => {
                    rl.question('Database Name (default: pos_abadi): ', (dbName) => {
                        const config = {
                            APP_MODE: 'standalone',
                            DB_TYPE: 'mysql',
                            DB_HOST: host || 'localhost',
                            DB_USER: user || 'root',
                            DB_PASS: pass || '',
                            DB_NAME: dbName || 'pos_abadi'
                        };
                        saveConfig(config);
                    });
                });
            });
        });
    } else if (choice === '2') {
        const config = {
            APP_MODE: 'standalone',
            DB_TYPE: 'sqlite'
        };
        saveConfig(config);
    } else {
        console.log('Pilihan tidak valid.');
        rl.close();
    }
});

function saveConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('\n✅ Konfigurasi berhasil disimpan!');
        console.log(`Lokasi: ${configPath}`);
        console.log('\nSilakan restart aplikasi POS untuk menerapkan perubahan.');
    } catch (e) {
        console.error('❌ Gagal menyimpan konfigurasi:', e.message);
    }
    rl.close();
}
