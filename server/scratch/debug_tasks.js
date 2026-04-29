const { masterPool } = require('../config/database');
async function check() {
    try {
        const [rows] = await masterPool.query('SELECT id, status, title, customerName, type FROM dp_tasks WHERE status NOT IN ("diambil", "batal")');
        console.log('--- DAFTAR TUGAS YANG NYANGKUT DI DASHBOARD ---');
        console.table(rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
