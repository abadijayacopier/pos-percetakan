import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCloud, FiKey, FiDatabase, FiGlobe, FiInfo, FiShield, FiExternalLink, FiCpu, FiServer, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi';

export default function CDNSettings({
    cdnAccountId, setCdnAccountId,
    cdnBucketName, setCdnBucketName,
    cdnAccessKey, setCdnAccessKey,
    cdnSecretKey, setCdnSecretKey,
    cdnCustomDomain, setCdnCustomDomain,
    saveSettings
}) {
    const [showAccessKey, setShowAccessKey] = useState(false);
    const [showSecretKey, setShowSecretKey] = useState(false);

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="bg-slate-50/50 dark:bg-slate-800/50 px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                    <FiCloud size={18} />
                                </div>
                                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">API Credential R2</h3>
                            </div>
                            <a 
                                href="https://dash.cloudflare.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                            >
                                Dashboard Cloudflare <FiExternalLink size={12} />
                            </a>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Account ID</label>
                                <input 
                                    type="text"
                                    value={cdnAccountId}
                                    onChange={e => setCdnAccountId(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                    placeholder="faa898b12aac9e0f4bfc483f1e28be4e"
                                />
                                <p className="text-[10px] text-slate-400 ml-1">Dapatkan dari dashboard Cloudflare R2 di pojok kanan atas.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Bucket Name</label>
                                <input 
                                    type="text"
                                    value={cdnBucketName}
                                    onChange={e => setCdnBucketName(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                    placeholder="abadijaya"
                                />
                                <p className="text-[10px] text-slate-400 ml-1">Nama bucket R2 yang akan digunakan.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Access Key ID</label>
                                    <div className="relative">
                                        <input 
                                            type={showAccessKey ? "text" : "password"}
                                            value={cdnAccessKey}
                                            onChange={e => setCdnAccessKey(e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white pr-12"
                                            placeholder="58c6dda356bb0570f615976aa3f5c537"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowAccessKey(!showAccessKey)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                        >
                                            {showAccessKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 ml-1">ID akses API Cloudflare R2.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Secret Access Key</label>
                                    <div className="relative">
                                        <input 
                                            type={showSecretKey ? "text" : "password"}
                                            value={cdnSecretKey}
                                            onChange={e => setCdnSecretKey(e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white pr-12"
                                            placeholder="••••••••••••••••••••••••••••••••••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowSecretKey(!showSecretKey)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                        >
                                            {showSecretKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 ml-1">Secret key API R2. Nilai ini akan disembunyikan (***) setelah disimpan.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">CDN Custom Domain</label>
                                <input 
                                    type="text"
                                    value={cdnCustomDomain}
                                    onChange={e => setCdnCustomDomain(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                    placeholder="https://abadijaya.web.id"
                                />
                                <p className="text-[10px] text-slate-400 ml-1">Domain custom yang terhubung ke bucket Anda (SSL aktif wajib).</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* CDN Status Card */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                                    <FiGlobe size={22} />
                                </div>
                                <h3 className="text-lg font-black tracking-tight">Status CDN</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <span className="text-sm text-slate-400">Penyimpanan Aktif</span>
                                    <span className="text-sm font-bold text-blue-400 uppercase tracking-widest">Cloudflare R2</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Custom Domain</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-sm font-bold text-emerald-400">Terhubung</span>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-8 text-xs text-slate-400 leading-relaxed italic">
                                Menggunakan CDN mengurangi beban bandwidth VPS Anda dan mempercepat loading foto meteran bagi pelanggan.
                            </p>
                        </div>
                    </div>

                    {/* Security Tips */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                                <FiShield size={20} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Tips Keamanan</h3>
                        </div>

                        <ul className="space-y-4">
                            {[
                                'Jangan pernah membagikan Secret Key di grup publik.',
                                'Gunakan API Token R2 dengan izin minimal (Read/Write) saja.',
                                'Backup database Anda secara rutin setelah mengubah konfigurasi krusial.'
                            ].map((tip, i) => (
                                <li key={i} className="flex gap-3 text-xs text-slate-500 leading-relaxed font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
