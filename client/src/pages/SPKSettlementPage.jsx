import { useState, useEffect } from 'react';
import api from '../services/api';

export default function SPKSettlementPage({ onNavigate, pageState }) {
    const spkId = pageState?.spkId || null;
    const [spk, setSpk] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sendWa, setSendWa] = useState(true);

    const [biayaCetak, setBiayaCetak] = useState(0);
    const [biayaMaterial, setBiayaMaterial] = useState(0);
    const [biayaFinishing, setBiayaFinishing] = useState(0);
    const [biayaDesain, setBiayaDesain] = useState(0);
    const [biayaLainnya, setBiayaLainnya] = useState(0);

    useEffect(() => {
        if (!spkId) return;
        const fetchSPK = async () => {
            try {
                const res = await api.get(`/spk/${spkId}`);
                const data = res.data;
                setSpk(data);
                setBiayaCetak(data.biaya_cetak || 0);
                setBiayaMaterial(data.biaya_material || 0);
                setBiayaFinishing(data.biaya_finishing || 0);
                setBiayaDesain(data.biaya_desain || 0);
                setBiayaLainnya(data.biaya_lainnya || 0);
            } catch (err) {
                console.error('Gagal fetch SPK:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSPK();
    }, [spkId]);

    const totalBiaya = biayaCetak + biayaMaterial + biayaFinishing + biayaDesain + biayaLainnya;
    const sisaTagihan = totalBiaya - (spk?.dp_amount || 0);
    const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

    const handleConfirm = async () => {
        try {
            await api.patch(`/spk/${spkId}/finalize`, { biaya_cetak: biayaCetak, biaya_material: biayaMaterial, biaya_finishing: biayaFinishing, biaya_desain: biayaDesain, biaya_lainnya: biayaLainnya });
            onNavigate('kasir-payment', { spkId, sendWa });
        } catch (err) {
            console.error('Gagal finalize:', err);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;
    if (!spk) return <div className="flex flex-col items-center justify-center min-h-screen gap-4"><p className="text-slate-500">SPK tidak ditemukan</p></div>;

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            <div className="flex-1 overflow-y-auto p-8">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    <button onClick={() => onNavigate('dashboard')} className="hover:text-primary transition-colors cursor-pointer dark:text-slate-400">Beranda</button>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <button onClick={() => onNavigate('spk-list')} className="hover:text-primary transition-colors cursor-pointer dark:text-slate-400">Produksi</button>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary font-medium">Hitung Biaya Akhir</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Rincian Biaya Akhir Produksi</h1>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            ID: <span className="font-mono text-primary font-semibold">#{spk.spk_number}</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">{spk.status}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Biaya Cetak & Material */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-primary/5">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-50 dark:border-slate-800 pb-4">
                                <span className="size-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">1</span>
                                <h3 className="text-lg font-bold">Biaya Cetak & Material</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Biaya Cetak</label>
                                        <input type="number" value={biayaCetak} onChange={e => setBiayaCetak(Number(e.target.value))}
                                            className="w-full bg-background-light dark:bg-slate-800 border-none rounded-lg text-sm font-semibold focus:ring-primary h-[42px]" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Biaya Material</label>
                                        <input type="number" value={biayaMaterial} onChange={e => setBiayaMaterial(Number(e.target.value))}
                                            className="w-full bg-background-light dark:bg-slate-800 border-none rounded-lg text-sm font-semibold focus:ring-primary h-[42px]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Biaya Desain */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-primary/5">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-50 dark:border-slate-800 pb-4">
                                <span className="size-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">2</span>
                                <h3 className="text-lg font-bold">Biaya Jasa Desain</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Biaya Desain</label>
                                    <input type="number" value={biayaDesain} onChange={e => setBiayaDesain(Number(e.target.value))}
                                        className="w-full bg-background-light dark:bg-slate-800 border-none rounded-lg text-sm font-semibold focus:ring-primary h-[42px]" />
                                </div>
                            </div>
                        </div>

                        {/* Finishing & Lainnya */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-primary/5">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-50 dark:border-slate-800 pb-4">
                                <span className="size-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">3</span>
                                <h3 className="text-lg font-bold">Finishing & Biaya Tambahan</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Biaya Finishing</label>
                                        <input type="number" value={biayaFinishing} onChange={e => setBiayaFinishing(Number(e.target.value))}
                                            className="w-full bg-background-light dark:bg-slate-800 border-none rounded-lg text-sm font-semibold focus:ring-primary h-[42px]" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Biaya Lainnya</label>
                                        <input type="number" value={biayaLainnya} onChange={e => setBiayaLainnya(Number(e.target.value))}
                                            className="w-full bg-background-light dark:bg-slate-800 border-none rounded-lg text-sm font-semibold focus:ring-primary h-[42px]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Ringkasan */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-xl border border-primary/10 sticky top-8">
                            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <span className="material-symbols-outlined text-primary">receipt_long</span>
                                <h3 className="text-xl font-black italic tracking-tight">RINGKASAN AKHIR</h3>
                            </div>
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Biaya Cetak</span>
                                    <span className="font-medium">{formatCurrency(biayaCetak)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Biaya Material</span>
                                    <span className="font-medium">{formatCurrency(biayaMaterial)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Biaya Desain</span>
                                    <span className="font-medium">{formatCurrency(biayaDesain)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Finishing & Lainnya</span>
                                    <span className="font-medium">{formatCurrency(biayaFinishing + biayaLainnya)}</span>
                                </div>
                            </div>
                            <div className="mb-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL BIAYA AKHIR</p>
                                <div className="text-3xl font-black text-primary">{formatCurrency(totalBiaya)}</div>
                            </div>
                            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="flex justify-between text-sm"><span className="text-slate-500">Uang Muka (DP)</span><span className="font-bold text-green-600">- {formatCurrency(spk.dp_amount)}</span></div>
                            </div>
                            <div className="mb-8 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <div className="flex justify-between text-base"><span className="font-bold text-red-600">SISA TAGIHAN</span><span className="font-black text-red-600">{formatCurrency(sisaTagihan)}</span></div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-[#25D366]/5 p-4 rounded-xl border border-[#25D366]/20">
                                    <div className="flex items-start gap-3">
                                        <input id="send-wa" type="checkbox"
                                            className="w-4 h-4 text-[#25D366] border-[#25D366]/30 rounded focus:ring-[#25D366] cursor-pointer mt-0.5"
                                            checked={sendWa} onChange={(e) => setSendWa(e.target.checked)} />
                                        <label htmlFor="send-wa" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                            Kirim tagihan ke WhatsApp Pelanggan
                                        </label>
                                    </div>
                                </div>
                                <button onClick={handleConfirm}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-black rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                    <span className="material-symbols-outlined">send</span>
                                    KONFIRMASI & LANJUT KE KASIR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
