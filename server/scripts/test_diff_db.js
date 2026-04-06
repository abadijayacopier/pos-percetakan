const mysql = require('mysql2/promise');

const testNoPass = async () => {
    try {
        console.log("Connecting with NO password...");
        const pool = mysql.createPool({
            host: '127.0.0.1',
            user: 'root',
            password: '',
            database: 'pos_abadi'
        });

        const [cols] = await pool.query("SHOW COLUMNS FROM materials");
        console.log("SUCCESS NO PASS!");
        cols.forEach(c => console.log(c.Field));
        process.exit(0);

    } catch (e) {
        console.log("NO PASS FAILED:", e.message);
    }

    try {
        console.log("\nConnecting with password 'admin'...");
        const pool2 = mysql.createPool({
            host: '127.0.0.1',
            user: 'root',
            password: 'admin',
            database: 'pos_abadi'
        });

        const [cols2] = await pool2.query("SHOW COLUMNS FROM materials");
        console.log("SUCCESS ADMIN PASS!");
        cols2.forEach(c => console.log(c.Field));
        process.exit(0);
    } catch (e) {
        console.log("ADMIN PASS FAILED:", e.message);
    }
}

testNoPass();
