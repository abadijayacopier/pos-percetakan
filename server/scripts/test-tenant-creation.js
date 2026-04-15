const TenantManager = require('../utils/tenantManager');
const { closeAllPools } = require('../config/database');

const testProvisioning = async () => {
    console.log('🧪 Starting Tenant Provisioning Test...');

    const timestamp = Date.now();
    const shopData = {
        shop_name: `Toko Test ${timestamp}`,
        subdomain: `test-shop-${timestamp}`,
        owner_email: `test-${timestamp}@example.com`
    };

    try {
        const result = await TenantManager.createTenant(shopData);
        console.log('🎉 Test Success!');
        console.log('Result:', result);
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    } finally {
        await closeAllPools();
        process.exit(0);
    }
};

testProvisioning();
