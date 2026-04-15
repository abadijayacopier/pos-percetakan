const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Environment variables
process.env.NODE_ENV = app.isPackaged ? 'production' : 'development';

let mainWindow;
let serverProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'assets/icon.ico'),
        title: 'POS Abadi Jaya'
    });

    if (app.isPackaged) {
        // Load production build
        // For Vite + React, we need a local server to serve static files or use file:// with custom handling
        // But for simplicity, we can load the built index.html
        mainWindow.loadFile(path.join(__dirname, 'client/dist/index.html'));
    } else {
        // Load Vite dev server
        mainWindow.loadURL('http://localhost:5173');
    }

    // Hide default menu
    Menu.setApplicationMenu(null);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Start Backend Server
function startBackend() {
    console.log('Starting Backend Server...');

    // Path resolution for both dev and production
    const isPackaged = app.isPackaged;
    const serverPath = isPackaged
        ? path.join(process.resourcesPath, 'app', 'server', 'index.js')
        : path.join(__dirname, 'server', 'index.js');

    // SQLite Path: Use userData directory for persistent data in production
    const dbDir = isPackaged
        ? path.join(app.getPath('userData'), 'database')
        : path.join(__dirname, 'server', 'database');

    if (!require('fs').existsSync(dbDir)) {
        require('fs').mkdirSync(dbDir, { recursive: true });
    }

    const sqlitePath = path.join(dbDir, 'pos.sqlite');

    // In production, we use Electron's own node engine or a spawned process
    // If using spawn('node'), we must ensure node is available or use electron's helper
    const nodePath = process.execPath;

    serverProcess = spawn(nodePath, [serverPath], {
        env: {
            ...process.env,
            PORT: 5001,
            NODE_ENV: isPackaged ? 'production' : 'development',
            SQLITE_PATH: sqlitePath, // Inject dynamic database path
            APP_MODE: 'standalone',
            DB_TYPE: 'sqlite'
        },
        stdio: 'inherit'
    });

    serverProcess.on('error', (err) => {
        console.error('Failed to start backend:', err);
    });
}

app.whenReady().then(() => {
    startBackend();

    // Give server some time to start before loading window
    setTimeout(createWindow, 2000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
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
