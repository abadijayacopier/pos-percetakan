import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import db from '../db';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPenTool, FiClock, FiFileText, FiCheckCircle, FiPlayCircle, FiList, FiCheckSquare, FiLogOut, FiUploadCloud, FiX, FiLink, FiChevronLeft, FiChevronRight, FiActivity, FiZap, FiTarget, FiBox, FiMessageSquare } from 'react-icons/fi';

const pad = (n) => String(n).padStart(2, '0');

export default function DesignerDashboardPage({ onNavigate }) {
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
            const { data } = await api.get('/designers/my-tasks');
            // Enrich with dp_tasks data from localStorage
            const enriched = data.map(t => {
                const dpTask = db.getById('dp_tasks', t.task_id);
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
            alert(err.response?.data?.message || 'Gagal memulai desain');
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
            // Update dp_task status in localStorage
            if (finishingTask.task_id) {
                db.update('dp_tasks', finishingTask.task_id, { status: 'produksi' });
            }
            setShowFinishModal(false);
            setFinishingTask(null);
            fetchTasks();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyelesaikan');
        }
    };

    const h = Math.floor(timerSeconds / 3600);
    const m = Math.floor((timerSeconds % 3600) / 60);
    const s = timerSeconds % 60;

    const pendingTasks = tasks.filter(t => t.status === 'ditugaskan');
    const doneTasks = tasks.filter(t => t.status === 'selesai');

    return (
        <div className="min-h-screen bg-[#060a13] text-slate-200 font-display selection:bg-blue-500/30 overflow-x-hidden relative">
            {/* ── Background Effects ── */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.08)_0%,transparent_50%)]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
                <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-indigo-600/5 blur-[100px] rounded-full" />
            </div>

            {/* ── Header ── */}
            <header className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-[#060a13]/50">
                <div className="flex items-center gap-5">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20"
                    >
                        {(user?.name || 'D').substring(0, 2).toUpperCase()}
                    </motion.div>
                    <div>
                        <h1 className="text-xl font-black text-white leading-tight tracking-tight">{user?.name || 'Desainer'}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Creative Division</span>
                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${activeTask ? 'text-rose-400' : 'text-emerald-400'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${activeTask ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                                {activeTask ? 'Engaged' : 'Active / Ready'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={logout}
                        className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs transition-all flex items-center gap-2 border border-white/5"
                    >
                        <FiLogOut /> Keluar Sistem
                    </button>
                </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* ── Left Side: Mission Control Center ── */}
                <div className="lg:col-span-7 space-y-10">

                    {/* Active Workstation HUD */}
                    <AnimatePresence mode="wait">
                        {activeTask ? (
                            <motion.section
                                key="active-work"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="relative rounded-[2.5rem] p-1 border border-blue-500/20 shadow-2xl shadow-blue-500/10 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-slate-900 to-slate-950" />

                                <div className="relative z-10 p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                                <FiZap size={22} className="animate-pulse" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-white italic tracking-tight uppercase">Live Workstation</h2>
                                                <p className="text-xs font-bold text-blue-400/60 uppercase tracking-widest">Processing Node #{activeTask.task_id}</p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                            Design Execution
                                        </div>
                                    </div>

                                    {/* Central Clock HUD */}
                                    <div className="flex flex-col items-center justify-center py-10 rounded-[2rem] bg-black/40 border border-white/5 shadow-inner mb-8">
                                        <div className="flex items-center gap-4">
                                            {[pad(h), pad(m), pad(s)].map((unit, i) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <motion.div
                                                            key={unit}
                                                            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                                            className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                                        >
                                                            {unit}
                                                        </motion.div>
                                                    </div>
                                                    {i < 2 && <span className="text-4xl font-light text-slate-700 mt-[-10px] animate-pulse">:</span>}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-4">
                                            <span className="w-12 h-[1px] bg-slate-800" /> SESSION UPTIME <span className="w-12 h-[1px] bg-slate-800" />
                                        </p>
                                    </div>

                                    {/* Task Data HUD */}
                                    {activeTask.dpTask && (
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-colors">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Client</p>
                                                <p className="text-sm font-black text-white line-clamp-1">{activeTask.dpTask.customerName}</p>
                                            </div>
                                            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-colors">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Asset Module</p>
                                                <p className="text-sm font-black text-white line-clamp-1">{activeTask.dpTask.title}</p>
                                            </div>
                                            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-colors col-span-2">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Configuration</p>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-black text-white flex items-center gap-2">
                                                        <FiBox className="text-blue-400" /> {activeTask.dpTask.material_name}
                                                    </span>
                                                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                                                    <span className="text-sm font-black text-white flex items-center gap-2">
                                                        <FiTarget className="text-indigo-400" /> {activeTask.dpTask.dimensions?.width}m × {activeTask.dpTask.dimensions?.height}m
                                                    </span>
                                                </div>
                                            </div>

                                            {activeTask.dpTask?.pesan_desainer && (
                                                <div className="col-span-2 p-5 rounded-3xl bg-amber-500/5 border border-amber-500/20">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FiMessageSquare className="text-amber-400" size={14} />
                                                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Admin Instructions</span>
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-300 italic leading-relaxed">
                                                        "{activeTask.dpTask.pesan_desainer}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleFinishClick(activeTask)}
                                        className="w-full py-5 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm tracking-widest uppercase shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                                    >
                                        <FiCheckCircle size={20} className="group-hover:scale-125 transition-transform" />
                                        Complete Assignment
                                    </button>
                                </div>
                            </motion.section>
                        ) : (
                            <motion.section
                                key="idle-work"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="py-24 px-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 border-dashed flex flex-col items-center justify-center text-center group"
                            >
                                <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center text-slate-700 group-hover:scale-110 group-hover:bg-slate-800 transition-all duration-700 mb-6 drop-shadow-[0_0_30px_rgba(37,99,235,0.05)]">
                                    <FiPenTool size={40} />
                                </div>
                                <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest italic">Standby Mode</h2>
                                <p className="text-slate-600 font-medium text-sm mt-2 max-w-xs">No active design cycles detected. Please standby for incoming terminal telemetry.</p>
                                <div className="mt-10 flex gap-2">
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                                            className="w-1.5 h-1.5 rounded-full bg-blue-500/40"
                                        />
                                    ))}
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>

                    {/* Pending Queue HUD */}
                    <section className="space-y-6 px-2">
                        <div className="flex items-center justify-between">
                            <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.3em] text-slate-500">
                                <div className="p-1.5 rounded-lg bg-slate-800 text-amber-500"><FiList /></div>
                                Terminal Queue ({pendingTasks.length})
                            </h3>
                            <div className="h-[1px] flex-1 mx-6 bg-slate-800/50" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingTasks.map((t, idx) => (
                                <motion.div
                                    key={t.id}
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}
                                    className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <FiActivity size={60} />
                                    </div>
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 uppercase tracking-widest">#{t.task_id}</span>
                                            <div className="flex items-center gap-1 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                                                <FiClock /> Pending
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors mb-1 line-clamp-1">{t.dpTask?.title || 'Unknown Asset'}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">{t.dpTask?.customerName || 'N/A'}</p>

                                        {!activeTask && (
                                            <button
                                                onClick={() => handleStart(t.id)}
                                                className="mt-auto w-full py-3 rounded-xl bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 text-blue-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                            >
                                                <FiPlayCircle size={14} /> Initialize Design
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {pendingTasks.length === 0 && (loading ? <div className="col-span-2 text-center py-10 opacity-30 italic text-xs">Acessing secured node...</div> : <div className="col-span-2 text-center py-10 opacity-30 italic text-xs tracking-widest uppercase font-black">Waiting for Data Packets</div>)}
                        </div>
                    </section>
                </div>

                {/* ── Right Side: Archive / Intelligence ── */}
                <div className="lg:col-span-5 space-y-10">

                    {/* Archival History */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.3em] text-slate-500 mb-6">
                            <div className="p-1.5 rounded-lg bg-slate-800 text-emerald-500"><FiCheckSquare /></div>
                            Mission Artifacts
                        </div>

                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                                {doneTasks.slice((donePage - 1) * doneItemsPerPage, donePage * doneItemsPerPage).map((t, idx) => (
                                    <motion.div
                                        key={t.id}
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                        className="p-5 rounded-[1.75rem] bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 group transition-all"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/5 group-hover:bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10 transition-colors shrink-0">
                                                    <FiCheckCircle size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors line-clamp-1">{t.dpTask?.title || `Task #${t.task_id}`}</p>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">#{t.task_id} Completed</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                {t.started_at && t.finished_at && (
                                                    <p className="text-[10px] font-black text-slate-400 bg-slate-800/50 px-2 py-1 rounded-md">
                                                        {Math.round((new Date(t.finished_at) - new Date(t.started_at)) / 60000)}m
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Pagination HUD */}
                            {doneTasks.length > doneItemsPerPage && (
                                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <button
                                        onClick={() => setDonePage(p => Math.max(1, p - 1))}
                                        disabled={donePage === 1}
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 transition-all text-slate-400"
                                    >
                                        <FiChevronLeft />
                                    </button>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{donePage} / {Math.ceil(doneTasks.length / doneItemsPerPage)}</span>
                                    <button
                                        onClick={() => setDonePage(p => Math.min(Math.ceil(doneTasks.length / doneItemsPerPage), p + 1))}
                                        disabled={donePage === Math.ceil(doneTasks.length / doneItemsPerPage)}
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 transition-all text-slate-400"
                                    >
                                        <FiChevronRight />
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Designer Tips / Branding Widget */}
                    <div className="p-8 rounded-[2rem] bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-500/10 relative overflow-hidden group shadow-2xl">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                        <FiPenTool className="text-indigo-500/20 absolute bottom-[-10px] right-[-10px]" size={100} />

                        <div className="relative z-10">
                            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Designer Insights</h4>
                            <p className="text-xs font-medium text-slate-400 leading-relaxed italic">
                                "Precision in design is not just about pixels, but the telemetry of visual communication. Every asset is a node in the brand's network."
                            </p>
                            <div className="mt-6 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <FiCheckCircle size={14} />
                                </div>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Optimal Node Sync</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Finish Modal ── */}
            <AnimatePresence>
                {showFinishModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-xl"
                            onClick={() => setShowFinishModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative z-10 w-full max-w-lg bg-[#0d121f] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden shadow-emerald-500/5"
                        >
                            <div className="p-8 pb-4 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                        <FiUploadCloud size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase italic">Archive Node</h3>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Assignment Commit #{finishingTask?.task_id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowFinishModal(false)} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"><FiX size={20} /></button>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
                                        <FiLink size={14} /> CLOUD DESIGN REPOSITORY
                                    </label>
                                    <input
                                        className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border-2 border-transparent focus:border-emerald-500/50 outline-none text-white font-bold transition-all placeholder:text-slate-700"
                                        placeholder="INPUT ASSET URL (GDRIVE, DROPBOX, CLOUD...)"
                                        value={fileDesain}
                                        onChange={e => setFileDesain(e.target.value)}
                                    />
                                    <div className="flex items-center gap-2 mt-2 px-1">
                                        <FiZap size={10} className="text-emerald-500" />
                                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic">Node will be routed to Production Unit</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
                                        <FiFileText size={14} /> SESSION NOTES & LOGS
                                    </label>
                                    <textarea
                                        className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border-2 border-transparent focus:border-emerald-500/50 outline-none text-white font-bold transition-all placeholder:text-slate-700 min-h-[120px] resize-none"
                                        placeholder="ATTACH OPTIONAL TELEMETRY OR SPECIAL INSTRUCTIONS..."
                                        value={catatanDesain}
                                        onChange={e => setCatatanDesain(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-8 bg-black/30 border-t border-white/5 flex gap-4">
                                <button
                                    onClick={() => setShowFinishModal(false)}
                                    className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Abort Commit
                                </button>
                                <button
                                    onClick={submitFinish}
                                    className="flex-[1.5] py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <FiCheckCircle size={18} className="group-hover:scale-110" /> Finalize Asset
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
