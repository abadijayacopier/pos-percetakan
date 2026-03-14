import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFileText, FiPrinter, FiPlus, FiArrowRight, FiClock, FiCheckCircle, FiActivity, FiPackage, FiTruck, FiDollarSign, FiChevronLeft, FiChevronRight, FiFilter, FiDownload, FiAlertCircle } from 'react-icons/fi';

const STATUS_FILTERS = [
    { label: 'Semua', value: 'Semua', icon: <FiFileText /> },
    { label: 'Menunggu', value: 'Menunggu Antrian', icon: <FiClock /> },
    { label: 'Proses', value: 'Dalam Proses Cetak', icon: <FiActivity /> },
    { label: 'Finishing', value: 'Finishing', icon: <FiLayers /> },
    { label: 'Selesai', value: 'Selesai', icon: <FiCheckCircle /> },
    { label: 'Siap Diambil', value: 'Siap Diambil', icon: <FiPackage /> },
    { label: 'Diambil', value: 'Diambil', icon: <FiTruck /> },
];

const FiLayers = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
    </svg>
);

const STATUS_COLORS = {
    'Menunggu Antrian': { dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800/50', label: 'Antrian' },
    'Dalam Proses Cetak': { dot: 'bg-amber-500 animate-pulse', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', label: 'Proses' },
    'Finishing': { dot: 'bg-primary', text: 'text-primary', bg: 'bg-blue-50 dark:bg-primary/10', label: 'Finishing' },
    'Quality Control': { dot: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', label: 'QC' },
    'Selesai': { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label: 'Selesai' },
    'Siap Diambil': { dot: 'bg-emerald-500 animate-pulse outline outline-4 outline-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/20', label: 'Siap' },
    'Diambil': { dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/10', label: 'Serah' },
};

export default function SPKListPage({ onNavigate }) {
    const [spkList, setSpkList] = useState([]);
    const [summary, setSummary] = useState({ total: 0, byStatus: {} });
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Semua');
    const [search, setSearch] = useState('');

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const fetchSPK = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeFilter !== 'Semua') params.set('status', activeFilter);
            if (search) params.set('search', search);

            const res = await api.get(`/spk?${params.toString()}`);
            const json = res.data;
            setSpkList(json.data || []);
            setSummary(json.summary || { total: 0, byStatus: {} });
        } catch (err) {
            console.error('Gagal fetch SPK:', err);
        } finally {
            setLoading(false);
        }
    }, [activeFilter, search]);

    useEffect(() => {
        setCurrentPage(1);
        fetchSPK();
    }, [fetchSPK]);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        setCurrentPage(1);
        fetchSPK();
    };

    // Calculate Paginated Data
    const totalPages = Math.ceil(spkList.length / itemsPerPage);
    const displayedSPK = spkList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getDeadlineBadge = (deadline) => {
        if (!deadline) return { text: '-', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500', icon: <FiClock /> };
        const deadDate = new Date(deadline);
        const diff = Math.ceil((deadDate - new Date()) / (1000 * 60 * 60 * 24));

        if (diff < 0) return { text: 'Terlewat', color: 'bg-rose-500 text-white shadow-lg shadow-rose-500/30', icon: <FiAlertCircle />, animate: true };
        if (diff === 0) return { text: 'Hari Ini', color: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20', icon: <FiActivity />, animate: true };
        if (diff === 1) return { text: 'Besok', color: 'bg-primary text-white', icon: <FiClock /> };

        return {
            text: deadDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
            color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
            icon: <FiClock />
        };
    };

    const isReadyForBilling = (s) => ['Selesai', 'Siap Diambil'].includes(s.status) && s.sisa_tagihan > 0;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0b0f1a] font-display">
            {/* Header Section */}
            <div className="px-8 py-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="space-y-1"
                >
                    <h1 className="text-3xl font-black dark:text-white tracking-tight">Produksi SPK</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Monitoring alur produksi dan penyelesaian tugas cetak.</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    className="flex flex-wrap items-center gap-3"
                >
                    <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold shadow-sm hover:shadow-md transition-all active:scale-95">
                        <FiDownload /> Rekap Produksi
                    </button>
                    <button
                        onClick={() => onNavigate('cetak-offset')}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                    >
                        <FiPlus /> Buat SPK Baru
                    </button>
                </motion.div>
            </div>

            {/* Quick Stats Grid */}
            <div className="px-8 grid grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
                {[
                    { label: 'Total Antrian', value: summary.byStatus?.['Menunggu Antrian'] || 0, icon: <FiClock />, color: 'slate' },
                    { label: 'Proses Produksi', value: (summary.byStatus?.['Dalam Proses Cetak'] || 0) + (summary.byStatus?.['Finishing'] || 0), icon: <FiActivity />, color: 'amber' },
                    { label: 'Selesai / Siap', value: (summary.byStatus?.['Selesai'] || 0) + (summary.byStatus?.['Siap Diambil'] || 0), icon: <FiCheckCircle />, color: 'emerald' },
                    { label: 'Sudah Diambil', value: summary.byStatus?.['Diambil'] || 0, icon: <FiPackage />, color: 'blue' },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 relative overflow-hidden group"
                    >
                        <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-700 text-${s.color}-600`}>
                            <div className="text-8xl">{s.icon}</div>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl bg-${s.color}-50 dark:bg-${s.color}-500/10 flex items-center justify-center text-2xl text-${s.color}-600 dark:text-${s.color}-400`}>
                            {s.icon}
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
                            <p className="text-2xl font-black dark:text-white leading-tight">{s.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="px-8 pb-12 flex-1">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-full ring-8 ring-slate-100/50 dark:ring-slate-900/30"
                >
                    {/* Filter Bar */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 xl:pb-0 no-scrollbar w-full xl:w-auto">
                            <div className="flex items-center gap-2 mr-4 text-slate-400">
                                <FiFilter className="text-sm" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Filter Status</span>
                            </div>
                            {STATUS_FILTERS.map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => setActiveFilter(f.value)}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${activeFilter === f.value
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                            : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {f.icon} {f.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSearch} className="relative w-full xl:max-w-md group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary/50 shadow-sm dark:text-white transition-all outline-none text-sm font-medium"
                                placeholder="Cari nomor SPK, nama pelanggan, atau produk..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </form>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-x-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-32 flex flex-col items-center justify-center gap-4 text-center">
                                <motion.div
                                    animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                                />
                                <p className="text-slate-500 dark:text-slate-400 font-bold animate-pulse text-sm">Menghubungkan ke server produksi...</p>
                            </div>
                        ) : displayedSPK.length === 0 ? (
                            <div className="p-32 flex flex-col items-center justify-center gap-4 text-center">
                                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                                    <FiFileText size={48} />
                                </div>
                                <div>
                                    <p className="text-slate-800 dark:text-white font-black text-xl">Data Tidak Ditemukan</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                                        {search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada Surat Perintah Kerja untuk kategori ini.'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-slate-50/80 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Nomor & Tanggal</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Identitas Kerja</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Qty / Unit</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Urgency</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status Alur</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Manajemen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {displayedSPK.map((spk, idx) => {
                                        const sc = STATUS_COLORS[spk.status] || STATUS_COLORS['Menunggu Antrian'];
                                        const dl = getDeadlineBadge(spk.deadline);
                                        const ready = isReadyForBilling(spk);

                                        return (
                                            <motion.tr
                                                key={spk.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                                className={`hover:bg-slate-50/80 dark:hover:bg-blue-500/[0.02] transition-all group ${ready ? 'bg-emerald-50/30 dark:bg-emerald-500/[0.02]' : ''}`}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span
                                                            className="text-sm font-black text-primary hover:underline cursor-pointer flex items-center gap-1.5"
                                                            onClick={() => onNavigate('spk-detail', { spkId: spk.id })}
                                                        >
                                                            #{spk.spk_number}
                                                            <FiArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-1" />
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-tighter">
                                                            {formatDate(spk.created_at)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-0.5">
                                                        <p className="text-sm font-black dark:text-white group-hover:text-primary transition-colors">
                                                            {spk.customer_company || spk.customer_name}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase line-clamp-1">
                                                            {spk.product_name}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black dark:text-white">{spk.product_qty}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{spk.product_unit}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center">
                                                        <motion.div
                                                            animate={dl.animate ? { scale: [1, 1.05, 1] } : {}}
                                                            transition={{ repeat: Infinity, duration: 2 }}
                                                            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${dl.color}`}
                                                        >
                                                            <span className="text-xs">{dl.icon}</span>
                                                            {dl.text}
                                                        </motion.div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex flex-col gap-2">
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${sc.bg} ${sc.text}`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                                            <span className="text-[10px] font-black uppercase tracking-wider">{sc.label}</span>
                                                        </div>
                                                        {ready && (
                                                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-[9px] uppercase tracking-[0.2em] ml-1">
                                                                <FiCheckCircle size={10} /> Billing Ready
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {ready ? (
                                                            <button
                                                                onClick={() => onNavigate('spk-settlement', { spkId: spk.id })}
                                                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
                                                            >
                                                                <FiDollarSign /> Tagih
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => onNavigate('print-spk', { spkId: spk.id })}
                                                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary/20 text-slate-600 dark:text-slate-300 hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                                            >
                                                                <FiPrinter /> Cetak SPK
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination Sidebar-ish Footer */}
                    {!loading && spkList.length > 0 && (
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-[10px] font-black text-slate-400 tracking-[0.2em]">
                                MENAMPILKAN <span className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, spkList.length)}</span> DARI <span className="text-slate-900 dark:text-white">{spkList.length}</span> TUGAS
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-30 dark:text-white transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <FiChevronLeft size={18} />
                                </button>

                                <div className="flex items-center gap-1.5">
                                    {[...Array(totalPages)].map((_, i) => {
                                        const p = i + 1;
                                        if (totalPages > 5 && Math.abs(p - currentPage) > 1 && p !== 1 && p !== totalPages) {
                                            if (p === 2 || p === totalPages - 1) return <span key={p} className="text-slate-300">...</span>;
                                            return null;
                                        }
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => setCurrentPage(p)}
                                                className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-xs transition-all ${currentPage === p
                                                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                                                        : 'bg-white dark:bg-slate-800 text-slate-400 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-30 dark:text-white transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <FiChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
