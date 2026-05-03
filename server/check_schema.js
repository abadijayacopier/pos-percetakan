const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/pos.sqlite');

db.all("PRAGMA table_info(spk)", [], (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('--- Columns in spk ---');
    console.table(rows);
    
    db.all("PRAGMA table_info(service_orders)", [], (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('--- Columns in service_orders ---');
        console.table(rows);
        db.close();
    });
});
