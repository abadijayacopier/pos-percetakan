import { useState, useEffect } from 'react';
import api from '../services/api';

const STATUS_FILTERS = [
    { label: 'Semua', value: 'Semua' },
    { label: 'Menunggu', value: 'Menunggu Antrian' },
    { label: 'Proses', value: 'Dalam Proses Cetak' },
    { label: 'Finishing', value: 'Finishing' },
    { label: 'Selesai', value: 'Selesai' },
    { label: 'Siap Diambil', value: 'Siap Diambil' },
    { label: 'Diambil', value: 'Diambil' },
];

const STATUS_COLORS = {
    'Menunggu Antrian': { dot: 'bg-slate-300 dark:bg-slate-600', text: 'text-slate-500', label: 'Menunggu' },
    'Dalam Proses Cetak': { dot: 'bg-amber-500 animate-pulse', text: 'text-amber-600 dark:text-amber-400', label: 'Proses Cetak' },
    'Finishing': { dot: 'bg-primary', text: 'text-primary', label: 'Finishing' },
    'Quality Control': { dot: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', label: 'QC' },
    'Selesai': { dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400', label: 'Selesai' },
    'Siap Diambil': { dot: 'bg-green-500 animate-pulse', text: 'text-green-600 dark:text-green-400', label: 'Siap Diambil' },
    'Diambil': { dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', label: 'Diambil' },
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

    const fetchSPK = async () => {
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
    };

    useEffect(() => {
        setCurrentPage(1);
        fetchSPK();
    }, [activeFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
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

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
    };

    const getDeadlineBadge = (deadline) => {
        if (!deadline) return { text: '-', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500', icon: 'calendar_month' };
        const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
        if (diff <= 0) return { text: 'Hari Ini', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', icon: 'alarm' };
        if (diff === 1) return { text: 'Besok', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', icon: 'schedule' };
        return { text: formatDate(deadline).split(',')[0], color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', icon: 'calendar_month' };
    };

    const isReadyForBilling = (s) => ['Selesai', 'Siap Diambil'].includes(s.status) && s.sisa_tagihan > 0;

    return (
        <div className="p-8 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black tracking-tight dark:text-white">Daftar Tugas Produksi (SPK)</h1>
                    <p className="text-slate-500 font-medium">Monitoring real-time alur kerja cetak dan finishing.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-all cursor-pointer dark:text-white">
                        <span className="material-symbols-outlined !text-[20px]">file_download</span>
                        Export Rekap
                    </button>
                    <button
                        onClick={() => onNavigate('cetak-offset')}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all cursor-pointer">
                        <span className="material-symbols-outlined !text-[20px]">add</span>
                        Buat SPK Baru
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2 ml-1">Status:</span>
                    {STATUS_FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setActiveFilter(f.value)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${activeFilter === f.value
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                }`}>
                            {f.label}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 border border-transparent focus-within:border-primary/50 transition-all">
                        <span className="material-symbols-outlined text-slate-400 !text-[18px]">search</span>
                        <input
                            type="text" placeholder="Cari SPK, pelanggan..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-xs font-medium pl-2 outline-none dark:text-white w-40"
                        />
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">No. SPK</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pelanggan & Produk</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Deadline</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status Produksi</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                                    Memuat data...
                                </td></tr>
                            ) : displayedSPK.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    <span className="material-symbols-outlined mr-2 !text-3xl block mb-2">inbox</span>
                                    Belum ada SPK
                                </td></tr>
                            ) : displayedSPK.map((spk) => {
                                const sc = STATUS_COLORS[spk.status] || STATUS_COLORS['Menunggu Antrian'];
                                const dl = getDeadlineBadge(spk.deadline);
                                const ready = isReadyForBilling(spk);

                                return (
                                    <tr key={spk.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${ready ? 'bg-green-50/20 dark:bg-green-900/5' : ''}`}>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-bold text-primary cursor-pointer hover:underline"
                                                onClick={() => onNavigate('spk-detail', { spkId: spk.id })}>
                                                #{spk.spk_number}
                                            </span>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Dibuat: {formatDate(spk.created_at)}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold dark:text-white">{spk.customer_company || spk.customer_name}</span>
                                                <span className="text-sm text-slate-500">{spk.product_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-medium dark:text-slate-300">{spk.product_qty} {spk.product_unit}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex justify-center">
                                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${dl.color}`}>
                                                    <span className="material-symbols-outlined !text-sm">{dl.icon}</span>
                                                    {dl.text}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`size-2 rounded-full ${sc.dot}`}></div>
                                                <span className={`text-sm font-bold ${sc.text}`}>{sc.label}</span>
                                            </div>
                                            {ready && (
                                                <span className="inline-block mt-1 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                                                    Siap Ditagih
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                {ready ? (
                                                    <>
                                                        <button
                                                            onClick={() => onNavigate('spk-settlement', { spkId: spk.id })}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg text-xs font-bold transition-all shadow-md shadow-green-200 dark:shadow-none cursor-pointer">
                                                            <span className="material-symbols-outlined !text-[18px]">point_of_sale</span>
                                                            Tagih
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => onNavigate('print-spk', { spkId: spk.id })}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all text-slate-600 dark:text-slate-300 dark:hover:text-white cursor-pointer">
                                                        <span className="material-symbols-outlined !text-[18px]">print</span>
                                                        Cetak SPK
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                            Menampilkan {Math.min(spkList.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(spkList.length, currentPage * itemsPerPage)} dari {spkList.length} SPK
                        </span>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <span className="material-symbols-outlined !text-sm">chevron_left</span>
                            </button>

                            {[...Array(totalPages)].map((_, i) => {
                                const page = i + 1;
                                // Hanya tampilkan halaman di sekitar current page jika terlalu banyak
                                if (totalPages > 5 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) {
                                    if (page === 2 || page === totalPages - 1) return <span key={page} className="px-2 text-slate-400">...</span>;
                                    return null;
                                }
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`size-8 rounded-lg text-xs font-bold transition-all ${currentPage === page
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <span className="material-symbols-outlined !text-sm">chevron_right</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
                    <div className="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined">pending_actions</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Antrian</p>
                        <p className="text-2xl font-black dark:text-white">{summary.byStatus?.['Menunggu Antrian'] || 0}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm border-l-4 border-l-amber-500">
                    <div className="size-12 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">print</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sedang Proses</p>
                        <p className="text-2xl font-black dark:text-white">{(summary.byStatus?.['Dalam Proses Cetak'] || 0) + (summary.byStatus?.['Finishing'] || 0)}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm border-l-4 border-l-green-500">
                    <div className="size-12 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Selesai</p>
                        <p className="text-2xl font-black text-green-600 dark:text-green-400">{(summary.byStatus?.['Selesai'] || 0) + (summary.byStatus?.['Siap Diambil'] || 0)}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
                    <div className="size-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">task_alt</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Diambil</p>
                        <p className="text-2xl font-black dark:text-white">{summary.byStatus?.['Diambil'] || 0}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
