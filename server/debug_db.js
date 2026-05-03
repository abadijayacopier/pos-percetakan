const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/pos.sqlite');

db.all("SELECT * FROM design_assignments WHERE status IN ('ditugaskan', 'dikerjakan')", [], (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('--- Assignments ---');
    console.table(rows);
    
    db.all("SELECT id, status, customerName FROM dp_tasks LIMIT 10", [], (err, tasks) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('--- Tasks ---');
        console.table(tasks);
        db.close();
    });
});
