import React, { useState } from 'react';
import { FiSend, FiZap, FiCheckCircle, FiAlertCircle, FiSettings, FiBell, FiShield, FiExternalLink, FiUsers, FiRefreshCw, FiEye, FiEyeOff } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';
import Swal from 'sweetalert2';

export default function TelegramSettings({
    telegramBotToken, setTelegramBotToken,
    telegramChatId, setTelegramChatId,
    telegramEnabled, setTelegramEnabled,
    telegramStokKritis, setTelegramStokKritis,
    telegramLaporanKasir, setTelegramLaporanKasir,
    telegramSecurityAlert, setTelegramSecurityAlert,
    telegramErrorMonitoring, setTelegramErrorMonitoring,
    saveSettings
}) {
    const [testLoading, setTestLoading] = React.useState(false);
    const [showToken, setShowToken] = React.useState(false);

    const handleTestTelegram = async () => {
        if (!telegramBotToken || !telegramChatId) {
            Swal.fire('Error', 'Token dan Chat ID harus diisi', 'error');
            return;
        }

        setTestLoading(true);
        try {
            await api.post('/settings/test-telegram', {
                telegram_bot_token: telegramBotToken,
                telegram_chat_id: telegramChatId
            });
            Swal.fire('Berhasil', 'Pesan tes telah dikirim ke Telegram', 'success');
        } catch (error) {
            Swal.fire('Gagal', error.response?.data?.message || 'Gagal mengirim pesan tes', 'error');
        } finally {
            setTestLoading(false);
        }
    };

    return (
        <div className="space-y-10 pb-20 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-2xl shadow-sky-500/30">
                        <FiSend size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight italic uppercase font-display">
                            Integration <span className="text-sky-500 underline decoration-4 underline-offset-8">Telegram</span>
                        </h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                            Sinkronisasi Robot Notifikasi & Monitoring Sistem
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="premium-card p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Bot Configuration</h3>
                            <label className="relative inline-flex items-center cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={telegramEnabled === 'true' || telegramEnabled === true}
                                    onChange={(e) => setTelegramEnabled(e.target.checked ? 'true' : 'false')}
                                />
                                <div className="w-16 h-8 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-sky-500 shadow-inner group-hover:ring-4 group-hover:ring-sky-500/10 transition-all"></div>
                                <span className="ml-4 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 peer-checked:text-sky-500 transition-colors">
                                    {telegramEnabled === 'true' || telegramEnabled === true ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </label>
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <FiShield className="text-sky-500" /> Bot API Token
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type={showToken ? "text" : "password"}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-8 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all placeholder:text-slate-300 pr-14"
                                            placeholder="••••••••••••••••••••••••"
                                            value={telegramBotToken}
                                            onChange={e => setTelegramBotToken(e.target.value)}
                                            autoComplete="off"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowToken(!showToken)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-sky-500 transition-colors"
                                        >
                                            {showToken ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-slate-400 italic px-1 leading-relaxed font-medium">Token terenkripsi & rahasia. Jangan berikan kepada siapapun.</p>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <FiUsers className="text-sky-500" /> Target Chat ID / Group ID
                                    </label>
                                    <div className="relative group">
                                        <input
                                            className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-8 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all placeholder:text-slate-300"
                                            placeholder="-100123456789"
                                            value={telegramChatId}
                                            onChange={e => setTelegramChatId(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-[9px] text-slate-400 italic px-1 leading-relaxed">ID User atau Grup tujuan notifikasi dikirimkan.</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleTestTelegram}
                                disabled={testLoading || (telegramEnabled !== 'true' && telegramEnabled !== true)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${testLoading || (telegramEnabled !== 'true' && telegramEnabled !== true) ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-lg shadow-emerald-500/10'}`}
                            >
                                {testLoading ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
                                Test Kirim Notifikasi
                            </button>
                        </div>
                    </motion.div>

                    <div className="premium-card p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-8">Feature Scopes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { 
                                    title: 'Notifikasi Stok Kritis', 
                                    desc: 'Alert otomatis saat stok barang di bawah batas minimum.', 
                                    icon: <FiBell className="text-rose-500" />, 
                                    active: telegramStokKritis,
                                    toggle: () => setTelegramStokKritis(!telegramStokKritis)
                                },
                                { 
                                    title: 'Laporan Penutupan Kasir', 
                                    desc: 'Ringkasan omset harian dikirim saat kasir tutup buku.', 
                                    icon: <FiCheckCircle className="text-emerald-500" />, 
                                    active: telegramLaporanKasir,
                                    toggle: () => setTelegramLaporanKasir(!telegramLaporanKasir)
                                },
                                { 
                                    title: 'Security Alert Login', 
                                    desc: 'Notifikasi setiap ada admin yang masuk ke sistem.', 
                                    icon: <FiShield className="text-blue-500" />, 
                                    active: telegramSecurityAlert,
                                    toggle: () => setTelegramSecurityAlert(!telegramSecurityAlert)
                                },
                                { 
                                    title: 'Error Monitoring', 
                                    desc: 'Push notification jika terjadi crash pada server.', 
                                    icon: <FiAlertCircle className="text-orange-500" />, 
                                    active: telegramErrorMonitoring,
                                    toggle: () => setTelegramErrorMonitoring(!telegramErrorMonitoring)
                                },
                            ].map((item, i) => (
                                <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-start gap-4 group">
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{item.title}</h4>
                                            <button 
                                                onClick={item.toggle}
                                                className={`w-8 h-5 rounded-full transition-all duration-300 relative ${item.active ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-800'}`}
                                            >
                                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${item.active ? 'left-3.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${item.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {item.active ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="premium-card p-10 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
                        <h3 className="text-xl font-black uppercase tracking-tighter italic mb-6 relative z-10">How to Connect</h3>
                        <div className="space-y-6 relative z-10">
                            {[
                                { step: '01', text: 'Cari @BotFather di Telegram dan buat bot baru.' },
                                { step: '02', text: 'Salin API Token yang diberikan ke kolom di samping.' },
                                { step: '03', text: 'Cari @userinfobot untuk mendapatkan Chat ID Anda.' },
                                { step: '04', text: 'Nyalakan switch Aktif dan Simpan Pengaturan.' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <span className="text-lg font-black text-sky-500/50">{item.step}</span>
                                    <p className="text-xs font-medium text-slate-300 leading-relaxed">{item.text}</p>
                                </div>
                            ))}
                        </div>
                        <a 
                            href="https://core.telegram.org/bots" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-10 flex items-center justify-center gap-2 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                        >
                            <FiExternalLink /> Pelajari Selengkapnya
                        </a>
                    </div>

                    <div className="p-8 bg-sky-50 dark:bg-sky-950/30 rounded-3xl border border-sky-100 dark:border-sky-900/50">
                        <div className="flex gap-4">
                            <FiZap className="text-sky-500 shrink-0 mt-1" size={20} />
                            <div>
                                <h4 className="text-xs font-black text-sky-800 dark:text-sky-400 uppercase tracking-tight mb-2">Real-time Advantage</h4>
                                <p className="text-[10px] text-sky-600 dark:text-sky-500/80 leading-relaxed font-medium">
                                    Dengan Telegram, tim manajemen akan mendapatkan alert stok kritis secara instan tanpa harus membuka dashboard POS secara berkala.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
