const { masterPool } = require('./server/config/database');
const fs = require('fs');

async function checkData() {
    try {
        const [trx] = await masterPool.query("SELECT id, invoice_no, customer_id, customer_name, total FROM transactions WHERE customer_name LIKE '%Kustina%'");
        const [cust] = await masterPool.query("SELECT id, name FROM customers WHERE name LIKE '%Kustina%'");
        
        const result = {
            transactions: trx,
            customers: cust
        };
        
        fs.writeFileSync('./scratch/debug_kustina.json', JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        fs.writeFileSync('./scratch/debug_kustina.json', JSON.stringify({error: error.message}, null, 2));
        process.exit(1);
    }
}

checkData();
