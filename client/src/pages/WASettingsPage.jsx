import { useState, useEffect } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import api from '../services/api';

export default function WASettingsPage({ onNavigate }) {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

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
                }
            } catch (err) { console.error('Gagal fetch WA config:', err); }
        };
        fetchConfig();
    }, []);

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
                send_ready: sendReady
            });
            setSaveMsg(<>Konfigurasi berhasil disimpan! <FiCheck /></>);
            setTimeout(() => setSaveMsg(''), 3000);
        } catch (err) {
            setSaveMsg(<>Gagal menyimpan <FiX /></>);
        } finally {
            setSaving(false);
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
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl px-4 py-2 flex items-center gap-3 shadow-inner">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                        </div>
                        <div className="pr-2">
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Status API</p>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-none">Terhubung</h3>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
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
                                    <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm cursor-pointer border border-blue-100 dark:border-blue-800/50 uppercase tracking-tighter">
                                        [NamaPelanggan]
                                    </button>
                                    <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm cursor-pointer border border-blue-100 dark:border-blue-800/50 uppercase tracking-tighter">
                                        [NamaProduk]
                                    </button>
                                    <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm cursor-pointer border border-blue-100 dark:border-blue-800/50 uppercase tracking-tighter">
                                        [NomorSPK]
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
                                            <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-black shadow-inner">3</span>
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
                            </div>
                        </section>

                        <section className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-4xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mt-8">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 relative overflow-hidden">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                    <span className="material-symbols-outlined text-xl">vpn_key</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kredensial API WhatsApp</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Konfigurasi token dan nomor penghubung API.</p>
                                </div>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        WhatsApp API Key
                                        <div className="group relative focus-within:z-10 bg-slate-100 dark:bg-slate-800 w-5 h-5 rounded-full flex items-center justify-center cursor-help">
                                            <span className="material-symbols-outlined text-[14px] text-slate-500">info</span>
                                        </div>
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-4 z-10 text-slate-400 material-symbols-outlined text-lg">key</span>
                                        <input
                                            type={showKey ? "text" : "password"}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-11 pr-12 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono shadow-inner"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder="Masukkan API Key"
                                        />
                                        <button onClick={() => setShowKey(!showKey)} className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer flex items-center justify-center transition-colors">
                                            <span className="material-symbols-outlined text-lg">{showKey ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nomor Telepon Bisnis</label>
                                    <div className="flex gap-4">
                                        <div className="w-24 shrink-0 relative">
                                            <select className="appearance-none w-full py-3 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 shadow-inner cursor-pointer">
                                                <option>+62</option>
                                                <option>+1</option>
                                            </select>
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none">expand_more</span>
                                        </div>
                                        <div className="relative flex-1">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-slate-400 material-symbols-outlined text-lg">call</span>
                                            <input
                                                type="text"
                                                className="w-full h-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-bold shadow-inner"
                                                placeholder="8123456789"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                            />
                                        </div>
                                    </div>
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
                                    <input type="text" className="w-full text-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-12 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-bold tracking-wider shadow-inner" placeholder="+62 812 3456 7890" />
                                </div>
                                <button className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl text-sm transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden group">
                                    <span className="absolute inset-0 bg-white/20 dark:bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                                    <span className="material-symbols-outlined text-lg relative z-10">bolt</span>
                                    <span className="relative z-10">Kirim Pesan Uji Coba</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
