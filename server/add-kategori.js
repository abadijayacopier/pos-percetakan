const { pool } = require('./config/database');

async function migrate() {
    try {
        console.log("Adding 'kategori' column to 'spk' table...");
        await pool.query("ALTER TABLE spk ADD COLUMN kategori VARCHAR(50) DEFAULT 'Cetak Offset' AFTER product_unit;");
        console.log("Column added successfully!");

        // Let's set some existing ones to 'Digital Printing' if they have 'flexi' or 'banner' in specs_material
        await pool.query("UPDATE spk SET kategori = 'Digital Printing' WHERE product_name LIKE '%Banner%' OR product_name LIKE '%Stiker%' OR product_name LIKE '%Mmt%';");
        console.log("Existing rows updated tentatively.");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error("Migration Error:", err);
        }
    } finally {
        pool.end();
    }
}
migrate();
