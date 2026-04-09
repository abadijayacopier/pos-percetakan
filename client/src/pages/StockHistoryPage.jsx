import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiPackage, FiInfo, FiTrendingUp, FiTrendingDown, FiRefreshCw, FiCalendar } from 'react-icons/fi';
import api from '../services/api';
import { formatDateTime } from '../utils';

export default function StockHistoryPage({ onNavigate, pageState }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const product = pageState?.product || {};

    const loadHistory = async () => {
        if (!product.id) return;
        setLoading(true);
        try {
            const res = await api.get(`/products/${product.id}/history`);
            setHistory(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [product.id]);

    const getTypeIcon = (type) => {
        if (type === 'in') return <FiTrendingUp className="text-emerald-500" />;
        if (type === 'out') return <FiTrendingDown className="text-rose-500" />;
        return <FiRefreshCw className="text-blue-500" />;
    };

    const getTypeLabel = (type) => {
        if (type === 'in') return 'Masuk';
        if (type === 'out') return 'Keluar';
        return 'Penyesuaian';
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 font-display bg-slate-50/30 dark:bg-transparent min-h-screen">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => onNavigate('inventory')}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                >
                    <FiArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        History Stok: {product.name}
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Audit Trail & Movement Log</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-auto max-h-[70vh]">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Referensi</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catatan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                                        <p className="text-sm font-bold text-slate-500">Memuat history...</p>
                                    </td>
                                </tr>
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-bold italic">
                                        Belum ada data pergerakan stok untuk produk ini.
                                    </td>
                                </tr>
                            ) : history.map((h, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                                            <FiCalendar className="text-slate-400" />
                                            {formatDateTime(h.date)}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                            {getTypeIcon(h.type)}
                                            <span className={h.type === 'in' ? 'text-emerald-600' : h.type === 'out' ? 'text-rose-600' : 'text-blue-600'}>
                                                {getTypeLabel(h.type)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white">
                                        {h.qty > 0 ? `+${h.qty}` : h.qty} {product.unit}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">
                                            {h.reference || '---'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-xs text-slate-500 font-medium">
                                        {h.notes}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
