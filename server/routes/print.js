const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { verifyToken, requireRole } = require('../middleware/auth');

// 1. Ambil daftar printer yang terinstal di Windows via PowerShell
router.get('/printers', verifyToken, (req, res) => {
    // Command PowerShell untuk mengambil Property "Name" dari printer lokal
    const command = 'powershell.exe -Command "Get-Printer | Select-Object -ExpandProperty Name"';

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Exec error: ${error}`);
            // Jika ada error, kita berikan output array kosong sebagai fallback di frontend
            return res.status(500).json({ message: 'Gagal membaca daftar printer', printers: [] });
        }

        // Output windows memisahkan array dengan newline \r\n
        const printers = stdout
            .split('\n')
            .map(p => p.trim())
            .filter(p => p.length > 0);

        res.json(printers);
    });
});

// 2. Menerima payload TXT struk dan membidik printer
router.post('/receipt', verifyToken, requireRole(['kasir', 'admin']), (req, res) => {
    try {
        const { text, printerName, raw, mode, paperSize } = req.body;

        if (!text || !printerName) {
            return res.status(400).json({ message: 'Format teks atau printer belum diatur!' });
        }

        const tmpDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir);
        }

        const fileName = `receipt-${Date.now()}.txt`;
        const filePath = path.join(tmpDir, fileName);

        fs.writeFileSync(filePath, text, 'utf8');

        let command;

        if (raw) {
            // === RAW MODE: font bawaan printer (LX-310 dot matrix) ===
            const scriptPath = path.join(__dirname, '../scripts/raw-print.ps1');
            command = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -PrinterName "${printerName}" -FilePath "${filePath}"`;
        } else if (mode === 'inkjet') {
            // === INKJET MODE: Courier New font + paper size dinamis ===
            const scriptPath = path.join(__dirname, '../scripts/inkjet-print.ps1');
            const paper = paperSize || 'A4';
            command = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -PrinterName "${printerName}" -FilePath "${filePath}" -PaperSize "${paper}"`;
        } else {
            // === NORMAL MODE: Out-Printer (thermal) ===
            command = `powershell.exe -Command "Get-Content '${filePath}' | Out-Printer -Name '${printerName}'"`;
        }

        exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
            fs.unlink(filePath, (err) => {
                if (err) console.error(`Gagal menghapus file temporer ${filePath}: `, err);
            });

            if (error) {
                console.error(`Error mencetak struk: `, error);
                return res.status(500).json({ message: 'Proses cetak ke hardware gagal.' });
            }

            res.json({ message: 'Struk berhasil dikirim ke printer!' });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server backend gagal memproses struk cetak' });
    }
});

// 3. Kick Cash Drawer (ESC/POS command)
router.post('/open-drawer', verifyToken, requireRole(['kasir', 'admin']), (req, res) => {
    try {
        const { printerName } = req.body;
        if (!printerName) return res.status(400).json({ message: 'Printer belum dipilih!' });

        // Kommand standar ESC/POS untuk Kick Drawer: ESC p m t1 t2
        // Decimal: 27 112 0 25 250
        // Buffer ini dikirim langsung ke printer
        const drawerCommand = Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]).toString('binary');

        const tmpDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const fileName = `drawer-${Date.now()}.txt`;
        const filePath = path.join(tmpDir, fileName);

        // Simpan command sebagai file binary
        fs.writeFileSync(filePath, drawerCommand, 'binary');

        const scriptPath = path.join(__dirname, '../scripts/raw-print.ps1');
        const command = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -PrinterName "${printerName}" -FilePath "${filePath}"`;

        exec(command, (error) => {
            fs.unlink(filePath, () => { });
            if (error) return res.status(500).json({ message: 'Gagal membuka laci' });
            res.json({ message: 'Laci berhasil dibuka' });
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
