import { useState, useEffect } from 'react';
import api from '../services/api';
import db from '../db';
import { useAuth } from '../contexts/AuthContext';
import { FiLink, FiFileText, FiX, FiPaperclip, FiCpu, FiPlus, FiSearch, FiZap, FiUser, FiArrowRight, FiClock, FiActivity, FiLayers } from 'react-icons/fi';
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
        <div className="p-4 sm:p-8 flex flex-col min-h-screen bg-slate-50/30 dark:bg-transparent font-display text-slate-900 dark:text-slate-100">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-500/20">
                            <FiActivity className="text-2xl" />
                        </div>
                        Antrean Produksi
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 ml-1 italic opacity-75 underline decoration-blue-500/30 underline-offset-4">Production & Workload Management</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${autoAssign ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Auto Assign</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {autoAssign ? 'Aktif' : 'Non-aktif'}
                            </span>
                        </div>
                        <button
                            onClick={() => setAutoAssign(!autoAssign)}
                            className={`ml-4 w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${autoAssign ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${autoAssign ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="flex items-center bg-white dark:bg-slate-900 px-4 py-2 hover:py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group transition-all min-w-[240px]">
                        <FiSearch className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input className="bg-transparent border-none focus:ring-0 text-sm font-semibold w-full ml-3 text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="Cari SPK..." type="text" />
                    </div>
                </div>
            </div>

            {/* Technician Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden transition-all flex flex-col items-center justify-center text-center 
                    ${autoAssign ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}
                >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-md ${autoAssign ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                        <FiZap size={24} className={autoAssign ? 'animate-pulse' : ''} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{autoAssign ? 'INTELLIGENT ROUTING' : 'MANUAL MODE'}</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {autoAssign ? 'Distribusi tugas otomatis' : 'Alokasi ditentukan mandiri'}
                    </p>
                </div>

                {Object.entries(techStats).map(([id, tech]) => (
                    <div key={id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex flex-shrink-0 items-center justify-center font-black text-blue-600 text-sm uppercase ring-1 ring-slate-200 dark:ring-slate-700">
                                {tech.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 dark:text-white truncate">{tech.name}</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`w-2 h-2 rounded-full ${tech.status === 'emerald' ? 'bg-emerald-500' : tech.status === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        {tech.status === 'emerald' ? 'TERSEDIA' : tech.status === 'amber' ? 'SIBUK' : 'PADAT'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-none">{tech.count}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tugas Aktif</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (tech.count / 10) * 100)}%` }}
                                    className={`h-full ${tech.status === 'emerald' ? 'bg-emerald-500' : tech.status === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 mt-4">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto w-full md:w-auto">
                    {['Semua', 'Digital', 'Offset'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            Tipe: {tab}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <select className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-3 px-4 outline-none w-full sm:w-auto shadow-sm cursor-pointer appearance-none text-center">
                        <option>URUTAN: PRIORITAS (NORMAL)</option>
                        <option>PRIORITAS: EKSPRES SAJA</option>
                        <option>URUTAN: TENGGAT WAKTU</option>
                    </select>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex gap-6 overflow-x-auto pb-8 hide-scrollbar flex-1 items-start min-h-[500px]">
                {[
                    { id: 'produksi', label: 'MENUNGGU ANTRIAN', color: 'slate' },
                    { id: 'cetak', label: 'PROSES CETAK', color: 'blue' },
                    { id: 'finishing', label: 'FINISHING', color: 'orange' },
                    { id: 'qc', label: 'QUALITY CONTROL', color: 'amber' },
                    { id: 'selesai', label: 'SELESAI', color: 'emerald' }
                ].map(col => (
                    <div
                        key={col.id}
                        className="flex flex-col gap-4 min-w-[320px] w-[320px] shrink-0"
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('opacity-70', 'scale-[1.02]');
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.classList.remove('opacity-70', 'scale-[1.02]');
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('opacity-70', 'scale-[1.02]');
                            const taskId = e.dataTransfer.getData('taskId');
                            if (taskId) moveTask(taskId, col.id);
                        }}
                    >
                        {/* Column Header */}
                        <div className={`p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between
                            ${col.id === 'produksi' ? 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200' :
                                col.id === 'cetak' ? 'border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400' :
                                    col.id === 'finishing' ? 'border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400' :
                                        col.id === 'qc' ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400' :
                                            'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400'
                            }`}
                        >
                            <h3 className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${col.id === 'produksi' ? 'bg-slate-400' :
                                    col.id === 'cetak' ? 'bg-blue-500' :
                                        col.id === 'finishing' ? 'bg-orange-500' :
                                            col.id === 'qc' ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`} />
                                {col.label}
                            </h3>
                            <span className="text-xs font-bold py-0.5 px-2 rounded-full bg-white dark:bg-slate-800 shadow-sm">
                                {getTasksByStatus(col.id).length}
                            </span>
                        </div>

                        {/* Cards Container */}
                        <div className="flex flex-col gap-3 min-h-[150px] p-2 -mx-2 bg-slate-100/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/50">
                            <AnimatePresence>
                                {getTasksByStatus(col.id).map((task) => (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        draggable
                                        onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                                        className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-grab active:cursor-grabbing group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                                {task.id}
                                            </span>
                                            {task.priority === 'ekspres' && (
                                                <div className="flex items-center gap-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest animate-pulse">
                                                    <FiZap size={10} /> Express
                                                </div>
                                            )}
                                        </div>

                                        <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white leading-tight">{task.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium flex items-center gap-1.5"><FiUser size={12} /> {task.customerName}</p>

                                        {task.designData && (
                                            <button
                                                onClick={() => setViewDesignModal(task)}
                                                className="w-full flex items-center justify-center gap-2 py-2 mb-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl transition-all border border-slate-200 dark:border-slate-700"
                                            >
                                                <FiPaperclip size={14} /> Lihat File Desain
                                            </button>
                                        )}

                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center text-slate-400 dark:text-slate-500 gap-1.5">
                                                <FiClock size={12} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Hari ini</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400 ring-2 ring-white dark:ring-slate-900 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-colors" title={`Operator: ${task.technician_name || 'Belum Diatur'}`}>
                                                    {task.technician_name ? task.technician_name.substring(0, 2).toUpperCase() : '??'}
                                                </div>
                                                {col.id !== 'selesai' && (
                                                    <button
                                                        onClick={() => {
                                                            const statuses = ['produksi', 'cetak', 'finishing', 'qc', 'selesai'];
                                                            const nextIdx = statuses.indexOf(col.id) + 1;
                                                            moveTask(task.id, statuses[nextIdx]);
                                                        }}
                                                        className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 flex items-center justify-center hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white transition-all border border-blue-200 dark:border-blue-800/50 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                                                        title="Selesaikan tahap ini"
                                                    >
                                                        <FiArrowRight size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Detail Design */}
            <AnimatePresence>
                {viewDesignModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" onClick={(e) => e.target === e.currentTarget && setViewDesignModal(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data & File Desain</h3>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Pesanan #{viewDesignModal.id}</p>
                                </div>
                                <button className="w-10 h-10 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-full flex items-center justify-center transition-all" onClick={() => setViewDesignModal(null)}>
                                    <FiX size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto">
                                {viewDesignModal.pesan_desainer && (
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                            <FiFileText /> Pesan dari Kasir
                                        </h4>
                                        <div className="border-l-4 border-amber-500 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 text-sm text-amber-900 dark:text-amber-200 font-medium">
                                            "{viewDesignModal.pesan_desainer}"
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                        <FiUser /> Catatan Operator Desain
                                    </h4>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                            {viewDesignModal.designData.catatan || <span className="italic text-slate-400">Tidak ada catatan khusus dari desainer.</span>}
                                        </p>
                                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-[10px]">DS</div>
                                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Oleh: {viewDesignModal.designData.designer_name}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pb-4">
                                    <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                        <FiLink /> Link File Fix / Print-Ready
                                    </h4>
                                    {viewDesignModal.designData.file_hasil_desain ? (
                                        <a
                                            href={viewDesignModal.designData.file_hasil_desain.startsWith('http') ? viewDesignModal.designData.file_hasil_desain : `https://${viewDesignModal.designData.file_hasil_desain}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between w-full p-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl transition-all group"
                                        >
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                    <FiLink size={18} />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate">Buka File Desain</p>
                                                    <p className="text-[10px] text-emerald-600/70 font-mono mt-0.5 truncate">{viewDesignModal.designData.file_hasil_desain}</p>
                                                </div>
                                            </div>
                                            <FiArrowRight size={18} className="text-emerald-600 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </a>
                                    ) : (
                                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-dashed rounded-xl">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                                <FiPaperclip size={18} />
                                            </div>
                                            <p className="text-xs font-semibold text-slate-500">Tidak ada lampiran file siap cetak</p>
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
