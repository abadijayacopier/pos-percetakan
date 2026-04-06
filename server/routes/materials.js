'use strict';
/**
 * routes/materials.js
 * CRUD Master Bahan Cetak + Manajemen Stok
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// ── GET semua bahan ────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT *, updated_at AS updatedAt
            FROM materials
            ORDER BY kategori ASC, nama_bahan ASC
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: 'Gagal mengambil data bahan', error: e.message });
    }
});

// ── GET satu bahan ─────────────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM materials WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: 'Bahan tidak ditemukan' });
        res.json(rows[0]);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── POST tambah bahan baru ────────────────────────────────────────────────
router.post('/', verifyToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { nama_bahan, kategori, satuan, harga_modal, harga_jual, stok_saat_ini, stok_minimum, barcode, lokasi_rak, supplier_id } = req.body;
        if (!nama_bahan || !kategori || !satuan) {
            return res.status(400).json({ message: 'nama_bahan, kategori, dan satuan wajib diisi' });
        }
        const id = 'mat' + Date.now();
        await pool.query(
            `INSERT INTO materials (id, nama_bahan, kategori, satuan, harga_modal, harga_jual, stok_saat_ini, stok_minimum, barcode, lokasi_rak, supplier_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, nama_bahan, kategori, satuan,
                harga_modal || 0, harga_jual || 0,
                stok_saat_ini || 0, stok_minimum || 0,
                barcode || null, lokasi_rak || null, supplier_id || null]
        );
        res.status(201).json({ message: 'Bahan berhasil ditambahkan', id });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── PUT update bahan ───────────────────────────────────────────────────────
router.put('/:id', verifyToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { nama_bahan, kategori, satuan, harga_modal, harga_jual, stok_minimum, is_active, barcode, lokasi_rak, supplier_id } = req.body;
        await pool.query(
            `UPDATE materials SET nama_bahan=?, kategori=?, satuan=?, harga_modal=?,
             harga_jual=?, stok_minimum=?, is_active=?, barcode=?, lokasi_rak=?, supplier_id=?
             WHERE id=?`,
            [nama_bahan, kategori, satuan, harga_modal, harga_jual, stok_minimum,
                is_active !== undefined ? is_active : 1,
                barcode || null, lokasi_rak || null, supplier_id || null,
                req.params.id]
        );
        res.json({ message: 'Bahan berhasil diperbarui' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── DELETE bahan (soft-delete) ─────────────────────────────────────────────
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        await pool.query('UPDATE materials SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Bahan berhasil dinonaktifkan' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ── POST penyesuaian stok (masuk / keluar / penyesuaian) ──────────────────
router.post('/:id/stok', verifyToken, requireRole(['admin', 'operator']), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { tipe, jumlah, catatan } = req.body;   // tipe: masuk|keluar|penyesuaian
        if (!tipe || !jumlah || jumlah <= 0) {
            return res.status(400).json({ message: 'tipe dan jumlah (> 0) wajib diisi' });
        }

        // Update stok di materials
        let sql;
        if (tipe === 'masuk') sql = 'UPDATE materials SET stok_saat_ini = stok_saat_ini + ? WHERE id = ?';
        else if (tipe === 'keluar') sql = 'UPDATE materials SET stok_saat_ini = GREATEST(0, stok_saat_ini - ?) WHERE id = ?';
        else sql = 'UPDATE materials SET stok_saat_ini = ? WHERE id = ?'; // penyesuaian = set langsung

        await conn.query(sql, [jumlah, req.params.id]);

        // Catat ke material_movements
        const [matRows] = await conn.query('SELECT satuan FROM materials WHERE id = ?', [req.params.id]);
        await conn.query(
            `INSERT INTO material_movements (material_id, tipe, jumlah, satuan, catatan, user_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.params.id, tipe, jumlah, matRows[0]?.satuan || '-', catatan || null, req.user.id]
        );

        await conn.commit();
        res.json({ message: 'Stok berhasil diperbarui' });
    } catch (e) {
        await conn.rollback();
        res.status(500).json({ message: e.message });
    } finally {
        conn.release();
    }
});

// ── GET riwayat mutasi stok suatu bahan ───────────────────────────────────
router.get('/:id/movements', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT mm.*, u.name AS user_name
             FROM material_movements mm
             LEFT JOIN users u ON mm.user_id = u.id
             WHERE mm.material_id = ?
             ORDER BY mm.tanggal DESC LIMIT 50`,
            [req.params.id]
        );
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
