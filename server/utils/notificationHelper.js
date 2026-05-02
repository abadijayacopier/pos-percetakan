const whatsappService = require('./whatsappService');
const { getActivePool } = require('../config/database');

/**
 * Helper to get settings as a map
 */
const getSettingsMap = async (db, keys) => {
    try {
        const [rows] = await db.query('SELECT `key`, `value` FROM settings WHERE `key` IN (?)', [keys]);
        return rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
    } catch (e) {
        console.error('Error fetching settings:', e);
        return {};
    }
};

const sendInvoiceNotification = async (trx, items) => {
    if (!trx.customer_wa && !trx.customerPhone) return;
    const phone = trx.customer_wa || trx.customerPhone;

    try {
        const db = await getActivePool();
        const settings = await getSettingsMap(db, [
            "store_name", "store_address", 
            "wa_template_inv", "wa_template_kasir"
        ]);

        const template = settings.wa_template_inv || 'Halo *{{name}}*, pesanan Anda *#{{invoice}}* sebesar *{{total}}* sedang kami proses. Terima kasih!';
        
        // Format Message
        const produkNames = items ? items.map(i => i.name).join(', ') : 'Produk';
        const storeName = settings.store_name || 'Abadi Jaya Copier';
        const totalAmount = trx.total || 0;
        const paidAmount = trx.paid || 0;
        const remainingAmount = totalAmount - paidAmount;

        let message = template
            .replace(/{{name}}/g, trx.customer_name || 'Pelanggan')
            .replace(/{{invoice}}/g, trx.invoice_no)
            .replace(/{{total}}/g, totalAmount.toLocaleString('id-ID'))
            .replace(/{{user}}/g, trx.user_name || 'Kasir');

        // Send Message
        if (whatsappService.getStatus().status === 'ready') {
            await whatsappService.sendMessage(null, phone, message); // shopId null for standalone
            console.log(`✅ Nota WA terkirim ke ${phone}`);
        }

        // Optional: Send to Kasir if template exists
        if (settings.wa_template_kasir) {
            // Usually sent to a fixed number or the sender themselves? 
            // For now just log it.
        }

    } catch (error) {
        console.error('❌ Error in sendInvoiceNotification:', error);
    }
};

/**
 * Send notification when status changes to 'proses'
 */
const sendProcessNotification = async (task) => {
    if (!task.customerPhone && !task.phone) return;
    const phone = task.customerPhone || task.phone;

    try {
        const db = await getActivePool();
        const settings = await getSettingsMap(db, ["wa_template_process"]);
        const template = settings.wa_template_process || 'Halo *{{name}}*, pesanan *#{{invoice}}* sedang dalam proses produksi/pengerjaan.';

        let message = template
            .replace(/{{name}}/g, task.customerName || 'Pelanggan')
            .replace(/{{invoice}}/g, task.id);

        if (whatsappService.getStatus().status === 'ready') {
            await whatsappService.sendMessage(null, phone, message);
            console.log(`✅ Update Proses WA terkirim ke ${phone}`);
        }
    } catch (error) {
        console.error('❌ Error in sendProcessNotification:', error);
    }
};

/**
 * Send notification when status changes to 'selesai'
 */
const sendDoneNotification = async (task) => {
    if (!task.customerPhone && !task.phone) return;
    const phone = task.customerPhone || task.phone;

    try {
        const db = await getActivePool();
        const settings = await getSettingsMap(db, ["wa_template_done"]);
        const template = settings.wa_template_done || 'Halo *{{name}}*, pesanan *#{{invoice}}* sudah selesai dan siap diambil. Silakan datang ke toko.';

        let message = template
            .replace(/{{name}}/g, task.customerName || 'Pelanggan')
            .replace(/{{invoice}}/g, task.id);

        if (whatsappService.getStatus().status === 'ready') {
            await whatsappService.sendMessage(null, phone, message);
            console.log(`✅ Update Selesai WA terkirim ke ${phone}`);
        }
    } catch (error) {
        console.error('❌ Error in sendDoneNotification:', error);
    }
};

const sendServiceNotification = async (service, type = 'received') => {
    if (!service.phone) return;

    try {
        const db = await getActivePool();
        const settings = await getSettingsMap(db, [
            "store_name", "store_address",
            "wa_template_inv", "wa_template_done"
        ]);

        const storeName = settings.store_name || 'Abadi Jaya Copier';
        const template = type === 'received' ? settings.wa_template_inv : settings.wa_template_done;

        if (!template) return;

        let message = template
            .replace(/{{name}}/g, service.customerName || 'Pelanggan')
            .replace(/{{invoice}}/g, service.service_no || service.id)
            .replace(/{{total}}/g, (service.total_cost || 0).toLocaleString('id-ID'));

        if (whatsappService.getStatus().status === 'ready') {
            await whatsappService.sendMessage(null, service.phone, message);
            console.log(`✅ Service WA (${type}) terkirim ke ${service.phone}`);
        }
    } catch (error) {
        console.error('❌ Error in sendServiceNotification:', error);
    }
};

const sendTelegramNotification = async (message, config = null) => {
    try {
        const db = await getActivePool();
        const settings = config || await getSettingsMap(db, ["telegram_bot_token", "telegram_chat_id", "telegram_enabled"]);

        const isEnabled = settings.telegram_enabled === 'true' || settings.telegram_enabled === true;
        if (!isEnabled && !config) return; // Only skip if not enabled AND no manual config
        
        const token = settings.telegram_bot_token;
        const chatId = settings.telegram_chat_id;

        if (!token || !chatId) {
            console.warn('⚠️ Telegram token or chat ID is missing');
            return;
        }


        const https = require('https');
        const postData = JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });

        const options = {
            hostname: 'api.telegram.org',
            path: `/bot${token}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ Notifikasi Telegram terkirim');
                } else {
                    console.error('❌ Gagal kirim Telegram (Status:', res.statusCode, '):', data);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Gagal kirim Telegram:', error.message);
        });

        req.write(postData);
        req.end();
    } catch (error) {
        console.error('❌ Error system Telegram:', error.message);
    }
};


const checkCriticalStock = async (db, productId) => {
    try {
        const [rows] = await db.query('SELECT name, stock, min_stock, unit FROM products WHERE id = ?', [productId]);
        if (rows.length === 0) return;

        const product = rows[0];
        if (product.stock <= product.min_stock) {
            const [settingsRes] = await db.query('SELECT value FROM settings WHERE `key` = "telegram_stok_kritis"');
            if (settingsRes.length > 0 && settingsRes[0].value === 'false') return;

            const message = `⚠️ <b>STOK KRITIS!</b>\n\nProduk: <b>${product.name}</b>\nStok Saat Ini: <b>${product.stock} ${product.unit}</b>\nBatas Minimum: <b>${product.min_stock} ${product.unit}</b>\n\n<i>Mohon segera lakukan pengadaan barang.</i>`;
            await sendTelegramNotification(message);
        }

    } catch (error) {
        console.error('❌ Error in checkCriticalStock:', error);
    }
};

const sendSecurityAlert = async (db, user) => {
    try {
        const [settingsRes] = await db.query('SELECT `key`, value FROM settings WHERE `key` IN ("telegram_bot_token", "telegram_chat_id", "telegram_enabled", "telegram_security_alert", "store_name")');
        const settings = {};
        settingsRes.forEach(s => { settings[s.key] = s.value; });

        if (settings.telegram_enabled === 'true' && settings.telegram_security_alert === 'true' && settings.telegram_bot_token && settings.telegram_chat_id) {
            const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
            const message = `🚨 <b>SECURITY ALERT: LOGIN DETECTED</b>\n\n` +
                `🏪 <b>Toko:</b> ${settings.store_name || 'Abadi Jaya POS'}\n` +
                `👤 <b>User:</b> ${user.name} (@${user.username})\n` +
                `🔑 <b>Role:</b> ${user.role}\n` +
                `⏰ <b>Waktu:</b> ${time}\n` +
                `🌐 <b>IP:</b> ${user.ip || 'Unknown'}\n\n` +
                `<i>Jika ini bukan Anda, segera hubungi tim IT!</i>`;

            await sendTelegramNotification(message, {
                telegram_bot_token: settings.telegram_bot_token,
                telegram_chat_id: settings.telegram_chat_id
            });
        }
    } catch (error) {
        console.error('❌ Error sending security alert:', error.message);
    }
};

const sendDailyReport = async (db, targetChatId = null) => {
    try {
        console.log('📊 Generating Daily Report...');
        // Get today's date in local time YYYY-MM-DD
        const today = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).split(' ')[0];
        console.log('📅 Target Date (Local):', today);

        const [rows] = await db.query(`
            SELECT 
                COUNT(*) as total_trx,
                SUM(total) as omset,
                SUM(paid) as cash_in
            FROM transactions 
            WHERE DATE(date) = ? AND status = 'paid'
        `, [today]);

        const [itemRows] = await db.query(`
            SELECT SUM(qty) as total_items 
            FROM transaction_details td
            JOIN transactions t ON td.transaction_id = t.id
            WHERE DATE(t.date) = ? AND t.status = 'paid'
        `, [today]);

        const data = rows[0] || { total_trx: 0, omset: 0, cash_in: 0 };
        const items = itemRows[0] || { total_items: 0 };
        const [settingsRes] = await db.query('SELECT value FROM settings WHERE `key` = "store_name"');
        const storeName = settingsRes[0]?.value || 'Abadi Jaya POS';

        const message = `📊 <b>LAPORAN PENJUALAN HARIAN</b>\n\n` +
            `🏪 <b>Toko:</b> ${storeName}\n` +
            `📅 <b>Tanggal:</b> ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `💰 <b>Total Omset:</b> Rp ${Number(data.omset || 0).toLocaleString('id-ID')}\n` +
            `📝 <b>Total Trx:</b> ${data.total_trx || 0} Transaksi\n` +
            `📦 <b>Item Terjual:</b> ${Number(items.total_items || 0)} pcs\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `✅ <i>Laporan dikirim secara manual/otomatis dari sistem.</i>`;

        console.log('📝 Message prepared, length:', message.length);

        if (targetChatId) {
            console.log('📤 Sending report to chatId:', targetChatId);
            const [tokenRes] = await db.query('SELECT value FROM settings WHERE `key` = "telegram_bot_token"');
            const token = tokenRes[0]?.value;
            if (!token) throw new Error('Telegram bot token not found');

            await sendTelegramNotification(message, { 
                telegram_bot_token: token, 
                telegram_chat_id: targetChatId,
                telegram_enabled: true 
            });
        } else {
            console.log('📤 Sending report to default chat ID');
            await sendTelegramNotification(message);
        }
    } catch (error) {
        console.error('❌ Error in sendDailyReport:', error);
    }
};

const sendStockReport = async (db, targetChatId = null) => {
    try {
        const [rows] = await db.query(`
            SELECT name, stock, min_stock, unit 
            FROM products 
            WHERE stock <= min_stock
            ORDER BY stock ASC
            LIMIT 10
        `);

        let message = '';
        if (rows.length === 0) {
            message = '✅ <b>LAPORAN STOK</b>\n\nSemua stok barang dalam kondisi aman. Tidak ada barang di bawah batas minimum.';
        } else {
            message = `⚠️ <b>LAPORAN STOK RENDAH</b>\n\nBerikut daftar barang yang butuh pengadaan:\n\n`;
            rows.forEach((p, i) => {
                message += `${i+1}. <b>${p.name}</b>\n   Stok: ${p.stock} ${p.unit} (Min: ${p.min_stock})\n`;
            });
            if (rows.length >= 10) message += `\n<i>...dan beberapa barang lainnya.</i>`;
        }

        if (targetChatId) {
            const [tokenRes] = await db.query('SELECT value FROM settings WHERE `key` = "telegram_bot_token"');
            await sendTelegramNotification(message, { 
                telegram_bot_token: tokenRes[0]?.value, 
                telegram_chat_id: targetChatId,
                telegram_enabled: true 
            });
        } else {
            await sendTelegramNotification(message);
        }
    } catch (error) {
        console.error('❌ Error sending stock report:', error.message);
    }
};


module.exports = {
    sendInvoiceNotification,
    sendProcessNotification,
    sendDoneNotification,
    sendServiceNotification,
    sendTelegramNotification,
    sendSecurityAlert,
    sendDailyReport,
    sendStockReport,
    checkCriticalStock
};


