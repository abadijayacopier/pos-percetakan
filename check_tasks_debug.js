const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database', 'pos.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- DP TASKS ---');
db.all("SELECT id, status, type, title FROM dp_tasks WHERE status NOT IN ('selesai', 'batal', 'diambil')", [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.table(rows);
    }

    console.log('\n--- DESIGN ASSIGNMENTS ---');
    db.all(`
        SELECT da.id, da.task_id, da.status as assignment_status, dt.status as task_status, dt.type, dt.title
        FROM design_assignments da
        LEFT JOIN dp_tasks dt ON da.task_id = dt.id
        WHERE da.status != 'selesai'
    `, [], (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.table(rows);
        }
        db.close();
    });
});
