const { pool } = require('../config/database');

const run = async () => {
    try {
        const [columns] = await pool.query("SHOW COLUMNS FROM materials");
        console.log("Columns in materials table:");
        columns.forEach(c => console.log(`- ${c.Field} (${c.Type})`));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
