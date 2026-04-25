import { useState, useEffect } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import api from '../services/api';

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

    // Toggle states
    const [sendReceived, setSendReceived] = useState(true);
    const [sendProcess, setSendProcess] = useState(true);
    const [sendFinishing, setSendFinishing] = useState(false);
    const [sendReady, setSendReady] = useState(true);
    const [sendReceipt, setSendReceipt] = useState(true);

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
                }
            } catch (err) { console.error('Gagal fetch WA config:', err); }
        };
        fetchConfig();

        // Gateway Status Polling
        const fetchGatewayStatus = async () => {
            try {
                const res = await api.get('/wa-gateway/status');
                setGateway(res.data);
            } catch (err) { console.error('Gagal fetch status gateway:', err); }
        };

        fetchGatewayStatus();
        const interval = setInterval(() => {
            if (gateway.status !== 'ready') {
                fetchGatewayStatus();
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [gateway.status]);

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
                template_receipt: templateReceipt
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
        if (gateway.status !== 'ready') return Swal.fire('Gagal', 'WhatsApp Gateway belum terhubung', 'error');

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
        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100 font-display transition-colors pb-10">
            {/* Header */}
            <header className="px-6 py-6 md:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl">
                        <span className="material-symbols-outlined text-2xl">forum</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Pengaturan Notifikasi WhatsApp</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Kelola pesan otomatis untuk setiap tahap produksi pesanan pelanggan melalui API WhatsApp.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        Beranda
                    </button>
                    <div className={`${gateway.status === 'ready' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 
                        gateway.status === 'qr' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' : 
                        'bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-800'} border rounded-xl px-4 py-2 flex items-center gap-3 shadow-inner transition-all duration-300`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 transition-colors ${
                            gateway.status === 'ready' ? 'bg-emerald-500' : gateway.status === 'qr' ? 'bg-amber-500' : 'bg-slate-400'
                        }`}>
                            <span className="material-symbols-outlined text-sm">
                                {gateway.status === 'ready' ? 'check_circle' : gateway.status === 'qr' ? 'qr_code_2' : 'link_off'}
                            </span>
                        </div>
                        <div className="pr-2">
                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
                                gateway.status === 'ready' ? 'text-emerald-600 dark:text-emerald-400' : 
                                gateway.status === 'qr' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'
                            }`}>Status Gateway</p>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                                    {gateway.status === 'ready' ? 'Terhubung' : gateway.status === 'qr' ? 'Menunggu Scan' : 
                                     gateway.status === 'connecting' ? 'Menghubungkan...' : 'Terputus'}
                                </h3>
                                <span className={`w-2 h-2 rounded-full transition-colors ${
                                    gateway.status === 'ready' ? 'bg-emerald-500 animate-pulse' : 
                                    gateway.status === 'qr' ? 'bg-amber-500 animate-bounce' : 
                                    gateway.status === 'connecting' ? 'bg-blue-500 animate-spin' : 'bg-slate-300'
                                }`}></span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-8 space-y-8">
                        <section className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-4xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-8 flex flex-wrap items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800/50 relative overflow-hidden">
                                <div className="absolute inset-0 bg-linear-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/5 z-0"></div>
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                        <span className="material-symbols-outlined text-xl">mark_email_read</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Template Notifikasi Produksi</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Sesuaikan pesan otomatis untuk setiap status produksi.</p>
                                    </div>
                                </div>
                                <div className="relative z-10 flex flex-wrap gap-2">
                                    <button
                                        onClick={() => templateReady.includes('[NamaProduk]') ? setTemplateReady(t => t + ' [NamaPelanggan]') : null} // Placeholder dummy click handlers if needed, but usually users just copy-paste or we can make them append to active textarea if we track focus. For now just adding UI.
                                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm cursor-pointer border border-blue-100 dark:border-blue-800/50 uppercase tracking-tighter"
                                    >
                                        [NamaPelanggan]
                                    </button>
                                    <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm cursor-pointer border border-blue-100 dark:border-blue-800/50 uppercase tracking-tighter">
                                        [NamaProduk]
                                    </button>
                                    <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm cursor-pointer border border-blue-100 dark:border-blue-800/50 uppercase tracking-tighter">
                                        [NomorSPK]
                                    </button>
                                    <button className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors shadow-sm cursor-pointer border border-emerald-100 dark:border-emerald-800/50 uppercase tracking-tighter">
                                        [NamaToko]
                                    </button>
                                    <button className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors shadow-sm cursor-pointer border border-emerald-100 dark:border-emerald-800/50 uppercase tracking-tighter">
                                        [AlamatToko]
                                    </button>
                                    <button className="text-[10px] font-bold text-rose-600 dark:text-rose-400 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors shadow-sm cursor-pointer border border-rose-100 dark:border-rose-800/50 uppercase tracking-tighter">
                                        [Tagihan]
                                    </button>
                                    <button className="text-[10px] font-bold text-rose-600 dark:text-rose-400 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors shadow-sm cursor-pointer border border-rose-100 dark:border-rose-800/50 uppercase tracking-tighter">
                                        [Sisa]
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-black shadow-inner">1</span>
                                            Pesanan Diterima
                                        </label>
                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Otomatis kirim</span>
                                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer" checked={sendReceived} onChange={(e) => setSendReceived(e.target.checked)} />
                                        </div>
                                    </div>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none font-medium leading-relaxed"
                                        rows="3"
                                        value={templateReceived}
                                        onChange={(e) => setTemplateReceived(e.target.value)}
                                    ></textarea>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-xl bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center text-xs font-black shadow-inner">2</span>
                                            Proses Cetak
                                        </label>
                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Otomatis kirim</span>
                                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer" checked={sendProcess} onChange={(e) => setSendProcess(e.target.checked)} />
                                        </div>
                                    </div>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none font-medium leading-relaxed"
                                        rows="3"
                                        value={templateProcess}
                                        onChange={(e) => setTemplateProcess(e.target.value)}
                                    ></textarea>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shadow-inner">3</span>
                                            Finishing
                                        </label>
                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Otomatis kirim</span>
                                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer" checked={sendFinishing} onChange={(e) => setSendFinishing(e.target.checked)} />
                                        </div>
                                    </div>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none font-medium leading-relaxed"
                                        rows="3"
                                        value={templateFinishing}
                                        onChange={(e) => setTemplateFinishing(e.target.value)}
                                    ></textarea>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shadow-inner">4</span>
                                            Siap Diambil
                                        </label>
                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Otomatis kirim</span>
                                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer" checked={sendReady} onChange={(e) => setSendReady(e.target.checked)} />
                                        </div>
                                    </div>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none font-medium leading-relaxed"
                                        rows="3"
                                        value={templateReady}
                                        onChange={(e) => setTemplateReady(e.target.value)}
                                    ></textarea>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black shadow-inner">5</span>
                                            Struk Kasir
                                        </label>
                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Otomatis kirim</span>
                                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer" checked={sendReceipt} onChange={(e) => setSendReceipt(e.target.checked)} />
                                        </div>
                                    </div>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none font-medium leading-relaxed"
                                        rows="4"
                                        value={templateReceipt}
                                        onChange={(e) => setTemplateReceipt(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-4xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mt-8">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between relative overflow-hidden">
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                        <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">WhatsApp Gateway Mandiri</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Hubungkan WhatsApp Anda tanpa biaya provider tambahan.</p>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${gateway.status === 'ready' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
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

                        <section className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-4xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mt-8 transition-all">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 relative overflow-hidden">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                    <span className="material-symbols-outlined text-xl">vpn_key</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white italic">API Provider (Opsional/Fallback)</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">Hanya digunakan jika Gateway Mandiri mengalami gangguan.</p>
                                </div>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">WhatsApp API Key</label>
                                    <div className="relative">
                                        <input
                                            type={showKey ? 'text' : 'password'}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-mono pr-12"
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
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nomor Telepon (ID Perangkat)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs"
                                        placeholder="Contoh: 85655620979"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="flex justify-end gap-4 py-4 mt-6">
                            <button className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                                Batalkan
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-xl shadow-blue-200 dark:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 group">
                                {saving ? (
                                    <>
                                        <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">save</span>
                                        Simpan Perubahan
                                    </>
                                )}
                            </button>
                            {saveMsg && <div className="flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400 ml-4 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                {saveMsg}
                            </div>}
                        </div>
                    </div>

                    <div className="xl:col-span-4 space-y-8">
                        {/* iPhone Mockup Container */}
                        <div className="bg-slate-200 dark:bg-slate-800 rounded-[3rem] p-4 border-12 border-slate-900 dark:border-slate-950 shadow-2xl relative max-w-sm mx-auto w-full group overflow-hidden">
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-900 dark:bg-slate-950 rounded-b-3xl z-30 flex items-center justify-center gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-500/30"></div>
                                <div className="w-16 h-1.5 rounded-full bg-slate-500/30"></div>
                            </div>

                            <div className="bg-[#e5ddd5] dark:bg-slate-800 h-[620px] rounded-4xl overflow-hidden flex flex-col relative">
                                {/* WhatsApp Header */}
                                <div className="bg-emerald-600 dark:bg-emerald-800 text-white p-4 pt-8 flex items-center gap-4 shadow-sm relative z-20">
                                    <span className="material-symbols-outlined text-xl cursor-default opacity-80 hover:opacity-100 transition-opacity">arrow_back_ios_new</span>
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/10">
                                        <span className="material-symbols-outlined text-xl">print</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold leading-tight truncate">PrintManager</p>
                                        <p className="text-[10px] opacity-80 leading-tight mt-0.5 font-medium flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[10px] text-emerald-300">verified</span>
                                            Akun Bisnis Resmi
                                        </p>
                                    </div>
                                    <span className="material-symbols-outlined text-xl cursor-default opacity-80 hover:opacity-100 transition-opacity">more_vert</span>
                                </div>

                                {/* Chat Body */}
                                <div className="flex-1 p-5 space-y-5 overflow-y-auto pattern-wa dark:pattern-wa-dark pb-20">
                                    <div className="max-w-[85%] bg-white dark:bg-slate-700 p-3.5 rounded-2xl rounded-tl-sm shadow-sm relative mr-auto border border-slate-100/50 dark:border-slate-600/50 drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                                        <p className="text-[12px] leading-relaxed text-slate-800 dark:text-slate-200 pr-8">
                                            Halo <b className="font-bold">Budi Santoso</b>, pesanan Anda dengan nomor <b className="font-bold text-emerald-600 dark:text-emerald-400">SPK-2023-0892</b> telah kami terima dan sedang diverifikasi oleh admin. Terima kasih!
                                        </p>
                                        <span className="text-[9px] text-slate-400 dark:text-slate-400 absolute bottom-1.5 right-2 font-medium">10:42</span>
                                    </div>

                                    <div className="max-w-[85%] bg-white dark:bg-slate-700 p-3.5 rounded-2xl rounded-tl-sm shadow-sm relative mr-auto border border-slate-100/50 dark:border-slate-600/50 drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                                        <p className="text-[12px] leading-relaxed text-slate-800 dark:text-slate-200 pr-8">
                                            Kabar baik <b className="font-bold">Budi Santoso</b>! Pesanan <b className="font-bold text-emerald-600 dark:text-emerald-400">Brosur / Flyer</b> Anda saat ini sudah masuk ke tahap produksi/cetak.
                                        </p>
                                        <span className="text-[9px] text-slate-400 dark:text-slate-400 absolute bottom-1.5 right-2 font-medium">11:15</span>
                                    </div>

                                    <div className="max-w-[85%] bg-[#dcf8c6] dark:bg-emerald-900/60 p-3.5 rounded-2xl rounded-tr-sm shadow-sm relative ml-auto border border-[#dcf8c6] dark:border-emerald-800/50 drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                                        <p className="text-[12px] leading-relaxed text-slate-800 dark:text-slate-100 pr-14">
                                            Baik, terima kasih infonya 🙏
                                        </p>
                                        <div className="absolute bottom-1.5 right-2 flex items-center gap-1">
                                            <span className="text-[9px] text-emerald-800/60 dark:text-emerald-200/60 font-medium">11:16</span>
                                            <span className="material-symbols-outlined text-[14px] text-blue-500 dark:text-blue-400 leading-none">done_all</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Input Area */}
                                <div className="p-3 bg-white/50 dark:bg-slate-800/80 backdrop-blur-md flex gap-3 items-center absolute bottom-0 w-full z-20 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <div className="flex-1 bg-white dark:bg-slate-700 rounded-full h-10 px-4 flex items-center gap-3 shadow-inner border border-slate-200/80 dark:border-slate-600/50">
                                        <span className="material-symbols-outlined text-slate-400 text-[20px] cursor-default opacity-80">mood</span>
                                        <div className="flex-1 text-[13px] text-slate-400 font-medium">Ketik pesan...</div>
                                        <span className="material-symbols-outlined text-slate-400 text-[20px] cursor-default opacity-80">attach_file</span>
                                    </div>
                                    <div className="w-10 h-10 bg-emerald-600 dark:bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md shrink-0 cursor-default">
                                        <span className="material-symbols-outlined text-xl">mic</span>
                                    </div>
                                </div>
                            </div>

                            {/* Glass overlay badge */}
                            <div className="absolute -right-4 -bottom-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-5 shadow-2xl flex items-center gap-3 transform -rotate-2 z-40">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Live Preview</span>
                            </div>
                        </div>

                        {/* Uji Integrasi Card */}
                        <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-4xl p-8 shadow-sm text-center relative overflow-hidden mt-12 mb-8">
                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-3xl"></div>
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-100/50 dark:border-blue-800/30">
                                <span className="material-symbols-outlined text-3xl">send_to_mobile</span>
                            </div>
                            <h4 className="font-bold text-xl mb-3 text-slate-900 dark:text-white">Uji Integrasi API</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed">Kirim pesan WhatsApp sampel ke nomor di bawah ini untuk memastikan koneksi server berjalan lancar.</p>
                            <div className="space-y-4">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">call</span>
                                    <input 
                                        type="text" 
                                        className="w-full text-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-12 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-bold tracking-wider shadow-inner" 
                                        placeholder="628123456789" 
                                        value={testNumber}
                                        onChange={(e) => setTestNumber(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={handleTestMessage}
                                    disabled={sendingTest || !testNumber}
                                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl text-sm transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden group disabled:opacity-50">
                                    <span className="absolute inset-0 bg-white/20 dark:bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                                    <span className="material-symbols-outlined text-lg relative z-10">{sendingTest ? 'refresh' : 'bolt'}</span>
                                    <span className="relative z-10">{sendingTest ? 'Mengirim...' : 'Kirim Pesan Uji Coba'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
