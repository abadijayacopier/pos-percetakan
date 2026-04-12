const LicenseManager = require('./server/utils/licenseManager');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });

const manager = new LicenseManager(process.env.JWT_SECRET);
const clientName = 'Abadi Jaya Copier';
const expiryDate = '2027-12-31';
const hardwareId = '98CA9F09D7774C4834BACAF0E22D1B29';
const features = { maxTransactions: 9999 };

const key = manager.generateLicense(clientName, expiryDate, hardwareId, features);

console.log('--- LICENSE GENERATION ---');
console.log('CLIENT  : ' + clientName);
console.log('EXPIRY  : ' + expiryDate);
console.log('HWID    : ' + hardwareId);
console.log('FEATURES: ' + JSON.stringify(features));
console.log('KEY     : ' + key);
console.log('--------------------------');
