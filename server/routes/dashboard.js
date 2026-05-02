const express = require('express');
const router = express.Router();
const { masterPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

router.get('/stats', verifyToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Omset & Trx Count Hari Ini (Derived from Transactions for better accuracy)
        const [trxStats] = await req.db.query(
            "SELECT SUM(CASE WHEN status IN ('paid', 'completed') THEN total ELSE paid END) as omset, COUNT(id) as trxCount FROM transactions WHERE date LIKE ?",
            [`${today}%`]
        );

        // 2. Saldo (Tenant Scope)
        const [cashFlow] = await req.db.query(
            "SELECT SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END) as saldo FROM cash_flow"
        );

        // 3. Pending Print (Hanya hitung yang benar-benar sedang diproses/antre)
        const [pendingPrint] = await req.db.query(
            "SELECT COUNT(id) as count FROM dp_tasks WHERE status NOT IN ('diambil', 'batal', 'checkout', 'selesai')"
        );

        // 4. Pending & Active Service
        const [serviceStats] = await req.db.query(`
            SELECT 
                SUM(CASE WHEN status = 'pengerjaan' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status IN ('approval', 'diterima', 'pending') THEN 1 ELSE 0 END) as pending
            FROM service_orders
            WHERE status NOT IN ('diambil', 'batal', 'selesai')
        `);
        const activeServiceCount = serviceStats[0]?.active || 0;
        const pendingServiceCount = serviceStats[0]?.pending || 0;

        // 5. Low Stock
        const [lowStock] = await req.db.query(
            "SELECT COUNT(id) as count FROM products WHERE stock <= IFNULL(min_stock, 0)"
        );

        // 6. Analytics Data (Last 30 days - Tenant Scope)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];

        const [periodTrx] = await req.db.query(
            "SELECT DATE(date) as date, SUM(CASE WHEN status IN ('paid', 'completed') THEN total ELSE paid END) as total FROM transactions WHERE date >= ? GROUP BY DATE(date) ORDER BY DATE(date)",
            [`${startDate} 00:00:00`]
        );

        // Map data
        const dataMap = {};
        periodTrx.forEach(row => {
            const dateStr = new Date(row.date).toISOString().split('T')[0];
            dataMap[dateStr] = parseFloat(row.total || 0);
        });

        const weeklyData = [];
        const monthlyData = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const dataPoint = {
                label: i < 7 ? d.toLocaleDateString('id-ID', { weekday: 'short' }).toUpperCase() : `${d.getDate()}/${d.getMonth() + 1}`,
                total: dataMap[dateStr] || 0,
                fullDate: dateStr
            };

            monthlyData.push(dataPoint);
            if (i < 7) {
                weeklyData.push(dataPoint);
            }
        }

        // 7. Activity Log (Tenant Specific)
        const [activityLog] = await req.db.query(`
            SELECT al.id, al.user_id, al.user_name, al.action, al.detail, al.timestamp
            FROM activity_log al 
            ORDER BY al.id DESC 
            LIMIT 10
        `);

        // 8. Dynamic System Alerts
        const alerts = [];
        if (lowStock[0]?.count > 0) alerts.push(`⚠️ ${lowStock[0].count} Produk hampir habis stok! Harap segera restock.`);
        if (pendingServiceCount > 0) alerts.push(`🛠️ ${pendingServiceCount} Servis baru sedang menunggu persetujuan.`);
        if (activeServiceCount > 0) alerts.push(`⚙️ ${activeServiceCount} Unit sedang dalam proses perbaikan teknisi.`);
        
        // Split pending print alerts for better clarity
        const [printAlerts] = await req.db.query(`
            SELECT 
                SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as ready,
                SUM(CASE WHEN status NOT IN ('selesai', 'diambil', 'batal', 'checkout') THEN 1 ELSE 0 END) as processing
            FROM dp_tasks
        `);
        
        if (printAlerts[0]?.processing > 0) alerts.push(`🖨️ ${printAlerts[0].processing} Pesanan cetak sedang dalam antrean/pengerjaan.`);
        if (printAlerts[0]?.ready > 0) alerts.push(`✅ ${printAlerts[0].ready} Pesanan cetak sudah selesai & siap diambil.`);

        if (alerts.length < 2) {
            alerts.push("💡 Tips: Gunakan shortcut F2 untuk transaksi jilid cepat.");
            alerts.push("✅ Berikan struk bukti service ke pelanggan saat unit diterima.");
        }

        // 9. Top Selling Products
        const [topProducts] = await req.db.query(`
            SELECT name, SUM(qty) as count, SUM(subtotal) as revenue 
            FROM transaction_details 
            GROUP BY product_id, name 
            ORDER BY count DESC 
            LIMIT 5
        `);

        // 10. Category Distribution (Improved with LEFT JOIN and Fallback)
        const [categorySalesRaw] = await req.db.query(`
            SELECT 
                COALESCE(c.name, 'Jasa & Lainnya') as name, 
                SUM(td.subtotal) as value
            FROM transaction_details td
            LEFT JOIN products p ON td.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            GROUP BY name
            ORDER BY value DESC
        `);

        const categorySales = categorySalesRaw.map(item => ({
            name: item.name,
            value: parseFloat(item.value || 0)
        }));

        res.json({
            omset: parseFloat(trxStats[0]?.omset || 0),
            trxCount: trxStats[0]?.trxCount || 0,
            saldo: parseFloat(cashFlow[0]?.saldo || 0),
            pendingPrintCount: pendingPrint[0]?.count || 0,
            pendingServiceCount: activeServiceCount, // We use active count for the main badge
            activeServiceCount,
            waitingServiceCount: pendingServiceCount,
            lowStockCount: lowStock[0]?.count || 0,
            weeklyData,
            monthlyData,
            activityLog,
            alerts,
            topProducts,
            categorySales
        });

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ message: 'Gagal memuat statistik dashboard' });
    }
});

module.exports = router;
