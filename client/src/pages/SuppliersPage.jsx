import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiTruck, FiPlus, FiSearch, FiEdit3, FiTrash2,
    FiCheck, FiX, FiAlertCircle, FiUser, FiPhone, FiMapPin, FiFileText
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

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0b0f1a] fade-in relative overflow-hidden">
            {/* Mesh Gradient Background */}
            <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-500/10 dark:from-blue-600/10 to-transparent pointer-events-none" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute top-40 -left-40 w-80 h-80 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

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
                confirmText="Ya, Hapus Kelman"
                cancelText="Batal"
                type="danger"
            />

            {/* Top Header */}
            <header className="px-8 py-8 md:py-10 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 relative z-10">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4 hidden-print"
                    >
                        <div className="p-3.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/30">
                            <FiTruck className="text-2xl" />
                        </div>
                        Data Master Supplier
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                        className="text-sm md:text-base font-semibold text-slate-500 dark:text-slate-400 mt-3 max-w-xl leading-relaxed"
                    >
                        Kelola mitra bisnis, pabrikan, dan vendor pengadaan stok Anda dalam satu sentral database.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
                >
                    <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            className="w-full sm:w-64 pl-11 pr-4 py-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-white/50 dark:border-slate-800/50 shadow-sm focus:ring-4 focus:ring-blue-500/10 dark:text-white transition-all outline-none font-medium"
                            placeholder="Cari Supplier..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all active:scale-95"
                    >
                        <FiPlus size={20} /> <span>Tambah Baru</span>
                    </button>
                </motion.div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-8 pb-8 overflow-hidden flex flex-col items-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
                    className="w-full h-full bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-white/60 dark:border-slate-800/50 flex flex-col overflow-hidden max-w-7xl relative"
                >
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {loading ? (
                            <div className="h-full flex items-center justify-center p-12">
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-12 h-12 border-[5px] border-blue-500/30 border-t-blue-500 rounded-full" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                    className="w-32 h-32 bg-slate-100/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-6 font-black text-6xl shadow-inner backdrop-blur-sm"
                                >
                                    <FiTruck className="text-slate-300 dark:text-slate-600 drop-shadow-sm" />
                                </motion.div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Tidak Ada Data Supplier</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed">Pencarian tidak menemukan hasil atau database supplier masih kosong.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="sticky top-0 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 z-10 backdrop-blur-md">
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <th className="px-6 py-4">Profil Perusahaan</th>
                                        <th className="px-6 py-4">Informasi Kontak</th>
                                        <th className="px-6 py-4">Catatan Internal</th>
                                        <th className="px-6 py-4 text-right w-24">Tindakan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {filtered.map((s, idx) => (
                                        <motion.tr
                                            key={s.id}
                                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.4) }}
                                            className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-extrabold text-slate-800 dark:text-white text-sm leading-tight mb-1.5">{s.name}</div>
                                                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                                                    <FiMapPin className="text-blue-500" /> {s.address ? (s.address.length > 35 ? s.address.substring(0, 35) + '...' : s.address) : 'Belum Ada Alamat'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2.5">
                                                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-lg"><FiUser size={14} /></div>
                                                    {s.contact_person || 'N/A'}
                                                </div>
                                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2.5">
                                                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg"><FiPhone size={14} /></div>
                                                    {s.phone || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs whitespace-normal leading-relaxed font-medium">
                                                <div className="line-clamp-2">{s.notes || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditItem(s); setIsModalOpen(true); }} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/30 dark:hover:border-blue-800 transition-all text-slate-500 dark:text-slate-400 shadow-sm">
                                                        <FiEdit3 size={16} />
                                                    </button>
                                                    <button onClick={() => setDeleteItem(s)} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-900/30 dark:hover:border-rose-800 transition-all text-slate-500 dark:text-slate-400 shadow-sm">
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
