const LicenseManager = require('./server/utils/licenseManager');
const hwid = LicenseManager.getHardwareId();
console.log('CURRENT HWID: ' + hwid);
