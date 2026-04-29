import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiPackage, FiPlus, FiTrash2, FiSave, FiSearch,
    FiCalendar, FiUser, FiFileText, FiArrowLeft, FiShoppingCart, FiCheckCircle,
    FiAlertCircle, FiCheck, FiX, FiList, FiClock, FiEye, FiTrash2 as FiTrashAlt,
    FiAlertTriangle, FiDollarSign, FiRefreshCw, FiTruck,
    FiChevronRight, FiActivity, FiArrowUpRight, FiTarget,
    FiZap, FiPieChart, FiTrendingUp
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../services/api';
import { formatRupiah } from '../utils';

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
            className={`fixed bottom-6 right-6 z-[9999] px-6 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3 text-white backdrop-blur-xl border border-white/20 ${type === 'error' ? 'bg-rose-500/90 shadow-rose-500/20' : 'bg-emerald-500/90 shadow-emerald-500/20'}`}
        >
            {type === 'error' ? <FiAlertCircle size={20} /> : <FiCheck size={20} />}
            <span className="text-sm flex-1">{msg}</span>
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
    const [showLowStock, setShowLowStock] = useState(false);

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
                minStock: p.minStock || 0,
                unit: p.unit || 'pcs'
            })),
            ...materials.map(m => ({
                type: 'material',
                id: m.id,
                name: m.nama_bahan || 'Bahan Tanpa Nama',
                stock: m.stok_saat_ini || 0,
                minStock: m.stok_minimum || 0,
                unit: m.satuan || 'pcs'
            }))
        ].filter(item => (item.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()));
    }, [products, materials, searchQuery]);

    const lowStockItems = useMemo(() => {
        return [
            ...products.map(p => ({
                type: 'product',
                id: p.id,
                name: p.name || 'Produk Tanpa Nama',
                stock: p.stock || 0,
                minStock: p.minStock || 0,
                unit: p.unit || 'pcs'
            })),
            ...materials.map(m => ({
                type: 'material',
                id: m.id,
                name: m.nama_bahan || 'Bahan Tanpa Nama',
                stock: m.stok_saat_ini || 0,
                minStock: m.stok_minimum || 0,
                unit: m.satuan || 'pcs'
            }))
        ].filter(item => item.minStock > 0 && item.stock <= item.minStock);
    }, [products, materials]);

    const handleAddLowStock = () => {
        if (lowStockItems.length === 0) return showToast('Tidak ada barang dengan stok rendah', 'warn');
        
        setItems(prev => {
            const newItems = [...prev];
            lowStockItems.forEach(lowItem => {
                const exists = newItems.find(i => String(i.id) === String(lowItem.id) && i.type === lowItem.type);
                if (!exists) {
                    // Suggested restock qty: (minStock * 2) - currentStock or at least 1
                    const suggestedQty = Math.max(1, (lowItem.minStock * 2) - lowItem.stock);
                    newItems.push({ ...lowItem, qty: suggestedQty, cost: 0, subtotal: 0 });
                }
            });
            return newItems;
        });
        showToast(`${lowStockItems.length} barang stok rendah dimasukkan ke keranjang`, 'success');
    };

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
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0b0f1a] relative overflow-hidden font-inter">
            {/* Mesh Gradient Background */}
            <div className="mesh-bg" />

            {/* Floating Low Stock Alert */}
            <AnimatePresence>
                {lowStockItems.length > 0 && activeTab === 'entry' && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-full shadow-2xl shadow-rose-500/20 border border-rose-500/20"
                    >
                        <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-500/30 animate-pulse">
                            <FiAlertTriangle size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none mb-1">Peringatan Stok</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">
                                Ada <span className="text-rose-600 dark:text-rose-400">{lowStockItems.length} item</span> stok rendah Pak!
                            </p>
                        </div>
                        <button
                            onClick={() => setShowLowStock(true)}
                            className="ml-4 px-4 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 rounded-full text-xs font-black transition-all"
                        >
                            DETAIL
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Header & Stats */}
            <header className="px-10 pt-16 pb-12 shrink-0 relative z-20">
                <div className="max-w-7xl mx-auto space-y-12">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="flex items-start gap-8">
                            <button
                                onClick={() => onNavigate('dashboard')}
                                className="mt-2 w-14 h-14 bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border border-white dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-slate-200/50 dark:shadow-none hover:scale-105 active:scale-95 group"
                            >
                                <FiArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div className="space-y-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    className="w-16 h-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/30"
                                >
                                    <FiPackage size={28} />
                                </motion.div>
                                <div>
                                    <motion.h1
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                        className="text-5xl md:text-6xl font-black tracking-tighter text-slate-800 dark:text-white font-premium leading-none"
                                    >
                                        Logistik <span className="text-gradient">Barang Masuk</span>
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                                        className="text-slate-500 dark:text-slate-400 mt-4 font-bold max-w-xl leading-relaxed text-lg flex items-center gap-2"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Update stok gudang & HPP inventori
                                    </motion.p>
                                </div>
                            </div>
                        </div>

                        {/* Modern Tabs Pro Max */}
                        <div className="flex bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-2 rounded-[2rem] border border-white/60 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none">
                            <button
                                onClick={() => setActiveTab('entry')}
                                className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all ${
                                    activeTab === 'entry'
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 scale-[1.02]'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800'
                                }`}
                            >
                                <FiPlus size={18} /> <span>Entry Baru</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all ${
                                    activeTab === 'history'
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 scale-[1.02]'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800'
                                }`}
                            >
                                <FiClock size={18} /> <span>Riwayat</span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Action & Alerts */}
                    <div className="flex flex-wrap items-center gap-4 border-t border-slate-200/50 dark:border-slate-800 pt-8">
                        <button onClick={() => setShowLowStock(true)} className="group px-6 py-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-rose-100 dark:border-rose-900/30 hover:border-rose-500 transition-all flex items-center gap-4 shadow-xl shadow-rose-500/5">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-inner">
                                <FiAlertTriangle size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none mb-1">Stok Kritis</p>
                                <p className="text-sm font-black text-slate-800 dark:text-white leading-none">{lowStockItems.length} Item Perlu Restock</p>
                            </div>
                        </button>
                        {lowStockItems.length > 0 && (
                            <button onClick={handleAddLowStock} className="px-6 py-4 rounded-2xl bg-rose-600 text-white font-black hover:bg-rose-700 transition-all shadow-xl shadow-rose-500/20 active:scale-95 flex items-center gap-2 uppercase tracking-widest text-xs">
                                <FiPlus /> Restock Semua
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 px-10 pb-16 overflow-hidden relative z-10">
                <AnimatePresence mode="wait">
                    {activeTab === 'entry' ? (
                        <motion.div
                            key="entry"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="h-full grid grid-cols-1 xl:grid-cols-12 gap-8 overflow-hidden"
                        >
                            {/* Left Panel: Form & Search */}
                            <div className="xl:col-span-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                                <div className="premium-card p-8 rounded-[2.5rem]">
                                    <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-200/50 dark:border-slate-800 pb-5 mb-6 flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg"><FiFileText size={16} /></div>
                                        Informasi Kuitansi
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
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Supplier / Vendor</label>
                                            <div className="relative group">
                                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                                <select
                                                    value={form.supplier_id}
                                                    onChange={e => setForm({ ...form, supplier_id: e.target.value })}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-slate-700 dark:text-slate-200 appearance-none cursor-pointer transition-all shadow-sm"
                                                >
                                                    <option value="">Vendor Non-spesifik (Umum)</option>
                                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-5 border-t border-slate-200/50 dark:border-slate-800">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-1 block">Status Pelunasan</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => setForm({ ...form, payment_status: 'lunas' })}
                                                    className={`flex items-center justify-center gap-2 p-3.5 font-bold text-xs uppercase tracking-wider rounded-2xl border-2 transition-all shadow-sm ${form.payment_status === 'lunas' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    Tunai (Lunas)
                                                </button>
                                                <button
                                                    onClick={() => setForm({ ...form, payment_status: 'hutang' })}
                                                    className={`flex items-center justify-center gap-2 p-3.5 font-bold text-xs uppercase tracking-wider rounded-2xl border-2 transition-all shadow-sm ${form.payment_status === 'hutang' ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    Kredit (Hutang)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="premium-card p-8 rounded-[2.5rem] flex-1">
                                    <div className="relative group mb-6">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 p-2 rounded-xl text-slate-400 group-focus-within:text-blue-500 shadow-sm transition-colors border border-slate-100 dark:border-slate-700 pointer-events-none">
                                            <FiSearch size={20} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Cari Produk atau Bahan..."
                                            value={searchQuery}
                                            onChange={e => {
                                                setSearchQuery(e.target.value);
                                                setShowSearch(true);
                                            }}
                                            className="w-full pl-16 pr-5 py-5 rounded-[2rem] bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-800/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 font-bold dark:text-white outline-none transition-all shadow-xl shadow-slate-200/50 dark:shadow-black/50"
                                        />
                                    </div>

                                    <div className="space-y-2 overflow-y-auto custom-scrollbar max-h-[40vh]">
                                        {combinedOptions.map(opt => (
                                            <button
                                                key={`${opt.type}-${opt.id}`}
                                                onClick={() => handleAddItem(opt)}
                                                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all text-left group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                                        <FiPackage size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white leading-none">{opt.name}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex gap-2">
                                                            <span className={opt.type === 'product' ? 'text-indigo-500' : 'text-emerald-500'}>{opt.type === 'product' ? 'RETAIL' : 'BAHAN'}</span>
                                                            <span>•</span>
                                                            <span>STOK: {opt.stock} {opt.unit}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <FiPlus className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel: Cart */}
                            <div className="xl:col-span-8 flex flex-col overflow-hidden">
                                <div className="premium-card rounded-[2.5rem] flex-1 flex flex-col overflow-hidden">
                                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                                        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3 font-premium">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-lg"><FiShoppingCart size={16} /></div>
                                            Keranjang Barang Masuk
                                        </h2>
                                        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {items.length} SKU DITAMBAHKAN
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-auto custom-scrollbar p-8">
                                        {items.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                                <FiPackage size={80} className="text-slate-300 dark:text-slate-700 mb-6" />
                                                <h4 className="text-2xl font-black text-slate-800 dark:text-white font-premium">Draft Kosong</h4>
                                                <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs mt-2">Pilih barang di panel kiri untuk memasukkan data stok gudang.</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                        <th className="pb-6">Detail Produk</th>
                                                        <th className="pb-6 text-center w-32">Kuantitas</th>
                                                        <th className="pb-6 text-right w-48">Harga Modal Baru</th>
                                                        <th className="pb-6 text-right w-40">Subtotal</th>
                                                        <th className="pb-6 w-16"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                                    {items.map((item, idx) => (
                                                        <motion.tr
                                                            key={`${item.type}-${item.id}`}
                                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                            className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                                        >
                                                            <td className="py-6 pr-4">
                                                                <p className="font-black text-slate-800 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">{item.name}</p>
                                                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">Sisa: {item.stock}</span>
                                                            </td>
                                                            <td className="py-6 px-4">
                                                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700 focus-within:border-blue-500 transition-all">
                                                                    <input
                                                                        type="number"
                                                                        className="w-12 text-center bg-transparent border-none outline-none font-black text-slate-800 dark:text-white"
                                                                        value={item.qty}
                                                                        onChange={e => updateItem(idx, 'qty', e.target.value)}
                                                                    />
                                                                    <span className="text-[10px] font-black text-slate-400">{item.unit}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-6 px-4">
                                                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2 border border-slate-100 dark:border-slate-700 focus-within:border-emerald-500 transition-all">
                                                                    <span className="text-[10px] font-black text-slate-400">Rp</span>
                                                                    <input
                                                                        type="number"
                                                                        className="w-full text-right bg-transparent border-none outline-none font-black text-slate-800 dark:text-white"
                                                                        value={item.cost}
                                                                        onChange={e => updateItem(idx, 'cost', e.target.value)}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="py-6 pl-4 text-right">
                                                                <p className="text-sm font-black text-slate-800 dark:text-white">{formatRupiah(item.subtotal)}</p>
                                                            </td>
                                                            <td className="py-6 text-right">
                                                                <button onClick={() => removeItem(idx)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors">
                                                                    <FiX size={20} />
                                                                </button>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>

                                    <div className="p-10 bg-slate-50/80 dark:bg-slate-800/40 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-blue-500/10 text-blue-600 rounded-[1.5rem] hidden sm:flex">
                                                <FiDollarSign size={32} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Belanja Faktur</p>
                                                <p className="text-4xl font-black text-slate-800 dark:text-white font-premium">
                                                    {formatRupiah(totalAmount)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={saving || items.length === 0}
                                            className="w-full md:w-auto px-12 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-2xl shadow-blue-500/40 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3 uppercase tracking-wider text-sm"
                                        >
                                            {saving ? 'MEMPROSES...' : <><FiSave size={22} /> SIMPAN ENTRI</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="h-full premium-card rounded-[2.5rem] flex flex-col overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6 bg-white/50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-2xl">
                                        <FiClock />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white font-premium leading-none">History Barang Masuk</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Laporan harian logistik gudang</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <button onClick={fetchHistory} className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all">
                                        <FiRefreshCw size={20} className={loadingHistory ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto custom-scrollbar p-8">
                                {loadingHistory ? (
                                    <div className="h-full flex flex-col items-center justify-center">
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-16 h-16 border-[6px] border-blue-500/20 border-t-blue-600 rounded-full mb-4 shadow-lg shadow-blue-500/10" />
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Menarik Riwayat...</p>
                                    </div>
                                ) : purchaseHistory.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                        <FiClock size={80} className="text-slate-300 dark:text-slate-700 mb-6" />
                                        <h4 className="text-2xl font-black text-slate-800 dark:text-white font-premium">Belum Ada Transaksi</h4>
                                        <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs mt-2">Data pengadaan stok belum tercatat dalam database riwayat.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {purchaseHistory.map((h, idx) => (
                                            <motion.div
                                                key={h.id}
                                                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                                className="bg-white/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] hover:bg-white dark:hover:bg-slate-800/40 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all group relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                    <div className="flex items-start gap-5">
                                                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-[1.25rem] flex items-center justify-center text-3xl font-black font-premium shadow-inner border border-white dark:border-slate-800">
                                                            {h.supplier_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h4 className="text-xl font-black text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors uppercase font-premium leading-none">{h.supplier_name || 'Vendor Umum'}</h4>
                                                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${h.payment_status === 'lunas' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'}`}>
                                                                    {h.payment_status}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                <FiCalendar className="text-blue-500" /> {new Date(h.date).toLocaleString('id-ID', { dateStyle: 'long' })}
                                                                <span className="text-slate-300">•</span>
                                                                {h.invoice_no}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col lg:items-end">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Tagihan</p>
                                                        <p className="text-3xl font-black text-slate-800 dark:text-white font-premium">{formatRupiah(h.total_amount)}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-8 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                                    <button onClick={() => handleViewPurchase(h.id)} className="px-5 py-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all">
                                                        <FiEye /> DETAIL FAKTUR
                                                    </button>
                                                    <button onClick={() => handleDeletePurchase(h)} className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Low Stock Side Panel */}
            <AnimatePresence>
                {showLowStock && (
                    <div className="fixed inset-0 z-[1000] flex justify-end">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowLowStock(false)} />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-600 text-white">
                                <div className="flex items-center gap-4">
                                    <FiAlertTriangle size={32} />
                                    <div>
                                        <h3 className="text-2xl font-black font-premium leading-none uppercase tracking-tight">Limit Stok Kritis</h3>
                                        <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest mt-1.5">Segera hubungi supplier Pak!</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowLowStock(false)} className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                                    <FiX size={24} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                                {lowStockItems.map(item => (
                                    <div key={`${item.type}-${item.id}`} className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 group hover:border-rose-500/30 transition-all">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm font-black text-xl border border-slate-100 dark:border-slate-700">
                                            {item.stock}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black text-slate-800 dark:text-white leading-tight mb-2 uppercase tracking-tight">{item.name}</h4>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sisa: {item.stock} {item.unit}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Min: {item.minStock}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => { handleAddItem(item); setShowLowStock(false); }} className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all group-active:scale-95">
                                            <FiPlus size={24} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                                <div className="p-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Detail Item</p>
                                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama</th>
                                                    <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                                                    <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga</th>
                                                    <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {(viewDetail.items || []).map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">{item.item_name}</td>
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
