import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCheck, FiX, FiSave, FiSearch, FiPlus, FiBox,
    FiAlertCircle, FiArrowRight, FiArrowLeft, FiEdit3,
    FiSettings, FiGrid, FiList, FiFilter, FiDownload, FiTruck, FiActivity,
    FiUpload, FiSliders
} from 'react-icons/fi';
import Swal from 'sweetalert2';

/* ── Helpers ─────────────────────────────────────────────────────────── */
const fmt = (n) => 'Rp ' + Math.floor(n || 0).toLocaleString('id-ID');

function Toast({ msg, type, onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-xl font-semibold shadow-2xl flex items-center gap-3 text-white ${type === 'error' ? 'bg-rose-500' : type === 'warn' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
        >
            {type === 'error' ? <FiAlertCircle /> : type === 'warn' ? <FiAlertCircle /> : <FiCheck />}
            <span className="text-sm">{msg}</span>
        </motion.div>
    );
}

/* ── Modal Form Bahan ────────────────────────────────────────────────── */
const emptyForm = { nama_bahan: '', kategori: 'digital', satuan: 'm2', harga_modal: '', harga_jual: '', stok_saat_ini: '', stok_minimum: '' };

function FormBahanModal({ initial, onClose, onSaved, toast }) {
    const [form, setForm] = useState(initial ? {
        nama_bahan: initial.nama_bahan, kategori: initial.kategori,
        satuan: initial.satuan, harga_modal: initial.harga_modal,
        harga_jual: initial.harga_jual, stok_saat_ini: initial.stok_saat_ini,
        stok_minimum: initial.stok_minimum, is_active: initial.is_active,
    } : emptyForm);
    const [saving, setSaving] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleCancel = () => {
        const isDirty = form.nama_bahan.trim() !== '' || String(form.harga_modal) !== '' || String(form.harga_jual) !== '';
        if (isDirty) {
            Swal.fire({
                title: 'Batalkan Pengisian?',
                text: 'Data yang sudah Anda ketik akan hilang.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ya, Batalkan',
                cancelButtonText: 'Lanjut Isi',
                customClass: {
                    confirmButton: 'bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl ml-3',
                    cancelButton: 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl',
                    popup: 'dark:bg-slate-800 dark:text-white rounded-3xl',
                    title: 'text-slate-800 dark:text-white font-black',
                    htmlContainer: 'text-slate-600 dark:text-slate-300'
                },
                buttonsStyling: false,
                background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b'
            }).then((result) => {
                if (result.isConfirmed) onClose();
            });
        } else {
            onClose();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nama_bahan.trim()) {
            Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Nama bahan wajib diisi', confirmButtonColor: '#3b82f6' });
            return;
        }
        setSaving(true);
        try {
            if (initial) {
                await api.put(`/materials/${initial.id}`, form);
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Bahan cetak berhasil diperbarui.', timer: 1500, showConfirmButton: false });
            } else {
                await api.post('/materials', form);
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Bahan baru berhasil ditambahkan.', timer: 1500, showConfirmButton: false });
            }
            onSaved();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal menyimpan', confirmButtonColor: '#ef4444' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCancel}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800"
            >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                            <FiBox className="text-primary" />
                            {initial ? 'Edit Bahan Cetak' : 'Tambah Bahan Baru'}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Lengkapi informasi detail stok dan harga bahan.</p>
                    </div>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors dark:text-slate-400" onClick={handleCancel}>
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nama Bahan *</label>
                            <input className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/50 dark:text-white transition-all outline-none"
                                placeholder="Contoh: Art Paper 260gr"
                                value={form.nama_bahan} onChange={e => set('nama_bahan', e.target.value)} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Kategori</label>
                            <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/50 dark:text-white transition-all outline-none appearance-none"
                                value={form.kategori} onChange={e => set('kategori', e.target.value)}>
                                <option value="digital">Digital Printing</option>
                                <option value="offset">Offset / Cetak Offset</option>
                                <option value="atk">ATK</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Satuan</label>
                            <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/50 dark:text-white transition-all outline-none appearance-none"
                                value={form.satuan} onChange={e => set('satuan', e.target.value)}>
                                <option value="m2">m² (meter persegi)</option>
                                <option value="lembar">Lembar</option>
                                <option value="rim">Rim</option>
                                <option value="pcs">Pcs</option>
                                <option value="roll">Roll</option>
                            </select>
                        </div>

                        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/10 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Harga Modal (Rp)</label>
                                <input className="w-full bg-white dark:bg-slate-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/50 dark:text-white outline-none" type="number" min="0"
                                    value={form.harga_modal} onChange={e => set('harga_modal', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Harga Jual (Rp)</label>
                                <input className="w-full bg-white dark:bg-slate-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/50 dark:text-white outline-none font-bold" type="number" min="0"
                                    value={form.harga_jual} onChange={e => set('harga_jual', e.target.value)} />
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100/50 dark:border-blue-500/10 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">Stok Saat Ini</label>
                                <input className="w-full bg-white dark:bg-slate-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500/50 dark:text-white outline-none" type="number" min="0" step="0.01"
                                    value={form.stok_saat_ini} onChange={e => set('stok_saat_ini', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">Stok Minimum</label>
                                <input className="w-full bg-white dark:bg-slate-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500/50 dark:text-white outline-none" type="number" min="0" step="0.01"
                                    value={form.stok_minimum} onChange={e => set('stok_minimum', e.target.value)} />
                            </div>
                        </div>

                        {initial && (
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Status Bahan</label>
                                <div className="flex gap-4">
                                    {[
                                        { val: true, label: 'Aktif', icon: <FiCheck />, color: 'emerald' },
                                        { val: false, label: 'Nonaktif', icon: <FiX />, color: 'rose' }
                                    ].map(opt => (
                                        <button
                                            key={opt.label}
                                            type="button"
                                            onClick={() => set('is_active', opt.val)}
                                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${form.is_active === opt.val
                                                ? `bg-${opt.color}-50 dark:bg-${opt.color}-500/10 border-${opt.color}-500 text-${opt.color}-600 dark:text-${opt.color}-400`
                                                : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-400'
                                                }`}
                                        >
                                            {opt.icon} {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </form>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-end items-center">
                    <button type="button" className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold hover:shadow-lg transition-all" onClick={handleCancel}>
                        Batal
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-8 py-3 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><LU_AVATARS.loading /></motion.div> : <FiSave />}
                        {saving ? 'Menyimpan...' : 'Simpan Bahan'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

/* ── Modal Sesuaikan Stok ────────────────────────────────────────────── */
function StokModal({ bahan, onClose, onSaved, toast }) {
    const [form, setForm] = useState({ tipe: 'masuk', jumlah: '', catatan: '' });
    const [saving, setSaving] = useState(false);
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        api.get('/suppliers')
            .then(res => setSuppliers(res.data?.data || []))
            .catch(() => { });
    }, []);

    const handleCancel = () => {
        if (form.jumlah) {
            Swal.fire({
                title: 'Batalkan Mutasi?',
                text: 'Perubahan stok tidak akan disimpan.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#94a3b8',
                confirmButtonText: 'Ya, Batalkan',
                cancelButtonText: 'Lanjut'
            }).then((result) => {
                if (result.isConfirmed) onClose();
            });
        } else {
            onClose();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.jumlah || parseFloat(form.jumlah) <= 0) {
            Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Jumlah harus > 0', confirmButtonColor: '#3b82f6' });
            return;
        }
        setSaving(true);
        try {
            await api.post(`/materials/${bahan.id}/stok`, { ...form, jumlah: parseFloat(form.jumlah) });
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Stok berhasil disesuaikan.', timer: 1500, showConfirmButton: false });
            onSaved();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal menyesuaikan stok', confirmButtonColor: '#ef4444' });
        } finally {
            setSaving(false);
        }
    };

    const preview = () => {
        const j = parseFloat(form.jumlah) || 0;
        const s = parseFloat(bahan.stok_saat_ini) || 0;
        if (form.tipe === 'masuk') return s + j;
        if (form.tipe === 'keluar') return Math.max(0, s - j);
        if (form.tipe === 'penyesuaian') return j;
        return s;
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCancel}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800"
            >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <FiActivity className="text-primary" />
                        Sesuaikan Stok
                    </h3>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full dark:text-slate-400" onClick={handleCancel}>
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {bahan.kategori}
                            </span>
                        </div>
                        <p className="font-bold dark:text-white">{bahan.nama_bahan}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Stok saat ini: <span className="font-bold text-slate-900 dark:text-slate-200">{parseFloat(bahan.stok_saat_ini).toFixed(2)} {bahan.satuan}</span>
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Jenis Mutasi</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { val: 'masuk', label: 'Masuk', icon: <FiDownload size={24} />, color: 'emerald' },
                                { val: 'keluar', label: 'Keluar', icon: <FiUpload size={24} />, color: 'rose' },
                                { val: 'penyesuaian', label: 'Set', icon: <FiSliders size={24} />, color: 'violet' },
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, tipe: opt.val }))}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${form.tipe === opt.val
                                        ? `bg-${opt.color}-50 dark:bg-${opt.color}-500/10 border-${opt.color}-500 text-${opt.color}-600 dark:text-${opt.color}-400`
                                        : 'bg-transparent border-slate-50 dark:border-slate-800 text-slate-400 opacity-60'
                                        }`}
                                >
                                    <span className="text-xl">{opt.icon}</span>
                                    <span className="text-[10px] font-bold uppercase">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                {form.tipe === 'penyesuaian' ? `Set ke (${bahan.satuan})` : `Jumlah (${bahan.satuan})`}
                            </label>
                            <input className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-center text-xl font-bold focus:ring-2 focus:ring-primary/50 dark:text-white outline-none"
                                type="number" min="0" step="0.01" placeholder="0"
                                value={form.jumlah} onChange={e => setForm(f => ({ ...f, jumlah: e.target.value }))} />
                        </div>
                        <div className="flex flex-col justify-end">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Keterangan</label>
                            <input className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/50 dark:text-white text-sm outline-none"
                                placeholder="Supplier..."
                                list="stok-supplier-list"
                                value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} />
                            <datalist id="stok-supplier-list">
                                {suppliers.map(s => <option key={s.id} value={s.name} />)}
                            </datalist>
                        </div>
                    </div>

                    <AnimatePresence>
                        {form.jumlah && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between"
                            >
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Pratinjau akhir:</span>
                                <span className="text-xl font-black text-primary">
                                    {preview().toFixed(2)} {bahan.satuan}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex gap-3 mt-4">
                        <button type="button" className="flex-1 py-4 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold" onClick={handleCancel}>
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-4 px-6 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:bg-primary/95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? '...' : <>Simpan <FiSave /></>}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

/* ── MAIN PAGE ───────────────────────────────────────────────────────── */
export default function MaterialsPage({ onNavigate }) {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [stokItem, setStokItem] = useState(null);
    const [toastMsg, setToastMsg] = useState(null);

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const toast = useCallback((msg, type = 'success') => setToastMsg({ msg, type }), []);

    const fetchMaterials = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/materials');
            setMaterials(data);
        } catch {
            setMaterials([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMaterials(); }, []);

    const filtered = materials.filter(m => {
        const q = search.toLowerCase();
        const matchSearch = !q || m.nama_bahan.toLowerCase().includes(q) || m.kategori.toLowerCase().includes(q);
        const matchFilter = filter === 'all' || (filter === 'low' ? parseFloat(m.stok_saat_ini) <= parseFloat(m.stok_minimum) : m.kategori === filter);
        return matchSearch && matchFilter;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filter]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const displayed = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const lowStockCount = materials.filter(m => parseFloat(m.stok_saat_ini) <= parseFloat(m.stok_minimum) && parseFloat(m.stok_minimum) > 0).length;

    const handleSaved = () => {
        setStokItem(null);
        fetchMaterials();
    };

    const KATGORI_COLORS = {
        digital: { color: 'text-blue-600', bg: 'bg-blue-50', darkText: 'dark:text-blue-400', darkBg: 'dark:bg-blue-500/10' },
        offset: { color: 'text-violet-600', bg: 'bg-violet-50', darkText: 'dark:text-violet-400', darkBg: 'dark:bg-violet-500/10' },
        atk: { color: 'text-amber-600', bg: 'bg-amber-50', darkText: 'dark:text-amber-400', darkBg: 'dark:bg-amber-500/10' },
        lainnya: { color: 'text-slate-600', bg: 'bg-slate-50', darkText: 'dark:text-slate-400', darkBg: 'dark:bg-slate-500/10' },
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0b0f1a] font-display">
            <AnimatePresence>
                {toastMsg && <Toast {...toastMsg} onClose={() => setToastMsg(null)} />}
            </AnimatePresence>

            {stokItem && (
                <StokModal
                    bahan={stokItem}
                    onClose={() => setStokItem(null)}
                    onSaved={handleSaved}
                    toast={toast}
                />
            )}

            {/* ── Top Header ── */}
            <div className="px-8 py-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="space-y-1"
                >
                    <h1 className="text-3xl font-black dark:text-white flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                            <FiBox className="text-2xl" />
                        </div>
                        Katalog Bahan
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 ml-1 italic opacity-75 underline decoration-indigo-500/30 underline-offset-4">Manajemen stok & inventaris produksi percetakan.</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                >
                    <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-95">
                        <FiDownload /> Export
                    </button>
                    <button
                        onClick={() => onNavigate('tambah-bahan')}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:bg-primary/95 transition-all active:scale-95"
                    >
                        <FiPlus /> Tambah Bahan
                    </button>
                </motion.div>
            </div>

            {/* ── Stats Bar ── */}
            <div className="px-8 grid grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
                {[
                    { label: 'Total Bahan', value: materials.length, icon: FiBox, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                    { label: 'Aktif', value: materials.filter(m => m.is_active).length, icon: FiCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Stok Menipis', value: lowStockCount, icon: FiAlertCircle, color: lowStockCount > 0 ? 'text-rose-600' : 'text-slate-400', bg: lowStockCount > 0 ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-slate-50 dark:bg-slate-800/20' },
                    { label: 'Kategori', value: [...new Set(materials.map(m => m.kategori))].length, icon: FiGrid, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm group"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className={`p-3 rounded-2xl ${s.bg}`}>
                                {s.icon && <s.icon className={`text-xl ${s.color}`} />}
                            </div>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{s.label}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-75">{s.label}</p>
                        <p className="text-2xl font-black dark:text-white italic tracking-tighter">{s.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── Main Content ── */}
            <div className="px-8 pb-12 flex-1">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-full ring-8 ring-slate-100/50 dark:ring-slate-900/30"
                >
                    {/* Header Table / Search */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="relative w-full lg:max-w-md group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary/50 shadow-sm dark:text-white transition-all outline-none text-sm"
                                placeholder="Cari nama bahan atau kategori..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 overflow-auto pb-2 lg:pb-0 no-scrollbar w-full lg:w-auto">
                            {[
                                { id: 'all', label: 'Semua', icon: <FiGrid /> },
                                { id: 'digital', label: 'Digital', icon: <FiActivity /> },
                                { id: 'offset', label: 'Offset', icon: <FiList /> },
                                { id: 'atk', label: 'ATK', icon: <FiEdit3 /> },
                                { id: 'low', label: 'Menipis', icon: <FiAlertCircle />, count: lowStockCount, color: 'rose' },
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilter(f.id)}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${filter === f.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                        : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {f.icon} {f.label}
                                    {f.count > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filter === f.id ? 'bg-white/20' : 'bg-rose-500 text-white animate-pulse'}`}>
                                            {f.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-24 flex flex-col items-center justify-center gap-4">
                                <motion.div
                                    animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                                />
                                <p className="text-slate-500 font-bold animate-pulse">Menghubungkan ke inventaris...</p>
                            </div>
                        ) : displayed.length === 0 ? (
                            <div className="p-24 flex flex-col items-center justify-center gap-4">
                                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                                    <FiBox size={48} />
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-800 dark:text-white font-black text-xl">Bahan Tidak Ditemukan</p>
                                    <p className="text-slate-500 text-sm mt-1 mx-auto max-w-xs">
                                        {search ? `Tidak ada hasil untuk "${search}" dalam kategori ini.` : 'Inventaris Anda kosong. Tambahkan bahan pertama Anda sekarang.'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-10">
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                                        <th className="px-6 py-4">Identitas Bahan</th>
                                        <th className="px-6 py-4">Kategori</th>
                                        <th className="px-6 py-4">Modal / Jual</th>
                                        <th className="px-6 py-4">Profit Margin</th>
                                        <th className="px-6 py-4">Level Stok</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {displayed.map((m, idx) => {
                                        const modal = parseFloat(m.harga_modal) || 0;
                                        const jual = parseFloat(m.harga_jual) || 0;
                                        const margin = modal > 0 ? Math.round(((jual - modal) / modal) * 100) : 0;
                                        const stok = parseFloat(m.stok_saat_ini) || 0;
                                        const minStok = parseFloat(m.stok_minimum) || 0;
                                        const isLow = stok <= minStok && minStok > 0;
                                        const kc = KATGORI_COLORS[m.kategori] || KATGORI_COLORS.lainnya;

                                        return (
                                            <motion.tr
                                                key={m.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="hover:bg-slate-50/80 dark:hover:bg-blue-500/[0.02] transition-colors group"
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl ${kc.bg} ${kc.darkBg} flex items-center justify-center ${kc.color} ${kc.darkText}`}>
                                                            {m.kategori === 'digital' ? <FiActivity /> : <FiBox />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold dark:text-white text-sm group-hover:text-primary transition-colors">{m.nama_bahan}</p>
                                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">SKU-MATERIAL-{m.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase ${kc.bg} ${kc.color} ${kc.darkText} ${kc.darkBg}`}>
                                                        <div className={`w-1 h-1 rounded-full ${kc.color === 'text-slate-600' ? 'bg-slate-400' : 'bg-current'}`} />
                                                        {m.kategori}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">M: {fmt(m.harga_modal)}</p>
                                                        <p className="text-sm font-black dark:text-white">{fmt(m.harga_jual)}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className={`text-sm font-black ${margin >= 30 ? 'text-emerald-500' : margin >= 10 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                        {margin}%
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-2">
                                                        <div className="flex items-end justify-between gap-4">
                                                            <div className={`text-xs font-black ${isLow ? 'text-rose-600 dark:text-rose-400' : 'dark:text-white'}`}>
                                                                {stok.toFixed(2)} <span className="text-[10px] font-bold text-slate-400">{m.satuan}</span>
                                                            </div>
                                                            {minStok > 0 && <span className="text-[10px] text-slate-400 font-bold">Min: {minStok}</span>}
                                                        </div>
                                                        {minStok > 0 && (
                                                            <div className="h-1.5 w-32 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${Math.min(100, (stok / (minStok * 3)) * 100)}%` }}
                                                                    className={`h-full rounded-full ${isLow ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'}`}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setStokItem(m)}
                                                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-primary/20 hover:text-primary transition-all active:scale-95"
                                                            title="Sesuaikan Stok"
                                                        >
                                                            <FiSettings size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => onNavigate('tambah-bahan', { material: m })}
                                                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-500 transition-all active:scale-95"
                                                            title="Edit Bahan"
                                                        >
                                                            <FiEdit3 size={16} />
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

                    {/* Pagination */}
                    {!loading && filtered.length > 0 && (
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-xs font-bold text-slate-400">
                                MENAMPILKAN <span className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)}</span> DARI <span className="text-slate-900 dark:text-white">{filtered.length}</span> BAHAN
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-30 dark:text-white"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                >
                                    <FiArrowLeft size={16} />
                                </button>

                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => {
                                        const p = i + 1;
                                        if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                                            return (
                                                <button
                                                    key={p}
                                                    className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-xs transition-all ${currentPage === p
                                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110'
                                                        : 'bg-white dark:bg-slate-800 text-slate-400'
                                                        }`}
                                                    onClick={() => setCurrentPage(p)}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        } else if (p === currentPage - 2 || p === currentPage + 2) {
                                            return <span key={p} className="text-slate-300">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-30 dark:text-white"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                >
                                    <FiArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
