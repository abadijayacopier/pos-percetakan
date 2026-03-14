import { useState, useEffect } from 'react';
import api from '../services/api';
import db from '../db';
import { useAuth } from '../contexts/AuthContext';
import { FiLink, FiFileText, FiX, FiPaperclip, FiTool, FiPlus, FiSearch, FiZap, FiUser, FiArrowRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

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

            const { data: spkRes } = await api.get('/spk');
            spkTasks = (spkRes.data || []).map(s => ({
                id: s.spk_number,
                real_id: s.id,
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
        const prodTasks = allTasks.filter(t => !['checkout', 'batal'].includes(t.status))
            .map(t => ({
                ...t,
                type: t.type || 'digital',
                status: ['menunggu_desain', 'desain', 'ditugaskan', 'produksi'].includes(t.status) ? 'produksi' : t.status
            }));

        const combinedTasks = [...prodTasks, ...spkTasks];

        const enrichedTasks = combinedTasks.map(t => {
            const assignment = assignments.find(a => a.task_id === t.id && a.status === 'selesai');
            return { ...t, designData: assignment };
        });

        setTasks(enrichedTasks);

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
        <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden relative">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse" />

            <header className="h-20 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 shrink-0 z-10">
                <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black italic tracking-tighter uppercase text-white">Production <span className="text-blue-500">Terminal</span></h2>
                        <p className="text-[10px] font-black italic tracking-[0.3em] text-slate-500 uppercase">Antrean & Monitoring Protocol v4.0</p>
                    </div>

                    <div className="h-8 w-px bg-white/5 hidden md:block" />

                    <div className="flex items-center gap-4 bg-slate-950/50 px-4 py-2 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest">Protocol Auto-Assign</span>
                        <div
                            className="relative inline-block w-12 h-6 align-middle select-none transition duration-500 ease-in cursor-pointer"
                            onClick={() => setAutoAssign(!autoAssign)}
                        >
                            <div className={`block w-full h-full rounded-full border border-white/10 transition-colors duration-500 ${autoAssign ? 'bg-blue-600' : 'bg-slate-800'}`}></div>
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-xl transition-all duration-500 ease-out ${autoAssign ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                        <FiZap className={autoAssign ? 'text-blue-500' : 'text-slate-600'} />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center bg-slate-950/80 px-4 py-2 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                        <FiSearch className="text-slate-500" />
                        <input className="bg-transparent border-none focus:ring-0 text-xs font-black italic uppercase tracking-widest w-48 p-0 ml-3 text-white placeholder:text-slate-700" placeholder="Search Master SPK..." type="text" />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black italic uppercase tracking-[0.2em] flex items-center gap-2 shadow-2xl shadow-blue-500/20"
                    >
                        <FiPlus size={14} /> New Production SPK
                    </motion.button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="xl:col-span-3 bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                                <FiTool className="text-blue-500" /> Technician Workload Distribution
                            </h3>
                            <span className="text-[9px] text-slate-400 font-black italic bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">Optimized Routing Alpha</span>
                        </div>

                        <div className="flex flex-wrap gap-6">
                            {Object.entries(techStats).map(([id, tech]) => (
                                <motion.div
                                    key={id}
                                    whileHover={{ y: -5 }}
                                    className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-[1.8rem] border border-white/5 group hover:border-blue-500/30 transition-all cursor-crosshair flex-1 min-w-[220px]"
                                >
                                    <div className="relative">
                                        <div className="size-12 rounded-[1rem] bg-slate-900 border border-white/10 flex items-center justify-center font-black italic text-blue-500 text-sm">
                                            {tech.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className={`absolute -top-1 -right-1 size-3 rounded-full border-2 border-slate-950 ${tech.status === 'emerald' ? 'bg-emerald-500' : tech.status === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-black italic tracking-tight text-white uppercase truncate">{tech.name}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-[9px] text-slate-500 font-black italic uppercase tracking-widest">{tech.count} Active Protocols</p>
                                            <span className={`text-[9px] font-black italic ${tech.status === 'emerald' ? 'text-emerald-500' : tech.status === 'amber' ? 'text-amber-500' : 'text-rose-500'}`}>
                                                {tech.status === 'emerald' ? 'READY' : tech.status === 'amber' ? 'BUSY' : 'CRITICAL'}
                                            </span>
                                        </div>
                                        <div className="w-full h-1 bg-slate-900 rounded-full mt-2 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(tech.count / 10) * 100}%` }}
                                                className={`h-full ${tech.status === 'emerald' ? 'bg-emerald-500' : tech.status === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-6 rounded-[2.5rem] flex flex-col justify-center items-center text-center relative overflow-hidden transition-all duration-700 ${autoAssign ? 'bg-blue-600/10 border border-blue-500/20' : 'bg-slate-900 border border-white/5'}`}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={autoAssign ? 'auto' : 'manual'}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex flex-col items-center"
                            >
                                <div className={`size-16 rounded-[2rem] flex items-center justify-center mb-4 ${autoAssign ? 'bg-blue-600/20 text-blue-500' : 'bg-slate-800 text-slate-500'}`}>
                                    <FiZap size={32} className={autoAssign ? 'animate-pulse' : ''} />
                                </div>
                                <p className="text-[11px] font-black italic text-white uppercase tracking-[0.2em] mb-1 leading-none">{autoAssign ? 'INTELLIGENT ROUTING' : 'MANUAL OVERRIDE'}</p>
                                <p className="text-[9px] font-black italic text-slate-500 uppercase tracking-widest max-w-[140px]">
                                    {autoAssign ? 'AI Distribution active. Task mapped to Andi P.' : 'Manual task allocation protocol engaged.'}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4 bg-slate-900/30 p-1.5 rounded-[1.8rem] border border-white/5 backdrop-blur-sm">
                        {['Semua', 'Digital', 'Offset'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 text-[10px] font-black italic uppercase tracking-[0.2em] rounded-[1.2rem] transition-all duration-500 ${activeTab === tab ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {tab} Source
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <select className="bg-slate-900 text-slate-300 border border-white/10 rounded-2xl text-[9px] font-black italic uppercase tracking-widest focus:ring-blue-500/30 focus:border-blue-500/50 py-2.5 px-6 appearance-none text-center min-w-[180px]">
                            <option>URGENCY: ALL PROTOCOLS</option>
                            <option>PRIORITY: EKSPRES ONLY</option>
                            <option>STATUS: NORMAL</option>
                        </select>
                        <button className="flex items-center gap-3 text-[9px] font-black italic text-slate-500 uppercase tracking-[0.2em] bg-slate-900 px-6 py-2.5 border border-white/10 rounded-2xl hover:border-blue-500/30 transition-all">
                            Ascending Deadline
                            <FiArrowRight />
                        </button>
                    </div>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-12 hide-scrollbar min-h-[700px]">
                    {[
                        { id: 'produksi', label: 'MENUNGGU', color: 'slate' },
                        { id: 'cetak', label: 'PROCESS', color: 'blue' },
                        { id: 'finishing', label: 'FINISHING', color: 'orange' },
                        { id: 'qc', label: 'VAL_QC', color: 'amber' },
                        { id: 'selesai', label: 'SYNCED', color: 'emerald' }
                    ].map(col => (
                        <div
                            key={col.id}
                            className="flex flex-col gap-6 min-w-[320px] w-[320px] shrink-0 transition-all duration-500 p-4 rounded-[3rem] bg-slate-900/20 border border-transparent hover:bg-slate-900/40 hover:border-white/5"
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('bg-blue-600/5', 'border-blue-500/20');
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('bg-blue-600/5', 'border-blue-500/20');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('bg-blue-600/5', 'border-blue-500/20');
                                const taskId = e.dataTransfer.getData('taskId');
                                if (taskId) moveTask(taskId, col.id);
                            }}
                        >
                            <div className="flex items-center justify-between px-4">
                                <div className="flex items-center gap-3">
                                    <div className={`size-3 rounded-full ${col.id === 'produksi' ? 'bg-slate-600' :
                                        col.id === 'cetak' ? 'bg-blue-500' :
                                            col.id === 'finishing' ? 'bg-orange-500' :
                                                col.id === 'qc' ? 'bg-amber-500' : 'bg-emerald-500'
                                        } shadow-[0_0_15px_rgba(0,0,0,0.5)]`} />
                                    <h3 className="font-black italic text-[10px] text-white uppercase tracking-[0.4em]">
                                        {col.label} <span className="text-slate-600">[{getTasksByStatus(col.id).length}]</span>
                                    </h3>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-4 overflow-y-auto hide-scrollbar">
                                <AnimatePresence>
                                    {getTasksByStatus(col.id).map((task, index) => (
                                        <motion.div
                                            key={task.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.05 }}
                                            draggable
                                            onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                                            className="bg-slate-900/80 p-5 rounded-[2.2rem] border border-white/5 hover:border-blue-500/30 transition-all cursor-grab active:cursor-grabbing group relative shadow-xl shadow-black/20"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-[9px] font-black italic bg-slate-950 text-slate-500 px-3 py-1 rounded-full border border-white/5 uppercase tracking-widest">{task.id}</span>
                                                {task.priority === 'ekspres' && (
                                                    <div className="flex items-center gap-1 bg-rose-500/10 text-rose-500 text-[9px] font-black italic px-3 py-1 rounded-full uppercase tracking-tighter border border-rose-500/20 animate-pulse">
                                                        <FiZap size={10} /> PRIORITY_HIGH
                                                    </div>
                                                )}
                                            </div>

                                            <h4 className="font-black italic text-sm mb-1 text-white leading-tight uppercase tracking-tight">{task.title}</h4>
                                            <p className="text-[10px] text-slate-500 mb-4 font-black italic uppercase tracking-widest">Client: {task.customerName}</p>

                                            {task.designData && (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setViewDesignModal(task)}
                                                    className="w-full flex items-center justify-center gap-3 py-3 mb-4 bg-slate-950/80 hover:bg-blue-600/10 text-blue-500 text-[9px] font-black italic rounded-2xl transition-all border border-blue-500/20 uppercase tracking-[0.2em]"
                                                >
                                                    <FiPaperclip size={14} /> Open Design Registry
                                                </motion.button>
                                            )}

                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                                <div className="flex items-center text-slate-600 gap-2">
                                                    <FiClock size={12} className="text-slate-700" />
                                                    <span className="text-[9px] font-black italic text-slate-500 uppercase tracking-[0.2em]">DAY_0</span>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {col.id !== 'selesai' && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.1, x: 2 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => {
                                                                const statuses = ['produksi', 'cetak', 'finishing', 'qc', 'selesai'];
                                                                const nextIdx = statuses.indexOf(col.id) + 1;
                                                                moveTask(task.id, statuses[nextIdx]);
                                                            }}
                                                            className="size-10 rounded-[1.2rem] bg-blue-600/10 text-blue-500 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20"
                                                        >
                                                            <FiArrowRight size={18} />
                                                        </motion.button>
                                                    )}
                                                    <div className="size-10 rounded-[1.2rem] bg-slate-950 border border-white/5 flex items-center justify-center text-[10px] font-black italic text-slate-400 group-hover:text-blue-500 transition-colors" title={`OP: ${task.technician_name || 'NULL'}`}>
                                                        {task.technician_name ? task.technician_name.substring(0, 2).toUpperCase() : '??'}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                <div className="bg-white/3 p-8 rounded-[2.5rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-slate-700 opacity-30 hover:opacity-100 hover:bg-blue-600/5 hover:border-blue-500/20 group transition-all duration-700">
                                    <FiPlus size={24} className="group-hover:text-blue-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {viewDesignModal && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-6" onClick={(e) => e.target === e.currentTarget && setViewDesignModal(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-slate-900 rounded-[3rem] w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl -mr-24 -mt-24" />

                            <div className="flex items-center justify-between p-8 border-b border-white/5">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic mb-1">Design Registry Access</h3>
                                    <p className="text-2xl font-black italic tracking-tighter text-white uppercase">Terminal Protocol #{viewDesignModal.id}</p>
                                </div>
                                <button className="size-12 bg-slate-950 text-slate-400 hover:text-white rounded-[1.2rem] flex items-center justify-center border border-white/5 transition-all" onClick={() => setViewDesignModal(null)}>
                                    <FiX size={24} />
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                {viewDesignModal.pesan_desainer && (
                                    <div className="space-y-3">
                                        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3 italic"><FiFileText className="text-amber-500" /> Cashier Directive</h4>
                                        <div className="bg-amber-500/5 border-l-4 border-amber-500 p-6 rounded-[1.5rem] bg-slate-950/50">
                                            <p className="text-sm font-black italic text-amber-200 tracking-tight leading-relaxed">"{viewDesignModal.pesan_desainer}"</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3 italic"><FiUser className="text-blue-500" /> Designer Protocol Logs</h4>
                                    <div className="bg-slate-950 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
                                        <p className="text-sm font-black italic text-slate-300 leading-relaxed uppercase tracking-tight">
                                            {viewDesignModal.designData.catatan || <span className="text-slate-700">No telemetry log provided by operator.</span>}
                                        </p>
                                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                                            <div className="size-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 font-black italic text-[9px]">DS</div>
                                            <p className="text-[9px] font-black italic text-slate-500 uppercase tracking-widest">Operator: {viewDesignModal.designData.designer_name}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3 italic"><FiLink className="text-emerald-500" /> Digital Asset Link</h4>
                                    {viewDesignModal.designData.file_hasil_desain ? (
                                        <a
                                            href={viewDesignModal.designData.file_hasil_desain.startsWith('http') ? viewDesignModal.designData.file_hasil_desain : `https://${viewDesignModal.designData.file_hasil_desain}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between w-full p-6 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] transition-all group"
                                        >
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="size-12 rounded-[1.2rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                                    <FiLink size={20} />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-[11px] font-black italic text-emerald-500 uppercase tracking-[0.2em] truncate">Download Terminal Asset</p>
                                                    <p className="text-[9px] text-emerald-500/60 font-black italic tracking-widest truncate">{viewDesignModal.designData.file_hasil_desain}</p>
                                                </div>
                                            </div>
                                            <FiArrowRight size={20} className="text-emerald-500 group-hover:translate-x-2 transition-transform" />
                                        </a>
                                    ) : (
                                        <div className="flex items-center gap-4 p-6 bg-slate-950 border border-white/5 border-dashed rounded-[2rem]">
                                            <div className="size-12 rounded-[1.2rem] bg-slate-900 flex items-center justify-center text-slate-700">
                                                <FiPaperclip size={20} />
                                            </div>
                                            <p className="text-[9px] font-black italic text-slate-600 uppercase tracking-widest">No assets linked to this protocol</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
