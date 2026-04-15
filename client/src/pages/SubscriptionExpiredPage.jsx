import { FiClock, FiCreditCard, FiArrowLeft, FiShield, FiZap } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import api from '../services/api';

export default function SubscriptionExpiredPage({ onNavigate }) {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleRenew = async (plan) => {
        setLoading(true);
        try {
            const res = await api.post('/subscriptions/renew', {
                plan,
                durationMonths: 1
            });

            // Check if Midtrans Snap is available globally
            if (window.snap) {
                window.snap.pay(res.data.token, {
                    onSuccess: (result) => {
                        alert('Pembayaran Berhasil! Silakan refresh halaman.');
                        window.location.reload();
                    },
                    onPending: (result) => {
                        alert('Menunggu pembayaran...');
                    },
                    onError: (result) => {
                        alert('Pembayaran gagal!');
                    }
                });
            } else {
                alert('Sistem pembayaran sedang sibuk. Silakan coba lagi nanti.');
            }
        } catch (err) {
            console.error(err);
            alert('Gagal membuat transaksi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117] flex items-center justify-center p-6 font-display">
            <div className="max-w-[1000px] w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                {/* Visual Section */}
                <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-8">
                    <div className="relative">
                        <div className="w-64 h-64 bg-blue-600/10 rounded-full flex items-center justify-center animate-pulse">
                            <FiClock size={120} className="text-blue-500" />
                        </div>
                        <div className="absolute -bottom-4 -right-4 bg-red-500 text-white px-6 py-2 rounded-2xl font-black uppercase tracking-tighter shadow-xl shadow-red-500/30">
                            Session Locked
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black text-slate-900 dark:text-white leading-none italic uppercase tracking-tighter">Masa Aktif Habis</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
                            Akses operasional untuk toko <span className="text-blue-600 font-bold">{user?.shop_name || 'Anda'}</span> sementara dikunci hingga pembayaran perpanjangan dikonfirmasi.
                        </p>
                    </div>
                </div>

                {/* Pricing / Action Section */}
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-10 w-24 h-4 bg-blue-600 rounded-b-2xl"></div>

                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Pilih Paket Perpanjangan</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Lanjutkan operasional bisnis Anda sekarang</p>
                    </div>

                    <div className="space-y-4">
                        {/* Package Card: Basic */}
                        <div className="group p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-blue-500/50 transition-all cursor-pointer"
                            onClick={() => handleRenew('basic')}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm">
                                        <FiZap className="text-blue-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Basic Plan</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Fitur Standar POS & Stok</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-slate-900 dark:text-white leading-none">Rp 100k</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Per Bulan</p>
                                </div>
                            </div>
                        </div>

                        {/* Package Card: Pro */}
                        <div className="group p-6 rounded-3xl border-2 border-blue-600 bg-blue-600 shadow-xl shadow-blue-600/20 transition-all cursor-pointer relative"
                            onClick={() => handleRenew('pro')}>
                            <div className="absolute top-0 right-6 -translate-y-1/2 bg-amber-400 text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Paling Laris</div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                                        <FiShield className="text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-white uppercase tracking-tight">Pro Master</h4>
                                        <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wider leading-none">Full Fitur + WA Notif</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-white leading-none">Rp 250k</p>
                                    <p className="text-[10px] text-blue-100 font-bold uppercase mt-1">Per Bulan</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-4">
                        <button
                            disabled={loading}
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50"
                        >
                            <FiCreditCard size={18} /> {loading ? 'Menyiapkan...' : 'Hubungi Tim Support'}
                        </button>
                        <button
                            onClick={() => logout()}
                            className="text-slate-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                        >
                            <FiArrowLeft size={14} /> Keluar Akun
                        </button>
                    </div>
                </div>

            </div>

            {/* Support Watermark */}
            <p className="fixed bottom-10 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                Abadi Jaya Solutions &copy; 2026 - Managed Multi-Tenant Portal
            </p>
        </div>
    );
}
