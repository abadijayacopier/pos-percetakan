const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { masterPool, getTenantPool } = require('../config/database');
const TenantManager = require('../utils/tenantManager');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password, shopId } = req.body;
        const isStandalone = process.env.APP_MODE === 'standalone';

        // 1. Resolve Tenant DB
        let dbName;
        let resolvedShopId = shopId;

        if (isStandalone) {
            dbName = process.env.DB_NAME || 'pos_abadi';
            resolvedShopId = 1; // Standard ID for standalone
        } else {
            const shopResult = await TenantManager.getShopDBName(shopId);
            if (!shopResult) {
                return res.status(404).json({ message: 'Toko tidak ditemukan atau tidak aktif.' });
            }
            dbName = shopResult.dbName;
            resolvedShopId = shopResult.shopId;
        }

        // 2. Get Tenant Connection Pool
        const tenantDb = getTenantPool(dbName);

        // 3. User Lookup in Tenant DB
        // We use the tenantDb directly for login
        const [rows] = await tenantDb.query('SELECT * FROM users WHERE username = ? AND is_active = true', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Username tidak ditemukan di toko ini.' });
        }

        const user = rows[0];

        // 4. Verify password via bcrypt
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            return res.status(401).json({ message: 'Password salah!' });
        }

        // --- 4b. SaaS Hardware Access Control ---
        const hwid = req.body.hwid;
        if (!isStandalone && hwid && user.role === 'admin') {
            try {
                const [shops] = await masterPool.query('SELECT hwid_lock FROM shops WHERE id = ?', [resolvedShopId]);
                if (shops.length > 0) {
                    const hwidLock = shops[0].hwid_lock;
                    if (!hwidLock) {
                        // Pertama kali login, kunci perangkat ini
                        await masterPool.query('UPDATE shops SET hwid_lock = ?, last_hwid_update = NOW() WHERE id = ?', [hwid, resolvedShopId]);
                        console.log(`🔒 Shop ${resolvedShopId} locked to Hardware ID: ${hwid}`);
                    } else if (hwidLock !== hwid) {
                        return res.status(403).json({
                            error: 'HARDWARE_MISMATCH',
                            message: 'Akun ini terdaftar untuk perangkat lain. Silakan hubungi admin untuk reset perangkat.'
                        });
                    }
                }
            } catch (hwidErr) {
                console.error('SaaS HWID Check Error:', hwidErr.message);
            }
        }

        // 5. Buat JWT Token with Shop Context
        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                shopId: resolvedShopId,
                hwid: hwid || 'GLOBAL'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Activity Log
        try {
            await tenantDb.query(
                'INSERT INTO activity_log (user_id, user_name, action, target, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
                [user.id, user.name, 'LOGIN', 'Auth', `Login sukses ke Toko ID: ${resolvedShopId}`, req.ip || null]
            );
        } catch (logError) {
            console.error('Login Activity Log Error:', logError.message);
        }

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                shopId: resolvedShopId
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

/**
 * POST /api/auth/register-shop
 * Register a new shop and create its isolated database
 */
router.post('/register-shop', async (req, res) => {
    try {
        const { shopName, subdomain, ownerEmail, adminPassword } = req.body;

        if (!shopName || !subdomain || !ownerEmail || !adminPassword) {
            return res.status(400).json({ message: 'Semua data registrasi harus diisi!' });
        }

        // 1. Create Tenant (Master Entry + Physical DB + Schema)
        const tenant = await TenantManager.createTenant({
            shop_name: shopName,
            subdomain: subdomain,
            owner_email: ownerEmail
        });

        const tenantDb = getTenantPool(tenant.dbName);

        // 2. Create Initial Admin User in Tenant DB
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await tenantDb.query(
            'INSERT INTO users (id, name, username, password, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [`owner_${Date.now()}`, 'Shop Owner', ownerEmail, hashedPassword, 'admin', true]
        );

        res.status(201).json({
            success: true,
            message: 'Toko berhasil didaftarkan dan database telah siap!',
            shopId: tenant.shopId,
            subdomain: subdomain
        });

    } catch (error) {
        console.error('Registration Error:', error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Subdomain atau Email sudah digunakan.' });
        }
        res.status(500).json({ message: 'Gagal mendaftarkan toko: ' + error.message });
    }
});

/**
 * GET /api/auth/info
 * Get system public info (mode, etc)
 */
router.get('/info', (req, res) => {
    res.json({
        mode: process.env.APP_MODE || 'standalone',
        isSaaS: process.env.APP_MODE === 'saas'
    });
});

module.exports = router;
