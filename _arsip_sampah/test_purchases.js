async function testPurchase() {
    try {
        console.log("Login Admin...");
        let loginRes = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'password123' })
        });
        if (!loginRes.ok) {
            loginRes = await fetch('http://localhost:5001/api/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'admin', password: 'admin' })
            });
        }
        if (!loginRes.ok) {
            loginRes = await fetch('http://localhost:5001/api/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'admin', password: 'admin123' })
            });
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Login success, getting product...");

        const prodRes = await fetch('http://localhost:5001/api/products', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const prodData = await prodRes.json();
        const product = prodData[0];
        if (!product) {
            console.log("No product found!");
            return;
        }

        console.log("Submitting purchase payload...");
        const payload = {
            supplier_id: "",
            supplier_name: "Umum",
            date: new Date().toISOString().split('T')[0],
            payment_status: "lunas",
            notes: "Testing",
            total_amount: Number(product.buy_price || 15001),
            items: [
                {
                    type: "product",
                    id: product.id,
                    name: product.name,
                    qty: 1,
                    cost: Number(product.buy_price || 15001),
                    subtotal: Number(product.buy_price || 15001),
                    unit: product.unit || 'pcs'
                }
            ]
        };

        const purRes = await fetch('http://localhost:5001/api/purchases', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const purData = await purRes.json();
        if (!purRes.ok) {
            console.error("ERROR CAUGHT:");
            console.error(purData);
        } else {
            console.log("SUCCESS:", purData);
        }
    } catch (e) {
        console.error("EXCEPTION:", e.message);
    }
}

testPurchase();
