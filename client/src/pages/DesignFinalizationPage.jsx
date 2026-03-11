import { useState, useEffect } from 'react';
import db from '../db';
import { useAuth } from '../contexts/AuthContext';

export default function DesignFinalizationPage({ onNavigate, pageState }) {
    const { user } = useAuth();
    const taskId = pageState?.taskId;
    const [task, setTask] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        if (taskId) {
            const t = db.getById('dp_tasks', taskId);
            if (t) setTask(t);
        }

        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, [taskId]);

    // Format helpers
    const formatTime = (date) => {
        if (!date) return '--:--:--';
        const d = new Date(date);
        return d.toTimeString().split(' ')[0];
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
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return { h, m, s, totalHours: totalSeconds / 3600 };
    };

    const duration = calculateDuration();
    const hourlyRate = 50000;
    const billedHours = Math.max(0.5, Math.ceil(duration.totalHours * 2) / 2); // Round to nearest 0.5, min 0.5
    const finalDesignPrice = billedHours * hourlyRate;

    const handleSimpanKeInvoice = () => {
        if (!taskId) return;

        db.update('dp_tasks', taskId, {
            status: 'checkout',
            design_price: finalDesignPrice,
            design_duration: `${duration.h}h ${duration.m}m`,
            updatedAt: new Date().toISOString()
        });

        db.logActivity(user?.name, 'Finalisasi Desain', `Menyelesaikan desain untuk pesanan #${taskId} - Biaya: ${finalDesignPrice}`);
        onNavigate('dp-cart', { taskId: taskId });
    };

    const handleAktifkanRevisi = () => {
        if (!taskId) return;
        db.update('dp_tasks', taskId, {
            status: 'desain',
            updatedAt: new Date().toISOString()
        });
        db.logActivity(user?.name, 'Aktifkan Revisi', `Mengaktifkan sesi revisi untuk pesanan #${taskId}`);
        onNavigate('digital-printing');
    };

    const handleBatalkanSesi = () => {
        onNavigate('digital-printing');
    };

    if (!task && taskId) {
        return (
            <div className="flex-1 p-20 text-center">
                <h2 className="text-xl font-bold">Memuat Data Pesanan...</h2>
                <p className="text-slate-500">Jika halaman tidak memuat, pastikan Task ID valid.</p>
                <button onClick={() => onNavigate('digital-printing')} className="mt-4 text-primary font-bold">Kembali ke Dashboard</button>
            </div>
        );
    }

    // Fallback display values if task is missing but we're in demo mode
    const displayTask = task || {
        customerName: 'Bengkel Jaya',
        id: taskId || 'ORD-9022',
        title: 'Logo Design (Mockup)'
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] min-h-screen text-slate-900 font-[Inter]">
            {/* Header section */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 h-16 flex items-center px-8 justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                    <span className="text-sm font-medium">Percetakan</span>
                    <span className="material-symbols-outlined !text-sm">chevron_right</span>
                    <span className="text-sm font-bold text-slate-900">Finalisasi Jasa Desain</span>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <div className="h-8 w-px bg-slate-200 mx-1"></div>
                    <button className="flex items-center gap-3 p-1 pl-2 rounded-full hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-slate-900 leading-none">{user?.name || 'Admin User'}</p>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{user?.role || 'Administrator'}</p>
                        </div>
                        <div className="size-9 rounded-full bg-blue-100 flex items-center justify-center text-[#137fec] font-bold text-sm">
                            {(user?.name || 'AU').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="material-symbols-outlined text-slate-400 !text-lg">expand_more</span>
                    </button>
                </div>
            </header>

            <main className="p-8 max-w-5xl mx-auto w-full">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finalisasi Jasa Desain</h1>
                        <p className="text-slate-500">Tinjau durasi pengerjaan dan konfirmasi biaya desain.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined !text-lg">history</span>
                            Riwayat
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left content */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-[#137fec]">analytics</span>
                                <h2 className="text-lg font-bold text-slate-800">Rincian Pekerjaan</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Waktu Mulai</p>
                                    <p className="text-lg font-bold text-slate-800">{formatTime(task?.createdAt)}</p>
                                    <p className="text-xs text-slate-400">{formatDate(task?.createdAt)}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Waktu Selesai</p>
                                    <p className="text-lg font-bold text-slate-800">{formatTime(now)}</p>
                                    <p className="text-xs text-slate-400">{formatDate(now)}</p>
                                </div>
                                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                    <p className="text-[10px] text-[#137fec] font-bold uppercase tracking-wider mb-1">Total Durasi</p>
                                    <p className="text-lg font-bold text-[#137fec]">
                                        {String(duration.h).padStart(2, '0')}:{String(duration.m).padStart(2, '0')}:{String(duration.s).padStart(2, '0')}
                                    </p>
                                    <p className="text-xs text-blue-500/60">~ {duration.totalHours.toFixed(2)} Jam</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">Tarif Dasar per Jam</span>
                                    <span className="text-slate-900 font-bold">Rp {hourlyRate.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">Durasi Tagihan (Dibulatkan)</span>
                                    <span className="text-slate-900 font-bold">{billedHours} Jam</span>
                                </div>
                                <div className="flex items-center justify-between py-4 bg-slate-50 px-4 rounded-xl mt-4">
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Biaya Desain</span>
                                        <p className="text-xs text-slate-400 italic">*Tarif x Durasi</p>
                                    </div>
                                    <span className="text-3xl font-black text-[#137fec]">Rp {finalDesignPrice.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-orange-500">image</span>
                                    <h2 className="text-lg font-bold text-slate-800">Pratinjau Hasil Desain</h2>
                                </div>
                                {filePreview && (
                                    <button onClick={() => setFilePreview(null)} className="text-sm font-bold text-[#137fec] hover:underline">Hapus Gambar</button>
                                )}
                            </div>

                            {!filePreview ? (
                                <div className="relative group cursor-pointer border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden hover:border-[#137fec] transition-colors aspect-video bg-slate-50 flex flex-col items-center justify-center">
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, application/pdf"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const reader = new FileReader();
                                                reader.onload = (e) => setFilePreview(e.target.result);
                                                reader.readAsDataURL(e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <div className="flex flex-col items-center gap-3 p-8 pointer-events-none">
                                        <span className="material-symbols-outlined !text-5xl text-slate-300 group-hover:text-blue-200 transition-colors">cloud_upload</span>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-slate-600">Unggah Screenshot Hasil Akhir</p>
                                            <p className="text-xs text-slate-400 mt-1">PNG, JPG atau PDF (Maks. 5MB)</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-xl overflow-hidden aspect-video bg-slate-50 flex items-center justify-center relative">
                                    <img src={filePreview} alt="Preview" className="w-full h-full object-contain" />
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right sidebar */}
                    <div className="space-y-6">
                        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Informasi Pesanan</h2>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined">person</span>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{displayTask.customerName}</p>
                                    <p className="text-xs text-slate-500">ID: #{displayTask.id}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Nama File</span>
                                    <span className="text-slate-900 font-medium">Logo_Bengkel.ai</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Status Timer</span>
                                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold uppercase">Berhenti</span>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <button
                                onClick={handleSimpanKeInvoice}
                                className="w-full bg-[#137fec] text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20"
                            >
                                <span className="material-symbols-outlined">receipt_long</span>
                                Simpan ke Invoice
                            </button>
                            <button
                                onClick={handleAktifkanRevisi}
                                className="w-full bg-white text-orange-600 border border-orange-200 font-bold py-4 rounded-xl hover:bg-orange-50 transition-all flex items-center justify-center gap-3">
                                <span className="material-symbols-outlined">replay</span>
                                Aktifkan Revisi
                            </button>
                            <button
                                onClick={handleBatalkanSesi}
                                className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3">
                                <span className="material-symbols-outlined">close</span>
                                Batalkan Sesi
                            </button>
                        </section>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="flex gap-3">
                                <span className="material-symbols-outlined text-blue-500 !text-xl">info</span>
                                <div>
                                    <p className="text-xs font-bold text-blue-900 mb-1">Catatan Tagihan</p>
                                    <p className="text-[11px] text-blue-700 leading-relaxed">Biaya desain akan ditambahkan sebagai item baru pada invoice pelanggan #{taskId} secara otomatis.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
