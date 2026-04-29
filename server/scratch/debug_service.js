const { masterPool } = require('../config/database');
async function check() {
    try {
        const [rows] = await masterPool.query('SELECT id, status, customerName, machineInfo FROM service_orders WHERE status NOT IN ("diambil", "batal", "selesai")');
        console.log('--- DAFTAR SERVIS YANG NYANGKUT DI DASHBOARD ---');
        console.table(rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
