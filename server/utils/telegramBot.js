const https = require('https');
const { getActivePool } = require('../config/database');
const { sendDailyReport, sendStockReport, sendTelegramNotification } = require('./notificationHelper');

let lastUpdateId = 0;
let isPolling = false;
let isPollingStarted = false;
let pollingInterval = null;

/**
 * Fetch updates from Telegram API (Long Polling)
 */
const fetchUpdates = async (token) => {
    return new Promise((resolve, reject) => {
        const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
        
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.ok) {
                        resolve(response.result);
                    } else {
                        reject(new Error(response.description || 'Failed to fetch updates'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        
        // Set a socket timeout slightly longer than Telegram's timeout (30s)
        req.on('socket', (socket) => {
            socket.setTimeout(40000); 
            socket.on('timeout', () => {
                req.destroy();
                resolve([]); // Resolve with empty array on timeout to continue loop
            });
        });
    });
};


/**
 * Process a single command from Telegram
 */
const processCommand = async (chatId, text, db, token) => {
    const fullText = text || '';
    const cmd = fullText.toLowerCase().split(' ')[0];
    const args = fullText.split(' ').slice(1).join(' ');

    console.log(`🤖 Bot received command: ${cmd} from ${chatId}`);

    try {
        if (cmd === '/start' || cmd === '/help') {
            const msg = `👋 <b>Halo! Selamat Datang di Bot POS Abadi Jaya</b>\n\n` +
                `Saya adalah asisten pintar untuk memonitor bisnis Anda.\n\n` +
                `<b>Perintah yang tersedia:</b>\n` +
                `📊 /laporan - Cek omset hari ini\n` +
                `⚠️ /stok - Cek daftar barang stok rendah\n` +
                `💰 /harga [nama] - Cari harga barang\n` +
                `🆔 /id - Cek Chat ID saya\n\n` +
                `<i>Gunakan menu di bawah atau ketik perintah langsung.</i>`;
            await sendTelegramNotification(msg, { telegram_bot_token: token, telegram_chat_id: chatId, telegram_enabled: true });
        } 
        else if (cmd === '/laporan') {
            await sendDailyReport(db, chatId);
        } 
        else if (cmd === '/stok') {
            await sendStockReport(db, chatId);
        } 
        else if (cmd === '/harga') {
            if (!args) {
                await sendTelegramNotification('💡 Masukkan nama barang. Contoh: <code>/harga kertas</code>', { telegram_bot_token: token, telegram_chat_id: chatId, telegram_enabled: true });
                return;
            }

            // Split words for smarter search (ALL words must match)
            const searchWords = args.trim().split(/\s+/).filter(w => w.length > 0);
            let query = 'SELECT name, sell_price, stock, unit FROM products WHERE ';
            let params = [];
            
            if (searchWords.length > 0) {
                const nameConditions = searchWords.map(w => {
                    params.push(`%${w}%`);
                    return 'name LIKE ?';
                }).join(' AND ');
                
                query += `(${nameConditions}) OR code = ? LIMIT 5`;
                params.push(args.trim()); // Still check exact code match
            } else {
                query += 'name LIKE ? OR code LIKE ? LIMIT 5';
                params.push(`%${args}%`, `%${args}%`);
            }

            const [rows] = await db.query(query, params);

            if (rows.length === 0) {
                await sendTelegramNotification(`❌ Barang <b>"${args}"</b> tidak ditemukan.\n\n<i>Tips: Coba masukkan 1-2 kata kunci saja (misal: "buku tulis").</i>`, { telegram_bot_token: token, telegram_chat_id: chatId, telegram_enabled: true });
                return;
            }
            let msg = `🔍 <b>HASIL PENCARIAN HARGA</b>\n\n`;
            rows.forEach(p => {
                msg += `📦 <b>${p.name}</b>\n   Harga: <b>Rp ${p.sell_price.toLocaleString('id-ID')}</b>\n   Stok: ${p.stock} ${p.unit}\n\n`;
            });
            await sendTelegramNotification(msg, { telegram_bot_token: token, telegram_chat_id: chatId, telegram_enabled: true });
        } 
        else if (cmd === '/id') {
            await sendTelegramNotification(`🆔 Chat ID Anda: <code>${chatId}</code>`, { telegram_bot_token: token, telegram_chat_id: chatId, telegram_enabled: true });
        }
    } catch (e) {
        console.error('❌ Error processing command:', e.message);
    }
};

/**
 * Main loop for polling
 */
const startPolling = async () => {
    if (isPolling) return;
    isPolling = true;

    console.log('📡 Telegram Bot Polling started...');

    while (isPolling) {
        try {
            const db = await getActivePool();
            const [settingsRes] = await db.query('SELECT value FROM settings WHERE `key` = "telegram_bot_token"');
            const token = settingsRes[0]?.value;

            const [enabledRes] = await db.query('SELECT value FROM settings WHERE `key` = "telegram_enabled"');
            const isEnabled = enabledRes[0]?.value === 'true' || enabledRes[0]?.value === true;

            if (!token || !isEnabled) {
                if (!isPollingStarted) { // Add this flag to log only once
                    if (!token) console.warn('⚠️ Telegram Bot Token tidak ditemukan di database. Polling ditunda.');
                    if (!isEnabled) console.log('💤 Telegram Bot dinonaktifkan di pengaturan.');
                    isPollingStarted = true;
                }
                await new Promise(r => setTimeout(r, 60000)); // Wait longer (1 min) if disabled
                continue;
            }
            
            isPollingStarted = false; // Reset if it becomes active

            const updates = await fetchUpdates(token);
            
            // First run: skip old messages to avoid spamming
            if (lastUpdateId === 0 && updates.length > 0) {
                lastUpdateId = updates[updates.length - 1].update_id;
                console.log(`⏭️ Bot Online: Melewati ${updates.length} pesan lama.`);
                continue;
            }

            for (const update of updates) {
                lastUpdateId = update.update_id;
                if (update.message && update.message.text) {
                    await processCommand(update.message.chat.id, update.message.text, db, token);
                }
            }
        } catch (e) {
            console.error('⚠️ Telegram Polling Error:', e.message);
            await new Promise(r => setTimeout(r, 5000)); 
        }
    }
};


const stopPolling = () => {
    isPolling = false;
};

module.exports = { startPolling, stopPolling };
