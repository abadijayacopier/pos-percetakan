const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const crypto = require('crypto');

// GET all suppliers
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY created_at DESC');
        res.json({
            status: 'success',
            data: rows
        });
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
});

// POST add new supplier
router.post('/', async (req, res) => {
    try {
        const { name, contact_person, phone, address, notes } = req.body;

        if (!name) {
            return res.status(400).json({ status: 'error', message: 'Nama supplier wajib diisi' });
        }

        const id = crypto.randomUUID();

        await pool.query(
            'INSERT INTO suppliers (id, name, contact_person, phone, address, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, contact_person || null, phone || null, address || null, notes || null]
        );

        res.status(201).json({
            status: 'success',
            message: 'Supplier berhasil ditambahkan',
            data: { id, name, contact_person, phone, address, notes }
        });
    } catch (error) {
        console.error('Error adding supplier:', error);
        res.status(500).json({ status: 'error', message: 'Gagal menambahkan supplier' });
    }
});

// PUT update supplier
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contact_person, phone, address, notes } = req.body;

        if (!name) {
            return res.status(400).json({ status: 'error', message: 'Nama supplier wajib diisi' });
        }

        const [result] = await pool.query(
            'UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, address = ?, notes = ? WHERE id = ?',
            [name, contact_person || null, phone || null, address || null, notes || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Supplier tidak ditemukan' });
        }

        res.json({
            status: 'success',
            message: 'Supplier berhasil diperbarui'
        });
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ status: 'error', message: 'Gagal memperbarui supplier' });
    }
});

// DELETE supplier
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Supplier tidak ditemukan' });
        }

        res.json({
            status: 'success',
            message: 'Supplier berhasil dihapus'
        });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        // Usually fails due to foreign key constraints
        res.status(400).json({ status: 'error', message: 'Gagal menghapus supplier, pastikan tidak ada transaksi yang terhubung' });
    }
});

module.exports = router;
