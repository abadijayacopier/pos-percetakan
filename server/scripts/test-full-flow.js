const axios = require('axios');

const testRegistrationFlow = async () => {
    console.log('🧪 Starting Shop Registration & Login Flow Test...');
    const API_URL = 'http://localhost:5001/api/auth';
    const timestamp = Date.now();

    const registrationData = {
        shopName: `Coffee Lab ${timestamp}`,
        subdomain: `coffee-${timestamp}`,
        ownerEmail: `owner-${timestamp}@coffeelab.com`,
        adminPassword: 'password123'
    };

    try {
        // 1. Register Shop
        console.log('📡 Step 1: Registering Shop...');
        const regRes = await axios.post(`${API_URL}/register-shop`, registrationData);
        console.log('✅ Registration Success:', regRes.data);
        const { shopId } = regRes.data;

        // 2. Login
        console.log('\n📡 Step 2: Logging in as Owner...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            username: registrationData.ownerEmail,
            password: registrationData.adminPassword,
            shopId: shopId
        });
        console.log('✅ Login Success:', loginRes.data);
        const { token } = loginRes.data;

        // 3. Test a Protected Route (e.g. Activity Logs) 
        // This will test verifyToken + selectTenant
        console.log('\n📡 Step 3: Accessing Protected Route (Testing Tenant Injection)...');
        const authHeader = { Authorization: `Bearer ${token}` };
        const healthRes = await axios.get('http://localhost:5001/api/health/db-status', { headers: authHeader });
        console.log('✅ Protected Route Success:', healthRes.data);

        console.log('\n🎉 ALL TESTS PASSED!');
    } catch (error) {
        console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
    }
};

testRegistrationFlow();
