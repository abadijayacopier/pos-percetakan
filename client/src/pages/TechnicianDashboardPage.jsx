import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiCpu, FiClock, FiCheckCircle, FiPlayCircle, FiList, 
    FiSettings, FiActivity, FiUser, FiBox, FiMessageSquare,
    FiAlertCircle, FiChevronLeft, FiChevronRight, FiSearch
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import { formatRupiah } from '../utils';

const pad = (n) => String(n).padStart(2, '0');
const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
           date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

export default function TechnicianDashboardPage({ onNavigate }) {
    const { user } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/service');
            // If user is technician, filter by their assigned tasks
            // If user is admin/owner, show all
            const userRole = (user?.role || '').toLowerCase();
            let filtered = data;
            if (userRole === 'teknisi') {
                filtered = data.filter(s => s.technicianId === user.id || !s.technicianId);
            }
            setServices(filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            console.error('Failed to fetch services:', err);
            setServices([]);
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.role]);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    const handleUpdateStatus = async (serviceId, newStatus) => {
        try {
            await api.put(`/service/${serviceId}`, { status: newStatus });
            Swal.fire({ icon: 'success', title: 'Status Diperbarui', timer: 1500, showConfirmButton: false });
            fetchServices();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal update status' });
        }
    };

    const stats = {
        total: services.length,
        pending: services.filter(s => s.status === 'approval' || s.status === 'pending').length,
        active: services.filter(s => s.status === 'pengerjaan').length,
        completed: services.filter(s => s.status === 'selesai').length
    };

    const displayServices = services.filter(s => {
        const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
        const matchesSearch = 
            (s.serviceNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.machineInfo || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const activeWork = services.filter(s => s.status === 'pengerjaan');
    const pendingQueue = services.filter(s => s.status === 'approval' || s.status === 'pending');

    return (
        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-950 min-h-screen pb-10">
            {/* Header */}
            <header className="px-6 py-6 md:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl">
                        <FiCpu />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase italic">Dashboard Teknisi</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user?.name || 'Teknisi'} • Monitoring Servis Mesin</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={fetchServices}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 transition-all border border-slate-200 dark:border-slate-700"
                    >
                        <FiActivity className={loading ? 'animate-spin' : ''} />
                    </button>
                    {(user?.role === 'admin' || user?.role === 'pemilik') && (
                        <button 
                            onClick={() => onNavigate('service')}
                            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            <FiSettings /> Kelola Semua Tiket
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Tiket', value: stats.total, icon: FiList, color: 'blue' },
                        { label: 'Menunggu', value: stats.pending, icon: FiClock, color: 'amber' },
                        { label: 'Proses Kerja', value: stats.active, icon: FiSettings, color: 'indigo' },
                        { label: 'Selesai', value: stats.completed, icon: FiCheckCircle, color: 'emerald' },
                    ].map((s, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-5"
                        >
                            <div className={`p-4 rounded-2xl bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600 dark:text-${s.color}-400`}>
                                <s.icon className="text-2xl" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-2 italic tracking-tighter">
                                    {String(s.value).padStart(2, '0')}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Active & Pending Work */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Active Tasks Section */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3 italic uppercase">
                                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                    Sedang Dikerjakan
                                </h3>
                                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800/50">
                                    {activeWork.length} Aktif
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {activeWork.map((srv, idx) => (
                                    <motion.div 
                                        key={srv.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/50 transition-all group"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="size-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                <FiSettings className="animate-spin-slow" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded tracking-widest">{srv.serviceNo}</span>
                                                    <span className="text-xs font-bold text-slate-400">{formatDate(srv.createdAt)}</span>
                                                </div>
                                                <h4 className="text-base font-bold text-slate-800 dark:text-white uppercase truncate">{srv.customerName}</h4>
                                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2"><FiBox /> {srv.machineInfo}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => handleUpdateStatus(srv.id, 'selesai')}
                                                className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                <FiCheckCircle /> Selesai
                                            </button>
                                            <button 
                                                onClick={() => onNavigate('service', { serviceId: srv.id })}
                                                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-700"
                                            >
                                                <FiMessageSquare />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                                {activeWork.length === 0 && (
                                    <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center gap-4">
                                        <div className="size-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300">
                                            <FiActivity size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Tidak ada servis yang sedang berjalan</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Pending Queue Section */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3 italic uppercase">
                                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                    Antrean Servis Baru
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {pendingQueue.map((srv, idx) => (
                                    <motion.div 
                                        key={srv.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-800/40 tracking-widest">{srv.serviceNo}</span>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase tracking-widest">
                                                <FiClock /> {srv.status === 'approval' ? 'Waiting' : 'Pending'}
                                            </div>
                                        </div>
                                        <h4 className="text-base font-bold text-slate-900 dark:text-white uppercase truncate mb-1">{srv.customerName}</h4>
                                        <p className="text-xs font-medium text-slate-500 mb-6 flex items-center gap-2"><FiBox /> {srv.machineInfo}</p>
                                        
                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-6">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Keluhan Kerusakan:</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-2 italic leading-relaxed">"{srv.complaint}"</p>
                                        </div>

                                        <button 
                                            onClick={() => handleUpdateStatus(srv.id, 'pengerjaan')}
                                            className="w-full py-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        >
                                            <FiPlayCircle size={18} /> Ambil Tugas Ini
                                        </button>
                                    </motion.div>
                                ))}
                                {pendingQueue.length === 0 && (
                                    <div className="col-span-full py-12 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                        Antrean kosong
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right: Monitoring & History */}
                    <aside className="lg:col-span-4 space-y-8">
                        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"><FiCheckCircle /></div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase italic tracking-tight">Riwayat Selesai</h3>
                            </div>
                            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                                {services.filter(s => s.status === 'selesai' || s.status === 'diambil').slice(0, 15).map((srv, idx) => (
                                    <div key={srv.id} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formatDate(srv.updatedAt || srv.createdAt)}</span>
                                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">DONE</span>
                                        </div>
                                        <h5 className="text-[11px] font-black text-slate-900 dark:text-white uppercase truncate">{srv.customerName}</h5>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1 truncate">{srv.machineInfo}</p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-blue-600 italic tracking-tighter">{formatRupiah(srv.totalCost)}</span>
                                            <div className="size-6 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[8px] text-slate-400">
                                                <FiUser />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {services.filter(s => s.status === 'selesai' || s.status === 'diambil').length === 0 && (
                                    <div className="py-20 text-center text-slate-300 dark:text-slate-700">
                                        <FiCheckCircle size={40} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Belum ada riwayat</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-blue-700 text-white relative overflow-hidden group shadow-xl shadow-blue-500/20">
                            <FiActivity className="absolute -bottom-10 -right-10 text-white/10 size-40 group-hover:scale-110 transition-transform duration-700" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-white/70">Teknisi Insights</h4>
                                <p className="text-sm font-bold leading-relaxed italic">
                                    "Kualitas servis bukan hanya soal memperbaiki mesin, tapi juga membangun kepercayaan pelanggan melalui ketelitian."
                                </p>
                                <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-white/10 flex items-center justify-center font-black text-xs">
                                        {(user?.name || 'T').charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">{user?.name || 'Teknisi'}</p>
                                        <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest mt-0.5">Primary Technician</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
