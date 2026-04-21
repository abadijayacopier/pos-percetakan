const mysqldump = require('mysqldump');
const path = require('path');

async function test() {
    await mysqldump({
        connection: { host: '127.0.0.1', user: 'root', password: 'admin', database: 'pos_abadi' },
        dumpToFile: path.join(__dirname, '../temp/backup_test2.sql'),
        dump: {
            schema: {
                table: {
                    dropIfExist: true
                }
            }
        }
    });
    console.log('done');
}
test();
