const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET all employees
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(`
            SELECT e.*, u.username as system_username, u.role as system_role
            FROM employees e
            LEFT JOIN users u ON e.user_id = u.id
            ORDER BY e.name ASC
        `);
        res.json(rows.map(r => ({
            ...r,
            isActive: Boolean(r.is_active)
        })));
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal mengambil data karyawan' });
    }
});

// POST new employee
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { user_id, name, nik, phone, address, position, salary_type, base_salary, hourly_rate } = req.body;
        const id = uuidv4();

        if (!name) return res.status(400).json({ message: 'Nama karyawan wajib diisi' });

        await req.db.query(`
            INSERT INTO employees (id, user_id, name, nik, phone, address, position, salary_type, base_salary, hourly_rate, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [id, user_id || null, name, nik || null, phone || null, address || null, position || null, salary_type || 'monthly', base_salary || 0, hourly_rate || 0]);

        res.json({ id, name, message: 'Karyawan berhasil ditambahkan' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal menambah karyawan' });
    }
});

// PUT update employee
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, name, nik, phone, address, position, salary_type, base_salary, hourly_rate, isActive } = req.body;
        const is_active = isActive ? 1 : 0;

        await req.db.query(`
            UPDATE employees 
            SET user_id=?, name=?, nik=?, phone=?, address=?, position=?, salary_type=?, base_salary=?, hourly_rate=?, is_active=?
            WHERE id=?
        `, [user_id || null, name, nik || null, phone || null, address || null, position || null, salary_type || 'monthly', base_salary || 0, hourly_rate || 0, is_active, id]);

        res.json({ message: 'Data karyawan berhasil diperbarui' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal memperbarui karyawan' });
    }
});

// DELETE employee
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        await req.db.query('DELETE FROM employees WHERE id = ?', [id]);
        res.json({ message: 'Karyawan berhasil dihapus' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Gagal menghapus karyawan' });
    }
});

module.exports = router;
