import React, { useState } from 'react';
import { FiRefreshCw, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';
import Swal from 'sweetalert2';

export default function StockOpnameModal({ isOpen, onClose, product, onSuccess }) {
    const [actualStock, setActualStock] = useState(product?.stock || 0);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !product) return null;

    const diff = actualStock - (product.stock || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/products/stock-opname', {
                productId: product.id,
                currentStock: product.stock,
                actualStock: parseFloat(actualStock),
                notes: notes || 'Penyesuaian manual (Stock Opname)'
            });

            Swal.fire({
                icon: 'success',
                title: 'Opname Berhasil',
                text: 'Stok barang telah disesuaikan.',
                timer: 1500,
                showConfirmButton: false
            });

            onSuccess();
            onClose();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Gagal menyimpan opname', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <FiRefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Stock Opname</h3>
                                <p className="text-sm text-slate-500">{product.name}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <FiX size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stok Sistem</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">{product.stock} <span className="text-xs font-bold text-slate-400">{product.unit}</span></p>
                            </div>
                            <div className={`p-4 rounded-2xl border ${diff === 0 ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100' : diff > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/30' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/30'}`}>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-inherit">Selisih</p>
                                <p className={`text-lg font-black ${diff === 0 ? 'text-slate-900 dark:text-white' : diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {diff > 0 ? '+' : ''}{diff} <span className="text-xs font-bold opacity-60">{product.unit}</span>
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Stok Riil (Hasil Hitung)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-5 text-lg font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:text-white"
                                    value={actualStock}
                                    onChange={(e) => setActualStock(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Alasan / Catatan</label>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-5 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:text-white h-24 resize-none"
                                    placeholder="Contoh: Barang rusak, salah hitung, atau promo..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-3 text-amber-700 dark:text-amber-400">
                            <FiAlertCircle className="shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold uppercase leading-relaxed tracking-wide">
                                Tindakan ini akan menyesuaikan data stok secara permanen dan tercatat di audit log.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs uppercase tracking-widest"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><FiCheckCircle size={18} /> Simpan Opname</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
