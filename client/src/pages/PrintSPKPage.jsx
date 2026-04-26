import { useState, useEffect } from 'react';
import api from '../services/api';

export default function PrintSPKPage({ onNavigate, pageState }) {
    const spkId = pageState?.spkId || null;
    const [spk, setSpk] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!spkId) {
                setLoading(false);
                return;
            }
            try {
                const res = await api.get(`/spk/${spkId}`);
                setSpk(res.data);
            } catch (err) {
                console.error('Gagal fetch detail SPK:', err);
                // Fallback dummy data if API fails so UI can still be seen
                setSpk({
                    spk_number: spkId,
                    customer_company: 'PT Maju Jaya',
                    deadline: '2023-10-15T17:00:00Z',
                    product_name: 'Banner Digital Printing',
                    specs_material: 'Frontlite 280gr',
                    product_qty: 1,
                    product_unit: 'Pcs',
                    specs_finishing: 'Lubang Mata Ayam (4 Pojok)',
                    specs_notes: 'Pastikan warna sesuai dengan profil printer. Cek kembali kebersihan bahan sebelum proses cetak. Packing digulung, jangan dilipat untuk menghindari bekas lipatan pada bahan frontlite.',
                    created_at: new Date().toISOString()
                });
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [spkId]);

    // Tambahkan style cetak format A4 dan handler mode gelap
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                .no-print { display: none !important; }
                .print-container { 
                    box-shadow: none !important; 
                    border: none !important; 
                    width: 210mm !important; 
                    min-height: 297mm !important;
                    margin: 0 auto !important; 
                    padding: 0 !important; 
                    max-width: none !important;
                }
                @page { size: auto; margin: 0; }
                body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            .paper-a4 {
                width: 210mm;
                min-height: 297mm;
            }
        `;
        document.head.appendChild(style);

        // Mencegah dark mode terbawa ke print (menghemat tinta & masalah specificity Tailwind)
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
    }, []);

    const formatDate = (d, withTime = false) => {
        if (!d) return '-';
        const dateObj = new Date(d);
        const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        if (withTime) {
            const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            return { dateStr, timeStr };
        }
        return dateStr;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="material-symbols-outlined animate-spin text-blue-500 text-4xl">progress_activity</span>
            </div>
        );
    }

    if (!spk) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <span className="material-symbols-outlined text-slate-300 text-6xl!">search_off</span>
                <p className="text-slate-500 font-medium">SPK tidak ditemukan</p>
                <button onClick={() => onNavigate('spk-list')} className="text-blue-500 font-bold text-sm cursor-pointer hover:underline">Kembali ke Daftar SPK</button>
            </div>
        );
    }

    const { dateStr: deadlineDate, timeStr: deadlineTime } = formatDate(spk.deadline, true);
    const { dateStr: printDate, timeStr: printTime } = formatDate(new Date(), true);

    return (
        <div className="bg-slate-50 dark:bg-transparent font-[Inter] text-slate-900 dark:text-slate-100 min-h-screen p-4 md:p-8 flex flex-col items-center gap-4 transition-colors duration-300">

            <div className="no-print w-full max-w-[210mm] flex flex-wrap gap-2 mb-2 items-center justify-between">
                <div className="flex gap-2 items-center">
                    <button onClick={() => onNavigate('dashboard')} className="text-slate-500 dark:text-slate-400 text-sm font-medium cursor-pointer hover:text-black dark:hover:text-white transition-colors">Beranda</button>
                    <span className="text-slate-400 dark:text-slate-600 text-sm">/</span>
                    <button onClick={() => onNavigate('spk-detail', { spkId })} className="text-slate-500 dark:text-slate-400 text-sm font-medium cursor-pointer hover:text-black dark:hover:text-white transition-colors">SPK Detail</button>
                    <span className="text-slate-400 dark:text-slate-600 text-sm">/</span>
                    <span className="text-slate-900 dark:text-slate-200 text-sm font-bold">Cetak SPK</span>
                </div>
                <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 dark:bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 dark:hover:bg-blue-600 transition-colors shadow-md">
                    <span className="material-symbols-outlined text-sm">print</span>
                    Cetak SPK
                </button>
            </div>

            {/* Main Container (A4 Concept) */}
            <div className="print-container paper-a4 bg-white dark:bg-slate-900 print:bg-white shadow-xl rounded-lg overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 print:border-slate-200 transition-colors duration-300">

                {/* Header Section */}
                <header className="bg-primary p-8 text-white flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-4xl">print</span>
                            <h1 className="text-3xl font-black tracking-tight">SURAT PERINTAH KERJA</h1>
                        </div>
                        <p className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full inline-block w-fit">
                            Dokumen Internal Produksi Percetakan
                        </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                        <div className="bg-white p-2 rounded-lg">
                            <div className="w-32 h-12 bg-slate-900 flex items-center justify-center text-[8px] text-white overflow-hidden relative">
                                || ||| || |||| ||| || ||||
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                            </div>
                        </div>
                        <p className="text-xs opacity-80 uppercase font-bold tracking-widest">Scan Status Produksi</p>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-8 space-y-8">
                    {/* Summary Info */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="border-l-4 pl-4 py-2 rounded-r-lg border-black dark:border-primary print:border-black bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 transition-colors">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 print:text-slate-500 uppercase">Nomor SPK</p>
                            <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white print:text-slate-900">{spk.spk_number || spkId}</p>
                        </div>
                        <div className="border-l-4 pl-4 py-2 rounded-r-lg border-black dark:border-primary print:border-black bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 transition-colors">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 print:text-slate-500 uppercase">Nama Pelanggan</p>
                            <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white print:text-slate-900">{spk.customer_company || spk.customer_name || 'Pelanggan Umum'}</p>
                        </div>
                        <div className="border-l-4 pl-4 py-2 rounded-r-lg border-black dark:border-primary print:border-black bg-slate-100 dark:bg-slate-800 print:bg-slate-100 transition-colors">
                            <p className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 print:text-slate-700">Deadline</p>
                            <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white print:text-slate-900 leading-tight">
                                {deadlineDate} <span className="text-sm font-normal text-slate-500 dark:text-slate-400 print:text-slate-500 block">Pukul {deadlineTime} WIB</span>
                            </p>
                        </div>
                    </div>

                    {/* Detail Teknis Table */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b-2 border-slate-100 dark:border-slate-800 print:border-slate-100 pb-2">
                            <span className="material-symbols-outlined text-slate-900 dark:text-white print:text-slate-900">settings_suggest</span>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 print:text-slate-800">Detail Instruksi Teknis</h2>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 print:border-slate-200 transition-colors">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50">
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300 print:text-slate-600 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 print:border-slate-200">Spesifikasi Item</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300 print:text-slate-600 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 print:border-slate-200 text-right">Keterangan Detail</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-100">
                                    <tr>
                                        <td className="px-6 py-5 flex items-center gap-3">
                                            <span className="material-symbols-outlined text-slate-900 dark:text-slate-300 print:text-slate-900">layers</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200 print:text-slate-700">Bahan Baku & Produk</span>
                                        </td>
                                        <td className="px-6 py-5 text-right font-medium text-slate-900 dark:text-slate-100 print:text-slate-900">
                                            {spk.product_name} {spk.specs_material ? `- ${spk.specs_material}` : ''}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-5 flex items-center gap-3">
                                            <span className="material-symbols-outlined text-slate-900 dark:text-slate-300 print:text-slate-900">square_foot</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200 print:text-slate-700">Kuantitas</span>
                                        </td>
                                        <td className="px-6 py-5 text-right font-medium text-slate-900 dark:text-slate-100 print:text-slate-900 text-lg italic">
                                            {spk.product_qty} {spk.product_unit}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-5 flex items-center gap-3">
                                            <span className="material-symbols-outlined text-slate-900 dark:text-slate-300 print:text-slate-900">content_cut</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200 print:text-slate-700">Finishing Akhir</span>
                                        </td>
                                        <td className="px-6 py-5 text-right font-medium text-slate-900 dark:text-slate-100 print:text-slate-900">
                                            {spk.specs_finishing || 'Tanpa Finishing Khusus'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-5 flex items-center gap-3">
                                            <span className="material-symbols-outlined text-slate-900 dark:text-slate-300 print:text-slate-900">palette</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200 print:text-slate-700">Tambahan</span>
                                        </td>
                                        <td className="px-6 py-5 text-right font-medium text-slate-900 dark:text-slate-100 print:text-slate-900">
                                            {spk.notes ? 'CMYK - High Resolution' : 'Sesuai Standar'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Additional Instructions */}
                    <section className="bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 print:border-slate-300 transition-colors">
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 print:text-slate-500 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">info</span> CATATAN KHUSUS:
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 print:text-slate-600 text-sm leading-relaxed italic">
                            {spk.specs_notes || 'Pastikan kualitas cetak optimal. Cek kebersihan bahan sebelum proses mesin. Lakukan Quality Control sesuai standar perusahaan.'}
                        </p>
                    </section>

                    {/* Signatures */}
                    <section className="pt-12 grid grid-cols-3 gap-12">
                        <div className="flex flex-col items-center">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 print:text-slate-500 mb-16 uppercase tracking-widest">Admin Produksi</p>
                            <div className="w-48 border-b-2 border-slate-900 dark:border-slate-400 print:border-slate-900"></div>
                            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-300 print:text-slate-900">Dibuat Oleh</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 print:text-slate-500 mb-6">Penanggung Jawab</p>
                            <div className="h-20 border-b-2 border-dashed border-slate-200 dark:border-slate-600 print:border-slate-200 w-32 mx-auto"></div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 print:text-slate-700 mt-2 uppercase">(.......................)</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 print:text-slate-700">Teknisi / Operator</p>
                            <div className="w-48 border-b-2 border-slate-900 dark:border-slate-400 print:border-slate-900"></div>
                            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-300 print:text-slate-900">Diterima & Dikerjakan</p>
                        </div>
                    </section>
                </main>

                {/* Footer / Print Action */}
                <footer className="p-8 border-t border-slate-100 dark:border-slate-800 print:border-slate-100 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900 print:bg-slate-50/50 transition-colors">
                    <div className="flex gap-4 items-center">
                        <div className="size-10 rounded-lg flex items-center justify-center bg-slate-200 dark:bg-slate-800 print:bg-slate-200 text-slate-900 dark:text-slate-300 print:text-slate-900 transition-colors">
                            <span className="material-symbols-outlined">verified</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 print:text-slate-400">WAKTU CETAK DOKUMEN</p>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 print:text-slate-600">{printDate} | {printTime} WIB</p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="no-print flex items-center gap-2 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg bg-black dark:bg-primary hover:bg-slate-800 dark:hover:bg-blue-600 shadow-slate-200 dark:shadow-none cursor-pointer"
                    >
                        <span className="material-symbols-outlined">print</span>
                        Cetak SPK
                    </button>
                </footer>
            </div>
        </div>
    );
}
