import { useState, useMemo, useEffect, useCallback } from 'react';
import api from '../services/api';
import { formatRupiah, formatDateTime } from '../utils';
import {
    FiWifi,
    FiCheckCircle,
    FiClock,
    FiAlertTriangle,
    FiDollarSign,
    FiRefreshCw,
    FiChevronLeft,
    FiChevronRight,
    FiSearch,
    FiActivity,
    FiZap
} from 'react-icons/fi';

export default function QRISMonitorPage() {
    const [transactions, setTransactions] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const PER_PAGE = 10;

    const fetchLiveTransactions = useCallback(async () => {
        try {
            setIsRefreshing(true);
            const { data } = await api.get('/transactions');
            setTransactions(data);
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Simulate live refresh from Backend every 10s
    useEffect(() => {
        fetchLiveTransactions(); // Initial fetch
        const interval = setInterval(() => {
            fetchLiveTransactions();
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchLiveTransactions]);

    const qrisTransactions = useMemo(() => {
        // Filter out those with payment_type matching 'qris', 'gopay', 'dana', 'bank', etc.
        return transactions.filter(t => (t.paymentType || t.payment_type || '').toLowerCase().includes('qris'));
    }, [transactions]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return qrisTransactions.filter(t => {
            const invoice = (t.invoiceNo || t.invoice_no || '').toLowerCase();
            const customer = (t.customerName || t.customer_name || '').toLowerCase();
            const matchSearch = !q || invoice.includes(q) || customer.includes(q);

            // Paid threshold is either 'paid' or payment matches backend rules
            const isSuccess = t.status === 'paid' || t.paid >= t.total;

            if (filterStatus === 'success') return matchSearch && isSuccess;
            if (filterStatus === 'pending') return matchSearch && !isSuccess;
            return matchSearch;
        }).sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
    }, [qrisTransactions, search, filterStatus]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const totalAmount = qrisTransactions.reduce((s, t) => s + (t.total || 0), 0);
    const successCount = qrisTransactions.filter(t => t.status === 'paid' || t.paid >= t.total).length;
    const pendingCount = qrisTransactions.filter(t => t.status !== 'paid' && t.paid < t.total).length;

    const handleRefresh = () => {
        fetchLiveTransactions();
    };

    const handleSearch = (v) => { setSearch(v); setPage(1); };
    const handleFilter = (v) => { setFilterStatus(v); setPage(1); };

    return (
        <div className="p-4 sm:p-8 space-y-8 font-display bg-slate-50/30 dark:bg-transparent min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100 dark:shadow-none"><FiWifi className="animate-pulse" /></span>
                        Monitoring QRIS
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-1 italic opacity-75">Real-time Digital Payment Settlement Monitor</p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl shadow-sm text-[10px] font-black text-emerald-600 uppercase tracking-widest flex-1 sm:flex-none">
                        <div className="size-2 bg-emerald-500 rounded-full animate-ping"></div>
                        Live • {lastRefresh.toLocaleTimeString('id-ID')}
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-3 bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm group disabled:opacity-50"
                    >
                        <FiRefreshCw className={`transition-transform duration-500 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: 'Total QRIS Masuk', value: formatRupiah(totalAmount), icon: <FiDollarSign />, color: 'blue', sub: 'Gross Settlement' },
                    { label: 'Sukses', value: successCount, icon: <FiCheckCircle />, color: 'emerald', sub: 'Verified Payments' },
                    { label: 'Pending', value: pendingCount, icon: <FiClock />, color: 'amber', sub: 'Awaiting Settlement' },
                ].map((s, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${s.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                                s.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                                    'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                                }`}>
                                {s.icon}
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.sub}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-75">{s.label}</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                            {typeof s.value === 'number' ? String(s.value).padStart(2, '0') : s.value}
                        </h4>
                    </div>
                ))}
            </div>

            {/* Main Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Filter Bar */}
                <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col lg:flex-row gap-6 bg-slate-50/30 dark:bg-slate-800/20">
                    <div className="relative group flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none transition-transform group-focus-within:translate-x-1">
                            <div className="p-2 border border-transparent group-focus-within:text-blue-600 text-slate-400">
                                <FiSearch size={16} />
                            </div>
                        </div>
                        <input
                            className="block w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                            placeholder="Cari nomor invoice atau pelanggan..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { key: 'all', label: 'Semua Transaksi' },
                            { key: 'success', label: `Sukses (${successCount})` },
                            { key: 'pending', label: `Pending (${pendingCount})` },
                        ].map(f => (
                            <button
                                key={f.key}
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterStatus === f.key ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600'}`}
                                onClick={() => handleFilter(f.key)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table Area */}
                <div className="overflow-x-auto">
                    {paginated.length === 0 ? (
                        <div className="py-24 text-center">
                            <FiActivity size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-800" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">Tidak ada log transaksi QRIS</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="text-left bg-slate-50/50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Settlement</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Hub</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Petugas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {paginated.map(t => {
                                    const isSuccess = t.status === 'paid' || t.paid >= t.total;
                                    const time = new Date(t.date || t.created_at);
                                    return (
                                        <tr key={t.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white">{time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{time.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                                    {t.invoiceNo || t.invoice_no}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.customerName || t.customer_name || 'Pelanggan Umum'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-xs font-black text-blue-600 italic tracking-tighter">
                                                    {formatRupiah(t.total)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isSuccess ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30">
                                                        <FiCheckCircle size={12} /> Terverifikasi
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30">
                                                        <FiClock size={12} /> Menunggu ({t.status})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.userName || t.user_name || '-'}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {filtered.length > PER_PAGE && (
                    <div className="p-6 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Displaying {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} logs
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
                            >
                                <FiChevronLeft size={18} />
                            </button>
                            <span className="text-xs font-black min-w-[3rem] text-center dark:text-white">
                                {page} <span className="text-slate-400">/</span> {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
                            >
                                <FiChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer Status */}
                <div className="p-4 bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Monitoring System Operational — Total {qrisTransactions.length} Settlements Recorded</p>
                    <div className="flex items-center gap-2">
                        <FiZap className="text-blue-500 animate-pulse" />
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic opacity-75">Auto-Refresh Engine V4.0 Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
