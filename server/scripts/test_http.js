const http = require('http');

http.get('http://localhost:5001/api/materials', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`Status /materials: ${res.statusCode}`);
        console.log(`Body:`, data);
    });
}).on('error', err => console.log('Materials Request Error:', err.message));

http.get('http://localhost:5001/api/products', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`Status /products: ${res.statusCode}`);
        console.log(`Body:`, data);
    });
}).on('error', err => console.log('Products Request Error:', err.message));
