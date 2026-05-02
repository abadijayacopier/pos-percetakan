import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiCpu } from 'react-icons/fi';
import api from '../services/api';
import Swal from 'sweetalert2';

export default function WASettingsPage({ onNavigate }) {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    // Gateway states
    const [gateway, setGateway] = useState({ status: 'disconnected', qr: null, info: null });
    const [loadingGateway, setLoadingGateway] = useState(false);

    // Template states
    const [templateReceived, setTemplateReceived] = useState('Halo [NamaPelanggan], pesanan Anda dengan nomor [NomorSPK] telah kami terima dan sedang diverifikasi oleh admin. Terima kasih!');
    const [templateProcess, setTemplateProcess] = useState('Kabar baik [NamaPelanggan]! Pesanan [NamaProduk] Anda saat ini sudah masuk ke tahap produksi/cetak.');
    const [templateFinishing, setTemplateFinishing] = useState('Halo [NamaPelanggan], pesanan [NamaProduk] sedang dalam tahap finishing (pemotongan/packing).');
    const [templateReady, setTemplateReady] = useState('Pesanan Anda ([NamaProduk]) Selesai! Silakan ambil di outlet kami dengan menunjukkan nomor SPK: [NomorSPK].');
    const [templateServiceReceived, setTemplateServiceReceived] = useState('Halo [NamaPelanggan], mesin fotocopy Anda dengan nomor service [NomorService] telah kami terima. Teknisi kami akan segera melakukan pengecekan. Terima kasih!');
    const [templateServiceDone, setTemplateServiceDone] = useState('Kabar baik [NamaPelanggan]! Perbaikan mesin fotocopy Anda ([NomorService]) telah selesai dilakukan. Silakan hubungi kami untuk pengaturan pengambilan/pengiriman. Terima kasih!');

    // Toggle states
    const [sendReceived, setSendReceived] = useState(true);
    const [sendProcess, setSendProcess] = useState(true);
    const [sendFinishing, setSendFinishing] = useState(false);
    const [sendReady, setSendReady] = useState(true);
    const [sendReceipt, setSendReceipt] = useState(true);
    const [sendServiceReceived, setSendServiceReceived] = useState(true);
    const [sendServiceDone, setSendServiceDone] = useState(true);
    const [sendFotocopyDone, setSendFotocopyDone] = useState(true);
    const [templateFotocopyDone, setTemplateFotocopyDone] = useState('Halo [NamaPelanggan], pesanan fotocopy/cetak Anda ([NomorSPK]) sudah selesai dan siap diambil. Terima kasih!');

    // Test states
    const [testNumber, setTestNumber] = useState('');
    const [sendingTest, setSendingTest] = useState(false);

    // Receipt Template
    const [templateReceipt, setTemplateReceipt] = useState('Terima kasih *[NamaPelanggan]* telah berbelanja di *[NamaToko]*.\n\n*Detail Transaksi:*\nNo. Transaksi: [NomorInvoice]\nTotal: [TotalBelanja]\n\nCek struk digital Anda di sini:\n[LinkStruk]\n\nSemoga hari Anda menyenangkan! 🙏');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get('/wa-config');
                if (res.data) {
                    setApiKey(res.data.api_token || '');
                    setPhoneNumber(res.data.phone_number || '');
                    if (res.data.template_received) setTemplateReceived(res.data.template_received);
                    if (res.data.template_process) setTemplateProcess(res.data.template_process);
                    if (res.data.template_finishing) setTemplateFinishing(res.data.template_finishing);
                    if (res.data.template_ready) setTemplateReady(res.data.template_ready);

                    if (res.data.send_received !== undefined) setSendReceived(res.data.send_received === 'true' || res.data.send_received === true);
                    if (res.data.send_process !== undefined) setSendProcess(res.data.send_process === 'true' || res.data.send_process === true);
                    if (res.data.send_finishing !== undefined) setSendFinishing(res.data.send_finishing === 'true' || res.data.send_finishing === true);
                    if (res.data.send_ready !== undefined) setSendReady(res.data.send_ready === 'true' || res.data.send_ready === true);
                    if (res.data.send_receipt !== undefined) setSendReceipt(res.data.send_receipt === 'true' || res.data.send_receipt === true);
                    if (res.data.template_receipt) setTemplateReceipt(res.data.template_receipt);
                    
                    if (res.data.template_service_received) setTemplateServiceReceived(res.data.template_service_received);
                    if (res.data.template_service_done) setTemplateServiceDone(res.data.template_service_done);
                    if (res.data.send_service_received !== undefined) setSendServiceReceived(res.data.send_service_received === 'true' || res.data.send_service_received === true);
                    if (res.data.send_service_done !== undefined) setSendServiceDone(res.data.send_service_done === 'true' || res.data.send_service_done === true);
                    if (res.data.template_fotocopy_done) setTemplateFotocopyDone(res.data.template_fotocopy_done);
                    if (res.data.send_fotocopy_done !== undefined) setSendFotocopyDone(res.data.send_fotocopy_done === 'true' || res.data.send_fotocopy_done === true);
                }
            } catch (err) { console.error('Gagal fetch WA config:', err); }
        };
        fetchConfig();
    }, []);

    useEffect(() => {
        const fetchGatewayStatus = async () => {
            try {
                const res = await api.get('/wa-gateway/status');
                if (res.data && typeof res.data === 'object') {
                    setGateway(prev => {
                        if (JSON.stringify(prev) === JSON.stringify(res.data)) return prev;
                        return res.data;
                    });
                }
            } catch (err) { console.error('Gagal fetch status gateway:', err); }
        };

        fetchGatewayStatus();
        const interval = setInterval(() => {
            fetchGatewayStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleInitGateway = async () => {
        setLoadingGateway(true);
        try {
            await api.post('/wa-gateway/init');
            // Status akan diupdate oleh polling
        } catch (err) {
            Swal.fire('Gagal', 'Gagal inisialisasi gateway', 'error');
        } finally {
            setLoadingGateway(false);
        }
    };

    const handleLogoutGateway = async () => {
        const result = await Swal.fire({
            title: 'Logout WhatsApp?',
            text: 'Anda harus scan QR code lagi untuk menghubungkan kembali.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Logout',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                await api.post('/wa-gateway/logout');
                setGateway({ status: 'disconnected', qr: null, info: null });
            } catch (err) {
                Swal.fire('Gagal', 'Gagal logout gateway', 'error');
            }
        }
    };

    const handleResetGateway = async () => {
        const result = await Swal.fire({
            title: 'Reset Sesi WhatsApp?',
            text: 'Semua data sesi lokal akan dihapus. Gunakan ini jika gateway macet atau tidak bisa diinisialisasi.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Reset',
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            setLoadingGateway(true);
            try {
                await api.post('/wa-gateway/reset');
                setGateway({ status: 'disconnected', qr: null, info: null });
                Swal.fire('Berhasil', 'Sesi telah direset. Silakan inisialisasi ulang.', 'success');
            } catch (err) {
                Swal.fire('Gagal', 'Gagal reset gateway', 'error');
            } finally {
                setLoadingGateway(false);
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveMsg('');
        try {
            await api.put('/wa-config', {
                api_token: apiKey,
                phone_number: phoneNumber,
                template_received: templateReceived,
                template_process: templateProcess,
                template_finishing: templateFinishing,
                template_ready: templateReady,
                send_received: sendReceived,
                send_process: sendProcess,
                send_finishing: sendFinishing,
                send_ready: sendReady,
                send_receipt: sendReceipt,
                template_receipt: templateReceipt,
                template_service_received: templateServiceReceived,
                template_service_done: templateServiceDone,
                send_service_received: sendServiceReceived,
                send_service_done: sendServiceDone,
                template_fotocopy_done: templateFotocopyDone,
                send_fotocopy_done: sendFotocopyDone
            });
            setSaveMsg(<>Konfigurasi berhasil disimpan! <FiCheck /></>);
            setTimeout(() => setSaveMsg(''), 3000);
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
            setSaveMsg(<span className="flex items-center gap-2">Gagal: {errorMsg} <FiX /></span>);
        } finally {
            setSaving(false);
        }
    };

    const handleTestMessage = async () => {
        if (!testNumber) return Swal.fire('Gagal', 'Masukkan nomor tujuan tes', 'error');
        if (!gateway || gateway.status !== 'ready') return Swal.fire('Gagal', 'WhatsApp Gateway belum terhubung', 'error');

        setSendingTest(true);
        try {
            await api.post('/wa-gateway/test', {
                to: testNumber,
                message: 'Halo! Ini adalah pesan uji coba dari sistem POS Abadi Jaya. Integrasi WhatsApp Anda sudah berhasil! 🚀'
            });
            Swal.fire('Berhasil', 'Pesan tes telah dikirim', 'success');
        } catch (err) {
            Swal.fire('Gagal', 'Gagal mengirim pesan tes: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setSendingTest(false);
        }
    };

    return (
        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100 transition-colors pb-10">
            <header className="px-6 py-6 md:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[100] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-blue-900/5 dark:to-indigo-900/5 z-0"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all active:scale-95 group"
                    >
                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
                            WhatsApp <span className="text-blue-600">Pro Gateway</span>
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Multi-Channel Notification System</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className={`${gateway?.status === 'ready' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 
                        gateway?.status === 'qr' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' : 
                        'bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-800'} border rounded-2xl px-4 py-2.5 flex items-center gap-4 transition-all duration-300`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 transition-all shadow-sm ${
                            gateway?.status === 'ready' ? 'bg-emerald-500 shadow-emerald-500/20' : gateway?.status === 'qr' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-slate-400'
                        }`}>
                            <span className="material-symbols-outlined text-xl">
                                {gateway?.status === 'ready' ? 'verified' : gateway?.status === 'qr' ? 'qr_code_2' : 'link_off'}
                            </span>
                        </div>
                        <div className="pr-2">
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${
                                gateway?.status === 'ready' ? 'text-emerald-600 dark:text-emerald-400' : 
                                gateway?.status === 'qr' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-50'
                            }`}>Gateway Status</p>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-none uppercase italic">
                                    {gateway?.status === 'ready' ? 'Connected' : gateway?.status === 'qr' ? 'Wait Scan' : 
                                     gateway?.status === 'connecting' ? 'Linking...' : 'Offline'}
                                </h3>
                                <span className={`w-2 h-2 rounded-full transition-colors ${
                                    gateway?.status === 'ready' ? 'bg-emerald-500 animate-pulse' : 
                                    gateway?.status === 'qr' ? 'bg-amber-500 animate-bounce' : 
                                    gateway?.status === 'connecting' ? 'bg-blue-500 animate-spin' : 'bg-slate-300'
                                }`}></span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-3 group relative overflow-hidden">
                        <span className="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                        {saving ? (
                            <>
                                <span className="material-symbols-outlined text-sm animate-spin relative z-10">refresh</span>
                                <span className="relative z-10">Saving...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform relative z-10">save</span>
                                <span className="relative z-10">Save Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-8 space-y-8">
                        <section className="glass-panel rounded-[2.5rem] pro-max-shadow overflow-hidden transition-all duration-500 hover:shadow-2xl border-white/40 dark:border-slate-800/50">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/5 z-0"></div>
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shadow-inner">
                                        <span className="material-symbols-outlined text-2xl">mail</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Template Notifikasi Pesanan</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Atur pesan otomatis untuk setiap tahap produksi & layanan.</p>
                                    </div>
                                </div>
                                <div className="relative z-10 flex flex-wrap gap-2">
                                    {['[NamaPelanggan]', '[NamaProduk]', '[NomorSPK]', '[NamaToko]'].map(p => (
                                        <button 
                                            key={p}
                                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm cursor-pointer border border-blue-100 dark:border-blue-800/50 uppercase tracking-tighter active:scale-95"
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-black shadow-inner">1</span>
                                                Pesanan Diterima
                                            </label>
                                            <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1 rounded-xl">
                                                <input type="checkbox" className="w-4 h-4 rounded text-blue-600" checked={sendReceived} onChange={(e) => setSendReceived(e.target.checked)} />
                                                <span className="text-[10px] font-bold uppercase">Aktif</span>
                                            </div>
                                        </div>
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-sm font-medium transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none h-32 leading-relaxed"
                                            value={templateReceived}
                                            onChange={(e) => setTemplateReceived(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-black shadow-inner">2</span>
                                                Tahap Produksi
                                            </label>
                                            <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1 rounded-xl">
                                                <input type="checkbox" className="w-4 h-4 rounded text-amber-600" checked={sendProcess} onChange={(e) => setSendProcess(e.target.checked)} />
                                                <span className="text-[10px] font-bold uppercase">Aktif</span>
                                            </div>
                                        </div>
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-sm font-medium transition-all focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none h-32 leading-relaxed"
                                            value={templateProcess}
                                            onChange={(e) => setTemplateProcess(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shadow-inner">3</span>
                                            Pesanan Siap Ambil
                                        </label>
                                        <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1 rounded-xl">
                                            <input type="checkbox" className="w-4 h-4 rounded text-emerald-600" checked={sendReady} onChange={(e) => setSendReady(e.target.checked)} />
                                            <span className="text-[10px] font-bold uppercase">Aktif</span>
                                        </div>
                                    </div>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-sm font-medium transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none h-32 leading-relaxed"
                                        value={templateReady}
                                        onChange={(e) => setTemplateReady(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        </section>

                        <section className="glass-panel rounded-[2.5rem] pro-max-shadow overflow-hidden transition-all duration-500 hover:shadow-2xl border-white/40 dark:border-slate-800/50 mt-12">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/5 z-0"></div>
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shadow-inner">
                                        <span className="material-symbols-outlined text-2xl">construction</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Layanan Fotocopy & Service</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Khusus layanan perbaikan mesin & jasa fotocopy.</p>
                                    </div>
                                </div>
                                <div className="relative z-10 flex flex-wrap gap-2">
                                    {['[NamaPelanggan]', '[NomorService]', '[NomorSPK]', '[InfoMesin]', '[NamaToko]'].map(p => (
                                        <button 
                                            key={p}
                                            onClick={() => {
                                                // Check which textarea is focused or just append to Fotocopy if it's the new one
                                                setTemplateFotocopyDone(prev => prev + p)
                                            }}
                                            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all shadow-sm cursor-pointer border border-emerald-100 dark:border-emerald-800/50 uppercase tracking-tighter active:scale-95"
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                                Service Masuk
                                            </label>
                                            <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1 rounded-xl">
                                                <input type="checkbox" className="w-4 h-4 rounded text-emerald-600" checked={sendServiceReceived} onChange={(e) => setSendServiceReceived(e.target.checked)} />
                                                <span className="text-[10px] font-bold uppercase">Aktif</span>
                                            </div>
                                        </div>
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 text-sm font-medium transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none h-32 leading-relaxed"
                                            value={templateServiceReceived}
                                            onChange={(e) => setTemplateServiceReceived(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                                Service Selesai
                                            </label>
                                            <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1 rounded-xl">
                                                <input type="checkbox" className="w-4 h-4 rounded text-emerald-600" checked={sendServiceDone} onChange={(e) => setSendServiceDone(e.target.checked)} />
                                                <span className="text-[10px] font-bold uppercase">Aktif</span>
                                            </div>
                                        </div>
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 text-sm font-medium transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none h-32 leading-relaxed"
                                            value={templateServiceDone}
                                            onChange={(e) => setTemplateServiceDone(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                            Fotocopy Selesai (Siap Ambil)
                                        </label>
                                        <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1 rounded-xl">
                                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600" checked={sendFotocopyDone} onChange={(e) => setSendFotocopyDone(e.target.checked)} />
                                            <span className="text-[10px] font-bold uppercase">Aktif</span>
                                        </div>
                                    </div>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 text-sm font-medium transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none h-32 leading-relaxed"
                                        value={templateFotocopyDone}
                                        onChange={(e) => setTemplateFotocopyDone(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        </section>

                        <section className="glass-panel dark:glass-panel rounded-4xl pro-max-shadow overflow-hidden mt-8 transition-all duration-500 hover:shadow-2xl">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/30 to-teal-50/30 dark:from-emerald-900/5 dark:to-teal-900/5 z-0"></div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                        <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">WhatsApp Gateway Mandiri</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Hubungkan WhatsApp Anda tanpa biaya provider tambahan.</p>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border relative z-10 ${gateway.status === 'ready' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    gateway.status === 'qr' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                    }`}>
                                    {gateway.status === 'ready' ? 'Terhubung' : gateway.status === 'qr' ? 'Menunggu Scan' : 'Terputus'}
                                </div>
                            </div>

                            <div className="p-10 flex flex-col items-center justify-center text-center space-y-6">
                                {gateway.status === 'disconnected' && (
                                    <div className="space-y-6 max-w-md">
                                        <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                            <span className="material-symbols-outlined text-4xl text-slate-400">link_off</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">Gateway Belum Aktif</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                            Klik tombol di bawah untuk memulai sesi WhatsApp Gateway. Anda perlu melakukan scan QR code satu kali.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                            <button
                                                onClick={handleInitGateway}
                                                disabled={loadingGateway}
                                                className="px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl disabled:opacity-50"
                                            >
                                                {loadingGateway ? 'Menghubungkan...' : 'Inisialisasi Gateway'}
                                            </button>
                                            <button
                                                onClick={handleResetGateway}
                                                disabled={loadingGateway}
                                                className="px-8 py-3.5 border border-rose-200 dark:border-rose-900/30 text-rose-500 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all disabled:opacity-50"
                                            >
                                                Reset Sesi
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {gateway.status === 'connecting' && (
                                    <div className="space-y-6">
                                        <div className="size-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                                            <span className="material-symbols-outlined text-4xl text-blue-500">sync</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-white italic">Menyiapkan Browser...</h3>
                                        <p className="text-xs text-slate-400 italic">Mohon tunggu sebentar selagi sistem menyiapkan sesi aman.</p>
                                    </div>
                                )}

                                {gateway.status === 'qr' && gateway.qr && (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-white rounded-3xl shadow-2xl border-8 border-slate-50 relative group">
                                            <img src={gateway.qr} alt="Scan QR" className="size-64" />
                                            <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                <span className="bg-slate-900/80 text-white text-[10px] font-black px-4 py-2 rounded-full">SCAN DENGAN WHATSAPP</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-tighter">Scan QR Code</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                                                Buka WhatsApp di HP Anda &gt; Perangkat Tertaut &gt; Tautkan Perangkat.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {gateway.status === 'ready' && (
                                    <div className="space-y-6">
                                        <div className="size-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto relative">
                                            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                                            <span className="material-symbols-outlined text-5xl text-emerald-500 relative z-10">check_circle</span>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Gateway Aktif</h3>
                                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                {gateway.info?.pushname || 'Perangkat Tertaut'} ({gateway.info?.wid?.user || phoneNumber})
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleLogoutGateway}
                                            className="px-6 py-2.5 border border-rose-100 dark:border-rose-900/30 text-rose-500 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all shadow-sm"
                                        >
                                            Keluar / Putus Koneksi
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="glass-panel rounded-[2.5rem] pro-max-shadow overflow-hidden mt-12 transition-all duration-500 hover:shadow-2xl border-white/40 dark:border-slate-800/50">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/5 z-0"></div>
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 shadow-inner relative z-10">
                                    <span className="material-symbols-outlined text-xl">vpn_key</span>
                                </div>
                                <div className="relative z-10">
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">API Provider (Fallback)</h2>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Digunakan jika Gateway Mandiri Offline.</p>
                                </div>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp API Key</label>
                                    <div className="relative">
                                        <input
                                            type={showKey ? 'text' : 'password'}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-5 text-sm font-mono pr-12 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                        />
                                        <button
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            onClick={() => setShowKey(!showKey)}
                                        >
                                            <span className="material-symbols-outlined text-sm">{showKey ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number (ID)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                        placeholder="Contoh: 85655620979"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="flex justify-end items-center gap-4 py-6 mt-12 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[2rem] px-8 border border-white/40 dark:border-slate-800/50 shadow-xl">
                            {saveMsg && <div className="flex items-center text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] bg-emerald-50 dark:bg-emerald-900/30 px-6 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 animate-in fade-in slide-in-from-right-4 duration-300">
                                {saveMsg}
                            </div>}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-4 group relative overflow-hidden">
                                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                                {saving ? (
                                    <>
                                        <span className="material-symbols-outlined text-sm animate-spin relative z-10">refresh</span>
                                        <span className="relative z-10">Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm group-hover:scale-125 transition-transform relative z-10">save</span>
                                        <span className="relative z-10">Save Configurations</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="xl:col-span-4 space-y-8">
                        <div className="bg-slate-200 dark:bg-slate-800 rounded-[3.5rem] p-4 border-[12px] border-slate-900 dark:border-slate-950 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative max-w-sm mx-auto w-full group overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 dark:bg-slate-950 rounded-b-3xl z-30"></div>

                            <div className="bg-[#e5ddd5] dark:bg-slate-900 h-[620px] rounded-[2.5rem] overflow-hidden flex flex-col relative">
                                <div className="bg-emerald-600 dark:bg-emerald-800 text-white p-4 pt-10 flex items-center gap-4 shadow-md relative z-20">
                                    <span className="material-symbols-outlined text-xl opacity-80">arrow_back_ios_new</span>
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/10">
                                        <span className="material-symbols-outlined text-xl">print</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black tracking-tight truncate">Abadi Jaya Printing</p>
                                        <p className="text-[10px] opacity-80 leading-tight mt-0.5 font-bold uppercase tracking-tighter flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[10px] text-emerald-300">verified</span>
                                            Official Store
                                        </p>
                                    </div>
                                    <span className="material-symbols-outlined text-xl opacity-80">more_vert</span>
                                </div>

                                <div className="flex-1 p-5 space-y-5 overflow-y-auto pattern-wa dark:pattern-wa-dark pb-20 relative">
                                    <div className="absolute inset-0 bg-slate-900/5 dark:bg-transparent pointer-events-none"></div>
                                    
                                    <div className="max-w-[85%] bg-white dark:bg-slate-800 p-4 rounded-3xl rounded-tl-sm shadow-sm relative mr-auto border border-slate-100/50 dark:border-slate-700/50">
                                        <p className="text-[12px] leading-relaxed text-slate-800 dark:text-slate-200 pr-8 font-medium">
                                            Halo <b className="font-black text-slate-900 dark:text-white">Budi Santoso</b>, pesanan <b className="font-bold text-emerald-600">Fotocopy A4 (100 Lembar)</b> Anda telah kami terima.
                                        </p>
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 absolute bottom-2 right-3 font-bold uppercase">10:42</span>
                                    </div>

                                    <div className="max-w-[85%] bg-white dark:bg-slate-800 p-4 rounded-3xl rounded-tl-sm shadow-sm relative mr-auto border border-slate-100/50 dark:border-slate-700/50">
                                        <p className="text-[12px] leading-relaxed text-slate-800 dark:text-slate-200 pr-8 font-medium">
                                            Pesanan sedang dalam <b className="font-bold text-amber-600">Proses Cetak</b>. Kami akan kabari jika sudah siap! 🚀
                                        </p>
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 absolute bottom-2 right-3 font-bold uppercase">11:15</span>
                                    </div>

                                    <div className="max-w-[85%] bg-[#dcf8c6] dark:bg-emerald-900/40 p-4 rounded-3xl rounded-tr-sm shadow-sm relative ml-auto border border-[#dcf8c6]/50 dark:border-emerald-800/30">
                                        <p className="text-[12px] leading-relaxed text-slate-800 dark:text-slate-100 pr-14 font-medium italic">
                                            Siap, ditunggu ya kak 🙏
                                        </p>
                                        <div className="absolute bottom-2 right-3 flex items-center gap-1">
                                            <span className="text-[9px] text-emerald-800/60 dark:text-emerald-200/60 font-bold uppercase">11:16</span>
                                            <span className="material-symbols-outlined text-[14px] text-blue-500 dark:text-blue-400 leading-none">done_all</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl flex gap-3 items-center absolute bottom-0 w-full z-20 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <div className="flex-1 bg-white dark:bg-slate-700 rounded-full h-11 px-5 flex items-center gap-3 shadow-inner border border-slate-200 dark:border-slate-600">
                                        <span className="material-symbols-outlined text-slate-400 text-xl">mood</span>
                                        <div className="flex-1 text-xs text-slate-400 font-bold uppercase tracking-widest">Ketik pesan...</div>
                                        <span className="material-symbols-outlined text-slate-400 text-xl">attach_file</span>
                                    </div>
                                    <div className="w-11 h-11 bg-emerald-600 dark:bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shrink-0">
                                        <span className="material-symbols-outlined text-xl">mic</span>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -right-4 -bottom-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-6 shadow-2xl flex items-center gap-4 transform -rotate-3 z-40">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">LIVE PREVIEW</span>
                            </div>
                        </div>

                        <div className="glass-panel rounded-[2.5rem] p-8 pro-max-shadow text-center relative overflow-hidden mt-12 mb-8 border-blue-100/50 dark:border-slate-800/50">
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/5 z-0"></div>
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-200/30 relative z-10">
                                <span className="material-symbols-outlined text-3xl">send_to_mobile</span>
                            </div>
                            <h4 className="font-black text-xl mb-3 text-slate-900 dark:text-white uppercase tracking-tighter italic relative z-10">Uji Integrasi Gateway</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto font-bold uppercase tracking-tighter relative z-10 leading-relaxed">Pastikan gateway terhubung sebelum melakukan pengiriman uji coba.</p>
                            <div className="space-y-4 relative z-10">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <span className="text-slate-400 material-symbols-outlined text-xl group-focus-within:text-blue-500 transition-colors">call</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-14 pr-5 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none font-black tracking-widest shadow-inner transition-all" 
                                        placeholder="628123456789" 
                                        value={testNumber}
                                        onChange={(e) => setTestNumber(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={handleTestMessage}
                                    disabled={sendingTest || !testNumber}
                                    className="w-full py-4.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3 cursor-pointer relative overflow-hidden group disabled:opacity-50">
                                    <span className="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                                    <span className="material-symbols-outlined text-lg relative z-10">{sendingTest ? 'refresh' : 'bolt'}</span>
                                    <span className="relative z-10">{sendingTest ? 'Sending...' : 'Test Connection'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
