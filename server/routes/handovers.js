const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM handovers ORDER BY handover_date DESC');
        const mapped = rows.map(r => ({
            id: r.id,
            transactionId: r.transaction_id,
            invoiceNo: r.invoice_no,
            customerName: r.customer_name,
            receiverName: r.receiver_name,
            receiverPhone: r.receiver_phone,
            notes: r.notes,
            handoverDate: r.handover_date,
            handoverBy: r.handover_by
        }));
        res.json(mapped);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        const { transactionId, invoiceNo, customerName, receiverName, receiverPhone, notes, handoverDate, handoverBy } = req.body;

        await req.db.query(`
            INSERT INTO handovers (
                transaction_id, invoice_no, customer_name, receiver_name, 
                receiver_phone, notes, handover_date, handover_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [transactionId, invoiceNo, customerName, receiverName, receiverPhone, notes, new Date(handoverDate), handoverBy]);

        res.status(201).json({ message: 'Handover created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
