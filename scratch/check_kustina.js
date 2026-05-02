const { masterPool } = require('./server/config/database');

async function checkKustina() {
    try {
        const [rows] = await masterPool.query(`
            SELECT c.name, 
                   COUNT(t.id) as total_trx,
                   SUM(CASE WHEN t.status IN ('paid', 'completed') THEN t.total ELSE t.paid END) as total_spend
            FROM customers c
            LEFT JOIN transactions t ON c.id = t.customer_id
            WHERE c.name LIKE '%Kustina%'
            GROUP BY c.id
        `);
        console.log(JSON.stringify(rows));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkKustina();
