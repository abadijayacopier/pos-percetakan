import { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import { formatRupiah, formatDateTime } from '../utils';
import Swal from 'sweetalert2';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import {
    FiCreditCard, FiSearch, FiCheckCircle, FiClock,
    FiDollarSign, FiChevronLeft, FiChevronRight,
    FiPrinter, FiAlertTriangle, FiInfo, FiTrendingUp,
    FiEdit, FiTrash2
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function CashierPaymentPage({ onNavigate }) {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [payMethod, setPayMethod] = useState('tunai');
    const [amountPaid, setAmountPaid] = useState('');
    const [page, setPage] = useState(1);
    const [waNumber, setWaNumber] = useState('');
    const PER_PAGE = 10;

    const [selectedEditTrx, setSelectedEditTrx] = useState(null);
    const [editForm, setEditForm] = useState({ customerName: '', paidAmount: '', paymentType: '' });
    const [selectedDeleteTrx, setSelectedDeleteTrx] = useState(null);

    const loadData = async () => {
        try {
            const { data } = await api.get('/transactions');
            setTransactions(data.map(t => ({
                ...t,
                invoiceNo: t.invoice_no || t.invoiceNo,
                customerName: t.customer_name || t.customerName,
                paidAmount: t.paid || t.paidAmount,
                paymentType: t.payment_type || t.paymentType,
                settledAt: t.updated_at || t.settledAt,
                date: t.date
            })));
        } catch (e) { console.error(e); }
    };

    useEffect(() => { loadData(); }, []);

    const reload = () => loadData();

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return transactions.filter(t => {
            const matchSearch = !q || (t.invoiceNo || '').toLowerCase().includes(q) || (t.customerName || '').toLowerCase().includes(q);
            if (filterStatus === 'lunas') return matchSearch && t.paidAmount >= t.total;
            if (filterStatus === 'belum') return matchSearch && (!t.paidAmount || t.paidAmount < t.total);
            return matchSearch;
        });
    }, [transactions, search, filterStatus]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const totalPaid = transactions.filter(t => t.paidAmount >= t.total).length;
    const totalUnpaid = transactions.filter(t => !t.paidAmount || t.paidAmount < t.total).length;
    const totalRevenue = transactions.reduce((s, t) => s + (t.paidAmount || 0), 0);

    const handlePrintReceipt = (trx) => {
        if (!onNavigate) return;
        const paid = trx.paidAmount || 0;
        const receiptData = {
            invoiceNo: trx.invoiceNo,
            date: formatDateTime(trx.settledAt || trx.date || new Date().toISOString()),
            cashier: user?.name || 'Kasir',
            customer: trx.customerName || 'Umum',
            items: trx.items || [],
            subtotal: trx.subtotal || trx.total,
            tax: trx.tax || 0,
            total: trx.total,
            paymentMethod: trx.paymentType || 'Tunai',
            paid: paid,
            change: paid > trx.total ? paid - trx.total : 0
        };
        onNavigate('print-receipt', { receipt: receiptData });
    };

    const openSettle = (trx) => {
        setSelectedTrx(trx);
        setAmountPaid(trx.total - (trx.paidAmount || 0));
        setWaNumber(trx.customer_wa || '');
        setPayMethod('tunai');
    };

    const handleSettle = async () => {
        if (!selectedTrx) return;
        const paid = Number(amountPaid) || 0;
        try {
            await api.put(`/transactions/${selectedTrx.id}/pay`, {
                paidAmount: paid,
                paymentMethod: payMethod,
                customerWa: waNumber
            });
            setSelectedTrx(null);
            setWaNumber('');
            reload();
        } catch (e) {
            console.error('Gagal melunasi:', e);
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal melakukan pelunasan', timer: 3000 });
        }
    };

    const openEdit = (trx) => {
        setSelectedEditTrx(trx);
        setEditForm({
            customerName: trx.customerName || '',
            paidAmount: trx.paidAmount || 0,
            paymentType: trx.paymentType || 'tunai'
        });
    };

    const handleEdit = async () => {
        if (!selectedEditTrx) return;
        try {
            await api.put(`/transactions/${selectedEditTrx.id}`, editForm);
            setSelectedEditTrx(null);
            reload();
        } catch (e) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengedit transaksi', timer: 3000 });
        }
    };

    const handleDelete = async () => {
        if (!selectedDeleteTrx) return;
        try {
            await api.delete(`/transactions/${selectedDeleteTrx.id}`);
            setSelectedDeleteTrx(null);
            reload();
        } catch (e) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus transaksi', timer: 3000 });
        }
    };

    const handleSearch = (v) => { setSearch(v); setPage(1); };
    const handleFilter = (v) => { setFilterStatus(v); setPage(1); };

    return (
        <div className="p-6 sm:p-8 min-h-screen bg-white dark:bg-slate-950 flex flex-col gap-8 font-display">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <span className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-500/20"><FiCreditCard /></span>
                        Pelunasan Kasir
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 ml-1 opacity-75">Proses pembayaran dan pelunasan transaksi</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[
                    { label: 'Lunas', value: totalPaid, icon: FiCheckCircle, color: 'emerald' },
                    { label: 'Belum Lunas', value: totalUnpaid, icon: FiClock, color: 'amber' },
                    { label: 'Total Diterima', value: formatRupiah(totalRevenue), icon: FiTrendingUp, color: 'blue' }
                ].map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all"
                    >
                        <div className={`p-4 rounded-3xl bg-${s.color}-50 dark:bg-${s.color}-500/10 text-${s.color}-500 group-hover:scale-110 transition-transform`}>
                            <s.icon size={26} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                            <p className={`text-2xl font-black italic tracking-tighter text-${s.color}-600 dark:text-${s.color}-400`}>{s.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Content Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-auto flex flex-col min-h-0 md:min-h-[500px]">
                {/* Filter Bar */}
                <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center gap-6 bg-slate-50/30 dark:bg-slate-800/20">
                    <div className="relative flex-1 group">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            placeholder="Cari nomor invoice atau nama pelanggan..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        {[
                            { key: 'all', label: 'Semua' },
                            { key: 'belum', label: `Belum Lunas (${totalUnpaid})` },
                            { key: 'lunas', label: `Lunas (${totalPaid})` },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => handleFilter(f.key)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === f.key
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-auto md:[&>table]:min-w-[800px] lg:[&>table]:min-w-[1000px]">
                    {paginated.length === 0 ? (
                        <div className="py-32 flex flex-col items-center justify-center text-slate-400 gap-4">
                            <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-full">
                                <FiCreditCard size={48} className="opacity-20" />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest italic opacity-50">Tidak ada data transaksi ditemukan</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">No. Invoice</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pelanggan</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Tagihan</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dibayar</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sisa Settle</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {paginated.map((t) => {
                                    const paid = t.paidAmount || 0;
                                    const remaining = t.total - paid;
                                    const isLunas = paid >= t.total;
                                    return (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            key={t.id}
                                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                                        >
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter italic block">{t.invoiceNo}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 block">{formatDateTime(t.date)}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 text-[10px]">
                                                        {t.customerName?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{t.customerName || 'Pelanggan Umum'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-black text-slate-900 dark:text-white italic tracking-tighter">{formatRupiah(t.total)}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 italic tracking-tighter">{formatRupiah(paid)}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`text-sm font-black italic tracking-tighter ${remaining > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                    {remaining > 0 ? formatRupiah(remaining) : 'Nihil'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                {isLunas ? (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                                                        <FiCheckCircle size={12} /> Lunas
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20">
                                                        <FiAlertTriangle size={12} /> Belum
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEdit(t)}
                                                        className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-xl transition-all"
                                                        title="Edit Transaksi"
                                                    >
                                                        <FiEdit size={16} />
                                                    </button>

                                                    {!isLunas ? (
                                                        <button
                                                            onClick={() => openSettle(t)}
                                                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                        >
                                                            <FiDollarSign /> Lunasi
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handlePrintReceipt(t)}
                                                            className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                        >
                                                            <FiPrinter /> Struk
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => setSelectedDeleteTrx(t)}
                                                        className="p-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 rounded-xl transition-all"
                                                        title="Hapus Transaksi"
                                                    >
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {filtered.length > PER_PAGE && (
                    <div className="p-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/20">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                            Showing <span className="text-slate-900 dark:text-white">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)}</span> of {filtered.length} entries
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="size-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:border-blue-500 hover:text-blue-500 transition-all"
                            >
                                <FiChevronLeft size={20} />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const p = i + 1; // Simplify pagination logic for display
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`size-10 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${page === p
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="size-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:border-blue-500 hover:text-blue-500 transition-all"
                            >
                                <FiChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Settle Modal */}
            <Modal
                isOpen={!!selectedTrx}
                onClose={() => setSelectedTrx(null)}
                title="Authorize Pelunasan"
                footer={
                    <div className="flex gap-4 w-full">
                        <button
                            onClick={() => setSelectedTrx(null)}
                            className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSettle}
                            className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3"
                        >
                            <FiCheckCircle size={16} /> Konfirmasi
                        </button>
                    </div>
                }
            >
                {selectedTrx && (
                    <div className="flex flex-col gap-8 py-2 font-display">
                        <div className="p-6 bg-slate-100 dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
                            {[
                                { label: 'Nomor Invoice', val: selectedTrx.invoiceNo, color: 'text-slate-900 dark:text-white' },
                                { label: 'Nama Pelanggan', val: selectedTrx.customerName || 'Pelanggan Umum', color: 'text-slate-900 dark:text-white' },
                                { label: 'Total Tagihan', val: formatRupiah(selectedTrx.total), color: 'text-slate-900 dark:text-white' },
                                { label: 'Sudah Dibayar', val: formatRupiah(selectedTrx.paidAmount || 0), color: 'text-emerald-500' },
                                { label: 'Sisa Tagihan', val: formatRupiah(selectedTrx.total - (selectedTrx.paidAmount || 0)), color: 'text-rose-500', bold: true },
                            ].map((row, i) => (
                                <div key={i} className="flex justify-between items-center text-[11px]">
                                    <span className="font-black uppercase tracking-widest text-slate-400">{row.label}</span>
                                    <span className={`font-black uppercase italic tracking-tighter ${row.color} ${row.bold ? 'text-lg' : ''}`}>{row.val}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Jumlah Pembayaran (Rp)</label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl py-5 px-6 text-xl font-black italic tracking-tighter text-blue-600 focus:ring-8 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                type="number"
                                autoFocus
                                value={amountPaid}
                                onChange={e => setAmountPaid(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nomor WhatsApp Nota (Opsional)</label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-6 text-lg font-bold tracking-tight text-emerald-600 focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                                type="text"
                                placeholder="Contoh: 08123456789"
                                value={waNumber}
                                onChange={e => setWaNumber(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Metode Pembayaran</label>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                {[
                                    { key: 'tunai', label: 'Tunai', icon: FiDollarSign },
                                    { key: 'qris', label: 'QRIS', icon: FiCreditCard },
                                    { key: 'transfer', label: 'Transfer', icon: FiCreditCard },
                                ].map(m => (
                                    <button
                                        key={m.key}
                                        onClick={() => setPayMethod(m.key)}
                                        className={`flex flex-col items-center gap-3 p-4 rounded-[1.5rem] border-2 transition-all group ${payMethod === m.key
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20'
                                            : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${payMethod === m.key ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            <m.icon size={18} />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!selectedEditTrx}
                onClose={() => setSelectedEditTrx(null)}
                title="Edit Transaksi"
                footer={
                    <div className="flex gap-4 w-full">
                        <button
                            onClick={() => setSelectedEditTrx(null)}
                            className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleEdit}
                            className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3"
                        >
                            <FiCheckCircle size={16} /> Simpan
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Pelanggan / Catatan</label>
                        <input
                            type="text"
                            value={editForm.customerName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, customerName: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Nominal Dibayar (Lunas jika ≥ Total)</label>
                        <input
                            type="number"
                            value={editForm.paidAmount}
                            onChange={(e) => setEditForm(prev => ({ ...prev, paidAmount: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Metode Pembayaran</label>
                        <select
                            value={editForm.paymentType}
                            onChange={(e) => setEditForm(prev => ({ ...prev, paymentType: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 appearance-none"
                        >
                            <option value="tunai">Tunai</option>
                            <option value="transfer">Transfer Bank</option>
                            <option value="qris">QRIS</option>
                            <option value="hutang">Hutang / Pending</option>
                        </select>
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={!!selectedDeleteTrx}
                onClose={() => setSelectedDeleteTrx(null)}
                title="Hapus Transaksi (Void)"
                footer={
                    <div className="flex gap-4 w-full">
                        <button
                            onClick={() => setSelectedDeleteTrx(null)}
                            className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex-1 px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-3"
                        >
                            <FiTrash2 size={16} />Hapus Transaksi
                        </button>
                    </div>
                }
            >
                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-500/20 flex flex-col items-center text-center gap-4">
                    <FiAlertTriangle size={48} className="my-2" />
                    <p className="font-bold text-sm">Apakah Anda yakin ingin MENGHAPUS (Void) transaksi ini?</p>
                    <p className="text-xs opacity-80">Aksi ini bersifat permanen, stok produk akan dikembalikan, dan riwayat akan dihapus.</p>
                </div>
            </Modal>
        </div>
    );
}
