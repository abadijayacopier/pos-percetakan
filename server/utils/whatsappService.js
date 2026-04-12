const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');

class WhatsappService {
    constructor() {
        this.client = null;
        this.qrCodeData = null;
        this.status = 'disconnected'; // disconnected, connecting, qr, ready, authenticated
        this.info = null;
    }

    formatPhoneNumber(number) {
        if (!number) return null;
        // Hapus karakter non-digit
        let cleaned = number.replace(/\D/g, '');
        // Jika diawali 0, ganti dengan 62
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        }
        // Pastikan berakhiran @c.us
        if (!cleaned.endsWith('@c.us')) {
            cleaned += '@c.us';
        }
        return cleaned;
    }

    async init() {
        if (this.client) return;

        console.log('Initializing WhatsApp Client...');
        this.status = 'connecting';

        this.client = new Client({
            authStrategy: new LocalAuth({
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

        this.client.on('qr', async (qr) => {
            console.log('QR Received');
            this.status = 'qr';
            this.qrCodeData = await qrcode.toDataURL(qr);
        });

        this.client.on('ready', () => {
            console.log('WhatsApp Client is ready!');
            this.status = 'ready';
            this.qrCodeData = null;
            this.info = this.client.info;
        });

        this.client.on('authenticated', () => {
            console.log('WhatsApp Client authenticated');
            this.status = 'authenticated';
        });

        this.client.on('auth_failure', (msg) => {
            console.error('WhatsApp Authentication failure:', msg);
            this.status = 'disconnected';
        });

        this.client.on('disconnected', (reason) => {
            console.log('WhatsApp Client was logged out', reason);
            this.status = 'disconnected';
            this.qrCodeData = null;
            this.info = null;
        });

        try {
            await this.client.initialize();
        } catch (error) {
            console.error('Failed to initialize WhatsApp client:', error);
            this.status = 'disconnected';
        }
    }

    getStatus() {
        return {
            status: this.status,
            qr: this.qrCodeData,
            info: this.info ? {
                pushname: this.info.pushname,
                wid: this.info.wid
            } : null
        };
    }

    async sendMessage(to, message) {
        if (this.status !== 'ready') {
            throw new Error('WhatsApp client is not ready');
        }

        const formattedTo = this.formatPhoneNumber(to);
        if (!formattedTo) throw new Error('Nomor tujuan tidak valid');

        return await this.client.sendMessage(formattedTo, message);
    }

    async logout() {
        if (this.client) {
            await this.client.logout();
            this.status = 'disconnected';
            this.qrCodeData = null;
            this.info = null;
        }
    }
}

module.exports = new WhatsappService();
