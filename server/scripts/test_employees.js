const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

async function test() {
    const token = jwt.sign({ id: 1, role: 'admin', shopId: 1, subscriptionStatus: 'active' }, 'abadi_jaya_pos_secret_key_2025');
    
    try {
        const res1 = await fetch('http://localhost:5001/api/employees', { headers: { 'Authorization': 'Bearer ' + token }});
        console.log('GET /employees:', res1.status, await res1.text());

        const res2 = await fetch('http://localhost:5001/api/payroll/salaries', { headers: { 'Authorization': 'Bearer ' + token }});
        console.log('GET /payroll/salaries:', res2.status, await res2.text());
    } catch (e) {
        console.error(e);
    }
}
test();
