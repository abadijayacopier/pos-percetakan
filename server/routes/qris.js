const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const midtransClient = require('midtrans-client');

// Fungsi helper untuk inisialisasi Midtrans
const initMidtrans = async () => {
    const [settings] = await pool.query('SELECT * FROM settings WHERE `key` IN ("midtrans_key", "midtrans_is_production")');
    let serverKey = '';
    let isProduction = false;

    settings.forEach(s => {
        if (s.key === 'midtrans_key') serverKey = s.value;
        if (s.key === 'midtrans_is_production') isProduction = s.value === 'true';
    });

    if (!serverKey) throw new Error('Midtrans Server Key belum dikonfigurasi di Pengaturan');

    return new midtransClient.CoreApi({
        isProduction: isProduction,
        serverKey: serverKey,
        clientKey: '' // Opsional untuk backend
    });
};

// 1. Generate QRIS / Gopay token
router.post('/generate', verifyToken, async (req, res) => {
    try {
        const { order_id, amount, payment_type = 'qris' } = req.body;

        if (!order_id || !amount) {
            return res.status(400).json({ message: 'Order ID dan Amount wajib diisi' });
        }

        const coreApi = await initMidtrans();

        const parameter = {
            payment_type: payment_type, // 'qris' atau 'gopay'
            transaction_details: {
                order_id: order_id,
                gross_amount: Math.round(amount)
            }
        };

        const chargeResponse = await coreApi.charge(parameter);

        res.json({
            message: 'QRIS Generated',
            data: chargeResponse
        });

    } catch (error) {
        console.error('Midtrans Generate Error:', error);
        res.status(500).json({ message: error.message || 'Gagal generate QRIS' });
    }
});

// 2. Webhook / Notification (Dipanggil oleh Midtrans)
router.post('/webhook', async (req, res) => {
    try {
        const coreApi = await initMidtrans();

        // Midtrans coreApi.transaction.notification mensyaratkan object body
        // Pastikan bodyParser.json() sudah aktif di index.js
        const statusResponse = await coreApi.transaction.notification(req.body);

        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        console.log(`[QRIS Webhook] Menerima update untuk Order ID: ${orderId}, Status: ${transactionStatus}`);

        let posStatus = 'pending';

        if (transactionStatus == 'capture' || transactionStatus == 'settlement') {
            if (fraudStatus == 'challenge') {
                posStatus = 'challenge';
            } else {
                posStatus = 'paid';
            }
        } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
            posStatus = 'cancelled';
        } else if (transactionStatus == 'pending') {
            posStatus = 'pending';
        }

        // Update database transactions
        if (posStatus === 'paid') {
            // Ambil total untuk memastikan lunas
            const [trx] = await pool.query('SELECT total FROM transactions WHERE id = ?', [orderId]);
            if (trx.length > 0) {
                await pool.query('UPDATE transactions SET status = ?, paid = ? WHERE id = ?', [posStatus, trx[0].total, orderId]);

                // Tambahkan Cash Flow jika status transisi ke LUNAS dan belum ada record cf? 
                // Karena ini webhook otomatis, mungkin perlu cek cash_flow.
                // Tapi untuk amannya, cukup update transactions dulu. 
                // Sistem POS ini memasukkan ke cash_flow saat "checkout" di '/api/transactions'.
                // Kita perlu menangani secara baik agar tidak double cashflow.
            }
        } else {
            await pool.query('UPDATE transactions SET status = ? WHERE id = ?', [posStatus, orderId]);
        }

        res.status(200).json({ status: 'OK' });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
