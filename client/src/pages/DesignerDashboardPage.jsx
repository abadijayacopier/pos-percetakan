import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPenTool, FiClock, FiFileText, FiCheckCircle, FiPlayCircle, FiList, FiCheckSquare, FiLogOut, FiUploadCloud, FiX, FiLink, FiChevronLeft, FiChevronRight, FiActivity, FiZap, FiTarget, FiBox, FiMessageSquare } from 'react-icons/fi';
import Swal from 'sweetalert2';

const pad = (n) => String(n).padStart(2, '0');

export default function DesignerDashboardPage() {
    const { user, logout } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timerSeconds, setTimerSeconds] = useState(0);

    // Pagination for Done Tasks
    const [donePage, setDonePage] = useState(1);
    const doneItemsPerPage = 10;

    const intervalRef = useRef(null);

    // Modal State
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [finishingTask, setFinishingTask] = useState(null);
    const [fileDesain, setFileDesain] = useState('');
    const [catatanDesain, setCatatanDesain] = useState('');

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const [tasksRes, dpTasksRes] = await Promise.all([
                api.get('/designers/my-tasks'),
                api.get('/dp_tasks')
            ]);
            const data = tasksRes.data;
            const dpData = dpTasksRes.data;
            // Enrich with dp_tasks data from API 
            const enriched = data.map(t => {
                const dpTask = dpData.find(d => d.id === t.task_id);
                return { ...t, dpTask };
            });
            setTasks(enriched);
        } catch {
            setTasks([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    // Timer for active task
    const activeTask = tasks.find(t => t.status === 'dikerjakan');
    useEffect(() => {
        if (activeTask?.started_at) {
            const start = new Date(activeTask.started_at);
            const updateTimer = () => {
                const diff = Math.floor((new Date() - start) / 1000);
                setTimerSeconds(Math.max(0, diff));
            };
            updateTimer();
            intervalRef.current = setInterval(updateTimer, 1000);
            return () => clearInterval(intervalRef.current);
        } else {
            setTimerSeconds(0);
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    }, [activeTask?.id, activeTask?.started_at]);

    const handleStart = async (assignmentId) => {
        try {
            await api.patch(`/designers/tasks/${assignmentId}/start`);
            fetchTasks();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal memulai desain', timer: 3000 });
        }
    };

    const handleFinishClick = (task) => {
        setFinishingTask(task);
        setFileDesain('');
        setCatatanDesain('');
        setShowFinishModal(true);
    };

    const submitFinish = async () => {
        if (!finishingTask) return;
        try {
            await api.patch(`/designers/tasks/${finishingTask.id}/finish`, {
                file_hasil_desain: fileDesain || null,
                catatan: catatanDesain || null
            });
            // Update backend status
            if (finishingTask.task_id) {
                await api.put(`/dp_tasks/${finishingTask.task_id}`, { status: 'produksi' });
            }
            setShowFinishModal(false);
            setFinishingTask(null);
            fetchTasks();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal menyelesaikan', timer: 3000 });
        }
    };

    const h = Math.floor(timerSeconds / 3600);
    const m = Math.floor((timerSeconds % 3600) / 60);
    const s = timerSeconds % 60;

    const pendingTasks = tasks.filter(t => t.status === 'ditugaskan');
    const doneTasks = tasks.filter(t => t.status === 'selesai');

    return (
        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100 font-display transition-colors pb-10">
            {/* Header / Hero */}
            <header className="px-6 py-6 md:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
                        {user?.name?.substring(0, 2).toUpperCase() || 'DS'}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace Desainer</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user?.name || 'Desainer Kreatif'} • Divisi Produksi Visual</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={logout}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 text-slate-600 dark:text-slate-400 font-semibold text-sm transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        <FiLogOut /> <span className="hidden sm:inline">Keluar</span>
                    </button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Kiri: Active Workspace & Pending Orders */}
                <div className="lg:col-span-8 space-y-8">

                    <AnimatePresence mode="wait">
                        {(activeTask && user?.role === 'desainer') ? (
                            <motion.section
                                key="active-work"
                                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                                className="bg-white dark:bg-slate-800/80 rounded-4xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden"
                            >
                                <div className="p-6 md:p-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 dark:border-slate-700/50 pb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center">
                                                <FiZap size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">Tugas Saat Ini</h2>
                                                <p className="text-sm font-medium text-slate-500 mt-1">ID Ref: #{activeTask.task_id}</p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 text-sm font-bold flex items-center gap-2 w-max border border-emerald-100 dark:border-emerald-800/30">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Sedang Dikerjakan
                                        </div>
                                    </div>

                                    {/* Stopwatch Panel */}
                                    <div className="flex flex-col items-center justify-center py-10 md:py-12 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 mb-8">
                                        <div className="flex items-center gap-3 text-5xl md:text-7xl font-bold text-slate-800 dark:text-white font-mono tracking-wider">
                                            <span>{pad(h)}</span>
                                            <span className="text-slate-300 dark:text-slate-700 animate-pulse -translate-y-1">:</span>
                                            <span>{pad(m)}</span>
                                            <span className="text-slate-300 dark:text-slate-700 animate-pulse -translate-y-1">:</span>
                                            <span className="text-blue-600 dark:text-blue-400">{pad(s)}</span>
                                        </div>
                                        <p className="mt-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Durasi Pengerjaan</p>
                                    </div>

                                    {/* Task Data */}
                                    {activeTask.dpTask && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Nama Pemesan</p>
                                                <p className="text-base font-bold text-slate-800 dark:text-white truncate">{activeTask.dpTask.customerName}</p>
                                            </div>
                                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Judul / Objek Desain</p>
                                                <p className="text-base font-bold text-slate-800 dark:text-white truncate">{activeTask.dpTask.title}</p>
                                            </div>
                                            <div className="col-span-1 md:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">Spesifikasi Target Cetak</p>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-sm font-semibold flex items-center gap-2 border border-indigo-100 dark:border-indigo-800/30">
                                                        <FiBox /> {activeTask.dpTask.material_name}
                                                    </span>
                                                    <span className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 text-sm font-semibold flex items-center gap-2 border border-sky-100 dark:border-sky-800/30">
                                                        <FiTarget /> {activeTask.dpTask.dimensions?.width}m × {activeTask.dpTask.dimensions?.height}m
                                                    </span>
                                                </div>
                                            </div>

                                            {activeTask.dpTask?.pesan_desainer && (
                                                <div className="col-span-1 md:col-span-2 p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FiMessageSquare className="text-amber-600 dark:text-amber-400" size={16} />
                                                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Catatan dari Admin (Penting)</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200 leading-relaxed italic">
                                                        "{activeTask.dpTask.pesan_desainer}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleFinishClick(activeTask)}
                                        className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-xl shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                                    >
                                        <FiCheckCircle size={22} className="group-hover:scale-110 transition-transform" />
                                        Saya Sudah Menyelesaikan Desain Ini
                                    </button>
                                </div>
                            </motion.section>
                        ) : (
                            user?.role === 'desainer' ? (
                                <motion.section
                                    key="idle-work"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="py-24 px-8 rounded-4xl bg-white dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center shadow-sm"
                                >
                                    <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-6 drop-shadow-sm">
                                        <FiPenTool size={40} />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Belum Ada Desain Berjalan</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">Klik tombol "Mulai Kerjakan" pada daftar antrean SPK di bawah untuk mulai mencatat durasi kerja Anda.</p>
                                </motion.section>
                            ) : null
                        )}
                    </AnimatePresence>

                    {/* Pending Queue / Monitoring List */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"><FiList size={20} /></div>
                                {user?.role === 'desainer' ? 'Permintaan Desain Baru' : 'Monitoring Tugas Desain'}
                            </h3>
                            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-sm font-bold border border-amber-200 dark:border-amber-800/50 shadow-sm">
                                {user?.role === 'desainer' ? pendingTasks.length : tasks.filter(t => ['ditugaskan', 'dikerjakan'].includes(t.status)).length} Tugas
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {tasks.filter(t => user?.role === 'desainer' ? t.status === 'ditugaskan' : ['ditugaskan', 'dikerjakan'].includes(t.status)).map((t, idx) => (
                                <motion.div
                                    key={t.id}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                    className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col h-full"
                                >
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/40 w-max">Tugas #{t.task_id}</span>
                                            {user?.role !== 'desainer' && t.designer_name && (
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Desainer: {t.designer_name}</span>
                                            )}
                                        </div>
                                        <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${
                                            t.status === 'dikerjakan' 
                                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30'
                                            : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30'
                                        }`}>
                                            {t.status === 'dikerjakan' ? <><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Proses</> : <><FiClock /> Menunggu</>}
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white mb-1.5 line-clamp-2 leading-tight">{t.dpTask?.title || 'Objek Desain Gagal Dimuat'}</p>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2"><FiMessageSquare className="opacity-50" /> {t.dpTask?.customerName || 'N/A'}</p>

                                    {!activeTask && (
                                        <button
                                            onClick={() => handleStart(t.id)}
                                            className="mt-auto w-full py-3 rounded-xl bg-slate-50 hover:bg-blue-600 text-slate-600 hover:text-white dark:bg-slate-700/50 dark:hover:bg-blue-600 dark:text-slate-300 dark:hover:text-white font-bold text-sm border border-slate-200 dark:border-slate-600 hover:border-blue-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FiPlayCircle size={18} /> Mulai Kerjakan
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                            {pendingTasks.length === 0 && (
                                <div className="col-span-1 md:col-span-2 text-center py-12 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 border-dashed text-slate-500 dark:text-slate-400 text-sm font-medium">
                                    {loading ? 'Memuat daftar pesanan desain...' : '🎉 Tidak ada antrean desain baru untuk saat ini.'}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Kanan: Riwayat Selesai & Motivasi */}
                <aside className="lg:col-span-4 space-y-8">
                    <div className="bg-white dark:bg-slate-800 rounded-4xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[450px]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"><FiCheckSquare size={18} /></div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Riwayat Desain Selesai</h3>
                            </div>
                        </div>

                        <div className="flex-1 p-3">
                            <AnimatePresence mode="popLayout">
                                {doneTasks.slice((donePage - 1) * doneItemsPerPage, donePage * doneItemsPerPage).map((t, idx) => (
                                    <motion.div
                                        key={t.id}
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                        className="p-4 mb-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-100 dark:border-slate-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{t.dpTask?.title || `Pesanan #${t.task_id}`}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900">SPK #{t.task_id}</span>
                                                    {user?.role !== 'desainer' && t.designer_name && (
                                                        <span className="text-[10px] font-bold text-indigo-500 truncate max-w-[80px]">By: {t.designer_name}</span>
                                                    )}
                                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><FiCheckCircle size={12} /> Selesai</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                {t.started_at && t.finished_at && (
                                                    <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm flex items-center gap-1">
                                                        <FiActivity size={10} className="text-blue-500" />
                                                        {Math.round((new Date(t.finished_at) - new Date(t.started_at)) / 60000)}m
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {doneTasks.length === 0 && !loading && (
                                    <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                                        <FiCheckCircle size={40} className="mb-4 text-emerald-100 dark:text-emerald-900" />
                                        <p className="text-sm font-medium">Belum ada riwayat desain yang diselesaikan.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Pagination Controls */}
                        {doneTasks.length > doneItemsPerPage && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                                <button
                                    onClick={() => setDonePage(p => Math.max(1, p - 1))}
                                    disabled={donePage === 1}
                                    className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all text-slate-700 dark:text-slate-300 shadow-sm"
                                >
                                    <FiChevronLeft />
                                </button>
                                <span className="text-xs font-bold text-slate-500">Hal {donePage} / {Math.ceil(doneTasks.length / doneItemsPerPage)}</span>
                                <button
                                    onClick={() => setDonePage(p => Math.min(Math.ceil(doneTasks.length / doneItemsPerPage), p + 1))}
                                    disabled={donePage === Math.ceil(doneTasks.length / doneItemsPerPage)}
                                    className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all text-slate-700 dark:text-slate-300 shadow-sm"
                                >
                                    <FiChevronRight />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Designer Insight Box (Lighter Theme) */}
                    <div className="p-8 rounded-4xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border border-blue-100 dark:border-slate-700 shadow-inner relative overflow-hidden">
                        <FiTarget className="text-blue-500/10 dark:text-blue-500/5 absolute -top-4 -right-4" size={120} />
                        <div className="relative z-10">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-400 mb-3">
                                <FiCheckSquare /> Insight Desainer
                            </h4>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                "Seni komunikasi visual yang baik bukan hanya tentang estetika, melainkan juga presisi dalam menyampaikan pesan."
                            </p>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Modal Lapor Selesai */}
            <AnimatePresence>
                {showFinishModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setShowFinishModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-4xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
                                        <FiUploadCloud size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Serahkan Hasil Desain</h3>
                                        <p className="text-sm font-medium text-slate-500">Tugas SPK #{finishingTask?.task_id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowFinishModal(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-red-500 transition-colors"><FiX size={20} /></button>
                            </div>

                            <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Tautan File Desain Lanjutan (Opsional)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <FiLink size={18} />
                                        </div>
                                        <input
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                                            placeholder="https://drive.google.com/..."
                                            value={fileDesain}
                                            onChange={e => setFileDesain(e.target.value)}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs font-medium text-slate-500">Tempelkan link GDrive jika admin perlu mengunduh master grafis.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Catatan untuk Staff Kasir / Cetak
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white font-medium resize-none"
                                        placeholder="Ketik instruksi terkait layout, warna, dsb..."
                                        rows="4"
                                        value={catatanDesain}
                                        onChange={e => setCatatanDesain(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col-reverse sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowFinishModal(false)}
                                    className="px-6 py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all text-center"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={submitFinish}
                                    className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <FiCheckCircle size={18} /> Konfirmasi Selesai
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
