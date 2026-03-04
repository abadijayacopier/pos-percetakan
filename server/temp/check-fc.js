const { pool } = require('./config/database');
pool.query('SELECT * FROM fotocopy_prices').then(([rows]) => {
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
}).catch(console.error);
