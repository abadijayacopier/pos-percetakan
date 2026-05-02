const axios = require('axios');

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:5001/api/auth/login', {
            username: 'admin',
            password: 'admin123',
            shopId: 'abadi-jaya'
        });
        console.log('RESPONSE:', response.data);
    } catch (error) {
        console.error('ERROR:', error.response?.data || error.message);
    }
}

testLogin();
