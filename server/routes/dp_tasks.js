'use strict';
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// 1. GET Semua Task
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM dp_tasks ORDER BY created_at DESC');

        // map db keys to what frontend expects, e.g. material_price to material_price, etc.
        const mapped = rows.map(r => ({
            ...r,
            dimensions: { width: r.dimensions_w, height: r.dimensions_h },
            createdAt: r.created_at,
            updatedAt: r.updated_at
        }));

        res.json(mapped);
    } catch (error) {
        console.error('GET dp_tasks error:', error);
        res.status(500).json({ message: 'Gagal mengambil data dp_tasks' });
    }
});

// 2. GET Detail Task
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM dp_tasks WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: 'Task tidak ditemukan' });

        const r = rows[0];
        const mapped = {
            ...r,
            dimensions: { width: r.dimensions_w, height: r.dimensions_h },
            createdAt: r.created_at,
            updatedAt: r.updated_at
        };

        res.json(mapped);
    } catch (error) {
        res.status(500).json({ message: 'Gagal muat detail task' });
    }
});

// 3. POST Task Baru
router.post('/', verifyToken, requireRole(['admin', 'kasir', 'operator']), async (req, res) => {
    try {
        const {
            id, status, customerName, customerId, title, material_id, material_name,
            dimensions, material_price, design_price, priority, pesan_desainer,
            type, qty, dp_amount, is_paid
        } = req.body;

        const newId = id || ('ORD-' + Math.floor(Math.random() * 9999).toString().padStart(4, '0'));

        await pool.query(`
            INSERT INTO dp_tasks
            (id, status, customerName, customerId, title, material_id, material_name, 
            dimensions_w, dimensions_h, material_price, design_price, priority, 
            pesan_desainer, type, qty, dp_amount, is_paid)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            newId, status || 'menunggu_desain', customerName, customerId, title, material_id, material_name,
            dimensions?.width || null, dimensions?.height || null, material_price || 0, design_price || 0,
            priority || 'normal', pesan_desainer || null, type || 'digital', qty || 1, dp_amount || 0,
            is_paid ? 1 : 0
        ]);

        res.status(201).json({ message: 'Task berhasil dibuat!', id: newId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal membuat task' });
    }
});

// 4. PUT Update Keseluruhan
router.put('/:id', verifyToken, requireRole(['admin', 'kasir', 'operator', 'desainer']), async (req, res) => {
    try {
        const {
            status, customerName, customerId, title, material_id, material_name,
            dimensions, material_price, design_price, priority, pesan_desainer,
            type, qty, dp_amount, is_paid, file_url,
            designer_id, designer_name, operator_id, operator_name
        } = req.body;

        await pool.query(`
            UPDATE dp_tasks 
            SET status = COALESCE(?, status),
                customerName = COALESCE(?, customerName),
                customerId = COALESCE(?, customerId),
                title = COALESCE(?, title),
                material_id = COALESCE(?, material_id),
                material_name = COALESCE(?, material_name),
                dimensions_w = COALESCE(?, dimensions_w),
                dimensions_h = COALESCE(?, dimensions_h),
                material_price = COALESCE(?, material_price),
                design_price = COALESCE(?, design_price),
                priority = COALESCE(?, priority),
                pesan_desainer = COALESCE(?, pesan_desainer),
                type = COALESCE(?, type),
                qty = COALESCE(?, qty),
                dp_amount = COALESCE(?, dp_amount),
                is_paid = COALESCE(?, is_paid),
                file_url = COALESCE(?, file_url),
                designer_id = COALESCE(?, designer_id),
                designer_name = COALESCE(?, designer_name),
                operator_id = COALESCE(?, operator_id),
                operator_name = COALESCE(?, operator_name)
            WHERE id = ?
        `, [
            status, customerName, customerId, title, material_id, material_name,
            dimensions?.width, dimensions?.height, material_price, design_price,
            priority, pesan_desainer, type, qty, dp_amount, is_paid, file_url,
            designer_id, designer_name, operator_id, operator_name,
            req.params.id
        ]);

        res.json({ message: 'Task berhasil diupdate!' });
    } catch (error) {
        console.error('PUT dp_tasks error:', error);
        res.status(500).json({ message: 'Gagal update task' });
    }
});

// 5. PATCH Update Status (Kanban Drop)
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query('UPDATE dp_tasks SET status = ? WHERE id = ?', [status, req.params.id]);
        if (status === 'batal') {
            await pool.query("UPDATE design_assignments SET status = 'dibatalkan' WHERE task_id = ? AND status IN ('ditugaskan', 'dikerjakan')", [req.params.id]);
        }
        res.json({ message: 'Status task diupdate!' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memindah status' });
    }
});

// 6. DELETE Task
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        await pool.query('DELETE FROM dp_tasks WHERE id = ?', [req.params.id]);
        res.json({ message: 'Task dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal hapus task' });
    }
});

// 7. POST Pelunasan Task (Finansial)
router.post('/:id/pay', verifyToken, requireRole(['kasir', 'admin']), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { totalAmount, dpAmount, title } = req.body;

        // 1. Update status task & is_paid
        await connection.query("UPDATE dp_tasks SET is_paid = 1, status = 'diambil' WHERE id = ?", [req.params.id]);

        // 2. Masukkan sisa pembayaran ke Cash Flow
        const sisa = totalAmount - dpAmount;
        if (sisa > 0) {
            const cashFlowId = 'cf' + Date.now();
            const date = new Date().toISOString().split('T')[0];
            await connection.query(`
                INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
                VALUES (?, ?, 'in', 'Percetakan', ?, ?, ?)
            `, [cashFlowId, date, sisa, `Pelunasan: ${title} (${req.params.id})`, req.params.id]);
        }

        // 3. Update total spend customer
        const [taskRows] = await connection.query('SELECT customerId FROM dp_tasks WHERE id = ?', [req.params.id]);
        if (taskRows.length > 0 && taskRows[0].customerId) {
            await connection.query('UPDATE customers SET total_spend = total_spend + ? WHERE id = ?', [sisa, taskRows[0].customerId]);
        }

        await connection.commit();
        res.json({ message: 'Pelunasan berhasil diproses!' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Gagal memproses pelunasan' });
    } finally {
        connection.release();
    }
});

module.exports = router;
