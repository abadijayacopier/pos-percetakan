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
        res.status(500).json({ message: 'Gagal memuat laporan stok' });
    }
});

// 3. GET Tax Report (Laporan Pajak PPN)
router.get('/tax', verifyToken, async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        let query = `
            SELECT date, invoice_no, customer_name, subtotal, discount, tax_amount, total
            FROM transactions
            WHERE tax_amount > 0
        `;
        const params = [];

        if (dateFrom) {
            query += " AND date >= ?";
            params.push(`${dateFrom} 00:00:00`);
        }
        if (dateTo) {
            query += " AND date <= ?";
            params.push(`${dateTo} 23:59:59`);
        }

        query += " ORDER BY date DESC";

        const [rows] = await req.db.query(query, params);

        const summary = {
            total_subtotal: rows.reduce((s, r) => s + r.subtotal, 0),
            total_tax: rows.reduce((s, r) => s + r.tax_amount, 0),
            total_transactions: rows.length
        };

        res.json({ summary, details: rows });
    } catch (error) {
        console.error('Report Tax Error:', error);
        res.status(500).json({ message: 'Gagal memuat laporan pajak' });
    }
});

// 4. GET Salary Report (Laporan Penggajian)
router.get('/payroll', verifyToken, async (req, res) => {
    try {
        const { month, year } = req.query;
        let query = `
            SELECT s.*, e.name as employee_name, e.position
            FROM salaries s
            JOIN employees e ON s.employee_id = e.id
            WHERE s.status = 'paid'
        `;
        const params = [];

        if (month) {
            query += " AND s.period_month = ?";
            params.push(month);
        }
        if (year) {
            query += " AND s.period_year = ?";
            params.push(year);
        }

        query += " ORDER BY s.paid_at DESC";

        const [rows] = await req.db.query(query, params);

        const summary = {
            total_net_salary: rows.reduce((s, r) => s + r.net_salary, 0),
            total_loan_deductions: rows.reduce((s, r) => s + r.loan_deduction, 0),
            total_employees_paid: rows.length
        };

        res.json({ summary, details: rows });
    } catch (error) {
        console.error('Report Payroll Error:', error);
        res.status(500).json({ message: 'Gagal memuat laporan penggajian' });
    }
});

module.exports = router;
