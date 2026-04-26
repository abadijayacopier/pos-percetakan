const express = require('express');
const router = express.Router();
const { masterPool, getTenantPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TenantManager = require('../utils/tenantManager');
const { sendServiceNotification } = require('../utils/notificationHelper');

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

// 7. DELETE Order Service
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    const connection = await req.db.getConnection();
    try {
        await connection.beginTransaction();

        const [parts] = await connection.query('SELECT productId, qty FROM service_spareparts WHERE service_order_id = ?', [req.params.id]);

        for (const item of parts) {
            if (item.productId) {
                await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.qty, item.productId]);
            }
        }

        await connection.query('DELETE FROM service_spareparts WHERE service_order_id = ?', [req.params.id]);
        const [result] = await connection.query('DELETE FROM service_orders WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Tiket tidak ditemukan.' });
        }

        await connection.commit();
        res.json({ message: 'Tiket service berhasil dihapus dan stok dikembalikan.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Gagal menghapus tiket.', error: error.message });
    } finally {
        connection.release();
    }
});

// 1. GET Semua Order Service
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(`
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

// 2. GET Detail & Spareparts
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [orders] = await req.db.query(`
            SELECT id, service_no AS serviceNo, customer_id AS customerId, customer_name AS customerName, phone, 
                   machine_info AS machineInfo, serial_no AS serialNo, complaint, condition_physic AS conditionPhysic, 
                   diagnosis, labor_cost AS laborCost, dp_amount AS dpAmount, total_cost AS totalCost, status, technician_id AS technicianId, 
                   warranty_end AS warrantyEnd, created_at AS createdAt
            FROM service_orders WHERE id = ?
        `, [req.params.id]);
        if (orders.length === 0) return res.status(404).json({ message: 'Order tidak ditemukan' });

        const [spareparts] = await req.db.query('SELECT * FROM service_spareparts WHERE service_order_id = ?', [req.params.id]);
        res.json({ ...orders[0], spareparts });
    } catch (error) {
        res.status(500).json({ message: 'Gagal muat detail service' });
    }
});

// 3. POST Order Service Baru
router.post('/', verifyToken, requireRole(['teknisi', 'admin', 'kasir']), async (req, res) => {
    const connection = await req.db.getConnection();
    try {
        await connection.beginTransaction();
        const {
            serviceNo, customerId, customerName, phone, machineInfo, serialNo,
            complaint, conditionPhysic, status, technicianId, dpAmount, laborCost, spareparts
        } = req.body;

        const [result] = await connection.query(`
            INSERT INTO service_orders
            (service_no, customer_id, customer_name, phone, machine_info, serial_no, complaint, condition_physic, status, technician_id, dp_amount, labor_cost)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [serviceNo, customerId || null, customerName, phone, machineInfo, serialNo || null, complaint, conditionPhysic || null, status || 'diterima', technicianId || null, dpAmount || 0, laborCost || 0]);

        const newId = result.insertId;

        let totalSparepartCost = 0;
        if (spareparts && Array.isArray(spareparts) && spareparts.length > 0) {
            for (const sp of spareparts) {
                await connection.query(`
                    INSERT INTO service_spareparts(service_order_id, name, qty, price, product_id)
                    VALUES(?, ?, ?, ?, ?)
                `, [newId, sp.name, sp.qty, sp.price, sp.productId || null]);

                if (sp.productId) {
                    await connection.query('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [sp.qty, sp.productId]);
                    await connection.query(
                        `INSERT INTO stock_movements (product_id, type, qty, reference, notes)
                         VALUES (?, 'out', ?, ?, ?)`,
                        [sp.productId, sp.qty, `SRV-${newId}`, `Pemakaian sparepart service ${newId}`]
                    );
                }
                totalSparepartCost += (Number(sp.qty) || 0) * (Number(sp.price) || 0);
            }
        }

        const grandTotal = (Number(laborCost) || 0) + totalSparepartCost;
        await connection.query('UPDATE service_orders SET total_cost = ? WHERE id = ?', [grandTotal, newId]);

        if (customerId) {
            await connection.query('UPDATE customers SET total_trx = total_trx + 1 WHERE id = ?', [customerId]);
        }

        await connection.commit();

        // Send WhatsApp Notification
        try {
            await sendServiceNotification({ serviceNo, customerName, phone, machineInfo }, 'received');
        } catch (waErr) {
            console.error('Gagal kirim notifikasi WA service:', waErr);
        }

        res.status(201).json({ message: 'Penerimaan service berhasil dicatat!', id: newId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Gagal membuat order service', error: error.message });
    } finally {
        connection.release();
    }
});

// 4. PUT Update Diagnosa
router.put('/:id', verifyToken, requireRole(['teknisi', 'admin', 'kasir']), async (req, res) => {
    const connection = await req.db.getConnection();
    try {
        await connection.beginTransaction();
        const {
            diagnosis, laborCost, status, spareparts, warrantyEnd, dpAmount, technicianId,
            customerId, customerName, phone, machineInfo, serialNo, complaint
        } = req.body;

        const conditionPhysic = req.body.conditionPhysic || req.body.condition;

        await connection.query(`
            UPDATE service_orders 
            SET customer_id = ?, customer_name = ?, phone = ?, machine_info = ?, serial_no = ?, complaint = ?, condition_physic = ?, diagnosis = ?, labor_cost = ?, status = ?, warranty_end = ?, dp_amount = ?, technician_id = ?
            WHERE id = ?
        `, [customerId || null, customerName ? customerName : 'Pelanggan Umum', phone ? phone : '', machineInfo ? machineInfo : '-', serialNo ? serialNo : '-', complaint ? complaint : '-', conditionPhysic || null, diagnosis || null, laborCost || 0, status || 'diterima', warrantyEnd || null, dpAmount || 0, technicianId || null, req.params.id]);

        let totalSparepartCost = 0;
        if (spareparts && Array.isArray(spareparts)) {
            const [oldSpareparts] = await connection.query('SELECT product_id, qty FROM service_spareparts WHERE service_order_id = ? AND product_id IS NOT NULL', [req.params.id]);

            for (const old of oldSpareparts) {
                await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [old.qty, old.product_id]);
            }

            await connection.query('DELETE FROM service_spareparts WHERE service_order_id = ?', [req.params.id]);

            for (const sp of spareparts) {
                await connection.query(`
                    INSERT INTO service_spareparts(service_order_id, name, qty, price, product_id)
                    VALUES(?, ?, ?, ?, ?)
                `, [req.params.id, sp.name, sp.qty, sp.price, sp.productId || null]);

                if (sp.productId) {
                    await connection.query('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [sp.qty, sp.productId]);
                }
                totalSparepartCost += (sp.qty * sp.price);
            }
        }

        const grandTotal = (parseInt(laborCost) || 0) + totalSparepartCost;
        await connection.query('UPDATE service_orders SET total_cost = ? WHERE id = ?', [grandTotal, req.params.id]);

        await connection.commit();
        res.json({ message: 'Data pengerjaan berhasil diupdate!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Gagal mengupdate order service', error: error.message });
    } finally {
        connection.release();
    }
});

// 5. PATCH Update Status
router.patch('/:id/status', verifyToken, requireRole(['teknisi', 'admin', 'kasir']), async (req, res) => {
    try {
        const { status } = req.body;
        await req.db.query('UPDATE service_orders SET status = ? WHERE id = ?', [status, req.params.id]);

        // Send WhatsApp Notification if finished
        if (status === 'selesai' || status === 'Selesai') {
            try {
                const [rows] = await req.db.query('SELECT service_no as serviceNo, customer_name as customerName, phone, machine_info as machineInfo FROM service_orders WHERE id = ?', [req.params.id]);
                if (rows.length > 0) {
                    await sendServiceNotification(rows[0], 'done');
                }
            } catch (waErr) {
                console.error('Gagal kirim notifikasi WA service selesai:', waErr);
            }
        }

        res.json({ message: 'Status service diupdate!' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memindah status' });
    }
});

// 6. POST Pembayaran Service
router.post('/:id/pay', verifyToken, requireRole(['kasir', 'admin']), async (req, res) => {
    const connection = await req.db.getConnection();
    try {
        await connection.beginTransaction();
        const { serviceNo, totalCost } = req.body;

        await connection.query("UPDATE service_orders SET status = 'diambil' WHERE id = ?", [req.params.id]);

        const cashFlowId = 'cf' + Date.now();
        const date = new Date().toISOString().split('T')[0];
        await connection.query(`
            INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
            VALUES (?, ?, 'in', 'Service Mesin', ?, ?, ?)
        `, [cashFlowId, date, totalCost, `Biaya Service ${serviceNo}`, req.params.id]);

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

// 8. POST Public Service Order (SaaS Aware)
router.post('/public', upload.single('photo'), async (req, res) => {
    try {
        const { shopId, customerName, phone, machineInfo, complaint, conditionPhysic } = req.body;

        if (!shopId) return res.status(400).json({ message: 'Shop ID diperlukan.' });
        const dbName = await TenantManager.getShopDBName(shopId);
        if (!dbName) return res.status(404).json({ message: 'Toko tidak ditemukan.' });
        const tenantDb = getTenantPool(dbName);

        const connection = await tenantDb.getConnection();
        try {
            await connection.beginTransaction();
            const photoUrl = req.file ? `/uploads/service/${req.file.filename}` : null;

            const date = new Date();
            const dateStr = date.getFullYear() + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');

            const [lastOrder] = await connection.query("SELECT service_no FROM service_orders WHERE service_no LIKE ? ORDER BY created_at DESC LIMIT 1", [`SRV-${dateStr}-%`]);

            let nextNum = 1;
            if (lastOrder.length > 0) {
                const lastNum = parseInt(lastOrder[0].service_no.split('-')[2]);
                nextNum = lastNum + 1;
            }
            const serviceNo = `SRV-${dateStr}-${String(nextNum).padStart(4, '0')}`;

            const [result] = await connection.query(`
                INSERT INTO service_orders
                (service_no, customer_name, phone, machine_info, complaint, condition_physic, status, photo)
                VALUES(?, ?, ?, ?, ?, ?, ?, ?)
            `, [serviceNo, customerName, phone, machineInfo, complaint, conditionPhysic || 'Dari Landing Page', 'diterima', photoUrl]);

            await connection.commit();
            res.status(201).json({ message: 'Tiket service anda telah diterima!', serviceNo, id: result.insertId });
        } catch (dbErr) {
            await connection.rollback();
            throw dbErr;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengirim tiket service.', error: error.message });
    }
});

module.exports = router;
