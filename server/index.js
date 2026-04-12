const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { testConnection } = require('./config/database');
require('./config/firebase');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// License Guard (Melindungi seluruh API kecuali rute aktivasi/auth)
const licenseGuard = require('./middleware/licenseGuard');
app.use(licenseGuard);

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/uploads', express.static('public/uploads'));

// Basic route test
app.get('/', (req, res) => {
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
app.use('/api/dp_tasks', require('./routes/dp_tasks'));
app.use('/api/handovers', require('./routes/handovers'));
app.use(process.env.NODE_ENV === 'production' ? '/api/health' : '/api/health', require('./routes/health'));
app.use('/api/activity-logs', require('./routes/activity-logs'));

const startServer = async () => {
    // Test koneksi database saat start
    await testConnection();

    // Auto-init WhatsApp Service (Optional: bisa juga manual via UI)
    // const whatsappService = require('./utils/whatsappService');
    // whatsappService.init();

    app.listen(PORT, () => {
        console.log(`🚀 Server backend berjalan di http://localhost:${PORT}`);
    });
};

startServer();
