import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

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

    // UI Styles helpers
    const SIZES = ['A4', 'A5', 'A6', 'Custom'];
    const MATERIALS = ['HVS 80gr', 'Art Paper 150gr', 'Art Carton 260gr', 'NCR Paper'];

    // Kalkulator States
    // Result States
    const [subtotal, setSubtotal] = useState(0);
    const [tax, setTax] = useState(0);
    const [total, setTotal] = useState(0);

    const fetchOffsetData = useCallback(async () => {
        setLoading(true);
        try {
            const [formRes, spkRes] = await Promise.all([
                api.get('/offset-orders/form-data'),
                api.get('/spk')
            ]);
            setProducts(formRes.data.products || []);
            setCustomers(formRes.data.customers || []);

            // Filter SPK yang memiliki prefix "Offset -" di product_name
            const offsetSPKs = (spkRes.data.data || []).filter(s =>
                s.product_name && s.product_name.startsWith('Offset -')
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
    const tarifDesainPerJam = 50000;

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

    const biayaDesain = Math.round((designSeconds / 3600) * tarifDesainPerJam);

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
        if (!selectedProduct) return alert('Pilih produk terlebih dahulu.');

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
                // Success: reset timer and navigate
                setDesignSeconds(0);
                setDesignRunning(false);
                onNavigate('spk-detail', { spkId: res.data.id });
                fetchOffsetData(); // Refresh list
            }
        } catch (err) {
            console.error('Error create SPK:', err);
            const errMsg = err.response?.data?.message || err.message || 'Silakan coba lagi.';
            alert('Gagal membuat pesanan SPK: ' + errMsg);
        }
    };

    return (
        <div className="p-8">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Manajemen Cetak Offset</h1>
                    <p className="text-slate-500 mt-1 text-sm">Kalkulasi biaya produksi dan pengelolaan pesanan offset skala besar.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-6 shadow-sm min-w-[320px]">
                    <div className="flex items-center gap-3">
                        <div className={`size-10 ${designRunning ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'} rounded-full flex items-center justify-center transition-colors`}>
                            <span className="material-symbols-outlined">timer</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu Desain</p>
                            <p className="text-xl font-mono font-bold text-slate-800 dark:text-slate-100">{formatTime(designSeconds)}</p>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-slate-100 dark:bg-slate-800"></div>
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estimasi Biaya</p>
                        <p className="text-lg font-bold text-orange-600 flex items-center gap-1">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(biayaDesain)}
                        </p>
                    </div>

                    {designRunning ? (
                        <button onClick={() => setDesignRunning(false)} className="bg-slate-800 dark:bg-slate-700 text-white p-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center shadow-lg cursor-pointer">
                            <span className="material-symbols-outlined">stop</span>
                        </button>
                    ) : (
                        <button onClick={() => setDesignRunning(true)} className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center shadow-lg shadow-primary/20 cursor-pointer">
                            <span className="material-symbols-outlined">play_arrow</span>
                        </button>
                    )}

                    {designSeconds > 0 && !designRunning && (
                        <button onClick={() => { setDesignSeconds(0); setDesignRunning(false); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer" title="Reset Timer">
                            <span className="material-symbols-outlined">refresh</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column Section */}
                <div className="xl:col-span-8 space-y-8">
                    {/* Catalog Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">category</span>
                                Katalog Produk Offset
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {products.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                                    <p>Belum ada produk offset di katalog.</p>
                                </div>
                            ) : products.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedProduct(p)}
                                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 hover:border-primary/50 transition-all cursor-pointer group shadow-sm flex flex-col ${selectedProduct?.id === p.id ? 'border-primary ring-1 ring-primary/20' : 'border-slate-200 dark:border-slate-800'}`}
                                >
                                    <div className={`size-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${p.is_best_seller ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'}`}>
                                        <span className="material-symbols-outlined !text-3xl">
                                            {p.nama_produk.toLowerCase().includes('nota') ? 'receipt_long' : p.nama_produk.toLowerCase().includes('kalender') ? 'calendar_month' : 'menu_book'}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white capitalize">{p.nama_produk}</h3>
                                    <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">Produk unggulan dengan kualitas cetak premium.</p>
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Mulai Dari</span>
                                        <span className="text-sm font-bold text-primary">Rp {p.harga_base.toLocaleString('id-ID')}/{p.satuan}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Active Orders Section */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Pesanan Offset Berjalan</h2>
                            <button
                                onClick={fetchOffsetData}
                                className="text-primary text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
                            >
                                REFRESH <span className="material-symbols-outlined !text-sm">refresh</span>
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">Produk</th>
                                        <th className="px-6 py-3">Pelanggan</th>
                                        <th className="px-6 py-3">Jumlah</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {loading ? (
                                        <tr><td colSpan="5" className="py-12 text-center text-slate-400">Memuat data...</td></tr>
                                    ) : activeOrders.length === 0 ? (
                                        <tr><td colSpan="5" className="py-12 text-center text-slate-400">Tidak ada pesanan offset yang berjalan.</td></tr>
                                    ) : activeOrders.map(o => (
                                        <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white">{o.product_name}</p>
                                                    <p className="text-xs text-slate-400">{o.spk_number}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                                {o.customer_name}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                {o.product_qty} {o.product_unit}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black ${o.status === 'Selesai' ? 'bg-green-100 text-green-700' :
                                                    o.status === 'Produksi' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {o.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => onNavigate('spk-detail', { spkId: o.id })}
                                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-primary transition-all cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined !text-xl">visibility</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Right Column Section - Calculator */}
                <div className="xl:col-span-4">
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white">
                                <span className="material-symbols-outlined text-primary">calculate</span>
                                Estimasi Biaya
                            </h2>
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black rounded-lg">CALC v2.1</span>
                        </div>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pelanggan</label>
                                <select
                                    value={selectedCustomer || ''}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                    className="w-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-primary focus:border-primary text-sm py-2.5 mb-4"
                                >
                                    <option value="">Pelanggan Umum</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>

                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pilih Produk</label>
                                <select
                                    value={selectedProduct?.id || ''}
                                    onChange={(e) => {
                                        const p = products.find(p => p.id === parseInt(e.target.value));
                                        setSelectedProduct(p);
                                    }}
                                    className="w-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-primary focus:border-primary text-sm py-2.5"
                                >
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.nama_produk}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jumlah</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-primary focus:border-primary text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ukuran</label>
                                    <select
                                        value={selectedSize}
                                        onChange={(e) => setSelectedSize(e.target.value)}
                                        className="w-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-primary focus:border-primary text-sm"
                                    >
                                        {SIZES.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bahan Kertas</label>
                                <select
                                    value={selectedMaterial}
                                    onChange={(e) => setSelectedMaterial(e.target.value)}
                                    className="w-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-primary focus:border-primary text-sm"
                                >
                                    {MATERIALS.map(m => <option key={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-500">Subtotal</span>
                                    <span className="text-sm font-semibold dark:text-white">Rp {Math.round(subtotal).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-slate-500">Estimasi Pajak (11%)</span>
                                    <span className="text-sm font-semibold dark:text-white">Rp {Math.round(tax).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="bg-primary/5 rounded-xl p-4 flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Total Estimasi Biaya</span>
                                    <span className="text-2xl font-black text-primary">Rp {Math.round(total + biayaDesain).toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                            <button
                                onClick={handleBuatPesanan}
                                type="button"
                                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
                            >
                                <span className="material-symbols-outlined">add_circle</span>
                                Buat Pesanan Baru
                            </button>
                        </form>
                    </section>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 py-8 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-slate-400">© 2024 PrintManager - Sistem Manajemen Percetakan Offset Terpadu</p>
                    <div className="flex gap-6 text-xs font-semibold text-slate-400 uppercase">
                        <a className="hover:text-primary transition-colors cursor-pointer" href="#">Panduan Pengguna</a>
                        <a className="hover:text-primary transition-colors cursor-pointer" href="#">Support</a>
                        <a className="hover:text-primary transition-colors cursor-pointer" href="#">Privasi</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
