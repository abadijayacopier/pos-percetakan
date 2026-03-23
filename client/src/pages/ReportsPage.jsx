import { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import { formatRupiah, formatDate, formatDateTime } from '../utils';
import html2pdf from 'html2pdf.js';
import Swal from 'sweetalert2';
import { ProfitLossContent } from '../components/ProfitLossContent';
import PrintReportLayout from '../components/PrintReportLayout';
import {
    FiFileText, FiDollarSign, FiShoppingCart, FiUsers, FiPrinter,
    FiDownload, FiCalendar, FiTrendingUp, FiBox, FiAlertTriangle, FiActivity,
    FiChevronLeft, FiChevronRight, FiPieChart, FiArrowUpRight, FiArrowDownRight
} from 'react-icons/fi';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('sales');
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date(); d.setMonth(d.getMonth() - 1);
        return d.toISOString().slice(0, 10);
    });
    const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

    // Pagination state per tab
    const [pages, setPages] = useState({ sales: 1, products: 1, customers: 1 });
    const PER_PAGE = 10;

    const [allTransactions, setAllTransactions] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [allCustomers, setAllCustomers] = useState([]);
    const [allCashFlow, setAllCashFlow] = useState([]);
    const [storeInfo, setStoreInfo] = useState({ name: 'ABADI JAYA', tagline: 'Percetakan & Fotocopy', footer: 'SISTEM MONITORING & INVENTORI TERPADU | DOKUMEN DIGENERATE SECARA OTOMATIS' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [trxRes, prdRes, cstRes, cfRes, setRes] = await Promise.all([
                    api.get('/transactions'),
                    api.get('/products'),
                    api.get('/customers').catch(() => ({ data: [] })),
                    api.get('/finance'),
                    api.get('/settings').catch(() => ({ data: [] }))
                ]);
                setAllTransactions(Array.isArray(trxRes.data) ? trxRes.data : []);
                setAllProducts(Array.isArray(prdRes.data) ? prdRes.data : []);
                setAllCustomers(Array.isArray(cstRes.data) ? cstRes.data : []);
                setAllCashFlow(Array.isArray(cfRes.data) ? cfRes.data : []);

                const info = {};
                if (Array.isArray(setRes.data)) {
                    setRes.data.forEach(s => { info[s.key] = s.value; });
                }
                setStoreInfo({
                    name: info.store_name || 'ABADI JAYA',
                    tagline: info.store_tagline || 'Percetakan & Fotocopy',
                    footer: info.receipt_footer || 'SISTEM MONITORING & INVENTORI TERPADU | DOKUMEN DIGENERATE SECARA OTOMATIS'
                });
            } catch (err) {
                console.error('Failed to load reports data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Filter transactions by date range
    const transactions = useMemo(() => {
        return allTransactions.filter(t => {
            const d = t.date ? t.date.slice(0, 10) : '';
            return d >= dateFrom && d <= dateTo;
        }).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    }, [allTransactions, dateFrom, dateTo]);

    // Sales metrics
    const totalRevenue = transactions.reduce((s, t) => s + (t.total || 0), 0);
    const totalTrx = transactions.length;
    const avgTrx = totalTrx > 0 ? Math.round(totalRevenue / totalTrx) : 0;
    const cashIn = allCashFlow.filter(c => c.type === 'in').reduce((s, c) => s + (c.amount || 0), 0);
    const cashOut = allCashFlow.filter(c => c.type === 'out').reduce((s, c) => s + (c.amount || 0), 0);

    // Product metrics
    const lowStockProducts = allProducts.filter(p => p.stock <= (p.minStock || 0) && (p.minStock || 0) > 0);
    const totalStockValue = allProducts.reduce((s, p) => s + (p.sellPrice || 0) * (p.stock || 0), 0);

    // Best selling products from transactions
    const productSales = useMemo(() => {
        const map = {};
        transactions.forEach(t => {
            (t.items || []).forEach(item => {
                const key = item.productId || item.name;
                if (!map[key]) map[key] = { name: item.name, qty: 0, revenue: 0 };
                map[key].qty += item.qty;
                map[key].revenue += item.subtotal || (item.qty * item.price);
            });
        });
        return Object.values(map).sort((a, b) => b.revenue - a.revenue);
    }, [transactions]);

    // Customer metrics
    const topCustomers = useMemo(() => {
        return [...allCustomers].sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0)).slice(0, 10);
    }, [allCustomers]);

    // Payment method breakdown
    const paymentBreakdown = useMemo(() => {
        const map = {};
        transactions.forEach(t => {
            const m = (t.paymentType || t.paymentMethod || 'tunai').toLowerCase();
            map[m] = (map[m] || 0) + (t.total || 0);
        });
        return Object.entries(map).map(([method, amount]) => ({ method, amount }));
    }, [transactions]);

    // Paginated Data
    const paginatedSales = useMemo(() => {
        return transactions.slice((pages.sales - 1) * PER_PAGE, pages.sales * PER_PAGE);
    }, [transactions, pages.sales]);

    const paginatedProducts = useMemo(() => {
        return allProducts.slice((pages.products - 1) * PER_PAGE, pages.products * PER_PAGE);
    }, [allProducts, pages.products]);

    const paginatedCustomers = useMemo(() => {
        return allCustomers.slice((pages.customers - 1) * PER_PAGE, pages.customers * PER_PAGE);
    }, [allCustomers, pages.customers]);

    const handlePageChange = (tab, p) => {
        setPages(prev => ({ ...prev, [tab]: p }));
    };

    const handlePrint = () => window.print();

    // CSV Export
    const exportCSV = (data, filename, headers) => {
        const csv = [headers.join(','), ...data.map(row => headers.map(h => {
            const val = row[h] ?? '';
            return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(','))].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
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

    const handleExportPDF = () => {
        Swal.fire({
            title: 'Mengekspor Laporan...',
            text: 'Tunggu sejenak, sedang memproses PDF',
            allowOutsideClick: false,
            didOpen: async () => {
                Swal.showLoading();
                const element = document.getElementById('print-report-content');
                if (element) {
                    const wasHidden = element.classList.contains('hidden');
                    if (wasHidden) {
                        element.classList.remove('hidden');
                        element.classList.add('block');
                    }
                    const opt = {
                        margin: 15,
                        filename: `Laporan_${activeTab}_${Date.now()}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    };
                    try {
                        await html2pdf().set(opt).from(element).save();
                        Swal.fire({
                            icon: 'success',
                            title: 'Berhasil!',
                            text: 'Laporan PDF telah diunduh.',
                            confirmButtonColor: '#3b82f6'
                        });
                    } catch (e) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Gagal',
                            text: 'Gagal memproses PDF',
                            confirmButtonColor: '#ef4444'
                        });
                    } finally {
                        if (wasHidden) {
                            element.classList.add('hidden');
                            element.classList.remove('block');
                        }
                    }
                } else {
                    Swal.fire({ icon: 'warning', text: 'Data tidak tersedia' });
                }
            }
        });
    };

    const renderPagination = (tab, total) => {
        const totalPages = Math.ceil(total / PER_PAGE);
        const currentPage = pages[tab];
        if (totalPages <= 1) return null;
        return (
            <div className="p-6 bg-slate-50/30 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, total)} of {total} records
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(tab, Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
                    >
                        <FiChevronLeft size={18} />
                    </button>
                    <span className="text-xs font-black min-w-12 text-center dark:text-white">
                        {currentPage} <span className="text-slate-400">/</span> {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(tab, Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
                    >
                        <FiChevronRight size={18} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 print:space-y-0 print:p-0 font-display bg-slate-50/30 dark:bg-transparent print:bg-white dark:print:bg-white print:text-black dark:print:text-black min-h-screen print:min-h-0 print:h-auto print:block">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 print:hidden">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-500/20">
                            <FiPieChart className="text-2xl" />
                        </div>
                        Laporan Bisnis
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 ml-1 italic opacity-75 underline decoration-blue-500/30 underline-offset-4">Real-time Financial & Operational Intelligence</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => window.print()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-slate-900 rounded-2xl font-bold transition-all shadow-xl shadow-slate-900/20 active:scale-95 text-sm"
                        >
                            <FiPrinter size={16} />
                            Cetak
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-rose-900/20 active:scale-95 text-sm"
                        >
                            <FiDownload size={16} />
                            Ekspor PDF
                        </button>
                    </div>
                    <button
                        onClick={activeTab === 'profit-loss' ? () => window.print() : activeTab === 'sales' ? exportSalesCSV : activeTab === 'products' ? exportProductCSV : exportCustomerCSV}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95 group"
                    >
                        <FiDownload className="text-lg group-hover:translate-y-0.5 transition-transform" />
                        {activeTab === 'profit-loss' ? 'Cetak' : 'Export CSV'}
                    </button>
                </div>
            </div>

            {/* Print Only Header */}
            {activeTab !== 'sales' && (
                <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-8">
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                        Laporan {activeTab === 'products' ? 'Stok Produk' : activeTab === 'profit-loss' ? 'Laba Rugi' : 'Analisis Pelanggan'}
                    </h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Periode: {formatDate(dateFrom)} - {formatDate(dateTo)} | Dicetak: {formatDateTime(new Date())}
                    </p>
                </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-6 justify-between print:hidden">
                <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 items-center">
                    {[
                        { id: 'sales', label: 'Penjualan', icon: FiShoppingCart },
                        { id: 'products', label: 'Produk', icon: FiBox },
                        { id: 'customers', label: 'Pelanggan', icon: FiUsers },
                        { id: 'profit-loss', label: 'Laba Rugi', icon: FiTrendingUp },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${activeTab === tab.id
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 shadow-lg'
                                : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-300'
                                }`}
                        >
                            <tab.icon className="text-sm" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <FiCalendar className="text-slate-400 ml-2" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="bg-transparent border-none text-[10px] font-black text-slate-900 dark:text-white focus:ring-0 uppercase cursor-pointer"
                    />
                    <div className="w-4 h-0.5 bg-slate-300 dark:bg-slate-700"></div>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="bg-transparent border-none text-[10px] font-black text-slate-900 dark:text-white focus:ring-0 uppercase cursor-pointer"
                    />
                </div>
            </div>

            {/* ============ SALES REPORT ============ */}
            {activeTab === 'sales' && (
                <>
                    <div className="space-y-8 slide-in-from-bottom-4 duration-500 print:hidden">
                        {/* Metrics */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Revenue', value: formatRupiah(totalRevenue), icon: FiDollarSign, color: 'blue', sub: 'Gross Income' },
                                { label: 'Transactions', value: totalTrx, icon: FiShoppingCart, color: 'emerald', sub: 'Order Count' },
                                { label: 'Avg / Trx', value: formatRupiah(avgTrx), icon: FiTrendingUp, color: 'indigo', sub: 'Basket Size' },
                                { label: 'Cash Inflow', value: formatRupiah(cashIn), icon: FiArrowUpRight, color: 'emerald', sub: 'Verified Flow' },
                            ].map((s, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-4 rounded-2xl ${s.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                                            s.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                                                'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                                            }`}>
                                            <s.icon className="text-xl" />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{s.sub}</span>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-75">{s.label}</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none">{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Payment Breakdown */}
                        {paymentBreakdown.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
                                <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <div className="size-2 bg-blue-500 rounded-full"></div>
                                    Metode Settlement
                                </h3>
                                <div className="flex flex-wrap gap-4">
                                    {paymentBreakdown.map(pb => (
                                        <div key={pb.method} className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col min-w-[140px]">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-75">{pb.method}</span>
                                            <span className="text-lg font-black text-slate-900 dark:text-white italic tracking-tighter">{formatRupiah(pb.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Transaction Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex justify-between items-center">
                                <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                    <div className="size-3 bg-indigo-500 rounded-full"></div>
                                    Log Transaksi Periode ({transactions.length})
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                                            <th className="px-8 py-5">No Invoice</th>
                                            <th className="px-8 py-5">Timestamp</th>
                                            <th className="px-8 py-5">Pelanggan</th>
                                            <th className="px-8 py-5">Tipe Order</th>
                                            <th className="px-8 py-5 text-right">Settlement</th>
                                            <th className="px-8 py-5">Payment</th>
                                            <th className="px-8 py-5 text-right">Authorized</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {paginatedSales.map(t => (
                                            <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <span className="text-[11px] font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 px-2 py-1 rounded">
                                                        {t.invoiceNo}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase">{formatDate(t.date)}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(t.date || t.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.customerName || 'Pelanggan Umum'}</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                                                        {t.type}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="text-[11px] font-black text-emerald-600 italic tracking-tighter">{formatRupiah(t.total)}</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.paymentType || t.paymentMethod}</span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.userName}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {transactions.length === 0 && (
                                    <div className="py-24 text-center">
                                        <FiShoppingCart size={48} className="mx-auto mb-4 text-slate-200" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Belum ada data transaksi di periode ini</p>
                                    </div>
                                )}
                            </div>
                            {renderPagination('sales', transactions.length)}
                        </div>
                    </div>

                    {/* --- PRINT ONLY SALES REPORT (A4 FORMAT) --- */}
                    <PrintReportLayout
                        title="Laporan Penjualan"
                        period={dateFrom === dateTo ? formatDate(dateFrom) : `${formatDate(dateFrom)} - ${formatDate(dateTo)}`}
                        printedBy="Admin / Kasir"
                        storeInfo={storeInfo}
                    >
                        {/* DATA TABLE */}
                        <section className="mb-10">
                            <h3 className="font-bold text-gray-800 mb-4 border-l-4 border-black pl-3 uppercase tracking-widest text-sm">Rincian Transaksi</h3>
                            <table className="print-table">
                                <thead>
                                    <tr>
                                        <th className="w-1/6">ID TRX</th>
                                        <th className="w-1/6">Waktu</th>
                                        <th>Pelanggan</th>
                                        <th className="text-center w-1/6">Tipe</th>
                                        <th className="text-right w-1/5">Nilai (Rp)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((t, idx) => (
                                        <tr key={t.id || idx}>
                                            <td className="font-mono text-gray-500 font-semibold">{t.invoiceNo}</td>
                                            <td className="text-gray-800 font-medium">{new Date(t.date || t.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="font-bold text-gray-900 text-sm uppercase">{t.customerName || 'Umum'}</td>
                                            <td className="text-center">
                                                <span className="font-bold uppercase tracking-wider text-[10px] text-gray-600">{t.type}</span>
                                            </td>
                                            <td className="text-right font-black text-gray-900 text-sm">{formatRupiah(t.total)}</td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center italic text-gray-500">Tidak ada transaksi pada periode ini.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </section>

                        {/* BOTTOM RECAP */}
                        <section className="flex break-inside-avoid">
                            <div className="w-1/2 pr-8">
                                <h3 className="font-bold text-gray-800 mb-4 border-l-4 border-gray-400 pl-3 uppercase tracking-widest text-sm">Metode Pembayaran</h3>
                                <table className="print-table w-full">
                                    <tbody>
                                        {paymentBreakdown.map((pb, idx) => (
                                            <tr key={idx}>
                                                <td className="text-gray-700 font-bold uppercase tracking-wider text-[10px]">{pb.method}</td>
                                                <td className="text-right font-black text-gray-900">{formatRupiah(pb.amount)}</td>
                                            </tr>
                                        ))}
                                        {paymentBreakdown.length === 0 && (
                                            <tr><td colSpan="2" className="py-4 text-gray-500 italic text-center">Belum ada data pembayaran</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="w-1/2 pl-8 border-l-2 border-gray-300">
                                <h3 className="font-bold text-gray-800 mb-5 uppercase text-right tracking-widest text-sm">Rekapitulasi</h3>
                                <div className="flex justify-between py-1.5">
                                    <span className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">Subtotal Penjualan</span>
                                    <span className="font-semibold text-gray-800 text-sm">{formatRupiah(totalRevenue + (transactions.reduce((s, t) => s + (t.discount || 0), 0)))}</span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span className="text-red-600 font-bold uppercase tracking-widest text-[10px]">Diskon Diberikan</span>
                                    <span className="font-semibold text-red-600 text-sm">- {formatRupiah(transactions.reduce((s, t) => s + (t.discount || 0), 0))}</span>
                                </div>
                                <div className="flex justify-between py-4 mt-4 border-t-4 border-black">
                                    <span className="font-black text-gray-900 text-lg uppercase tracking-widest">Net Sales</span>
                                    <span className="font-black text-gray-900 text-2xl">{formatRupiah(totalRevenue)}</span>
                                </div>
                            </div>
                        </section>
                    </PrintReportLayout>
                </>
            )}

            {/* ============ PRODUCT REPORT ============ */}
            {activeTab === 'products' && (
                <>
                    <div className="space-y-8 slide-in-from-bottom-4 duration-500 print:hidden">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Inventory SKU', value: allProducts.length, icon: FiBox, color: 'blue', sub: 'Total Types' },
                                { label: 'Inventory Value', value: formatRupiah(totalStockValue), icon: FiDollarSign, color: 'emerald', sub: 'Calculated Cost' },
                                { label: 'Low Stocks', value: lowStockProducts.length, icon: FiAlertTriangle, color: lowStockProducts.length > 0 ? 'rose' : 'slate', sub: 'Immediate Action' },
                                { label: 'Active SKUs', value: productSales.length, icon: FiTrendingUp, color: 'indigo', sub: 'Conversion Rate' },
                            ].map((s, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-4 rounded-2xl ${s.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                                            s.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                                                s.color === 'rose' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' :
                                                    'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                                            }`}>
                                            <s.icon className="text-xl" />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{s.sub}</span>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-75">{s.label}</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none">{s.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Best Selling */}
                            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-fit">
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-900/10">
                                    <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                        <div className="size-2 bg-amber-500 rounded-full animate-pulse"></div>
                                        🏆 Hot Items / Top 10 Sales
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {productSales.slice(0, 10).map((ps, i) => (
                                        <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs font-black text-slate-300 w-4">{i + 1}</span>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{ps.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{ps.qty} units moved</p>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-black text-emerald-600 italic">{formatRupiah(ps.revenue)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Inventory Pulse */}
                            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                        <FiActivity className="text-blue-600" />
                                        Database Master SKU ({allProducts.length})
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                                                <th className="px-8 py-5">Kode / SKU</th>
                                                <th className="px-8 py-5">Nama Produk</th>
                                                <th className="px-8 py-5 text-right">Stok</th>
                                                <th className="px-8 py-5 text-right">Valuation</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {paginatedProducts.map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{p.code}</span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase">{p.name}</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className={`text-[11px] font-black ${p.stock <= (p.minStock || 0) ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                                                            {p.stock} <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">{p.unit}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className="text-[11px] font-black text-blue-600 italic">{formatRupiah(p.sellPrice * p.stock)}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {renderPagination('products', allProducts.length)}
                            </div>
                        </div>
                    </div>

                    {/* --- PRINT ONLY PRODUCT REPORT (A4 FORMAT) --- */}
                    <PrintReportLayout
                        title="Laporan Stok Produk"
                        printedBy="Admin Gudang"
                        storeInfo={storeInfo}
                    >
                        {/* DATA TABLE */}
                        <section className="mb-10">
                            <h3 className="font-bold text-gray-800 mb-4 border-l-4 border-black pl-3 uppercase tracking-widest text-sm">Daftar Inventori Master</h3>
                            <table className="print-table">
                                <thead>
                                    <tr>
                                        <th className="w-1/6">Kode / SKU</th>
                                        <th>Nama Produk</th>
                                        <th className="text-center w-1/6">Sisa Stok</th>
                                        <th className="text-right w-1/5">Nilai (Rp)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allProducts.map((p, idx) => (
                                        <tr key={p.id || idx}>
                                            <td className="font-mono text-gray-500 font-semibold">{p.code}</td>
                                            <td className="text-gray-900 font-bold text-sm uppercase">{p.name}</td>
                                            <td className="text-center">
                                                <span className={`font-black text-sm ${p.stock <= (p.minStock || 0) ? 'text-rose-600' : 'text-gray-900'}`}>{p.stock}</span>
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{p.unit}</span>
                                            </td>
                                            <td className="text-right font-black text-gray-900 text-sm">{formatRupiah((p.sellPrice || 0) * (p.stock || 0))}</td>
                                        </tr>
                                    ))}
                                    {allProducts.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-center italic text-gray-500">Tidak ada data produk.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </section>
                    </PrintReportLayout>
                </>
            )
            }

            {/* ============ CUSTOMER REPORT ============ */}
            {
                activeTab === 'customers' && (
                    <>
                        <div className="space-y-8 slide-in-from-bottom-4 duration-500 print:hidden">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Verified Partners', value: allCustomers.length, icon: FiUsers, color: 'blue', sub: 'Client Database' },
                                    { label: 'Accumulated Spend', value: formatRupiah(allCustomers.reduce((s, c) => s + (c.totalSpend || 0), 0)), icon: FiDollarSign, color: 'emerald', sub: 'Lifetime Value' },
                                    { label: 'Service Volume', value: allCustomers.reduce((s, c) => s + (c.totalTrx || 0), 0), icon: FiShoppingCart, color: 'indigo', sub: 'Repeat Orders' },
                                    { label: 'Corporate Accounts', value: allCustomers.filter(c => c.type === 'corporate').length, icon: FiPieChart, color: 'amber', sub: 'B2B Segment' },
                                ].map((s, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-4 rounded-2xl ${s.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                                                s.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                                                    s.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' :
                                                        'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                                                }`}>
                                                <s.icon className="text-xl" />
                                            </div>
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{s.sub}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-75">{s.label}</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none">{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                                    <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                        <div className="size-3 bg-emerald-500 rounded-full"></div>
                                        Strategic Account Analysis ({allCustomers.length})
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                                                <th className="px-8 py-5">Nama Partner</th>
                                                <th className="px-8 py-5">Contact</th>
                                                <th className="px-8 py-5">Category</th>
                                                <th className="px-8 py-5 text-right">Transactions</th>
                                                <th className="px-8 py-5 text-right">Revenue Contribution</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {paginatedCustomers.map(c => (
                                                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{c.name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{c.company || 'Private Client'}</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-[10px] font-mono font-bold text-slate-500">{c.phone || '-'}</span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${c.type === 'corporate' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100'
                                                            }`}>
                                                            {c.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className="text-[11px] font-black text-slate-900 dark:text-white italic tracking-tighter">{c.totalTrx || 0} Trx</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className="text-[11px] font-black text-emerald-600 italic tracking-tighter">{formatRupiah(c.totalSpend || 0)}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {renderPagination('customers', allCustomers.length)}
                            </div>
                        </div>

                        {/* --- PRINT ONLY CUSTOMER REPORT (A4 FORMAT) --- */}
                        <PrintReportLayout
                            title="Laporan Pelanggan"
                            printedBy="Admin Marketer"
                            storeInfo={storeInfo}
                        >
                            {/* DATA TABLE */}
                            <section className="mb-10">
                                <h3 className="font-bold text-gray-800 mb-4 border-l-4 border-black pl-3 uppercase tracking-widest text-sm">Daftar Klien Eksekutif</h3>
                                <table className="print-table">
                                    <thead>
                                        <tr>
                                            <th>Nama Partner / Klien</th>
                                            <th className="w-1/6">Kontak</th>
                                            <th className="text-center w-1/6">Tipe</th>
                                            <th className="text-center w-1/6">Pesanan</th>
                                            <th className="text-right w-1/5">Nilai Belanja (Rp)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allCustomers.map((c, idx) => (
                                            <tr key={c.id || idx}>
                                                <td>
                                                    <p className="font-black text-gray-900 text-sm uppercase">{c.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{c.company || 'Private Client'}</p>
                                                </td>
                                                <td className="text-gray-600 font-mono font-semibold">{c.phone || '-'}</td>
                                                <td className="text-center">
                                                    <span className="font-bold text-[10px] text-gray-600 uppercase tracking-wider">{c.type}</span>
                                                </td>
                                                <td className="text-center font-black text-gray-900">{c.totalTrx || 0}</td>
                                                <td className="text-right font-black text-emerald-700 text-sm">{formatRupiah(c.totalSpend || 0)}</td>
                                            </tr>
                                        ))}
                                        {allCustomers.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="py-8 text-center italic text-gray-500">Tidak ada data pelanggan.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </section>
                        </PrintReportLayout>
                    </>
                )
            }

            {/* ============ PROFIT LOSS REPORT ============ */}
            {
                activeTab === 'profit-loss' && (
                    <ProfitLossContent dateFrom={dateFrom} dateTo={dateTo} storeInfo={storeInfo} />
                )
            }

            {/* Legend / Status Footer print-hide */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 p-6 rounded-4xl gap-4 print:hidden">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] italic">Intelligence Reporting Core V4.2 — All metrics are reconciled with live database logs</p>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-1.5 bg-blue-500 rounded-full"></div>
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Secured</span>
                    </div>
                </div>
            </div>
        </div >
    );
}
