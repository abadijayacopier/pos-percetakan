const LicenseManager = require('./server/utils/licenseManager');
const manager = new LicenseManager('abadijaya_secret_key_2025'); // Hardcoded for test
const clientName = 'Abadi Jaya Copier';
const expiryDate = '2027-12-31';
const hardwareId = '98CA9F09D7774C4834BACAF0E22D1B29';
const features = { maxTransactions: 9999 };

const key = manager.generateLicense(clientName, expiryDate, hardwareId, features);

console.log('--- LICENSE GENERATION ---');
console.log('KEY: ' + key);
console.log('--------------------------');
