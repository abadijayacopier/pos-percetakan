const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const https = require('https');
const os = require('os');

// Environment
process.env.NODE_ENV = app.isPackaged ? 'production' : 'development';

let mainWindow;
let serverProcess;
let setupWindow;

const isSetupMode = process.argv.includes('--setup');

// ---------- Resolve paths ----------
function resPath(...parts) {
    return app.isPackaged
        ? path.join(process.resourcesPath, ...parts)
        : path.join(__dirname, ...parts);
}

// ---------- Setup Window ----------
function createSetupWindow() {
    setupWindow = new BrowserWindow({
        width: 460,
        height: 580,
        resizable: false,
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'build/db-tool/preload.js'),
        },
        icon: path.join(__dirname, 'build/icon.ico'),
        title: 'POS Abadi Jaya - Setup',
    });

    setupWindow.loadFile(path.join(__dirname, 'build/db-tool/index.html'));
    Menu.setApplicationMenu(null);
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
        mainWindow.loadURL('http://localhost:5173');
    }

    Menu.setApplicationMenu(null);
    mainWindow.on('closed', () => { mainWindow = null; });
}

// ---------- IPC: Close / Launch ----------
ipcMain.on('close-app', () => {
    if (setupWindow) setupWindow.close();
    app.quit();
});

ipcMain.on('launch-main', () => {
    if (setupWindow) setupWindow.close();
    startBackend();
    setTimeout(createWindow, 2000);
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
        // Use mysql2 if available, else use mysql CLI
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
        // Check common install locations
        const locations = [
            'mysql', // in PATH
            'C:\\Program Files\\MariaDB 10.11\\bin\\mysql.exe',
            'C:\\Program Files\\MariaDB 11.4\\bin\\mysql.exe',
            'C:\\Program Files\\MariaDB 10.6\\bin\\mysql.exe',
            'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
        ];

        let found = false;
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

        // Also check via SC query
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
                // Handle redirect
                fs.unlinkSync(dest);
                // Retry with new location handled by follow-redirects or manual
                sendLog('Mengikuti redirect...');
            }

            const total = parseInt(res.headers['content-length'] || '0', 10);
            let downloaded = 0;

            res.on('data', chunk => {
                downloaded += chunk.length;
                const pct = total > 0 ? (downloaded / total) * 100 : 0;
                const dlMB = downloaded / 1024 / 1024;
                const totalMB = total / 1024 / 1024;
                sendProgress({ percent: pct, transferredMB: dlMB, totalMB });
            });

            res.pipe(file);

            file.on('finish', () => {
                file.close();
                sendLog('✓ Download selesai! Memulai instalasi MariaDB...');
                sendProgress({ percent: 100 });

                // Silent MSI install
                const msi = spawn('msiexec', [
                    '/i', dest,
                    '/qn',
                    'PASSWORD=root',
                    'SERVICENAME=mysql',
                    'PORT=3306',
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

        // Find working mysql binary
        let mysqlBin = 'mysql';
        for (const loc of mysqlLocations) {
            try {
                require('child_process').execSync(`"${loc}" --version`, { timeout: 3000 });
                mysqlBin = loc;
                break;
            } catch (_) { }
        }

        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Create DB then import
        exec(`"${mysqlBin}" -u root -e "CREATE DATABASE IF NOT EXISTS pos_abadi;"`, (err) => {
            if (err) log && log('⚠ Create DB: ' + err.message);

            const imp = exec(
                `"${mysqlBin}" -u root pos_abadi`,
                { timeout: 30000 },
                (err2, stdout) => {
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
        ? path.join(process.resourcesPath, 'app', 'server', 'index.js')
        : path.join(__dirname, 'server', 'index.js');

    const dbDir = isPackaged
        ? path.join(app.getPath('userData'), 'database')
        : path.join(__dirname, 'server', 'database');

    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    serverProcess = spawn(process.execPath, [serverPath], {
        env: {
            ...process.env,
            PORT: 5001,
            NODE_ENV: isPackaged ? 'production' : 'development',
            SQLITE_PATH: path.join(dbDir, 'pos.sqlite'),
            APP_MODE: 'standalone',
        },
        stdio: 'inherit',
    });

    serverProcess.on('error', err => console.error('Backend error:', err));
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
    if (isSetupMode) {
        createSetupWindow();
    } else {
        startBackend();
        setTimeout(createWindow, 2000);

        // Check for updates
        if (app.isPackaged) {
            autoUpdater.checkForUpdatesAndNotify();
        }
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            isSetupMode ? createSetupWindow() : createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (serverProcess) serverProcess.kill();
        app.quit();
    }
});

app.on('quit', () => {
    if (serverProcess) serverProcess.kill();
});
