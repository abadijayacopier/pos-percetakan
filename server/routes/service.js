const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

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
    try {
        const {
            serviceNo, customerId, customerName, phone, machineInfo, serialNo,
            complaint, conditionPhysic, status, technicianId, dpAmount
        } = req.body;

        const newId = 'so' + Date.now();

        await pool.query(`
            INSERT INTO service_orders
            (id, service_no, customer_id, customer_name, phone, machine_info, serial_no, complaint, condition_physic, status, technician_id, dp_amount)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
            newId, serviceNo, customerId || null, customerName, phone, machineInfo,
            serialNo || null, complaint, conditionPhysic || null, status || 'diterima', technicianId || null, dpAmount || 0
        ]);

        if (customerId) {
            await pool.query('UPDATE customers SET total_trx = total_trx + 1 WHERE id = ?', [customerId]);
        }

        res.status(201).json({ message: 'Penerimaan service berhasil dicatat!', id: newId });
    } catch (error) {
        res.status(500).json({ message: 'Gagal membuat order service' });
    }
});

// 4. PUT Update Diagnosa & Sparepart (Pengerjaan)
router.put('/:id', verifyToken, requireRole(['teknisi', 'admin', 'kasir']), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const {
            diagnosis, laborCost, status, spareparts, warrantyEnd, dpAmount, technicianId
        } = req.body;

        let totalSparepartCost = 0;

        // Update data utama
        await connection.query(`
            UPDATE service_orders 
            SET diagnosis = ?, labor_cost = ?, status = ?, warranty_end = ?, dp_amount = ?, technician_id = ?
            WHERE id = ?
                `, [diagnosis, laborCost || 0, status, warrantyEnd || null, dpAmount || 0, technicianId || null, req.params.id]);

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
        console.error(error);
        res.status(500).json({ message: 'Gagal update service' });
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

module.exports = router;
