import { useState, useEffect } from 'react';
import api from '../services/api';
import { FiArrowLeft, FiPrinter, FiShield, FiCalendar, FiBox } from 'react-icons/fi';

export default function ServiceWarrantyStickerPage({ onNavigate, pageState }) {
    const serviceId = pageState?.serviceId || null;
    const [service, setService] = useState(null);
    const [settings, setSettings] = useState({});
    const [serviceWarranty, setServiceWarranty] = useState('1 Minggu');
    const [sparepartWarranty, setSparepartWarranty] = useState('None');
    const [loading, setLoading] = useState(true);

    const periods = ['None', '1 Minggu', '2 Minggu', '1 Bulan'];

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

    if (loading) return <div className="p-20 text-center font-bold">Memuat...</div>;
    if (!service) return (
        <div className="p-20 text-center">
            <h2 className="text-xl font-bold">Data servis tidak ditemukan</h2>
            <button onClick={() => onNavigate('service')} className="mt-4 text-blue-600 font-bold">Kembali</button>
        </div>
    );

    const storeName = settings.store_name || 'ABADI JAYA';
    const storePhone = settings.store_phone || '081234567890';

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-[#0f1117] font-display pb-20">
            {/* Header / Actions */}
            <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate('service')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                        <FiArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="font-black uppercase italic text-lg">Cetak Stiker Garansi</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih durasi garansi untuk unit ini</p>
                    </div>
                </div>
                <button
                    onClick={() => window.print()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                >
                    <FiPrinter /> Cetak Stiker
                </button>
            </header>

            <main className="max-w-[800px] mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                {/* Configuration Panel */}
                <div className="no-print bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FiShield className="text-blue-500" />
                            <h3 className="font-black uppercase text-sm tracking-wider">Garansi Servis</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {periods.map(p => (
                                <button
                                    key={p}
                                    onClick={() => setServiceWarranty(p)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${serviceWarranty === p
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {p === 'None' ? 'Tanpa Garansi' : p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FiBox className="text-emerald-500" />
                            <h3 className="font-black uppercase text-sm tracking-wider">Garansi Sparepart</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {periods.map(p => (
                                <button
                                    key={p}
                                    onClick={() => setSparepartWarranty(p)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sparepartWarranty === p
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {p === 'None' ? 'Tanpa Garansi' : p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold leading-relaxed">
                            <strong>Note:</strong> Stiker ini didesain ringkas untuk ditempel pada unit.
                            Gunakan printer label thermal untuk hasil terbaik.
                        </p>
                    </div>
                </div>

                {/* Preview Container */}
                <div className="space-y-4">
                    <h3 className="no-print font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] ml-2 italic">Live Preview</h3>

                    {/* The Sticker Itself */}
                    <div className="sticker-print bg-white rounded-lg shadow-lg mx-auto overflow-hidden p-[10mm] border border-slate-200"
                        style={{
                            width: '80mm',
                            height: 'auto',
                            minHeight: '40mm',
                            color: '#000',
                            fontFamily: 'monospace'
                        }}>
                        <div className="text-center border-b border-black pb-2 mb-2">
                            <h1 style={{ fontSize: '14pt', fontWeight: 'bold', margin: 0 }}>{storeName}</h1>
                            <p style={{ fontSize: '8pt', margin: 0 }}>Telp: {storePhone}</p>
                        </div>

                        <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
                                <span>No: #{service.serviceNo.split('-').pop()}</span>
                                <span>Tgl: {new Date().toLocaleDateString('id-ID')}</span>
                            </div>
                            <div style={{ wordBreak: 'break-all', marginBottom: '2mm', textTransform: 'uppercase' }}>
                                UNIT: {service.machineInfo} {service.serialNo ? `(SN: ${service.serialNo})` : ''}
                            </div>
                        </div>

                        <div style={{ border: '1.5pt solid #000', padding: '1.5mm', borderRadius: '1mm' }}>
                            <h2 style={{ fontSize: '9pt', fontWeight: 'bold', margin: '0 0 1mm 0', textAlign: 'center', background: '#000', color: '#fff' }}>STIKER GARANSI</h2>

                            <div style={{ fontSize: '8.5pt' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '0.5pt dashed #000', paddingBottom: '1mm', marginBottom: '1mm' }}>
                                    <span>GARANSI SERVIS</span>
                                    <span style={{ fontWeight: 'bold' }}>{serviceWarranty === 'None' ? '---' : serviceWarranty.toUpperCase()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>GARANSI PART</span>
                                    <span style={{ fontWeight: 'bold' }}>{sparepartWarranty === 'None' ? '---' : sparepartWarranty.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>

                        <p style={{ fontSize: '7pt', textAlign: 'center', marginTop: '3mm', fontStyle: 'italic' }}>
                            *Segel Rusak Garansi Hilang*
                        </p>
                    </div>

                    <p className="no-print text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                        Ukuran Stiker: 80mm x Otomatis
                    </p>
                </div>
            </main>

            <style>{`
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                @media print {
                    html, body { 
                        background: white !important; 
                        padding: 0 !important; 
                        margin: 0 !important; 
                        width: 80mm !important;
                    }
                    .no-print { display: none !important; }
                    .sticker-print { 
                        box-shadow: none !important; 
                        border: none !important;
                        margin: 0 !important;
                        padding: 5mm !important;
                        width: 80mm !important;
                        height: auto !important;
                        min-height: 0 !important;
                        position: static !important;
                    }
                    main { padding: 0 !important; max-width: none !important; margin: 0 !important; }
                    .min-h-screen { min-height: 0 !important; height: auto !important; }
                    .landing-page-root { overflow: visible !important; }
                    #root { padding: 0 !important; margin: 0 !important; }
                }
            `}</style>
        </div>
    );
}
