const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');
const { masterPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Init Midtrans for Platform (using Master keys from ENV or DB)
// For simplicity, we use ENV keys for the platform billing
const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// POST /api/subscriptions/renew - Create payment for a shop
router.post('/renew', verifyToken, async (req, res) => {
    try {
        const { plan, durationMonths } = req.body;
        const shopId = req.user.shopId;

        // Pricing logic (Sample)
        const plans = {
            basic: 100000,
            pro: 250000,
            ultra: 500000
        };

        const amount = plans[plan] * durationMonths;
        const orderId = `SUB-${shopId}-${Date.now()}`;

        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: amount
            },
            credit_card: {
                secure: true
            },
            customer_details: {
                first_name: req.user.name,
                email: req.user.username
            }
        };

        const transaction = await snap.createTransaction(parameter);

        // Record in Master DB
        await masterPool.query(
            `INSERT INTO subscription_payments (id, shop_id, amount, plan, duration_months, snap_token)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [orderId, shopId, amount, plan, durationMonths, transaction.token]
        );

        res.json(transaction);
    } catch (error) {
        console.error('Subscription Renewal Error:', error);
        res.status(500).json({ message: 'Failed to initiate payment' });
    }
});

// POST /api/subscriptions/webhook - Master Payment Webhook
router.post('/webhook', async (req, res) => {
    try {
        const notification = req.body;
        const statusResponse = await snap.transaction.notification(notification);

        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        console.log(`[Master Webhook] Order ID: ${orderId}, Status: ${transactionStatus}`);

        let masterStatus = 'pending';
        if (transactionStatus == 'capture' || transactionStatus == 'settlement') {
            masterStatus = (fraudStatus == 'challenge') ? 'pending' : 'settlement';
        } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
            masterStatus = transactionStatus;
        }

        if (masterStatus === 'settlement') {
            // 1. Update Payment Status
            await masterPool.query('UPDATE subscription_payments SET status = ? WHERE id = ?', [masterStatus, orderId]);

            // 2. Get Subscription Info
            const [payments] = await masterPool.query('SELECT * FROM subscription_payments WHERE id = ?', [orderId]);
            if (payments.length > 0) {
                const pay = payments[0];
                const [shops] = await masterPool.query('SELECT expiry_date FROM shops WHERE id = ?', [pay.shop_id]);

                let currentExpiry = new Date();
                if (shops.length > 0 && shops[0].expiry_date && new Date(shops[0].expiry_date) > new Date()) {
                    currentExpiry = new Date(shops[0].expiry_date);
                }

                currentExpiry.setMonth(currentExpiry.getMonth() + pay.duration_months);

                // 3. Update Shop Status
                await masterPool.query(
                    'UPDATE shops SET subscription_status = "active", subscription_plan = ?, expiry_date = ? WHERE id = ?',
                    [pay.plan, currentExpiry, pay.shop_id]
                );
            }
        } else {
            await masterPool.query('UPDATE subscription_payments SET status = ? WHERE id = ?', [masterStatus, orderId]);
        }

        res.status(200).json({ status: 'OK' });
    } catch (error) {
        console.error('Master Webhook Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
