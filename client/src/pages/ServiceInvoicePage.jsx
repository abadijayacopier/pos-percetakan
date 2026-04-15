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
                
                /* Reset background for print */
                body { 
                    background: white !important; 
                    margin: 0 !important;
                    padding: 0 !important;
                    -webkit-print-color-adjust: exact !important; 
                    print-color-adjust: exact !important; 
                }

                .print-container { 
                    box-shadow: none !important; 
                    border: none !important;
                    width: 100% !important; 
                    height: auto !important; 
                    margin: 0 !important; 
                    padding: 5mm !important; 
                    background: white !important;
                    border-radius: 0 !important; 
                }

                /* Standardize Font Contrast for Print */
                .text-slate-400, .text-slate-500, .text-slate-200, .text-slate-300 { 
                    color: #475569 !important; /* Darker slate-600 */
                }
                .text-slate-900, .text-white { 
                    color: black !important; 
                }
                .bg-blue-600 { 
                    background-color: #2563eb !important; 
                    color: white !important;
                    -webkit-print-color-adjust: exact !important;
                }

                /* Header Alignment Fixes */
                .header-grid {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 10mm !important;
                    align-items: start !important;
                }

                @page { 
                    size: A4; 
                    margin: 10mm; 
                }

                /* Deep Design Thinking: Compact Spacing for 1-Page A4 */
                main { margin: 0 !important; padding: 0 !important; max-width: none !important; }
                .p-10, .md\\:p-14 { padding: 0 !important; }
                .p-6 { padding: 4mm !important; }
                .mb-10 { margin-bottom: 5mm !important; }
                .mt-20 { margin-top: 10mm !important; }
                .pt-10 { padding-top: 5mm !important; }
                .gap-8 { gap: 4mm !important; }
                
                /* Layout Preservation */
                .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                .grid { display: grid !important; }
                
                /* Border Adjustments */
                .rounded-4xl, .rounded-3xl, .rounded-2xl { border-radius: 6px !important; }
                .border-2 { border-width: 1px !important; border-color: #cbd5e1 !important; }
                .border-slate-900 { border-color: #0f172a !important; }
                
                /* Prevent Page Breaks */
                .print-container > div, tr, table, .grid > div {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }
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
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] print:opacity-[0.05] pointer-events-none rotate-[-35deg] z-0">
                            <FiCheckCircle size={500} />
                        </div>
                    )}

                    {/* Top Accent Bar */}
                    <div className="h-4 bg-linear-to-r from-blue-600 via-blue-400 to-emerald-400 print:h-2"></div>

                    <div className="p-10 md:p-14">
                        {/* Header Section */}
                        <div className="header-grid border-b-2 border-slate-900 pb-10 mb-10">
                            <div className="space-y-5">
                                <div className="flex items-center gap-5">
                                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center border-2 border-slate-900 p-2 overflow-hidden">
                                        <img src={storeLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black text-slate-900 leading-none uppercase tracking-tighter">{storeName}</h1>
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-2">Specialist Maintenance & Parts</p>
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-xs text-slate-700 font-bold font-sans">
                                    <p className="flex items-center gap-2"><FiMapPin className="text-blue-600" size={14} /> {storeAddress}</p>
                                    <p className="flex items-center gap-2"><FiPhone className="text-blue-600" size={14} /> {storePhone}</p>
                                    <p className="flex items-center gap-2"><FiGlobe className="text-blue-600" size={14} /> {settings.store_website || 'www.abadijaya.web.id'}</p>
                                </div>
                            </div>

                            <div className="text-right flex flex-col items-end">
                                <h1 className="text-5xl print:text-5xl font-black text-slate-900 print:text-slate-200 uppercase leading-none tracking-tighter mb-4 select-none">Invoice</h1>
                                <div className="bg-blue-600 text-white px-6 py-3 rounded-xl print:border-2 print:border-blue-600 min-w-[200px]">
                                    <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] text-left leading-none mb-2">Service Number</p>
                                    <p className="text-2xl font-black tracking-tight leading-none">#{service.serviceNo}</p>
                                </div>
                                <div className="mt-6 space-y-2 text-right w-full">
                                    <div className="flex justify-end gap-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</span>
                                        <span className="text-xs font-black text-slate-900">{formatDate(service.entryDate)}</span>
                                    </div>
                                    <div className="flex justify-end gap-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Finish Date</span>
                                        <span className="text-xs font-black text-slate-900">{service.finishDate ? formatDate(service.finishDate) : '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer & Machine Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-900">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Customer Info
                                </p>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{service.customerName}</h3>
                                <p className="text-sm font-black text-blue-600 mt-1">{service.phone}</p>
                                <p className="text-sm text-slate-700 mt-2 font-bold italic">Pelanggan Setia Abadi Jaya</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-900">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div> Machine Details
                                </p>
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b-2 border-slate-200 pb-2">
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">Model :</span>
                                        <span className="text-sm font-black text-slate-900 uppercase italic">{service.machineInfo}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">Serial :</span>
                                        <span className="text-sm font-black text-slate-900">{service.serialNo || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Diagnosis Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Keluhan / Masalah</h4>
                                <p className="bg-red-50 border-2 border-red-200 p-5 rounded-2xl text-sm font-black text-red-900 italic">
                                    "{service.complaint}"
                                </p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Hasil Analisa / Diagnosis</h4>
                                <p className="bg-emerald-50 border-2 border-emerald-200 p-5 rounded-2xl text-sm font-black text-emerald-900">
                                    {service.diagnosis || 'Sedang dalam pengecekan teknisi.'}
                                </p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-10 rounded-2xl border-2 border-slate-900 overflow-hidden shadow-sm">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                                        <th className="px-8 py-5 text-left">Deskripsi Pekerjaan / Part</th>
                                        <th className="px-8 py-5 text-center">Qty</th>
                                        <th className="px-8 py-5 text-right">Harga Satuan</th>
                                        <th className="px-8 py-5 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-slate-200">
                                    {/* Labor Cost */}
                                    <tr className="text-sm">
                                        <td className="px-8 py-6">
                                            <p className="font-black text-slate-900 uppercase tracking-tight">Biaya Jasa & Pengecekan</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">Maintenance & Labor Fee</p>
                                        </td>
                                        <td className="px-8 py-6 text-center font-black text-slate-700">1</td>
                                        <td className="px-8 py-6 text-right font-black text-slate-700">{formatCurrency(service.laborCost)}</td>
                                        <td className="px-8 py-6 text-right font-black text-slate-900 italic">{formatCurrency(service.laborCost)}</td>
                                    </tr>
                                    {/* Spareparts */}
                                    {service.spareparts?.map((part, idx) => (
                                        <tr key={idx} className="text-sm">
                                            <td className="px-8 py-6">
                                                <p className="font-black text-slate-800">{part.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Ganti Sparepart Baru</p>
                                            </td>
                                            <td className="px-8 py-6 text-center font-black text-slate-700">{part.qty}</td>
                                            <td className="px-8 py-6 text-right font-black text-slate-700">{formatCurrency(part.price)}</td>
                                            <td className="px-8 py-6 text-right font-black text-slate-800">{formatCurrency(part.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                            <div className="space-y-6">
                                <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-900 flex items-center gap-6">
                                    <div className="bg-white p-2 rounded-2xl shadow-inner shrink-0 leading-none border-2 border-slate-900">
                                        <div className="w-24 h-24 bg-white flex items-center justify-center text-slate-900">
                                            <span className="material-symbols-outlined text-6xl">qr_code_2</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-1 italic">
                                            <div className="w-2 h-2 rounded-full bg-blue-600"></div> Scan To Pay
                                        </h4>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed mb-1">Abadi Raya Payment Gateway</p>
                                        <p className="text-[9px] text-slate-900 font-black leading-none">Menerima GoPay, OVO, Dana, Shopee & M-Banking</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl border-2 border-slate-200 italic">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">Terms & Warranty</p>
                                    <p className="text-[9px] text-slate-900 font-bold leading-relaxed">
                                        * Garansi servis selama 30 hari untuk kerusakan yang sama.<br />
                                        * Garansi tidak berlaku bila segel rusak atau unit terkena cairan/petir.<br />
                                        * Barang yang sudah diambil tidak dapat dikembalikan.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b-2 border-slate-900">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtotal Biaya</span>
                                    <span className="text-xl font-black text-slate-900">{formatCurrency(service.totalCost)}</span>
                                </div>
                                {service.dpAmount > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b-2 border-slate-900">
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Uang Muka (DP)</span>
                                        <span className="text-xl font-black text-red-600">-{formatCurrency(service.dpAmount)}</span>
                                    </div>
                                )}
                                <div className="bg-slate-900 p-6 rounded-3xl text-white flex justify-between items-center border-2 border-slate-900">
                                    <div className="text-left">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 leading-none text-blue-400">Total Tagihan</span>
                                        <p className="text-xs mt-1 font-bold italic">Grand Total</p>
                                    </div>
                                    <span className="text-4xl font-black tracking-tighter italic flex-1 text-right whitespace-nowrap">
                                        {formatCurrency(service.totalCost - (service.dpAmount || 0))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-20 mt-20 pt-10 text-center">
                            <div className="flex flex-col items-center">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-20">Penerima / Customer</p>
                                <div className="h-[2px] w-56 bg-slate-900 mx-auto"></div>
                                <p className="mt-3 text-sm font-black text-slate-900 uppercase tracking-tight italic">{service.customerName}</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-20">Hormat Kami, Teknisi</p>
                                <div className="h-[2px] w-56 bg-slate-900 mx-auto"></div>
                                <p className="mt-3 text-sm font-black text-slate-900 uppercase tracking-tight">{service.technicianName || 'Teknisi Abadi Jaya'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Footer Decor */}
                    <div className="bg-slate-100 py-6 px-10 text-center border-t-2 border-slate-900 mt-auto">
                        <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">Thank you for choosing Abadi Jaya Service Center</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 italic uppercase tracking-widest">Quality Service Is Our Commitment</p>
                    </div>
                </div>

                <footer className="mt-8 text-center no-print">
                    <p className="text-xs text-slate-400 font-medium">&copy; 2026 Abadi Jaya Solutions. Designed for Excellence.</p>
                </footer>
            </main>
        </div>
    );
}
