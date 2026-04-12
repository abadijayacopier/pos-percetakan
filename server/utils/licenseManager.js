const crypto = require('crypto');
const { execSync } = require('child_process');

class LicenseManager {
    constructor(secretKey) {
        this.secret = secretKey || process.env.JWT_SECRET || 'default_secret';
    }

    static getHardwareId() {
        try {
            const output = execSync('wmic bios get serialnumber', { encoding: 'utf8' });
            const serial = output.split('\n')[1]?.trim() || 'UNKNOWN';
            return crypto.createHash('md5').update(serial).digest('hex').toUpperCase();
        } catch (e) {
            return 'GLOBAL';
        }
    }

    generateLicense(client, expiry, hwid = 'GLOBAL', features = {}) {
        const feat = JSON.stringify(features);
        // Kita gunakan triple colon agar tidak bentrok dengan karakter umum
        const payload = [client, expiry, hwid, feat].join(':::');

        const signature = crypto
            .createHmac('sha256', this.secret)
            .update(payload)
            .digest('hex')
            .substring(0, 16);

        const full = payload + ':::' + signature;
        return Buffer.from(full).toString('base64');
    }

    verifyLicense(key) {
        try {
            const decoded = Buffer.from(key, 'base64').toString('ascii');
            const parts = decoded.split(':::');

            if (parts.length !== 5) {
                return { isValid: false, message: 'Format lisensi rusak' };
            }

            const [client, expiry, hwid, feat, signature] = parts;
            const payload = [client, expiry, hwid, feat].join(':::');

            const expected = crypto
                .createHmac('sha256', this.secret)
                .update(payload)
                .digest('hex')
                .substring(0, 16);

            if (signature !== expected) {
                return { isValid: false, message: 'Illegal Key (Signature Mismatch)' };
            }

            if (hwid !== 'GLOBAL' && hwid !== LicenseManager.getHardwareId()) {
                return { isValid: false, message: 'PC Tidak Terdaftar' };
            }

            if (new Date(expiry) < new Date()) {
                return { isValid: false, message: 'Lisensi Kadaluarsa' };
            }

            return { isValid: true, clientName: client, expiryDate: expiry, features: JSON.parse(feat), hwid };
        } catch (e) {
            return { isValid: false, message: 'Error: ' + e.message };
        }
    }
}

module.exports = LicenseManager;
