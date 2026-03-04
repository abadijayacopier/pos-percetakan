const { pool } = require('../config/database');

async function insertMissingPrices() {
    const missing = [
        { id: 'fc7', paper: 'HVS A3', color: 'bw', side: '2', price: 800, label: 'HVS A3 - B/W - Bolak-balik' },
        { id: 'fc8', paper: 'HVS A4', color: 'color', side: '2', price: 1500, label: 'HVS A4 - Warna - Bolak-balik' },
        { id: 'fc9', paper: 'HVS F4', color: 'color', side: '1', price: 1000, label: 'HVS F4 - Warna - 1 Sisi' },
        { id: 'fc10', paper: 'HVS F4', color: 'color', side: '2', price: 1500, label: 'HVS F4 - Warna - Bolak-balik' },
        { id: 'fc11', paper: 'HVS A3', color: 'color', side: '1', price: 2000, label: 'HVS A3 - Warna - 1 Sisi' },
        { id: 'fc12', paper: 'HVS A3', color: 'color', side: '2', price: 3000, label: 'HVS A3 - Warna - Bolak-balik' }
    ];

    for (const item of missing) {
        try {
            await pool.query(
                'INSERT IGNORE INTO fotocopy_prices (id, paper, color, side, price, label) VALUES (?, ?, ?, ?, ?, ?)',
                [item.id, item.paper, item.color, item.side, item.price, item.label]
            );
        } catch (e) { console.error('Error inserting', item.id, e); }
    }
    console.log('Inserted missing prices');
    process.exit(0);
}

insertMissingPrices();
