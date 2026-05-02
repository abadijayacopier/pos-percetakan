const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'admin',
        database: process.env.DB_NAME || 'pos_abadi'
    });

    try {
        const [t] = await conn.query('SELECT COUNT(*) as c FROM transactions');
        const [cf] = await conn.query('SELECT COUNT(*) as c FROM cash_flow');
        const [td] = await conn.query('SELECT COUNT(*) as c FROM transaction_details');
        console.log(`TRX:${t[0].c} CF:${cf[0].c} TD:${td[0].c}`);

        const [recent] = await conn.query('SELECT id, date, total, status FROM transactions ORDER BY date DESC LIMIT 3');
        recent.forEach(r => console.log(`  ${r.id} | ${r.date} | ${r.total} | ${r.status}`));

        const [rcf] = await conn.query('SELECT id, date, type, category, amount FROM cash_flow ORDER BY date DESC LIMIT 3');
        rcf.forEach(r => console.log(`  CF: ${r.date} | ${r.type} | ${r.category} | ${r.amount}`));

        const today = '2026-03-03';
        const [tt] = await conn.query('SELECT COUNT(*) as c, COALESCE(SUM(total),0) as s FROM transactions WHERE date LIKE ?', [today + '%']);
        console.log(`TODAY: ${tt[0].c} trx, total=${tt[0].s}`);

        const [tc] = await conn.query('SELECT COUNT(*) as c, COALESCE(SUM(CASE WHEN type="in" THEN amount ELSE 0 END),0) as income FROM cash_flow WHERE date = ?', [today]);
        console.log(`TODAY_CF: ${tc[0].c} entries, income=${tc[0].income}`);
    } finally {
        await conn.end();
    }
})();
