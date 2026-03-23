import { useState, useEffect } from 'react';
import api from '../services/api';
import { FiCpu, FiPrinter, FiArrowLeft, FiPhone, FiMapPin, FiGlobe, FiMail, FiCheckCircle } from 'react-icons/fi';

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

export default function ServiceInvoicePage({ onNavigate, pageState }) {
    const serviceId = pageState?.serviceId || null;
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({});

    useEffect(() => {
        const loadData = async () => {
            try {
                if (serviceId) {
                    const res = await api.get(`/service/${serviceId}`);
                    setService(res.data);
                }

                const setRes = await api.get('/settings');
                const sObj = {};
                setRes.data.forEach(s => sObj[s.key] = s.value);
                setSettings(sObj);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [serviceId]);

    // Tambahkan style cetak format A4
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
                    padding: 10mm !important; 
                    max-width: none !important;
                }
                @page { size: auto; margin: 0; }
                body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

    if (loading) return <div className="p-20 text-center font-bold">Memuat Invoice...</div>;
    if (!service) return (
        <div className="p-20 text-center flex flex-col items-center">
            <FiCpu size={48} className="text-slate-300 mb-4" />
            <h2 className="text-xl font-bold">Tiket Servis Tidak Ditemukan</h2>
            <button onClick={() => onNavigate('service')} className="mt-4 text-blue-600 font-bold">Kembali ke Daftar Servis</button>
        </div>
    );

    const storeName = settings.store_name || 'ABADI JAYA';
    const storeAddress = settings.store_address || 'Jl. Contoh No. 123, Kota';
    const storePhone = settings.store_phone || '021-12345678';
    const storeLogo = settings.store_logo || '/logo.png';

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-[#0f1117] font-display text-slate-900 dark:text-slate-100 pb-20">
            {/* Action Bar */}
            <header className="no-print sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onNavigate('service')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <FiArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="font-black tracking-tighter uppercase text-lg italic">Service Invoice</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Dokumen Penyerahan & Invoice</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.print()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-95"
                    >
                        <FiPrinter /> Cetak Dokumen
                    </button>
                </div>
            </header>

            <main className="max-w-[850px] mx-auto mt-8 px-4 print:mt-0 print:px-0">
                <div className="print-container bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">

                    {/* Watermark Status */}
                    {service.status === 'selesai' && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none rotate-[-35deg]">
                            <FiCheckCircle size={500} />
                        </div>
                    )}

                    {/* Top Accent Bar */}
                    <div className="h-4 bg-linear-to-r from-blue-600 via-blue-400 to-emerald-400"></div>

                    <div className="p-10 md:p-14">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-slate-100 dark:border-slate-800 pb-10 mb-10">
                            <div className="space-y-5">
                                <div className="flex items-center gap-5">
                                    <div className="w-20 h-20 bg-white dark:bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-800 p-2 overflow-hidden">
                                        <img src={storeLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-none italic uppercase tracking-tighter">{storeName}</h1>
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-2">Specialist Maintenance & Parts</p>
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-sm text-slate-500 font-medium font-sans">
                                    <p className="flex items-center gap-2"><FiMapPin className="text-blue-500" size={14} /> {storeAddress}</p>
                                    <p className="flex items-center gap-2"><FiPhone className="text-blue-500" size={14} /> {storePhone}</p>
                                    <p className="flex items-center gap-2"><FiGlobe className="text-blue-500" size={14} /> www.abadijayapos.com</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <h1 className="text-5xl font-black text-slate-200 dark:text-slate-800 italic uppercase leading-none tracking-tighter mb-4 select-none">Invoice</h1>
                                <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md shadow-blue-500/10">
                                    <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest text-left leading-none mb-1">Service Number</p>
                                    <p className="text-xl font-black tracking-tight leading-none">#{service.serviceNo}</p>
                                </div>
                                <div className="mt-4 space-y-1">
                                    <p className="text-xs font-bold text-slate-400">Entry Date: <span className="text-slate-700 dark:text-slate-300 ml-2">{formatDate(service.entryDate)}</span></p>
                                    <p className="text-xs font-bold text-slate-400">Finish Date: <span className="text-slate-700 dark:text-slate-300 ml-2">{service.finishDate ? formatDate(service.finishDate) : '-'}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Customer & Machine Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Customer Info
                                </p>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{service.customerName}</h3>
                                <p className="text-sm font-bold text-blue-600 mt-1">{service.phone}</p>
                                <p className="text-sm text-slate-500 mt-2 font-medium">Pelanggan Setia Abadi Jaya</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Machine Details
                                </p>
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                        <span className="text-xs font-bold text-slate-400">Model :</span>
                                        <span className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase italic">{service.machineInfo}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs font-bold text-slate-400">Serial :</span>
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{service.serialNo || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Diagnosis Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Keluhan / Masalah</h4>
                                <p className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-5 rounded-2xl text-sm font-medium text-red-700 dark:text-red-400 italic">
                                    "{service.complaint}"
                                </p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Hasil Analisa / Diagnosis</h4>
                                <p className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-5 rounded-2xl text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                    {service.diagnosis || 'Sedang dalam pengecekan teknisi.'}
                                </p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-10 rounded-4xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                        <th className="px-8 py-5 text-left">Deskripsi Pekerjaan / Part</th>
                                        <th className="px-8 py-5 text-center">Qty</th>
                                        <th className="px-8 py-5 text-right">Harga Satuan</th>
                                        <th className="px-8 py-5 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {/* Labor Cost */}
                                    <tr className="text-sm group">
                                        <td className="px-8 py-6">
                                            <p className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Biaya Jasa & Pengecekan</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Maintenance & Labor Fee</p>
                                        </td>
                                        <td className="px-8 py-6 text-center font-bold text-slate-500">1</td>
                                        <td className="px-8 py-6 text-right font-bold text-slate-500">{formatCurrency(service.laborCost)}</td>
                                        <td className="px-8 py-6 text-right font-black text-slate-800 dark:text-white italic">{formatCurrency(service.laborCost)}</td>
                                    </tr>
                                    {/* Spareparts */}
                                    {service.spareparts?.map((part, idx) => (
                                        <tr key={idx} className="text-sm group">
                                            <td className="px-8 py-6">
                                                <p className="font-bold text-slate-700 dark:text-slate-200">{part.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">Ganti Sparepart Baru</p>
                                            </td>
                                            <td className="px-8 py-6 text-center font-bold text-slate-500">{part.qty}</td>
                                            <td className="px-8 py-6 text-right font-bold text-slate-500">{formatCurrency(part.price)}</td>
                                            <td className="px-8 py-6 text-right font-bold text-slate-700 dark:text-slate-200">{formatCurrency(part.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                            <div className="space-y-6">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-6">
                                    <div className="bg-white p-2 rounded-2xl shadow-inner shrink-0 leading-none">
                                        <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-slate-200">
                                            {/* Placeholder for QRIS */}
                                            <span className="material-symbols-outlined text-6xl">qr_code_2</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2 mb-1 italic">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div> Scan To Pay
                                        </h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-1">Abadi Raya Payment Gateway</p>
                                        <p className="text-[9px] text-slate-500 font-medium leading-none">Menerima GoPay, OVO, Dana, Shopee & M-Banking</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 italic">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Terms & Warranty</p>
                                    <p className="text-[9px] text-slate-500 leading-relaxed">
                                        * Garansi servis selama 30 hari untuk kerusakan yang sama.<br />
                                        * Garansi tidak berlaku bila segel rusak atau unit terkena cairan/petir.<br />
                                        * Barang yang sudah diambil tidak dapat dikembalikan.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Subtotal Biaya</span>
                                    <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{formatCurrency(service.totalCost)}</span>
                                </div>
                                {service.dpAmount > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Uang Muka (DP)</span>
                                        <span className="text-lg font-bold text-emerald-600">-{formatCurrency(service.dpAmount)}</span>
                                    </div>
                                )}
                                <div className="bg-blue-600 dark:bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-500/20 flex justify-between items-center">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 leading-none">Total Tagihan</span>
                                        <p className="text-xs mt-1 font-bold opacity-60 italic">Grand Total</p>
                                    </div>
                                    <span className="text-3xl font-black tracking-tighter italic">
                                        {formatCurrency(service.totalCost - (service.dpAmount || 0))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-8 mt-20 pt-10 text-center">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-16">Penerima / Customer</p>
                                <div className="h-px w-48 bg-slate-200 dark:bg-slate-700 mx-auto"></div>
                                <p className="mt-2 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{service.customerName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-16">Hormat Kami, Teknisi</p>
                                <div className="h-px w-48 bg-slate-200 dark:bg-slate-700 mx-auto"></div>
                                <p className="mt-2 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{service.technicianName || 'Teknisi Abadi Jaya'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Footer Decor */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 py-4 px-10 text-center border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Thank you for choosing Abadi Jaya Service Center</p>
                    </div>
                </div>

                <footer className="mt-8 text-center no-print">
                    <p className="text-xs text-slate-400 font-medium">&copy; 2026 Abadi Jaya Solutions. Designed for Excellence.</p>
                </footer>
            </main>
        </div>
    );
}
