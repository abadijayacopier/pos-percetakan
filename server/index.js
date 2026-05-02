const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { testConnection, initSqlite, currentMode, currentDbType } = require('./config/database');
require('./config/firebase');
const licenseGuard = require('./middleware/licenseGuard');

const app = express();

// Global Error Handlers to prevent crash
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// License Guard (Melindungi seluruh API kecuali rute aktivasi/auth)
app.use(licenseGuard);

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// API root test (only for /api direct hit)
app.get('/api', (req, res) => {
    res.json({ message: 'POS Abadi Jaya API is running!' });
});

const pricingRouter = require('./routes/pricing');

app.use('/api/service', require('./routes/service'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/print-orders', require('./routes/printing'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/print', require('./routes/print'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/design-logs', require('./routes/design-logs'));
app.use('/api/offset-orders', require('./routes/offset_orders'));
app.use('/api/spk', require('./routes/spk'));
app.use('/api/wa-config', require('./routes/wa-config'));
app.use('/api/wa-gateway', require('./routes/wa-gateway'));
app.use('/api/pricing', pricingRouter);
app.use('/api/designers', require('./routes/designers'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/qris', require('./routes/qris'));
app.use('/api/dp-tasks', require('./routes/dp_tasks'));
app.use('/api/handovers', require('./routes/handovers'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/payroll', require('./routes/payroll'));
app.use(process.env.NODE_ENV === 'production' ? '/api/health' : '/api/health', require('./routes/health'));
app.use('/api/activity-logs', require('./routes/activity-logs'));

// SaaS & Platform Management
app.use('/api/super-auth', require('./routes/super-auth'));
app.use('/api/super-admin', require('./routes/super-admin'));
app.use('/api/subscriptions', require('./routes/subscription'));

// ─── Serve Frontend (client/dist) ───
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    // SPA fallback: any non-API route serves index.html
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) return next();
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
    console.log('📦 Serving frontend from:', clientDistPath);
} else {
    app.get('/', (req, res) => {
        res.json({ message: 'POS Abadi Jaya API is running! (Frontend not built)' });
    });
}

const startServer = async () => {
    // 1. Auto-Initialize SQLite if in Standalone mode and DB file missing
    if (currentMode === 'standalone' && currentDbType === 'sqlite') {
        const dbPath = path.join(__dirname, 'database/pos.sqlite');
        if (!fs.existsSync(dbPath)) {
            console.log('📦 Database SQLite tidak ditemukan. Menginisialisasi...');
            try {
                // We use require to run the init scripts to ensure they use the correct config
                // but since they are scripts we might need to spawn or just require them if they export a function
                // For now, let's just use child_process to be safe or refactor them to functions
                const { execSync } = require('child_process');
                execSync(`node ${path.join(__dirname, 'database/init_sqlite.js')}`);
                execSync(`node ${path.join(__dirname, 'database/seed_sqlite.js')}`);
                console.log('✅ Inisialisasi Database Berhasil.');
            } catch (err) {
                console.error('❌ Gagal inisialisasi database otomatis:', err.message);
            }
        }
    }

    // 2. Run Database Migrations (Auto-Patch)
    const { runMigrations } = require('./database/migrationManager');
    await runMigrations();

    // Test koneksi database saat start
    await testConnection();

    app.listen(PORT, () => {
        console.log(`🚀 Server backend berjalan di http://localhost:${PORT}`);
        
        // Start Telegram Bot Polling (Interactive Commands)
        try {
            const { startPolling } = require('./utils/telegramBot');
            startPolling();
        } catch (e) {
            console.error('❌ Gagal mengaktifkan Telegram Bot Polling:', e.message);
        }

        // Start Automatic Daily Backup
        try {
            const { initAutoBackup } = require('./utils/autoBackup');
            initAutoBackup();
        } catch (e) {
            console.error('❌ Gagal mengaktifkan Auto Backup:', e.message);
        }
    });
};


startServer();
