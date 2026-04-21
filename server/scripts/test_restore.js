const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const FormData = require('form-data');
const fetch = require('node-fetch'); // wait, node 24 has native fetch

async function testRestore() {
    try {
        const token = jwt.sign({ id: 1, role: 'admin', shopId: 1, subscriptionStatus: 'active' }, 'abadi_jaya_pos_secret_key_2025');
        const filePath = path.join(__dirname, '../database/db-config.json'); // Just upload any small file to test multer
        
        const fileContent = fs.readFileSync(filePath);
        
        const form = new FormData();
        form.append('backup', fileContent, 'test.backup');

        console.log('Sending restore request...');
        const res = await fetch('http://localhost:5001/api/settings/restore', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: form
        });

        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Response:', text);
    } catch (e) {
        console.error('Error:', e);
    }
}

testRestore();
