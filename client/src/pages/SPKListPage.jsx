import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import html2pdf from 'html2pdf.js';
import { FiSearch, FiFileText, FiPrinter, FiPlus, FiArrowRight, FiClock, FiCheckCircle, FiActivity, FiPackage, FiTruck, FiDollarSign, FiChevronLeft, FiChevronRight, FiFilter, FiDownload, FiAlertCircle, FiXCircle, FiTrash2, FiEye, FiEdit } from 'react-icons/fi';
const FiLayers = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
    </svg>
);

const STATUS_FILTERS = [
    { label: 'Semua', value: 'Semua', icon: <FiFileText /> },
    { label: 'Menunggu', value: 'Menunggu Antrian', icon: <FiClock /> },
    { label: 'Proses', value: 'Dalam Proses Cetak', icon: <FiActivity /> },
    { label: 'Finishing', value: 'Finishing', icon: <FiLayers /> },
    { label: 'Selesai', value: 'Selesai', icon: <FiCheckCircle /> },
    { label: 'Siap Diambil', value: 'Siap Diambil', icon: <FiPackage /> },
    { label: 'Diambil', value: 'Diambil', icon: <FiTruck /> },
    { label: 'Batal', value: 'Batal', icon: <FiXCircle /> },
];

const STATUS_COLORS = {
    'Menunggu Antrian': { dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800/50', label: 'Antrian' },
    'Dalam Proses Cetak': { dot: 'bg-amber-500 animate-pulse', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', label: 'Proses' },
    'Finishing': { dot: 'bg-primary', text: 'text-primary', bg: 'bg-blue-50 dark:bg-primary/10', label: 'Finishing' },
    'Quality Control': { dot: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', label: 'QC' },
    'Selesai': { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label: 'Selesai' },
    'Siap Diambil': { dot: 'bg-emerald-500 animate-pulse outline outline-4 outline-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/20', label: 'Siap' },
    'Diambil': { dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/10', label: 'Serah' },
    'Batal': { dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', label: 'Batal' },
};

export default function SPKListPage({ onNavigate }) {
    const [spkList, setSpkList] = useState([]);
    const [summary, setSummary] = useState({ total: 0, byStatus: {} });
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Semua');
    const [activeKategori, setActiveKategori] = useState('Semua');
    const [search, setSearch] = useState('');
    const [cancelModal, setCancelModal] = useState(null);
    const [showRekapModal, setShowRekapModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [systemStatus, setSystemStatus] = useState('connecting');

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const fetchSPK = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeFilter !== 'Semua') params.set('status', activeFilter);
            if (activeKategori !== 'Semua') params.set('kategori', activeKategori);
            if (search) params.set('search', search);

            const res = await api.get(`/spk?${params.toString()}`);
            const json = res.data;
            setSpkList(json.data || []);
            setSummary(json.summary || { total: 0, byStatus: {} });
            setSystemStatus('online');
        } catch (err) {
            console.error('Gagal fetch SPK:', err);
            setSystemStatus('offline');
        } finally {
            setLoading(false);
        }
    }, [activeFilter, activeKategori, search]);

    useEffect(() => {
        setCurrentPage(1);
        fetchSPK();

        const interval = setInterval(() => {
            fetchSPK();
        }, 10000);

        return () => clearInterval(interval);
    }, [fetchSPK]);

    const handleCancelSPK = (spkId, spkNumber) => {
        setCancelModal({ id: spkId, spk_number: spkNumber });
    };

    const confirmCancelSPK = async () => {
        if (!cancelModal) return;
        try {
            await api.patch(`/spk/${cancelModal.id}/status`, { status: 'Batal' });
            fetchSPK();
            setCancelModal(null);
        } catch (err) {
            console.error('Gagal membatalkan SPK:', err);
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat membatalkan SPK.', timer: 3000 });
        }
    };

    const handleDeleteSPK = async (id, spkNumber) => {
        Swal.fire({
            title: 'Hapus Pesanan?',
            text: `Data SPK #${spkNumber} akan dihapus secara permanen dari sistem!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus Permanen',
            cancelButtonText: 'Batal',
            customClass: {
                confirmButton: 'bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl ml-3',
                cancelButton: 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl',
                popup: 'dark:bg-slate-800 dark:text-white rounded-3xl',
                title: 'dark:text-white'
            },
            buttonsStyling: false
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/spk/${id}`);
                    Swal.fire({ icon: 'success', title: 'Terhapus', text: 'SPK berhasil dihapus permanen.', timer: 2000, showConfirmButton: false });
                    fetchSPK();
                } catch (err) {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus SPK dari database.', timer: 2000, showConfirmButton: false });
                }
            }
        });
    };

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
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-3 border transition-all duration-500 bg-white dark:bg-slate-900 shadow-sm
                        ${systemStatus === 'online' ? 'border-emerald-100 dark:border-emerald-500/20' :
                            systemStatus === 'offline' ? 'border-rose-100 dark:border-rose-500/20' :
                                'border-slate-100 dark:border-slate-800'}`}>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Status Produksi</p>
                            <div className="flex items-center gap-2 justify-end">
                                <span className={`text-[11px] font-black uppercase tracking-wider
                                    ${systemStatus === 'online' ? 'text-emerald-500' :
                                        systemStatus === 'offline' ? 'text-rose-500' : 'text-slate-400'}`}>
                                    {systemStatus === 'online' ? 'Sistem Terhubung' :
                                        systemStatus === 'offline' ? 'Koneksi Terputus' : 'Menghubungkan...'}
                                </span>
                                <div className={`w-2 h-2 rounded-full 
                                    ${systemStatus === 'online' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                        systemStatus === 'offline' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                                            'bg-slate-300 animate-bounce'}`}></div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowRekapModal(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
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
                        <div className="flex flex-wrap items-center gap-2 overflow-auto pb-2 xl:pb-0 no-scrollbar w-full xl:w-auto">
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

                        <div className="flex w-full xl:max-w-md gap-3">
                            <select
                                value={activeKategori}
                                onChange={(e) => setActiveKategori(e.target.value)}
                                className="px-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border-none shadow-sm dark:text-white transition-all outline-none text-sm font-medium focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="Semua">Semua Kategori</option>
                                <option value="Digital Printing">Digital Printing</option>
                                <option value="Cetak Offset">Cetak Offset</option>
                            </select>
                            <form onSubmit={handleSearch} className="relative flex-1 group">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary/50 shadow-sm dark:text-white transition-all outline-none text-sm font-medium"
                                    placeholder="Cari SPK, pelanggan..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </form>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
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
                                                className={`hover:bg-slate-50/80 dark:hover:bg-blue-500/2 transition-all group ${ready ? 'bg-emerald-50/30 dark:bg-emerald-500/2' : ''}`}
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
                                                    <div className="flex justify-end gap-1.5 flex-wrap">
                                                        <button
                                                            onClick={() => onNavigate('spk-detail', { spkId: spk.id })}
                                                            className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition-all shadow-sm"
                                                            title="Lihat Detail"
                                                        >
                                                            <FiEye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => onNavigate('spk-detail', { spkId: spk.id })}
                                                            className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition-all shadow-sm"
                                                            title="Edit SPK / Status"
                                                        >
                                                            <FiEdit size={16} />
                                                        </button>
                                                        {spk.status !== 'Batal' && (
                                                            <button
                                                                onClick={() => onNavigate('print-spk', { spkId: spk.id })}
                                                                className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-900 rounded-lg transition-all shadow-sm"
                                                                title="Cetak SPK"
                                                            >
                                                                <FiPrinter size={16} />
                                                            </button>
                                                        )}
                                                        {ready ? (
                                                            <button
                                                                onClick={() => onNavigate('spk-settlement', { spkId: spk.id })}
                                                                className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-lg transition-all shadow-sm"
                                                                title="Pelunasan"
                                                            >
                                                                <FiDollarSign size={16} />
                                                            </button>
                                                        ) : (
                                                            !['Batal', 'Selesai', 'Siap Diambil', 'Diambil'].includes(spk.status) && (
                                                                <button
                                                                    onClick={() => handleCancelSPK(spk.id, spk.spk_number)}
                                                                    className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all shadow-sm"
                                                                    title="Batalkan SPK"
                                                                >
                                                                    <FiXCircle size={16} />
                                                                </button>
                                                            )
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteSPK(spk.id, spk.spk_number)}
                                                            className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-500 hover:text-white dark:text-rose-400 dark:hover:text-white rounded-lg transition-all shadow-sm"
                                                            title="Hapus Permanen SPK"
                                                        >
                                                            <FiTrash2 size={16} />
                                                        </button>
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

            {/* Cancel Modal */}
            <AnimatePresence>
                {cancelModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-2000 flex items-center justify-center p-4 sm:p-6" onClick={(e) => e.target === e.currentTarget && setCancelModal(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl shadow-rose-900/10 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                            <div className="flex items-start justify-between p-6 pb-2 border-slate-100 dark:border-slate-800/60 shrink-0 relative z-10">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                        <FiAlertCircle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest leading-none mt-1">Batalkan SPK?</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Master SPK #{cancelModal.spk_number}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 pt-2 space-y-4 relative z-10 bg-transparent">
                                <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-200 dark:border-rose-500/20 text-center">
                                    <p className="text-xs text-rose-900 dark:text-rose-200 font-medium leading-relaxed">
                                        Apakah Anda yakin ingin membatalkan SPK ini? Tindakan ini <b>tidak dapat dibatalkan</b>.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 mt-6">
                                    <button
                                        onClick={() => setCancelModal(null)}
                                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm shadow-sm"
                                    >
                                        Kembali
                                    </button>
                                    <button
                                        onClick={confirmCancelSPK}
                                        className="flex-[1.5] py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl shadow-lg shadow-rose-500/20 transition-colors text-sm flex items-center justify-center gap-2"
                                    >
                                        <FiXCircle size={16} /> Iya, Batalkan
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Glassmorphic PDF Preview & Recap Modal */}
            <AnimatePresence>
                {showRekapModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => !isExporting && setShowRekapModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-5xl max-h-[90vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-2xl shadow-primary/20 flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-6 md:px-10 md:py-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                                            <FiActivity size={24} />
                                        </div>
                                        Audit Rekap Produksi SPK
                                    </h2>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
                                        Pratinjau laporan daftar perintah cetak aktif dan arsip.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowRekapModal(false)}
                                    disabled={isExporting}
                                    className="p-3 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-500/20 rounded-2xl transition-colors shrink-0 disabled:opacity-50"
                                >
                                    <FiXCircle size={24} />
                                </button>
                            </div>

                            {/* Print Content Preview Area */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar  bg-slate-50 dark:bg-[#0b0f1a]">
                                <div id="rekap-pdf-content" className="max-w-[794px] mx-auto bg-white p-12 custom-shadow">
                                    {/* Print Header */}
                                    <div className="flex items-center justify-between border-b-4 border-slate-900 pb-6 mb-8">
                                        <div>
                                            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Rekapitulasi SPK</h1>
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">CV. Abadi Jaya Percetakan & POS</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tanggal Laporan</p>
                                            <p className="text-base font-black text-slate-900">{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    {/* Data Table */}
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-slate-300">
                                                <th className="py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Nomor SPK</th>
                                                <th className="py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Pemesan</th>
                                                <th className="py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Item Produk</th>
                                                <th className="py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Qty</th>
                                                <th className="py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Deadline</th>
                                                <th className="py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {spkList.map(spk => (
                                                <tr key={spk.id} className={`${spk.status === 'Batal' ? 'bg-rose-50/50' : ''}`}>
                                                    <td className="py-3 text-xs font-bold text-slate-800">#{spk.spk_number}</td>
                                                    <td className="py-3 text-xs text-slate-700 font-medium">{spk.customer_company || spk.customer_name}</td>
                                                    <td className="py-3 text-xs text-slate-700 line-clamp-1 max-w-[150px]">{spk.product_name}</td>
                                                    <td className="py-3 text-xs text-slate-700 font-bold">{spk.product_qty} {spk.product_unit}</td>
                                                    <td className="py-3 text-xs text-slate-600">{formatDate(spk.deadline).split(',')[0]}</td>
                                                    <td className="py-3 text-xs text-right font-black uppercase tracking-wider">
                                                        <span className={
                                                            spk.status === 'Selesai' || spk.status === 'Diambil' ? 'text-emerald-600' :
                                                                spk.status === 'Batal' ? 'text-rose-500' : 'text-amber-500'
                                                        }>{spk.status}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="mt-12 text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                                        Dicetak otomatis oleh Sistem Abadi Jaya POS pada {new Date().toLocaleString('id-ID')}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer Controls */}
                            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Format Laporan A4</p>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowRekapModal(false)}
                                        disabled={isExporting}
                                        className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setIsExporting(true);
                                            const element = document.getElementById('rekap-pdf-content');
                                            try {
                                                await html2pdf().from(element).set({
                                                    margin: 10,
                                                    filename: `Rekap_Produksi_${new Date().toISOString().split('T')[0]}.pdf`,
                                                    image: { type: 'jpeg', quality: 0.98 },
                                                    html2canvas: { scale: 2, useCORS: true },
                                                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                                }).save();
                                            } catch (err) {
                                                console.error('Error generating PDF:', err);
                                            } finally {
                                                setIsExporting(false);
                                            }
                                        }}
                                        disabled={isExporting}
                                        className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all disabled:opacity-50 active:scale-95"
                                    >
                                        {isExporting ? (
                                            <motion.div
                                                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                            />
                                        ) : (
                                            <FiDownload size={18} />
                                        )}
                                        {isExporting ? 'Memproses PDF...' : 'Unduh Laporan PDF'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
