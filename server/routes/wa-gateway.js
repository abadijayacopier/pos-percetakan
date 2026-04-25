const express = require('express');
const router = express.Router();
const whatsappService = require('../utils/whatsappService');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/wa-gateway/status
router.get('/status', verifyToken, requireRole(['admin']), (req, res) => {
    res.json(whatsappService.getStatus(req.user.shopId));
});

// POST /api/wa-gateway/init
router.post('/init', verifyToken, requireRole(['admin']), async (req, res) => {
        let shopId = req.user.shopId;
        if (!shopId && process.env.APP_MODE === 'standalone') {
            shopId = 1;
        }
        
        // Mulai inisialisasi di background agar tidak memblock request
        whatsappService.init(shopId).catch(err => {
            console.error(`[WA Background Init Error] Shop ${shopId}:`, err);
        });

        res.json({ message: 'Inisialisasi WhatsApp Gateway dimulai di background' });
});

// POST /api/wa-gateway/logout
router.post('/logout', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        await whatsappService.logout(req.user.shopId);
        res.json({ message: 'Logout WhatsApp berhasil' });
    } catch (error) {
        console.error('Failed to logout WA Gateway:', error);
        res.status(500).json({ message: 'Gagal logout WA Gateway' });
    }
});

// POST /api/wa-gateway/reset
router.post('/reset', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        await whatsappService.reset(req.user.shopId);
        res.json({ message: 'Sesi WhatsApp berhasil direset' });
    } catch (error) {
        console.error('Failed to reset WA Gateway:', error);
        res.status(500).json({ message: 'Gagal reset WA Gateway' });
    }
});

// POST /api/wa-gateway/test
router.post('/test', verifyToken, requireRole(['admin']), async (req, res) => {
    const { to, message } = req.body;
    try {
        await whatsappService.sendMessage(req.user.shopId, to, message);
        res.json({ success: true, message: 'Pesan tes berhasil dikirim' });
    } catch (error) {
        console.error('Failed to send test message:', error);
        res.status(500).json({ message: error.message || 'Gagal mengirim pesan tes' });
    }
});

module.exports = router;
