import { useState, useMemo } from 'react';
import db from '../db';
import { formatRupiah, formatDateTime } from '../utils';
import Modal from '../components/Modal';
import {
    FiPackage,
    FiSearch,
    FiCheckCircle,
    FiAlertTriangle,
    FiUser,
    FiPhone,
    FiFileText,
    FiClock,
    FiChevronLeft,
    FiChevronRight,
    FiPrinter,
    FiInfo,
    FiX,
    FiInbox,
    FiCalendar
} from 'react-icons/fi';

export default function HandoverPage() {
    const [transactions] = useState(() => db.getAll('transactions'));
    const [dpTasks] = useState(() => db.getAll('dp_tasks'));
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [handovers, setHandovers] = useState(() => db.getAll('handovers'));
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    const getHandoverStatus = (trxId) => handovers.find(h => h.transactionId === trxId);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return transactions.filter(t => {
            const matchSearch = !q || (t.invoiceNo || '').toLowerCase().includes(q) || (t.customerName || '').toLowerCase().includes(q);
            const ho = getHandoverStatus(t.id);
            if (filterStatus === 'pending') return matchSearch && !ho;
            if (filterStatus === 'done') return matchSearch && ho;
            return matchSearch;
        });
    }, [transactions, search, filterStatus, handovers]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const pendingCount = transactions.filter(t => !getHandoverStatus(t.id)).length;
    const doneCount = handovers.length;

    const openHandover = (trx) => {
        setSelectedTrx(trx);
        setReceiverName(trx.customerName || '');
        setReceiverPhone('');
        setNotes('');
    };

    const handleHandover = () => {
        if (!receiverName.trim() || !selectedTrx) return;
        db.insert('handovers', {
            transactionId: selectedTrx.id,
            invoiceNo: selectedTrx.invoiceNo,
            customerName: selectedTrx.customerName,
            receiverName,
            receiverPhone,
            notes,
            handoverDate: new Date().toISOString(),
            handoverBy: 'Admin',
        });
        db.logActivity('Admin', 'Serah Terima', `Pesanan ${selectedTrx.invoiceNo} diserahkan ke ${receiverName}`);
        setHandovers(db.getAll('handovers'));
        setSelectedTrx(null);
    };

    const handleSearch = (v) => { setSearch(v); setPage(1); };
    const handleFilter = (v) => { setFilterStatus(v); setPage(1); };

    return (
        <div className="p-4 sm:p-8 space-y-8 font-display bg-slate-50/30 dark:bg-transparent min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-100 dark:shadow-none"><FiInbox /></span>
                        Serah Terima Barang
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-1 italic opacity-75">Customer Pickup & Order Verification System</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-xs font-black text-slate-500">
                    <FiCalendar className="text-emerald-600" />
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: 'Total Pesanan', value: transactions.length, icon: <FiPackage />, color: 'blue', sub: 'Total Records' },
                    { label: 'Menunggu', value: pendingCount, icon: <FiClock />, color: 'amber', sub: 'Ready for Pickup' },
                    { label: 'Selesai', value: doneCount, icon: <FiCheckCircle />, color: 'emerald', sub: 'Completed Handovers' },
                ].map((s, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${s.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                                    s.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' :
                                        'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                                }`}>
                                {s.icon}
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.sub}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-75">{s.label}</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                            {String(s.value).padStart(2, '0')}
                        </h4>
                    </div>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Filter Bar */}
                <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col lg:flex-row gap-6 bg-slate-50/30 dark:bg-slate-800/20">
                    <div className="relative group flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none transition-transform group-focus-within:translate-x-1">
                            <div className="p-2 border border-transparent group-focus-within:text-emerald-600 text-slate-400">
                                <FiSearch size={16} />
                            </div>
                        </div>
                        <input
                            className="block w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                            placeholder="Cari nomor invoice atau nama pelanggan..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { key: 'all', label: 'Semua Status' },
                            { key: 'pending', label: `Pending (${pendingCount})` },
                            { key: 'done', label: `Selesai (${doneCount})` },
                        ].map(f => (
                            <button
                                key={f.key}
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterStatus === f.key ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600'}`}
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
                            <FiInbox size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-800" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">Tidak ada antrean serah terima</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="text-left bg-slate-50/50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Ref</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Order</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Transaksi</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Logistik</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Konfirmasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {paginated.map(t => {
                                    const ho = getHandoverStatus(t.id);
                                    return (
                                        <tr key={t.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                                    {t.invoiceNo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">
                                                {formatDateTime(t.date)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors shadow-sm">
                                                        <FiUser size={14} />
                                                    </div>
                                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.customerName || 'Pelanggan Umum'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-xs font-black text-emerald-600 italic tracking-tighter">
                                                    {formatRupiah(t.total)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {ho ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30">
                                                        <FiCheckCircle size={12} /> Diserahkan
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30">
                                                        <FiClock size={12} /> Menunggu
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {ho ? (
                                                    <div className="flex flex-col items-end">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Penerima</p>
                                                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{ho.receiverName}</p>
                                                    </div>
                                                ) : (
                                                    (() => {
                                                        const isDp = t.type === 'digital_printing';
                                                        const dpTask = isDp && t.dp_task_id ? dpTasks.find(d => d.id === t.dp_task_id) : null;
                                                        const dpStatus = dpTask ? dpTask.status : null;

                                                        if (isDp && dpStatus && dpStatus !== 'selesai' && dpStatus !== 'Diambil') {
                                                            return (
                                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900/50">
                                                                    <FiPrinter size={12} /> Produksi: {dpStatus}
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <button
                                                                onClick={() => openHandover(t)}
                                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/10 active:scale-95 flex items-center gap-2 ml-auto"
                                                            >
                                                                <FiCheckCircle size={14} /> Serah Terima
                                                            </button>
                                                        );
                                                    })()
                                                )}
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
                            Displaying {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} transactions
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
            </div>

            {/* Handover Modal */}
            <Modal
                isOpen={!!selectedTrx}
                onClose={() => setSelectedTrx(null)}
                title="Lengkapi Berita Acara Serah Terima"
                icon={<FiCheckCircle className="text-emerald-600" />}
                footer={
                    <div className="flex gap-4 w-full">
                        <button className="flex-1 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500" onClick={() => setSelectedTrx(null)}>
                            <FiX className="inline mr-2" /> Gagalkan
                        </button>
                        <button
                            className="flex-1 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:scale-100"
                            onClick={handleHandover}
                            disabled={!receiverName.trim()}
                        >
                            <FiCheckCircle className="mr-2" /> Konfirmasi Penyerahan
                        </button>
                    </div>
                }
            >
                {selectedTrx && (
                    <div className="space-y-6">
                        <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform"></div>
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 relative z-10">Ringkasan Transaksi</p>
                            <div className="space-y-3 relative z-10">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                    <span>Nomor Invoice:</span>
                                    <span className="text-slate-900 dark:text-white font-black">{selectedTrx.invoiceNo}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                    <span>Atas Nama:</span>
                                    <span className="text-slate-900 dark:text-white uppercase italic">{selectedTrx.customerName || 'Umum'}</span>
                                </div>
                                <div className="h-px bg-emerald-100 dark:bg-emerald-800/50 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tagihan Total</span>
                                    <span className="text-lg font-black text-emerald-600 italic tracking-tighter">{formatRupiah(selectedTrx.total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <FiUser size={13} className="text-emerald-600" /> Nama Penerima Barang *
                                </label>
                                <input
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400/50"
                                    value={receiverName}
                                    onChange={e => setReceiverName(e.target.value)}
                                    placeholder="Input nama lengkap penerima..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <FiPhone size={13} className="text-emerald-600" /> No. Telepon Penerima
                                </label>
                                <input
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400/50"
                                    value={receiverPhone}
                                    onChange={e => setReceiverPhone(e.target.value)}
                                    placeholder="08xxxxxxxxxx"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <FiFileText size={13} className="text-emerald-600" /> Catatan Serah Terima
                                </label>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-xs font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400/50 resize-none"
                                    rows={3}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Warna box, kondisi barang, dll..."
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-dashed border-amber-200 dark:border-amber-800/50 flex gap-4 items-center">
                            <div className="size-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                                <FiInfo size={18} />
                            </div>
                            <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase leading-relaxed tracking-wide italic">Dengan menekan tombol konfirmasi, maka status pesanan akan dinyatakan telah diterima sepenuhnya oleh pelanggan.</p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
