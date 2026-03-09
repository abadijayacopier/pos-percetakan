const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route test
app.get('/', (req, res) => {
    res.json({ message: 'POS Abadi Jaya API is running!' });
});

const pricingRouter = require('./routes/pricing');

// Init API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/print-orders', require('./routes/printing'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/service-orders', require('./routes/service'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/print', require('./routes/print'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/design-logs', require('./routes/design-logs'));
app.use('/api/offset-orders', require('./routes/offset_orders'));
app.use('/api/spk', require('./routes/spk'));
app.use('/api/wa-config', require('./routes/wa-config'));
app.use('/api/pricing', pricingRouter);

const startServer = async () => {
    // Test koneksi database saat start
    await testConnection();

    app.listen(PORT, () => {
        console.log(`🚀 Server backend berjalan di http://localhost:${PORT}`);
    });
};

startServer();
