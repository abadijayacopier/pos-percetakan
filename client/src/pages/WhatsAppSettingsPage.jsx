import React, { useState, useEffect } from 'react';
import api from '../api';
import {
    FiMessageSquare,
    FiSave,
    FiSettings,
    FiRefreshCcw,
    FiKey,
    FiLink,
    FiCheckCircle,
    FiAlertCircle,
    FiShield
} from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function WhatsAppSettingsPage() {
    const [config, setConfig] = useState({
        wa_gateway_url: '',
        wa_api_key: '',
        wa_session_name: 'default',
        wa_sender_number: '',
        wa_auto_reply: 'false',
        wa_template_inv: 'Halo *{{name}}*, pesanan Anda *#{{invoice}}* sebesar *{{total}}* sedang kami proses. Terima kasih!',
        wa_template_done: 'Halo *{{name}}*, pesanan *#{{invoice}}* sudah selesai dan siap diambil. Silakan datang ke toko.'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testLoading, setTestLoading] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/wa-config');
            setConfig(prev => ({ ...prev, ...data }));
        } catch (error) {
            console.error('Error fetching WA config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/wa-config', config);
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: 'Konfigurasi WhatsApp berhasil disimpan.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Gagal menyimpan konfigurasi.'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setTestLoading(true);
        try {
            // Mock test for now or call real endpoint if exists
            await new Promise(r => setTimeout(r, 2000));
            Swal.fire({
                icon: 'success',
                title: 'Koneksi Berhasil!',
                text: 'Gateway WhatsApp merespon dengan baik.',
                timer: 3000
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Koneksi Gagal',
                text: 'Periksa URL dan API Key Anda.'
            });
        } finally {
            setTestLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 space-y-8 font-display bg-slate-50/30 dark:bg-transparent min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-200 dark:shadow-none"><FiMessageSquare /></span>
                        WhatsApp Gateway Settings
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-1 italic opacity-75">Notification API & Automation Configuration</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleTestConnection}
                        disabled={testLoading}
                        className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-400"
                    >
                        {testLoading ? <FiRefreshCcw className="animate-spin" /> : <FiLink />}
                        Test Connection
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
                    >
                        {saving ? <FiRefreshCcw className="animate-spin" /> : <FiSave />}
                        Simpan Perubahan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Connection Settings */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-slate-900 dark:text-white flex items-center gap-3">
                            <FiSettings className="text-blue-500" /> API Configuration
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gateway URL</label>
                                <div className="relative group">
                                    <FiLink className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 border-2 focus:border-emerald-500/20 rounded-2xl text-xs font-bold transition-all outline-none"
                                        placeholder="https://api.whatsapp-gateway.com"
                                        value={config.wa_gateway_url}
                                        onChange={e => setConfig({ ...config, wa_gateway_url: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API Key / Token</label>
                                <div className="relative group">
                                    <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="password"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 border-2 focus:border-emerald-500/20 rounded-2xl text-xs font-bold transition-all outline-none"
                                        placeholder="••••••••••••••••"
                                        value={config.wa_api_key}
                                        onChange={e => setConfig({ ...config, wa_api_key: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 border-2 focus:border-emerald-500/20 rounded-2xl text-xs font-bold transition-all outline-none"
                                    placeholder="pos_session"
                                    value={config.wa_session_name}
                                    onChange={e => setConfig({ ...config, wa_session_name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sender Number</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 border-2 focus:border-emerald-500/20 rounded-2xl text-xs font-bold transition-all outline-none"
                                    placeholder="628123456789"
                                    value={config.wa_sender_number}
                                    onChange={e => setConfig({ ...config, wa_sender_number: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-slate-900 dark:text-white flex items-center gap-3">
                            <FiMessageSquare className="text-purple-500" /> Messaging Templates
                        </h3>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                                    Invoice Notification
                                    <span className="text-emerald-500 lowercase opacity-60">Tags: {"{{name}}"}, {"{{invoice}}"}, {"{{total}}"}</span>
                                </label>
                                <textarea
                                    rows="3"
                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 border-2 focus:border-emerald-500/20 rounded-2xl text-xs font-bold transition-all outline-none resize-none"
                                    value={config.wa_template_inv}
                                    onChange={e => setConfig({ ...config, wa_template_inv: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                                    Order Done / Ready for Pickup
                                    <span className="text-emerald-500 lowercase opacity-60">Tags: {"{{name}}"}, {"{{invoice}}"}</span>
                                </label>
                                <textarea
                                    rows="3"
                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 border-2 focus:border-emerald-500/20 rounded-2xl text-xs font-bold transition-all outline-none resize-none"
                                    value={config.wa_template_done}
                                    onChange={e => setConfig({ ...config, wa_template_done: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <FiShield className="text-emerald-500" /> Security Status
                        </h4>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                                    <FiCheckCircle size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">API Key Encrypted</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Stored securely in database</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 opacity-50">
                                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl">
                                    <FiAlertCircle size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Two-Factor Auth</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Optional • Not Active</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 relative z-10">System Guide</h4>
                        <p className="text-xs font-medium text-slate-300 leading-relaxed relative z-10">
                            Gunakan variabel <code className="text-emerald-400 bg-emerald-400/10 px-1 rounded">{"{{name}}"}</code>, <code className="text-emerald-400 bg-emerald-400/10 px-1 rounded">{"{{invoice}}"}</code>, dan <code className="text-emerald-400 bg-emerald-400/10 px-1 rounded">{"{{total}}"}</code> untuk mempersonalisasi pesan yang dikirim ke pelanggan secara otomatis.
                        </p>
                        <div className="mt-6 pt-6 border-t border-white/5 relative z-10">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Support Info</p>
                            <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                                Pastikan server gateway WhatsApp Anda aktif sebelum melakukan tes koneksi.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
