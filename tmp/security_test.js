async function testSecurity() {
    const baseUrl = 'http://localhost:5001/api';
    console.log('--- Testing API Security (Unauthorized) ---');

    const endpoints = [
        { method: 'GET', url: '/finance' },
        { method: 'POST', url: '/finance' },
        { method: 'GET', url: '/users' },
        { method: 'POST', url: '/purchases' },
        { method: 'PATCH', url: '/spk/some-id/status' }
    ];

    for (const ep of endpoints) {
        try {
            const res = await fetch(`${baseUrl}${ep.url}`, { method: ep.method });
            if (res.status === 401) {
                console.log(`✅ PASS: ${ep.method} ${ep.url} is protected (401 Unauthorized)`);
            } else if (res.ok) {
                console.log(`❌ FAIL: ${ep.method} ${ep.url} should be protected but returned ${res.status}`);
            } else {
                console.log(`⚠️ WARN: ${ep.method} ${ep.url} returned status ${res.status}`);
            }
        } catch (error) {
            console.log(`⚠️ ERR: ${ep.method} ${ep.url} connection error: ${error.message}`);
        }
    }
}

testSecurity();
