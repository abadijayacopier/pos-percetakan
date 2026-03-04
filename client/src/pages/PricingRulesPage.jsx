import { useState, useEffect } from 'react';
import api from '../services/api';

export default function PricingRulesPage() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);

    // Selection state
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');

    // Rules state
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Simulation state
    const [simQty, setSimQty] = useState(55);

    // Initial load categories & products
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const res = await api.get('/pricing/form-data');
                setCategories(res.data.categories || []);
                setProducts(res.data.products || []);
            } catch (err) {
                console.error('Failed to load form data', err);
            }
        };
        fetchInitialData();
    }, []);

    // Filter products when category changes
    const filteredProducts = selectedCategoryId
        ? products.filter(p => p.category_id === selectedCategoryId)
        : products;

    // Load rules when a product is selected
    useEffect(() => {
        if (!selectedProductId) {
            setRules([]);
            return;
        }

        const fetchRules = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/pricing/rules/${selectedProductId}`);
                setRules(res.data || []);
            } catch (err) {
                console.error('Failed to load rules state', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRules();
    }, [selectedProductId]);

    // Handle rule modifications
    const handleUpdateRule = (index, field, value) => {
        const newRules = [...rules];
        newRules[index] = { ...newRules[index], [field]: value };

        // Auto-calculate harga akhir if base product exists
        if (field === 'diskon_persen') {
            const product = products.find(p => p.id === selectedProductId);
            if (product && product.harga_dasar) {
                const dec = parseFloat(value) || 0;
                newRules[index].harga_per_unit_akhir = product.harga_dasar - (product.harga_dasar * (dec / 100));
            }
        }

        // Format as Number
        if (field === 'min_kuantitas') newRules[index][field] = parseInt(value) || 0;
        if (field === 'max_kuantitas' && value !== '') newRules[index][field] = parseInt(value) || 0;

        setRules(newRules);
    };

    const handleAddRule = () => {
        const product = products.find(p => p.id === selectedProductId);
        const lastRule = rules.length > 0 ? rules[rules.length - 1] : null;

        const newMin = lastRule && lastRule.max_kuantitas ? lastRule.max_kuantitas + 1 : 1;
        setRules([...rules, {
            min_kuantitas: newMin,
            max_kuantitas: null,
            diskon_persen: 0,
            harga_per_unit_akhir: product?.harga_dasar || 0
        }]);
    };

    const handleRemoveRule = (index) => {
        const newRules = rules.filter((_, i) => i !== index);
        setRules(newRules);
    };

    const handleSave = async () => {
        if (!selectedProductId) return alert('Silakan pilih produk terlebih dahulu.');

        setSaving(true);
        try {
            await api.post('/pricing/rules', {
                product_id: selectedProductId,
                rules: rules
            });
            alert('Aturan harga berhasil disimpan!');
        } catch (err) {
            console.error(err);
            alert('Gagal menyimpan aturan harga.');
        } finally {
            setSaving(false);
        }
    };

    // Calculate simulation
    const activeProduct = products.find(p => p.id === selectedProductId);
    const basePrice = activeProduct ? activeProduct.harga_dasar : 0;

    let simTier = null;
    let simPrice = basePrice;

    if (activeProduct) {
        // Find matching rule (descending to catch highest threshold if multiple match somehow - though they shouldn't)
        const sortedRules = [...rules].sort((a, b) => b.min_kuantitas - a.min_kuantitas);
        simTier = sortedRules.find(r =>
            simQty >= r.min_kuantitas &&
            (!r.max_kuantitas || simQty <= r.max_kuantitas)
        );

        if (simTier) {
            simPrice = simTier.harga_per_unit_akhir;
        }
    }
    const totalEstimasi = simQty * simPrice;

    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 w-full">
            {/* Sidebar Kiri - Navigasi Sub-menu Katalog */}
            <aside className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
                <div className="p-2">
                    <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 px-3">Katalog Produk</h3>
                    <nav className="flex flex-col gap-1">
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                            <span className="material-symbols-outlined text-xl group-hover:text-primary">inventory_2</span>
                            <span className="text-sm font-medium">Daftar Produk</span>
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                            <span className="material-symbols-outlined text-xl group-hover:text-primary">category</span>
                            <span className="text-sm font-medium">Kategori</span>
                        </a>
                        <a href="/harga-grosir" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-xl">sell</span>
                            <span className="text-sm font-bold">Harga Grosir</span>
                        </a>
                        <a href="/riwayat-harga" className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                            <span className="material-symbols-outlined text-xl group-hover:text-primary">history</span>
                            <span className="text-sm font-medium">Riwayat Harga</span>
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                            <span className="material-symbols-outlined text-xl group-hover:text-primary">database</span>
                            <span className="text-sm font-medium">Stok</span>
                        </a>
                    </nav>
                </div>
            </aside>

            {/* Area Utama - Form Pengaturan Harga */}
            <section className="flex-1 flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                    <div className="flex flex-col">
                        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">Pengaturan Harga Berjenjang</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal mt-1">Atur harga otomatis berdasarkan jumlah pesanan pelanggan.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center justify-center rounded-lg h-10 px-6 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !selectedProductId}
                            className="flex items-center justify-center rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </div>

                {/* Step 1: Pilih Produk */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                        <span className="flex items-center justify-center size-6 bg-primary text-white text-xs rounded-full">1</span>
                        Pilih Kategori & Produk
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Kategori</label>
                            <select
                                value={selectedCategoryId}
                                onChange={(e) => {
                                    setSelectedCategoryId(e.target.value);
                                    setSelectedProductId('');
                                }}
                                className="form-input w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-12 focus:border-primary focus:ring-1 focus:ring-primary"
                            >
                                <option value="">-- Semua Kategori --</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Produk Spesifik</label>
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                className="form-input w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-12 focus:border-primary focus:ring-1 focus:ring-primary"
                            >
                                <option value="">-- Pilih Produk --</option>
                                {filteredProducts.map(p => (
                                    <option key={p.id} value={p.id}>{p.nama_produk}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Step 2: Tabel Harga */}
                <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-opacity ${!selectedProductId ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <span className="flex items-center justify-center size-6 bg-primary text-white text-xs rounded-full">2</span>
                            Tabel Aturan Harga
                        </h2>
                        <button onClick={handleAddRule} className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                            <span className="material-symbols-outlined text-lg">add_circle</span>
                            Tambah Tingkatan
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Memuat aturan harga...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Min. Kuantitas</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Maks. Kuantitas</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Harga Per Unit</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Diskon (%)</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {rules.map((rule, idx) => (
                                        <tr key={idx} className={idx % 2 !== 0 ? 'bg-primary/5 dark:bg-primary/10' : ''}>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={rule.min_kuantitas || ''}
                                                    onChange={e => handleUpdateRule(idx, 'min_kuantitas', e.target.value)}
                                                    className="w-24 form-input bg-transparent border-slate-200 dark:border-slate-700 rounded focus:ring-primary focus:border-primary text-sm text-slate-900 dark:text-white"
                                                />
                                            </td>
                                            <td className="px-6 py-4 relative group">
                                                <input
                                                    type="number"
                                                    placeholder="Tak Terhingga"
                                                    value={rule.max_kuantitas || ''}
                                                    onChange={e => handleUpdateRule(idx, 'max_kuantitas', e.target.value)}
                                                    className="w-24 form-input bg-transparent border-slate-200 dark:border-slate-700 rounded focus:ring-primary focus:border-primary text-sm text-slate-900 dark:text-white"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-slate-900 dark:text-white">
                                                {rule.diskon_persen > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-400 line-through">Rp {basePrice.toLocaleString('id-ID')}</span>
                                                        <span className="font-bold text-primary">Rp {Number(rule.harga_per_unit_akhir).toLocaleString('id-ID')}</span>
                                                    </div>
                                                ) : (
                                                    <div className="font-semibold text-slate-900 dark:text-white">Rp {Number(rule.harga_per_unit_akhir).toLocaleString('id-ID')}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-emerald-600 font-bold">
                                                    <input
                                                        type="number"
                                                        value={rule.diskon_persen || 0}
                                                        onChange={e => handleUpdateRule(idx, 'diskon_persen', e.target.value)}
                                                        className="w-16 form-input bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-primary focus:border-primary text-sm text-emerald-600"
                                                    />
                                                    <span>%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleRemoveRule(idx)} className="text-slate-500 hover:text-red-500 transition-colors"><span className="material-symbols-outlined">delete</span></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {rules.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-slate-500">Klik Tambah Tingkatan untuk membuat aturan harga.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Step 3: Simulasi */}
                <div className={`bg-slate-900 dark:bg-slate-950 text-white rounded-xl p-6 shadow-xl relative overflow-hidden transition-opacity ${!selectedProductId ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <span className="material-symbols-outlined text-[120px]">calculate</span>
                    </div>
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="flex items-center justify-center size-6 bg-white text-slate-900 text-xs rounded-full">3</span>
                        Pratinjau Kalkulasi (Simulasi)
                    </h2>
                    <div className="flex flex-col md:flex-row items-end gap-6 relative z-10">
                        <div className="flex flex-col gap-2 flex-1">
                            <label className="text-sm font-medium text-slate-400">Masukkan Jumlah Pesanan</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={simQty}
                                    onChange={e => setSimQty(Number(e.target.value))}
                                    className="form-input w-full bg-slate-800 border-none rounded-lg h-14 pl-4 pr-12 text-xl font-bold focus:ring-1 focus:ring-primary text-white z-20 relative"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm z-30 pointer-events-none">Unit</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 py-4 px-6 bg-white/5 rounded-lg border border-white/10 flex-1">
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">Tier Berlaku</span>
                                <span className="text-lg font-bold text-primary">
                                    {simTier?.diskon_persen > 0 ? `Grosir ${simTier.diskon_persen}% OFF` : 'Harga Normal'}
                                </span>
                            </div>
                            <div className="h-10 w-px bg-white/10"></div>
                            <div className="flex flex-col flex-1 text-right">
                                <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">Total Estimasi</span>
                                <span className="text-2xl font-black text-white">Rp {totalEstimasi.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                    {activeProduct && (
                        <p className="mt-4 text-xs text-slate-500 relative z-10">
                            * Simulasi ini dihitung berdasarkan unit price tier yang dipilih (Rp {Number(simPrice).toLocaleString('id-ID')} x {simQty} unit).
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}
