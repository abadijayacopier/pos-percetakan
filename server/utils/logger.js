const { pool } = require('../config/database');

/**
 * Log an activity to the database
 */
async function logActivity(userId, action, target, details, ip, userName = null) {
    try {
        const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;
        await pool.query(
            'INSERT INTO activity_log (user_id, user_name, action, target, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [userId || null, userName, action, target || null, detailsStr || null, ip || null]
        );
    } catch (err) {
        console.error('Failed to log activity:', err);
    }
}

/**
 * Check if product stock is low and log a warning if needed
 */
async function checkStockLevels(productId, connection = pool) {
    try {
        const [rows] = await connection.query(
            'SELECT name, stock, min_stock FROM products WHERE id = ?',
            [productId]
        );
        if (rows.length > 0) {
            const { name, stock, min_stock } = rows[0];
            if (stock <= min_stock) {
                console.log(`[ALERT] Stok Rendah: ${name} (Stok: ${stock}, Min: ${min_stock})`);
                // In a real scenario, integrate WA API here
                await logActivity(null, 'LOW_STOCK_ALERT', name, `Stok produk ${name} tersisa ${stock} ${rows[0].unit || ''}. Segera lakukan pengadaan.`, 'system');
            }
        }
    } catch (err) {
        console.error('Error checking stock levels:', err);
    }
}

module.exports = { logActivity, checkStockLevels };
