import { useState, useEffect } from 'react';
import api from '../services/api';

export default function HandoverPage({ onNavigate, pageState }) {
    const spkId = pageState?.spkId || null;
    const [spk, setSpk] = useState(null);
    const [loading, setLoading] = useState(true);
    const [barcode, setBarcode] = useState('');
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!spkId) { setLoading(false); return; }
        const fetchSPK = async () => {
            try {
                const res = await api.get(`/spk/${spkId}`);
                const data = res.data;
                setSpk(data);
                setReceiverName(data.customer_name || '');
                setReceiverPhone(data.customer_phone || '');
            } catch (err) { console.error('Gagal fetch SPK:', err); }
            finally { setLoading(false); }
        };
        fetchSPK();
    }, [spkId]);

    const handleHandover = async () => {
        setSubmitting(true);
        try {
            await api.post(`/spk/${spkId}/handover`, {
                received_by_name: receiverName,
                received_by_phone: receiverPhone,
                notes: notes || null
            });
            onNavigate('spk-list');
        } catch (err) {
            console.error('Gagal handover:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

    if (loading) return <div className="flex items-center justify-center min-h-screen"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            <div className="flex-1 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Serah Terima & Pengambilan Barang</h2>
                        <p className="text-slate-500 text-sm">Proses verifikasi dan penyerahan pesanan kepada pelanggan</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input type="text"
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary text-sm transition-all"
                                placeholder="Scan Barcode atau Cari Nomor SPK..."
                                value={barcode} onChange={(e) => setBarcode(e.target.value)}
                            />
                        </div>
                        <button className="bg-primary text-white px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 cursor-pointer">
                            <span className="material-symbols-outlined">qr_code_scanner</span>
                            Cari Nota
                        </button>
                    </div>
                </div>

                {spk && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* Left Column */}
                        <div className="md:col-span-7 space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                    <h3 className="font-bold text-slate-900 dark:text-white">Detail Pesanan</h3>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">{spk.status}</span>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Nomor SPK</p>
                                        <p className="font-bold text-slate-900 dark:text-white text-lg">{spk.spk_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Pelanggan</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{spk.customer_name}</p>
                                        <p className="text-xs text-slate-500">{spk.customer_phone || '-'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Rincian Barang</p>
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">{spk.product_name} ({spk.product_qty} {spk.product_unit})</span>
                                                <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(spk.total_biaya)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bukti Pelunasan */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                    <h3 className="font-bold text-slate-900 dark:text-white">Bukti Pelunasan</h3>
                                </div>
                                <div className="p-6">
                                    <div className={`flex items-center gap-6 p-4 rounded-xl border-2 ${spk.sisa_tagihan <= 0 ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/10' : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10'}`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${spk.sisa_tagihan <= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                                            <span className="material-symbols-outlined text-3xl">{spk.sisa_tagihan <= 0 ? 'check_circle' : 'warning'}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-bold ${spk.sisa_tagihan <= 0 ? 'text-green-800 dark:text-green-500' : 'text-red-800 dark:text-red-500'}`}>
                                                {spk.sisa_tagihan <= 0 ? 'LUNAS' : 'BELUM LUNAS'}
                                            </p>
                                            <p className={`text-sm ${spk.sisa_tagihan <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {spk.sisa_tagihan <= 0 ? 'Pembayaran telah diverifikasi' : `Sisa tagihan: ${formatCurrency(spk.sisa_tagihan)}`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">Total Biaya</p>
                                            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(spk.total_biaya)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="md:col-span-5 space-y-6">
                            {/* Penerima */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                    <h3 className="font-bold text-slate-900 dark:text-white">Data Penerima</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nama Penerima</label>
                                        <input type="text" value={receiverName} onChange={e => setReceiverName(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-primary" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Telepon Penerima</label>
                                        <input type="text" value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-primary" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Catatan</label>
                                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:ring-primary resize-none"
                                            placeholder="Catatan tambahan serah terima..." />
                                    </div>
                                </div>
                            </div>

                            {/* Action */}
                            <div className="pt-2">
                                <button
                                    onClick={handleHandover}
                                    disabled={submitting || !receiverName}
                                    className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/30 transition-all cursor-pointer disabled:opacity-50">
                                    <span className="material-symbols-outlined">done_all</span>
                                    {submitting ? 'Memproses...' : 'Barang Telah Diambil'}
                                </button>
                                <p className="text-center text-slate-400 text-[10px] mt-4 uppercase tracking-widest font-bold">
                                    Status SPK akan diperbarui menjadi <span className="text-slate-600 dark:text-slate-300">Diambil</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {!spk && !loading && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                        <span className="material-symbols-outlined text-slate-300 !text-6xl">inventory_2</span>
                        <p className="text-slate-500 mt-4">Scan barcode atau cari nomor SPK untuk memulai proses serah terima</p>
                    </div>
                )}
            </div>
        </div>
    );
}
