import React, { useState } from 'react';
import { FiDollarSign, FiX, FiCheckCircle, FiCreditCard } from 'react-icons/fi';
import api from '../services/api';
import Swal from 'sweetalert2';

export default function PelunasanModal({ isOpen, onClose, task, type = 'printing', onSuccess }) {
    const [paidAmount, setPaidAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !task) return null;

    // Calculate total and remainder
    let total = 0;
    let dp = 0;

    if (type === 'printing') {
        const material = parseFloat(task.material_price || 0);
        const design = parseFloat(task.design_price || 0);
        const qty = parseInt(task.qty || 1);
        total = (material * qty) + design;
        dp = parseFloat(task.dp_amount || 0);
    } else {
        total = parseFloat(task.totalCost || 0);
        dp = 0; // Services usually paid at end, or handle DP if implemented
    }

    const remainder = total - dp;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = type === 'printing' ? `/dp_tasks/${task.id}/pay` : `/service/${task.id}/pay`;
            const payload = type === 'printing'
                ? { totalAmount: total, dpAmount: dp, title: task.title }
                : { serviceNo: task.serviceNo, totalCost: total };

            await api.post(url, payload);

            Swal.fire({
                icon: 'success',
                title: 'Pelunasan Berhasil',
                text: 'Status pesanan telah diperbarui.',
                timer: 1500,
                showConfirmButton: false
            });

            onSuccess();
            onClose();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Gagal memproses pelunasan', 'error');
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
                            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
                                <FiCreditCard size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pelunasan Pesanan</h3>
                                <p className="text-sm text-slate-500">{task.id || task.serviceNo}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <FiX size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500">Total Tagihan</span>
                                <span className="font-semibold text-slate-900 dark:text-white">Rp {total.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500">DP / Bayar Awal</span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">- Rp {dp.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Sisa Pelunasan</span>
                                <span className="text-2xl font-black text-green-600 dark:text-green-400">Rp {remainder.toLocaleString()}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Metode Pembayaran</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['cash', 'transfer', 'qris'].map(m => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setPaymentMethod(m)}
                                        className={`p-3 rounded-xl border transition-all text-sm font-medium capitalize ${paymentMethod === m
                                                ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/50 dark:text-blue-400 ring-2 ring-blue-500/20'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                                            }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-[2] px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><FiCheckCircle size={18} /> Proses Pelunasan</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
