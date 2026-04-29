import React, { useEffect, useState } from 'react';
import { FiPrinter, FiArrowLeft } from 'react-icons/fi';
import SalarySlipProMax from '../components/SalarySlipProMax';

export default function PrintSalarySlipPage({ onNavigate, pageState }) {
    const [salaryData] = useState(pageState?.salary || null);
    const [period] = useState(pageState?.period || { month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    const [storeSettings, setStoreSettings] = useState(null);

    useEffect(() => {
        // Use localStorage first for speed and reliability
        const saved = localStorage.getItem('abadi_store_settings');
        if (saved) {
            try {
                setStoreSettings(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse store settings:', e);
            }
        }
    }, []);

    if (!salaryData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 text-center">
                <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full">
                    <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FiArrowLeft size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic">Data Tidak Ditemukan</h2>
                    <p className="text-sm text-slate-500 mt-2 mb-8">Data slip gaji tidak tersedia atau sesi telah berakhir.</p>
                    <button 
                        onClick={() => onNavigate('payroll')}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all"
                    >
                        Kembali ke Payroll
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 md:p-10 print:p-0 flex flex-col items-center print:items-start print:block print:w-full">
            {/* Top Action Bar */}
            <div className="no-print w-full max-w-4xl bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 mb-8 sticky top-4 z-50">
                <button 
                    onClick={() => onNavigate('payroll')}
                    className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 transition-all"
                    title="Kembali"
                >
                    <FiArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-sm font-black uppercase tracking-widest italic text-slate-800 dark:text-white">Print Preview</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Slip Gaji: {salaryData.employee_name}</p>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                    <FiPrinter size={16} /> Cetak Slip
                </button>
            </div>

            {/* Slip Area */}
            <div className="w-full max-w-4xl">
                <SalarySlipProMax 
                    salary={salaryData} 
                    period={period} 
                    storeSettings={storeSettings} 
                />
            </div>

            {/* Quick Note */}
            <div className="no-print mt-8 text-center max-w-md pb-20">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed italic">Gunakan tombol Cetak di atas. Atur Margin ke "Default" dan aktifkan "Background Graphics" pada pengaturan printer.</p>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0 !important; padding: 0 !important; }
                    .min-h-screen { min-height: 0 !important; background: white !important; padding: 0 !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            ` }} />
        </div>
    );
}
