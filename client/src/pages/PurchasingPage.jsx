import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiPackage, FiPlus, FiTrash2, FiSave, FiSearch,
    FiCalendar, FiUser, FiFileText, FiArrowLeft, FiShoppingCart, FiCheckCircle,
    FiAlertCircle, FiCheck, FiX, FiList, FiClock, FiEye, FiTrash2 as FiTrashAlt
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../services/api';
import { formatRupiah } from '../utils';

function Toast({ msg, type, onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-[9999] px-6 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3 text-white backdrop-blur-xl border border-white/20 ${type === 'error' ? 'bg-rose-500/90 shadow-rose-500/20' : 'bg-emerald-500/90 shadow-emerald-500/20'}`}
        >
            {type === 'error' ? <FiAlertCircle size={20} /> : <FiCheck size={20} />}
            <span className="text-sm">{msg}</span>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                <FiX size={16} />
            </button>
        </motion.div>
    );
}

export default function PurchasingPage({ onNavigate }) {
    const [saving, setSaving] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState('entry'); // 'entry' | 'history'
    const [purchaseHistory, setPurchaseHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [viewDetail, setViewDetail] = useState(null);

    // Master Data
    const [products, setProducts] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // Form Data
    const [form, setForm] = useState({
        supplier_id: '',
        date: new Date().toISOString().split('T')[0],
        payment_status: 'lunas',
        notes: ''
    });

    const [items, setItems] = useState([]);

    // Search Drawer
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load Backend Products, Materials & Suppliers
                const [prodRes, matRes, supRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/materials'),
                    api.get('/suppliers').catch(() => ({ data: [] }))
                ]);
                setProducts(prodRes.data || []);
                setMaterials(matRes.data || []);

                // Fix: /suppliers endpoint wraps the array in a "data" property
                const suppliersData = supRes.data?.data || supRes.data;
                setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
            } catch (error) {
                const errMsg = error.response?.data?.message || error.message || 'Unknown error';
                console.error('[PurchasingPage] Error:', error, 'Response:', error.response);
                showToast(`Gagal memuat data master: ${errMsg}`, 'error');
                // Use Swal to force show the error if it's critical
                if (window.Swal) window.Swal.fire('Error', `Detail: ${errMsg}`, 'error');
            }
        };
        loadData();
    }, []);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await api.get('/purchases');
            setPurchaseHistory(res.data || []);
        } catch (err) {
            console.error('Error fetching purchase history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') fetchHistory();
    }, [activeTab]);

    const handleViewPurchase = async (id) => {
        try {
            const res = await api.get(`/purchases/${id}`);
            setViewDetail(res.data);
        } catch (err) {
            console.error('Error fetching purchase detail:', err);
        }
    };

    const handleDeletePurchase = (purchase) => {
        Swal.fire({
            title: 'Hapus Pembelian?',
            html: `<p class="text-sm">Invoice <strong>${purchase.invoice_no}</strong> akan dihapus dan stok akan dikembalikan.</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            customClass: {
                popup: 'dark:bg-slate-800 dark:text-white rounded-3xl',
                title: 'dark:text-white',
                confirmButton: 'bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-xl ml-3',
                cancelButton: 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl'
            },
            buttonsStyling: false
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/purchases/${purchase.id}`);
                    Swal.fire({ icon: 'success', title: 'Dihapus!', text: 'Pembelian berhasil dihapus dan stok dikembalikan.', timer: 2000, showConfirmButton: false });
                    fetchHistory();
                } catch (err) {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal menghapus pembelian', timer: 3000 });
                }
            }
        });
    };

    const showToast = (msg, type = 'success') => {
        setToastMsg({ msg, type });
        setTimeout(() => setToastMsg(null), 3000);
    };

    const combinedOptions = useMemo(() => {
        return [
            ...products.map(p => ({
                type: 'product',
                id: p.id,
                name: p.name || 'Produk Tanpa Nama',
                stock: p.stock || 0,
                unit: p.unit || 'pcs'
            })),
            ...materials.map(m => ({
                type: 'material',
                id: m.id,
                name: m.nama_bahan || 'Bahan Tanpa Nama',
                stock: m.stok_saat_ini || 0,
                unit: m.satuan || 'pcs'
            }))
        ].filter(item => (item.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()));
    }, [products, materials, searchQuery]);

    const handleAddItem = (option) => {
        setItems(prev => {
            const exists = prev.find(i => String(i.id) === String(option.id) && i.type === option.type);
            if (exists) {
                return prev.map(i =>
                    String(i.id) === String(option.id) && i.type === option.type
                        ? { ...i, qty: (Number(i.qty) || 0) + 1, subtotal: ((Number(i.qty) || 0) + 1) * (Number(i.cost) || 0) }
                        : i
                );
            }
            return [...prev, { ...option, qty: 1, cost: 0, subtotal: 0 }];
        });
        showToast(`Berhasil menambah: ${option.name}`, 'success');
        // We removed setShowSearch(false) to allow adding multiple items and avoid race conditions
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        if (field === 'qty' || field === 'cost') {
            newItems[index].subtotal = (Number(newItems[index].qty) || 0) * (Number(newItems[index].cost) || 0);
        }
        setItems(newItems);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    const handleSubmit = async () => {
        if (items.length === 0) return showToast('Belum ada barang yang ditambahkan', 'error');
        if (items.some(i => i.qty <= 0)) return showToast('Jumlah barang tidak valid', 'error');
        if (items.some(i => i.cost < 0)) return showToast('Harga beli tidak valid', 'error');

        setSaving(true);
        try {
            const supplierData = suppliers.find(s => s.id === form.supplier_id) || {};
            const payload = {
                ...form,
                supplier_name: supplierData.name || 'Umum',
                total_amount: totalAmount,
                items: items
            };

            await api.post('/purchases', payload);

            setShowSuccess(true);
            setItems([]);
            setForm({ ...form, notes: '' });
        } catch (error) {
            console.error(error);
            showToast('Terjadi kesalahan saat menyimpan pembelian', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="h-full bg-slate-50 dark:bg-[#0b0f1a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Ambient Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                    className="relative z-10 w-32 h-32 bg-white/80 dark:bg-emerald-500/10 backdrop-blur-xl text-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20 border-8 border-white/50 dark:border-emerald-500/20"
                >
                    <FiCheckCircle size={64} />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="relative z-10 text-4xl font-black text-slate-800 dark:text-white mb-3"
                >
                    Penerimaan Berhasil!
                </motion.h1>
                <motion.p
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    className="relative z-10 text-slate-500 dark:text-slate-400 text-center max-w-lg mb-12 leading-relaxed font-medium text-lg"
                >
                    Stok barang telah ditambahkan dan riwayat pembelian berhasil dicatat ke dalam sistem. Harga HPP juga telah diperbarui sesuai faktur.
                </motion.p>

                <motion.div
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    className="relative z-10 flex gap-4"
                >
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="px-8 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                    >
                        Ke Beranda
                    </button>
                    <button
                        onClick={() => { setShowSuccess(false); setActiveTab('history'); fetchHistory(); }}
                        className="px-8 py-4 bg-emerald-600/90 backdrop-blur-md text-white font-bold rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <FiList size={18} /> Lihat Riwayat
                    </button>
                    <button
                        onClick={() => setShowSuccess(false)}
                        className="px-8 py-4 bg-blue-600/90 backdrop-blur-md text-white font-bold rounded-2xl hover:bg-blue-600 shadow-xl shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <FiShoppingCart size={18} /> Catat Pembelian Baru
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-full bg-slate-50 dark:bg-[#0b0f1a] flex flex-col relative overflow-hidden">
            {/* Mesh Gradient Background */}
            <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-500/10 dark:from-blue-600/10 to-transparent pointer-events-none" />
            <div className="absolute top-20 -left-40 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-40 right-10 w-80 h-80 bg-emerald-400/10 dark:bg-emerald-600/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <header className="px-6 py-8 md:px-8 md:py-10 flex items-center justify-between shrink-0 relative z-10">
                <div className="flex items-start gap-5">
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-2xl transition-all shadow-sm group"
                    >
                        <FiArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3"
                        >
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
                                <FiPackage size={22} />
                            </div>
                            Barang Masuk
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                            className="text-sm md:text-base font-medium text-slate-500 dark:text-slate-400 mt-3"
                        >
                            Penerimaan tagihan supplier & re-stok inventori produk/bahan baku.
                        </motion.p>
                    </div>
                </div>
                {/* Tab Buttons */}
                <div className="flex gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                    <button onClick={() => setActiveTab('entry')} className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'entry' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                        <FiPlus size={14} /> Entry Baru
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                        <FiClock size={14} /> Riwayat
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-6 pb-8 md:px-8 custom-scrollbar relative z-10">
                {activeTab === 'history' ? (
                    /* ========== PURCHASE HISTORY TAB ========== */
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
                        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-white/60 dark:border-slate-800/50 overflow-hidden">
                            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <span className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg"><FiList size={16} /></span>
                                    Riwayat Pembelian
                                </h2>
                                <button onClick={fetchHistory} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-xl border border-slate-100 dark:border-slate-700 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <FiClock size={14} /> Refresh
                                </button>
                            </div>
                            {loadingHistory ? (
                                <div className="py-20 text-center text-slate-400">
                                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-xs font-bold uppercase tracking-widest">Memuat riwayat...</p>
                                </div>
                            ) : purchaseHistory.length === 0 ? (
                                <div className="py-20 text-center text-slate-400">
                                    <FiPackage size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Belum ada riwayat pembelian</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {purchaseHistory.map((p, i) => (
                                                <tr key={p.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{p.invoice_no}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold">{p.id}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">{p.supplier_name || 'Umum'}</td>
                                                    <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                        {p.date ? new Date(p.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-black text-slate-800 dark:text-white">
                                                        {formatRupiah(p.total_amount)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.payment_status === 'lunas' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                                                            {p.payment_status === 'lunas' ? 'Lunas' : 'Hutang'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button onClick={() => handleViewPurchase(p.id)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-xl transition-all" title="Lihat Detail">
                                                                <FiEye size={15} />
                                                            </button>
                                                            <button onClick={() => handleDeletePurchase(p)} className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-400 hover:text-rose-600 rounded-xl transition-all" title="Hapus">
                                                                <FiTrashAlt size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Total {purchaseHistory.length} transaksi pembelian
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* ========== ENTRY FORM TAB ========== */
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left Panel: Form Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="lg:col-span-4"
                        >
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-white/60 dark:border-slate-800/50 sticky top-0">
                                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-200/50 dark:border-slate-800 pb-5 mb-6 flex items-center gap-2">
                                    <span className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg"><FiFileText size={16} /></span>
                                    Informasi Pre-order
                                </h2>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Tanggal Terima *</label>
                                        <div className="relative group">
                                            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                type="date"
                                                value={form.date}
                                                onChange={e => setForm({ ...form, date: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Data Supplier / Vendor</label>
                                        <div className="relative group">
                                            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                            <select
                                                value={form.supplier_id}
                                                onChange={e => setForm({ ...form, supplier_id: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-slate-700 dark:text-slate-200 appearance-none cursor-pointer transition-all shadow-sm"
                                            >
                                                <option value="">Vendor Non-spesifik (Umum)</option>
                                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-5 border-t border-slate-200/50 dark:border-slate-800">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-1 block">Status Pelunasan</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className={`relative flex items-center justify-center gap-2 p-3.5 font-bold text-xs uppercase tracking-wider rounded-2xl cursor-pointer border-2 transition-all shadow-sm ${form.payment_status === 'lunas' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                <input type="radio" className="sr-only" name="payment_status" value="lunas" checked={form.payment_status === 'lunas'} onChange={() => setForm({ ...form, payment_status: 'lunas' })} />
                                                Tunai (Lunas)
                                            </label>
                                            <label className={`relative flex items-center justify-center gap-2 p-3.5 font-bold text-xs uppercase tracking-wider rounded-2xl cursor-pointer border-2 transition-all shadow-sm ${form.payment_status === 'hutang' ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                <input type="radio" className="sr-only" name="payment_status" value="hutang" checked={form.payment_status === 'hutang'} onChange={() => setForm({ ...form, payment_status: 'hutang' })} />
                                                Kredit (Hutang)
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-3">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Catatan Tagihan / Resi</label>
                                        <textarea
                                            value={form.notes}
                                            onChange={e => setForm({ ...form, notes: e.target.value })}
                                            rows="3"
                                            placeholder="Tulis keterangan surat jalan, nama driver, dll..."
                                            className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl py-3.5 px-5 outline-none font-medium text-slate-700 dark:text-slate-200 resize-none transition-all shadow-sm"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Panel: Items */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="lg:col-span-8 flex flex-col gap-6"
                        >
                            {/* Search Bar / Add Item */}
                            <div className="relative z-[60]">
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 p-2 rounded-xl text-slate-400 group-focus-within:text-blue-500 shadow-sm transition-colors border border-slate-100 dark:border-slate-700 pointer-events-none">
                                        <FiSearch size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Ketikan nama Produk Retail atau Bahan Cetak lalu klik tambah..."
                                        value={searchQuery}
                                        onFocus={() => setShowSearch(true)}
                                        onChange={e => {
                                            setSearchQuery(e.target.value);
                                            setShowSearch(true);
                                        }}
                                        className="w-full pl-16 pr-5 py-5 rounded-[2rem] bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-800/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 font-bold dark:text-white outline-none transition-all shadow-xl shadow-slate-200/50 dark:shadow-black/50 text-lg"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <FiX size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown Results */}
                                {showSearch && (
                                    <div
                                        className="fixed inset-0 z-[1]"
                                        onClick={() => setShowSearch(false)}
                                    />
                                )}
                                <AnimatePresence>
                                    {showSearch && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute z-50 w-full mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden"
                                        >
                                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2">
                                                {combinedOptions.length === 0 ? (
                                                    <div className="p-8 text-center flex flex-col items-center">
                                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-3"><FiSearch size={24} /></div>
                                                        <div className="text-slate-800 dark:text-white font-bold text-lg mb-1">Tidak Ditemukan</div>
                                                        <div className="text-sm text-slate-500 dark:text-slate-400">Pastikan barang tersebut sudah didaftarkan pada menu Data Master.</div>
                                                    </div>
                                                ) : (
                                                    combinedOptions.map(opt => (
                                                        <div
                                                            key={`${opt.type}-${opt.id}`}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault(); // Keep focus in search while adding
                                                                e.stopPropagation();
                                                                handleAddItem(opt);
                                                            }}
                                                            className="px-5 py-4 m-1 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer border border-transparent hover:border-blue-100 dark:hover:border-blue-800/50 flex justify-between items-center group transition-all"
                                                        >
                                                            <div>
                                                                <div className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-base">{opt.name}</div>
                                                                <div className="text-[11px] tracking-widest uppercase font-bold text-slate-500 mt-1.5 flex gap-2">
                                                                    <span className={`px-2 py-0.5 rounded-md ${opt.type === 'product' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                                                                        {opt.type === 'product' ? '📦 Retail' : '🔧 Bahan Cetak'}
                                                                    </span>
                                                                    <span className="flex items-center text-slate-400">&bull; Sisa Sistem: {opt.stock} {opt.unit}</span>
                                                                </div>
                                                            </div>
                                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-active:scale-95 transition-all outline outline-1 outline-slate-200 dark:outline-slate-700 group-hover:outline-blue-600">
                                                                <FiPlus size={20} />
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* List/Cart Container */}
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-white/60 dark:border-slate-800/50 flex-1 flex flex-col overflow-hidden relative z-10">

                                <div className="p-8 pb-5 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50">
                                    <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-lg"><FiShoppingCart size={16} /></div>
                                        Isi Keranjang Belanja
                                    </h2>
                                    <div className="text-xs font-black uppercase tracking-widest px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700">
                                        <span className="text-blue-600 dark:text-blue-400">{items.length}</span> SKU Ditambahkan
                                    </div>
                                </div>

                                <div className="flex-1 overflow-auto min-h-[350px]">
                                    {items.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-80">
                                            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner text-slate-300 dark:text-slate-600">
                                                <FiPackage size={40} />
                                            </div>
                                            <p className="font-bold px-6 text-center max-w-sm text-slate-500">Keranjang masih kosong. Mulai ketik nama barang pada kolom pencarian di atas untuk memasukkan stok ke gudang.</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse whitespace-nowrap">
                                            <thead className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/3">Detail Barang Masuk</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-28">Kuantitas</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-44">Modal Unit Baru (Rp)</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-40">Subtotal</th>
                                                    <th className="px-6 py-4 w-16"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                <AnimatePresence>
                                                    {items.map((item, idx) => (
                                                        <motion.tr
                                                            layout
                                                            key={`${item.type}-${item.id}`}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 20, gridTemplateRows: '0fr' }}
                                                            className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                                                        >
                                                            <td className="px-6 py-4">
                                                                <div className="font-extrabold text-slate-800 dark:text-white text-sm mb-1.5 whitespace-normal">
                                                                    {item.name}
                                                                </div>
                                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                                    <span className={`px-2 py-0.5 rounded ${item.type === 'product' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'}`}>
                                                                        {item.type === 'product' ? 'Retail' : 'Bahan Baku'}
                                                                    </span>
                                                                    <span>&bull;</span>
                                                                    <span>Stok Tercatat: {item.stock}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50">
                                                                    <input
                                                                        type="number"
                                                                        min="0.1"
                                                                        step="any"
                                                                        value={item.qty}
                                                                        onChange={e => updateItem(idx, 'qty', e.target.value)}
                                                                        className="w-16 px-2 py-2 text-center bg-transparent border-none outline-none font-black text-slate-800 dark:text-white"
                                                                    />
                                                                    <span className="text-xs font-bold text-slate-400 uppercase pr-3">{item.unit}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50">
                                                                    <span className="text-xs font-bold text-slate-400 pl-3">Rp</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={item.cost}
                                                                        onChange={e => updateItem(idx, 'cost', e.target.value)}
                                                                        className="w-full px-2 py-2 text-right bg-transparent border-none outline-none font-black text-slate-800 dark:text-white"
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="font-black text-lg text-slate-800 dark:text-white">
                                                                    {formatRupiah(item.subtotal)}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button
                                                                    onClick={() => removeItem(idx)}
                                                                    className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 transition-colors shadow-sm border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30"
                                                                    title="Hapus Item"
                                                                >
                                                                    <FiTrash2 size={18} />
                                                                </button>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </AnimatePresence>
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* Summary Footer attached to Table */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-6 z-10">
                                    <div className="text-center md:text-left">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                            Total Kuitansi Vendor
                                        </h3>
                                        <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
                                            {formatRupiah(totalAmount)}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-2">
                                            Pastikan HPP yang diinput sesuai faktur.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={saving || items.length === 0}
                                        className="w-full md:w-auto px-10 py-4 lg:py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[1.25rem] shadow-xl shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-blue-500/40 text-sm tracking-wide uppercase"
                                    >
                                        {saving ? (
                                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : <FiSave size={22} />}
                                        Simpan Entri Pembelian
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    </div>
                )}
            </main>


            {/* Detail Modal */}
            <AnimatePresence>
                {viewDetail && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setViewDetail(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white">{viewDetail.invoice_no}</h3>
                                    <p className="text-xs text-slate-400 font-bold mt-0.5">{viewDetail.id}</p>
                                </div>
                                <button onClick={() => setViewDetail(null)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                    <FiX size={18} />
                                </button>
                            </div>
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Supplier</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{viewDetail.supplier_name || 'Umum'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{viewDetail.date ? new Date(viewDetail.date).toLocaleDateString('id-ID') : '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                                        <p className="text-sm font-black text-blue-600">{formatRupiah(viewDetail.total_amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${viewDetail.payment_status === 'lunas' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                                            {viewDetail.payment_status === 'lunas' ? 'Lunas' : 'Hutang'}
                                        </span>
                                    </div>
                                </div>

                                {viewDetail.notes && (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Catatan</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">{viewDetail.notes}</p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Detail Item ({viewDetail.items?.length || 0})</p>
                                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama</th>
                                                    <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe</th>
                                                    <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                                                    <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga</th>
                                                    <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {(viewDetail.items || []).map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">{item.item_name}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.item_type === 'product' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'}`}>
                                                                {item.item_type === 'product' ? 'Produk' : 'Bahan'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-300">{item.qty}</td>
                                                        <td className="px-4 py-3 text-right text-xs font-medium text-slate-500">{formatRupiah(item.unit_cost)}</td>
                                                        <td className="px-4 py-3 text-right text-xs font-black text-slate-800 dark:text-white">{formatRupiah(item.subtotal)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toastMsg && <Toast {...toastMsg} onClose={() => setToastMsg(null)} />}
            </AnimatePresence>
        </div>
    );
}
