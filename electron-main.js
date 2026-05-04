const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const https = require('https');
const http = require('http');
const os = require('os');

// Environment
process.env.NODE_ENV = app.isPackaged ? 'production' : 'development';

let launcherWindow;
let mainWindow;
let serverProcess;
let tray = null;

const SERVER_PORT = 5001;

// ---------- Resolve paths ----------
function getDbConfigPath() {
    const isPackaged = app.isPackaged;
    const paths = [
        path.join(app.getPath('userData'), 'database', 'db-config.json'),
        path.join(__dirname, 'server', 'database', 'db-config.json'),
        path.join(process.resourcesPath, 'server', 'database', 'db-config.json'),
        path.join(process.resourcesPath, 'app.asar', 'server', 'database', 'db-config.json')
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return paths[1]; // fallback to dev path
}

function resPath(...parts) {
    if (app.isPackaged) {
        // In production, resources are in process.resourcesPath
        const p = path.join(process.resourcesPath, ...parts);
        if (fs.existsSync(p)) return p;
        // Or inside app.asar
        return path.join(process.resourcesPath, 'app.asar', ...parts);
    }
    return path.join(__dirname, ...parts);
}

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

// ---------- Launcher Window ----------
function createLauncherWindow() {
    const preloadPath = app.isPackaged
        ? path.join(process.resourcesPath, 'db-tool', 'preload.js')
        : path.join(__dirname, 'build/db-tool/preload.js');

    launcherWindow = new BrowserWindow({
        width: 520,
        height: 720,
        resizable: false,
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: preloadPath,
        },
        icon: path.join(__dirname, 'build/icon.ico'),
        title: 'POS Abadi Jaya — Launcher',
        skipTaskbar: false,
    });

    const htmlPath = app.isPackaged
        ? path.join(process.resourcesPath, 'db-tool', 'index.html')
        : path.join(__dirname, 'build/db-tool/index.html');

    launcherWindow.loadFile(htmlPath);
    Menu.setApplicationMenu(null);

    launcherWindow.on('closed', () => { launcherWindow = null; });
}

// ---------- Main Window ----------
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'build/icon.ico'),
        title: 'POS Abadi Jaya',
    });

    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, 'client/dist/index.html'));
    } else {
        // In dev mode, load from server which serves both API + frontend
        mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
    }

    Menu.setApplicationMenu(null);
    mainWindow.on('closed', () => { mainWindow = null; });
}

// ---------- System Tray ----------
function createTray() {
    if (tray) return;

    const iconPath = path.join(__dirname, 'build/icon.ico');
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Buka Launcher', click: () => showLauncher() },
        { label: 'Buka Aplikasi', click: () => { if (!mainWindow) createWindow(); else mainWindow.focus(); } },
        { label: 'Buka di Browser', click: () => shell.openExternal(`http://localhost:${SERVER_PORT}`) },
        { type: 'separator' },
        { label: 'Keluar', click: () => { if (serverProcess) serverProcess.kill(); app.quit(); } },
    ]);

    tray.setToolTip('POS Abadi Jaya');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => showLauncher());
}

function showLauncher() {
    if (launcherWindow) {
        launcherWindow.show();
        launcherWindow.focus();
    } else {
        createLauncherWindow();
    }
}

// ---------- IPC: Close / Minimize / Launch ----------
ipcMain.on('close-app', () => {
    if (serverProcess) serverProcess.kill();
    app.quit();
});

ipcMain.on('minimize-to-tray', () => {
    if (launcherWindow) {
        launcherWindow.hide();
        createTray();
    }
});

ipcMain.on('open-app', () => {
    // Open Electron window
    if (!mainWindow) {
        createWindow();
    } else {
        mainWindow.focus();
    }

    // Minimize launcher to tray
    if (launcherWindow) {
        launcherWindow.hide();
        createTray();
    }
});

// ---------- IPC: Server Control ----------
ipcMain.handle('start-server', () => {
    if (serverProcess) {
        return { success: true, message: 'Server already running' };
    }

    try {
        startBackend();
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('stop-server', () => {
    if (serverProcess) {
        serverProcess.kill();
        serverProcess = null;
    }
    return { success: true };
});

ipcMain.handle('check-server-health', () => {
    return new Promise(resolve => {
        const req = http.get(`http://localhost:${SERVER_PORT}/api/health/ping`, { timeout: 3000 }, res => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { resolve({ status: 'ok' }); }
            });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
    });
});

// ---------- IPC: Network ----------
ipcMain.handle('get-network-info', () => {
    return { ip: getLocalIP(), port: SERVER_PORT };
});

// ---------- IPC: App Info ----------
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

// ---------- IPC: Open in Browser ----------
ipcMain.handle('open-in-browser', () => {
    shell.openExternal(`http://localhost:${SERVER_PORT}`);
    return { success: true };
});

// ---------- IPC: DB Status ----------
ipcMain.handle('get-db-status', () => {
    const p = resPath('server', 'database', 'db-config.json');
    if (fs.existsSync(p)) {
        try {
            const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
            return { mode: cfg.mode || cfg.APP_MODE || 'sqlite', config: cfg };
        } catch { }
    }
    return { mode: 'sqlite', config: null };
});

ipcMain.handle('switch-db-mode', async (_, mode) => {
    const dir = resPath('server', 'database');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const p = path.join(dir, 'db-config.json');
    let cfg = {};
    try { if (fs.existsSync(p)) cfg = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { }

    cfg.mode = mode;
    cfg.DB_TYPE = mode;
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2));
    return { success: true };
});

// ---------- IPC: Config ----------
ipcMain.handle('get-config', () => {
    const p = resPath('server', 'database', 'db-config.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    return null;
});

ipcMain.handle('save-config', (_, config) => {
    try {
        const dir = resPath('server', 'database');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'db-config.json'), JSON.stringify(config, null, 2));
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// ---------- IPC: Test Connection ----------
ipcMain.handle('test-connection', async (_, cfg) => {
    return new Promise(resolve => {
        const cmd = `mysql -h ${cfg.host} -P ${cfg.port} -u ${cfg.user} ${cfg.password ? '-p' + cfg.password : ''} -e "SELECT 1" 2>&1`;
        exec(cmd, { timeout: 5000 }, (err, stdout) => {
            if (err) return resolve({ success: false, error: stdout || err.message });
            resolve({ success: true });
        });
    });
});

// ---------- IPC: Check MariaDB ----------
ipcMain.handle('check-mariadb', async () => {
    return new Promise(resolve => {
        const locations = [
            'mysql',
            'C:\\xampp\\mysql\\bin\\mysql.exe',
            'C:\\laragon\\bin\\mysql\\mysql-8.0\\bin\\mysql.exe',
            'C:\\Program Files\\MariaDB 10.11\\bin\\mysql.exe',
            'C:\\Program Files\\MariaDB 11.4\\bin\\mysql.exe',
            'C:\\Program Files\\MariaDB 10.6\\bin\\mysql.exe',
            'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
        ];

        let idx = 0;
        function tryNext() {
            if (idx >= locations.length) return resolve({ found: false });
            const loc = locations[idx++];
            exec(`"${loc}" --version 2>&1`, { timeout: 3000 }, (err, stdout) => {
                if (!err && stdout.toLowerCase().includes('distrib')) {
                    resolve({ found: true, version: stdout.trim().split('\n')[0] });
                } else {
                    tryNext();
                }
            });
        }

        exec('sc query mysql', { timeout: 3000 }, (err, stdout) => {
            if (!err && stdout.includes('RUNNING')) {
                resolve({ found: true, version: 'MySQL/MariaDB service is running' });
            } else {
                tryNext();
            }
        });
    });
});

// ---------- IPC: Download & Install MariaDB ----------
ipcMain.handle('download-mariadb', async (event) => {
    const win = event.sender;
    const dest = path.join(os.tmpdir(), 'mariadb-installer.msi');
    const url = 'https://archive.mariadb.org/mariadb-10.11.7/winx64-packages/mariadb-10.11.7-winx64.msi';

    function sendLog(msg) { win.send('setup-log', msg); }
    function sendProgress(data) { win.send('download-progress', data); }

    return new Promise(resolve => {
        sendLog('Menghubungi server MariaDB...');

        const file = fs.createWriteStream(dest);

        const request = https.get(url, res => {
            if (res.statusCode === 302 || res.statusCode === 301) {
                fs.unlinkSync(dest);
                sendLog('Mengikuti redirect...');
            }

            const total = parseInt(res.headers['content-length'] || '0', 10);
            let downloaded = 0;

            res.on('data', chunk => {
                downloaded += chunk.length;
                const pct = total > 0 ? (downloaded / total) * 100 : 0;
                sendProgress({ percent: pct, transferredMB: downloaded / 1024 / 1024, totalMB: total / 1024 / 1024 });
            });

            res.pipe(file);

            file.on('finish', () => {
                file.close();
                sendLog('✓ Download selesai! Memulai instalasi MariaDB...');
                sendProgress({ percent: 100 });

                const msi = spawn('msiexec', [
                    '/i', dest, '/qn',
                    'PASSWORD=root', 'SERVICENAME=mysql', 'PORT=3306',
                    '/L*V', path.join(os.tmpdir(), 'mariadb-install.log'),
                ], { detached: false, shell: false });

                sendLog('Menginstal MariaDB sebagai service sistem...');

                msi.on('close', code => {
                    try { fs.unlinkSync(dest); } catch (_) { }
                    if (code === 0 || code === 3010) {
                        sendLog('✓ MariaDB berhasil diinstal!');
                        sendLog('Mengimpor struktur database...');
                        importDatabase(sendLog).then(r => resolve(r));
                    } else {
                        sendLog('✗ Instalasi gagal dengan kode: ' + code);
                        resolve({ success: false, error: 'MSI exit code: ' + code });
                    }
                });

                msi.on('error', err => {
                    sendLog('✗ Error: ' + err.message);
                    resolve({ success: false, error: err.message });
                });
            });
        });

        request.on('error', err => {
            sendLog('✗ Gagal menghubungi server: ' + err.message);
            resolve({ success: false, error: err.message });
        });
    });
});

// ---------- IPC: Import Database ----------
ipcMain.handle('pick-sql-file', async (event) => {
    const win = event.sender;
    const { dialog, BrowserWindow } = require('electron');
    const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(win), {
        properties: ['openFile'],
        filters: [{ name: 'SQL Backup', extensions: ['sql'] }]
    });
    if (result.canceled) return null;
    return result.filePaths[0];
});

ipcMain.handle('backup-database', async (event) => {
    const { dialog, BrowserWindow } = require('electron');
    const win = event.sender;
    const log = msg => win.send('server-log', msg);

    const result = await dialog.showSaveDialog(BrowserWindow.fromWebContents(win), {
        title: 'Simpan Backup Database',
        defaultPath: path.join(os.homedir(), `backup_pos_${new Date().toISOString().slice(0,10)}.sql`),
        filters: [{ name: 'SQL File', extensions: ['sql'] }]
    });

    if (result.canceled) return { success: false, error: 'Dibatalkan' };

    const dest = result.filePath;
    log('Memulai proses backup...');

    const configPath = getDbConfigPath();
    let cfg = {};
    try { if (fs.existsSync(configPath)) cfg = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch { }

    const dbName = cfg.DB_NAME || (cfg.mysql && cfg.mysql.database) || 'pos_abadi';
    const dbUser = cfg.DB_USER || (cfg.mysql && cfg.mysql.user) || 'root';
    const dbPass = cfg.DB_PASS || (cfg.mysql && cfg.mysql.password) || '';
    const dbHost = cfg.DB_HOST || (cfg.mysql && cfg.mysql.host) || 'localhost';

    try {
        // Use mysqldump npm package (no CLI dependency needed)
        const mysqldumpPkg = require(path.join(__dirname, 'server', 'node_modules', 'mysqldump'));
        const mysqldump = mysqldumpPkg.default || mysqldumpPkg;

        log(`Mengekspor database "${dbName}" dari ${dbHost}...`);

        await mysqldump({
            connection: {
                host: dbHost,
                user: dbUser,
                password: dbPass,
                database: dbName,
            },
            dumpToFile: dest,
        });

        log('✓ Backup berhasil disimpan ke: ' + dest);
        return { success: true };
    } catch (e) {
        log('✗ Backup gagal: ' + e.message);
        return { success: false, error: e.message };
    }
});

ipcMain.handle('import-database', async (event, customPath) => {
    const win = event.sender;
    return importDatabase(msg => win.send('server-log', msg), customPath);
});

async function importDatabase(log, customPath) {
    // Find SQL file in multiple locations
    let sqlFile = customPath;
    
    if (!sqlFile) {
        const possiblePaths = [
            resPath('database', 'pos_abadi.sql'),
            path.join(__dirname, 'server', 'database', 'pos_abadi_latest.sql'),
            path.join(__dirname, 'server', 'database', 'pos_abadi_utf8.sql'),
            path.join(__dirname, 'server', 'database', 'pos_abadi.sql'),
            path.join(__dirname, 'build', 'pos_abadi.sql'),
            resPath('db-tool', 'pos_abadi.sql'),
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) { sqlFile = p; break; }
        }
    }
    log && log('SQL file: ' + (sqlFile || 'TIDAK DITEMUKAN'));

    // Read current config (support both old & new format)
    const configPath = resPath('server', 'database', 'db-config.json');
    let cfg = {};
    try { if (fs.existsSync(configPath)) cfg = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch { }

    // Normalize config: old format uses DB_TYPE/DB_HOST etc, new uses mode/mysql
    const mode = cfg.mode || cfg.DB_TYPE || 'sqlite';
    if (!cfg.mysql && cfg.DB_HOST) {
        cfg.mysql = {
            host: cfg.DB_HOST || 'localhost',
            port: cfg.DB_PORT || 3306,
            user: cfg.DB_USER || 'root',
            password: cfg.DB_PASS || '',
            database: cfg.DB_NAME || 'pos_abadi'
        };
    }
    log && log('Mode: ' + mode);

    // ─── SQLite Mode ───
    if (mode === 'sqlite') {
        log && log('Mode SQLite: menjalankan init script...');
        try {
            const initScript = app.isPackaged
                ? path.join(process.resourcesPath, 'app.asar', 'server', 'database', 'init_sqlite.js')
                : path.join(__dirname, 'server', 'database', 'init_sqlite.js');
            const seedScript = app.isPackaged
                ? path.join(process.resourcesPath, 'app.asar', 'server', 'database', 'seed_sqlite.js')
                : path.join(__dirname, 'server', 'database', 'seed_sqlite.js');

            if (fs.existsSync(initScript)) {
                require('child_process').execSync(`"${process.execPath}" "${initScript}"`, {
                    timeout: 30000,
                    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
                });
                log && log('✓ Init SQLite berhasil');
            } else {
                log && log('⚠ File init_sqlite.js tidak ditemukan');
            }

            if (fs.existsSync(seedScript)) {
                require('child_process').execSync(`"${process.execPath}" "${seedScript}"`, {
                    timeout: 30000,
                    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
                });
                log && log('✓ Seed SQLite berhasil');
            }

            return { success: true };
        } catch (e) {
            log && log('✗ Gagal init SQLite: ' + e.message);
            return { success: false, error: e.message };
        }
    }

    // ─── MySQL Mode (menggunakan mysql2 package) ───
    if (!sqlFile) {
        log && log('✗ File SQL tidak ditemukan di semua lokasi');
        return { success: false, error: 'SQL file not found' };
    }

    // MySQL Mode
    try {
        // Load mysql2 specifically from the server directory
        const serverNodeModules = path.join(__dirname, 'server', 'node_modules', 'mysql2', 'promise.js');
        const mysql = fs.existsSync(serverNodeModules) ? require(serverNodeModules) : require('mysql2/promise');
        
        const dbName = cfg.DB_NAME || (cfg.mysql && cfg.mysql.database) || 'pos_abadi';
        const dbHost = cfg.DB_HOST || (cfg.mysql && cfg.mysql.host) || 'localhost';
        
        log && log(`Mencoba koneksi ke MySQL di ${dbHost}...`);

        const conn = await mysql.createConnection({
            host: dbHost,
            user: cfg.DB_USER || (cfg.mysql && cfg.mysql.user) || 'root',
            password: cfg.DB_PASS || (cfg.mysql && cfg.mysql.password) || '',
            multipleStatements: true,
            connectTimeout: 10000 // 10 detik timeout agar tidak nyangkut
        });

        log && log(`✓ Terkoneksi! Membersihkan & menyiapkan database "${dbName}"...`);
        
        // Hapus database lama agar tidak bentrok (Clean Install)
        await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
        await conn.query(`CREATE DATABASE \`${dbName}\``);
        await conn.query(`USE \`${dbName}\``);
        
        log && log('✓ Database dikosongkan. Membaca file SQL...');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        log && log('Menjalankan perintah SQL (mohon tunggu)...');
        
        // Matikan pengamanan relasi
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.query(sqlContent);
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        
        log && log('✓ IMPORT SELESAI! Database baru berhasil dibuat.');

        await conn.end();
        return { success: true };
    } catch (e) {
        log && log('✗ Gagal: ' + e.message);
        return { success: false, error: e.message };
    }
}

// ---------- Backend ----------
function startBackend() {
    const isPackaged = app.isPackaged;
    const serverPath = isPackaged
        ? path.join(process.resourcesPath, 'app.asar', 'server', 'index.js')
        : path.join(__dirname, 'server', 'index.js');

    const dbDir = isPackaged
        ? path.join(app.getPath('userData'), 'database')
        : path.join(__dirname, 'server', 'database');

    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    serverProcess = spawn(process.execPath, [serverPath], {
        env: {
            ...process.env,
            ELECTRON_RUN_AS_NODE: '1',
            PORT: SERVER_PORT,
            NODE_ENV: isPackaged ? 'production' : 'development',
            SQLITE_PATH: path.join(dbDir, 'pos.sqlite'),
            APP_MODE: 'standalone',
        },
        stdio: 'inherit',
    });

    serverProcess.on('error', err => {
        console.error('Backend error:', err);
        if (launcherWindow) {
            launcherWindow.webContents.send('server-status', 'crashed');
            launcherWindow.webContents.send('server-log', '✗ Backend crash: ' + err.message);
        }
    });

    serverProcess.on('close', (code) => {
        console.log('Backend exited with code:', code);
        serverProcess = null;
        if (launcherWindow) {
            launcherWindow.webContents.send('server-status', 'crashed');
            launcherWindow.webContents.send('server-log', '✗ Backend process keluar (code: ' + code + ')');
        }
    });
}

// ---------- Auto Update Logic ----------
autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Tersedia',
        message: 'Versi baru POS Abadi Jaya tersedia. Mengunduh sekarang...',
    });
});

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Siap Pasang',
        message: 'Update telah selesai diunduh. Aplikasi akan dimulai ulang untuk memasang update.',
        buttons: ['Restart Sekarang', 'Nanti']
    }).then((result) => {
        if (result.response === 0) autoUpdater.quitAndInstall();
    });
});

autoUpdater.on('error', (err) => {
    console.error('AutoUpdate Error:', err);
});

// ---------- App Lifecycle ----------
app.whenReady().then(() => {
    // Always open Launcher first — user controls when to start server
    createLauncherWindow();

    // Check for updates
    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createLauncherWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Don't quit if tray exists (launcher is hidden)
    if (tray) return;
    if (process.platform !== 'darwin') {
        if (serverProcess) serverProcess.kill();
        app.quit();
    }
});

app.on('quit', () => {
    if (serverProcess) serverProcess.kill();
    if (tray) { tray.destroy(); tray = null; }
});
