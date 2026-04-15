const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

class WhatsappService {
    constructor() {
        this.instances = new Map(); // Map of shopId -> { client, status, qr, info }
    }

    formatPhoneNumber(number) {
        if (!number) return null;
        let cleaned = number.replace(/\D/g, '');
        if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
        if (!cleaned.endsWith('@c.us')) cleaned += '@c.us';
        return cleaned;
    }

    async init(shopId) {
        if (!shopId) throw new Error('shopId is required');

        // If already initializing or ready, skip
        if (this.instances.has(shopId)) {
            const instance = this.instances.get(shopId);
            if (instance.status !== 'disconnected') return;
        }

        console.log(`Initializing WhatsApp Client for Shop: ${shopId}...`);

        const instance = {
            client: null,
            qrCodeData: null,
            status: 'connecting',
            info: null
        };
        this.instances.set(shopId, instance);

        const clientId = `tenant_${shopId}`;
        const dataPath = path.join(__dirname, `../.wwebjs_auth/${clientId}`);

        // Ensure directory exists
        if (!fs.existsSync(dataPath)) {
            fs.mkdirSync(dataPath, { recursive: true });
        }

        instance.client = new Client({
            authStrategy: new LocalAuth({
                clientId: clientId,
                dataPath: path.join(__dirname, '../.wwebjs_auth')
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ],
            }
        });

        instance.client.on('qr', async (qr) => {
            console.log(`QR Received for Shop: ${shopId}`);
            instance.status = 'qr';
            instance.qrCodeData = await qrcode.toDataURL(qr);
        });

        instance.client.on('ready', () => {
            console.log(`WhatsApp Client for Shop: ${shopId} is ready!`);
            instance.status = 'ready';
            instance.qrCodeData = null;
            instance.info = instance.client.info;
        });

        instance.client.on('authenticated', () => {
            console.log(`WhatsApp Client for Shop: ${shopId} authenticated`);
            instance.status = 'authenticated';
        });

        instance.client.on('auth_failure', (msg) => {
            console.error(`WhatsApp Auth failure for Shop: ${shopId}:`, msg);
            instance.status = 'disconnected';
        });

        instance.client.on('disconnected', (reason) => {
            console.log(`WhatsApp Client for Shop: ${shopId} logged out`, reason);
            instance.status = 'disconnected';
            instance.qrCodeData = null;
            instance.info = null;
        });

        try {
            await instance.client.initialize();
        } catch (error) {
            console.error(`Failed to initialize WA for Shop: ${shopId}:`, error);
            instance.status = 'disconnected';
        }
    }

    getStatus(shopId) {
        const instance = this.instances.get(shopId);
        if (!instance) return { status: 'disconnected', qr: null, info: null };

        return {
            status: instance.status,
            qr: instance.qrCodeData,
            info: instance.info ? {
                pushname: instance.info.pushname,
                wid: instance.info.wid
            } : null
        };
    }

    async sendMessage(shopId, to, message) {
        const instance = this.instances.get(shopId);
        if (!instance || instance.status !== 'ready') {
            throw new Error(`WhatsApp client for shop ${shopId} is not ready`);
        }

        const formattedTo = this.formatPhoneNumber(to);
        if (!formattedTo) throw new Error('Nomor tujuan tidak valid');

        return await instance.client.sendMessage(formattedTo, message);
    }

    async logout(shopId) {
        const instance = this.instances.get(shopId);
        if (instance && instance.client) {
            await instance.client.logout();
            instance.status = 'disconnected';
            instance.qrCodeData = null;
            instance.info = null;
        }
    }
}

module.exports = new WhatsappService();
