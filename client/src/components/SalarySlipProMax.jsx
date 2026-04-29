import React from 'react';
import { FiPrinter, FiDownload, FiUser, FiCalendar, FiDollarSign, FiScissors, FiCheckCircle, FiBriefcase } from 'react-icons/fi';
import { formatRupiah } from '../utils';

const SalarySlipProMax = ({ salary, period, storeSettings }) => {
    if (!salary) return null;

    const printId = `salary-slip-${salary.id}`;
    
    const earnings = [
        { label: 'Gaji Pokok', value: salary.base_processing_salary },
        { label: 'Bonus Absensi', value: salary.attendance_bonus || 0, isBonus: true },
        { label: 'Lembur', value: salary.overtime_pay || 0, isBonus: true },
    ].filter(item => item.value > 0);

    const deductions = [
        { label: 'Potongan Pinjaman (Kasbon)', value: salary.loan_deduction || 0 },
        { label: 'Potongan Lainnya', value: salary.other_deductions || 0 },
    ].filter(item => item.value > 0);

    const totalEarnings = earnings.reduce((sum, item) => sum + item.value, 0);
    const totalDeductions = deductions.reduce((sum, item) => sum + item.value, 0);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="font-display">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0 !important; padding: 0 !important; }
                    #${printId} { 
                        width: 100% !important; 
                        box-shadow: none !important; 
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    /* Force background colors and shadows */
                    * { 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                        color-adjust: exact !important;
                    }
                    @page {
                        margin: 10mm;
                        size: auto;
                    }
                }
            ` }} />

            <div id={printId} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl transition-all max-w-4xl print:max-w-full mx-auto print:mx-0">
                {/* Minimalist Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="space-y-1">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{storeSettings?.name || 'POS SYSTEM'}</h2>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Employee Salary Slip</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500">
                            <FiCalendar className="text-indigo-500" />
                            <span>{period.month} / {period.year}</span>
                        </div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: #{salary.id.toString().slice(-6).toUpperCase()}</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Employee Info Bar - More Compact */}
                    <div className="grid grid-cols-2 gap-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 print:bg-white rounded-2xl px-5 border border-slate-100 dark:border-slate-800 print:border-slate-300">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 print:bg-slate-100 flex items-center justify-center text-indigo-600 print:text-slate-900">
                                <FiUser size={14} />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 print:text-slate-500 uppercase tracking-widest leading-none mb-1">Karyawan</p>
                                <p className="text-xs font-black text-slate-900 dark:text-white print:text-black uppercase italic">{salary.employee_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-4 print:border-slate-300">
                            <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 print:bg-slate-100 flex items-center justify-center text-blue-600 print:text-slate-900">
                                <FiBriefcase size={14} />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 print:text-slate-500 uppercase tracking-widest leading-none mb-1">Jabatan</p>
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 print:text-black">{salary.position || 'Staff Operasional'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Details Table */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Earnings */}
                        <div className="space-y-3">
                            <h3 className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-4 h-[1.5px] bg-indigo-500 rounded-full"></span>
                                Penerimaan
                            </h3>
                            <div className="space-y-1">
                                {earnings.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                                        <span className="text-[10px] font-bold text-slate-500">{item.label}</span>
                                        <span className="text-xs font-black text-slate-900 dark:text-white italic">{formatRupiah(item.value)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-2 mt-1 border-t border-indigo-100 dark:border-indigo-900/50">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Subtotal</span>
                                    <span className="text-sm font-black text-indigo-600 italic">{formatRupiah(totalEarnings)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div className="space-y-3">
                            <h3 className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-4 h-[1.5px] bg-rose-500 rounded-full"></span>
                                Potongan
                            </h3>
                            <div className="space-y-1">
                                {deductions.length > 0 ? deductions.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                                        <span className="text-[10px] font-bold text-slate-500">{item.label}</span>
                                        <span className="text-xs font-black text-rose-500 italic">-{formatRupiah(item.value)}</span>
                                    </div>
                                )) : (
                                    <div className="py-4 text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest border border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                                        Nihil
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 mt-1 border-t border-rose-100 dark:border-rose-900/50">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Subtotal</span>
                                    <span className="text-sm font-black text-rose-600 italic">-{formatRupiah(totalDeductions)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ultra Compact Summary Section */}
                    <div className="py-2">
                        <div className="bg-slate-900 dark:bg-slate-800 print:bg-white print:border-2 print:border-slate-950 px-6 py-4 rounded-2xl flex justify-between items-center relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[8px] font-black text-indigo-300 print:text-slate-500 uppercase tracking-[0.3em] mb-0.5">Take Home Pay</p>
                                <h4 className="text-2xl font-black italic tracking-tighter text-white print:text-slate-950">{formatRupiah(salary.net_salary)}</h4>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[8px] font-bold text-emerald-400 print:text-slate-400 uppercase tracking-widest mb-0.5">Status Pembayaran</p>
                                    <p className="text-[10px] font-black text-white print:text-slate-950 uppercase italic">SUCCESSFUL</p>
                                </div>
                                <div className="no-print">
                                    <button 
                                        onClick={handlePrint}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                                    >
                                        <FiPrinter size={12} /> Print
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Notes Section */}
                    <div className="py-3 px-5 bg-slate-50 dark:bg-slate-800/20 print:bg-white rounded-xl border border-dashed border-slate-200 dark:border-slate-700 print:border-slate-300">
                        <p className="text-[8px] font-black text-slate-400 print:text-slate-500 uppercase tracking-widest mb-1">Keterangan:</p>
                        <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300 print:text-black leading-relaxed italic">
                            "{salary.notes || `GAJI ${salary.employee_name.toUpperCase()} PERIODE ${period.month}/${period.year}`}"
                        </p>
                    </div>

                    {/* Footer / Signatures - More Compact */}
                    <div className="grid grid-cols-2 gap-10 pt-4 text-center">
                        <div className="space-y-12">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Penerima,</p>
                            <div>
                                <p className="text-xs font-black uppercase italic border-b border-slate-900 dark:border-white inline-block px-4 pb-0.5">{salary.employee_name}</p>
                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tanda Tangan</p>
                            </div>
                        </div>
                        <div className="space-y-12">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Otorisator,</p>
                            <div>
                                <p className="text-xs font-black uppercase italic border-b border-slate-900 dark:border-white inline-block px-4 pb-0.5">Finance Admin</p>
                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">{storeSettings?.name || 'Authorized'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.3em]">Valid Document - Computer Generated - {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalarySlipProMax;
