import { useEffect } from 'react';

export default function PrintInvoicePage({ onNavigate, pageState }) {
    const spkId = pageState?.spkId || 'SPK-2023-0892';

    // Tambahkan style cetak ke dalam tag head
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                .no-print { display: none !important; }
                .print-area { 
                    margin: 0 !important; 
                    padding: 10mm !important; 
                    box-shadow: none !important; 
                    width: 100% !important; 
                    max-width: none !important;
                    border: none !important;
                }
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
                        <span className="text-slate-900 dark:text-white text-sm font-medium">Pratinjau Invoice</span>
                    </div>

                    <div className="no-print w-full max-w-4xl flex flex-wrap justify-between items-end gap-3 mb-6">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">Pratinjau Cetak Invoice</h1>
                            <p className="text-slate-500 text-sm">Pratinjau dokumen sebelum dicetak ke printer thermal atau A5.</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                                <span className="material-symbols-outlined mr-2 text-sm">download</span>
                                Unduh/Simpan PDF
                            </button>
                            <button onClick={() => window.print()} className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined mr-2 text-sm">print</span>
                                <span className="truncate">Cetak Sekarang</span>
                            </button>
                        </div>
                    </div>

                    {/* Print Area */}
                    <div className="print-area w-full max-w-[800px] bg-white dark:bg-slate-900 shadow-xl rounded-xl p-8 mb-12 border border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col md:flex-row justify-between border-b border-slate-100 dark:border-slate-800 pb-8 mb-8">
                            <div className="flex gap-4 items-center">
                                <div className="size-16 bg-primary rounded-xl flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-4xl">print</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Percetakan Hub</h2>
                                    <p className="text-slate-500 text-sm">Solusi Cetak Cepat & Berkualitas</p>
                                    <p className="text-slate-500 text-xs mt-1">Jl. Grafika No. 12, Jakarta Selatan | 0812-3456-7890</p>
                                </div>
                            </div>
                            <div className="mt-4 md:mt-0 text-left md:text-right">
                                <div className="inline-block px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold mb-2 uppercase tracking-wider">
                                    LUNAS
                                </div>
                                <p className="text-slate-500 text-xs uppercase font-semibold">Nomor Invoice</p>
                                <p className="text-slate-900 dark:text-white font-bold text-lg">#INV-{spkId.replace('SPK-', '')}</p>
                                <p className="text-slate-500 text-xs mt-2 italic text-sm">{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-2">Ditagih Kepada:</p>
                                <p className="text-slate-900 dark:text-white font-bold">Bpk. Ahmad Subarjo</p>
                                <p className="text-slate-500 text-sm">PT. Kreatif Digital Indonesia</p>
                                <p className="text-slate-500 text-sm">Jl. Melati No. 45, Kebayoran Baru</p>
                                <p className="text-slate-500 text-sm">0857-1122-3344</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-2">Metode Pembayaran:</p>
                                <p className="text-slate-900 dark:text-white font-medium">QRIS / Transfer Bank</p>
                                <p className="text-slate-500 text-sm">An. Percetakan Hub</p>
                                <p className="text-slate-500 text-sm">No Rek: 1234567890 (BCA)</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto mb-8">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="py-3 text-slate-500 font-semibold text-sm">Deskripsi Produk/Jasa</th>
                                        <th className="py-3 text-slate-500 font-semibold text-sm text-center">Jumlah</th>
                                        <th className="py-3 text-slate-500 font-semibold text-sm text-right">Harga Satuan</th>
                                        <th className="py-3 text-slate-500 font-semibold text-sm text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr>
                                        <td className="py-4">
                                            <p className="font-bold text-slate-900 dark:text-white">Buku Nota A5 NCR 3 Ply</p>
                                            <p className="text-xs text-slate-500">Jilid Lem, Perforasi, Nomorator (001-500)</p>
                                        </td>
                                        <td className="py-4 text-center text-slate-700 dark:text-slate-300">50 Buku</td>
                                        <td className="py-4 text-right text-slate-700 dark:text-slate-300">Rp 15.000</td>
                                        <td className="py-4 text-right font-semibold text-slate-900 dark:text-white">Rp 750.000</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4">
                                            <p className="font-bold text-slate-900 dark:text-white">Jasa Desain Grafis</p>
                                            <p className="text-xs text-slate-500">Layout & Pengaturan Nomorator</p>
                                        </td>
                                        <td className="py-4 text-center text-slate-700 dark:text-slate-300">Tim Produksi</td>
                                        <td className="py-4 text-right text-slate-700 dark:text-slate-300">Rp 50.000</td>
                                        <td className="py-4 text-right font-semibold text-slate-900 dark:text-white">Rp 50.000</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between gap-12 border-b border-slate-100 dark:border-slate-800 pb-8">
                            <div className="flex-1">
                                <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20">
                                    <p className="text-primary text-xs font-bold uppercase mb-2 flex items-center">
                                        <span className="material-symbols-outlined text-sm mr-1">info</span>
                                        Catatan & Instruksi:
                                    </p>
                                    <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc pl-4">
                                        <li>Barang yang sudah dicetak tidak dapat ditukar kecuali ada kesalahan produksi.</li>
                                        <li>Pengambilan barang wajib menunjukkan invoice ini.</li>
                                        <li>Invoice digital ini merupakan bukti transaksi yang sah.</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="w-full md:w-64 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Subtotal:</span>
                                    <span className="text-slate-900 dark:text-white font-medium">Rp 800.000</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Pajak (PPN 11%):</span>
                                    <span className="text-slate-900 dark:text-white font-medium">Rp 88.000</span>
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between">
                                    <span className="text-slate-900 dark:text-white font-bold">Total Tagihan:</span>
                                    <span className="text-slate-900 dark:text-white font-bold">Rp 888.000</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Uang Muka (DP):</span>
                                    <span>- Rp 300.000</span>
                                </div>
                                <div className="border-t-2 border-primary pt-3 flex justify-between items-center px-2">
                                    <span className="text-primary font-bold text-sm">Total Dibayar:</span>
                                    <span className="text-xl text-primary font-extrabold">Rp 588.000</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 grid grid-cols-2 gap-8 text-center">
                            <div className="flex flex-col items-center">
                                <p className="text-slate-400 text-xs mb-16 uppercase tracking-widest font-bold">Penerima,</p>
                                <div className="w-40 border-b border-slate-300 dark:border-slate-700"></div>
                                <p className="text-slate-900 dark:text-white text-sm font-bold mt-2">Ahmad Subarjo</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-slate-400 text-xs mb-4 uppercase tracking-widest font-bold">Hormat Kami,</p>
                                <div className="size-16 opacity-20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-5xl text-primary">verified_user</span>
                                </div>
                                <div className="w-40 border-b border-slate-300 dark:border-slate-700 mt-4"></div>
                                <p className="text-slate-900 dark:text-white text-sm font-bold mt-2">Kasir / Admin</p>
                            </div>
                        </div>

                        <div className="mt-12 text-center text-[10px] text-slate-400 border-t border-dashed border-slate-200 dark:border-slate-800 pt-4">
                            Dicetak otomatis oleh Sistem Percetakan Terintegrasi pada {new Date().toLocaleString('id-ID')}. Terima kasih atas kepercayaan Anda!
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
