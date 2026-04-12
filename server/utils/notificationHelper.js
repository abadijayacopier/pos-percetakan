const whatsappService = require('./whatsappService');
const { pool } = require('../config/database');

const sendInvoiceNotification = async (trx, items) => {
    if (!trx.customer_wa) return;

    try {
        // 1. Fetch WA Config & System Settings
        const [configRows] = await pool.query('SELECT config_key, config_value FROM wa_config');
        const config = configRows.reduce((acc, r) => { acc[r.config_key] = r.config_value; return acc; }, {});

        const [settingsRows] = await pool.query('SELECT `key`, `value` FROM settings WHERE `key` IN ("store_name", "store_address")');
        const settings = settingsRows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});

        if (!config.template_invoice) {
            console.warn('⚠️ Template invoice tidak ditemukan di wa_config');
            return;
        }

        // 2. Format Message
        const produkNames = items.map(i => i.name).join(', ');
        const storeName = settings.store_name || 'Abadi Jaya Copier';
        const storeAddress = settings.store_address || 'Jl. Raya Kediren No. 1';
        const totalAmount = trx.total || 0;
        const paidAmount = trx.paid || 0;
        const remainingAmount = totalAmount - paidAmount;

        let message = config.template_invoice
            // Old format {nama} compatibility
            .replace(/{nama}/g, trx.customer_name || 'Pelanggan')
            .replace(/{spk_number}/g, trx.invoice_no)
            .replace(/{produk}/g, produkNames)
            .replace(/{total}/g, totalAmount.toLocaleString('id-ID'))
            .replace(/{dp}/g, paidAmount.toLocaleString('id-ID'))
            .replace(/{sisa}/g, remainingAmount.toLocaleString('id-ID'))
            // New format [NamaPelanggan] style
            .replace(/\[NamaPelanggan\]/g, trx.customer_name || 'Pelanggan')
            .replace(/\[NomorSPK\]/g, trx.invoice_no)
            .replace(/\[NamaProduk\]/g, produkNames)
            .replace(/\[NamaToko\]/g, storeName)
            .replace(/\[AlamatToko\]/g, storeAddress)
            .replace(/\[Tagihan\]/g, totalAmount.toLocaleString('id-ID'))
            .replace(/\[Sisa\]/g, remainingAmount.toLocaleString('id-ID'));

        // 3. Create initial log
        const [logResult] = await pool.query(
            'INSERT INTO log_notifikasi_wa (id_transaksi, status_kirim, jumlah_percobaan) VALUES (?, ?, ?)',
            [trx.id, 'pending', 1]
        );
        const logId = logResult.insertId;

        // 4. Send Message
        try {
            if (whatsappService.getStatus().status === 'ready') {
                await whatsappService.sendMessage(trx.customer_wa, message);
                console.log(`✅ Nota WA terkirim via Gateway Mandiri ke ${trx.customer_wa}`);
            } else {
                console.warn('⚠️ Gateway Mandiri tidak siap, menggunakan API Fallback...');
                const apiToken = config.api_token;
                const deviceId = config.phone_number;

                if (!apiToken || !deviceId) {
                    throw new Error('Konfigurasi API Fallback (Token/Device ID) tidak lengkap');
                }

                // Call External API (Generic implementation based on common Indonesian providers)
                const axios = require('axios');
                await axios.post('https://api.watzap.id/v1/send_message', {
                    api_key: apiToken,
                    number_key: deviceId,
                    phone_no: trx.customer_wa,
                    message: message
                });
                console.log(`✅ Nota WA terkirim via API Fallback ke ${trx.customer_wa}`);
            }

            // 5. Update Log to Sent
            await pool.query(
                'UPDATE log_notifikasi_wa SET status_kirim = ?, waktu_kirim = NOW() WHERE id_log = ?',
                ['sent', logId]
            );
        } catch (sendError) {
            console.error(`❌ Gagal kirim WA ke ${trx.customer_wa}:`, sendError.message);

            // Update Log to Failed
            await pool.query(
                'UPDATE log_notifikasi_wa SET status_kirim = ?, pesan_error = ? WHERE id_log = ?',
                ['failed', sendError.message, logId]
            );
        }

    } catch (error) {
        console.error('❌ Error in sendInvoiceNotification:', error);
    }
};

module.exports = {
    sendInvoiceNotification
};
