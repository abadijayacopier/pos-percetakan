const mysqldump = require('../server/node_modules/mysqldump').default;
const path = require('path');

const dest = path.join(__dirname, '..', 'db_pos_abadi.sql');

console.log('Mengekspor database pos_abadi ke', dest);

mysqldump({
    connection: {
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'pos_abadi'
    },
    dumpToFile: dest
}).then(() => {
    console.log('✓ Backup berhasil disimpan ke:', dest);
    process.exit(0);
}).catch(e => {
    console.error('✗ GAGAL:', e.message);
    process.exit(1);
});
