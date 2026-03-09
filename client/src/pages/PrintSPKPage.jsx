import { useEffect } from 'react';

export default function PrintSPKPage({ onNavigate, pageState }) {
    const spkId = pageState?.spkId || 'SPK-2023-0892';

    // Tambahkan style cetak format A4
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                .no-print { display: none !important; }
                .print-area { 
                    margin: 0 !important; 
                    padding: 20mm !important; 
                    box-shadow: none !important; 
                    width: 210mm !important; 
                    min-height: 297mm !important;
                    border: none !important;
                }
                @page { size: A4; margin: 0; }
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
                        <span className="text-slate-900 dark:text-white text-sm font-medium">Pratinjau Cetak SPK</span>
                    </div>

                    <div className="no-print w-full max-w-4xl flex flex-wrap justify-between items-end gap-3 mb-6">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">Cetak Dokumen SPK</h1>
                            <p className="text-slate-500 text-sm">Pratinjau lembar perintah kerja untuk ditempel di area mesin.</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => window.print()} className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-6 bg-primary text-white font-bold tracking-[0.015em] hover:bg-primary/90 shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined mr-2 text-lg">print</span>
                                <span>Cetak A4</span>
                            </button>
                        </div>
                    </div>

                    {/* Print Area - A4 Size Simulation */}
                    <div className="print-area w-[210mm] min-h-[297mm] bg-white text-black shadow-xl rounded-sm p-12 mb-12 border border-slate-300 relative">
                        {/* Header */}
                        <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-6">
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-widest text-black">SURAT PERINTAH KERJA</h2>
                                <p className="text-sm font-bold mt-1 text-slate-600">Dokumen Internal Produksi - Percetakan Hub</p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <p className="text-sm font-bold uppercase mb-1">Nomor SPK</p>
                                <div className="border-2 border-black px-4 py-2 font-mono text-2xl font-bold tracking-wider">
                                    {spkId}
                                </div>
                            </div>
                        </div>

                        {/* Customer & Timestamp */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="border border-black p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Informasi Klien</p>
                                <p className="font-black text-lg">Bpk. Ahmad Subarjo</p>
                                <p className="text-sm font-medium">PT. Kreatif Digital Indonesia</p>
                                <p className="text-sm">0857-1122-3344</p>
                            </div>
                            <div className="border border-black p-4 flex flex-col justify-center">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-bold uppercase text-slate-500">Tgl Masuk</span>
                                    <span className="text-sm font-bold">24 Okt 2023 10:00</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold uppercase text-slate-500">Tenggat (Deadline)</span>
                                    <span className="text-sm font-black bg-yellow-200 px-2 py-1">26 Okt 2023 15:00</span>
                                </div>
                            </div>
                        </div>

                        {/* Order Specs */}
                        <div className="mb-8">
                            <h3 className="text-lg font-black uppercase mb-3 bg-black text-white py-1 px-3 inline-block">Instruksi Produksi</h3>
                            <table className="w-full border-collapse border-2 border-black">
                                <tbody>
                                    <tr>
                                        <td className="border border-black p-3 font-bold uppercase text-sm w-1/3 bg-slate-100">Item Produk</td>
                                        <td className="border border-black p-3 font-bold text-lg">Buku Nota A5 NCR 3 Ply</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-3 font-bold uppercase text-sm bg-slate-100">Kuantitas</td>
                                        <td className="border border-black p-3 font-black text-2xl">50 Buku</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-3 font-bold uppercase text-sm bg-slate-100">Spesifikasi Bahan</td>
                                        <td className="border border-black p-3 text-sm">
                                            <ul className="list-disc pl-4 font-medium space-y-1">
                                                <li>Kertas NCR (Top Putih, Middle Pink, Bottom Kuning)</li>
                                                <li>Ukuran Potong A5 (14.8 x 21 cm)</li>
                                                <li>Cetak 1 Warna (Hitam)</li>
                                            </ul>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-3 font-bold uppercase text-sm bg-slate-100">Finishing / Pasca Cetak</td>
                                        <td className="border border-black p-3 text-sm">
                                            <ul className="list-disc pl-4 font-bold text-red-600 space-y-1">
                                                <li>Jilid Lem Panas + Tulang Porporasi</li>
                                                <li>Nomorator Berurut: 000001 - 002500</li>
                                                <li>Sampul Kertas Samson</li>
                                            </ul>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Notes */}
                        <div className="mb-12 border-2 border-dashed border-red-500 p-4 relative">
                            <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-black text-red-500 uppercase">Catatan Penting Operator</div>
                            <p className="font-medium text-lg text-slate-800">Pastikan nomorator tidak melompat. Cek register warna hitam agar solid dan tidak berbayang. Reject cetak lebih dari 5 lembar wajib lapor SPV.</p>
                        </div>

                        {/* Checklist & Signatures - Bottom of absolute/relative flow */}
                        <div className="mt-8">
                            <h3 className="text-lg font-black uppercase mb-3 bg-black text-white py-1 px-3 inline-block">Verifikasi Mutu & Serah Terima</h3>
                            <div className="grid grid-cols-4 border-2 border-black">
                                {[
                                    { title: "Desain/Layout", role: "Operator Pracetak" },
                                    { title: "Proses Cetak", role: "Operator Mesin" },
                                    { title: "Finishing", role: "Operator Potong/Jilid" },
                                    { title: "Quality Control", role: "Supervisor" }
                                ].map((step, i) => (
                                    <div key={i} className={`p-4 flex flex-col items-center justify-between min-h-[120px] ${i < 3 ? 'border-r border-black' : ''}`}>
                                        <p className="text-xs font-bold uppercase mb-8">{step.title}</p>
                                        <div className="w-full border-b border-black border-dashed"></div>
                                        <p className="text-[10px] mt-2">{step.role}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Barcode / Scan point */}
                        <div className="absolute bottom-12 right-12 flex flex-col items-end">
                            <div className="w-48 h-12 bg-white flex items-end justify-center gap-[2px] mb-1">
                                {/* Simulated Barcode Lines */}
                                {[...Array(40)].map((_, i) => (
                                    <div key={i} className={`bg-black h-full`} style={{ width: `${Math.floor(Math.random() * 3) + 1}px` }}></div>
                                ))}
                            </div>
                            <p className="text-[10px] font-bold tracking-[0.3em] uppercase">{spkId}</p>
                            <p className="text-[8px] text-slate-500 mt-1">Scan untuk update progress</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
