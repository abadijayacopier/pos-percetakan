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
function resPath(...parts) {
    return app.isPackaged
        ? path.join(process.resourcesPath, ...parts)
        : path.join(__dirname, ...parts);
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

    // Open in browser
    shell.openExternal(`http://localhost:${SERVER_PORT}`);

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
ipcMain.handle('import-database', async (event) => {
    const win = event.sender;
    return importDatabase(msg => win.send('setup-log', msg));
});

async function importDatabase(log) {
    return new Promise(resolve => {
        const sqlFile = resPath('database', 'pos_abadi.sql');
        if (!fs.existsSync(sqlFile)) {
            log && log('✗ File SQL tidak ditemukan: ' + sqlFile);
            return resolve({ success: false, error: 'SQL file not found' });
        }

        const mysqlLocations = [
            'mysql',
            'C:\\Program Files\\MariaDB 10.11\\bin\\mysql.exe',
            'C:\\Program Files\\MariaDB 11.4\\bin\\mysql.exe',
            'C:\\Program Files\\MariaDB 10.6\\bin\\mysql.exe',
        ];

        let mysqlBin = 'mysql';
        for (const loc of mysqlLocations) {
            try {
                require('child_process').execSync(`"${loc}" --version`, { timeout: 3000 });
                mysqlBin = loc;
                break;
            } catch (_) { }
        }

        const sql = fs.readFileSync(sqlFile, 'utf8');

        exec(`"${mysqlBin}" -u root -e "CREATE DATABASE IF NOT EXISTS pos_abadi;"`, (err) => {
            if (err) log && log('⚠ Create DB: ' + err.message);

            const imp = exec(
                `"${mysqlBin}" -u root pos_abadi`,
                { timeout: 30000 },
                (err2) => {
                    if (err2) {
                        log && log('✗ Import gagal: ' + err2.message);
                        return resolve({ success: false, error: err2.message });
                    }
                    log && log('✓ Database pos_abadi berhasil diimpor!');
                    resolve({ success: true });
                }
            );
            if (imp.stdin) {
                imp.stdin.write(sql);
                imp.stdin.end();
            }
        });
    });
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
