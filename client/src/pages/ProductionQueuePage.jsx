import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import db from '../db';
import { useAuth } from '../contexts/AuthContext';
import { FiGrid, FiList, FiClock, FiCheckCircle, FiChevronRight, FiUser, FiZap, FiDownload, FiEdit2, FiTrash2, FiPrinter, FiX, FiCheck, FiArrowRight, FiLink, FiPaperclip, FiXCircle, FiAlertCircle, FiActivity, FiFileText, FiInfo, FiPlus, FiSearch, FiLayers } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className="fixed top-20 right-6 z-9999 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-5 py-4 rounded-2xl shadow-2xl shadow-blue-900/10 flex items-start gap-3 w-full max-w-sm animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="mt-0.5 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FiInfo size={16} />
            </div>
            <div>
                <h4 className="font-bold text-sm mb-0.5">Informasi Sistem</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs pr-4">{msg}</p>
            </div>
            <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-red-500 transition-colors">
                <FiX size={16} />
            </button>
        </div>
    );
}

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
    const [assignTaskModal, setAssignTaskModal] = useState(null);
    const [cancelTaskModal, setCancelTaskModal] = useState(null);
    const [cancelFee, setCancelFee] = useState(0);
    const [activeTab, setActiveTab] = useState('Semua');
    const [toastMsg, setToastMsg] = useState(null);

    const showToast = useCallback((msg, type = 'info') => setToastMsg({ msg, type }), []);

    const printCancelInvoice = (task, fee) => {
        const w = window.open('', '_blank', 'width=800,height=600');
        w.document.write("<html><head><title>INVOICE PEMBATALAN - " + task.id + "</title>");
        w.document.write("<style>");
        w.document.write("body { font-family: monospace; padding: 20px; color: #000; }");
        w.document.write("* { margin: 0; padding: 0; box-sizing: border-box; }");
        w.document.write("h2 { text-align: center; margin-bottom: 5px; font-size: 1.5em; }");
        w.document.write("p.subtitle { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px; }");
        w.document.write(".row { display: flex; justify-content: space-between; margin-bottom: 5px; }");
        w.document.write(".total { border-top: 2px dashed #000; padding-top: 10px; margin-top: 10px; font-weight: bold; font-size: 1.2em; }");
        w.document.write(".footer { text-align: center; margin-top: 30px; font-size: 0.9em; }");
        w.document.write("</style></head><body>");
        w.document.write("<h2>ABADI JAYA COPIER & OFFSET</h2>");
        w.document.write("<p class='subtitle'>NOTA PEMBATALAN PESANAN</p>");
        w.document.write("<div class='row'><span>No. Antrean:</span> <span>" + task.id + "</span></div>");
        w.document.write("<div class='row'><span>Pelanggan:</span> <span>" + task.customerName + "</span></div>");
        w.document.write("<div class='row'><span>Status Terakhir:</span> <span>" + task.status.toUpperCase() + "</span></div>");
        w.document.write("<div class='row'><span>Waktu Batal:</span> <span>" + new Date().toLocaleString('id-ID') + "</span></div><br/>");
        w.document.write("<div class='row' style='margin-bottom: 15px;'><span>Pesanan:</span> <span>" + task.title + "</span></div>");

        if (fee > 0) {
            w.document.write("<div class='row total'><span>BIAYA PEMBATALAN:</span><span>Rp " + fee.toLocaleString('id-ID') + "</span></div>");
        } else {
            w.document.write("<div class='row total'><span>BIAYA PEMBATALAN:</span><span>Rp 0 (GRATIS)</span></div>");
        }

        w.document.write("<div class='footer'><p>Mohon maaf atas ketidaknyamanannya.</p>");
        if (fee > 0) {
            w.document.write("<p>Biaya pembatalan dikenakan sesuai kebijakan material/desain yang telah berjalan.</p>");
        }
        w.document.write("</div></body></html>");
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); w.close(); }, 500);
    };

    const handleCancelTask = async () => {
        if (!cancelTaskModal) return;

        if (cancelTaskModal.type === 'offset') {
            // SPK cancellation is handled via Daftar SPK, so we don't proceed here.
            setCancelTaskModal(null);
            return;
        }

        const isAntrian = cancelTaskModal.status === 'produksi';
        const finalFee = isAntrian ? 0 : (cancelFee || 0);

        const idToUpdate = cancelTaskModal.real_id || cancelTaskModal.id;
        db.update('dp_tasks', idToUpdate, {
            status: 'batal',
            denda_batal: finalFee,
            updatedAt: new Date().toISOString()
        });

        db.logActivity(user?.name, 'Pembatalan Pesanan', "Pesanan #" + cancelTaskModal.id + " dibatalkan dengan denda Rp " + finalFee);

        printCancelInvoice(cancelTaskModal, finalFee);

        loadProductionData();
        setCancelTaskModal(null);
        setCancelFee(0);
    };

    const handleAssignTechnician = (taskId, techId, techName) => {
        db.update('dp_tasks', taskId, {
            technician_id: techId,
            technician_name: techName,
            updatedAt: new Date().toISOString()
        });
        db.logActivity(user?.name, 'Penugasan Operator', `Menugaskan teknisi ${techName} ke pesanan #${taskId}`);
        loadProductionData();
        setAssignTaskModal(null);
    };

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
            {toastMsg && <Toast {...toastMsg} onClose={() => setToastMsg(null)} />}
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
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex shrink-0 items-center justify-center font-black text-blue-600 text-sm uppercase ring-1 ring-slate-200 dark:ring-slate-700">
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
                        <option className="text-slate-900 dark:text-white">URUTAN: PRIORITAS (NORMAL)</option>
                        <option className="text-slate-900 dark:text-white">PRIORITAS: EKSPRES SAJA</option>
                        <option className="text-slate-900 dark:text-white">URUTAN: TENGGAT WAKTU</option>
                    </select>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex gap-6 overflow-x-auto pb-8 flex-1 items-start min-h-[500px] w-full snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {[
                    { id: 'produksi', label: 'MENUNGGU ANTRIAN', color: 'slate' },
                    { id: 'cetak', label: 'PROSES CETAK', color: 'blue' },
                    { id: 'finishing', label: 'FINISHING', color: 'orange' },
                    { id: 'qc', label: 'QUALITY CONTROL', color: 'amber' },
                    { id: 'selesai', label: 'SELESAI', color: 'emerald' }
                ].map(col => (
                    <div
                        key={col.id}
                        className="flex flex-col gap-4 min-w-[320px] w-[320px] shrink-0 snap-start"
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
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                                    {task.id}
                                                </span>
                                                {task.priority === 'ekspres' && (
                                                    <div className="flex items-center gap-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest animate-pulse">
                                                        <FiZap size={10} /> Express
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => { setCancelTaskModal(task); setCancelFee(0); }}
                                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-all"
                                                title="Batalkan Pesanan">
                                                <FiXCircle size={14} />
                                            </button>
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
                                                <button
                                                    onClick={() => {
                                                        if (task.type === 'offset') {
                                                            showToast('Fitur penugasan manual untuk Master SPK saat ini dikelola melalui menu Daftar SPK di panel admin.');
                                                            return;
                                                        }
                                                        setAssignTaskModal(task);
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400 ring-2 ring-white dark:ring-slate-900 focus:outline-none hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                    title={`Klik untuk ubah. Operator saat ini: ${task.technician_name || 'Belum Diatur'}`}
                                                >
                                                    {task.technician_name ? task.technician_name.substring(0, 2).toUpperCase() : '??'}
                                                </button>
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

            {/* Modal Assign Technician */}
            <AnimatePresence>
                {assignTaskModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6" onClick={(e) => e.target === e.currentTarget && setAssignTaskModal(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-4xl w-full max-w-md shadow-2xl shadow-blue-900/10 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 shrink-0 relative z-10">
                                <div>
                                    <div className="inline-flex items-center gap-2 mb-1.5">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Alokasi Operator</h3>
                                    </div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                        Pesanan <span className="text-blue-600 dark:text-blue-400 font-mono">#{assignTaskModal.id}</span>
                                    </p>
                                </div>
                                <button className="w-10 h-10 bg-slate-100/50 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500 rounded-full flex items-center justify-center transition-all shadow-sm border border-slate-200/50 dark:border-slate-700/50" onClick={() => setAssignTaskModal(null)}>
                                    <FiX size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-3 relative z-10 bg-slate-50/50 dark:bg-transparent">
                                {Object.entries(techStats).map(([id, tech]) => (
                                    <motion.button
                                        whileHover={{ scale: 1.01, x: 2 }}
                                        whileTap={{ scale: 0.98 }}
                                        key={id}
                                        onClick={() => handleAssignTechnician(assignTaskModal.real_id || assignTaskModal.id, id, tech.name)}
                                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-blue-50/50 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-600 rounded-2xl transition-all group shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center font-black text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-white dark:group-hover:bg-slate-800 text-sm shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                                                    {tech.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${tech.status === 'emerald' ? 'bg-emerald-500' : tech.status === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-[15px] text-slate-900 dark:text-white leading-none mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{tech.name}</p>
                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${tech.status === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' :
                                                        tech.status === 'amber' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' :
                                                            'bg-rose-50 text-rose-600 dark:bg-rose-900/30'
                                                        }`}>
                                                        {tech.status === 'emerald' ? 'TERSEDIA' : tech.status === 'amber' ? 'SIBUK' : 'PADAT'}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-slate-500">
                                                        • {tech.count} Antrean
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:bg-blue-500 group-hover:border-blue-500 group-hover:text-white dark:group-hover:bg-blue-600 text-slate-400 transition-all shadow-sm">
                                            <FiArrowRight />
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Cancel Task */}
            <AnimatePresence>
                {cancelTaskModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-2000 flex items-center justify-center p-4 sm:p-6" onClick={(e) => e.target === e.currentTarget && setCancelTaskModal(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl shadow-red-900/10 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative"
                        >
                            {cancelTaskModal.type === 'offset' ? (
                                <>
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                                    <div className="flex items-start justify-between p-6 pb-2 border-slate-100 dark:border-slate-800/60 shrink-0 relative z-10">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                                <FiAlertCircle size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none mt-1">Informasi Sistem</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Master SPK #{cancelTaskModal.id}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 pt-2 space-y-4 relative z-10 bg-transparent">
                                        <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/20 text-center">
                                            <p className="text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                                                Pembatalan untuk Master SPK saat ini dikelola melalui menu <b>Daftar SPK</b> di panel Admin.
                                            </p>
                                        </div>
                                        <div className="mt-6">
                                            <button
                                                onClick={() => setCancelTaskModal(null)}
                                                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl shadow-lg shadow-amber-500/20 transition-colors text-sm"
                                            >
                                                Tutup & Mengerti
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                                    <div className="flex items-start justify-between p-6 pb-2 border-slate-100 dark:border-slate-800/60 shrink-0 relative z-10">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                                <FiXCircle size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-widest leading-none mt-1">Batalkan Pesanan?</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">No. #{cancelTaskModal.id}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 pt-2 space-y-4 relative z-10 bg-transparent">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Beban Biaya Pembatalan (Denda)</p>
                                            {cancelTaskModal.status === 'produksi' ? (
                                                <>
                                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 mb-3 font-medium">Pesanan masih dalam <span className="font-bold">status antrian</span>, pembatalan tidak dikenakan biaya.</p>
                                                    <div className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-black font-mono text-emerald-600 dark:text-emerald-500 text-center">
                                                        Rp 0 (GRATIS)
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-[10px] text-slate-500 mt-1 mb-3">Pesanan yang sudah mulai <span className="font-bold text-slate-700 dark:text-slate-300">diproses / cetak</span> mungkin dikenakan biaya material.</p>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">Rp</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={cancelFee === 0 ? '' : cancelFee}
                                                            onChange={(e) => setCancelFee(parseInt(e.target.value) || 0)}
                                                            placeholder="0"
                                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 font-black font-mono text-slate-900 dark:text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 mt-6">
                                            <button
                                                onClick={() => setCancelTaskModal(null)}
                                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
                                            >
                                                Kembali
                                            </button>
                                            <button
                                                onClick={handleCancelTask}
                                                className="flex-[1.5] py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-lg shadow-red-500/20 transition-colors flex items-center justify-center gap-2 text-sm"
                                            >
                                                <FiPrinter size={16} /> Batal & Cetak
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
