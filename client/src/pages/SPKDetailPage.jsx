import { useState, useEffect } from 'react';
import api from '../services/api';

export default function SPKDetailPage({ onNavigate, pageState }) {
    const spkId = pageState?.spkId || null;
    const [spk, setSpk] = useState(null);
    const [loading, setLoading] = useState(true);
    const [autoNotify, setAutoNotify] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const fetchDetail = async () => {
        if (!spkId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`/spk/${spkId}`);
            setSpk(res.data);
        } catch (err) {
            console.error('Gagal fetch detail SPK:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDetail(); }, [spkId]);

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        setUpdatingStatus(true);
        try {
            await api.patch(`/spk/${spkId}/status`, { status: newStatus });
            fetchDetail(); // Reload data
        } catch (err) {
            console.error('Gagal update status:', err);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
    const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
            </div>
        );
    }

    if (!spk) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <span className="material-symbols-outlined text-slate-300 !text-6xl">search_off</span>
                <p className="text-slate-500 font-medium">SPK tidak ditemukan</p>
                <button onClick={() => onNavigate('spk-list')} className="text-primary font-bold text-sm cursor-pointer hover:underline">Kembali ke Daftar SPK</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between px-8 py-4 gap-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <button onClick={() => onNavigate('dashboard')} className="hover:text-primary transition-colors cursor-pointer dark:text-slate-400 dark:hover:text-primary">Dashboard</button>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <button onClick={() => onNavigate('spk-list')} className="hover:text-primary transition-colors cursor-pointer dark:text-slate-400 dark:hover:text-primary">Daftar SPK</button>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-slate-900 font-medium dark:text-white">{spk.spk_number}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => onNavigate('print-label', { spkId: spk.id })} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all cursor-pointer">
                        <span className="material-symbols-outlined text-sm">label</span>
                        Cetak Label
                    </button>
                    <button onClick={() => onNavigate('print-spk', { spkId: spk.id })} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90 shadow-sm transition-all cursor-pointer">
                        <span className="material-symbols-outlined text-sm">print</span>
                        Cetak Dokumen SPK
                    </button>
                </div>
            </div>

            <div className="p-8 space-y-6 flex-1">
                {/* Title & Status */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight dark:text-white">SPK #{spk.spk_number}</h2>
                        <p className="text-slate-500 mt-1 dark:text-slate-400">Dibuat pada {formatDate(spk.created_at)} • Oleh: {spk.created_by_name || '-'}</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex flex-col gap-1.5 w-full md:w-auto">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ubah Status Produksi</label>
                            <select
                                value={spk.status}
                                onChange={handleStatusChange}
                                disabled={updatingStatus}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-primary focus:border-primary dark:text-white cursor-pointer min-w-[200px]">
                                <option>Menunggu Antrian</option>
                                <option>Dalam Proses Cetak</option>
                                <option>Finishing</option>
                                <option>Quality Control</option>
                                <option>Selesai</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 mt-auto pb-1">
                            <input
                                id="auto-notify" type="checkbox"
                                className="rounded text-[#25D366] focus:ring-[#25D366] border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer"
                                checked={autoNotify} onChange={(e) => setAutoNotify(e.target.checked)}
                            />
                            <label htmlFor="auto-notify" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer flex items-center gap-1">
                                Kirim Notifikasi WA
                                <span className="material-symbols-outlined !text-[14px] text-[#25D366]">chat</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-primary">person</span>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pelanggan</p>
                        </div>
                        <p className="text-lg font-bold dark:text-white">{spk.customer_company || spk.customer_name}</p>
                        {spk.customer_phone && <p className="text-xs text-slate-500 mt-1">{spk.customer_phone}</p>}
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-orange-500">event</span>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Deadline</p>
                        </div>
                        <p className="text-lg font-bold dark:text-white">{formatDate(spk.deadline)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-red-500">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-red-500">priority_high</span>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Prioritas</p>
                        </div>
                        <p className="text-lg font-bold dark:text-white">{spk.priority}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-emerald-500">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-emerald-500">engineering</span>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Penanggung Jawab</p>
                        </div>
                        <p className="text-lg font-bold dark:text-white">{spk.assigned_name || '-'}</p>
                    </div>
                </div>

                {/* Main Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Col 1-2: Detail & Specs */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Technical Specs */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2 dark:text-white">
                                    <span className="material-symbols-outlined text-primary">settings</span>
                                    Spesifikasi Teknis
                                </h3>
                                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-1 rounded-full uppercase">
                                    {spk.product_qty} {spk.product_unit}
                                </span>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Produk</p>
                                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{spk.product_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Material</p>
                                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{spk.specs_material || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Finishing</p>
                                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{spk.specs_finishing || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Biaya</p>
                                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(spk.total_biaya)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Instruksi */}
                        {spk.specs_notes && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="font-bold flex items-center gap-2 dark:text-white">
                                        <span className="material-symbols-outlined text-primary">format_list_bulleted</span>
                                        Instruksi Kerja Khusus
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="bg-primary/5 dark:bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg">
                                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                                            {spk.specs_notes}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Riwayat Pembayaran */}
                        {spk.payments && spk.payments.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="font-bold flex items-center gap-2 dark:text-white">
                                        <span className="material-symbols-outlined text-primary">payments</span>
                                        Riwayat Pembayaran
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {spk.payments.map((p) => (
                                        <div key={p.id} className="px-6 py-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold dark:text-white">{p.payment_type} — {p.method}</p>
                                                <p className="text-[10px] text-slate-400">{formatDate(p.created_at)} • {p.paid_by_name || '-'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(p.amount)}</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'Berhasil' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700'}`}>{p.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Col 3: Log Aktivitas */}
                    <div className="space-y-6">
                        {/* Ringkasan Biaya */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                            <h3 className="font-bold text-sm mb-4 dark:text-white">Ringkasan Biaya</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Cetak</span><span className="font-bold dark:text-white">{formatCurrency(spk.biaya_cetak)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Material</span><span className="font-bold dark:text-white">{formatCurrency(spk.biaya_material)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Finishing</span><span className="font-bold dark:text-white">{formatCurrency(spk.biaya_finishing)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Desain</span><span className="font-bold dark:text-white">{formatCurrency(spk.biaya_desain)}</span></div>
                                {spk.biaya_lainnya > 0 && <div className="flex justify-between"><span className="text-slate-500">Lainnya</span><span className="font-bold dark:text-white">{formatCurrency(spk.biaya_lainnya)}</span></div>}
                                <hr className="border-slate-200 dark:border-slate-700" />
                                <div className="flex justify-between text-base"><span className="font-bold dark:text-white">Total</span><span className="font-black text-primary">{formatCurrency(spk.total_biaya)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">DP</span><span className="font-bold text-green-600">{formatCurrency(spk.dp_amount)}</span></div>
                                <div className="flex justify-between"><span className="font-bold text-red-600">Sisa Tagihan</span><span className="font-black text-red-600">{formatCurrency(spk.sisa_tagihan)}</span></div>
                            </div>
                            {spk.sisa_tagihan > 0 && ['Selesai', 'Siap Diambil'].includes(spk.status) && (
                                <button
                                    onClick={() => onNavigate('spk-settlement', { spkId: spk.id })}
                                    className="w-full mt-4 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all cursor-pointer text-sm flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-sm">point_of_sale</span>
                                    Proses Pelunasan
                                </button>
                            )}
                        </div>

                        {/* Log Aktivitas */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="font-bold flex items-center gap-2 dark:text-white">
                                    <span className="material-symbols-outlined text-primary">history</span>
                                    Log Aktivitas
                                </h3>
                            </div>
                            <div className="p-5">
                                <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                                    {(spk.logs || []).map((log, i) => (
                                        <div key={log.id || i} className="relative pl-8">
                                            <div className={`absolute left-0 top-1 size-6 rounded-full ${i === 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'} border-4 border-white dark:border-slate-900 flex items-center justify-center`}>
                                                <div className={`size-1.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-slate-400'}`}></div>
                                            </div>
                                            <p className="text-xs font-bold dark:text-white">{log.description}</p>
                                            <p className="text-[10px] text-slate-400">{formatDate(log.created_at)} {log.user_name ? `• ${log.user_name}` : ''}</p>
                                        </div>
                                    ))}
                                    {(!spk.logs || spk.logs.length === 0) && (
                                        <p className="text-xs text-slate-400 pl-8">Belum ada aktivitas</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
