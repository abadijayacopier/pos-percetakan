import { useState, useEffect } from 'react';
import api from '../services/api';
import db from '../db';
import { useAuth } from '../contexts/AuthContext';
import { FiLink, FiFileText, FiX, FiPaperclip } from 'react-icons/fi';

export default function ProductionQueuePage({ onNavigate }) {
    const { user } = useAuth();
    const [autoAssign, setAutoAssign] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [techStats, setTechStats] = useState({
        tech1: { name: 'Andi Pratama', count: 0, status: 'emerald' },
        tech2: { name: 'Siti Aminah', count: 0, status: 'amber' },
        tech3: { name: 'Bambang K.', count: 0, status: 'rose' }
    });
    const [viewDesignModal, setViewDesignModal] = useState(null);
    const [activeTab, setActiveTab] = useState('Semua');

    const loadProductionData = async () => {
        let assignments = [];
        let spkTasks = [];
        try {
            const { data } = await api.get('/designers/assignments');
            assignments = data;

            // Fetch Offset SPKs
            const { data: spkRes } = await api.get('/spk');
            spkTasks = (spkRes.data || []).map(s => ({
                id: s.spk_number,
                real_id: s.id, // for API calls
                status: s.status === 'Menunggu Antrian' ? 'produksi' :
                    s.status === 'Proses Cetak' ? 'cetak' :
                        s.status === 'Finishing' ? 'finishing' :
                            s.status === 'QC' ? 'qc' :
                                s.status === 'Selesai' ? 'selesai' : 'produksi',
                customerName: s.customer_name,
                title: s.product_name,
                priority: s.priority?.toLowerCase(),
                technician_name: s.assigned_name,
                type: 'offset',
                updatedAt: s.updated_at
            }));
        } catch (err) {
            console.error('Failed to fetch production data:', err);
        }

        const allTasks = db.getAll('dp_tasks');
        // Filter for production-ready tasks from LocalStorage (Digital)
        // Note: ditugaskan/menunggu_desain are translated to 'produksi' (Menunggu) for the Kanban board
        const prodTasks = allTasks.filter(t => !['checkout', 'batal'].includes(t.status))
            .map(t => ({
                ...t,
                type: t.type || 'digital',
                status: ['menunggu_desain', 'desain', 'ditugaskan', 'produksi'].includes(t.status) ? 'produksi' : t.status
            }));

        // Combine both sources
        const combinedTasks = [...prodTasks, ...spkTasks];

        // Map assignment data to tasks (primarily for design links in digital)
        const enrichedTasks = combinedTasks.map(t => {
            const assignment = assignments.find(a => a.task_id === t.id && a.status === 'selesai');
            return { ...t, designData: assignment };
        });

        setTasks(enrichedTasks);

        // Update Tech Stats based on combined tasks
        const newStats = {
            tech1: { name: 'Andi Pratama', count: 0, status: 'emerald' },
            tech2: { name: 'Siti Aminah', count: 0, status: 'amber' },
            tech3: { name: 'Bambang K.', count: 0, status: 'rose' }
        };
        combinedTasks.forEach(t => {
            if (t.technician_id && newStats[t.technician_id]) {
                newStats[t.technician_id].count++;
            }
        });
        // Update status colors
        Object.keys(newStats).forEach(id => {
            const c = newStats[id].count;
            newStats[id].status = c > 7 ? 'rose' : c > 4 ? 'amber' : 'emerald';
        });
        setTechStats(newStats);
    };

    useEffect(() => {
        loadProductionData();
    }, []);

    const moveTask = (taskId, newStatus) => {
        db.update('dp_tasks', taskId, {
            status: newStatus,
            updatedAt: new Date().toISOString()
        });
        db.logActivity(user?.name, 'Update Status Produksi', `Memindah pesanan #${taskId} ke tahap ${newStatus}`);
        loadProductionData();
    };

    const getTasksByStatus = (status) => {
        return tasks.filter(t => {
            const matchesStatus = t.status === status;
            const matchesTab = activeTab === 'Semua' || t.type?.toLowerCase() === activeTab.toLowerCase();
            return matchesStatus && matchesTab;
        });
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* Page specific sub-header (since Layout provides main header) */}
            <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 shrink-0">
                <div className="flex items-center gap-4 sm:gap-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white shrink-0 hidden sm:block">Antrean & Monitoring</h2>

                    <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Auto-Assign Teknisi</span>
                        <div
                            className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in cursor-pointer"
                            onClick={() => setAutoAssign(!autoAssign)}
                        >
                            <input
                                type="checkbox"
                                name="toggle"
                                id="toggle"
                                checked={autoAssign}
                                readOnly
                                className={`absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer ${autoAssign ? 'right-0 border-[#137fec] bg-[#137fec]' : 'right-5 border-slate-300 bg-slate-100'}`}
                            />
                            <label
                                htmlFor="toggle"
                                className={`block overflow-hidden h-5 rounded-full cursor-pointer ${autoAssign ? 'bg-[#137fec]/20' : 'bg-slate-300'}`}
                            ></label>
                        </div>
                        <span className={`flex items-center size-5 ${autoAssign ? 'bg-emerald-500' : 'bg-slate-400'} rounded-full text-white justify-center transition-colors`} title={autoAssign ? "Sistem Otomatis Aktif" : "Sistem Otomatis Nonaktif"}>
                            <span className="material-symbols-outlined text-[12px] font-bold">bolt</span>
                        </span>
                    </div>

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

                    <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-slate-400 text-lg mr-2">search</span>
                        <input className="bg-transparent border-none focus:ring-0 text-sm w-48 p-0 text-slate-900 dark:text-white" placeholder="Cari SPK..." type="text" />
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button className="bg-[#137fec] hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20">
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span className="hidden sm:inline">SPK Baru</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">

                {/* Workload Section */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                    <div className="xl:col-span-3 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#137fec] text-lg">engineering</span>
                                Beban Kerja Teknisi (Workload)
                            </h3>
                            <span className="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Beban terendah diutamakan</span>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {Object.entries(techStats).map(([id, tech]) => (
                                <div key={id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 pr-4 rounded-xl border border-slate-100 dark:border-slate-700 group hover:border-[#137fec]/30 transition-colors cursor-move flex-1 min-w-[180px]">
                                    <div className="relative">
                                        <div className={`size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 text-xs border-2 border-transparent group-hover:border-[#137fec]/20 transition-all`}>
                                            {tech.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <span className={`absolute -bottom-1 -right-1 size-4 bg-${tech.status === 'emerald' ? 'emerald' : tech.status === 'amber' ? 'amber' : 'rose'}-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm`}></span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{tech.name}</p>
                                        <p className="text-[10px] text-slate-500 font-bold">{tech.count} tugas aktif</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Smart Assignment Info Box */}
                    {autoAssign ? (
                        <div className="bg-[#137fec]/5 dark:bg-[#137fec]/10 border-2 border-dashed border-[#137fec]/20 p-5 rounded-xl flex flex-col justify-center items-center text-center">
                            <span className="material-symbols-outlined text-[#137fec] text-3xl mb-2 animate-pulse">auto_awesome</span>
                            <p className="text-xs font-bold text-[#137fec] leading-tight">Sistem Penugasan Pintar</p>
                            <p className="text-[10px] text-[#137fec]/70 mt-1">Tugas baru akan otomatis diberikan ke <strong>Andi</strong> (Beban terendah)</p>
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 p-5 rounded-xl flex flex-col justify-center items-center text-center opacity-60">
                            <span className="material-symbols-outlined text-slate-400 text-3xl mb-2">person_off</span>
                            <p className="text-xs font-bold text-slate-500 leading-tight">Sistem Manual</p>
                            <p className="text-[10px] text-slate-400 mt-1">Anda harus memilih teknisi secara manual untuk setiap tugas baru</p>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                            <button
                                onClick={() => setActiveTab('Semua')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'Semua' ? 'bg-[#137fec] text-white shadow-md shadow-[#137fec]/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >Semua</button>
                            <button
                                onClick={() => setActiveTab('Digital')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'Digital' ? 'bg-[#137fec] text-white shadow-md shadow-[#137fec]/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >Digital</button>
                            <button
                                onClick={() => setActiveTab('Offset')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'Offset' ? 'bg-[#137fec] text-white shadow-md shadow-[#137fec]/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >Offset</button>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:border-slate-700 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                            <select className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:ring-[#137fec] focus:border-[#137fec] py-1.5 pl-3 pr-8 shadow-sm">
                                <option>Status: Semua</option>
                                <option>Urgent</option>
                                <option>Normal</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">Urutkan:</span>
                        <button className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm hover:border-[#137fec]/50 transition-colors">
                            Deadline Terdekat
                            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                        </button>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="flex gap-4 sm:gap-6 overflow-x-auto overflow-y-hidden pb-6 w-full custom-scrollbar" style={{ minHeight: '600px' }}>

                    {/* Dynamic Columns */}
                    {[
                        { id: 'produksi', label: 'Menunggu', color: 'slate' },
                        { id: 'cetak', label: 'Proses Cetak', color: 'blue' },
                        { id: 'finishing', label: 'Finishing', color: 'orange' },
                        { id: 'qc', label: 'QC', color: 'amber' },
                        { id: 'selesai', label: 'Selesai', color: 'emerald' }
                    ].map(col => (
                        <div
                            key={col.id}
                            className="flex flex-col gap-4 min-w-[300px] w-[300px] shrink-0 pb-10 transition-colors duration-200"
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('bg-slate-50', 'dark:bg-slate-800/30', 'rounded-xl');
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('bg-slate-50', 'dark:bg-slate-800/30', 'rounded-xl');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('bg-slate-50', 'dark:bg-slate-800/30', 'rounded-xl');
                                const taskId = e.dataTransfer.getData('taskId');
                                if (taskId) {
                                    moveTask(taskId, col.id);
                                }
                            }}
                        >
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <span className={`size-2 bg-${col.color}-400 rounded-full`}></span>
                                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        {col.label} ({getTasksByStatus(col.id).length})
                                    </h3>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-4">
                                {getTasksByStatus(col.id).map(task => (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('taskId', task.id);
                                            e.currentTarget.style.opacity = '0.5';
                                        }}
                                        onDragEnd={(e) => {
                                            e.currentTarget.style.opacity = '1';
                                        }}
                                        className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group relative"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-bold">{task.id}</span>
                                            {task.priority === 'ekspres' && <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">Ekspres</span>}
                                        </div>
                                        <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white leading-tight">{task.title}</h4>
                                        <p className="text-xs text-slate-500 mb-3 font-medium">Pelanggan: {task.customerName}</p>

                                        {task.designData && (
                                            <button
                                                onClick={() => setViewDesignModal(task)}
                                                className="w-full flex items-center justify-center gap-2 py-2 mb-3 bg-blue-50 hover:bg-blue-100 text-[#137fec] text-xs font-bold rounded-lg transition-colors border border-blue-100"
                                            >
                                                <FiPaperclip size={14} /> Lihat File & Catatan Desain
                                            </button>
                                        )}

                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50 dark:border-slate-800/50">
                                            <div className="flex items-center text-slate-400 gap-1">
                                                <span className="material-symbols-outlined text-sm">schedule</span>
                                                <span className="text-[10px] font-bold uppercase">H-0</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Status Mover (Next) */}
                                                {col.id !== 'selesai' && (
                                                    <button
                                                        onClick={() => {
                                                            const statuses = ['produksi', 'cetak', 'finishing', 'qc', 'selesai'];
                                                            const nextIdx = statuses.indexOf(col.id) + 1;
                                                            moveTask(task.id, statuses[nextIdx]);
                                                        }}
                                                        className="size-8 rounded-full bg-blue-50 text-[#137fec] flex items-center justify-center hover:bg-[#137fec] hover:text-white transition-all"
                                                        title="Lanjutkan ke tahap berikutnya"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                                    </button>
                                                )}
                                                <div className="size-8 rounded-full border-2 border-slate-100 bg-slate-200 overflow-hidden flex items-center justify-center text-[10px] font-bold" title={`Teknisi: ${task.technician_name || 'Unassigned'}`}>
                                                    {task.technician_name ? task.technician_name.substring(0, 2).toUpperCase() : '?'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Drop Zone Placeholder for empty/drag target */}
                                <div
                                    className="bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 opacity-40 hover:opacity-100 transition-opacity"
                                >
                                    <span className="material-symbols-outlined text-2xl">add</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Design Modal */}
            {viewDesignModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setViewDesignModal(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800" style={{ animation: 'fadeIn .2s ease-out' }}>
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">File & Catatan Desain</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Pesanan #{viewDesignModal.id}</p>
                            </div>
                            <button className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors" onClick={() => setViewDesignModal(null)}>
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Admin Notes */}
                            {viewDesignModal.pesan_desainer && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><FiFileText /> Instruksi Awal (Kasir)</h4>
                                    <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 p-4 rounded-r-lg">
                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200 italic">"{viewDesignModal.pesan_desainer}"</p>
                                    </div>
                                </div>
                            )}

                            {/* Designer Notes */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><FiFileText /> Catatan dari Desainer</h4>
                                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                        {viewDesignModal.designData.catatan || <span className="text-slate-400 italic">Tidak ada catatan tambahan.</span>}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-2 font-medium">— Dikerjakan oleh: {viewDesignModal.designData.designer_name}</p>
                                </div>
                            </div>

                            {/* Attachments */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><FiLink /> Lampiran File</h4>
                                {viewDesignModal.designData.file_hasil_desain ? (
                                    <a
                                        href={viewDesignModal.designData.file_hasil_desain.startsWith('http') ? viewDesignModal.designData.file_hasil_desain : `https://${viewDesignModal.designData.file_hasil_desain}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between w-full p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="size-10 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-[#137fec] shrink-0">
                                                <FiLink size={18} />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-sm font-bold text-[#137fec] dark:text-blue-400 truncate w-full">Buka Link File Desain</p>
                                                <p className="text-[10px] text-blue-400/80 dark:text-blue-500 truncate w-full">{viewDesignModal.designData.file_hasil_desain}</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-[#137fec] opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">arrow_forward</span>
                                    </a>
                                ) : (
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 border-dashed rounded-xl">
                                        <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                            <FiPaperclip size={18} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-500">Tidak ada file dilampirkan</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                /* Add keyframes for progress bar shimmer */
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
