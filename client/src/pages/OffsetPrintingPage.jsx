import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import {
    FiPrinter,
    FiClock,
    FiPlay,
    FiPause,
    FiRefreshCw,
    FiLayers,
    FiUsers,
    FiEye,
    FiSearch,
    FiChevronLeft,
    FiChevronRight,
    FiFileText,
    FiPlusCircle,
    FiPaperclip,
    FiTag,
    FiCalendar,
    FiPackage,
    FiTrash2
} from 'react-icons/fi';
import Swal from 'sweetalert2';

const fmt = (n) => 'Rp ' + Math.floor(n || 0).toLocaleString('id-ID');

export default function OffsetPrintingPage({ onNavigate }) {
    // Backend Data States
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form/Kalkulator States
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('A4');
    const [selectedMaterial, setSelectedMaterial] = useState('HVS 80gr');

    // Pagination
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    // UI Styles helpers
    const SIZES = ['A4', 'A5', 'A6', 'Custom'];
    const MATERIALS = ['HVS 80gr', 'Art Paper 150gr', 'Art Carton 260gr', 'NCR Paper'];

    // Result States
    const [subtotal, setSubtotal] = useState(0);
    const [tax, setTax] = useState(0);
    const [total, setTotal] = useState(0);

    const fetchOffsetData = useCallback(async () => {
        setLoading(true);
        try {
            const [formRes, spkRes, settingsRes] = await Promise.all([
                api.get('/offset-orders/form-data'),
                api.get('/spk'),
                api.get('/settings/public')
            ]);
            setProducts(formRes.data.products || []);
            setCustomers(formRes.data.customers || []);

            const sMap = {};
            settingsRes.data.forEach(s => { sMap[s.key] = s.value; });
            if (sMap.tarif_desain_per_jam) {
                setHourlyRate(parseInt(sMap.tarif_desain_per_jam));
            }

            // Filter SPK yang memiliki prefix "Offset -" di product_name
            const offsetSPKs = (spkRes.data.data || []).filter(s =>
                s.product_name && s.product_name.startsWith('Offset -') &&
                s.status !== 'Batal' && s.status !== 'batal' && s.status !== 'Diambil'
            );
            setActiveOrders(offsetSPKs);

            if (formRes.data.products?.length > 0 && !selectedProduct) {
                setSelectedProduct(formRes.data.products[0]);
            }
        } catch (err) {
            console.error('Error fetching offset data:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedProduct]);

    useEffect(() => {
        fetchOffsetData();
    }, []);

    // Timer States
    const [designSeconds, setDesignSeconds] = useState(0);
    const [designRunning, setDesignRunning] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (designRunning) {
            intervalRef.current = setInterval(() => setDesignSeconds(s => s + 1), 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [designRunning]);

    const formatTime = (s) => {
        const h = Math.floor(s / 3600).toString().padStart(2, '0');
        const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
        const sc = (s % 60).toString().padStart(2, '0');
        return `${h}:${m}:${sc}`;
    };

    const biayaDesain = Math.round((designSeconds / 3600) * hourlyRate);

    // Calculate Price using backend product data
    useEffect(() => {
        if (!selectedProduct) return;

        const basePrice = selectedProduct.harga_base || 0;

        // Multipliers (Simulasi logika bisnis offset)
        const sizeMulti = selectedSize === 'A4' ? 1 : selectedSize === 'A5' ? 0.6 : 0.4;
        const matMulti = selectedMaterial.includes('Art') ? 1.5 : 1;

        const calculatedSubtotal = basePrice * quantity * sizeMulti * matMulti;
        const calculatedTax = calculatedSubtotal * 0.11; // 11% PPN

        setSubtotal(calculatedSubtotal);
        setTax(calculatedTax);
        setTotal(calculatedSubtotal + calculatedTax);
    }, [selectedProduct, quantity, selectedSize, selectedMaterial]);

    // Handle Pesanan Baru (Simpan ke DB lalu navigasi)
    const handleBuatPesanan = async () => {
        if (!selectedProduct) { Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Pilih produk terlebih dahulu.', timer: 3000 }); return; }

        try {
            const customerObj = selectedCustomer ? customers.find(c => c.id === selectedCustomer) : null;

            const payload = {
                customer_id: selectedCustomer,
                customer_name: customerObj ? customerObj.name : 'Pelanggan Umum',
                product_name: `Offset - ${selectedProduct.nama_produk}`,
                product_qty: quantity,
                product_unit: selectedProduct.satuan || 'pcs',
                specs_material: selectedMaterial,
                specs_finishing: '-',
                specs_notes: `Ukuran: ${selectedSize}`,
                biaya_cetak: total,
                biaya_desain: biayaDesain,
                priority: 'Normal',
                dp_amount: 0,
                deadline: null
            };

            const res = await api.post('/spk', payload);

            if (res.data && res.data.id) {
                setDesignSeconds(0);
                setDesignRunning(false);
                onNavigate('spk-detail', { spkId: res.data.id });
                fetchOffsetData(); // Refresh list
            }
        } catch (err) {
            console.error('Error create SPK:', err);
            const errMsg = err.response?.data?.message || err.message || 'Silakan coba lagi.';
            Swal.fire({ icon: 'error', title: 'Oops...', text: 'Gagal membuat pesanan SPK: ' + errMsg, timer: 3000 });
        }
    };

    const handleDeleteOrder = async (id) => {
        Swal.fire({
            title: 'Batalkan Pesanan?',
            text: 'Pesanan cetak offset ini akan dibatalkan dan dihapus dari daftar.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Batalkan',
            cancelButtonText: 'Kembali',
            customClass: {
                confirmButton: 'bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-xl ml-3',
                cancelButton: 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl',
                popup: 'dark:bg-slate-800 dark:text-white rounded-3xl',
                title: 'dark:text-white'
            },
            buttonsStyling: false
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/spk/${id}`);
                    Swal.fire({ icon: 'success', title: 'Dibatalkan', text: 'Pesanan berhasil dibatalkan', timer: 2000, showConfirmButton: false });
                    fetchOffsetData();
                } catch (err) {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal membatalkan pesanan', timer: 2000, showConfirmButton: false });
                }
            }
        });
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 font-display bg-slate-50/30 dark:bg-transparent min-h-screen">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100 dark:shadow-none"><FiPrinter /></span>
                        Manajemen Cetak Offset
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-1 italic opacity-75">Large Format Production & SPK Pipeline Manager</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                    {/* Timer UI */}
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm w-full sm:w-auto group">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl transition-all duration-500 ${designRunning ? 'bg-orange-500 text-white animate-pulse' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600'}`}>
                                <FiClock size={20} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Durasi Desain</p>
                                <p className="text-xl font-mono font-black text-slate-900 dark:text-white tracking-tighter">{formatTime(designSeconds)}</p>
                            </div>
                        </div>
                        <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 mx-2"></div>
                        <div className="flex-1 min-w-[120px]">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Estimasi Biaya</p>
                            <p className="text-lg font-black text-orange-600 tracking-tighter italic">{fmt(biayaDesain)}</p>
                        </div>

                        <div className="flex gap-1.5 ml-2">
                            {designRunning ? (
                                <button onClick={() => setDesignRunning(false)} className="size-10 bg-slate-900 dark:bg-slate-800 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all shadow-md active:scale-95">
                                    <FiPause />
                                </button>
                            ) : (
                                <button onClick={() => setDesignRunning(true)} className="size-10 bg-orange-600 text-white rounded-xl flex items-center justify-center hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 dark:shadow-none active:scale-95">
                                    <FiPlay />
                                </button>
                            )}
                            {designSeconds > 0 && !designRunning && (
                                <button onClick={() => { setDesignSeconds(0); setDesignRunning(false); }} className="size-10 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center hover:text-rose-600 transition-all active:scale-95">
                                    <FiRefreshCw />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-8">
                    {/* Catalog Section */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg"><FiLayers /></span>
                                Katalog Produk Offset
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {products.length === 0 ? (
                                <div className="col-span-full py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
                                    <FiPackage size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-xs font-black uppercase tracking-widest">Belum ada produk offset</p>
                                </div>
                            ) : products.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedProduct(p)}
                                    className={`relative group bg-white dark:bg-slate-900 border rounded-3xl p-6 transition-all duration-300 cursor-pointer overflow-hidden ${selectedProduct?.id === p.id ? 'border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'}`}
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-12 -mt-12 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className={`size-14 rounded-2xl flex items-center justify-center mb-5 transition-all transform group-hover:scale-110 shadow-sm ${p.is_best_seller ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-500' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'}`}>
                                        <span className="material-symbols-outlined text-2xl!">
                                            {p.nama_produk.toLowerCase().includes('nota') ? 'receipt_long' : p.nama_produk.toLowerCase().includes('kalender') ? 'calendar_month' : 'menu_book'}
                                        </span>
                                    </div>
                                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm mb-1">{p.nama_produk}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic opacity-75">Premium Printing Solution</p>

                                    <div className="mt-8 pt-4 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mulai Dari</span>
                                        <span className="text-sm font-black text-indigo-600 italic tracking-tighter">{fmt(p.harga_base)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Active Orders Section */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg"><FiFileText /></span>
                                Pesanan Offset Berjalan
                            </h2>
                            <button
                                onClick={fetchOffsetData}
                                className="group p-2.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-100 dark:border-slate-700 transition-all shadow-sm"
                            >
                                <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500" />
                            </button>
                        </div>
                        <div className="overflow-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-left">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order & SPK</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kuantitas</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {loading ? (
                                        <tr><td colSpan="5" className="py-20 text-center"><span className="animate-spin inline-block text-indigo-600"><FiRefreshCw size={24} /></span></td></tr>
                                    ) : activeOrders.length === 0 ? (
                                        <tr><td colSpan="5" className="py-20 text-center text-slate-400 text-xs font-black uppercase tracking-widest">Belum ada pesanan aktif</td></tr>
                                    ) : activeOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((o, i) => (
                                        <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{o.product_name}</p>
                                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest opacity-75">{o.spk_number}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase italic">
                                                {o.customer_name}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-black text-slate-900 dark:text-white">
                                                {o.product_qty} <span className="text-[10px] font-bold text-slate-400 italic">/{o.product_unit}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${o.status === 'Selesai' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                                    o.status === 'Produksi' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                    }`}>
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => onNavigate('spk-detail', { spkId: o.id })}
                                                        className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all shadow-sm group-hover:shadow"
                                                        title="Lihat Detail SPK"
                                                    >
                                                        <FiEye />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteOrder(o.id)}
                                                        className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl transition-all shadow-sm group-hover:shadow"
                                                        title="Batalkan Pesanan"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {activeOrders.length > itemsPerPage && (
                            <div className="p-6 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Displaying {Math.min(activeOrders.length, (page - 1) * itemsPerPage + 1)}-{Math.min(activeOrders.length, page * itemsPerPage)} of {activeOrders.length}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
                                    >
                                        <FiChevronLeft size={18} />
                                    </button>
                                    <span className="text-xs font-black px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl min-w-[70px] text-center shadow-sm">
                                        {page} / {Math.ceil(activeOrders.length / itemsPerPage)}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(Math.ceil(activeOrders.length / itemsPerPage), p + 1))}
                                        disabled={page === Math.ceil(activeOrders.length / itemsPerPage)}
                                        className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
                                    >
                                        <FiChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    {/* Calculator Section */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="p-2 bg-primary/10 text-primary rounded-lg flex items-center justify-center"><span className="material-symbols-outlined text-lg">calculate</span></span>
                                Estimasi Biaya
                            </h2>
                        </div>

                        <form className="space-y-6 relative z-10" onSubmit={e => e.preventDefault()}>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pelanggan</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <FiUsers size={14} />
                                    </div>
                                    <select
                                        value={selectedCustomer || ''}
                                        onChange={(e) => setSelectedCustomer(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Pelanggan Umum</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Produk Terpilih</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <FiTag size={14} />
                                    </div>
                                    <select
                                        value={selectedProduct?.id || ''}
                                        onChange={(e) => {
                                            const p = products.find(p => p.id === parseInt(e.target.value));
                                            setSelectedProduct(p);
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                    >
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.nama_produk}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kuantitas</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm font-black focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ukuran</label>
                                    <select
                                        value={selectedSize}
                                        onChange={(e) => setSelectedSize(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                    >
                                        {SIZES.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Material Kertas</label>
                                <select
                                    value={selectedMaterial}
                                    onChange={(e) => setSelectedMaterial(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                >
                                    {MATERIALS.map(m => <option key={m}>{m}</option>)}
                                </select>
                            </div>

                            <div className="pt-6 border-t border-slate-50 dark:border-slate-800 space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                    <span>Subtotal Produksi</span>
                                    <span className="dark:text-white uppercase tracking-tighter">{fmt(subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                    <span>Pajak (PPN 11%)</span>
                                    <span className="dark:text-white uppercase tracking-tighter">{fmt(tax)}</span>
                                </div>

                                <div className="mt-6 p-6 bg-slate-900 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-none relative overflow-hidden group/total">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 relative z-10">Grand Total Estimasi</p>
                                    <div className="flex justify-between items-end relative z-10">
                                        <h4 className="text-2xl font-black text-primary italic tracking-tighter">
                                            {fmt(total + biayaDesain)}
                                        </h4>
                                        <div className="p-2 bg-primary/20 text-primary rounded-xl">
                                            <FiPlusCircle size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleBuatPesanan}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] mt-4"
                            >
                                <span className="material-symbols-outlined text-xl!">add_task</span>
                                Terbitkan SPK Baru
                            </button>
                        </form>
                    </section>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 py-10 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="size-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                            <FiPrinter size={12} />
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">PrintManager PRO</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic leading-relaxed">Enterprise Printing Workflow System — © 2024</p>
                </div>
                <div className="flex gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <a className="hover:text-indigo-600 transition-colors" href="#">System Status</a>
                    <a className="hover:text-indigo-600 transition-colors" href="#">Documentation</a>
                    <a className="hover:text-indigo-600 transition-colors" href="#">Internal Audit</a>
                </div>
            </footer>
        </div>
    );
}
