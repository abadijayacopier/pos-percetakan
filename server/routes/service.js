const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../public/uploads/service');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

// 7. DELETE Order Service (Moved to top to prevent route shadowing)
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    console.log('--- DELETE SERVICE ROUTE HIT ---');
    console.log('ID:', req.params.id);
    console.log('User:', req.user.id);
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Ambil detail spareparts untuk dikembalikan ke stok
        const [parts] = await connection.query('SELECT productId, qty FROM service_spareparts WHERE service_order_id = ?', [req.params.id]);

        // 2. Kembalikan stok
        for (const item of parts) {
            if (item.productId) {
                await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.qty, item.productId]);
            }
        }

        // 3. Hapus detail spareparts
        await connection.query('DELETE FROM service_spareparts WHERE service_order_id = ?', [req.params.id]);

        // 4. Hapus order servis
        const [result] = await connection.query('DELETE FROM service_orders WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Tiket tidak ditemukan.' });
        }

        await connection.commit();
        res.json({ message: 'Tiket service berhasil dihapus dan stok dikembalikan.' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Gagal menghapus tiket.', error: error.message });
    } finally {
        connection.release();
    }
});

// 1. GET Semua Order Service
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, service_no AS serviceNo, customer_id AS customerId, customer_name AS customerName, phone, 
                   machine_info AS machineInfo, serial_no AS serialNo, complaint, condition_physic AS conditionPhysic, 
                   diagnosis, labor_cost AS laborCost, dp_amount AS dpAmount, total_cost AS totalCost, status, technician_id AS technicianId, 
                   warranty_end AS warrantyEnd, created_at AS createdAt
            FROM service_orders ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data service' });
    }
});

// 2. GET Detail & Spareparts Order Service
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [orders] = await pool.query(`
            SELECT id, service_no AS serviceNo, customer_id AS customerId, customer_name AS customerName, phone, 
                   machine_info AS machineInfo, serial_no AS serialNo, complaint, condition_physic AS conditionPhysic, 
                   diagnosis, labor_cost AS laborCost, dp_amount AS dpAmount, total_cost AS totalCost, status, technician_id AS technicianId, 
                   warranty_end AS warrantyEnd, created_at AS createdAt
            FROM service_orders WHERE id = ?
        `, [req.params.id]);
        if (orders.length === 0) return res.status(404).json({ message: 'Order tidak ditemukan' });

        const [spareparts] = await pool.query('SELECT * FROM service_spareparts WHERE service_order_id = ?', [req.params.id]);
        res.json({ ...orders[0], spareparts });
    } catch (error) {
        res.status(500).json({ message: 'Gagal muat detail service' });
    }
});

// 3. POST Order Service Baru
router.post('/', verifyToken, requireRole(['teknisi', 'admin', 'kasir']), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const {
            serviceNo, customerId, customerName, phone, machineInfo, serialNo,
            complaint, conditionPhysic, status, technicianId, dpAmount, laborCost, spareparts
        } = req.body;

        // 1. Insert Service Order
        const [result] = await connection.query(`
            INSERT INTO service_orders
            (service_no, customer_id, customer_name, phone, machine_info, serial_no, complaint, condition_physic, status, technician_id, dp_amount, labor_cost)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            serviceNo, customerId || null, customerName, phone, machineInfo,
            serialNo || null, complaint, conditionPhysic || null, status || 'diterima', technicianId || null, dpAmount || 0, laborCost || 0
        ]);

        const newId = result.insertId;

        // 2. Handle Spareparts if any
        let totalSparepartCost = 0;
        if (spareparts && Array.isArray(spareparts) && spareparts.length > 0) {
            for (const sp of spareparts) {
                await connection.query(`
                    INSERT INTO service_spareparts(service_order_id, name, qty, price, product_id)
                    VALUES(?, ?, ?, ?, ?)
                `, [newId, sp.name, sp.qty, sp.price, sp.productId || null]);

                if (sp.productId) {
                    await connection.query(
                        'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
                        [sp.qty, sp.productId]
                    );

                    await connection.query(
                        `INSERT INTO stock_movements (product_id, type, qty, reference, notes)
                         VALUES (?, 'out', ?, ?, ?)`,
                        [sp.productId, sp.qty, `SRV-${newId}`, `Pemakaian sparepart service ${newId}`]
                    );
                }
                totalSparepartCost += (Number(sp.qty) || 0) * (Number(sp.price) || 0);
            }
        }

        // 3. Update Total Cost
        const grandTotal = (Number(laborCost) || 0) + totalSparepartCost;
        await connection.query('UPDATE service_orders SET total_cost = ? WHERE id = ?', [grandTotal, newId]);

        // 4. Update Customer Stats
        if (customerId) {
            await connection.query('UPDATE customers SET total_trx = total_trx + 1 WHERE id = ?', [customerId]);
        }

        await connection.commit();
        res.status(201).json({ message: 'Penerimaan service berhasil dicatat!', id: newId });
    } catch (error) {
        await connection.rollback();
        console.error('CRITICAL: Gagal simpan Service Ticket:', error);
        res.status(500).json({
            message: 'Gagal membuat order service',
            error: error.message,
            sqlMessage: error.sqlMessage,
            code: error.code
        });
    } finally {
        connection.release();
    }
});

// 4. PUT Update Diagnosa & Sparepart (Pengerjaan)
router.put('/:id', verifyToken, requireRole(['teknisi', 'admin', 'kasir']), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const {
            diagnosis, laborCost, status, spareparts, warrantyEnd, dpAmount, technicianId,
            customerId, customerName, phone, machineInfo, serialNo, complaint, condition // conditionPhysic is sent as condition from frontend or already updated in mapping
        } = req.body;

        const conditionPhysic = req.body.conditionPhysic || req.body.condition;

        let totalSparepartCost = 0;

        // Update data utama
        await connection.query(`
            UPDATE service_orders 
            SET customer_id = ?, customer_name = ?, phone = ?, machine_info = ?, serial_no = ?, complaint = ?, condition_physic = ?, diagnosis = ?, labor_cost = ?, status = ?, warranty_end = ?, dp_amount = ?, technician_id = ?
            WHERE id = ?
                `, [
            customerId || null,
            customerName ? customerName : 'Pelanggan Umum',
            phone ? phone : '',
            machineInfo ? machineInfo : '-',
            serialNo ? serialNo : '-',
            complaint ? complaint : '-',
            conditionPhysic || null,
            diagnosis || null,
            laborCost || 0,
            status || 'diterima',
            warrantyEnd || null,
            dpAmount || 0,
            technicianId || null,
            req.params.id
        ]);

        // ─── Otomatisasi Stok Sparepart (Opsi A) ──────────────────────
        if (spareparts && Array.isArray(spareparts)) {
            // 1. Ambil sparepart lama untuk dikembalikan ke stok (Restore)
            const [oldSpareparts] = await connection.query(
                'SELECT product_id, qty FROM service_spareparts WHERE service_order_id = ? AND product_id IS NOT NULL',
                [req.params.id]
            );

            for (const old of oldSpareparts) {
                await connection.query(
                    'UPDATE products SET stock = stock + ? WHERE id = ?',
                    [old.qty, old.product_id]
                );
                // Catat restore di stock_movements
                await connection.query(
                    `INSERT INTO stock_movements (product_id, type, qty, reference, notes)
                     VALUES (?, 'in', ?, ?, ?)`,
                    [old.product_id, old.qty, `RESTORE-${req.params.id}`, `Koreksi/Hapus sparepart service ${req.params.id}`]
                );
            }

            // 2. Hapus data lama
            await connection.query('DELETE FROM service_spareparts WHERE service_order_id = ?', [req.params.id]);

            // 3. Insert data baru & Kurangi Stok
            for (const sp of spareparts) {
                await connection.query(`
                    INSERT INTO service_spareparts(service_order_id, name, qty, price, product_id)
                    VALUES(?, ?, ?, ?, ?)
                `, [req.params.id, sp.name, sp.qty, sp.price, sp.productId || null]);

                if (sp.productId) {
                    await connection.query(
                        'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
                        [sp.qty, sp.productId]
                    );

                    // Catat pengeluaran di stock_movements
                    await connection.query(
                        `INSERT INTO stock_movements (product_id, type, qty, reference, notes)
                         VALUES (?, 'out', ?, ?, ?)`,
                        [sp.productId, sp.qty, req.params.id, `Pemakaian sparepart service ${req.params.id}`]
                    );
                }
                totalSparepartCost += (sp.qty * sp.price);
            }
        } else {
            // Hitung ulang current spareparts jika array tak dikirim (fallback)
            const [currentSp] = await connection.query('SELECT qty, price FROM service_spareparts WHERE service_order_id = ?', [req.params.id]);
            totalSparepartCost = currentSp.reduce((sum, item) => sum + (item.qty * item.price), 0);
        }

        // Update total keseluruhan
        const grandTotal = (parseInt(laborCost) || 0) + totalSparepartCost;
        await connection.query('UPDATE service_orders SET total_cost = ? WHERE id = ?', [grandTotal, req.params.id]);

        await connection.commit();
        res.json({ message: 'Data pengerjaan berhasil diupdate!' });
    } catch (error) {
        await connection.rollback();
        console.error('Update Service Error:', error);
        res.status(500).json({
            message: 'Gagal mengupdate order service',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// 5. PATCH Update Status (Kanban Drop)
router.patch('/:id/status', verifyToken, requireRole(['teknisi', 'admin', 'kasir']), async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query('UPDATE service_orders SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: 'Status service diupdate!' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memindah status' });
    }
});

// 6. POST Pembayaran Service Selesai
router.post('/:id/pay', verifyToken, requireRole(['kasir', 'admin']), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { serviceNo, totalCost } = req.body;

        // Ubah Status ke diambil
        await connection.query("UPDATE service_orders SET status = 'diambil' WHERE id = ?", [req.params.id]);

        // Masukkan ke Cash Flow
        const cashFlowId = 'cf' + Date.now();
        const date = new Date().toISOString().split('T')[0];
        await connection.query(`
            INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
            VALUES (?, ?, 'in', 'Service Mesin', ?, ?, ?)
        `, [cashFlowId, date, totalCost, `Biaya Service ${serviceNo}`, req.params.id]);

        // Sinkronisasi data master pelanggan (Pelunasan Service)
        const [orderRows] = await connection.query('SELECT customer_id FROM service_orders WHERE id = ?', [req.params.id]);
        if (orderRows.length > 0 && orderRows[0].customer_id) {
            await connection.query('UPDATE customers SET total_spend = total_spend + ? WHERE id = ?', [totalCost, orderRows[0].customer_id]);
        }

        await connection.commit();
        res.json({ message: 'Pembayaran service berhasil diproses!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Gagal memproses pelunasan' });
    } finally {
        connection.release();
    }
});



// 8. POST Public Service Order (Landing Page)
router.post('/public', upload.single('photo'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const {
            customerName, phone, machineInfo, complaint, conditionPhysic
        } = req.body;

        const photoUrl = req.file ? `/uploads/service/${req.file.filename}` : null;

        // Generate Service No (SRV-YYYYMMDD-XXXX)
        const date = new Date();
        const dateStr = date.getFullYear() +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0');

        const [lastOrder] = await connection.query(
            "SELECT service_no FROM service_orders WHERE service_no LIKE ? ORDER BY created_at DESC LIMIT 1",
            [`SRV-${dateStr}-%`]
        );

        let nextNum = 1;
        if (lastOrder.length > 0) {
            const lastNum = parseInt(lastOrder[0].service_no.split('-')[2]);
            nextNum = lastNum + 1;
        }
        const serviceNo = `SRV-${dateStr}-${String(nextNum).padStart(4, '0')}`;

        // Insert Service Order
        const [result] = await connection.query(`
            INSERT INTO service_orders
            (service_no, customer_name, phone, machine_info, complaint, condition_physic, status, photo)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            serviceNo, customerName, phone, machineInfo,
            complaint, conditionPhysic || 'Dari Landing Page', 'diterima', photoUrl
        ]);

        await connection.commit();
        res.status(201).json({
            message: 'Tiket service anda telah diterima!',
            serviceNo: serviceNo,
            id: result.insertId
        });
    } catch (error) {
        await connection.rollback();
        console.error('CRITICAL: Gagal simpan Public Service Ticket:', error);
        res.status(500).json({
            message: 'Gagal mengirim tiket service. Silakan coba lagi.',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
