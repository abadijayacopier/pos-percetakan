import { useState, useMemo, useEffect, useRef } from 'react';
import api from '../services/api';
import { formatRupiah, formatDate } from '../utils';
import {
    FiTrendingUp, FiTrendingDown, FiDollarSign, FiPieChart,
    FiDownload, FiCalendar, FiArrowUpRight, FiArrowDownRight,
    FiChevronLeft, FiChevronRight, FiPrinter, FiFileText, FiLayout
} from 'react-icons/fi';

export default function ProfitLossPage() {
    const printRef = useRef();
    const [printMode, setPrintMode] = useState('detailed'); // 'detailed' or 'compact'
    const [activeTab, setActiveTab] = useState('summary');
    const [period, setPeriod] = useState('this-month');
    const [storeInfo, setStoreInfo] = useState({});
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().slice(0, 10);
    });
    const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(false);
    const [monthlyData, setMonthlyData] = useState([]);
    const [revenueBreakdown, setRevenueBreakdown] = useState({});

    // Fetch store info
    useEffect(() => {
        api.get('/settings').then(res => {
            const info = {};
            res.data.forEach(s => { info[s.key] = s.value; });
            setStoreInfo({
                name: info.store_name || 'FOTOCOPY ABADI JAYA',
                address: info.store_address || '',
                phone: info.store_phone || ''
            });
        }).catch(() => {
            setStoreInfo({
                name: 'FOTOCOPY ABADI JAYA',
                address: '',
                phone: ''
            });
        });
    }, []);

    // Toggle body class for print mode
    useEffect(() => {
        if (printMode === 'compact') {
            document.body.classList.add('print-compact-mode');
        } else {
            document.body.classList.remove('print-compact-mode');
        }
    }, [printMode]);

    // Force Light Mode for Printing
    useEffect(() => {
        const handleBeforePrint = () => {
            document.documentElement.classList.remove('dark');
        };
        const handleAfterPrint = () => {
            // Restore dark mode usually handled by state
        };
        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);
        return () => {
            window.removeEventListener('beforeprint', handleBeforePrint);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, []);

    // Fetch transactions from API
    const [transactions, setTransactions] = useState([]);
    const [cashFlow, setCashFlow] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [trxRes, cfRes, prodRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/finance'),
                api.get('/products')
            ]);
            setTransactions(trxRes.data || []);
            setCashFlow(cfRes.data || []);
            setProducts(prodRes.data || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        }
        setLoading(false);
    };

    // Filter data by date range
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const d = t.date ? t.date.slice(0, 10) : '';
            return d >= dateFrom && d <= dateTo;
        });
    }, [transactions, dateFrom, dateTo]);

    const filteredCashFlow = useMemo(() => {
        return cashFlow.filter(c => {
            const d = c.date ? c.date.slice(0, 10) : '';
            return d >= dateFrom && d <= dateTo;
        });
    }, [cashFlow, dateFrom, dateTo]);

    // Calculate P&L metrics
    const metrics = useMemo(() => {
        // Revenue from transactions
        const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);

        // Cost of Goods Sold (HPP) - Calculate from products sold
        let cogs = 0;
        filteredTransactions.forEach(t => {
            (t.items || []).forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    cogs += (Number(product.buyPrice) || 0) * item.qty;
                }
            });
        });

        // Operational Expenses from cash_flow
        const operationalExpenses = filteredCashFlow
            .filter(c => c.type === 'out')
            .reduce((sum, c) => sum + (c.amount || 0), 0);

        // Other expenses
        const otherExpenses = 0;

        const totalExpenses = cogs + operationalExpenses + otherExpenses;
        const grossProfit = totalRevenue - cogs;
        const netProfit = totalRevenue - totalExpenses;
        const npm = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;

        return {
            totalRevenue,
            cogs,
            grossProfit,
            operationalExpenses,
            otherExpenses,
            totalExpenses,
            netProfit,
            npm
        };
    }, [filteredTransactions, filteredCashFlow]);

    // Revenue by category
    const revenueByCategory = useMemo(() => {
        const categories = {
            fotocopy: 0,
            print: 0,
            atk: 0,
            service: 0,
            binding: 0,
            other: 0
        };

        filteredTransactions.forEach(t => {
            const type = t.type || 'other';
            if (type === 'fotocopy') categories.fotocopy += t.total || 0;
            else if (type === 'print' || type === 'digital-printing') categories.print += t.total || 0;
            else if (type === 'sale' || type === 'atk') categories.atk += t.total || 0;
            else if (type === 'service') categories.service += t.total || 0;
            else if (type === 'binding') categories.binding += t.total || 0;
            else categories.other += t.total || 0;
        });

        return categories;
    }, [filteredTransactions]);

    // Expense breakdown
    const expenseBreakdown = useMemo(() => {
        const breakdown = {};
        filteredCashFlow
            .filter(c => c.type === 'out')
            .forEach(c => {
                const cat = c.category || 'Lainnya';
                breakdown[cat] = (breakdown[cat] || 0) + (c.amount || 0);
            });
        return Object.entries(breakdown)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);
    }, [filteredCashFlow]);

    // Format currency
    const formatCurrency = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num);
    };

    // Get percentage
    const getPercent = (value, total) => {
        return total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    };

    const periodLabels = {
        'this-month': 'Bulan Ini',
        'last-month': 'Bulan Lalu',
        'this-quarter': 'Kuartal Ini',
        'this-year': 'Tahun Ini',
        'custom': 'Kustom'
    };

    return (
        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100 font-display transition-colors pb-10">
            {/* Header */}
            <header className="px-6 py-6 md:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 no-print">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-emerald-500/30">
                            <FiTrendingUp size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Laporan Laba Rugi</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Analisis pendapatan dan pengeluaran toko</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Print Mode Toggle */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 no-print">
                            <button
                                onClick={() => setPrintMode('detailed')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${printMode === 'detailed'
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <FiFileText size={14} />
                                Detail
                            </button>
                            <button
                                onClick={() => setPrintMode('compact')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${printMode === 'compact'
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <FiLayout size={14} />
                                Ringkas
                            </button>
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-colors"
                        >
                            <FiPrinter size={16} />
                            Cetak
                        </button>
                        <button
                            onClick={() => {
                                // Trigger print dialog with PDF save option
                                window.print();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-500/30"
                        >
                            <FiDownload size={16} />
                            Export PDF
                        </button>
                    </div>
                </div>
            </header>

            {/* Print Header - Detailed mode - Hanya muncul saat print */}
            <div className="hidden Print:block print-detailed mb-8">
                <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
                    <h1 className="text-2xl font-bold uppercase tracking-wide">Laporan Laba Rugi</h1>
                    <p className="text-lg">{storeInfo.name}</p>
                    <p className="text-sm">{storeInfo.address} {storeInfo.phone ? `| ${storeInfo.phone}` : ''}</p>
                </div>
                <div className="flex justify-between text-sm">
                    <p>Periode: {formatDate(dateFrom)} s/d {formatDate(dateTo)}</p>
                    <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            {/* COMPACT PRINT LAYOUT - Simple & Clean A4 */}
            <div className="hidden Print:block print-compact">
                {/* Compact Header */}
                <header className="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 className="text-2xl font-black uppercase tracking-widest mb-1">Laporan Laba Rugi</h1>
                    <p className="text-base font-medium">{storeInfo.name}</p>
                    <div className="mt-3 flex justify-between items-end text-sm">
                        <div className="text-left">
                            <p><strong>Alamat:</strong> {storeInfo.address}</p>
                            {storeInfo.phone && <p><strong>Telp:</strong> {storeInfo.phone}</p>}
                        </div>
                        <div className="text-right">
                            <p><strong>Periode:</strong> {formatDate(dateFrom)} - {formatDate(dateTo)}</p>
                            <p><strong>Mata Uang:</strong> Rupiah (IDR)</p>
                        </div>
                    </div>
                </header>

                {/* Income Section */}
                <section className="mb-6">
                    <h2 className="text-sm font-bold border-b border-black mb-3 uppercase">Pendapatan Operasional</h2>
                    <table className="w-full text-sm">
                        <tbody>
                            {revenueByCategory.fotocopy > 0 && (
                                <tr>
                                    <td className="py-1">Pendapatan Fotocopy</td>
                                    <td className="text-right py-1">{formatCurrency(revenueByCategory.fotocopy)}</td>
                                </tr>
                            )}
                            {revenueByCategory.print > 0 && (
                                <tr>
                                    <td className="py-1">Pendapatan Print Digital</td>
                                    <td className="text-right py-1">{formatCurrency(revenueByCategory.print)}</td>
                                </tr>
                            )}
                            {revenueByCategory.atk > 0 && (
                                <tr>
                                    <td className="py-1">Penjualan ATK</td>
                                    <td className="text-right py-1">{formatCurrency(revenueByCategory.atk)}</td>
                                </tr>
                            )}
                            {revenueByCategory.service > 0 && (
                                <tr>
                                    <td className="py-1">Pendapatan Service</td>
                                    <td className="text-right py-1">{formatCurrency(revenueByCategory.service)}</td>
                                </tr>
                            )}
                            {revenueByCategory.binding > 0 && (
                                <tr>
                                    <td className="py-1">Pendapatan Penjilidan</td>
                                    <td className="text-right py-1">{formatCurrency(revenueByCategory.binding)}</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold border-t border-black">
                                <td className="pt-2 uppercase">Total Pendapatan</td>
                                <td className="text-right pt-2">{formatCurrency(metrics.totalRevenue)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </section>

                {/* Expenses Section */}
                <section className="mb-6">
                    <h2 className="text-sm font-bold border-b border-black mb-3 uppercase">Beban Operasional</h2>
                    <table className="w-full text-sm">
                        <tbody>
                            {metrics.cogs > 0 && (
                                <tr>
                                    <td className="py-1">Beban Bahan Baku (HPP)</td>
                                    <td className="text-right py-1">{formatCurrency(metrics.cogs)}</td>
                                </tr>
                            )}
                            {expenseBreakdown.slice(0, 5).map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-1">{item.name}</td>
                                    <td className="text-right py-1">{formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold border-t border-black">
                                <td className="pt-2 uppercase">Total Beban Operasional</td>
                                <td className="text-right pt-2">({formatCurrency(metrics.totalExpenses)})</td>
                            </tr>
                        </tfoot>
                    </table>
                </section>

                {/* Final Calculation */}
                <section className="mt-10 p-4 border-2 border-black bg-gray-50">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-black uppercase">Laba Bersih (Net Profit)</h2>
                        <span className="text-xl font-black border-b-2 border-black">{formatCurrency(metrics.netProfit)}</span>
                    </div>
                    <div className="mt-2 text-sm text-center">
                        Net Profit Margin: {metrics.npm.toFixed(1)}%
                    </div>
                </section>

                {/* Signatures */}
                <section className="mt-12 grid grid-cols-2 gap-12 text-center bg-white print:bg-white">
                    <div className="space-y-16">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Dibuat Oleh,</p>
                        <div className="border-t border-black mx-auto w-48 pt-2">
                            <p className="text-xs font-black">Administrasi Keuangan</p>
                        </div>
                    </div>
                    <div className="space-y-16">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Disetujui Oleh,</p>
                        <div className="border-t border-black mx-auto w-48 pt-2">
                            <p className="text-xs font-black">Pemilik / Manager</p>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-12 text-xs text-gray-400 text-center italic">
                    Dicetak secara otomatis pada: {new Date().toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </footer>
            </div>

            {/* Main Content - Hidden when compact print mode */}
            <main className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 print-detailed" ref={printRef}>
                {/* Period Filter */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-6 no-print">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <FiCalendar className="text-slate-400" />
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Periode:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(periodLabels).map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => {
                                        setPeriod(key);
                                        const now = new Date();
                                        if (key === 'this-month') {
                                            setDateFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
                                            setDateTo(now.toISOString().slice(0, 10));
                                        } else if (key === 'last-month') {
                                            setDateFrom(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10));
                                            setDateTo(new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10));
                                        } else if (key === 'this-quarter') {
                                            const quarter = Math.floor(now.getMonth() / 3);
                                            setDateFrom(new Date(now.getFullYear(), quarter * 3, 1).toISOString().slice(0, 10));
                                            setDateTo(now.toISOString().slice(0, 10));
                                        } else if (key === 'this-year') {
                                            setDateFrom(new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10));
                                            setDateTo(now.toISOString().slice(0, 10));
                                        }
                                    }}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${period === key
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => { setPeriod('custom'); setDateFrom(e.target.value); }}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => { setPeriod('custom'); setDateTo(e.target.value); }}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Pendapatan */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                <FiTrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="flex items-center text-green-600 text-sm font-medium">
                                <FiArrowUpRight className="w-4 h-4 mr-1" />
                                Pendapatan
                            </span>
                        </div>
                        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Pendapatan</h3>
                        <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                            {formatCurrency(metrics.totalRevenue)}
                        </p>
                    </div>

                    {/* Total Pengeluaran */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                <FiTrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <span className="flex items-center text-red-600 text-sm font-medium">
                                <FiArrowDownRight className="w-4 h-4 mr-1" />
                                Pengeluaran
                            </span>
                        </div>
                        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Pengeluaran</h3>
                        <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                            {formatCurrency(metrics.totalExpenses)}
                        </p>
                    </div>

                    {/* Laba Bersih */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-l-4 border-l-blue-500 border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <FiDollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="flex items-center text-blue-600 text-sm font-medium">
                                <FiArrowUpRight className="w-4 h-4 mr-1" />
                                Laba
                            </span>
                        </div>
                        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Laba Bersih</h3>
                        <p className={`text-2xl font-bold mt-1 ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(metrics.netProfit)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">NPM: {metrics.npm.toFixed(1)}%</p>
                    </div>
                </section>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Revenue by Category */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Kategori Pendapatan</h3>
                        <div className="space-y-4">
                            {Object.entries(revenueByCategory).map(([cat, amount]) => (
                                <div key={cat}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="capitalize text-slate-600 dark:text-slate-300">{cat}</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(amount)}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full bg-blue-600"
                                            style={{ width: `${getPercent(amount, metrics.totalRevenue)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Rincian Beban Operasional</h3>
                        <div className="overflow-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="text-left py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori</th>
                                        <th className="text-right py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Jumlah</th>
                                        <th className="text-right py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">% dari Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr>
                                        <td className="py-3 text-sm font-medium text-slate-900 dark:text-white">HPP (Bahan Baku)</td>
                                        <td className="py-3 text-sm text-right font-semibold text-slate-900 dark:text-white">{formatCurrency(metrics.cogs)}</td>
                                        <td className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${getPercent(metrics.cogs, metrics.totalExpenses)}%` }}></div>
                                                </div>
                                                <span className="text-xs text-slate-500">{getPercent(metrics.cogs, metrics.totalExpenses)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 text-sm font-medium text-slate-900 dark:text-white">Beban Operasional</td>
                                        <td className="py-3 text-sm text-right font-semibold text-slate-900 dark:text-white">{formatCurrency(metrics.operationalExpenses)}</td>
                                        <td className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${getPercent(metrics.operationalExpenses, metrics.totalExpenses)}%` }}></div>
                                                </div>
                                                <span className="text-xs text-slate-500">{getPercent(metrics.operationalExpenses, metrics.totalExpenses)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {expenseBreakdown.slice(0, 5).map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="py-3 text-sm text-slate-600 dark:text-slate-300">{item.name}</td>
                                            <td className="py-3 text-sm text-right font-medium text-slate-900 dark:text-white">{formatCurrency(item.amount)}</td>
                                            <td className="py-3 text-right">
                                                <span className="text-xs text-slate-500">{getPercent(item.amount, metrics.totalExpenses)}%</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Profit Calculation Summary */}
                <section className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Ringkasan Perhitungan Laba</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Pendapatan Kotor</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(metrics.totalRevenue)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">HPP</p>
                            <p className="text-xl font-bold text-red-600">-{formatCurrency(metrics.cogs)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Laba Kotor</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(metrics.grossProfit)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Laba Bersih</p>
                            <p className={`text-xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(metrics.netProfit)}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Print Footer - Tanda Tangan */}
                <div className="hidden print:block mt-12 pt-8 border-t-2 border-slate-800">
                    <div className="grid grid-cols-2 gap-16">
                        <div className="text-center">
                            <p className="text-sm mb-12">Dibuat oleh,</p>
                            <p className="font-bold border-t border-slate-400 pt-2">Admin / Keuangan</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm mb-12">Disetujui oleh,</p>
                            <p className="font-bold border-t border-slate-400 pt-2">Pemilik / Manager</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                    
                    /* Hide detailed content when compact mode is selected */
                    body.print-compact-mode .print-detailed {
                        display: none !important;
                    }
                    
                    /* Show compact content when compact mode is selected */
                    body.print-compact-mode .print-compact {
                        display: block !important;
                    }
                    
                    /* Hide compact content in normal print */
                    .print-compact {
                        display: none !important;
                    }
                    
                    /* Show detailed content in normal print */
                    .print-detailed {
                        display: block !important;
                    }
                    
                    /* Remove background graphics - use plain colors for printing */
                    .bg-slate-50, .bg-white, .bg-green-100, .bg-red-100, .bg-blue-100, .bg-gray-50, .bg-gradient-to-r {
                        background: white !important;
                        background-color: white !important;
                    }
                    
                    /* Reset text colors for print */
                    .text-green-600, .text-red-600, .text-blue-600 {
                        color: #000 !important;
                    }
                }
            `}</style>
        </div>
    );
}
