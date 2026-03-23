const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// 1. GET Semua Transaksi
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
        // Ambil semua detail items sekaligus
        const trxIds = rows.map(r => r.id);
        let detailsMap = {};
        if (trxIds.length > 0) {
            const [details] = await pool.query(
                'SELECT * FROM transaction_details WHERE transaction_id IN (?)',
                [trxIds]
            );
            details.forEach(d => {
                if (!detailsMap[d.transaction_id]) detailsMap[d.transaction_id] = [];
                detailsMap[d.transaction_id].push({
                    productId: d.product_id,
                    name: d.name,
                    qty: d.qty,
                    price: d.price,
                    subtotal: d.subtotal,
                    discount: d.discount
                });
            });
        }
        // Gabungkan items ke setiap transaksi dan map key database (snake_case) ke frontend (camelCase)
        const result = rows.map(t => ({
            ...t,
            invoiceNo: t.invoice_no || t.invoiceNo,
            customerName: t.customer_name || t.customerName,
            userName: t.user_name || t.userName,
            paymentType: t.payment_type || t.paymentType,
            changeAmount: t.change_amount || t.changeAmount,
            items: detailsMap[t.id] || []
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data transaksi', error: error.message });
    }
});

// 1b. GET Transaksi Hari Ini (Bisa Dipakai Kasir Piutang / Omset)
router.get('/history/today', verifyToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const [rows] = await pool.query('SELECT * FROM transactions WHERE date LIKE ? ORDER BY date DESC', [`${today}%`]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat history hari ini' });
    }
});

// 2. GET Harga Fotocopy (Untuk PosPage kalkulator & Landing Page)
router.get('/fotocopy-prices', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM fotocopy_prices');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat harga' });
    }
});

// 2b. PUT Update Harga Fotocopy
router.put('/fotocopy-prices/:id', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    try {
        const { price } = req.body;
        await pool.query('UPDATE fotocopy_prices SET price = ? WHERE id = ?', [price, req.params.id]);
        res.json({ message: 'Harga fotocopy diupdate!' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal update harga' });
    }
});

// 3. POST Transaksi Baru (POS Kasir / Checkout)
router.post('/', verifyToken, requireRole(['kasir', 'admin']), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            invoiceNo, date, customerId, customerName, type,
            subtotal, discount, total, paid, changeAmount, paymentType, status,
            items // Array dari produk ATK atau produk jasa fotocopy
        } = req.body;

        const newTrxId = 't' + Date.now();

        const mysqlDate = new Date(date).toISOString().slice(0, 19).replace('T', ' ');

        // 3a. Insert Transaction Header
        const validCustomerId = (customerId && customerId !== 'null' && customerId !== 'undefined' && String(customerId).trim() !== '') ? customerId : null;

        await connection.query(`
      INSERT INTO transactions 
      (id, invoice_no, date, customer_id, customer_name, user_id, user_name, type, subtotal, discount, total, paid, change_amount, payment_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [newTrxId, invoiceNo, mysqlDate, validCustomerId, customerName || 'Umum', req.user.id, req.user.name, type, subtotal, discount, total, paid, changeAmount, paymentType, status]);

        // 3b. Insert Transaction Details (Item) & Update Stok
        for (const item of items) {
            const detailId = 'td' + Date.now() + Math.floor(Math.random() * 1000);

            await connection.query(`
        INSERT INTO transaction_details 
        (id, transaction_id, product_id, name, qty, price, subtotal, discount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [detailId, newTrxId, item.id || null, item.name, item.qty, item.price, item.subtotal, item.discount || 0]);

            // Kurangi Stok Jika Tipe Penjualan ATK (Barang Fisik)
            if (item.source === 'atk' && item.id) {
                await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.id]);

                // Catat di Stock Movement
                await connection.query(`
          INSERT INTO stock_movements (product_id, type, qty, reference, notes) 
          VALUES (?, 'out', ?, ?, 'Penjualan POS')
        `, [item.id, item.qty, invoiceNo]);
            }
        }

        // 3c. Jika status LUNAS, masukkan ke Cash Flow
        if (status === 'paid' && paid > 0) {
            const cashFlowId = 'cf' + Date.now();
            await connection.query(`
        INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
        VALUES (?, ?, 'in', 'Penjualan', ?, ?, ?)
      `, [cashFlowId, date.split('T')[0], total, `Penjualan ${type} - ${invoiceNo}`, newTrxId]);
        }

        // 3d. Sinkronisasi Master Pelanggan (total_trx & total_spend)
        if (customerId) {
            await connection.query('UPDATE customers SET total_trx = total_trx + 1, total_spend = total_spend + ? WHERE id = ?', [paid, customerId]);
        }

        // 3e. Activity Log
        await connection.query('INSERT INTO activity_log (user_id, user_name, action, detail) VALUES (?, ?, ?, ?)',
            [req.user.id, req.user.name, 'add_transaction', `Invoice ${invoiceNo} (${total})`]);

        await connection.commit();
        res.status(201).json({ message: 'Transaksi berhasil disimpan!', id: newTrxId });
    } catch (error) {
        await connection.rollback();
        console.error('Transaksi gagal:', error.message);

        let errorMsg = 'Gagal menyimpan transaksi: ' + error.message;

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            if (error.message.includes('user_id')) {
                // Trigger frontend interceptor logout on user deletion anomaly
                return res.status(401).json({ message: 'Sesi akun tidak valid (Akun telah dihapus dari sistem). Silakan login ulang.' });
            } else if (error.message.includes('customer_id')) {
                errorMsg = 'Gagal: Pelanggan yang dipilih tidak valid atau telah dihapus.';
            } else if (error.message.includes('product_id')) {
                errorMsg = 'Gagal: Terdapat Produk di keranjang yang sudah dihapus dari database.';
            }
        }
        res.status(500).json({ message: errorMsg });
    } finally {
        connection.release();
    }
});

// 4. GET Detail Transaksi (Untuk Preview Struk)
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [trx] = await pool.query(`
            SELECT id, invoice_no AS invoiceNo, date, customer_id AS customerId, customer_name AS customerName, user_name AS userName,
                   type, subtotal, discount, total, paid, change_amount AS changeAmount, payment_type AS paymentType, status
            FROM transactions WHERE id = ?
        `, [req.params.id]);

        if (trx.length === 0) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

        const [items] = await pool.query(`
            SELECT product_id AS productId, name, qty, price, subtotal, discount, CASE WHEN product_id IS NOT NULL THEN 'atk' ELSE 'fc' END as source
            FROM transaction_details WHERE transaction_id = ?
        `, [req.params.id]);

        res.json({ ...trx[0], items });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat detail transaksi' });
    }
});

// 5. DELETE Transaksi (Void) - Kembalikan stok & hapus cash flow
router.delete('/:id', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Ambil items untuk kembalikan stok
        const [items] = await connection.query('SELECT product_id, qty FROM transaction_details WHERE transaction_id = ? AND product_id IS NOT NULL', [req.params.id]);

        for (const item of items) {
            // Kembalikan stok
            await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.qty, item.product_id]);
            // Catat void di stock movements
            await connection.query(`
                INSERT INTO stock_movements (product_id, type, qty, reference, notes) 
                VALUES (?, 'in', ?, ?, 'Void Transaksi POS')
             `, [item.product_id, item.qty, req.params.id]);
        }

        // Hapus dari cash_flow
        await connection.query('DELETE FROM cash_flow WHERE reference_id = ?', [req.params.id]);

        // Hapus dari details & transaksi utama
        await connection.query('DELETE FROM transaction_details WHERE transaction_id = ?', [req.params.id]);
        await connection.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);

        // Catat activity
        await connection.query('INSERT INTO activity_log (user_id, user_name, action, detail) VALUES (?, ?, ?, ?)',
            [req.user.id, req.user.name, 'delete_transaction', `Hapus & Void TRX ${req.params.id}`]);

        await connection.commit();
        res.json({ message: 'Transaksi berhasil dihapus dan stok dikembalikan!' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Gagal menghapus transaksi' });
    } finally {
        connection.release();
    }
});

// 6. PUT Pelunasan Transaksi
router.put('/:id/pay', verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { paidAmount, paymentMethod } = req.body;

        const [trxArr] = await connection.query('SELECT * FROM transactions WHERE id = ?', [id]);
        if (trxArr.length === 0) throw new Error('Trx not found');
        const trx = trxArr[0];

        const newPaid = Number(trx.paid || 0) + Number(paidAmount);
        const newStatus = newPaid >= trx.total ? 'paid' : 'debt';

        // Update transaction
        await connection.query('UPDATE transactions SET paid = ?, payment_type = ?, status = ? WHERE id = ?',
            [newPaid, paymentMethod, newStatus, id]);

        // Insert cash flow
        const cashFlowId = 'cf' + Date.now();
        await connection.query(`
            INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
            VALUES (?, CURDATE(), 'in', 'Penjualan', ?, ?, ?)
        `, [cashFlowId, paidAmount, `Pelunasan ${trx.invoice_no || trx.id}`, id]);

        // Activity log
        await connection.query('INSERT INTO activity_log (user_id, user_name, action, detail) VALUES (?, ?, ?, ?)',
            [req.user.id, req.user.name, 'payment', `Pelunasan ${trx.invoice_no || trx.id}: ${paidAmount} via ${paymentMethod}`]);

        await connection.commit();
        res.json({ message: 'Pembayaran berhasil dicatat' });
    } catch (e) {
        await connection.rollback();
        console.error(e);
        res.status(500).json({ message: 'Gagal mencatat pembayaran' });
    } finally {
        connection.release();
    }
});

// 7. PUT Update Transaksi (Edit Header)
router.put('/:id', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    try {
        const { id } = req.params;
        const { customerName, paymentType, paidAmount } = req.body;

        // Cek total transaksi saat ini
        const [trxArr] = await pool.query('SELECT total FROM transactions WHERE id = ?', [id]);
        if (trxArr.length === 0) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

        const total = trxArr[0].total;
        const newStatus = Number(paidAmount) >= total ? 'paid' : 'unpaid';

        await pool.query(
            'UPDATE transactions SET customer_name = ?, payment_type = ?, paid = ?, status = ? WHERE id = ?',
            [customerName, paymentType, paidAmount, newStatus, id]
        );

        await pool.query('INSERT INTO activity_log (user_id, user_name, action, detail) VALUES (?, ?, ?, ?)',
            [req.user.id, req.user.name, 'edit_transaction', `Edit Transaksi ${id} `]);

        res.json({ message: 'Transaksi berhasil diperbarui' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal memperbarui transaksi' });
    }
});

module.exports = router;
