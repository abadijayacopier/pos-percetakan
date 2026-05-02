import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiTruck, FiPlus, FiSearch, FiEdit3, FiTrash2,
    FiCheck, FiX, FiAlertCircle, FiUser, FiPhone, FiMapPin, FiFileText,
    FiStar, FiPieChart, FiTrendingUp, FiLayers, FiGlobe
} from 'react-icons/fi';
import api from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';

function Toast({ msg, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-2xl font-semibold shadow-2xl flex items-center gap-3 text-white backdrop-blur-xl border border-white/20 ${type === 'error' ? 'bg-rose-500/90 shadow-rose-500/20' : 'bg-emerald-500/90 shadow-emerald-500/20'}`}
        >
            {type === 'error' ? <FiAlertCircle /> : <FiCheck />}
            <span className="text-sm flex-1">{msg}</span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors">
                <FiX size={14} />
            </button>
        </motion.div>
    );
}

const emptyForm = { name: '', contact_person: '', phone: '', address: '', notes: '' };

function FormSupplierModal({ initial, onClose, onSaved, toast }) {
    const [form, setForm] = useState(initial || emptyForm);
    const [saving, setSaving] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return toast('Nama supplier wajib diisi', 'error');
        setSaving(true);
        try {
            if (initial) {
                await api.put(`/suppliers/${initial.id}`, form);
                toast('Supplier berhasil diperbarui');
            } else {
                await api.post('/suppliers', form);
                toast('Supplier baru berhasil ditambahkan');
            }
            onSaved();
        } catch (err) {
            toast(err.response?.data?.message || 'Gagal menyimpan', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 dark:bg-[#0b0f1a]/60 backdrop-blur-md" onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative w-full max-w-xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/50 dark:border-slate-800/50"
            >
                {/* Decorative Glow inside modal */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-[3rem] pointer-events-none" />

                <div className="relative z-10 p-8 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                                <FiTruck size={20} />
                            </div>
                            {initial ? 'Edit Data Supplier' : 'Tambah Supplier Baru'}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
                            Lengkapi informasi valid mengenai vendor atau penyuplai produk.
                        </p>
                    </div>
                    <button className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors dark:text-slate-300" onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Nama Perusahaan / Supplier *</label>
                        <div className="relative group">
                            <FiTruck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                            <input
                                className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all outline-none font-medium text-slate-800 shadow-sm"
                                placeholder="Contoh: PT. Abadi Jaya Sentosa"
                                value={form.name} onChange={e => set('name', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Kontak Person (Sales)</label>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                <input
                                    className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all outline-none font-medium text-slate-800 shadow-sm"
                                    placeholder="Nama Sales..."
                                    value={form.contact_person} onChange={e => set('contact_person', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Nomor Telepon / WA</label>
                            <div className="relative group">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                <input
                                    className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all outline-none font-medium text-slate-800 shadow-sm"
                                    placeholder="0812..."
                                    value={form.phone} onChange={e => set('phone', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Alamat Lengkap</label>
                        <div className="relative group">
                            <FiMapPin className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                            <textarea
                                className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all outline-none resize-none h-24 font-medium text-slate-800 shadow-sm"
                                placeholder="Alamat gudang / kantor..."
                                value={form.address} onChange={e => set('address', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Catatan (Opsional)</label>
                        <div className="relative group">
                            <FiFileText className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                            <textarea
                                className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all outline-none resize-none h-20 font-medium text-slate-800 shadow-sm"
                                placeholder="Informasi bank, jadwal kirim, dll..."
                                value={form.notes} onChange={e => set('notes', e.target.value)}
                            />
                        </div>
                    </div>

                </form>

                <div className="relative z-10 p-6 bg-slate-50/80 dark:bg-slate-800/40 backdrop-blur-md flex gap-4 justify-end items-center border-t border-slate-200/50 dark:border-slate-800/50">
                    <button type="button" className="px-6 py-3.5 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all" onClick={onClose}>
                        Batal
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-8 py-3.5 rounded-2xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? 'Menyimpan...' : 'Simpan Supplier'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [toastMsg, setToastMsg] = useState(null);

    const [page, setPage] = useState(1);
    const PER_PAGE = 12;

    const toast = useCallback((msg, type = 'success') => setToastMsg({ msg, type }), []);

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/suppliers');
            setSuppliers(data.data || []);
        } catch {
            setSuppliers([]);
            toast('Gagal memuat data supplier', 'error');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

    const handleDelete = async () => {
        try {
            await api.delete(`/suppliers/${deleteItem.id}`);
            toast('Supplier berhasil dihapus');
            fetchSuppliers();
        } catch (error) {
            toast(error.response?.data?.message || 'Gagal menghapus', 'error');
        } finally {
            setDeleteItem(null);
        }
    };

    const filtered = suppliers.filter(s => {
        const q = search.toLowerCase();
        return !q || s.name.toLowerCase().includes(q) || (s.contact_person || '').toLowerCase().includes(q) || (s.phone || '').includes(q);
    });

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const handleSearch = (v) => { setSearch(v); setPage(1); };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0b0f1a] fade-in relative overflow-hidden font-inter">
            {/* Mesh Gradient Background */}
            <div className="mesh-bg" />

            <AnimatePresence>
                {toastMsg && <Toast {...toastMsg} onClose={() => setToastMsg(null)} />}
            </AnimatePresence>

            <AnimatePresence>
                {isModalOpen && (
                    <FormSupplierModal
                        initial={editItem}
                        onClose={() => { setIsModalOpen(false); setEditItem(null); }}
                        onSaved={() => { setIsModalOpen(false); setEditItem(null); fetchSuppliers(); }}
                        toast={toast}
                    />
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={handleDelete}
                title="Hapus Supplier"
                message={`Anda yakin ingin menghapus data supplier "${deleteItem?.name}"? Tindakan ini mungkin ditolak sistem jika ada data transaksi yang masih menggunakan supplier ini!`}
                confirmText="Ya, Hapus Data"
                cancelText="Batal"
                type="danger"
            />

            {/* Top Header & Stats */}
            <header className="px-10 pt-16 pb-12 shrink-0 relative z-20">
                <div className="max-w-7xl mx-auto space-y-12">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                className="w-20 h-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 relative"
                            >
                                <FiTruck size={36} />
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white dark:border-[#0b0f1a] flex items-center justify-center text-white">
                                    <FiCheck size={14} />
                                </div>
                            </motion.div>
                            <div>
                                <motion.h1
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                    className="text-5xl md:text-6xl font-black tracking-tighter text-slate-800 dark:text-white font-premium leading-none"
                                >
                                    Ecosystem <span className="text-gradient">Suppliers</span>
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                                    className="text-slate-500 dark:text-slate-400 mt-4 font-bold max-w-xl leading-relaxed text-lg"
                                >
                                    Sentral manajemen mitra pengadaan barang dan bahan baku untuk mendukung operasional bisnis Anda secara optimal.
                                </motion.p>
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6"
                        >
                            <div className="relative group">
                                <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
                                <input
                                    className="w-full sm:w-80 pl-14 pr-6 py-5 rounded-[2rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none focus:ring-4 focus:ring-blue-500/10 dark:text-white transition-all outline-none font-black text-sm relative z-10"
                                    placeholder="Cari partner bisnis..."
                                    value={search}
                                    onChange={e => handleSearch(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="group relative px-10 py-5 bg-blue-600 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-wider text-sm overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                                <FiPlus size={22} /> <span>Registrasi Supplier</span>
                            </button>
                        </motion.div>
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Mitra', value: suppliers.length, icon: FiLayers, color: 'blue' },
                            { label: 'Supplier Aktif', value: suppliers.filter(s => s.phone).length, icon: FiStar, color: 'emerald' },
                            { label: 'Dalam Jangkauan', value: suppliers.filter(s => s.address).length, icon: FiGlobe, color: 'indigo' },
                            { label: 'Pertumbuhan', value: '+12%', icon: FiTrendingUp, color: 'violet' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + (i * 0.1) }}
                                className="premium-card p-6 flex items-center gap-5 rounded-[2rem]"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-600 dark:text-${stat.color}-400 flex items-center justify-center text-2xl shadow-inner`}>
                                    <stat.icon />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                                    <p className="text-2xl font-black text-slate-800 dark:text-white leading-none font-premium">{stat.value}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-10 pb-16 relative z-10">
                <div className="max-w-7xl mx-auto h-full flex flex-col">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }}
                        className="flex-1 overflow-auto custom-scrollbar pr-2"
                    >
                        {loading ? (
                            <div className="h-96 flex flex-col items-center justify-center">
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-16 h-16 border-[6px] border-blue-500/20 border-t-blue-600 rounded-full mb-6 shadow-lg shadow-blue-500/10" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Sinkronisasi Ecosystem...</p>
                            </div>
                        ) : paginated.length === 0 ? (
                            <div className="h-96 flex flex-col items-center justify-center text-center p-12 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[4rem] border border-white dark:border-slate-800 shadow-2xl">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                    className="w-48 h-48 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 mb-10 shadow-inner border-8 border-white dark:border-slate-800"
                                >
                                    <FiTruck size={80} />
                                </motion.div>
                                <h3 className="text-4xl font-black text-slate-800 dark:text-white mb-4 font-premium tracking-tighter">Entitas Tidak Ditemukan</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm leading-relaxed text-lg">Pencarian Bapak tidak membuahkan hasil dalam sistem radar kami.</p>
                                <button onClick={() => handleSearch('')} className="mt-8 text-blue-600 font-black uppercase tracking-widest text-sm hover:underline">Reset Pencarian</button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                    {paginated.map((s, idx) => (
                                        <motion.div
                                            key={s.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: Math.min(idx * 0.08, 0.5) }}
                                            className="premium-card p-10 group relative overflow-hidden rounded-[3.5rem] hover:ring-2 hover:ring-blue-500/20"
                                        >
                                            {/* Decorative elements */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                                            <div className="absolute bottom-0 left-0 w-2 h-0 bg-blue-600 group-hover:h-full transition-all duration-500 ease-out" />
                                            
                                            <div className="flex justify-between items-start mb-10 relative z-10">
                                                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 text-blue-600 dark:text-blue-400 rounded-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner border border-white dark:border-slate-800">
                                                    <FiTruck size={28} />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => { setEditItem(s); setIsModalOpen(true); }} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-center text-slate-400 hover:text-blue-600 hover:scale-110 transition-all border border-slate-100 dark:border-slate-700">
                                                        <FiEdit3 size={18} />
                                                    </button>
                                                    <button onClick={() => setDeleteItem(s)} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-center text-slate-400 hover:text-rose-600 hover:scale-110 transition-all border border-slate-100 dark:border-slate-700">
                                                        <FiTrash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-6 relative z-10">
                                                <div>
                                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-[1.1] mb-3 font-premium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
                                                        {s.name}
                                                    </h3>
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1 flex-shrink-0"><FiMapPin className="text-blue-500" size={14} /></div>
                                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                                            {s.address || 'LOKASI BELUM TERDEFINISI'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="pt-8 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-500/5">
                                                            <FiUser size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">Person In Charge</p>
                                                            <p className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-tight">{s.contact_person || 'No Contact'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shadow-inner border border-indigo-500/5">
                                                            <FiPhone size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">Contact Line</p>
                                                            <p className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-tight font-mono">{s.phone || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {s.notes && (
                                                    <motion.div 
                                                        initial={{ opacity: 0.8 }}
                                                        whileHover={{ opacity: 1 }}
                                                        className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] italic text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed border border-dashed border-slate-200 dark:border-slate-700 transition-all"
                                                    >
                                                        <FiFileText className="inline mr-2 text-slate-300" size={14} />
                                                        "{s.notes}"
                                                    </motion.div>
                                                )}
                                            </div>

                                            {/* Action Hint */}
                                            <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800/30 flex justify-end">
                                                <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">Supplier ID: {s.id.toString().padStart(4, '0')}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-4 pt-10">
                                        <button
                                            disabled={page === 1}
                                            onClick={() => setPage(p => p - 1)}
                                            className="w-14 h-14 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200/50 dark:shadow-none"
                                        >
                                            <FiChevronLeft size={24} />
                                        </button>
                                        
                                        <div className="flex items-center gap-2">
                                            {Array.from({ length: totalPages }).map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setPage(i + 1)}
                                                    className={`w-14 h-14 rounded-3xl text-sm font-black transition-all ${page === i + 1 ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/40 scale-110' : 'bg-white dark:bg-slate-900 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800'}`}
                                                >
                                                    {(i + 1).toString().padStart(2, '0')}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            disabled={page === totalPages}
                                            onClick={() => setPage(p => p + 1)}
                                            className="w-14 h-14 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200/50 dark:shadow-none"
                                        >
                                            <FiChevronRight size={24} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
