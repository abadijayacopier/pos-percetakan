const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'server', 'database', 'pos.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Checking database:', dbPath);

db.all('SELECT COUNT(*) as count FROM transactions', [], (err, rows) => {
    if (err) {
        console.error('Error transactions:', err.message);
    } else {
        console.log('Transactions Count:', rows[0].count);
        db.all('SELECT * FROM transactions LIMIT 5', [], (err, data) => {
            if (err) console.error(err);
            else console.log('Sample Transactions:', JSON.stringify(data, null, 2));
            
            db.all('SELECT COUNT(*) as count FROM cash_flow', [], (err, rows) => {
                if (err) {
                    console.error('Error cash_flow:', err.message);
                } else {
                    console.log('Cash Flow Count:', rows[0].count);
                    db.all('SELECT * FROM cash_flow LIMIT 5', [], (err, data) => {
                        if (err) console.error(err);
                        else console.log('Sample Cash Flow:', JSON.stringify(data, null, 2));
                        db.close();
                    });
                }
            });
        });
    }
});
