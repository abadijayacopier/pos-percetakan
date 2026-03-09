import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export default function CashierPaymentPage({ onNavigate, pageState }) {
    const spkId = pageState?.spkId || null;
    const [spk, setSpk] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState('qris');
    const [qrisStatus, setQrisStatus] = useState('waiting');
    const audioRef = useRef(null);

    useEffect(() => {
        if (!spkId) return;
        const fetchSPK = async () => {
            try {
                const res = await api.get(`/spk/${spkId}`);
                const data = res.data;
                setSpk(data);
            } catch (err) {
                console.error('Gagal fetch SPK:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSPK();
    }, [spkId]);

    const simulateQRIS = () => {
        setQrisStatus('success');
        try { audioRef.current?.play(); } catch { }
    };

    const handleSettle = async () => {
        if (!spk) return;
        try {
            await api.post(`/spk/${spkId}/pay`, {
                amount: spk.sisa_tagihan,
                method: paymentMethod === 'cash' ? 'Tunai' : paymentMethod === 'qris' ? 'QRIS' : 'Transfer',
                payment_type: 'Pelunasan',
                bank_ref: qrisStatus === 'success' ? 'QRIS-AUTO-' + Date.now() : null
            });
            onNavigate('print-invoice', { spkId });
        } catch (err) {
            console.error('Gagal proses pembayaran:', err);
        }
    };

    const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

    if (loading) return <div className="flex items-center justify-center min-h-screen"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;
    if (!spk) return <div className="flex flex-col items-center justify-center min-h-screen gap-4"><p className="text-slate-500">SPK tidak ditemukan</p></div>;

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto"></audio>

            <style>{`
                .qris-loading-spin {animation: spin 2s linear infinite; }
                @keyframes spin {from {transform: rotate(0deg); } to {transform: rotate(360deg); } }
            `}</style>

            <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight mb-2 uppercase">Kasir & Verifikasi</h1>
                        <p className="text-slate-500">SPK: <span className="font-mono text-primary font-bold">{spk.spk_number}</span> — {spk.customer_name}</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100 dark:bg-green-900/30 dark:border-green-800">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">QRIS Webhook Active</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: QRIS / Payment Display */}
                    <div className="lg:col-span-2 space-y-6">
                        {paymentMethod === 'qris' ? (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-primary overflow-hidden shadow-xl shadow-primary/5">
                                <div className="p-4 bg-primary text-white flex justify-between items-center">
                                    <span className="font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined">qr_code_scanner</span> Terminal Pembayaran QRIS
                                    </span>
                                    <span className="text-xs bg-white/20 px-2 py-1 rounded">ID: QR-{spk.spk_number}</span>
                                </div>
                                <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                                    <div className="relative group">
                                        <div className="p-4 bg-white border-4 border-slate-100 rounded-2xl shadow-inner mb-6 relative overflow-hidden">
                                            <div className="w-64 h-64 bg-slate-200 flex items-center justify-center opacity-80 rounded text-slate-400 font-medium">QR SCAN AREA</div>
                                            {/* Success Overlay */}
                                            <div className={`absolute inset-0 bg-white/95 flex flex-col items-center justify-center transition-opacity duration-500 rounded-2xl ${qrisStatus === 'success' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                                <div className="size-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-green-200">
                                                    <span className="material-symbols-outlined text-5xl">check_circle</span>
                                                </div>
                                                <p className="text-xl font-bold text-green-700">Pembayaran Diterima</p>
                                            </div>
                                        </div>
                                    </div>
                                    {qrisStatus === 'waiting' ? (
                                        <>
                                            <p className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                                                <span className="material-symbols-outlined qris-loading-spin text-primary">sync</span>
                                                Menunggu pembayaran masuk...
                                            </p>
                                            <p className="text-xl font-black text-primary mb-4">{formatCurrency(spk.sisa_tagihan)}</p>
                                            <button onClick={simulateQRIS} className="text-xs text-primary underline cursor-pointer">
                                                Simulasi Cek Status
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-xl font-bold text-slate-800 dark:text-white mb-2">Dana Sudah Masuk</p>
                                            <p className="text-sm text-slate-500 mb-6">Pembayaran dikonfirmasi via QRIS.</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
                                <h3 className="text-xl font-bold mb-4">Pembayaran {paymentMethod === 'cash' ? 'Tunai' : 'Transfer Bank'}</h3>
                                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                                    <p className="text-xs text-slate-500 uppercase mb-2">Total Yang Harus Dibayar</p>
                                    <p className="text-4xl font-black text-primary">{formatCurrency(spk.sisa_tagihan)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Payment Selection */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-bold text-lg mb-4">Pilih Metode</h3>
                        <div className="space-y-3">
                            {[
                                { key: 'cash', label: 'Tunai / Cash', sub: 'Bayar di kasir', icon: 'payments' },
                                { key: 'qris', label: 'QRIS (Otomatis)', sub: 'Auto-Settle Webhook', icon: 'qr_code_2' },
                                { key: 'transfer', label: 'Transfer Bank', sub: 'Konfirmasi manual', icon: 'account_balance' },
                            ].map(m => (
                                <label key={m.key} className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border transition-all ${paymentMethod === m.key ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                    <input className="text-primary focus:ring-primary cursor-pointer" name="payment" type="radio" checked={paymentMethod === m.key} onChange={() => setPaymentMethod(m.key)} />
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">{m.label}</p>
                                        <p className={`text-xs ${m.key === 'qris' ? 'text-primary font-medium italic' : 'text-slate-500'}`}>{m.sub}</p>
                                    </div>
                                    <span className={`material-symbols-outlined ${paymentMethod === m.key ? 'text-primary' : 'text-slate-400'}`}>{m.icon}</span>
                                </label>
                            ))}
                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Info Pelanggan</p>
                                <p className="text-sm font-bold">{spk.customer_name}</p>
                                <p className="text-xs text-slate-500">{spk.customer_company || spk.customer_phone || '-'}</p>
                            </div>

                            <button
                                onClick={handleSettle}
                                disabled={paymentMethod === 'qris' && qrisStatus !== 'success'}
                                className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer
                                    ${paymentMethod === 'qris' && qrisStatus !== 'success'
                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-700'
                                        : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20 hover:scale-[1.02]'}
                                `}
                            >
                                <span className="material-symbols-outlined">print</span>
                                Selesaikan & Cetak Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
