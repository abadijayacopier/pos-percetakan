import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiSave, FiSettings, FiRefreshCcw, FiKey, FiLink, FiCheckCircle, FiAlertCircle, FiShield, FiUpload, FiSend, FiSmartphone, FiLogOut, FiZap, FiInfo, FiEye, FiEyeOff, FiGlobe } from 'react-icons/fi';

import api from '../../services/api';
import Swal from 'sweetalert2';

export default function WhatsAppSettings({
    waGatewayUrl, setWaGatewayUrl,
    waApiKey, setWaApiKey,
    waSessionName, setWaSessionName,
    waSenderNumber, setWaSenderNumber,
    waTemplateInv, setWaTemplateInv,
    waTemplateProcess, setWaTemplateProcess,
    waTemplateDone, setWaTemplateDone,
    waTemplateKasir, setWaTemplateKasir,
    saveSettings
}) {
    const [status, setStatus] = useState({ status: 'disconnected', qr: null, info: null });
    const [loadingStatus, setLoadingStatus] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [testForm, setTestForm] = useState({ to: '', message: 'Tes pesan dari sistem POS Abadi Jaya.' });

    const fetchStatus = async () => {
        try {
            const res = await api.get('/wa-gateway/status');
            setStatus(res.data);
        } catch (error) {
            console.error('Failed to fetch WA status');
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleInit = async () => {
        setLoadingStatus(true);
        try {
            await api.post('/wa-gateway/init');
            showToast('Inisialisasi dimulai...', 'info');
            fetchStatus();
        } catch (error) {
            showToast('Gagal memulai inisialisasi', 'error');
        } finally {
            setLoadingStatus(false);
        }
    };

    const handleLogout = async () => {
        const res = await Swal.fire({
            title: 'Logout WhatsApp?',
            text: 'Anda harus men-scan ulang QR code untuk menghubungkan kembali.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Logout'
        });
        if (!res.isConfirmed) return;

        try {
            await api.post('/wa-gateway/logout');
            fetchStatus();
            showToast('Berhasil logout', 'success');
        } catch (error) {
            showToast('Gagal logout', 'error');
        }
    };

    const handleTestSend = async () => {
        if (!testForm.to || !testForm.message) {
            showToast('Lengkapi nomor tujuan & pesan!', 'warning');
            return;
        }
        setTestLoading(true);
        try {
            await api.post('/wa-gateway/test', testForm);
            Swal.fire({
                icon: 'success',
                title: 'Terkirim!',
                text: 'Pesan tes berhasil dikirim ke ' + testForm.to,
                confirmButtonColor: '#10b981'
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal Kirim',
                text: error.response?.data?.message || 'Terjadi kesalahan sistem.',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setTestLoading(false);
        }
    };

    const showToast = (msg, icon) => {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        Toast.fire({ icon, title: msg });
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-500/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                            <FiMessageSquare size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tight">WhatsApp Gateway</h3>
                            <p className="text-emerald-100 text-sm font-medium opacity-80">Konfigurasi API Notifikasi & Otomatisasi Pesan Pelanggan</p>
                        </div>
                    </div>
                </div>
            </div>



            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column: Connection & Test */}
                <div className="xl:col-span-4 space-y-8">
                    {/* Gateway API Configuration */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                            <FiSettings className="text-emerald-500" /> Gateway Config
                        </h4>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gateway URL</label>
                                <div className="relative">
                                    <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white"
                                        placeholder="https://wa.yourdomain.com"
                                        value={waGatewayUrl}
                                        onChange={e => setWaGatewayUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">API Key</label>
                                <div className="relative">
                                    <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type={showApiKey ? "text" : "password"}
                                        className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white"
                                        placeholder="API Key..."
                                        value={waApiKey}
                                        onChange={e => setWaApiKey(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                                    >
                                        {showApiKey ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="pt-2">
                                <button
                                    onClick={saveSettings}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                >
                                    <FiSave /> Simpan Gateway
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Connection Status & QR */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                            <FiZap className="text-yellow-500" /> Koneksi Gateway
                        </h4>

                        <div className="flex flex-col items-center">
                            {status.status === 'qr' && status.qr ? (
                                <div className="space-y-6 text-center">
                                    <div className="p-4 bg-white rounded-3xl border-4 border-slate-100 shadow-inner">
                                        <img src={status.qr} alt="WA QR Code" className="w-48 h-48 mx-auto" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase">Tautkan Perangkat</p>
                                        <p className="text-[10px] text-slate-500 font-medium px-4">Buka WhatsApp &gt; Perangkat Tertaut &gt; Tautkan Perangkat.</p>

                                    </div>
                                </div>
                            ) : status.status === 'ready' ? (
                                <div className="space-y-6 text-center w-full">
                                    <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                                        <FiCheckCircle size={48} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Terhubung</p>
                                        <p className="text-xs font-bold text-emerald-500">{status.info?.pushname || 'WhatsApp Session'}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">{status.info?.wid?.user || waSenderNumber}</p>
                                    </div>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full py-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <FiLogOut /> Putuskan Koneksi
                                    </button>
                                </div>
                            ) : (status.status === 'connecting' || status.status === 'loading') ? (
                                <div className="space-y-6 text-center w-full py-12">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-emerald-500 animate-spin mx-auto" />
                                        <div className="absolute inset-0 flex items-center justify-center text-emerald-500">
                                            <FiRefreshCcw size={32} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Menyiapkan Browser...</p>
                                        <p className="text-[10px] text-slate-500 font-medium animate-pulse">Sistem sedang membuka jalur komunikasi WhatsApp. Mohon tunggu sejenak.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 text-center w-full py-4">
                                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto animate-pulse">
                                        <FiSmartphone size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase">Siap Menghubungkan</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Klik tombol di bawah untuk memunculkan QR Code.</p>
                                    </div>
                                    <button 
                                        onClick={handleInit}
                                        disabled={loadingStatus}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                    >
                                        {loadingStatus ? <FiRefreshCcw className="animate-spin" /> : <FiLink />}
                                        Tautkan Sekarang
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            const res = await Swal.fire({
                                                title: 'Reset Sesi WhatsApp?',
                                                text: 'Ini akan menghapus semua cache sesi dan mengulang dari awal. Gunakan jika QR tidak muncul.',
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonText: 'Ya, Reset'
                                            });
                                            if (!res.isConfirmed) return;
                                            try {
                                                await api.post('/wa-gateway/reset');
                                                showToast('Sesi berhasil direset', 'success');
                                                fetchStatus();
                                            } catch (e) {
                                                showToast('Gagal reset sesi', 'error');
                                            }
                                        }}
                                        className="w-full py-2 text-[9px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
                                    >
                                        Mulai Ulang / Reset Sesi
                                    </button>
                                </div>
                            )}


                        </div>
                    </div>

                    {/* Test Send Message */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                            <FiSend className="text-blue-500" /> Test Kirim Pesan
                        </h4>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor Tujuan</label>
                                <input 
                                    type="text"
                                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                    placeholder="628123..."
                                    value={testForm.to}
                                    onChange={e => setTestForm({...testForm, to: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pesan</label>
                                <textarea 
                                    rows="2"
                                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white resize-none"
                                    value={testForm.message}
                                    onChange={e => setTestForm({...testForm, message: e.target.value})}
                                />
                            </div>
                            <button 
                                onClick={handleTestSend}
                                disabled={testLoading || status.status !== 'ready'}
                                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${status.status === 'ready' ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                                {testLoading ? <FiRefreshCcw className="animate-spin" /> : <FiSend />}
                                Kirim Pesan Tes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Templates */}
                <div className="xl:col-span-8 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                                <FiMessageSquare className="text-emerald-500" /> Template Notifikasi Otomatis
                            </h4>
                            <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[9px] font-bold rounded-lg uppercase tracking-widest">
                                Global Variables Enabled
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Template Invoice */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest ml-1 flex justify-between items-center">
                                    <span>Invoice (Baru)</span>
                                    <span className="text-[9px] text-emerald-500 lowercase opacity-60">{"{{name}}"}, {"{{invoice}}"}, {"{{total}}"}</span>
                                </label>
                                <textarea
                                    rows="4"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white resize-none shadow-inner"
                                    value={waTemplateInv}
                                    onChange={e => setWaTemplateInv(e.target.value)}
                                    placeholder="Template saat transaksi baru dibuat..."
                                />
                            </div>

                            {/* Template Proses */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest ml-1 flex justify-between items-center">
                                    <span>Update Proses</span>
                                    <span className="text-[9px] text-emerald-500 lowercase opacity-60">{"{{name}}"}, {"{{invoice}}"}</span>
                                </label>
                                <textarea
                                    rows="4"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white resize-none shadow-inner"
                                    value={waTemplateProcess}
                                    onChange={e => setWaTemplateProcess(e.target.value)}
                                    placeholder="Template saat pesanan masuk tahap produksi..."
                                />
                            </div>

                            {/* Template Selesai */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest ml-1 flex justify-between items-center">
                                    <span>Pesanan Selesai</span>
                                    <span className="text-[9px] text-emerald-500 lowercase opacity-60">{"{{name}}"}, {"{{invoice}}"}</span>
                                </label>
                                <textarea
                                    rows="4"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white resize-none shadow-inner"
                                    value={waTemplateDone}
                                    onChange={e => setWaTemplateDone(e.target.value)}
                                    placeholder="Template saat pesanan siap diambil..."
                                />
                            </div>

                            {/* Template Kasir/Internal */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest ml-1 flex justify-between items-center">
                                    <span>Laporan Kasir (Internal)</span>
                                    <span className="text-[9px] text-emerald-500 lowercase opacity-60">{"{{invoice}}"}, {"{{total}}"}, {"{{user}}"}</span>
                                </label>
                                <textarea
                                    rows="4"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white resize-none shadow-inner"
                                    value={waTemplateKasir}
                                    onChange={e => setWaTemplateKasir(e.target.value)}
                                    placeholder="Template untuk laporan transaksi internal..."
                                />
                            </div>
                        </div>

                        <div className="mt-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                <FiInfo className="text-blue-500" /> Panduan Variabel
                            </h5>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { tag: '{{name}}', desc: 'Nama Pelanggan' },
                                    { tag: '{{invoice}}', desc: 'Nomor Invoice' },
                                    { tag: '{{total}}', desc: 'Total Tagihan' },
                                    { tag: '{{user}}', desc: 'Nama Kasir' },
                                ].map(item => (
                                    <div key={item.tag} className="space-y-1">
                                        <code className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{item.tag}</code>
                                        <p className="text-[9px] font-medium text-slate-500">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
