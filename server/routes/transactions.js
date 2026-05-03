const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sendInvoiceNotification, checkCriticalStock } = require('../utils/notificationHelper');

// 1. GET Semua Transaksi
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM transactions ORDER BY date DESC');
        console.log(`[Transactions] Found ${rows ? rows.length : 0} rows in DB`);

        const trxIds = rows ? rows.map(r => r.id) : [];
        let detailsMap = {};
        if (trxIds.length > 0) {
            const placeholders = trxIds.map(() => '?').join(',');
            const [details] = await req.db.query(
                `SELECT * FROM transaction_details WHERE transaction_id IN (${placeholders})`,
                trxIds
            );
            console.log(`[Transactions] Found ${details ? details.length : 0} details for ${trxIds.length} transactions`);
            
            if (details) {
                details.forEach(d => {
                    const trxId = d.transaction_id;
                    if (!detailsMap[trxId]) detailsMap[trxId] = [];
                    detailsMap[trxId].push({
                        productId: d.product_id,
                        name: d.name,
                        qty: d.qty,
                        price: d.price,
                        subtotal: d.subtotal,
                        discount: d.discount
                    });
                });
            }
        }

        const result = rows ? rows.map(t => ({
            ...t,
            invoiceNo: t.invoice_no || t.invoiceNo,
            invoiceNumber: t.invoice_no || t.invoiceNo,
            customerName: t.customer_name || t.customerName,
            customerPhone: t.customer_wa || t.customerPhone,
            userName: t.user_name || t.userName,
            paymentType: t.payment_type || t.paymentType,
            changeAmount: t.change_amount || t.changeAmount,
            paidAmount: t.paid || 0,
            createdAt: t.date,
            items: detailsMap[t.id] || []
        })) : [];
        
        console.log(`[Transactions] Sending ${result.length} mapped transactions to frontend`);
        res.json(result);
    } catch (error) {
        console.error('[Transactions] Error:', error);
        res.status(500).json({ message: 'Gagal mengambil data transaksi', error: error.message });
    }
});

// 1c. GET Transaksi Berdasarkan ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await req.db.query('SELECT * FROM transactions WHERE id = ? OR invoice_no = ?', [id, id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }

        const trx = rows[0];
        const [details] = await req.db.query('SELECT * FROM transaction_details WHERE transaction_id = ?', [trx.id]);
        
        const result = {
            ...trx,
            invoiceNo: trx.invoice_no || trx.invoiceNo,
            customerName: trx.customer_name || trx.customerName,
            customerWa: trx.customer_wa || trx.customerPhone,
            userName: trx.user_name || trx.userName,
            items: details.map(d => ({
                productId: d.product_id,
                name: d.name,
                qty: d.qty,
                price: d.price,
                subtotal: d.subtotal,
                discount: d.discount
            }))
        };
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil detail transaksi', error: error.message });
    }
});

// 1b. GET Transaksi Hari Ini
router.get('/history/today', verifyToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const [rows] = await req.db.query('SELECT * FROM transactions WHERE date LIKE ? ORDER BY date DESC', [`${today}%`]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat history hari ini' });
    }
});

// 2. GET Harga Fotocopy (SaaS Aware - Fallback to public if no auth? Actually, handled by verifyToken in other routes)
router.get('/fotocopy-prices', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM fotocopy_prices');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat harga' });
    }
});

// 2b. PUT Update Harga Fotocopy
router.put('/fotocopy-prices/:id', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    try {
        const { price } = req.body;
        await req.db.query('UPDATE fotocopy_prices SET price = ? WHERE id = ?', [price, req.params.id]);
        res.json({ message: 'Harga fotocopy diupdate!' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal update harga' });
    }
});

// 3. POST Transaksi Baru (POS Kasir / Checkout)
router.post('/', verifyToken, requireRole(['kasir', 'admin']), async (req, res) => {
    const connection = await req.db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            invoiceNo, date, customerId, customerName, type,
            subtotal, discount, total, paid, changeAmount, paymentType, status,
            items, customerWa, notes
        } = req.body;

        const newTrxId = 't' + Date.now();
        
        // Handle date: Use provided date or current time, adjusted for local timezone offset
        const dateObj = date ? new Date(date) : new Date();
        const offset = dateObj.getTimezoneOffset() * 60000;
        const mysqlDate = new Date(dateObj.getTime() - offset).toISOString().slice(0, 19).replace('T', ' ');

        // Fetch Tax Settings
        const [settingsRows] = await connection.query('SELECT value FROM settings WHERE `key` = "tax_enabled"');
        const [percentRows] = await connection.query('SELECT value FROM settings WHERE `key` = "tax_percentage"');
        const taxEnabled = settingsRows.length > 0 ? settingsRows[0].value === 'true' : false;
        const taxPercent = percentRows.length > 0 ? parseFloat(percentRows[0].value) : 11;

        let calculatedTax = 0;
        if (taxEnabled) {
            calculatedTax = Math.round((subtotal - (discount || 0)) * (taxPercent / 100));
        }

        // 3a. Insert Transaction Header
        const validCustomerId = (customerId && customerId !== 'null' && customerId !== 'undefined' && String(customerId).trim() !== '') ? customerId : null;

        const [trxResult] = await connection.query(`
            INSERT INTO transactions (id, invoice_no, date, customer_id, customer_name, customer_wa, user_id, user_name, type, subtotal, discount, tax_amount, total, paid, change_amount, payment_type, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [newTrxId, invoiceNo, mysqlDate, validCustomerId, customerName || 'Umum', customerWa || null, req.user.id, req.user.name, type, subtotal, discount, calculatedTax, total, paid, changeAmount, paymentType, status, notes]);

        // 3b. Insert Transaction Details & Update Stok
        for (const item of items) {
            const detailId = 'td' + Date.now() + Math.floor(Math.random() * 1000);

            const productId = (item.source === 'atk' && item.id && !String(item.id).startsWith('fc-') && !String(item.id).startsWith('jilid-') && !String(item.id).startsWith('print-') && !String(item.id).startsWith('dig-') && !String(item.id).startsWith('srv-'))
                ? item.id : null;

            await connection.query(`
        INSERT INTO transaction_details 
        (id, transaction_id, product_id, name, qty, price, subtotal, discount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [detailId, newTrxId, productId, item.name, item.qty, item.price, item.subtotal, item.discount || 0]);

            if (item.source === 'atk' && productId) {
                await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, productId]);
                await connection.query(`
          INSERT INTO stock_movements (product_id, type, qty, reference, notes) 
          VALUES (?, 'out', ?, ?, 'Penjualan POS')
        `, [productId, item.qty, invoiceNo]);
                
                // Trigger stock check after update
                checkCriticalStock(connection, productId).catch(err => console.error('Stock check error:', err));
            }

            // Digital Printing & Service Integration (Isolated per Tenant)
            if (item.type === 'digital') {
                const orderId = 'ORD-' + Date.now().toString().slice(-6);
                await connection.query(`
                    INSERT INTO dp_tasks (id, status, customerName, customerId, title, material_id, material_name, 
                    dimensions_w, dimensions_h, material_price, type, qty, is_paid)
                    VALUES(?, 'produksi', ?, ?, ?, ?, ?, ?, ?, ?, 'digital', ?, 1)
                `, [orderId, customerName || 'Umum', validCustomerId, item.name, item.meta?.materialId || null, item.name, item.meta?.width || null, item.meta?.height || null, (item.price / (item.qty || 1)), item.qty || 1]);
            }

            if (item.type === 'service_order') {
                const serviceNo = 'SVC-' + Date.now().toString().slice(-6);
                await connection.query(`
                    INSERT INTO service_orders (service_no, customer_id, customer_name, machine_info, complaint, total_cost, status, technician_id)
                    VALUES(?, ?, ?, ?, ?, ?, 'diterima', ?)
                `, [serviceNo, validCustomerId, customerName || 'Umum', item.meta?.device || 'Unknown Device', item.meta?.issue || 'No description', item.price, req.user.id]);
            }
        }

        // 3c. Cash Flow (Record actual income received, net of change)
        const actualIncome = Math.min(paid, total);
        if (actualIncome > 0) {
            const cashFlowId = 'cf' + Date.now();
            await connection.query(`
                INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
                VALUES (?, ?, 'in', 'Penjualan', ?, ?, ?)
            `, [cashFlowId, date.split('T')[0], actualIncome, `Penjualan ${type} - ${invoiceNo}`, newTrxId]);
        }

        // 3d. Customer sync
        if (customerId) {
            await connection.query('UPDATE customers SET total_trx = total_trx + 1, total_spend = total_spend + ? WHERE id = ?', [actualIncome, customerId]);
        }

        // 3e. Manual Activity Log (Robust Insertion)
        try {
            await connection.query(
                'INSERT INTO activity_log (user_id, user_name, action, target, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
                [req.user.id, req.user.name, 'ADD_TRANSACTION', 'Transaction', `Invoice ${invoiceNo} total ${total}`, req.ip || null]
            );
        } catch (logError) {
            console.error('⚠️ Failed to write activity log (transaction was still saved):', logError.message);
        }

        await connection.commit();
        sendInvoiceNotification({ id: newTrxId, invoice_no: invoiceNo, customer_name: customerName, customer_wa: customerWa, total, paid }, items);
        res.status(201).json({ message: 'Transaksi berhasil disimpan!', id: newTrxId });

    } catch (error) {
        await connection.rollback();
        console.error('Transaksi gagal:', error.message);
        res.status(500).json({ message: 'Gagal menyimpan transaksi: ' + error.message });
    } finally {
        connection.release();
    }
});

// 4. GET Detail Transaksi
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [trx] = await req.db.query(`
            SELECT id, invoice_no AS invoiceNo, date, customer_id AS customerId, customer_name AS customerName, user_name AS userName,
                   type, subtotal, discount, tax_amount as taxAmount, total, paid, change_amount AS changeAmount, payment_type AS paymentType, status, notes
            FROM transactions WHERE id = ?
        `, [req.params.id]);

        if (trx.length === 0) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

        const [items] = await req.db.query(`
            SELECT product_id AS productId, name, qty, price, subtotal, discount, CASE WHEN product_id IS NOT NULL THEN 'atk' ELSE 'fc' END as source
            FROM transaction_details WHERE transaction_id = ?
        `, [req.params.id]);

        res.json({ ...trx[0], items });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat detail transaksi' });
    }
});

// 5. Void Transaksi
router.delete('/:id', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    const connection = await req.db.getConnection();
    try {
        await connection.beginTransaction();

        const [items] = await connection.query('SELECT product_id, qty FROM transaction_details WHERE transaction_id = ? AND product_id IS NOT NULL', [req.params.id]);

        for (const item of items) {
            await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.qty, item.product_id]);
            await connection.query(`
                INSERT INTO stock_movements (product_id, type, qty, reference, notes) 
                VALUES (?, 'in', ?, ?, 'Void Transaksi POS')
             `, [item.product_id, item.qty, req.params.id]);
        }

        // Cancel related DP Tasks if any
        await connection.query('UPDATE dp_tasks SET status = "batal" WHERE customerName = (SELECT customer_name FROM transactions WHERE id = ?) AND status NOT IN ("selesai", "diambil")', [req.params.id]);

        await connection.query('DELETE FROM cash_flow WHERE reference_id = ?', [req.params.id]);
        await connection.query('DELETE FROM transaction_details WHERE transaction_id = ?', [req.params.id]);
        await connection.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
        await connection.query('INSERT INTO activity_log (user_id, user_name, action, target, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, req.user.name, 'delete_transaction', 'Transaction', `Hapus & Void TRX ${req.params.id}`, req.ip || null]);

        await connection.commit();
        res.json({ message: 'Transaksi berhasil dihapus dan stok dikembalikan!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Gagal menghapus transaksi' });
    } finally {
        connection.release();
    }
});

// 5b. Update Transaksi (Edit General)
router.put('/:id', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    try {
        const { customerName, paidAmount, paymentType, notes, status } = req.body;
        
        // Map frontend status 'Lunas'/'Cicil' to backend status 'paid'/'debt' if provided
        let dbStatus = status;
        if (status === 'Lunas') dbStatus = 'paid';
        if (status === 'Cicil') dbStatus = 'debt';

        await req.db.query(
            'UPDATE transactions SET customer_name = ?, paid = ?, payment_type = ?, notes = ?, status = COALESCE(?, status) WHERE id = ?',
            [customerName, paidAmount, paymentType, notes, dbStatus || null, req.params.id]
        );
        res.json({ message: 'Transaksi diupdate!' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal update transaksi' });
    }
});

// 6. Pelunasan
router.put('/:id/pay', verifyToken, async (req, res) => {
    const connection = await req.db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { paidAmount, paymentMethod, customerWa, notes } = req.body;

        const [trxArr] = await connection.query('SELECT * FROM transactions WHERE id = ?', [id]);
        if (trxArr.length === 0) throw new Error('Trx not found');
        const trx = trxArr[0];

        const newPaid = Number(trx.paid || 0) + Number(paidAmount);
        const newStatus = newPaid >= trx.total ? 'paid' : 'debt';

        await connection.query('UPDATE transactions SET paid = ?, payment_type = ?, status = ?, customer_wa = ?, notes = ? WHERE id = ?',
            [newPaid, paymentMethod, newStatus, customerWa || trx.customer_wa, notes || trx.notes, id]);

        const cashFlowId = 'cf' + Date.now();
        const todayDate = new Date().toISOString().slice(0, 10);
        await connection.query(`
            INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
            VALUES (?, ?, 'in', 'Penjualan', ?, ?, ?)
        `, [cashFlowId, todayDate, paidAmount, `Pelunasan ${trx.invoice_no || trx.id}`, id]);

        await connection.query('INSERT INTO activity_log (user_id, user_name, action, target, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, req.user.name, 'payment', 'Transaction', `Pelunasan ${trx.invoice_no || trx.id}: ${paidAmount} via ${paymentMethod}`, req.ip || null]);

        await connection.commit();
        res.json({ message: 'Pembayaran berhasil dicatat' });
    } catch (e) {
        if (connection) await connection.rollback();
        res.status(500).json({ message: 'Gagal mencatat pembayaran' });
    } finally {
        if (connection) connection.release();
    }
});

// 7. Batal Pelunasan (Admin Only)
router.put('/:id/cancel-settlement', verifyToken, requireRole(['admin']), async (req, res) => {
    const connection = await req.db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;

        const [trxArr] = await connection.query('SELECT * FROM transactions WHERE id = ?', [id]);
        if (trxArr.length === 0) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        const trx = trxArr[0];

        // Reset status ke debt dan nominal paid dikurangi (atau bisa juga ditanya nominalnya, tapi biasanya batal lunas itu reset ke sisa)
        // Disini kita set status ke 'debt' saja. Nominal paid tetap apa adanya agar admin bisa edit manual nominalnya di modal Edit.
        await connection.query('UPDATE transactions SET status = "debt" WHERE id = ?', [id]);

        await connection.query('INSERT INTO activity_log (user_id, user_name, action, target, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, req.user.name, 'cancel_payment', 'Transaction', `BATAL PELUNASAN (Admin) - Invoice ${trx.invoice_no || id}`, req.ip || null]);

        await connection.commit();
        res.json({ message: 'Status pelunasan berhasil dibatalkan!' });
    } catch (e) {
        if (connection) await connection.rollback();
        res.status(500).json({ message: 'Gagal membatalkan pelunasan' });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
