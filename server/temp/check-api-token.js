const http = require('http');

const opt = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
};

const req = http.request(opt, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const body = JSON.parse(data);
        const token = body.token;
        if (!token) return console.log('Login failed:', body);

        console.log('Got token');

        ['/api/products', '/api/products/categories', '/api/suppliers'].forEach(path => {
            http.get({
                hostname: 'localhost',
                port: 5000,
                path,
                headers: { 'Authorization': 'Bearer ' + token }
            }, (r) => {
                let d = '';
                r.on('data', c => d += c);
                r.on('end', () => {
                    console.log(path, r.statusCode, d.substring(0, 100));
                });
            });
        });
    });
});

req.write(JSON.stringify({ username: 'admin', password: '123' }));
req.end();
