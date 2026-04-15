const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const crypto = require('crypto');

// GET all suppliers
router.get('/', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM suppliers ORDER BY created_at DESC');
        res.json({
            status: 'success',
            data: rows
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
});

// POST add new supplier
router.post('/', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    try {
        const { name, contact_person, phone, address, notes } = req.body;
        if (!name) return res.status(400).json({ status: 'error', message: 'Nama supplier wajib diisi' });

        const id = crypto.randomUUID();
        await req.db.query(
            'INSERT INTO suppliers (id, name, contact_person, phone, address, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, contact_person || null, phone || null, address || null, notes || null]
        );

        res.status(201).json({
            status: 'success',
            message: 'Supplier berhasil ditambahkan',
            data: { id, name, contact_person, phone, address, notes }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Gagal menambahkan supplier' });
    }
});

// PUT update supplier
router.put('/:id', verifyToken, requireRole(['admin', 'kasir']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contact_person, phone, address, notes } = req.body;
        if (!name) return res.status(400).json({ status: 'error', message: 'Nama supplier wajib diisi' });

        const [result] = await req.db.query(
            'UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, address = ?, notes = ? WHERE id = ?',
            [name, contact_person || null, phone || null, address || null, notes || null, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ status: 'error', message: 'Supplier tidak ditemukan' });

        res.json({ status: 'success', message: 'Supplier berhasil diperbarui' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Gagal memperbarui supplier' });
    }
});

// DELETE supplier
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await req.db.query('DELETE FROM suppliers WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ status: 'error', message: 'Supplier tidak ditemukan' });

        res.json({ status: 'success', message: 'Supplier berhasil dihapus' });
    } catch (error) {
        res.status(400).json({ status: 'error', message: 'Gagal menghapus supplier' });
    }
});

module.exports = router;
