import { useState, useEffect } from 'react';
import api from '../services/api';

export default function PrintLabelPage({ onNavigate, pageState }) {
    const spkId = pageState?.spkId || 'SPK-2023-00452';

    const [storeInfo, setStoreInfo] = useState({ name: 'ABADI JAYA', address: 'Buka Pengaturan untuk ubah alamat' });
    const [spk, setSpk] = useState(null);
    const [loading, setLoading] = useState(true);
    const [labelSize, setLabelSize] = useState('100x100mm');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [setRes, spkRes] = await Promise.all([
                    api.get('/settings').catch(() => ({ data: [] })),
                    api.get('/spk/' + spkId).catch(() => ({ data: null }))
                ]);

                if (Array.isArray(setRes.data)) {
                    const info = {};
                    setRes.data.forEach(s => { info[s.key] = s.value; });
                    setStoreInfo({
                        name: info.store_name || 'ABADI JAYA',
                        address: info.store_address || 'Buka Pengaturan untuk ubah alamat'
                    });
                }

                if (spkRes.data) {
                    setSpk(spkRes.data);
                } else {
                    setSpk({
                        spk_number: spkId,
                        customer_name: 'Pelanggan Umum',
                        customer_phone: '-',
                        customer_address: '-',
                        product_name: 'Produk Cetak',
                        product_qty: 1,
                        product_unit: 'Pcs'
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [spkId]);

    // Tambahkan style cetak dinamis dengan natural document flow
    useEffect(() => {
        const style = document.createElement('style');
        const [width, height] = labelSize.replace('mm', '').split('x');
        style.innerHTML = `
            @media print {
                html, body {
                    background-color: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    color: black !important;
                }
                .print-hide {
                    display: none !important;
                }
                .print-wrapper-reset {
                    padding: 0 !important;
                    margin: 0 !important;
                    border: none !important;
                    background: transparent !important;
                    box-shadow: none !important;
                    display: block !important;
                    width: auto !important;
                }
                .print-area { 
                    margin: 0 !important; 
                    padding: 0 !important; 
                    box-shadow: none !important; 
                    width: ${width}mm !important; 
                    height: ${height}mm !important;
                    border: none !important;
                    background-color: white !important;
                    color: black !important;
                    page-break-inside: avoid;
                }
                @page { size: ${width}mm ${height}mm; margin: 0; }
            }
        `;
        document.head.appendChild(style);

        let wasDark = false;
        const handleBeforePrint = () => {
            if (document.documentElement.classList.contains('dark')) {
                wasDark = true;
                document.documentElement.classList.remove('dark');
            }
        };
        const handleAfterPrint = () => {
            if (wasDark) {
                document.documentElement.classList.add('dark');
                wasDark = false;
            }
        };

        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            document.head.removeChild(style);
            window.removeEventListener('beforeprint', handleBeforePrint);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [labelSize]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen print-wrapper-reset">
            <div className="layout-container flex h-full grow flex-col print-wrapper-reset">
                <main className="flex-1 flex flex-col items-center py-8 px-4 print-wrapper-reset">
                    <div className="print-hide w-full max-w-4xl flex flex-wrap gap-2 mb-4">
                        <button onClick={() => onNavigate('dashboard')} className="text-slate-500 text-sm font-medium cursor-pointer hover:text-primary">Beranda</button>
                        <span className="text-slate-400 text-sm">/</span>
                        <button onClick={() => onNavigate('spk-detail', { spkId })} className="text-slate-500 text-sm font-medium cursor-pointer hover:text-primary">Kembali</button>
                        <span className="text-slate-400 text-sm">/</span>
                        <span className="text-slate-900 dark:text-white text-sm font-medium">Pratinjau Cetak Label</span>
                    </div>

                    <div className="print-hide w-full max-w-4xl flex flex-wrap justify-between items-end gap-3 mb-6">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">Pratinjau Cetak Label</h1>
                            <p className="text-slate-500 text-sm">Pratinjau label sebelum dikirim ke printer thermal.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-4xl print-wrapper-reset">
                        {/* Preview Section */}
                        <div className="lg:col-span-2 space-y-6 print-wrapper-reset">
                            <div className="bg-slate-200 dark:bg-slate-800 p-12 rounded-xl flex justify-center items-center border-2 border-dashed border-slate-300 dark:border-slate-700 print-wrapper-reset">
                                {/* Label Content (Simulating 100x100mm Thermal Sticker) */}
                                <div className={`print-area bg-white text-black shadow-2xl p-4 flex flex-col ${labelSize === '100x100mm' ? 'w-[100mm] h-[100mm]' : 'w-[75mm] h-[50mm]'}`}>
                                    {/* Label Header */}
                                    <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2 print-wrapper-reset">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-black flex items-center justify-center rounded">
                                                <span className="material-symbols-outlined text-white text-xl">store</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm uppercase tracking-wider text-black m-0 p-0 leading-tight">{storeInfo.name}</p>
                                                <p className="text-[8px] max-w-[150px] truncate leading-tight text-black m-0 p-0">{storeInfo.address}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-bold text-black m-0 p-0 leading-tight">INFO TANGGAL</p>
                                            <p className="text-[8px] text-black m-0 p-0 leading-tight">{new Date().toLocaleDateString('id-ID')}</p>
                                        </div>
                                    </div>

                                    {/* Customer Details */}
                                    <div className="mb-2 print-wrapper-reset">
                                        <p className="text-[8px] font-bold uppercase text-slate-500 m-0 p-0 leading-tight">Penerima:</p>
                                        <p className="text-base font-bold text-black m-0 p-0 leading-tight">{spk?.customer_company || spk?.customer_name || 'Pelanggan Umum'}</p>
                                        <p className="text-xs font-semibold text-black m-0 p-0 leading-tight">{spk?.customer_phone || '-'}</p>
                                        <p className="text-[10px] mt-1 text-black m-0 p-0 leading-tight">{spk?.customer_address || ''}</p>
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 border-t border-b border-black py-2 flex flex-col justify-center print-wrapper-reset">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-xs font-bold text-black m-0 p-0">Nama Produk</p>
                                            <p className="text-xs font-bold text-black m-0 p-0">Jumlah</p>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-100 p-1 print-wrapper-reset">
                                            <p className="text-xs text-black m-0 p-0">{spk?.product_name || 'Item Cetak'}</p>
                                            <p className="text-sm font-bold text-black m-0 p-0">{spk?.product_qty} {spk?.product_unit}</p>
                                        </div>
                                    </div>

                                    {/* Barcode & Footer */}
                                    <div className="mt-2 flex flex-col items-center print-wrapper-reset">
                                        <div className="w-full flex flex-col items-center gap-1">
                                            <div className="w-full h-8 flex items-end justify-center gap-px print-wrapper-reset">
                                                {/* Simulated Barcode Lines */}
                                                {[...Array(30)].map((_, i) => (
                                                    <div key={i} className={`bg-black h-full`} style={{ width: `${Math.floor((i % 3) * 1.5) + 1}px` }}></div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-black m-0 p-0 leading-none">{spk?.spk_number || spkId}</p>
                                        </div>
                                        <p className="mt-1 text-[10px] font-bold italic text-black m-0 p-0 leading-none">Terima Kasih!</p>
                                    </div>
                                </div>
                            </div>

                            <div className="print-hide flex justify-center gap-4">
                                <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                    Edit Profil Toko
                                </button>
                            </div>
                        </div>

                        {/* Sidebar Controls */}
                        <div className="print-hide flex flex-col gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">settings</span>
                                    Konfigurasi Cetak
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ukuran Label</label>
                                        <select
                                            value={labelSize}
                                            onChange={(e) => setLabelSize(e.target.value)}
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm h-[40px]"
                                        >
                                            <option value="100x100mm" className="text-slate-900 dark:text-white">Sticker Thermal (100x100mm)</option>
                                            <option value="75x50mm" className="text-slate-900 dark:text-white">Sticker Thermal (75x50mm)</option>
                                        </select>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                                            <span className="material-symbols-outlined text-sm">info</span>
                                            Pilih Printer Thermal (seperti XP-420B) langsung dari dialog cetak browser setelah menekan tombol di bawah.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => window.print()} className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform cursor-pointer">
                                <span className="material-symbols-outlined">print</span>
                                Mulai Proses Cetak
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
