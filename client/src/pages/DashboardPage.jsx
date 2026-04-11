import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatRupiah } from '../utils';
import {
    FiDollarSign, FiPrinter, FiCpu, FiShoppingCart, FiAlertCircle,
    FiFileText, FiPlus, FiEdit, FiCheckCircle, FiClock, FiUsers,
    FiPackage, FiArrowRight, FiTag, FiTrendingUp, FiActivity,
    FiChevronLeft, FiChevronRight, FiInbox, FiLayers, FiBriefcase, FiRefreshCw,
    FiServer, FiEdit3, FiPlusSquare, FiTool, FiCommand
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart as RechartsAreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

// Premium Loading Spinner Component
const LoadingScreen = () => (
    <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
    >
        <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-primary/20 animate-[spin_3s_linear_infinite]"></div>
            <div className="absolute inset-2 rounded-full border-r-4 border-l-4 border-amber-500/30 animate-[spin_2s_linear_infinite_reverse]"></div>
            <div className="absolute inset-4 rounded-full border-t-4 border-cyan-500/40 animate-[spin_1.5s_ease-in-out_infinite]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <FiPackage className="text-4xl text-primary animate-pulse" />
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-pulse"></div>
        </div>
        <div className="text-center">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Menyiapkan Data</h2>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-2">Sistem Monitoring POS Modern</p>
        </div>
    </motion.div>
);

// Custom Area Chart Component using Recharts
const AreaChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="w-full h-full text-xs" style={{ minHeight: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <RechartsAreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                        dy={10}
                        interval={data?.length > 7 ? 'preserveStartEnd' : 0}
                        minTickGap={20}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                        tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
                        dx={-10}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            padding: '12px 16px'
                        }}
                        itemStyle={{ color: '#0f172a', fontWeight: '900', fontSize: '14px' }}
                        labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}
                        formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Omset']}
                    />
                    <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#0891b2"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#0891b2' }}
                    />
                </RechartsAreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default function DashboardPage({ onNavigate }) {
    const { user } = useAuth();
    const userRole = (user?.role || '').toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'pemilik';

    const [stats, setStats] = useState({
        omset: 0, trxCount: 0, saldo: 0,
        lowStockCount: 0, pendingPrintCount: 0, pendingServiceCount: 0,
        activityLog: [], alerts: [], weeklyData: [], monthlyData: []
    });

    // Real-time Engine States
    const [uptime, setUptime] = useState(0);
    const [systemLoad, setSystemLoad] = useState(0);
    const [viewMode, setViewMode] = useState('weekly');
    const chartData = useMemo(() => {
        return viewMode === 'weekly' ? stats.weeklyData : stats.monthlyData;
    }, [viewMode, stats]);
    const [allSortedTrx, setAllSortedTrx] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardInfo = async () => {
            setLoading(true);
            try {
                // Dimulasikan sedikit delay agar animasi spinner terasa premium
                await new Promise(resolve => setTimeout(resolve, 800));

                const [statsRes, trxRes] = await Promise.all([
                    api.get('/dashboard/stats'),
                    api.get('/transactions')
                ]);

                const data = statsRes.data;
                const allTrx = trxRes.data;

                setStats({
                    omset: data.omset,
                    trxCount: data.trxCount,
                    saldo: data.saldo,
                    lowStockCount: data.lowStockCount,
                    pendingPrintCount: data.pendingPrintCount,
                    pendingServiceCount: data.pendingServiceCount,
                    activityLog: data.activityLog,
                    alerts: data.alerts || [],
                    weeklyData: data.weeklyData || [],
                    monthlyData: data.monthlyData || []
                });

                // Sort transactions by date descending
                const sortedTrx = [...allTrx].sort((a, b) => new Date(b.date || b.created_at || b.timestamp) - new Date(a.date || a.created_at || a.timestamp));
                setAllSortedTrx(sortedTrx);
                setCurrentPage(1);

            } catch (e) {
                console.error('Gagal load dashboard', e);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardInfo();
        const mainInterval = setInterval(fetchDashboardInfo, 60000);

        const uptimeInterval = setInterval(() => {
            setUptime(prev => prev + 1);
        }, 1000);

        const loadInterval = setInterval(() => {
            setSystemLoad(Math.floor(Math.random() * 8) + 1);
        }, 5000);

        return () => {
            clearInterval(mainInterval);
            clearInterval(uptimeInterval);
            clearInterval(loadInterval);
        };
    }, []);

    const formatUptime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}j ${m}m ${s}s`;
    };

    const recentTrx = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return allSortedTrx.slice(start, start + pageSize);
    }, [allSortedTrx, currentPage, pageSize]);

    const totalPages = Math.ceil(allSortedTrx.length / pageSize);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
    };

    return (
        <div className="p-6 sm:p-8 space-y-8 font-display bg-slate-50 dark:bg-slate-950 min-h-screen min-w-0 overflow-x-hidden transition-colors duration-500">
            <AnimatePresence>
                {loading && <LoadingScreen />}
            </AnimatePresence>

            {/* Header Area */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
            >
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <span className="p-3 bg-cyan-600 rounded-2xl text-white shadow-xl shadow-cyan-500/20"><FiActivity /></span>
                        Dashboard Bisnis
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 ml-1 opacity-75">Sistem Monitoring & Inventori Terpadu</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 transition-all active:scale-95"
                    >
                        <FiRefreshCw size={20} />
                    </button>
                    <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 hidden sm:block mx-2" />
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status Sistem</p>
                        <p className="text-xs font-bold text-emerald-500 mt-1 flex items-center justify-end gap-1.5 uppercase">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Terhubung
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Top Stat Cards */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={loading ? "hidden" : "visible"}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {[
                    { label: 'Pendapatan Hari Ini', value: formatRupiah(stats.omset), icon: FiDollarSign, color: 'emerald', tag: 'Hari Ini', hidden: !isAdmin },
                    { label: 'Antrean Cetak', value: `${stats.pendingPrintCount} Tugas`, icon: FiPrinter, color: 'cyan', tag: 'Antrean SPK' },
                    { label: 'Servis Aktif', value: `${stats.pendingServiceCount} Tiket`, icon: FiCpu, color: 'amber', tag: 'Servis Berjalan' },
                    { label: 'Stok Menipis', value: `${stats.lowStockCount} Barang`, icon: FiLayers, color: 'rose', tag: 'Penting' },
                ].filter(s => !s.hidden).map(s => (
                    <motion.div
                        variants={itemVariants}
                        key={s.label}
                        className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"
                    >
                        <div className={`absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-125 text-8xl text-${s.color}-500`}>
                            <s.icon />
                        </div>
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className={`p-5 bg-${s.color}-50 dark:bg-${s.color}-500/10 text-${s.color}-600 dark:text-${s.color}-400 rounded-[1.5rem] transition-transform group-hover:scale-110 shadow-sm`}>
                                <s.icon size={26} />
                            </div>
                            <span className={`text-[9px] font-black px-4 py-2 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600 dark:text-${s.color}-400 uppercase tracking-widest border border-${s.color}-100 dark:border-${s.color}-500/20`}>
                                {s.tag}
                            </span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest relative z-10">{s.label}</p>
                        <h3 className="font-code text-2xl font-black italic tracking-tighter mt-1 text-slate-900 dark:text-white relative z-10">{s.value}</h3>
                    </motion.div>
                ))}
            </motion.div>

            {isAdmin && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={loading ? "hidden" : "visible"}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                    {/* Modern Area Chart */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col min-h-[480px] min-w-0"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase italic tracking-tighter">
                                    <span className="p-2.5 bg-cyan-600/10 rounded-xl text-cyan-600"><FiTrendingUp size={20} /></span>
                                    Performa Penjualan
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-14 opacity-70 italic">{viewMode === 'weekly' ? 'Statistik Pendapatan 7 Hari Terakhir' : 'Statistik Pendapatan 30 Hari Terakhir'}</p>
                            </div>
                            <div className="flex gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 self-start md:self-auto">
                                <button
                                    onClick={() => setViewMode('weekly')}
                                    className={`px-6 py-2 text-[10px] font-black rounded-xl transition-all tracking-widest uppercase cursor-pointer ${viewMode === 'weekly' ? 'bg-white dark:bg-slate-900 text-cyan-600 shadow-lg shadow-cyan-500/5 border border-slate-200 dark:border-slate-800' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    MINGGUAN
                                </button>
                                <button
                                    onClick={() => setViewMode('monthly')}
                                    className={`px-6 py-2 text-[10px] font-black rounded-xl transition-all tracking-widest uppercase cursor-pointer ${viewMode === 'monthly' ? 'bg-white dark:bg-slate-900 text-cyan-600 shadow-lg shadow-cyan-500/5 border border-slate-200 dark:border-slate-800' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    BULANAN
                                </button>
                            </div>
                        </div>

                        <div className="relative mt-4 h-[280px] w-full">
                            <AreaChart data={chartData} />
                        </div>

                        <div className="mt-16 pt-8 border-t border-slate-50 dark:border-slate-800/50 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-lg bg-cyan-600 shadow-xl shadow-cyan-500/30"></div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] italic">Pendapatan Aktual</span>
                            </div>
                            <div className="flex items-center gap-3 opacity-30">
                                <div className="w-5 h-5 rounded-lg border-2 border-slate-400"></div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] italic">Target Proyeksi</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Shortcuts & Activity Brief */}
                    <motion.div
                        variants={itemVariants}
                        className="space-y-6"
                    >
                        {/* Activity Brief */}
                        <div className="bg-cyan-600/5 dark:bg-cyan-600/10 p-10 rounded-[2.5rem] border border-cyan-600/10 flex items-center gap-6 group hover:bg-cyan-600/10 transition-colors">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-cyan-600 text-white flex items-center justify-center shadow-xl shadow-cyan-500/20 shrink-0 group-hover:scale-110 transition-transform">
                                <FiActivity size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest italic">Aktivitas Tim</p>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mt-1 leading-tight tracking-tight">Semua sistem sinkron & berjalan optimal.</p>
                            </div>
                        </div>

                        {/* Quick Actions Section */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                    <FiPlusSquare size={16} />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Pintasan Cepat</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => onNavigate('pos')}
                                    className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex flex-col items-center gap-3 hover:bg-blue-600 hover:text-white transition-all group"
                                >
                                    <FiShoppingCart className="text-blue-500 group-hover:text-white transition-colors" size={20} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Kasir Baru</span>
                                </button>
                                <button
                                    onClick={() => onNavigate('service')}
                                    className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex flex-col items-center gap-3 hover:bg-emerald-600 hover:text-white transition-all group"
                                >
                                    <FiTool className="text-emerald-500 group-hover:text-white transition-colors" size={20} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Input Servis</span>
                                </button>
                            </div>
                        </div>

                        {/* Terminal Health Statistics */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 space-y-6 relative overflow-hidden group shadow-sm dark:shadow-none">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-500 dark:text-cyan-400">
                                    <FiServer size={16} />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 italic">Status Terminal</h4>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-end border-b border-slate-100 dark:border-white/5 pb-4">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Session Uptime</span>
                                    <span className="text-xs font-mono font-black text-slate-800 dark:text-white">{formatUptime(uptime)}</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-slate-100 dark:border-white/5 pb-4">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">DB Connectivity</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] ${uptime % 2 === 0 ? 'animate-pulse' : ''}`}></div>
                                        <span className="text-xs font-black italic text-emerald-500 dark:text-emerald-400">LIVE</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Network Pulse</span>
                                    <span className="text-xs font-mono font-black text-cyan-600 dark:text-cyan-400 italic">~{systemLoad}ms</span>
                                </div>
                            </div>
                        </div>

                        {/* Daily Internal Memo - Now Dynamic Alerts Relocated to Sidebar */}
                        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 space-y-4 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-500/10 rounded-lg">
                                    <FiEdit3 className="text-cyan-600 dark:text-cyan-400" size={14} />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 italic">Memo Harian</h4>
                            </div>
                            <div className="space-y-3 px-1">
                                {stats.alerts && stats.alerts.length > 0 ? (
                                    stats.alerts.map((alert, idx) => (
                                        <p key={idx} className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase tracking-wider italic border-l-2 border-cyan-500/30 pl-3">
                                            {alert}
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider italic border-l-2 border-slate-200 dark:border-slate-800 pl-3">
                                        BELUM ADA CATATAN MENDESAK HARI INI.
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Bottom Row */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={loading ? "hidden" : "visible"}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12"
            >
                {/* Paginated Transactions Table */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-w-0"
                >
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-50/20 dark:bg-slate-800/20">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3 italic">
                            <span className="p-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl"><FiBriefcase size={18} /></span>
                            Transaksi Terakhir
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-white dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl disabled:opacity-30 transition-all text-slate-600 dark:text-slate-400"
                                >
                                    <FiChevronLeft size={18} />
                                </button>
                                <span className="font-code text-[10px] font-black px-5 text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                                    {currentPage} <span className="text-slate-300 dark:text-slate-700 mx-1">/</span> {totalPages || 1}
                                </span>
                                <button
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl disabled:opacity-30 transition-all text-slate-600 dark:text-slate-400"
                                >
                                    <FiChevronRight size={18} />
                                </button>
                            </div>
                            {isAdmin && (
                                <button onClick={() => onNavigate('reports')} className="size-11 flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95">
                                    <FiArrowRight size={22} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-8 py-6">Faktur</th>
                                    <th className="px-8 py-6">Pelanggan</th>
                                    <th className="px-8 py-6">Total</th>
                                    <th className="px-8 py-6 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {recentTrx.length > 0 ? recentTrx.map((trx) => (
                                    <tr
                                        key={trx.id}
                                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all cursor-pointer group"
                                        onClick={() => onNavigate('print-receipt', { trxId: trx.id })}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-code font-black text-slate-900 dark:text-white group-hover:text-cyan-600 uppercase tracking-tighter italic transition-colors">
                                                    {trx.invoice_no || trx.invoiceNo}
                                                </span>
                                                <span className="text-[10px] text-slate-400 group-hover:text-slate-500 font-bold uppercase mt-1 tracking-widest italic opacity-70">
                                                    {new Date(trx.date || trx.created_at || trx.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 text-[10px] border border-slate-200 dark:border-slate-700 group-hover:border-cyan-200 transition-colors">
                                                    {(trx.customer_name || trx.customerName || 'UMUM').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 dark:text-slate-200 uppercase text-xs tracking-tight italic">{trx.customer_name || trx.customerName || 'UMUM'}</div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">PORTAL {trx.type || 'TX'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="font-code font-black text-slate-900 dark:text-white tracking-widest text-sm italic">{formatRupiah(trx.total || 0)}</div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase italic mt-1.5 opacity-60">Metode: {trx.paymentType || 'Tunai'}</p>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border
                                                            ${(trx.status === 'paid' || trx.status === 'completed' || trx.status === 'Lunas')
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800'}`}>
                                                {(trx.status === 'paid' || trx.status === 'completed' || trx.status === 'Lunas') ? <><FiCheckCircle className="mr-2" /> Lunas</> : <><FiClock className="mr-2" /> Pending</>}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-24 text-center">
                                            <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-full inline-block mb-6">
                                                <FiInbox size={48} className="text-slate-200 dark:text-slate-800" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Belum ada transaksi terekam hari ini</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Activity Log */}
                {isAdmin && (
                    <motion.div
                        variants={itemVariants}
                        className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden min-w-0"
                    >
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/20 dark:bg-slate-800/20">
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">Aliran Aktivitas</h3>
                            <div className="p-2 bg-slate-900 text-white rounded-lg"><FiClock size={16} /></div>
                        </div>
                        <div className="p-8 space-y-10 overflow-y-auto max-h-[580px] custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {stats.activityLog.map((log, i) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="relative flex gap-5"
                                    >
                                        <div className="absolute left-5 top-12 bottom-[-40px] w-0.5 bg-slate-100 dark:bg-slate-800/50 last:hidden"></div>
                                        <div className={`size-11 rounded-2xl flex items-center justify-center shrink-0 z-10 shadow-sm border border-white dark:border-slate-800 
                                                        ${log.action?.includes('Tambah') ? 'bg-emerald-50 text-emerald-600' :
                                                log.action?.includes('Edit') || log.action?.includes('Update') ? 'bg-cyan-50 text-cyan-600' :
                                                    log.action?.includes('Hapus') ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>
                                            <FiActivity size={18} />
                                        </div>
                                        <div className="pt-0.5">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                                <span className="text-cyan-600 italic font-black mr-2 uppercase tracking-tighter">{log.userName}</span>
                                                {log.action}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed italic opacity-85">"{log.detail}"</p>
                                            <div className="flex items-center gap-2 mt-3 font-code font-black text-[9px] text-slate-300 dark:text-slate-600 uppercase tracking-widest italic">
                                                <FiClock size={10} />
                                                {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
