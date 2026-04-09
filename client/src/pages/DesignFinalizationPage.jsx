import { useState, useEffect } from 'react';
import { FiClock, FiUser, FiFileText, FiSave, FiRefreshCw, FiX, FiInfo, FiUploadCloud, FiTrash2, FiChevronRight } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function DesignFinalizationPage({ onNavigate, pageState }) {
    const { user } = useAuth();
    const taskId = pageState?.taskId;
    const [task, setTask] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [now, setNow] = useState(new Date());
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (taskId) {
            api.get(`/dp_tasks/${taskId}`).then(res => setTask(res.data)).catch(console.error);
        }
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, [taskId]);

    const formatTime = (date) => {
        if (!date) return '--:--:--';
        return new Date(date).toTimeString().split(' ')[0];
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
    };

    const calculateDuration = () => {
        if (!task?.createdAt) return { h: 0, m: 0, s: 0, totalHours: 0 };
        const start = new Date(task.createdAt);
        const diffMs = now - start;
        const totalSeconds = Math.floor(diffMs / 1000);
        return {
            h: Math.floor(totalSeconds / 3600),
            m: Math.floor((totalSeconds % 3600) / 60),
            s: totalSeconds % 60,
            totalHours: totalSeconds / 3600
        };
    };

    const duration = calculateDuration();
    const hourlyRate = 50000;
    const billedHours = Math.max(0.5, Math.ceil(duration.totalHours * 2) / 2);
    const finalDesignPrice = billedHours * hourlyRate;

    const handleSimpanKeInvoice = async () => {
        if (!taskId || saving) return;
        setSaving(true);
        try {
            await api.put(`/dp_tasks/${taskId}`, {
                status: 'checkout',
                design_price: finalDesignPrice,
                design_duration: `${duration.h}h ${duration.m}m`
            });
            onNavigate('dp-cart', { taskId });
        } catch (e) {
            console.error(e);
            alert('Gagal menyimpan ke invoice. Silakan coba lagi.');
        } finally {
            setSaving(false);
        }
    };

    const handleAktifkanRevisi = async () => {
        if (!taskId || saving) return;
        setSaving(true);
        try {
            await api.put(`/dp_tasks/${taskId}`, { status: 'desain' });
            onNavigate('digital-printing');
        } catch (e) {
            console.error(e);
            alert('Gagal mengaktifkan revisi. Silakan coba lagi.');
        } finally {
            setSaving(false);
        }
    };

    const handleBatalkanSesi = () => {
        onNavigate('digital-printing');
    };

    if (!task && taskId) {
        return (
            <div className="flex-1 flex items-center justify-center p-20">
                <div className="text-center space-y-4">
                    <div className="size-16 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 animate-pulse">
                        <FiClock size={28} />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Memuat Data Pesanan...</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Jika halaman tidak memuat, pastikan Task ID valid.</p>
                    <button onClick={() => onNavigate('digital-printing')} className="text-sm font-bold text-blue-600 hover:underline">
                        ← Kembali ke Digital Printing
                    </button>
                </div>
            </div>
        );
    }

    const displayTask = task || { customerName: 'Pelanggan', id: taskId || '-', title: 'Desain' };

    return (
        <div className="space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <button onClick={() => onNavigate('digital-printing')} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Percetakan</button>
                <FiChevronRight className="text-slate-300 dark:text-slate-600" size={14} />
                <span className="text-slate-900 dark:text-white font-bold">Finalisasi Jasa Desain</span>
            </div>

            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Finalisasi Jasa Desain</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tinjau durasi pengerjaan dan konfirmasi biaya desain.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Work Details Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 text-slate-900 dark:text-white">
                                <span className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><FiClock size={16} /></span>
                                Rincian Pekerjaan
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Time Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mb-1">Waktu Mulai</p>
                                    <p className="text-lg font-black text-slate-800 dark:text-white">{formatTime(task?.createdAt)}</p>
                                    <p className="text-xs text-slate-400">{formatDate(task?.createdAt)}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mb-1">Waktu Selesai</p>
                                    <p className="text-lg font-black text-slate-800 dark:text-white">{formatTime(now)}</p>
                                    <p className="text-xs text-slate-400">{formatDate(now)}</p>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mb-1">Total Durasi</p>
                                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                                        {String(duration.h).padStart(2, '0')}:{String(duration.m).padStart(2, '0')}:{String(duration.s).padStart(2, '0')}
                                    </p>
                                    <p className="text-xs text-blue-500/60">~ {duration.totalHours.toFixed(2)} Jam</p>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="space-y-0">
                                <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Tarif Dasar per Jam</span>
                                    <span className="text-sm text-slate-900 dark:text-white font-bold">Rp {hourlyRate.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Durasi Tagihan (Dibulatkan)</span>
                                    <span className="text-sm text-slate-900 dark:text-white font-bold">{billedHours} Jam</span>
                                </div>
                                <div className="flex items-center justify-between py-5 px-5 bg-slate-900 dark:bg-slate-800 rounded-2xl mt-4">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Biaya Desain</span>
                                        <p className="text-[10px] text-slate-500 italic">*Tarif × Durasi</p>
                                    </div>
                                    <span className="text-2xl font-black text-blue-400 italic tracking-tighter">Rp {finalDesignPrice.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Design Preview Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 text-slate-900 dark:text-white">
                                <span className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-xl"><FiFileText size={16} /></span>
                                Pratinjau Hasil Desain
                            </h2>
                            {filePreview && (
                                <button onClick={() => setFilePreview(null)} className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1">
                                    <FiTrash2 size={12} /> Hapus
                                </button>
                            )}
                        </div>
                        <div className="p-6">
                            {!filePreview ? (
                                <div className="relative group cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500 transition-colors aspect-video bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center">
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, application/pdf"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => setFilePreview(ev.target.result);
                                                reader.readAsDataURL(e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <div className="flex flex-col items-center gap-3 p-8 pointer-events-none">
                                        <FiUploadCloud className="text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors" size={48} />
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Unggah Screenshot Hasil Akhir</p>
                                            <p className="text-xs text-slate-400 mt-1">PNG, JPG atau PDF (Maks. 5MB)</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden aspect-video bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                                    <img src={filePreview} alt="Preview" className="w-full h-full object-contain" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Order Info */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Informasi Pesanan</h2>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                                <FiUser size={20} />
                            </div>
                            <div>
                                <p className="font-black text-slate-900 dark:text-white text-sm">{displayTask.customerName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">ID: #{displayTask.id}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Nama File</span>
                                <span className="text-slate-900 dark:text-white font-medium">{displayTask.title || 'Logo_Bengkel.ai'}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-slate-500 dark:text-slate-400">Status Timer</span>
                                <span className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-widest">Berhenti</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleSimpanKeInvoice}
                            disabled={saving}
                            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiSave size={16} />
                            {saving ? 'Menyimpan...' : 'Simpan ke Invoice'}
                        </button>
                        <button
                            onClick={handleAktifkanRevisi}
                            disabled={saving}
                            className="w-full bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50 font-black py-4 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiRefreshCw size={16} />
                            Aktifkan Revisi
                        </button>
                        <button
                            onClick={handleBatalkanSesi}
                            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-700"
                        >
                            <FiX size={16} />
                            Batalkan Sesi
                        </button>
                    </div>

                    {/* Info Note */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                        <div className="flex gap-3">
                            <FiInfo className="text-blue-500 shrink-0 mt-0.5" size={16} />
                            <div>
                                <p className="text-xs font-black text-blue-900 dark:text-blue-300 mb-1">Catatan Tagihan</p>
                                <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">Biaya desain akan ditambahkan sebagai item baru pada invoice pelanggan #{taskId} secara otomatis.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
