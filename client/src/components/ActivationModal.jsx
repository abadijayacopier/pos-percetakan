import React, { useState } from 'react';
import axios from 'axios';
import { Key, ShieldCheck, X, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';

const ActivationModal = ({ isOpen, onClose, onActivated, hardwareId }) => {
    const [licenseKey, setLicenseKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleActivate = async (e) => {
        e.preventDefault();
        if (!licenseKey.trim()) return setError('Masukkan kode lisensi');

        setLoading(true);
        setError('');

        try {
            const savedSession = localStorage.getItem('pos_session');
            const session = savedSession ? JSON.parse(savedSession) : null;
            const token = session?.token;

            if (!token) {
                return setError('Sesi habis. Silakan login ulang.');
            }

            const trimmedKey = licenseKey.trim();
            const response = await axios.post('/api/settings/license',
                { licenseKey: trimmedKey },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Swal.fire({
                icon: 'success',
                title: 'Aktivasi Berhasil!',
                text: `Aplikasi telah diaktivasi untuk ${response.data.clientName}`,
                background: 'rgba(255, 255, 255, 0.9)',
                backdrop: `rgba(0,0,123,0.4)`,
                confirmButtonColor: '#10b981'
            });

            onActivated(response.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal melakukan aktivasi. Kode mungkin salah atau kadaluarsa.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">

                {/* Header Decoration */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 pointer-events-none" />

                <div className="relative p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center mt-4">
                        <div className="w-20 h-20 mb-6 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Key size={36} className="text-white" />
                        </div>

                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Aktivasi Produk</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
                            Masukkan kode lisensi yang Anda dapatkan dari pengembang untuk membuka akses penuh.
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl mb-8 flex flex-col items-center gap-1.5 border border-slate-100 dark:border-slate-700/50 w-full overflow-hidden">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Your Hardware ID</span>
                            <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 leading-none break-all text-center px-2">{hardwareId || 'Fetching...'}</span>
                        </div>
                    </div>

                    <form onSubmit={handleActivate} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
                                Kode Lisensi (Serial Key)
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <ShieldCheck size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value)}
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-lg font-mono tracking-widest text-indigo-600 dark:text-indigo-400 placeholder:tracking-normal placeholder:text-slate-400"
                                />
                            </div>
                            {error && (
                                <div className="mt-3 flex items-center gap-2 text-red-500 text-sm font-medium animate-in slide-in-from-top-2">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-bold text-lg shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Aktivasi Sekarang</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            Secure Logic
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            No Internet Required
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            by Supriyanto
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivationModal;
