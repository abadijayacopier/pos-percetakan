const express = require('express');
const router = express.Router();
const whatsappService = require('../utils/whatsappService');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/wa-gateway/status
router.get('/status', verifyToken, requireRole(['admin']), (req, res) => {
    res.json(whatsappService.getStatus());
});

// POST /api/wa-gateway/init
router.post('/init', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        await whatsappService.init();
        res.json({ message: 'Inisialisasi WhatsApp Gateway dimulai' });
    } catch (error) {
        console.error('Failed to init WA Gateway:', error);
        res.status(500).json({ message: 'Gagal inisialisasi WA Gateway' });
    }
});

// POST /api/wa-gateway/logout
router.post('/logout', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        await whatsappService.logout();
        res.json({ message: 'Logout WhatsApp berhasil' });
    } catch (error) {
        console.error('Failed to logout WA Gateway:', error);
        res.status(500).json({ message: 'Gagal logout WA Gateway' });
    }
});

// POST /api/wa-gateway/test
router.post('/test', verifyToken, requireRole(['admin']), async (req, res) => {
    const { to, message } = req.body;
    try {
        await whatsappService.sendMessage(to, message);
        res.json({ success: true, message: 'Pesan tes berhasil dikirim' });
    } catch (error) {
        console.error('Failed to send test message:', error);
        res.status(500).json({ message: error.message || 'Gagal mengirim pesan tes' });
    }
});

module.exports = router;
