import React, { useState, useEffect } from 'react';
import { X, Clock, CreditCard, User, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { formatRupiah } from '../../utils';

export default function PosPendingModal({ isOpen, onClose, onRestoreToCart, showToast }) {
    const [pendingTrx, setPendingTrx] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/transactions');
            const filtered = (data || []).filter(t =>
                t.status === 'pending' || t.status === 'debt'
            ).slice(0, 50);
            setPendingTrx(filtered);
        } catch (e) {
            console.error('Failed to fetch pending:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchPending();
    }, [isOpen]);

    const handleRestore = (trx) => {
        if (onRestoreToCart) onRestoreToCart(trx);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border-2 border-white dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">Transaksi Pending</h3>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Belum Lunas / Hutang</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchPending} className="p-2 text-slate-400 hover:text-blue-500 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <RefreshCw size={32} className="animate-spin mb-4 opacity-40" />
                            <span className="text-xs font-black uppercase tracking-widest">Memuat data...</span>
                        </div>
                    ) : pendingTrx.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-300 dark:text-slate-600">
                            <AlertCircle size={48} className="mb-4 opacity-30" />
                            <span className="text-sm font-black uppercase tracking-widest">Tidak ada transaksi pending</span>
                        </div>
                    ) : (
                        pendingTrx.map(trx => {
                            const remaining = (trx.total || 0) - (trx.paid || trx.paidAmount || 0);
                            const dateStr = trx.date || trx.createdAt;
                            const formattedDate = dateStr ? new Date(dateStr).toLocaleString('id-ID', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            }) : '-';
                            const itemCount = (trx.items || []).length;

                            return (
                                <div
                                    key={trx.id}
                                    className="bg-slate-50 dark:bg-slate-800/50 rounded-[1.8rem] border-2 border-slate-100 dark:border-slate-700/50 p-5 hover:border-amber-400 transition-all group cursor-pointer"
                                    onClick={() => handleRestore(trx)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${trx.status === 'pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                                    {trx.status === 'pending' ? 'PENDING' : 'HUTANG'}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400">{formattedDate}</span>
                                            </div>
                                            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                                                {trx.invoiceNo || trx.invoice_no || '-'}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <User size={12} className="text-slate-400" />
                                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                                    {trx.customerName || trx.customer_name || 'Umum'}
                                                </span>
                                                {itemCount > 0 && (
                                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                                        {itemCount} item
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-3">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sisa</div>
                                            <div className="text-lg font-black text-amber-600 dark:text-amber-400 tracking-tighter">
                                                {formatRupiah(remaining > 0 ? remaining : trx.total || 0)}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400">
                                                Total: {formatRupiah(trx.total || 0)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                                            Lihat Detail <ChevronRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/80 dark:bg-slate-900/80">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>{pendingTrx.length} transaksi pending</span>
                        <span className="text-amber-500">
                            Total: {formatRupiah(pendingTrx.reduce((s, t) => s + ((t.total || 0) - (t.paid || t.paidAmount || 0)), 0))}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
