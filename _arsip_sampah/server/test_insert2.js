const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'pos_abadi'
    });

    const connection = await pool.getConnection();
    try {
        const [users] = await connection.query('SELECT * FROM users LIMIT 1');
        if (users.length === 0) throw new Error("No users found");
        const user = users[0];

        await connection.beginTransaction();

        const invoiceNo = 'INV-TEST-002';
        let date = new Date().toISOString();
        const customerId = null;
        const customerName = 'Umum';
        const type = 'fotocopy';
        const subtotal = 500;
        const discount = 0;
        const total = 500;
        const paid = 500;
        const changeAmount = 0;
        const paymentType = 'tunai';
        const status = 'paid';
        const userId = user.id;
        const userName = user.name;
        // Mock a Fotocopy item like in PosPage
        const items = [{ id: null, name: "Print HVS A4", qty: 1, price: 500, subtotal: 500, discount: 0, source: 'fc' }];

        const newTrxId = 't' + Date.now();
        const mysqlDate = new Date(date).toISOString().slice(0, 19).replace('T', ' ');

        console.log("1. Insert Header");
        await connection.query(`
      INSERT INTO transactions 
      (id, invoice_no, date, customer_id, customer_name, user_id, user_name, type, subtotal, discount, total, paid, change_amount, payment_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [newTrxId, invoiceNo, mysqlDate, customerId, customerName, userId, userName, type, subtotal, discount, total, paid, changeAmount, paymentType, status]);

        console.log("2. Insert Detail");
        for (const item of items) {
            const detailId = 'td' + Date.now() + Math.floor(Math.random() * 1000);
            await connection.query(`
        INSERT INTO transaction_details 
        (id, transaction_id, product_id, name, qty, price, subtotal, discount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [detailId, newTrxId, item.id, item.name, item.qty, item.price, item.subtotal, item.discount]);
        }

        console.log("3. Insert Stock (Skip since fc)");
        console.log("4. Insert Cash Flow");
        if (status === 'paid' && paid > 0) {
            const cashFlowId = 'cf' + Date.now();
            await connection.query(`
        INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
        VALUES (?, ?, 'in', 'Penjualan', ?, ?, ?)
      `, [cashFlowId, date.split('T')[0], total, `Penjualan ${type} - ${invoiceNo}`, newTrxId]);
        }

        console.log("5. Insert Log");
        await connection.query('INSERT INTO activity_log (user_id, user_name, action, detail) VALUES (?, ?, ?, ?)',
            [userId, userName, 'add_transaction', `Invoice ${invoiceNo} (${total})`]);

        await connection.rollback(); // rollback so we don't pollute DB
        console.log('SUCCESS (rollback applied)');
    } catch (error) {
        await connection.rollback();
        console.error("SQL ERROR:", error.message);
    } finally {
        connection.release();
        pool.end();
    }
}

run();
