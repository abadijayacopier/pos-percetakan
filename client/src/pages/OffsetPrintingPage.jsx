import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

// Daftar harga mock dasar untuk simulasi cepat
const PRICING_DB = {
    products: {
        'Nota NCR': { basePrice: 150000, unit: 'rim' },
        'Buku / Katalog': { basePrice: 20000, unit: 'pcs' },
        'Kalender Dinding': { basePrice: 15000, unit: 'pcs' },
        'Brosur / Flyer': { basePrice: 500, unit: 'lembar' }
    },
    sizes: {
        'A4': 1,
        'A5': 0.6,
        'A6': 0.4,
        'Custom': 1.2
    },
    materials: {
        'HVS 80gr': 1,
        'Art Paper 150gr': 1.3,
        'Art Carton 260gr': 1.8,
        'NCR Paper': 1.2
    }
};

export default function OffsetPrintingPage({ onNavigate }) {

    // Kalkulator States
    const [selectedProduct, setSelectedProduct] = useState('Nota NCR');
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('A4');
    const [selectedMaterial, setSelectedMaterial] = useState('HVS 80gr');

    // Result States
    const [subtotal, setSubtotal] = useState(0);
    const [tax, setTax] = useState(0);
    const [total, setTotal] = useState(0);

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

    // Calculate Price using mock DB logic
    useEffect(() => {
        const productInfo = PRICING_DB.products[selectedProduct] || { basePrice: 0 };
        const sizeMultiplier = PRICING_DB.sizes[selectedSize] || 1;
        const materialMultiplier = PRICING_DB.materials[selectedMaterial] || 1;

        const calculatedSubtotal = productInfo.basePrice * quantity * sizeMultiplier * materialMultiplier;
        const calculatedTax = calculatedSubtotal * 0.11; // 11% PPN

        setSubtotal(calculatedSubtotal);
        setTax(calculatedTax);
        setTotal(calculatedSubtotal + calculatedTax);
    }, [selectedProduct, quantity, selectedSize, selectedMaterial]);

    // Handle Pesanan Baru (Simpan ke DB lalu navigasi)
    const handleBuatPesanan = async () => {
        try {
            const res = await api.post('/spk', {
                customer_name: 'Pelanggan Walk-in',
                product_name: `Offset - ${selectedProduct}`,
                product_qty: quantity,
                product_unit: 'pcs',
                specs_material: selectedMaterial,
                specs_notes: `Ukuran: ${selectedSize}`,
                biaya_cetak: total,
                priority: 'Normal'
            });

            if (res.data && res.data.id) {
                onNavigate('spk-detail', { spkId: res.data.id });
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
                            {/* Product Card 1 */}
                            <div
                                onClick={() => setSelectedProduct('Nota NCR')}
                                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 hover:border-primary/50 transition-all cursor-pointer group shadow-sm flex flex-col ${selectedProduct === 'Nota NCR' ? 'border-primary ring-1 ring-primary/20' : 'border-slate-200 dark:border-slate-800'}`}
                            >
                                <div className="size-12 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined !text-3xl">receipt_long</span>
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Nota / Faktur</h3>
                                <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">NCR 2-4 rangkap, berbagai ukuran dengan penomoran otomatis.</p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mulai Dari</span>
                                    <span className="text-sm font-bold text-primary">Rp 150.000/rim</span>
                                </div>
                            </div>
                            {/* Product Card 2 */}
                            <div
                                onClick={() => setSelectedProduct('Buku / Katalog')}
                                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 hover:border-primary/50 transition-all cursor-pointer group shadow-sm flex flex-col ${selectedProduct === 'Buku / Katalog' ? 'border-primary ring-1 ring-primary/20' : 'border-slate-200 dark:border-slate-800'}`}
                            >
                                <div className="size-12 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined !text-3xl">menu_book</span>
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Buku & Katalog</h3>
                                <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">Softcover/Hardcover, laminasi glossy/doff, binding lem panas.</p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mulai Dari</span>
                                    <span className="text-sm font-bold text-primary">Rp 20.000/pcs</span>
                                </div>
                            </div>
                            {/* Product Card 3 */}
                            <div
                                onClick={() => setSelectedProduct('Kalender Dinding')}
                                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 hover:border-primary/50 transition-all cursor-pointer group shadow-sm flex flex-col ${selectedProduct === 'Kalender Dinding' ? 'border-primary ring-1 ring-primary/20' : 'border-slate-200 dark:border-slate-800'}`}
                            >
                                <div className="size-12 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined !text-3xl">calendar_month</span>
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Kalender Dinding</h3>
                                <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">Kalender dinding atau meja dengan finishing spiral/klem seng.</p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mulai Dari</span>
                                    <span className="text-sm font-bold text-primary">Rp 15.000/pcs</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Active Orders Section */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Pesanan Offset Berjalan</h2>
                            <button className="text-primary text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer">
                                LIHAT SEMUA <span className="material-symbols-outlined !text-sm">arrow_forward</span>
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
                                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white">Nota NCR 3 Rangkap</p>
                                                <p className="text-xs text-slate-400">#OFF-2201</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">Toko Sinar Jaya</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">5 Rim</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-[10px] font-black">CETAK PLAT</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-primary transition-all cursor-pointer">
                                                <span className="material-symbols-outlined !text-xl">edit_note</span>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white">Katalog Produk A4</p>
                                                <p className="text-xs text-slate-400">#OFF-2202</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">PT. Maju Mundur</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">1.000 Pcs</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-[10px] font-black">PENJILIDAN</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-primary transition-all cursor-pointer">
                                                <span className="material-symbols-outlined !text-xl">edit_note</span>
                                            </button>
                                        </td>
                                    </tr>
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
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pilih Produk</label>
                                <select
                                    value={selectedProduct}
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                    className="w-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-primary focus:border-primary text-sm py-2.5"
                                >
                                    <option>Nota NCR</option>
                                    <option>Buku / Katalog</option>
                                    <option>Kalender Dinding</option>
                                    <option>Brosur / Flyer</option>
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
                                        <option>A4</option>
                                        <option>A5</option>
                                        <option>A6</option>
                                        <option>Custom</option>
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
                                    <option>HVS 80gr</option>
                                    <option>Art Paper 150gr</option>
                                    <option>Art Carton 260gr</option>
                                    <option>NCR Paper</option>
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
                                    <span className="text-2xl font-black text-primary">Rp {Math.round(total).toLocaleString('id-ID')}</span>
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
