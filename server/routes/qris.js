const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const midtransClient = require('midtrans-client');
const TenantManager = require('../utils/tenantManager');

// Helper untuk inisialisasi Midtrans per Tenant
const initMidtrans = async (db) => {
    const [settings] = await db.query('SELECT * FROM settings WHERE `key` IN ("midtrans_key", "midtrans_is_production")');
    let serverKey = '';
    let isProduction = false;

    settings.forEach(s => {
        if (s.key === 'midtrans_key') serverKey = s.value;
        if (s.key === 'midtrans_is_production') isProduction = s.value === 'true';
    });

    if (!serverKey) throw new Error('Midtrans Server Key belum dikonfigurasi');

    return new midtransClient.CoreApi({
        isProduction: isProduction,
        serverKey: serverKey,
        clientKey: ''
    });
};

// 1. Generate QRIS / Gopay token (Authenticated)
router.post('/generate', verifyToken, async (req, res) => {
    try {
        const { order_id, amount, payment_type = 'qris' } = req.body;
        if (!order_id || !amount) return res.status(400).json({ message: 'Order ID dan Amount wajib diisi' });

        const coreApi = await initMidtrans(req.db);

        // Gabungkan shopId ke order_id agar webhook bisa mengidentifikasi tenant
        const midtransOrderId = `${req.user.shopId}_${order_id}`;

        const parameter = {
            payment_type: payment_type,
            transaction_details: {
                order_id: midtransOrderId,
                gross_amount: Math.round(amount)
            }
        };

        const chargeResponse = await coreApi.charge(parameter);
        res.json({ message: 'QRIS Generated', data: chargeResponse });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Gagal generate QRIS' });
    }
});

// 2. Webhook / Notification (Public - Handled by Midtrans)
router.post('/webhook', async (req, res) => {
    try {
        const midtransBody = req.body;
        const midtransOrderId = midtransBody.order_id;

        // Parse shopId dari order_id (format: shopId_realOrderId)
        const parts = midtransOrderId.split('_');
        if (parts.length < 2) return res.status(400).json({ message: 'Invalid Order ID' });

        const shopId = parts[0];
        const realOrderId = parts.slice(1).join('_');

        // Resolve Tenant Database
        const tenantDb = await TenantManager.getPoolForShop(shopId);
        if (!tenantDb) return res.status(404).json({ message: 'Tenant not found' });

        const coreApi = await initMidtrans(tenantDb);
        const statusResponse = await coreApi.transaction.notification(midtransBody);

        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        let posStatus = 'pending';
        if (transactionStatus == 'capture' || transactionStatus == 'settlement') {
            posStatus = (fraudStatus == 'challenge') ? 'challenge' : 'paid';
        } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
            posStatus = 'cancelled';
        }

        if (posStatus === 'paid') {
            const [trx] = await tenantDb.query('SELECT total FROM transactions WHERE id = ?', [realOrderId]);
            if (trx.length > 0) {
                await tenantDb.query('UPDATE transactions SET status = ?, paid = ? WHERE id = ?', [posStatus, trx[0].total, realOrderId]);
            }
        } else {
            await tenantDb.query('UPDATE transactions SET status = ? WHERE id = ?', [posStatus, realOrderId]);
        }

        res.status(200).json({ status: 'OK' });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
