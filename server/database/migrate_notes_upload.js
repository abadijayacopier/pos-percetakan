require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/database');

async function migrate() {
    console.log('Starting design assignments notes & upload migration...');

    try {
        console.log('Adding file_hasil_desain column to design_assignments...');
        await pool.query(`
            ALTER TABLE design_assignments 
            ADD COLUMN file_hasil_desain VARCHAR(500) NULL AFTER catatan
        `);
        console.log('Column file_hasil_desain added successfully.');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column file_hasil_desain already exists.');
        } else {
            console.error('Migration error:', err.message);
            throw err;
        }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
}

migrate();
