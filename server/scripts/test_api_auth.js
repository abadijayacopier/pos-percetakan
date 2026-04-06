const axios = require('axios');

const testApi = async () => {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });

        const token = loginRes.data.token;
        console.log('Login success! Fetching materials...');

        try {
            const matRes = await axios.get('http://localhost:5001/api/materials', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Materials fetch SUCCESS! Rows:', matRes.data.length);
        } catch (e) {
            console.log('Materials fetch FAILED with status', e.response?.status);
            console.log('Error data:', JSON.stringify(e.response?.data, null, 2));
        }

    } catch (err) {
        console.error('Fatal API test error:', err.response?.data || err.message);
    }
};

testApi();
