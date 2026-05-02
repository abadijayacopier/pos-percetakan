import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiRefreshCw, FiGithub, FiCheckCircle, FiClock, FiActivity, FiTag, FiExternalLink, FiCpu, FiServer, FiAlertTriangle, FiCheck, FiInfo } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function SystemSettings() {
    const [loading, setLoading] = useState(false);
    const [updateInfo, setUpdateInfo] = useState(null);
    const [error, setError] = useState(null);

    const checkUpdate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/settings/check-update');
            setUpdateInfo(res.data);
            
            // If checking manually, we mark as seen
            localStorage.setItem('pos_last_seen_commit', res.data.latestCommit.sha);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUpdate();
    }, []);

    const isUpdated = updateInfo && localStorage.getItem('pos_last_seen_commit') === updateInfo.latestCommit.sha;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Version Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                            <FiTag size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Versi Aplikasi</p>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">v{updateInfo?.currentVersion || '1.0.1'}</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit">
                        <FiCheckCircle /> Produksi Stabel
                    </div>
                </div>

                {/* System Status Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                            <FiActivity size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Engine</p>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">Optimum</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full w-fit">
                        <FiCpu /> Node.js v20+ Active
                    </div>
                </div>

                {/* Database Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                            <FiServer size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Type</p>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">MySQL 8.0</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full w-fit">
                        <FiCheckCircle /> Synchronized
                    </div>
                </div>
            </div>

            {/* Update Panel */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase flex items-center gap-3">
                            <FiRefreshCw className={loading ? 'animate-spin text-blue-600' : 'text-blue-600'} /> 
                            System Update Center
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">Pusat kendali versi dan pemeliharaan integritas sistem</p>
                    </div>
                    <button 
                        onClick={checkUpdate}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black px-8 py-4 rounded-2xl flex items-center gap-3 shadow-xl shadow-blue-500/20 transition-all active:scale-95 group"
                    >
                        {loading ? 'Checking...' : (
                            <>
                                <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500" /> 
                                CEK PEMBARUAN
                            </>
                        )}
                    </button>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 p-6 rounded-[2rem] text-rose-600 dark:text-rose-400 flex items-center gap-4 mb-8">
                            <FiAlertTriangle size={24} className="shrink-0" />
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    {updateInfo && (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-full md:w-1/2 space-y-6">

                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Informasi Rilis Produksi</p>
                                        <div className="flex items-start gap-4">
                                            <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
                                                <FiTag className="text-xl" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-1">
                                                    {updateInfo.latestCommit.message}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                                    <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded uppercase tracking-widest">
                                                        ID: {updateInfo.latestCommit.sha.substring(0, 8)}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                        <FiClock /> {new Date(updateInfo.latestCommit.date).toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full md:w-1/2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                                    
                                    <h4 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                                        <FiRefreshCw className="text-blue-400" />
                                        Update Status
                                    </h4>

                                    <div className="space-y-6 relative z-10">
                                        {isUpdated ? (
                                            <div className="space-y-4">
                                                <div className="size-16 rounded-[1.5rem] bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                                                    <FiCheck size={32} />
                                                </div>
                                                <div>
                                                    <h5 className="text-xl font-black italic tracking-tighter">SISTEM VERSI TERBARU</h5>
                                                    <p className="text-slate-400 text-sm mt-1">Sistem Anda sudah menjalankan versi terbaru dan paling stabil saat ini.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="size-16 rounded-[1.5rem] bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                                                    <FiAlertTriangle size={32} />
                                                </div>
                                                <div>
                                                    <h5 className="text-xl font-black italic tracking-tighter">PEMBARUAN TERSEDIA</h5>
                                                    <p className="text-slate-400 text-sm mt-1">Versi terbaru telah tersedia di server. Silakan lakukan sinkronisasi untuk memperbarui sistem.</p>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-600/5 dark:bg-blue-400/5 border border-blue-100 dark:border-blue-900/30 p-6 rounded-[2rem] flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                                    <FiInfo size={20} />
                                </div>
                                <div className="text-sm">
                                    <p className="font-bold text-slate-800 dark:text-white mb-1">Informasi Pemeliharaan</p>
                                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                        Setiap pembaruan akan mengoptimalkan modul inti sistem untuk performa yang lebih stabil dan aman. Harap melakukan pencadangan data secara berkala demi keamanan informasi Anda. Sistem akan memberikan notifikasi otomatis jika terdapat peningkatan versi yang tersedia.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
