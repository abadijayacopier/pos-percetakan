import { useState, useEffect } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import api from '../services/api';

export default function WASettingsPage({ onNavigate }) {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    // Checkbox states
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
                }
            } catch (err) { console.error('Gagal fetch WA config:', err); }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaveMsg('');
        try {
            await api.put('/wa-config', { api_token: apiKey, phone_number: phoneNumber });
            setSaveMsg(<>Konfigurasi berhasil disimpan! <FiCheck /></>);
            setTimeout(() => setSaveMsg(''), 3000);
        } catch (err) {
            setSaveMsg(<>Gagal menyimpan <FiX /></>);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    <button onClick={() => onNavigate('dashboard')} className="hover:text-primary transition-colors cursor-pointer dark:text-slate-400 dark:hover:text-primary">Beranda</button>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <button className="hover:text-primary transition-colors cursor-pointer dark:text-slate-400 dark:hover:text-primary">Pengaturan</button>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <span className="text-slate-900 dark:text-white font-medium">WhatsApp Integration Settings</span>
                </div>

                <div className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Pengaturan Template Notifikasi WA</h1>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl">Kelola pesan otomatis untuk setiap tahap produksi pesanan pelanggan melalui API WhatsApp.</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl px-6 py-3 flex items-center gap-4 shadow-sm">
                        <div className="size-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-xl">check_circle</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Status API</p>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none">Terhubung</h3>
                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-8 space-y-8">
                        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 gap-4">
                                <div>
                                    <h2 className="text-lg font-bold">Template Notifikasi Produksi</h2>
                                    <p className="text-xs text-slate-500">Sesuaikan pesan otomatis untuk setiap status produksi.</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button className="text-[11px] font-bold text-primary px-3 py-1.5 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer border border-primary/20">
                                        [NamaPelanggan]
                                    </button>
                                    <button className="text-[11px] font-bold text-primary px-3 py-1.5 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer border border-primary/20">
                                        [NamaProduk]
                                    </button>
                                    <button className="text-[11px] font-bold text-primary px-3 py-1.5 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer border border-primary/20">
                                        [NomorSPK]
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-8">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <span className="size-6 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-black">1</span>
                                            Pesanan Diterima
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-medium text-slate-400">Otomatis kirim</span>
                                            <input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-700 dark:bg-slate-900 cursor-pointer" checked={sendReceived} onChange={(e) => setSendReceived(e.target.checked)} />
                                        </div>
                                    </div>
                                    <textarea className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm focus:ring-primary focus:border-primary transition-all resize-none font-medium leading-relaxed" rows="3" defaultValue="Halo [NamaPelanggan], pesanan Anda dengan nomor [NomorSPK] telah kami terima dan sedang diverifikasi oleh admin. Terima kasih!"></textarea>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <span className="size-6 rounded bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center text-[10px] font-black">2</span>
                                            Proses Cetak
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-medium text-slate-400">Otomatis kirim</span>
                                            <input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-700 dark:bg-slate-900 cursor-pointer" checked={sendProcess} onChange={(e) => setSendProcess(e.target.checked)} />
                                        </div>
                                    </div>
                                    <textarea className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm focus:ring-primary focus:border-primary transition-all resize-none font-medium leading-relaxed" rows="3" defaultValue="Kabar baik [NamaPelanggan]! Pesanan [NamaProduk] Anda saat ini sudah masuk ke tahap produksi/cetak."></textarea>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <span className="size-6 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">3</span>
                                            Finishing
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-medium text-slate-400">Otomatis kirim</span>
                                            <input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-700 dark:bg-slate-900 cursor-pointer" checked={sendFinishing} onChange={(e) => setSendFinishing(e.target.checked)} />
                                        </div>
                                    </div>
                                    <textarea className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm focus:ring-primary focus:border-primary transition-all resize-none font-medium leading-relaxed" rows="3" defaultValue="Halo [NamaPelanggan], pesanan [NamaProduk] sedang dalam tahap finishing (pemotongan/packing)."></textarea>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <span className="size-6 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black">4</span>
                                            Siap Diambil
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-medium text-slate-400">Otomatis kirim</span>
                                            <input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-700 dark:bg-slate-900 cursor-pointer" checked={sendReady} onChange={(e) => setSendReady(e.target.checked)} />
                                        </div>
                                    </div>
                                    <textarea className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm focus:ring-primary focus:border-primary transition-all resize-none font-medium leading-relaxed" rows="3" defaultValue="Pesanan Anda ([NamaProduk]) Selesai! Silakan ambil di outlet kami dengan menunjukkan nomor SPK: [NomorSPK]."></textarea>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                                <h2 className="text-lg font-bold">Kredensial API WhatsApp</h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        WhatsApp API Key
                                        <span className="material-symbols-outlined text-xs text-slate-400 cursor-help" title="Didapatkan dari vendor API WhatsApp">info</span>
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            type={showKey ? "text" : "password"}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2.5 px-4 text-sm focus:ring-primary focus:border-primary transition-all font-mono"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                        />
                                        <button onClick={() => setShowKey(!showKey)} className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg">{showKey ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nomor Telepon Bisnis</label>
                                    <div className="flex gap-3">
                                        <div className="w-24 shrink-0">
                                            <select className="w-full h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-sm focus:ring-primary">
                                                <option className="text-slate-900 dark:text-white">+62</option>
                                                <option className="text-slate-900 dark:text-white">+1</option>
                                            </select>
                                        </div>
                                        <input
                                            type="text"
                                            className="flex-1 h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 text-sm focus:ring-primary"
                                            placeholder="8123456789"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="flex justify-end gap-4 py-4 mt-6">
                            <button className="px-6 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                                Batalkan
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg text-sm shadow-xl shadow-primary/20 transition-all cursor-pointer disabled:opacity-50">
                                {saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
                            </button>
                            {saveMsg && <span className="text-sm font-medium ml-2">{saveMsg}</span>}
                        </div>
                    </div>

                    <div className="xl:col-span-4 space-y-8">
                        <div className="bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] p-4 border-[8px] border-slate-900 dark:border-slate-950 shadow-2xl relative max-w-sm mx-auto w-full">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 dark:border-slate-950 rounded-b-xl"></div>
                            <div className="bg-[#e5ddd5] dark:bg-slate-900 h-[580px] rounded-[1.5rem] overflow-hidden flex flex-col">
                                <div className="bg-[#075e54] text-white p-3 pt-6 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                                    <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-lg">print</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold leading-tight">PrintManager</p>
                                        <p className="text-[10px] opacity-80 leading-tight">Akun Bisnis Resmi</p>
                                    </div>
                                    <span className="material-symbols-outlined text-xl">more_vert</span>
                                </div>
                                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                    <div className="max-w-[90%] bg-white dark:bg-slate-800 p-3 rounded-lg rounded-tl-none shadow-sm relative">
                                        <p className="text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 pr-5">
                                            Halo <b>Budi Santoso</b>, pesanan Anda dengan nomor <b>SPK-2023-0892</b> telah kami terima dan sedang diverifikasi oleh admin. Terima kasih!
                                        </p>
                                        <span className="text-[9px] text-slate-400 absolute bottom-1 right-2 italic">10:42</span>
                                    </div>
                                    <div className="max-w-[90%] bg-white dark:bg-slate-800 p-3 rounded-lg rounded-tl-none shadow-sm relative">
                                        <p className="text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 pr-5">
                                            Kabar baik <b>Budi Santoso</b>! Pesanan <b>Brosur / Flyer</b> Anda saat ini sudah masuk ke tahap produksi/cetak.
                                        </p>
                                        <span className="text-[9px] text-slate-400 absolute bottom-1 right-2 italic">11:15</span>
                                    </div>
                                    <div className="max-w-[90%] bg-[#dcf8c6] dark:bg-emerald-900/40 p-3 rounded-lg rounded-tr-none shadow-sm relative self-end ml-auto">
                                        <p className="text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 pr-5">
                                            Oke, terima kasih infonya.
                                        </p>
                                        <span className="text-[9px] text-slate-400 absolute bottom-1 right-2 italic">11:16</span>
                                    </div>
                                </div>
                                <div className="p-2 flex gap-2 items-center bg-transparent pb-4">
                                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
                                        <span className="material-symbols-outlined text-slate-400 text-lg">mood</span>
                                        <div className="flex-1 text-[10px] text-slate-400">Ketik pesan...</div>
                                        <span className="material-symbols-outlined text-slate-400 text-lg">attach_file</span>
                                    </div>
                                    <div className="size-10 bg-[#128c7e] rounded-full flex items-center justify-center text-white shadow-sm shrink-0">
                                        <span className="material-symbols-outlined text-xl">mic</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-center text-[10px] font-bold text-slate-500 mt-4 uppercase tracking-widest">Pratinjau Pesan</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm text-center">
                            <div className="size-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined">send</span>
                            </div>
                            <h4 className="font-bold mb-2">Uji Integrasi</h4>
                            <p className="text-xs text-slate-500 mb-6">Kirim pesan sampel ke nomor Anda untuk memastikan integrasi berjalan lancar.</p>
                            <div className="space-y-3">
                                <input type="text" className="w-full text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 text-sm focus:ring-primary" placeholder="Masukkan nomor telepon" />
                                <button className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg text-sm transition-all hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center justify-center gap-2 cursor-pointer">
                                    <span className="material-symbols-outlined text-sm">bolt</span>
                                    Kirim Pesan Uji Coba
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
