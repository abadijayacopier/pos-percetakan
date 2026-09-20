import React, { useState } from 'react';
import IntegratedPos from './IntegratedPos';
import CashierPaymentPage from './CashierPaymentPage';
import { FiShoppingCart, FiCreditCard, FiPrinter, FiFileText, FiPackage } from 'react-icons/fi';

export default function KasirPage(props) {
    const [tab, setTab] = useState('jualan');

    const tabs = [
        { id: 'jualan', label: 'Penjualan Langsung', icon: FiShoppingCart },
        { id: 'pembayaran', label: 'Pembayaran Produksi', icon: FiCreditCard },
    ];

    const go = (page) => props.onNavigate?.(page);

    return (
        <div className="min-h-full">
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3">
                <div className="flex flex-col xl:flex-row xl:items-center gap-3 justify-between">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Kasir Terpadu</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Satu pintu untuk fotocopy, ATK, digital printing & offset</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => go('digital-printing')} className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 text-xs font-black flex items-center gap-2"><FiPrinter /> Order Digital</button>
                        <button onClick={() => go('cetak-offset')} className="px-3 py-2 rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 text-xs font-black flex items-center gap-2"><FiFileText /> Order Offset</button>
                        <button onClick={() => go('inventory')} className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 text-xs font-black flex items-center gap-2"><FiPackage /> ATK & Stok</button>
                    </div>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto">
                    {tabs.map(({id,label,icon:Icon}) => (
                        <button key={id} onClick={() => setTab(id)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-2 whitespace-nowrap transition-all ${tab === id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}>
                            <Icon /> {label}
                        </button>
                    ))}
                </div>
            </div>
            {tab === 'jualan' ? <IntegratedPos {...props} /> : <CashierPaymentPage {...props} />}
        </div>
    );
}
