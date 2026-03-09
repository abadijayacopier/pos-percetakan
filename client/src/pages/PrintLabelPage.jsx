import { useEffect } from 'react';

export default function PrintLabelPage({ onNavigate, pageState }) {
    const spkId = pageState?.spkId || 'SPK-2023-00452';

    // Tambahkan style cetak 100x100mm ke dalam tag head
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                .no-print { display: none !important; }
                .print-area { 
                    margin: 0 !important; 
                    padding: 0 !important; 
                    box-shadow: none !important; 
                    width: 100mm !important; 
                    height: 100mm !important;
                    border: none !important;
                }
                @page { size: 100mm 100mm; margin: 0; }
                body { background-color: white !important; }
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
            <div className="layout-container flex h-full grow flex-col">
                <main className="flex-1 flex flex-col items-center py-8 px-4">
                    <div className="no-print w-full max-w-4xl flex flex-wrap gap-2 mb-4">
                        <button onClick={() => onNavigate('dashboard')} className="text-slate-500 text-sm font-medium cursor-pointer hover:text-primary">Beranda</button>
                        <span className="text-slate-400 text-sm">/</span>
                        <button onClick={() => onNavigate('spk-detail', { spkId })} className="text-slate-500 text-sm font-medium cursor-pointer hover:text-primary">Kembali</button>
                        <span className="text-slate-400 text-sm">/</span>
                        <span className="text-slate-900 dark:text-white text-sm font-medium">Pratinjau Cetak Label</span>
                    </div>

                    <div className="no-print w-full max-w-4xl flex flex-wrap justify-between items-end gap-3 mb-6">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">Pratinjau Cetak Label</h1>
                            <p className="text-slate-500 text-sm">Pratinjau label sebelum dikirim ke printer thermal.</p>
                        </div>
                    </div>

                    <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-4xl">
                        {/* Preview Section */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-slate-200 dark:bg-slate-800 p-12 rounded-xl flex justify-center items-center border-2 border-dashed border-slate-300 dark:border-slate-700">
                                {/* Label Content (Simulating 100x100mm Thermal Sticker) */}
                                <div className="print-area w-[100mm] h-[100mm] bg-white text-black shadow-2xl p-4 flex flex-col border border-slate-300">
                                    {/* Label Header */}
                                    <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-black flex items-center justify-center rounded">
                                                <span className="material-symbols-outlined text-white text-xl">store</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm uppercase tracking-wider">PRINT HUB</p>
                                                <p className="text-[8px]">Jl. Percetakan 12, Jakarta</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-bold">INFO PENGIRIMAN</p>
                                            <p className="text-[8px]">{new Date().toLocaleDateString('id-ID')}</p>
                                        </div>
                                    </div>

                                    {/* Customer Details */}
                                    <div className="mb-2">
                                        <p className="text-[8px] font-bold uppercase text-slate-500">Penerima:</p>
                                        <p className="text-base font-bold leading-tight">Budi Santoso</p>
                                        <p className="text-xs font-semibold">0812-3456-7890</p>
                                        <p className="text-[10px] mt-1 leading-tight">Griya Asri Blok C3 No. 12, Tangerang Selatan, Banten 15414</p>
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 border-t border-b border-black py-2 flex flex-col justify-center">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-xs font-bold">Nama Produk</p>
                                            <p className="text-xs font-bold">Jumlah</p>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-100 p-1">
                                            <p className="text-xs">Kartu Nama Matte 260gr</p>
                                            <p className="text-sm font-bold">5 Box</p>
                                        </div>
                                    </div>

                                    {/* Barcode & Footer */}
                                    <div className="mt-2 flex flex-col items-center">
                                        <div className="w-full flex flex-col items-center gap-1">
                                            <div className="w-full h-10 bg-white flex items-end justify-center gap-[1px]">
                                                {/* Simulated Barcode Lines */}
                                                {[...Array(30)].map((_, i) => (
                                                    <div key={i} className={`bg-black h-full`} style={{ width: `${Math.floor(Math.random() * 3) + 1}px` }}></div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] font-bold tracking-[0.2em]">{spkId}</p>
                                        </div>
                                        <p className="mt-1 text-[10px] font-bold italic">Terima Kasih!</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center gap-4">
                                <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                    Edit Profil Toko
                                </button>
                            </div>
                        </div>

                        {/* Sidebar Controls */}
                        <div className="flex flex-col gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">settings</span>
                                    Konfigurasi Cetak
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ukuran Label</label>
                                        <select className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm h-[40px]">
                                            <option>Sticker Thermal (100x100mm)</option>
                                            <option>Sticker Thermal (75x50mm)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Printer Tujuan</label>
                                        <select className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm h-[40px]">
                                            <option>Thermal Printer XP-420B</option>
                                            <option>Simpan sebagai PDF</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Salinan</label>
                                            <input className="w-full h-[40px] rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" min="1" type="number" defaultValue="1" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <label className="flex items-center gap-2 text-sm font-medium mt-4 cursor-pointer">
                                                <input defaultChecked className="rounded text-primary focus:ring-primary size-4" type="checkbox" />
                                                Pakai Logo
                                            </label>
                                        </div>
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
