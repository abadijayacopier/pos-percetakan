const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// 1. GET Stock Movements (Mutasi Stok)
// Query params: dateFrom, dateTo, productId, categoryId
router.get('/stock-movements', verifyToken, async (req, res) => {
    try {
        const { dateFrom, dateTo, productId, categoryId } = req.query;
        let query = `
            SELECT sm.*, p.name as product_name, p.code as product_code, p.unit, 
                   c.name as category_name
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (dateFrom) {
            query += " AND sm.date >= ?";
            params.push(`${dateFrom} 00:00:00`);
        }
        if (dateTo) {
            query += " AND sm.date <= ?";
            params.push(`${dateTo} 23:59:59`);
        }
        if (productId) {
            query += " AND sm.product_id = ?";
            params.push(productId);
        }
        if (categoryId) {
            query += " AND p.category_id = ?";
            params.push(categoryId);
        }

        query += " ORDER BY sm.date DESC";

        const [rows] = await req.db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Report Inventory Movements Error:', error);
        res.status(500).json({ message: 'Gagal memuat laporan mutasi stok' });
    }
});

// 2. GET Stock Summary (Ringkasan Stok)
// Returns list of products with current stock and value
router.get('/stock-summary', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(`
            SELECT p.id, p.code, p.name, p.stock, p.unit, p.buy_price as buyPrice, p.sell_price as sellPrice,
                   p.min_stock as minStock, c.name as category_name,
                   (p.stock * p.buy_price) as total_buy_value,
                   (p.stock * p.sell_price) as total_sell_value
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY c.name ASC, p.name ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Report Stock Summary Error:', error);
        res.status(500).json({ message: 'Gagal memuat ringkasan stok' });
    }
});

module.exports = router;
