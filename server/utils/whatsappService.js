const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

class WhatsappService {
    constructor() {
        this.instances = new Map(); // Map of shopId -> { client, status, qr, info }
    }

    getChromePath() {
        if (process.platform !== 'win32') return null;
        
        const paths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            path.join(process.env.USERPROFILE || '', 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
            path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
        ];
        
        for (const p of paths) {
            if (fs.existsSync(p)) {
                console.log(`[WA] Found Chrome at: ${p}`);
                return p;
            }
        }
        console.warn('[WA] Chrome not found in standard Windows paths');
        return null;
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

        // Force cleanup if instance exists but stuck
        if (this.instances.has(shopId)) {
            const existing = this.instances.get(shopId);
            if (existing.status !== 'disconnected' && existing.status !== 'ready') {
                console.log(`Cleaning up existing stuck WA instance for shop ${shopId}...`);
                try {
                    if (existing.client) await existing.client.destroy();
                } catch (e) {
                    console.error('Error destroying stuck instance:', e);
                }
                this.instances.delete(shopId);
            } else if (existing.status === 'ready') {
                return; // Already good
            }
        }

        console.log(`[WA] Initializing WhatsApp Client for Shop: ${shopId}...`);
        
        const clientId = `tenant_${shopId}`;
        const sessionPath = path.join(__dirname, `../.wwebjs_auth/session-${clientId}`);
        
        console.log(`[WA] Session path: ${sessionPath}`);

        // FIX: Remove lock files if they exist (prevents stuck initialization on Windows)
        try {
            const lockFile = path.join(sessionPath, 'Default/parent.lock');
            if (fs.existsSync(lockFile)) {
                fs.unlinkSync(lockFile);
                console.log(`Removed stale lock file for shop ${shopId}`);
            }
        } catch (e) {}

        const instance = {
            client: null,
            qrCodeData: null,
            status: 'connecting',
            info: null
        };
        this.instances.set(shopId, instance);

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
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-software-rasterizer'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || this.getChromePath() || undefined
            },
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
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
            this.instances.delete(shopId);
        });

        instance.client.on('disconnected', (reason) => {
            console.log(`WhatsApp Client for Shop: ${shopId} logged out`, reason);
            instance.status = 'disconnected';
            instance.qrCodeData = null;
            instance.info = null;
            this.instances.delete(shopId);
        });

        try {
            await instance.client.initialize();
        } catch (error) {
            console.error(`Failed to initialize WA for Shop: ${shopId}:`, error);
            instance.status = 'disconnected';
            this.instances.delete(shopId);
        }
    }

    async reset(shopId) {
        console.log(`Resetting WhatsApp for Shop: ${shopId}...`);
        const instance = this.instances.get(shopId);
        if (instance && instance.client) {
            try {
                await instance.client.destroy();
            } catch (e) {}
        }
        this.instances.delete(shopId);

        const clientId = `tenant_${shopId}`;
        const sessionPath = path.join(__dirname, `../.wwebjs_auth/session-${clientId}`);
        
        if (fs.existsSync(sessionPath)) {
            try {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                console.log(`Cleared session data for shop ${shopId}`);
            } catch (e) {
                console.error(`Failed to clear session data for shop ${shopId}:`, e);
            }
        }
        return { success: true };
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
