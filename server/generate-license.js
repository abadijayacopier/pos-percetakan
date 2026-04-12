const LicenseManager = require('./utils/licenseManager');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const [, , clientName, expiryDate, hardwareId, featureJson] = process.argv;

if (!clientName || !expiryDate) {
    console.log('\n❌ Input tidak lengkap.');
    process.exit(1);
}

const features = featureJson ? JSON.parse(featureJson) : {};
const manager = new LicenseManager(process.env.JWT_SECRET);
const key = manager.generateLicense(clientName, expiryDate, hardwareId || 'GLOBAL', features);

console.log('\n=============================================');
console.log('      POS ABADI JAYA - LICENSE GENERATOR      ');
console.log('=============================================');
console.log(`CLIENT   : ${clientName}`);
console.log(`EXPIRY   : ${expiryDate}`);
console.log(`HARDWARE : ${hardwareId || 'GLOBAL'}`);
console.log('---------------------------------------------');
console.log(`LICENSE  : ${key}`);
console.log('=============================================\n');
