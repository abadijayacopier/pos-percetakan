import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import db from '../db';
import { useAuth } from '../contexts/AuthContext';
import { FiPenTool, FiClock, FiFileText, FiCheckCircle, FiPlayCircle, FiList, FiCheckSquare, FiLogOut, FiUploadCloud, FiX, FiLink } from 'react-icons/fi';

const pad = (n) => String(n).padStart(2, '0');

export default function DesignerDashboardPage({ onNavigate }) {
    const { user, logout } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timerSeconds, setTimerSeconds] = useState(0);
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

    useEffect(() => { fetchTasks(); }, []);

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
        <div style={{
            minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#f1f5f9', fontFamily: "'Inter', sans-serif"
        }}>
            <style>{CSS}</style>

            {/* Header */}
            <header className="dd-header">
                <div className="dd-header-left">
                    <div className="dd-avatar">
                        {(user?.name || 'D').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="dd-name">{user?.name || 'Desainer'}</h1>
                        <p className="dd-role">Operator Desain</p>
                    </div>
                </div>
                <div className="dd-header-right">
                    <span className={`dd-status-badge flex items-center gap-1 ${activeTask ? 'dd-status-busy' : 'dd-status-free'}`}>
                        {activeTask ? <><div className="size-2 rounded-full bg-red-400"></div> Sibuk</> : <><div className="size-2 rounded-full bg-green-400"></div> Tersedia</>}
                    </span>
                    <button className="dd-logout-btn" onClick={logout}>
                        <FiLogOut />
                        Keluar
                    </button>
                </div>
            </header>

            <main className="dd-main">
                {/* Active Task */}
                {activeTask ? (
                    <section className="dd-active-card">
                        <div className="dd-active-header">
                            <div className="dd-active-icon">
                                <FiPenTool size={24} />
                            </div>
                            <div>
                                <h2 className="dd-active-title">Sedang Mengerjakan Desain</h2>
                                <p className="dd-active-sub">Pesanan #{activeTask.task_id}</p>
                            </div>
                        </div>

                        {/* Timer */}
                        <div className="dd-timer-container">
                            <div className="dd-timer">
                                <span className="dd-timer-digit">{pad(h)}</span>
                                <span className="dd-timer-sep">:</span>
                                <span className="dd-timer-digit">{pad(m)}</span>
                                <span className="dd-timer-sep">:</span>
                                <span className="dd-timer-digit">{pad(s)}</span>
                            </div>
                            <p className="dd-timer-label">Durasi Pengerjaan</p>
                        </div>

                        {/* Task Info */}
                        {activeTask.dpTask && (
                            <div className="dd-task-info">
                                <div className="dd-info-row">
                                    <span className="dd-info-label">Pelanggan</span>
                                    <span className="dd-info-value">{activeTask.dpTask.customerName}</span>
                                </div>
                                <div className="dd-info-row">
                                    <span className="dd-info-label">Pekerjaan</span>
                                    <span className="dd-info-value">{activeTask.dpTask.title}</span>
                                </div>
                                <div className="dd-info-row">
                                    <span className="dd-info-label">Bahan</span>
                                    <span className="dd-info-value">{activeTask.dpTask.material_name}</span>
                                </div>
                                <div className="dd-info-row">
                                    <span className="dd-info-label">Ukuran</span>
                                    <span className="dd-info-value">{activeTask.dpTask.dimensions?.width}m × {activeTask.dpTask.dimensions?.height}m</span>
                                </div>
                                {activeTask.dpTask?.pesan_desainer && (
                                    <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', borderRadius: '4px' }}>
                                        <span className="dd-info-label" style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                            <FiFileText /> Catatan dari Admin:
                                        </span>
                                        <span className="dd-info-value" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>"{activeTask.dpTask.pesan_desainer}"</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <button className="dd-finish-btn" onClick={() => handleFinishClick(activeTask)}>
                            <FiCheckCircle size={20} />
                            Selesai Desain
                        </button>
                    </section>
                ) : (
                    <section className="dd-empty-active">
                        <FiPenTool size={64} style={{ color: '#334155', margin: '0 auto' }} />
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#64748b', margin: '12px 0 4px' }}>Tidak Ada Desain Aktif</h2>
                        <p style={{ fontSize: '.85rem', color: '#475569' }}>Menunggu penugasan dari admin.</p>
                    </section>
                )}

                {/* Pending Tasks */}
                {pendingTasks.length > 0 && (
                    <section className="dd-section">
                        <h3 className="dd-section-title">
                            <FiList style={{ color: '#f59e0b' }} />
                            Tugas Menunggu ({pendingTasks.length})
                        </h3>
                        <div className="dd-task-list">
                            {pendingTasks.map(t => (
                                <div key={t.id} className="dd-task-card">
                                    <div className="dd-task-card-info">
                                        <div>
                                            <p className="dd-task-card-id">#{t.task_id}</p>
                                            {t.dpTask && (
                                                <>
                                                    <p className="dd-task-card-title">{t.dpTask.title}</p>
                                                    <p className="dd-task-card-customer">Pelanggan: {t.dpTask.customerName}</p>
                                                </>
                                            )}
                                        </div>
                                        <span className="dd-badge-assigned flex items-center gap-1"><FiClock /> Ditugaskan</span>
                                    </div>
                                    {!activeTask && (
                                        <button className="dd-start-btn" onClick={() => handleStart(t.id)}>
                                            <FiPlayCircle size={18} />
                                            Mulai Desain
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Done Tasks */}
                {doneTasks.length > 0 && (
                    <section className="dd-section">
                        <h3 className="dd-section-title">
                            <FiCheckSquare style={{ color: '#22c55e' }} />
                            Riwayat Selesai ({doneTasks.length})
                        </h3>
                        <div className="dd-task-list">
                            {doneTasks.slice(0, 5).map(t => (
                                <div key={t.id} className="dd-task-card dd-task-done">
                                    <div className="dd-task-card-info">
                                        <div>
                                            <p className="dd-task-card-id">#{t.task_id}</p>
                                            {t.dpTask && <p className="dd-task-card-title">{t.dpTask.title}</p>}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className="dd-badge-done flex items-center gap-1 justify-end"><FiCheckCircle /> Selesai</span>
                                            {t.started_at && t.finished_at && (
                                                <p style={{ fontSize: '.7rem', color: '#64748b', marginTop: 4 }}>
                                                    {Math.round((new Date(t.finished_at) - new Date(t.started_at)) / 60000)} menit
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Finish Modal */}
            {showFinishModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
                    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" style={{ animation: 'fadeIn .2s ease-out' }}>
                        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <FiUploadCloud size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white leading-tight">Selesai Desain</h3>
                                    <p className="text-xs text-slate-400">Pesanan #{finishingTask?.task_id}</p>
                                </div>
                            </div>
                            <button className="text-slate-500 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors" onClick={() => setShowFinishModal(false)}>
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                                    <FiLink className="text-slate-400" /> Link File Hasil Desain
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-800 border-slate-700 text-white placeholder-slate-500 rounded-xl p-3 text-sm focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="Contoh: https://drive.google.com/..."
                                    value={fileDesain}
                                    onChange={e => setFileDesain(e.target.value)}
                                />
                                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined !text-[12px]">info</span>
                                    Opsional. Link ini akan dilihat oleh Operator Cetak.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                                    <FiFileText className="text-slate-400" /> Catatan Tambahan
                                </label>
                                <textarea
                                    className="w-full bg-slate-800 border-slate-700 text-white placeholder-slate-500 rounded-xl p-3 text-sm min-h-[100px] resize-none focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="Tambahkan pesan untuk operator jika ada instruksi khusus..."
                                    value={catatanDesain}
                                    onChange={e => setCatatanDesain(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                        <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex gap-3">
                            <button
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
                                onClick={() => setShowFinishModal(false)}
                            >
                                Batal
                            </button>
                            <button
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                onClick={submitFinish}
                            >
                                <FiCheckCircle size={18} />
                                Konfirmasi Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const CSS = `
@keyframes dd-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.4)} 50%{box-shadow:0 0 0 12px transparent} }

.dd-header{display:flex;align-items:center;justify-content:space-between;padding:20px 32px;border-bottom:1px solid rgba(255,255,255,.06);}
.dd-header-left{display:flex;align-items:center;gap:14px;}
.dd-avatar{width:48px;height:48px;border-radius:14px;background:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.9rem;color:#fff;}
.dd-name{font-size:1.15rem;font-weight:800;margin:0;color:#fff;}
.dd-role{font-size:.75rem;color:#64748b;margin:2px 0 0;font-weight:500;}
.dd-header-right{display:flex;align-items:center;gap:12px;}
.dd-status-badge{padding:5px 14px;border-radius:9999px;font-size:.75rem;font-weight:700;}
.dd-status-free{background:rgba(22,163,106,.15);color:#4ade80;}
.dd-status-busy{background:rgba(239,68,68,.15);color:#fca5a5;}
.dd-logout-btn{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.08);color:#94a3b8;padding:8px 16px;border-radius:10px;border:none;cursor:pointer;font-weight:600;font-size:.8rem;transition:all .15s;}
.dd-logout-btn:hover{background:rgba(255,255,255,.15);color:#f1f5f9;}

.dd-main{padding:24px 32px;max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:24px;}

.dd-active-card{background:linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);border:1px solid rgba(37,99,235,.3);border-radius:20px;padding:28px;animation:dd-pulse 3s infinite;}
.dd-active-header{display:flex;align-items:center;gap:14px;margin-bottom:24px;}
.dd-active-icon{width:48px;height:48px;border-radius:14px;background:rgba(37,99,235,.2);display:flex;align-items:center;justify-content:center;color:#60a5fa;}
.dd-active-title{font-size:1.1rem;font-weight:800;margin:0;color:#fff;}
.dd-active-sub{font-size:.8rem;color:#64748b;margin:2px 0 0;}

.dd-timer-container{text-align:center;padding:20px 0;margin-bottom:20px;}
.dd-timer{display:inline-flex;align-items:center;gap:4px;}
.dd-timer-digit{background:rgba(37,99,235,.2);color:#60a5fa;font-size:2.5rem;font-weight:900;padding:8px 16px;border-radius:12px;font-variant-numeric:tabular-nums;min-width:65px;text-align:center;font-family:'JetBrains Mono',monospace;}
.dd-timer-sep{color:#64748b;font-size:2rem;font-weight:300;margin:0 2px;}
.dd-timer-label{color:#64748b;font-size:.75rem;font-weight:600;margin-top:10px;text-transform:uppercase;letter-spacing:.08em;}

.dd-task-info{display:flex;flex-direction:column;gap:8px;padding:16px;background:rgba(255,255,255,.04);border-radius:12px;margin-bottom:20px;}
.dd-info-row{display:flex;justify-content:space-between;align-items:center;}
.dd-info-label{color:#64748b;font-size:.8rem;font-weight:500;}
.dd-info-value{color:#e2e8f0;font-size:.85rem;font-weight:600;}

.dd-finish-btn{width:100%;padding:14px;background:#22c55e;color:#fff;border:none;border-radius:12px;font-weight:700;font-size:.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s;box-shadow:0 4px 14px rgba(34,197,94,.3);}
.dd-finish-btn:hover{background:#16a34a;transform:translateY(-1px);}

.dd-empty-active{text-align:center;padding:48px;background:rgba(255,255,255,.03);border:1px dashed rgba(255,255,255,.1);border-radius:20px;}

.dd-section{display:flex;flex-direction:column;gap:12px;}
.dd-section-title{display:flex;align-items:center;gap:8px;font-size:1rem;font-weight:700;color:#e2e8f0;margin:0;}

.dd-task-list{display:flex;flex-direction:column;gap:10px;}
.dd-task-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px;transition:all .15s;}
.dd-task-card:hover{background:rgba(255,255,255,.08);}
.dd-task-done{opacity:.7;}
.dd-task-card-info{display:flex;justify-content:space-between;align-items:flex-start;}
.dd-task-card-id{font-size:.75rem;color:#64748b;font-weight:600;margin:0 0 2px;}
.dd-task-card-title{font-size:.9rem;font-weight:700;color:#e2e8f0;margin:0 0 2px;}
.dd-task-card-customer{font-size:.78rem;color:#64748b;margin:0;}

.dd-badge-assigned{padding:4px 10px;background:rgba(245,158,11,.15);color:#fbbf24;font-size:.68rem;font-weight:700;border-radius:6px;display:flex;align-items:center;gap:4px;}
.dd-badge-done{padding:4px 10px;background:rgba(34,197,94,.15);color:#4ade80;font-size:.68rem;font-weight:700;border-radius:6px;display:flex;align-items:center;gap:4px;}

.dd-start-btn{width:100%;margin-top:12px;padding:10px;background:#2563eb;color:#fff;border:none;border-radius:10px;font-weight:700;font-size:.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s;box-shadow:0 4px 14px rgba(37,99,235,.3);}
.dd-start-btn:hover{background:#1d4ed8;transform:translateY(-1px);}
`;
