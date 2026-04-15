import { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

export default function OrderInputPage() {
    // Form state
    const [customerId, setCustomerId] = useState('');
    const [deadline, setDeadline] = useState('');
    const [fileUrl, setFileUrl] = useState('');

    // Spesifikasi
    const [kategori, setKategori] = useState('Digital');
    const [material, setMaterial] = useState('Art Carton 260gr');
    const [ukuran, setUkuran] = useState('A3+');
    const [panjang, setPanjang] = useState('');
    const [lebar, setLebar] = useState('');
    const [qty, setQty] = useState(100);
    const [catatan, setCatatan] = useState('');
    const [finishing, setFinishing] = useState({
        'Laminasi Glossy': true,
        'Laminasi Doff': false,
        'Potong Die Cut': false,
        'Lipat Ganda': false,
        'Spot UV': false
    });

    const [paymentMethod, setPaymentMethod] = useState('Tunai / Cash');

    // Data dari server
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Kalkulasi Dinamis
    const [hargaDasar, setHargaDasar] = useState(5000);
    const [hargaSatuan, setHargaSatuan] = useState(5000);
    const [diskonPersen, setDiskonPersen] = useState(0);
    const [isGrosir, setIsGrosir] = useState(false);

    // Product ID dummy / terpilih (idealnya dari state produk)
    // Untuk demo offset printing ini, kita anggap produk ID nya = 1
    const [productId, setProductId] = useState('1');

    // Fetch calculation from server on qty or product change
    useEffect(() => {
        const calculatePrice = async () => {
            if (!qty || qty <= 0 || !productId) return;
            try {
                // Di dunia nyata, pastikan endpoint ini menangani kalkulasi offset jg
                // Saat ini kita pakai endpoint pricing grosir yg sudah kita buat
                const res = await api.post('/pricing/calculate', {
                    product_id: productId,
                    quantity: qty
                });

                if (res.data) {
                    setHargaDasar(res.data.harga_normal);
                    setHargaSatuan(res.data.harga_grosir);
                    setDiskonPersen(res.data.diskon_persen);
                    setIsGrosir(res.data.is_grosir);
                }
            } catch (err) {
                console.error('Error calculating price:', err);
                // Fallback
                setHargaSatuan(hargaDasar);
                setIsGrosir(false);
            }
        };

        // Debounce simple
        const delay = setTimeout(calculatePrice, 300);
        return () => clearTimeout(delay);

    }, [qty, productId, hargaDasar]);

    let diskonMessege = '';
    if (isGrosir && diskonPersen > 0) {
        diskonMessege = `Grosir ${diskonPersen}% OFF`;
    }



    const biayaCetak = hargaSatuan * qty;
    const biayaMaterial = material.includes('Carton') ? 125000 : 75000;
    const biayaFinishing = finishing['Laminasi Glossy'] ? 75000 : 0;
    const biayaDesain = 50000;
    const totalEstimasi = biayaCetak + biayaMaterial + biayaFinishing + biayaDesain;

    // Ambil data pelanggan saat mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/offset-orders/form-data');
                setCustomers(res.data.customers);
            } catch (err) {
                console.error('Failed to load customers', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleFinishingChange = (key) => {
        setFinishing(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();

        if (!customerId) { Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Silakan pilih pelanggan!', timer: 2500 }); return; }
        if (qty <= 0) { Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Jumlah pesanan tidak valid!', timer: 2500 }); return; }

        setSubmitting(true);
        try {
            const formData = {
                customer_id: customerId,
                qty: Number(qty),
                total_estimasi: totalEstimasi,
                metode_pembayaran: paymentMethod,
                spesifikasi: {
                    deadline,
                    file_url: fileUrl,
                    kategori,
                    material,
                    ukuran,
                    panjang: ukuran === 'Kustom' ? panjang : null,
                    lebar: ukuran === 'Kustom' ? lebar : null,
                    finishing: Object.keys(finishing).filter(k => finishing[k]),
                    catatan
                }
            };

            const response = await api.post('/offset-orders', formData);
            Swal.fire({ icon: 'success', title: 'Sukses', text: 'Pesanan Sukses Dibuat: ' + response.data.order_number, timer: 3000 });

            // Opsional: Reset form atau navigasi
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || error.message, timer: 3000 });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8">Memuat data form...</div>;

    return (
        <div className="flex-1 flex flex-col w-full h-full">
            <div className="flex flex-col gap-2 mb-8 mt-2">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">Input Pesanan Percetakan Baru</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Lengkapi spesifikasi teknis untuk kalkulasi biaya akurat.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-6 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-shadow shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {submitting ? 'Menyimpan...' : 'Simpan & Proses'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kolom Kiri - Form Utama */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Section Informasi Pelanggan & Desain */}
                    <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <span className="material-symbols-outlined">person</span>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Informasi Pelanggan & Desain</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pilih Pelanggan</label>
                                <select
                                    className="form-input w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-11 focus:ring-primary focus:border-primary"
                                    value={customerId}
                                    onChange={(e) => setCustomerId(e.target.value)}
                                >
                                    <option value="" className="text-slate-900 dark:text-white">-- Pilih Pelanggan --</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id} className="text-slate-900 dark:text-white">{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Deadline Pengambilan</label>
                                <input
                                    type="datetime-local"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="form-input w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-11 focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">File Desain (Link)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">link</span>
                                    </div>
                                    <input
                                        type="url"
                                        value={fileUrl}
                                        onChange={(e) => setFileUrl(e.target.value)}
                                        className="form-input w-full pl-10 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-11 focus:ring-primary focus:border-primary text-sm"
                                        placeholder="Tempel link Google Drive / Dropbox"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section Spesifikasi Cetak */}
                    <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <span className="material-symbols-outlined">description</span>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Spesifikasi Cetak</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Kategori */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Kategori Layanan</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Digital', 'Large Format', 'Offset'].map(k => (
                                        <button
                                            key={k}
                                            onClick={() => setKategori(k)}
                                            className={`p-3 border rounded-lg flex flex-col items-center gap-1 transition-colors ${kategori === k
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/50'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined">{k === 'Digital' ? 'print' : k === 'Offset' ? 'layers' : 'width_full'}</span>
                                            <span className="text-xs font-semibold">{k}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Material / Bahan</label>
                                <select
                                    value={material} onChange={e => setMaterial(e.target.value)}
                                    className="form-input w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-11 focus:ring-primary focus:border-primary"
                                >
                                    <option className="text-slate-900 dark:text-white">Art Paper 150gr</option>
                                    <option className="text-slate-900 dark:text-white">Art Carton 210gr</option>
                                    <option className="text-slate-900 dark:text-white">Art Carton 260gr</option>
                                    <option className="text-slate-900 dark:text-white">HVS 80gr</option>
                                    <option className="text-slate-900 dark:text-white">Vinyl Glossy (Sticker)</option>
                                    <option className="text-slate-900 dark:text-white">Matte Sticker</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ukuran</label>
                                <div className="flex gap-2">
                                    <select
                                        value={ukuran} onChange={e => setUkuran(e.target.value)}
                                        className="form-input flex-1 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-11 focus:ring-primary focus:border-primary"
                                    >
                                        <option className="text-slate-900 dark:text-white">A3+</option>
                                        <option className="text-slate-900 dark:text-white">A4</option>
                                        <option className="text-slate-900 dark:text-white">A5</option>
                                        <option className="text-slate-900 dark:text-white">Kustom</option>
                                    </select>
                                    {ukuran === 'Kustom' && (
                                        <div className="flex items-center gap-1">
                                            <input
                                                value={panjang}
                                                onChange={e => {
                                                    const val = e.target.value.replace(',', '.');
                                                    if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                                                        setPanjang(val);
                                                    }
                                                }}
                                                type="text"
                                                inputMode="decimal"
                                                className="form-input w-16 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-11 text-center"
                                                placeholder="L"
                                            />
                                            <span className="text-slate-400 text-xs">x</span>
                                            <input
                                                value={lebar}
                                                onChange={e => {
                                                    const val = e.target.value.replace(',', '.');
                                                    if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                                                        setLebar(val);
                                                    }
                                                }}
                                                type="text"
                                                inputMode="decimal"
                                                className="form-input w-16 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-11 text-center"
                                                placeholder="P"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Jumlah Pesanan</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        value={qty}
                                        onChange={(e) => setQty(Number(e.target.value))}
                                        className="form-input w-32 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold h-11 rounded-lg focus:ring-primary focus:border-primary"
                                    />
                                    {diskonMessege && (
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                            {diskonMessege}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Finishing</label>
                                <div className="flex flex-wrap gap-3">
                                    {Object.keys(finishing).map(key => (
                                        <label key={key} className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={finishing[key]}
                                                onChange={() => handleFinishingChange(key)}
                                                className="rounded text-primary focus:ring-primary bg-transparent border-slate-300 dark:border-slate-600"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{key}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Catatan Tambahan</label>
                                <textarea
                                    value={catatan}
                                    onChange={e => setCatatan(e.target.value)}
                                    rows="3"
                                    className="form-input w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary text-sm"
                                    placeholder="Contoh: Warna harus pekat..."
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Kolom Kanan - Ringkasan Biaya */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-2 border-primary/20 shadow-xl sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ringkasan Biaya</h2>
                            <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded">Real-time</span>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-sm">
                                <div className="flex flex-col">
                                    <span className="text-slate-500 dark:text-slate-400">Biaya Cetak ({qty} {ukuran})</span>
                                </div>
                                <div className="text-right">
                                    {isGrosir && (
                                        <span className="text-slate-400 line-through text-xs block">Rp {(hargaDasar * qty).toLocaleString('id-ID')}</span>
                                    )}
                                    <span className="font-medium text-slate-900 dark:text-white">Rp {biayaCetak.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Material ({material})</span>
                                <span className="font-medium text-slate-900 dark:text-white">Rp {biayaMaterial.toLocaleString('id-ID')}</span>
                            </div>
                            {finishing['Laminasi Glossy'] && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Laminasi Glossy</span>
                                    <span className="font-medium text-slate-900 dark:text-white">Rp {biayaFinishing.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Biaya Desain</span>
                                <span className="font-medium text-slate-900 dark:text-white">Rp {biayaDesain.toLocaleString('id-ID')}</span>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between">
                                <span className="text-slate-900 dark:text-white font-bold">Total Estimasi</span>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-primary">Rp {totalEstimasi.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Metode Pembayaran</label>
                                <select
                                    className="form-input w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-10 text-sm focus:ring-primary"
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value)}
                                >
                                    <option className="text-slate-900 dark:text-white">Tunai / Cash</option>
                                    <option className="text-slate-900 dark:text-white">Transfer Bank</option>
                                    <option className="text-slate-900 dark:text-white">E-Wallet (QRIS)</option>
                                    <option className="text-slate-900 dark:text-white">Piutang (Tempo)</option>
                                </select>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full py-3 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/30 hover:bg-primary/90 flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined">payments</span>
                                {submitting ? 'Memproses...' : 'Proses Pembayaran'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
