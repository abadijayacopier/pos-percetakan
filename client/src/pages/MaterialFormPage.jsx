import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX, FiSave, FiPrinter, FiPlus, FiArrowLeft, FiBox, FiLayers, FiTag, FiDollarSign, FiPercent, FiMapPin, FiTruck, FiChevronRight, FiAlertCircle } from 'react-icons/fi';

import Modal from '../components/Modal';

const Toast = ({ msg, type, onClose }) => (
    <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        className={`fixed bottom-8 right-8 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' :
            type === 'warn' ? 'bg-amber-500/90 border-amber-400 text-white' :
                'bg-emerald-600/90 border-emerald-400 text-white'
            }`}
    >
        <div className="text-xl">
            {type === 'error' ? <FiAlertCircle /> : type === 'warn' ? <FiAlertCircle /> : <FiCheck />}
        </div>
        <div className="font-bold text-sm tracking-wide">{msg}</div>
        <button onClick={onClose} className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors">
            <FiX />
        </button>
    </motion.div>
);

const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

export default function MaterialFormPage({ onNavigate, pageState }) {
    const initial = pageState?.material || null;
    const [form, setForm] = useState({
        nama_bahan: initial?.nama_bahan || '',
        kategori: initial?.kategori || '',
        satuan: initial?.satuan || '',
        stok_saat_ini: initial?.stok_saat_ini || '',
        stok_minimum: initial?.stok_minimum || '',
        lokasi_rak: initial?.lokasi_rak || '',
        harga_modal: initial?.harga_modal || '',
        harga_jual: initial?.harga_jual || '',
        supplier_id: initial?.supplier_id || '',
        barcode: initial?.barcode || 'SKU-' + Date.now().toString().slice(-6),
        autoBarcode: !initial?.barcode,
        margin_persen: ''
    });
    const [saving, setSaving] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const [kategoriOptions, setKategoriOptions] = useState(["digital", "offset", "atk", "finishing"]);
    const [satuanOptions, setSatuanOptions] = useState(["lembar", "roll", "m2", "pcs", "box"]);
    const [suppliers, setSuppliers] = useState([]);
    const [promptModal, setPromptModal] = useState({ isOpen: false, type: '', title: '', value: '' });

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const toast = useCallback((msg, type = 'success') => {
        setToastMsg({ msg, type });
        setTimeout(() => setToastMsg(null), 4000);
    }, []);

    useEffect(() => {
        api.get('/settings/master')
            .then(res => {
                if (res.data?.kategori_bahan) setKategoriOptions(res.data.kategori_bahan);
                if (res.data?.satuan_unit) setSatuanOptions(res.data.satuan_unit);
            })
            .catch(err => console.error("Failed to load master data", err));

        api.get('/suppliers')
            .then(res => setSuppliers(res.data?.data || []))
            .catch(err => console.error("Failed to load suppliers", err));

        if (form.harga_modal && form.harga_jual) {
            const hpp = parseFloat(form.harga_modal);
            const hj = parseFloat(form.harga_jual);
            if (hpp > 0 && hj > hpp) {
                const margin = ((hj - hpp) / hpp) * 100;
                setForm(f => ({ ...f, margin_persen: margin.toFixed(2).replace(/\.00$/, '') }));
            }
        }
    }, []);

    const handleHargaModalChange = (e) => {
        const val = e.target.value;
        set('harga_modal', val);
        const hpp = parseFloat(val) || 0;
        const mp = parseFloat(form.margin_persen) || 0;
        if (hpp > 0 && mp > 0) {
            set('harga_jual', Math.round(hpp + (hpp * mp / 100)));
        }
    };

    const handleMarginChange = (e) => {
        const val = e.target.value;
        set('margin_persen', val);
        const hpp = parseFloat(form.harga_modal) || 0;
        const mp = parseFloat(val) || 0;
        if (hpp > 0) {
            set('harga_jual', Math.round(hpp + (hpp * mp / 100)));
        }
    };

    const handleHargaJualChange = (e) => {
        const val = e.target.value;
        set('harga_jual', val);
        const hpp = parseFloat(form.harga_modal) || 0;
        const hj = parseFloat(val) || 0;
        if (hpp > 0 && hj >= hpp) {
            const margin = ((hj - hpp) / hpp) * 100;
            set('margin_persen', margin.toFixed(2).replace(/\.00$/, ''));
        } else if (hj < hpp) {
            set('margin_persen', 0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nama_bahan.trim()) return toast('Nama bahan wajib diisi', 'warn');
        if (!form.kategori) return toast('Pilih kategori bahan', 'warn');
        if (!form.satuan) return toast('Pilih satuan bahan', 'warn');

        setSaving(true);
        try {
            const payload = {
                ...form,
                harga_modal: form.harga_modal || 0,
                harga_jual: form.harga_jual || 0,
                stok_saat_ini: form.stok_saat_ini || 0,
                stok_minimum: form.stok_minimum || 0,
                is_active: 1
            };
            if (initial) {
                await api.put(`/materials/${initial.id}`, payload);
                toast('Data bahan berhasil diperbarui.');
            } else {
                await api.post('/materials', payload);
                toast('Bahan baru berhasil ditambahkan ke inventaris.');
            }
            setTimeout(() => onNavigate('stok-bahan'), 1200);
        } catch (err) {
            toast(err.response?.data?.message || 'Gagal menyimpan data ke database', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0b0f1a] font-display">
            <AnimatePresence>
                {toastMsg && <Toast {...toastMsg} onClose={() => setToastMsg(null)} />}
            </AnimatePresence>

            {/* ── Navigation Header ── */}
            <div className="px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onNavigate('stok-bahan')}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-all active:scale-90"
                    >
                        <FiArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Inventaris</span>
                        <FiChevronRight className="text-slate-300 hidden sm:block" />
                        <h1 className="text-lg font-black dark:text-white truncate">
                            {initial ? `Edit: ${initial.nama_bahan}` : 'Pendaftaran Bahan Baru'}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => onNavigate('stok-bahan')}
                        className="px-5 py-2.5 rounded-xl text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear' }}><FiSave /></motion.div> : <FiSave />}
                        {saving ? 'Menyimpan...' : 'Simpan Data'}
                    </button>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto px-8 py-10 custom-scrollbar">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Form Sections */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Section 1: Identitas Utama */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 text-primary/5 dark:text-primary/10">
                                <FiPlus size={120} />
                            </div>

                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <FiBox size={18} />
                                </div>
                                <div>
                                    <h2 className="font-black text-slate-800 dark:text-white leading-tight underline decoration-primary/30 decoration-4 underline-offset-4">Identitas Bahan</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Basic Product Information</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Nama Deskriptif Bahan</label>
                                    <input
                                        type="text"
                                        value={form.nama_bahan}
                                        onChange={e => set('nama_bahan', e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none font-bold dark:text-white"
                                        placeholder="Contoh: Art Paper 260gr High Gloss"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kategori</label>
                                        <div className="relative">
                                            <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <select
                                                value={form.kategori}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'NEW') {
                                                        setPromptModal({ isOpen: true, type: 'kategori', title: 'Tambah Kategori Baru', value: '' });
                                                        set('kategori', '');
                                                    } else {
                                                        set('kategori', val);
                                                    }
                                                }}
                                                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary/50 outline-none font-bold dark:text-white appearance-none"
                                            >
                                                <option value="">Pilih Kategori</option>
                                                {kategoriOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                                                ))}
                                                <option value="NEW" className="font-bold text-primary">+ Tambah Baru</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Satuan Dasar</label>
                                        <div className="relative">
                                            <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <select
                                                value={form.satuan}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'NEW') {
                                                        setPromptModal({ isOpen: true, type: 'satuan', title: 'Tambah Satuan Baru', value: '' });
                                                        set('satuan', '');
                                                    } else {
                                                        set('satuan', val);
                                                    }
                                                }}
                                                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary/50 outline-none font-bold dark:text-white appearance-none"
                                            >
                                                <option value="">Pilih Satuan</option>
                                                {satuanOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                                                ))}
                                                <option value="NEW" className="font-bold text-primary">+ Tambah Baru</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* Section 2: Stok & Lokasi */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none"
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600">
                                    <FiMapPin size={18} />
                                </div>
                                <div>
                                    <h2 className="font-black text-slate-800 dark:text-white leading-tight underline decoration-amber-400/30 decoration-4 underline-offset-4">Stok & Penempatan</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Inventory Levels & Warehouse</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Stok Awal Saat Ini</label>
                                    <input
                                        type="number"
                                        value={form.stok_saat_ini}
                                        onChange={e => set('stok_saat_ini', e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-amber-400/50 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none font-bold dark:text-white"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ambang Batas Minimum (Warning)</label>
                                    <input
                                        type="number"
                                        value={form.stok_minimum}
                                        onChange={e => set('stok_minimum', e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl bg-rose-50/30 dark:bg-rose-500/[0.03] border-2 border-rose-100/50 dark:border-rose-500/10 focus:border-rose-400/50 outline-none font-bold dark:text-white"
                                        placeholder="5"
                                    />
                                    <p className="px-1 text-[9px] font-bold text-rose-400 uppercase italic">* Sistem akan mendeteksi sebagai 'Menipis' jika dibawah angka ini.</p>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lokasi Penyimpanan / Rak</label>
                                    <div className="relative">
                                        <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            type="text"
                                            value={form.lokasi_rak}
                                            onChange={e => set('lokasi_rak', e.target.value)}
                                            className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-amber-400/50 outline-none font-bold dark:text-white"
                                            placeholder="Contoh: Lantai 2, Rak Kertas B-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* Section 3: Keuangan */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none"
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600">
                                    <FiDollarSign size={18} />
                                </div>
                                <div>
                                    <h2 className="font-black text-slate-800 dark:text-white leading-tight underline decoration-violet-400/30 decoration-4 underline-offset-4">Finansial & Pricing</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cost, Profit, and Suppliers</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Harga Modal (Avg)</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</div>
                                        <input
                                            type="number"
                                            value={form.harga_modal}
                                            onChange={handleHargaModalChange}
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-violet-400/50 font-black dark:text-white focus:bg-white outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Margin Profit</label>
                                    <div className="relative">
                                        <FiPercent className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.margin_persen}
                                            onChange={handleMarginChange}
                                            className="w-full px-5 py-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/[0.05] border-2 border-emerald-100/50 dark:border-emerald-500/10 focus:border-emerald-400/50 font-black dark:text-white outline-none"
                                            placeholder="50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest px-1 text-violet-600 dark:text-violet-400">Harga Jual Retail</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-violet-400">Rp</div>
                                        <input
                                            type="number"
                                            value={form.harga_jual}
                                            onChange={handleHargaJualChange}
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-violet-50/50 dark:bg-violet-500/[0.08] border-2 border-violet-100/50 dark:border-violet-500/20 focus:border-violet-400/50 font-black dark:text-white outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-3 space-y-2 mt-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Partner Supplier / Pemasok</label>
                                    <div className="relative">
                                        <FiTruck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <select
                                            value={form.supplier_id}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val === 'NEW') {
                                                    setPromptModal({ isOpen: true, type: 'supplier', title: 'Tambah Pemasok Baru', value: '' });
                                                    set('supplier_id', '');
                                                } else {
                                                    set('supplier_id', val);
                                                }
                                            }}
                                            className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-violet-400/50 outline-none font-bold dark:text-white appearance-none"
                                        >
                                            <option value="">Pilih Pemasok Utama</option>
                                            {suppliers.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                            <option value="NEW" className="font-bold text-violet-600">+ Tambah Pemasok Baru</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    </div>

                    {/* Right Column: Preview & Barcode */}
                    <div className="space-y-8">
                        {/* Barcode Widget */}
                        <motion.section
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                            className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-blue-500/20"
                        >
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-700" />

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="flex items-center justify-between w-full mb-8">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Auto SKU</span>
                                    <div
                                        onClick={() => set('autoBarcode', !form.autoBarcode)}
                                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${form.autoBarcode ? 'bg-primary' : 'bg-slate-700'}`}
                                    >
                                        <motion.div
                                            animate={{ x: form.autoBarcode ? 26 : 4 }}
                                            className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl w-full mb-6">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-full h-12 flex gap-0.5 items-end overflow-hidden px-2">
                                            {Array.from({ length: 40 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-full ${i % 3 === 0 ? 'bg-slate-800' : i % 7 === 1 ? 'bg-transparent' : 'bg-slate-600'} ${[0, 5, 12, 18, 25, 32].includes(i) ? 'flex-1' : 'w-[1px]'}`}
                                                ></div>
                                            ))}
                                        </div>
                                        <span className="text-xs font-mono font-black tracking-[0.3em] text-slate-800 mt-2">{form.barcode || 'SKU-NONE'}</span>
                                    </div>
                                </div>

                                <div className="w-full space-y-4">
                                    <input
                                        type="text"
                                        readOnly={form.autoBarcode}
                                        value={form.barcode}
                                        onChange={e => set('barcode', e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl text-center font-black text-sm tracking-widest ${form.autoBarcode ? 'bg-slate-800/50 text-slate-500' : 'bg-slate-800 text-white border border-slate-700'} outline-none transition-all placeholder:text-slate-600`}
                                        placeholder="INPUT SKU MANUAL"
                                    />
                                    <button className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs transition-colors">
                                        <FiPrinter /> Cetak Label Barcode
                                    </button>
                                </div>
                            </div>
                        </motion.section>

                        {/* Value Preview Card */}
                        <motion.section
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                            className="p-8 bg-gradient-to-br from-primary to-blue-700 rounded-[2.5rem] text-white shadow-xl shadow-primary/30"
                        >
                            <h3 className="text-xs font-black uppercase tracking-widest opacity-60 mb-6">Kartu Ringkasan</h3>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold uppercase opacity-50 mb-1">Estimasi Margin</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl font-black">{form.margin_persen || '0'}%</span>
                                        <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md mb-1.5 leading-none">Net</span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase opacity-50 mb-1">Harga Jual</p>
                                        <p className="text-xl font-black">{fmt(form.harga_jual)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold uppercase opacity-50 mb-1">Profit/Unit</p>
                                        <p className="text-xl font-black text-emerald-300">
                                            +{fmt((parseFloat(form.harga_jual) || 0) - (parseFloat(form.harga_modal) || 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    </div>
                </div>
            </main>

            {/* Prompt Modal */}
            <Modal
                isOpen={promptModal.isOpen}
                onClose={() => setPromptModal({ ...promptModal, isOpen: false })}
                title={promptModal.title}
                footer={
                    <div className="flex justify-end gap-3 w-full border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-2">
                        <button className="px-5 py-3 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95" onClick={() => setPromptModal({ ...promptModal, isOpen: false })}>Batal</button>
                        <button id="save-prompt-btn" className="px-6 py-3 rounded-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2" onClick={async () => {
                            const clean = promptModal.value.trim();
                            if (clean) {
                                try {
                                    if (promptModal.type === 'kategori') {
                                        await api.post('/settings/master', { type: 'kategori_bahan', value: clean });
                                        if (!kategoriOptions.includes(clean)) setKategoriOptions([...kategoriOptions, clean]);
                                        set('kategori', clean);
                                        toast('Kategori berhasil ditambahkan!');
                                    } else if (promptModal.type === 'satuan') {
                                        await api.post('/settings/master', { type: 'satuan_unit', value: clean });
                                        if (!satuanOptions.includes(clean)) setSatuanOptions([...satuanOptions, clean]);
                                        set('satuan', clean);
                                        toast('Satuan berhasil ditambahkan!');
                                    } else if (promptModal.type === 'supplier') {
                                        const res = await api.post('/suppliers', { name: clean });
                                        if (res.data?.data) {
                                            setSuppliers([res.data.data, ...suppliers]);
                                            set('supplier_id', res.data.data.id);
                                            toast('Pemasok berhasil ditambahkan!');
                                        }
                                    }
                                } catch (err) {
                                    toast(`Gagal menambahkan ${promptModal.type}`, 'error');
                                }
                            }
                            setPromptModal({ ...promptModal, isOpen: false });
                        }}>
                            <FiCheck size={18} /> Simpan Data
                        </button>
                    </div>
                }
            >
                <div className="p-5 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/60 mb-2 mt-2">
                    <div className="w-16 h-16 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white dark:ring-slate-800 relative z-10">
                        {promptModal.type === 'satuan' ? <FiTag size={28} /> : <FiLayers size={28} />}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-center mb-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                Nama {promptModal.type === 'satuan' ? 'Satuan' : promptModal.type === 'supplier' ? 'Pemasok/Supplier' : 'Kategori'}
                            </label>
                        </div>
                        <div className="relative group flex items-center">
                            <div className="absolute left-4 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                                {promptModal.type === 'satuan' ? <FiTag size={18} /> : promptModal.type === 'supplier' ? <FiTruck size={18} /> : <FiLayers size={18} />}
                            </div>
                            <input
                                type="text"
                                className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold dark:text-white transition-all text-center sm:text-left shadow-sm"
                                placeholder={`Ketik ${promptModal.type === 'satuan' ? 'satuan' : promptModal.type === 'supplier' ? 'nama pemasok' : 'kategori'} baru...`}
                                value={promptModal.value}
                                onChange={e => setPromptModal({ ...promptModal, value: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') { document.getElementById('save-prompt-btn')?.click(); } }}
                                autoFocus
                            />
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400 text-center mt-3 pt-2 flex items-center justify-center gap-1.5 opacity-80">
                            <FiAlertCircle size={12} /> Tekan <kbd className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-600 dark:text-slate-300">Enter</kbd> untuk menyimpan
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
