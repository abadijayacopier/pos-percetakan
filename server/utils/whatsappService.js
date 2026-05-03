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
            path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
        ];
        
        for (const p of paths) {
            if (fs.existsSync(p)) {
                console.log(`[WA] Found Browser at: ${p}`);
                this.logDebug(`Found Browser at: ${p}`);
                return p;
            }
        }
        this.logDebug('No Browser found in standard paths');
        return null;
    }

    logDebug(message) {
        const logPath = path.join(__dirname, '../wa_debug.log');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
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
        this.logDebug(`Initializing WA for shop: ${shopId}`);
        
        const clientId = `tenant_${shopId}`;
        const sessionPath = path.join(__dirname, `../.wwebjs_auth/session-${clientId}`);
        
        console.log(`[WA] Session path: ${sessionPath}`);
        this.logDebug(`Session path: ${sessionPath}`);

        // FIX: Remove lock files if they exist (prevents stuck initialization on Windows)
        try {
            const lockFiles = [
                path.join(sessionPath, 'Default/parent.lock'),
                path.join(sessionPath, 'SingletonLock'),
                path.join(sessionPath, 'SingletonSocket'),
                path.join(sessionPath, 'SingletonCookie'),
                path.join(sessionPath, 'lockfile')
            ];
            lockFiles.forEach(file => {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                    console.log(`Removed stale lock file: ${file}`);
                    this.logDebug(`Removed stale lock file: ${file}`);
                }
            });
        } catch (e) {
            this.logDebug(`Error clearing locks: ${e.message}`);
        }

        const instance = {
            client: null,
            qrCodeData: null,
            status: 'connecting',
            info: null
        };
        this.instances.set(shopId, instance);

        const browserPath = process.env.PUPPETEER_EXECUTABLE_PATH || this.getChromePath();
        this.logDebug(`Using Browser Path: ${browserPath || 'Puppeteer Default'}`);

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
                    '--disable-software-rasterizer',
                    '--ignore-certificate-errors',
                    '--no-default-browser-check',
                    '--disable-infobars',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--window-size=1280,720'
                ],
                executablePath: browserPath || undefined,
                handleSIGINT: false,
                handleSIGTERM: false,
                handleSIGHUP: false
            },
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
            }
        });


        instance.client.on('loading_screen', (percent, message) => {
            console.log(`[WA] Shop ${shopId} Loading: ${percent}% - ${message}`);
            this.logDebug(`Loading Shop ${shopId}: ${percent}% - ${message}`);
            instance.status = 'loading';
        });

        instance.client.on('qr', async (qr) => {
            console.log(`QR Received for Shop: ${shopId}`);
            this.logDebug(`QR Received for Shop: ${shopId}`);
            instance.status = 'qr';
            instance.qrCodeData = await qrcode.toDataURL(qr);
        });

        instance.client.on('ready', () => {
            console.log(`WhatsApp Client for Shop: ${shopId} is ready!`);
            this.logDebug(`WA for shop ${shopId} is ready!`);
            instance.status = 'ready';
            instance.qrCodeData = null;
            instance.info = instance.client.info;
        });

        instance.client.on('authenticated', () => {
            console.log(`WhatsApp Client for Shop: ${shopId} authenticated`);
            this.logDebug(`WA for shop ${shopId} authenticated`);
            instance.status = 'authenticated';
        });

        instance.client.on('auth_failure', (msg) => {
            console.error(`WhatsApp Auth failure for Shop: ${shopId}:`, msg);
            this.logDebug(`Auth Failure for shop ${shopId}: ${msg}`);
            instance.status = 'disconnected';
            this.instances.delete(shopId);
        });

        instance.client.on('disconnected', (reason) => {
            console.log(`WhatsApp Client for Shop: ${shopId} logged out`, reason);
            this.logDebug(`Disconnected shop ${shopId}: ${reason}`);
            instance.status = 'disconnected';
            instance.qrCodeData = null;
            instance.info = null;
            this.instances.delete(shopId);
        });

        instance.client.on('error', (err) => {
            console.error(`[WA Error] Shop ${shopId}:`, err);
            this.logDebug(`Client Error for shop ${shopId}: ${err.message}`);
        });


        try {
            this.logDebug('Starting initialization...');
            await instance.client.initialize();
            this.logDebug('Initialization call finished');
        } catch (error) {
            console.error(`Failed to initialize WA for Shop: ${shopId}:`, error);
            this.logDebug(`Initialization ERROR: ${error.message}`);
            instance.status = 'disconnected';
            this.instances.delete(shopId);
        }

    }

    async reset(shopId) {
        console.log(`Resetting WhatsApp for Shop: ${shopId}...`);
        const instance = this.instances.get(shopId);
        this.logDebug(`Resetting WA for shop: ${shopId}`);
        const clientId = `tenant_${shopId}`;
        const sessionPath = path.join(__dirname, `../.wwebjs_auth/session-${clientId}`);
        
        if (this.instances.has(shopId)) {
            const instance = this.instances.get(shopId);
            try {
                this.logDebug('Destroying existing client...');
                await instance.client.destroy();
            } catch (e) {
                this.logDebug(`Error destroying client: ${e.message}`);
            }
            this.instances.delete(shopId);
        }

        if (fs.existsSync(sessionPath)) {
            this.logDebug(`Deleting session path: ${sessionPath}`);
            try {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                console.log(`Cleared session data for shop ${shopId}`);
            } catch (e) {
                this.logDebug(`Error deleting session path: ${e.message}`);
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
