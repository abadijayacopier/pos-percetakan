const { masterPool } = require('./server/config/database');

async function fixData() {
    try {
        console.log('Checking for inconsistent cash flow entries...');
        
        // 1. Find inconsistencies
        const [rows] = await masterPool.query(`
            SELECT cf.id, cf.amount as cf_amount, t.total as trx_total, t.paid as trx_paid, t.invoice_no
            FROM cash_flow cf
            JOIN transactions t ON cf.reference_id = t.id
            WHERE cf.category = 'Penjualan' 
            AND cf.amount > t.total 
            AND t.status IN ('paid', 'completed')
        `);
        
        console.log(`Found ${rows.length} inconsistent entries.`);
        
        if (rows.length > 0) {
            console.log('Sample inconsistencies:');
            rows.forEach(r => {
                console.log(`Invoice: ${r.invoice_no}, CF Amount: ${r.cf_amount}, Trx Total: ${r.trx_total}`);
            });
            
            // 2. Fix them
            const [result] = await masterPool.query(`
                UPDATE cash_flow cf
                JOIN transactions t ON cf.reference_id = t.id
                SET cf.amount = t.total
                WHERE cf.category = 'Penjualan' 
                AND cf.amount > t.total 
                AND t.status IN ('paid', 'completed')
            `);
            
            console.log(`Fixed ${result.affectedRows} entries.`);
        }

        // 3. Check for missed pending transactions (if any)
        // (Optional: but good for consistency)
        
        console.log('Done.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixData();
