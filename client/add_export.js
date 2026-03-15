import fs from 'fs';
let file = 'd:/WEB/pos/client/src/pages/ReportsPage.jsx';
let c = fs.readFileSync(file, 'utf8');

const importReplacement = `import { useState, useMemo } from 'react';
import db from '../db';
import { formatRupiah, formatDate, formatDateTime } from '../utils';
import {
    FiFileText, FiDollarSign, FiShoppingCart, FiUsers, FiPrinter,
    FiDownload, FiCalendar, FiTrendingUp, FiBox, FiAlertTriangle,
    FiChevronLeft, FiChevronRight, FiPieChart, FiArrowUpRight, FiArrowDownRight
} from 'react-icons/fi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
`;

c = c.replace(/import \{ useState.*?from 'react-icons\/fi';\r?\n/s, importReplacement);

const exportFunctions = `
    const handlePrint = () => window.print();

    // CSV Export
    const exportCSV = (data, filename, headers) => {
        const csv = [headers.join(','), ...data.map(row => headers.map(h => {
            const val = row[h] ? String(row[h]) : '';
            return val.includes(',') ? \`"\${val}"\` : val;
        }).join(','))].join('\\n');
        const blob = new Blob(['\\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = \`\${filename}_\${new Date().toISOString().slice(0, 10)}.csv\`;
        link.click();
    };

    const exportSalesCSV = () => {
        const data = transactions.map(t => ({
            'No Invoice': t.invoiceNo,
            'Tanggal': formatDateTime(t.date),
            'Pelanggan': t.customerName || 'Umum',
            'Tipe': t.type,
            'Total': t.total,
            'Pembayaran': t.paymentType || t.paymentMethod,
            'Kasir': t.userName,
        }));
        exportCSV(data, 'laporan_penjualan', ['No Invoice', 'Tanggal', 'Pelanggan', 'Tipe', 'Total', 'Pembayaran', 'Kasir']);
    };

    const exportProductCSV = () => {
        const data = allProducts.map(p => ({
            'Kode': p.code,
            'Nama': p.name,
            'Harga Beli': p.buyPrice,
            'Harga Jual': p.sellPrice,
            'Stok': p.stock,
            'Satuan': p.unit,
        }));
        exportCSV(data, 'laporan_produk', ['Kode', 'Nama', 'Harga Beli', 'Harga Jual', 'Stok', 'Satuan']);
    };

    const exportCustomerCSV = () => {
        const data = allCustomers.map(c => ({
            'Nama': c.name,
            'Telepon': c.phone,
            'Alamat': c.address,
            'Tipe': c.type,
            'Total Transaksi': c.totalTrx || 0,
            'Total Belanja': c.totalSpend || 0,
        }));
        exportCSV(data, 'laporan_pelanggan', ['Nama', 'Telepon', 'Alamat', 'Tipe', 'Total Transaksi', 'Total Belanja']);
    };

    // PDF Export
    const exportPDF = () => {
        const doc = new jsPDF();
        const dateStr = \`\${formatDate(dateFrom)} - \${formatDate(dateTo)}\`;

        // Header Title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');

        let title = '';
        let head = [];
        let body = [];

        switch (activeTab) {
            case 'sales':
                title = 'Laporan Penjualan';
                head = [['No Invoice', 'Tanggal', 'Pelanggan', 'Tipe', 'Total', 'Pembayaran', 'Kasir']];
                body = transactions.map(t => [
                    t.invoiceNo,
                    formatDateTime(t.date),
                    t.customerName || 'Umum',
                    t.type,
                    formatRupiah(t.total),
                    t.paymentType || t.paymentMethod,
                    t.userName
                ]);
                break;
            case 'products':
                title = 'Laporan Stok & Nilai Produk';
                head = [['Kode', 'Nama Produk', 'Stok', 'Min. Stok', 'H. Beli', 'H. Jual', 'Nilai Total']];
                body = allProducts.map(p => [
                    p.code,
                    p.name,
                    \`\${p.stock} \${p.unit}\`,
                    \`\${p.minStock || 0} \${p.unit}\`,
                    formatRupiah(p.buyPrice),
                    formatRupiah(p.sellPrice),
                    formatRupiah((p.stock || 0) * (p.sellPrice || 0))
                ]);
                break;
            case 'customers':
                title = 'Laporan Data Pelanggan';
                head = [['Nama', 'Tipe', 'Telepon', 'Alamat', 'Total Trx', 'Total Belanja']];
                body = allCustomers.map(c => [
                    c.name,
                    c.type,
                    c.phone || '-',
                    c.address || '-',
                    c.totalTrx || 0,
                    formatRupiah(c.totalSpend || 0)
                ]);
                break;
            default:
                break;
        }

        doc.text(title, 14, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(\`Periode: \${dateStr}\`, 14, 28);
        doc.text(\`Dicetak pada: \${formatDateTime(new Date())}\`, 14, 34);

        doc.autoTable({
            startY: 42,
            head: head,
            body: body,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }, // Primary Blue
            styles: { fontSize: 8, cellPadding: 3 },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        doc.save(\`\${title.toLowerCase().replace(/ /g, '_')}_\${new Date().toISOString().slice(0, 10)}.pdf\`);
    };

    const Pagination = ({ tab, total }) => {`;

c = c.replace(/const handlePageChange = \(tab, p\) => \{\r?\n[ \t]*setPages\(prev => \(\{ \.\.\.prev, \[tab\]: p \}\)\);\r?\n[ \t]*\};\r?\n\r?\n[ \t]*const Pagination = \(\{ tab, total \}\) => \{/, `const handlePageChange = (tab, p) => {\n        setPages(prev => ({ ...prev, [tab]: p }));\n    };\n${exportFunctions}`);

const buttonsStr = `<button
                        onClick={handlePrint}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 shadow-sm transition-all"
                    >
                        <FiPrinter className="text-lg" />
                        Print Page
                    </button>
                    <button
                        onClick={exportPDF}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-500/20 active:scale-95 group"
                    >
                        <FiDownload className="text-lg group-hover:translate-y-0.5 transition-transform" />
                        Export PDF
                    </button>
                    <button
                        onClick={activeTab === 'sales' ? exportSalesCSV : activeTab === 'products' ? exportProductCSV : exportCustomerCSV}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95 group"
                    >
                        <FiDownload className="text-lg group-hover:translate-y-0.5 transition-transform" />
                        Export CSV
                    </button>`;

c = c.replace(/<button\r?\n[ \t]*onClick=\{handlePrint\}[\s\S]*?Export CSV\r?\n[ \t]*<\/button>/, buttonsStr);

fs.writeFileSync(file, c);
console.log('Done injecting export logic');
