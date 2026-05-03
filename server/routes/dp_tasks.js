'use strict';
const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sendProcessNotification, sendDoneNotification } = require('../utils/notificationHelper');

// 1. GET Semua Task
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM dp_tasks ORDER BY created_at DESC');
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
        const [rows] = await req.db.query('SELECT * FROM dp_tasks WHERE id = ?', [req.params.id]);
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

const { logActivity } = require('../utils/logger');

// 3. POST Task Baru
router.post('/', verifyToken, requireRole(['admin', 'kasir', 'operator']), async (req, res) => {
    try {
        const {
            id, status, customerName, customerId, title, material_id, material_name,
            dimensions, material_price, design_price, priority, pesan_desainer,
            type, qty, dp_amount, is_paid
        } = req.body;

        const newId = id || ('ORD-' + Math.floor(Math.random() * 9999).toString().padStart(4, '0'));

        await req.db.query(`
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

        // Log activity
        await logActivity(req.user.id, 'CREATE_TASK', customerName, `Tambah pesanan cetak: ${title} (${newId})`, req.ip, req.user.name);

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

        await req.db.query(`
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

        // Log activity
        await logActivity(req.user.id, 'UPDATE_TASK', customerName || 'N/A', `Update data pesanan: ${title || req.params.id}`, req.ip, req.user.name);

        // Trigger Notifications based on status
        if (status === 'produksi' || status === 'proses') {
            const [rows] = await req.db.query('SELECT t.*, c.phone FROM dp_tasks t LEFT JOIN customers c ON t.customerId = c.id WHERE t.id = ?', [req.params.id]);
            if (rows.length > 0) sendProcessNotification(rows[0]);
        } else if (status === 'selesai') {
            const [rows] = await req.db.query('SELECT t.*, c.phone FROM dp_tasks t LEFT JOIN customers c ON t.customerId = c.id WHERE t.id = ?', [req.params.id]);
            if (rows.length > 0) sendDoneNotification(rows[0]);
        }

        res.json({ message: 'Task berhasil diupdate!' });
    } catch (error) {
        console.error('PUT dp_tasks error:', error);
        res.status(500).json({ message: 'Gagal update task' });
    }
});

// 5. PATCH Update Status (Kanban)
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        await req.db.query('UPDATE dp_tasks SET status = ? WHERE id = ?', [status, req.params.id]);
        
        // Fetch info for logging
        const [rows] = await req.db.query('SELECT t.*, c.phone FROM dp_tasks t LEFT JOIN customers c ON t.customerId = c.id WHERE t.id = ?', [req.params.id]);

        if (rows.length > 0) {
            // Log activity
            await logActivity(req.user.id, 'UPDATE_TASK_STATUS', rows[0].customerName, `Status pesanan ${rows[0].id} -> ${status}`, req.ip, req.user.name);

            if (status === 'batal') {
                await req.db.query("UPDATE design_assignments SET status = 'dibatalkan' WHERE task_id = ? AND status IN ('ditugaskan', 'dikerjakan')", [req.params.id]);
            } else if (status === 'produksi' || status === 'proses') {
                sendProcessNotification(rows[0]);
            } else if (status === 'selesai') {
                await req.db.query("UPDATE design_assignments SET status = 'selesai' WHERE task_id = ? AND status IN ('ditugaskan', 'dikerjakan')", [req.params.id]);
                sendDoneNotification(rows[0]);
            }
        }

        res.json({ message: 'Status task diupdate!' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memindah status' });
    }
});

// 6. DELETE Task
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const [taskArr] = await req.db.query('SELECT id, title FROM dp_tasks WHERE id = ?', [req.params.id]);
        const taskInfo = taskArr.length > 0 ? `${taskArr[0].title} (${taskArr[0].id})` : req.params.id;

        await req.db.query('DELETE FROM dp_tasks WHERE id = ?', [req.params.id]);
        await req.db.query('DELETE FROM design_assignments WHERE task_id = ?', [req.params.id]);

        // Log activity
        await logActivity(req.user.id, 'DELETE_TASK', 'Percetakan', `Hapus pesanan cetak: ${taskInfo}`, req.ip, req.user.name);

        res.json({ message: 'Task dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal hapus task' });
    }
});

// 7. POST Pelunasan Task
router.post('/:id/pay', verifyToken, requireRole(['kasir', 'admin']), async (req, res) => {
    const connection = await req.db.getConnection();
    try {
        await connection.beginTransaction();
        const { totalAmount, dpAmount, title } = req.body;

        await connection.query("UPDATE dp_tasks SET is_paid = 1, status = 'diambil' WHERE id = ?", [req.params.id]);
        await connection.query("UPDATE design_assignments SET status = 'selesai' WHERE task_id = ? AND status IN ('ditugaskan', 'dikerjakan')", [req.params.id]);

        const sisa = totalAmount - dpAmount;
        if (sisa > 0) {
            const cashFlowId = 'cf' + Date.now();
            const date = new Date().toISOString().split('T')[0];
            await connection.query(`
                INSERT INTO cash_flow (id, date, type, category, amount, description, reference_id)
                VALUES (?, ?, 'in', 'Percetakan', ?, ?, ?)
            `, [cashFlowId, date, sisa, `Pelunasan: ${title} (${req.params.id})`, req.params.id]);
        }

        const [taskRows] = await connection.query('SELECT customerId FROM dp_tasks WHERE id = ?', [req.params.id]);
        if (taskRows.length > 0 && taskRows[0].customerId) {
            await connection.query('UPDATE customers SET total_spend = total_spend + ? WHERE id = ?', [sisa, taskRows[0].customerId]);
        }

        await connection.commit();
        res.json({ message: 'Pelunasan berhasil diproses!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Gagal memproses pelunasan' });
    } finally {
        connection.release();
    }
});

module.exports = router;
