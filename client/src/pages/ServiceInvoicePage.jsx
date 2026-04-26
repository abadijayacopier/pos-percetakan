import { useState, useEffect } from 'react';
import api from '../services/api';
import { FiCpu, FiPrinter, FiArrowLeft, FiPhone, FiMapPin, FiGlobe, FiMail, FiCheckCircle, FiInfo, FiSettings, FiUser, FiZap } from 'react-icons/fi';

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

    // Tambahkan style cetak format A4 Pro Max
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');

            @media print {
                .no-print { display: none !important; }
                
                body { 
                    background: white !important; 
                    margin: 0 !important;
                    padding: 0 !important;
                    -webkit-print-color-adjust: exact !important; 
                    print-color-adjust: exact !important; 
                    font-family: 'Plus Jakarta Sans', sans-serif !important;
                }

                @page { 
                    size: A4; 
                    margin: 5mm !important; 
                }

                .print-container { 
                    box-shadow: none !important; 
                    border: none !important;
                    width: 100% !important; 
                    max-width: none !important;
                    height: auto !important; 
                    margin: 0 !important; 
                    padding: 0 !important; 
                    background: white !important;
                    border-radius: 0 !important; 
                }

                /* Text & Color Contrast for B/W and Color Printers */
                .text-slate-400, .text-slate-500 { color: #64748b !important; }
                .text-slate-900, .text-black { color: #0f172a !important; }
                .text-blue-600 { color: #2563eb !important; }
                
                /* Layout Compression */
                .header-grid {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: flex-start !important;
                    border-bottom: 1.5pt solid #e2e8f0 !important;
                    padding-bottom: 4mm !important;
                    margin-bottom: 4mm !important;
                }

                .info-grid {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr 1fr !important;
                    gap: 3mm !important;
                    margin-bottom: 4mm !important;
                }

                .compact-section {
                    padding: 3mm !important;
                    border-radius: 8px !important;
                    background: #f8fafc !important;
                    border: 0.5pt solid #e2e8f0 !important;
                }

                .diagnosis-grid {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 3mm !important;
                    margin-bottom: 4mm !important;
                }

                /* Table Pro Max */
                table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 4mm !important; }
                th { 
                    background: #0f172a !important; 
                    color: white !important; 
                    font-size: 8pt !important; 
                    padding: 2mm !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                }
                td { 
                    padding: 2mm !important; 
                    font-size: 8.5pt !important; 
                    border-bottom: 0.5pt solid #f1f5f9 !important;
                }

                /* Signature Tightening */
                .signature-box {
                    margin-top: 5mm !important;
                    display: flex !important;
                    justify-content: space-around !important;
                    text-align: center !important;
                }
                .sig-line {
                    width: 40mm !important;
                    border-top: 1pt solid #0f172a !important;
                    margin-top: 12mm !important;
                    padding-top: 1mm !important;
                    font-size: 8pt !important;
                    font-weight: 800 !important;
                }

                /* Footer decor */
                .footer-banner {
                    background: #0f172a !important;
                    color: white !important;
                    padding: 2mm !important;
                    text-align: center !important;
                    font-size: 7pt !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.2em !important;
                    position: absolute !important;
                    bottom: 0 !important;
                    width: 100% !important;
                }

                /* Font Sizes */
                h1 { font-size: 18pt !important; }
                h2 { font-size: 14pt !important; }
                .text-xs { font-size: 7pt !important; }
                .text-sm { font-size: 8pt !important; }
                .text-lg { font-size: 11pt !important; }
                .text-xl { font-size: 12pt !important; }
                
                /* QR Compression */
                .qr-box { width: 20mm !important; height: 20mm !important; }
            }

            .font-outfit { font-family: 'Outfit', sans-serif; }
            .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

    if (loading) return <div className="p-20 text-center font-bold font-jakarta">Memuat Invoice...</div>;
    if (!service) return (
        <div className="p-20 text-center flex flex-col items-center font-jakarta">
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
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d11] font-jakarta text-slate-900 dark:text-slate-100 pb-20">
            {/* Action Bar */}
            <header className="no-print sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => onNavigate('service')}
                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="font-outfit font-extrabold tracking-tight text-xl text-slate-900 dark:text-white uppercase italic">Pro Service <span className="text-blue-600">Invoice</span></h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mt-0.5">Premium Maintenance Document</p>
                    </div>
                </div>
                <button
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-xl hover:shadow-slate-500/20 transition-all active:scale-95"
                >
                    <FiPrinter /> Cetak Pro Max
                </button>
            </header>

            <main className="max-w-[850px] mx-auto mt-6 px-4 print:mt-0 print:px-0">
                <div className="print-container bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative min-h-[1050px] print:min-h-0 print:h-[287mm] print:rounded-none print:border-none print:shadow-none">
                    
                    {/* Watermark */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.015] print:opacity-[0.03] pointer-events-none rotate-[-35deg] z-0 select-none">
                        <h1 className="text-[10rem] font-black uppercase leading-none">{service.status === 'selesai' ? 'PAID' : 'OFFICIAL'}</h1>
                    </div>

                    <div className="p-6 md:p-10 relative z-10 flex flex-col h-full">
                        {/* Header Pro Max */}
                        <div className="header-grid">
                            <div className="flex items-start gap-5">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 p-2 shadow-inner">
                                    <img src={storeLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                                </div>
                                <div className="space-y-0.5">
                                    <h1 className="text-2xl font-outfit font-black text-slate-900 dark:text-white tracking-tighter leading-tight uppercase">{storeName}</h1>
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.25em]">Premium Office & Service Hub</p>
                                    <div className="pt-2 space-y-0.5 text-[9px] font-bold text-slate-500">
                                        <p className="flex items-center gap-1.5"><FiMapPin className="text-blue-500 text-[10px]" /> {storeAddress}</p>
                                        <p className="flex items-center gap-1.5"><FiPhone className="text-blue-500 text-[10px]" /> {storePhone}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="inline-block bg-slate-900 text-white px-5 py-2.5 rounded-2xl mb-3 shadow-lg">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-left mb-0.5">Ref Number</p>
                                    <p className="text-xl font-outfit font-black tracking-tight">#{service.serviceNo}</p>
                                </div>
                                <div className="text-[9px] font-bold space-y-0.5 text-slate-500 uppercase tracking-wider">
                                    <p>Registered: <span className="text-slate-900 dark:text-slate-300 ml-1">{formatDate(service.entryDate)}</span></p>
                                    <p>Resolved: <span className="text-slate-900 dark:text-slate-300 ml-1">{service.finishDate ? formatDate(service.finishDate) : 'IN PROGRESS'}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* 3-Column Info Section */}
                        <div className="info-grid mt-4">
                            <div className="compact-section bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <FiUser size={10} className="text-blue-500" /> Customer
                                </p>
                                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight">{service.customerName}</h3>
                                <p className="text-[10px] font-bold text-blue-600 mt-0.5">{service.phone}</p>
                            </div>
                            <div className="compact-section bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <FiSettings size={10} className="text-blue-500" /> Equipment
                                </p>
                                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight">{service.machineInfo}</h3>
                                <p className="text-[10px] font-bold text-slate-500 mt-0.5 tracking-tighter">SN: {service.serialNo || '—'}</p>
                            </div>
                            <div className="compact-section bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <FiZap size={10} className="text-blue-500" /> Condition
                                </p>
                                <div className="inline-flex px-2.5 py-0.5 bg-slate-900 dark:bg-blue-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">
                                    {service.status}
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 mt-0.5 italic">Authentic Service</p>
                            </div>
                        </div>

                        {/* Diagnosis row */}
                        <div className="diagnosis-grid mt-4">
                            <div className="border-l-2 border-slate-900 dark:border-slate-600 pl-3 py-0.5">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Reported Issue</p>
                                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-300 italic leading-relaxed">"{service.complaint}"</p>
                            </div>
                            <div className="border-l-2 border-blue-600 pl-3 py-0.5">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Technical Solution</p>
                                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-300 leading-relaxed">{service.diagnosis || 'Ongoing technical inspection and diagnostics.'}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mt-4 flex-grow">
                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <th className="text-left rounded-l-xl py-2 px-4">Maintenance Item</th>
                                        <th className="text-center py-2">Qty</th>
                                        <th className="text-right py-2">Rate</th>
                                        <th className="text-right rounded-r-xl py-2 px-4">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    <tr className="group">
                                        <td className="py-3 px-4">
                                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Technical Service Fee</p>
                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Professional Expertise & Labor</p>
                                        </td>
                                        <td className="text-center text-xs font-bold text-slate-600 dark:text-slate-400">1</td>
                                        <td className="text-right text-xs font-bold text-slate-600 dark:text-slate-400">{formatCurrency(service.laborCost)}</td>
                                        <td className="text-right text-xs font-black text-slate-900 dark:text-white px-4">{formatCurrency(service.laborCost)}</td>
                                    </tr>
                                    {service.spareparts?.map((part, idx) => (
                                        <tr key={idx} className="group">
                                            <td className="py-3 px-4">
                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{part.name}</p>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Hardware Replacement Component</p>
                                            </td>
                                            <td className="text-center text-xs font-bold text-slate-600 dark:text-slate-400">{part.qty}</td>
                                            <td className="text-right text-xs font-bold text-slate-600 dark:text-slate-400">{formatCurrency(part.price)}</td>
                                            <td className="text-right text-xs font-black text-slate-900 dark:text-white px-4">{formatCurrency(part.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Bottom Row: Payments & Sig */}
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-8 items-end">
                            {/* Left: QR & Terms */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <div className="qr-box bg-white p-1 rounded-xl border border-slate-200 shrink-0 shadow-sm">
                                        <QRCode value={`https://wa.me/6285655620979?text=Cek+Status+Service+${service.serviceNo}`} size={64} bordered={false} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Verified Digital Payment</p>
                                        <p className="text-[7.5px] text-slate-500 font-bold leading-tight">Secure settlement via M-Banking or E-Wallets. Scan for direct transaction.</p>
                                        <div className="flex gap-1.5 mt-1">
                                            {['GOPAY', 'OVO', 'QRIS'].map(tag => (
                                                <div key={tag} className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-[4px] text-[6px] font-black text-slate-400 tracking-tighter">{tag}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50/30 dark:bg-blue-900/10 p-3 rounded-2xl border border-blue-100/50 dark:border-blue-900/30">
                                    <p className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                                        <span className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></span> Service Terms
                                    </p>
                                    <ul className="text-[7.5px] font-bold text-slate-500 dark:text-slate-400 space-y-0.5 pl-0.5">
                                        <li className="flex gap-2"><span>•</span> 30-day technical warranty for the same reported issue.</li>
                                        <li className="flex gap-2"><span>•</span> Warranty void if security seal is tampered with or damaged.</li>
                                        <li className="flex gap-2"><span>•</span> Responsibility ceases for units unclaimed after 60 days.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Right: Totals & Signature */}
                            <div className="space-y-4">
                                <div className="bg-slate-900 dark:bg-blue-950 text-white rounded-[2rem] p-5 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
                                    <div className="space-y-1.5 relative z-10">
                                        <div className="flex justify-between items-center opacity-40">
                                            <span className="text-[9px] font-black uppercase tracking-widest">Base Amount</span>
                                            <span className="text-xs font-bold font-mono">{formatCurrency(service.totalCost)}</span>
                                        </div>
                                        {service.dpAmount > 0 && (
                                            <div className="flex justify-between items-center text-blue-400">
                                                <span className="text-[9px] font-black uppercase tracking-widest">Advanced Deposit</span>
                                                <span className="text-xs font-bold font-mono">-{formatCurrency(service.dpAmount)}</span>
                                            </div>
                                        )}
                                        <div className="pt-2 mt-2 border-t border-white/10 flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.25em]">Grand Total</p>
                                                <p className="text-[7.5px] opacity-30 font-bold uppercase tracking-tighter">Verified Settlement Amount</p>
                                            </div>
                                            <p className="text-3xl font-outfit font-black tracking-tighter italic">
                                                {formatCurrency(service.totalCost - (service.dpAmount || 0))}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="signature-box">
                                    <div className="flex flex-col items-center">
                                        <p className="text-[8px] font-black text-slate-400 uppercase mb-10 tracking-widest">Authorized Receiver</p>
                                        <div className="sig-line border-t border-slate-900 dark:border-slate-400 w-32 pt-1 font-black text-[9px] uppercase tracking-tighter">{service.customerName}</div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <p className="text-[8px] font-black text-slate-400 uppercase mb-10 tracking-widest">Service Technician</p>
                                        <div className="sig-line border-t border-slate-900 dark:border-slate-400 w-32 pt-1 font-black text-[9px] tracking-tighter">ABADI JAYA STAFF</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Footer Pro Max */}
                        <div className="mt-8 pt-4 flex items-center gap-4 text-[8px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em] justify-center">
                            <span className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></span>
                            AUTHENTIC QUALITY • PREMIUM SERVICE • EXCELLENCE GUARANTEED
                            <span className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></span>
                        </div>
                    </div>
                </div>

                <footer className="mt-6 text-center no-print pb-10">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">&copy; 2026 ABADI JAYA POS • ENTERPRISE SOLUTIONS</p>
                </footer>
            </main>
        </div>
    );
}
