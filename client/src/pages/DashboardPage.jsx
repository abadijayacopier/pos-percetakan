import { useState, useEffect, useMemo } from 'react';
import db from '../db';
import { formatRupiah } from '../utils';
import {
    FiDollarSign, FiPrinter, FiTool, FiShoppingCart, FiAlertCircle,
    FiFileText, FiPlus, FiEdit, FiCheckCircle, FiClock, FiUsers,
    FiPackage, FiArrowRight, FiTag, FiTrendingUp, FiActivity,
    FiChevronLeft, FiChevronRight, FiInbox, FiLayers, FiBriefcase, FiRefreshCw
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Premium Loading Spinner Component
const LoadingScreen = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col items-center justify-center gap-6"
    >
        <div className="relative">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-blue-600 border-r-blue-600/30"
            />
            <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center text-blue-600"
            >
                <FiActivity size={32} />
            </motion.div>
        </div>
        <div className="text-center">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Menyiapkan Data</h2>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-2">Sistem Monitoring POS Modern</p>
        </div>
    </motion.div>
);

// Custom Area Chart Component using SVG + Tailwind
const AreaChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const maxVal = Math.max(...data.map(d => d.total), 1000);
    const width = 1000;
    const height = 200;
    const padding = 20;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (d.total / maxVal) * (height - padding * 2) - padding;
        return { x, y };
    });

    const pathData = `M ${points[0].x} ${points[0].y} ` +
        points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

    const areaData = `${pathData} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return (
        <div className="relative w-full h-full group">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                </defs>

                <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    d={areaData} fill="url(#chartGradient)"
                />

                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    d={pathData}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-lg"
                />

                {points.map((p, i) => (
                    <g key={i} className="group/dot">
                        <motion.circle
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            cx={p.x} cy={p.y} r="6"
                            fill="white"
                            stroke="#3b82f6"
                            strokeWidth="3"
                            className="dark:fill-slate-900 transition-all hover:r-[8px]"
                        />
                        <rect
                            x={p.x - 20} y={0} width="40" height={height}
                            fill="transparent"
                            className="cursor-pointer"
                        />
                    </g>
                ))}
            </svg>

            <div className="absolute inset-x-0 -bottom-8 flex justify-between px-2">
                {data.map((d, i) => (
                    <span key={i} className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">
                        {d.label}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default function DashboardPage({ onNavigate }) {
    const [stats, setStats] = useState({
        omset: 0, trxCount: 0, saldo: 0,
        lowStockCount: 0, pendingPrintCount: 0, pendingServiceCount: 0,
        activityLog: []
    });
    const [chartData, setChartData] = useState([]);
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

                const allTrx = db.getAll('transactions');
                const allCashFlow = db.getAll('cash_flow');
                const allProducts = db.getAll('products');
                const allPrintOrders = db.getAll('print_orders');
                const allServiceOrders = db.getAll('service_orders');
                const allActivityLog = db.getAll('activity_log');

                const now = new Date();
                const todayStr = now.toLocaleDateString('en-CA');

                const todayTrx = allTrx.filter(t => {
                    const tDate = new Date(t.date || t.created_at || t.timestamp).toLocaleDateString('en-CA');
                    return tDate === todayStr;
                });
                const todayOmset = todayTrx.reduce((acc, t) => acc + (t.total || 0), 0);
                const todayTrxCount = todayTrx.length;

                const cashIn = allCashFlow.filter(c => c.type === 'in').reduce((acc, c) => acc + (c.amount || 0), 0);
                const cashOut = allCashFlow.filter(c => c.type === 'out').reduce((acc, c) => acc + (c.amount || 0), 0);
                const currentSaldo = cashIn - cashOut;

                const pendingPrint = allPrintOrders.filter(o => !['selesai', 'diambil', 'batal'].includes(o.status)).length;
                const pendingService = allServiceOrders.filter(o => !['selesai', 'diambil', 'batal'].includes(o.status)).length;
                const lowStock = allProducts.filter(p => p.stock <= (p.minStock || 0)).length;

                const weeklyData = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const labelDay = d.toLocaleDateString('en-CA');
                    const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });

                    const dayTotal = allTrx
                        .filter(t => {
                            const tDate = new Date(t.date || t.created_at || t.timestamp).toLocaleDateString('en-CA');
                            return tDate === labelDay;
                        })
                        .reduce((acc, t) => acc + (t.total || 0), 0);

                    weeklyData.push({ label: dayName.toUpperCase(), total: dayTotal });
                }

                setStats({
                    omset: todayOmset,
                    trxCount: todayTrxCount,
                    saldo: currentSaldo,
                    lowStockCount: lowStock,
                    pendingPrintCount: pendingPrint,
                    pendingServiceCount: pendingService,
                    activityLog: allActivityLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10)
                });

                setChartData(weeklyData);
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
        const interval = setInterval(fetchDashboardInfo, 60000);
        return () => clearInterval(interval);
    }, []);

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
        <div className="p-6 sm:p-8 space-y-8 font-display bg-white dark:bg-slate-950 min-h-screen">
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
                        <span className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-500/20"><FiActivity /></span>
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
                    <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-800 hidden sm:block mx-2" />
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
                    { label: 'Pendapatan Hari Ini', value: formatRupiah(stats.omset), icon: FiDollarSign, color: 'emerald', tag: 'Hari Ini' },
                    { label: 'Antrean Cetak', value: `${stats.pendingPrintCount} Tugas`, icon: FiPrinter, color: 'blue', tag: 'Antrean SPK' },
                    { label: 'Servis Aktif', value: `${stats.pendingServiceCount} Tiket`, icon: FiTool, color: 'amber', tag: 'Servis Berjalan' },
                    { label: 'Stok Menipis', value: `${stats.lowStockCount} Barang`, icon: FiLayers, color: 'rose', tag: 'Penting' },
                ].map(s => (
                    <motion.div
                        variants={itemVariants}
                        key={s.label}
                        className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"
                    >
                        <div className={`absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-125 text-8xl text-${s.color}-500`}>
                            <s.icon />
                        </div>
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className={`p-4 bg-${s.color}-50 dark:bg-${s.color}-500/10 text-${s.color}-500 rounded-2xl transition-transform group-hover:scale-110`}>
                                <s.icon size={24} />
                            </div>
                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600 dark:text-${s.color}-400 uppercase tracking-widest border border-${s.color}-100 dark:border-${s.color}-500/20`}>
                                {s.tag}
                            </span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest relative z-10">{s.label}</p>
                        <h3 className="text-2xl font-black italic tracking-tighter mt-1 text-slate-900 dark:text-white relative z-10">{s.value}</h3>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={loading ? "hidden" : "visible"}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                {/* Modern Area Chart */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col min-h-[450px]"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase italic tracking-tighter">
                                <span className="p-2.5 bg-blue-600/10 rounded-xl text-blue-600"><FiTrendingUp size={20} /></span>
                                Performa Penjualan
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-14 opacity-70 italic">Statistik Pendapatan 7 Hari Terakhir</p>
                        </div>
                        <div className="flex gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 self-start md:self-auto">
                            <button className="px-6 py-2 text-[10px] font-black bg-white dark:bg-slate-900 text-blue-600 rounded-xl shadow-lg shadow-blue-500/5 border border-slate-200 dark:border-slate-800 tracking-widest uppercase">WEEKLY</button>
                            <button className="px-6 py-2 text-[10px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors tracking-widest uppercase">MONTHLY</button>
                        </div>
                    </div>

                    <div className="flex-1 relative mt-4 min-h-[220px]">
                        <div className="h-full w-full">
                            <AreaChart data={chartData} />
                        </div>
                    </div>

                    <div className="mt-16 pt-8 border-t border-slate-50 dark:border-slate-800/50 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-lg bg-blue-600 shadow-xl shadow-blue-500/30"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] italic">Pendapatan Aktual</span>
                        </div>
                        <div className="flex items-center gap-3 opacity-30">
                            <div className="w-5 h-5 rounded-lg border-2 border-slate-400"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] italic">Target Proyeksi</span>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Shortcuts */}
                <motion.div
                    variants={itemVariants}
                    className="space-y-6"
                >
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-1/3 -translate-y-1/3 text-9xl text-slate-500 pointer-events-none group-hover:scale-110 transition-transform">
                            <FiShoppingCart />
                        </div>
                        <h3 className="text-[10px] font-black mb-8 text-slate-400 uppercase tracking-[0.25em] ml-1">Panel Navigasi</h3>
                        <div className="flex flex-col gap-4">
                            {[
                                { id: 'pos', title: 'Transaksi Baru', sub: 'Entri kasir cepat', icon: FiShoppingCart, color: 'blue-600' },
                                { id: 'service', title: 'Unit Servis', sub: 'Input perbaikan baru', icon: FiTool, color: 'emerald-600' },
                                { id: 'printing', title: 'Produksi Cetak', sub: 'Mulai proses cetak', icon: FiPrinter, color: 'amber-600' },
                            ].map(btn => (
                                <button
                                    key={btn.id}
                                    onClick={() => onNavigate(btn.id)}
                                    className={`flex items-center justify-between w-full p-4 rounded-2xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all group/btn hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 active:scale-95`}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-${btn.color} flex items-center justify-center shadow-sm group-hover/btn:scale-110 transition-transform`}>
                                            <btn.icon size={24} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight italic`}>{btn.title}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">{btn.sub}</p>
                                        </div>
                                    </div>
                                    <FiChevronRight className="group-hover/btn:translate-x-1 transition-transform text-slate-300" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Activity Brief */}
                    <div className="bg-blue-600/5 dark:bg-blue-600/10 p-8 rounded-[2rem] border border-blue-600/10 flex items-center gap-6 group hover:bg-blue-600/10 transition-colors">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 group-hover:scale-110 transition-transform">
                            <FiActivity size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">Aktivitas Tim</p>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mt-1 leading-tight tracking-tight">Semua sistem sinkron & berjalan optimal.</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

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
                    className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col"
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
                                <span className="text-[10px] font-black px-5 text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
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
                            <button onClick={() => onNavigate('reports')} className="size-11 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                                <FiArrowRight size={22} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
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
                                                <span className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 uppercase tracking-tighter italic transition-colors">
                                                    {trx.invoice_no || trx.invoiceNo}
                                                </span>
                                                <span className="text-[10px] text-slate-400 group-hover:text-slate-500 font-bold uppercase mt-1 tracking-widest italic opacity-70">
                                                    {new Date(trx.date || trx.created_at || trx.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 text-[10px] border border-slate-200 dark:border-slate-700 group-hover:border-blue-200 transition-colors">
                                                    {(trx.customer_name || trx.customerName || 'UMUM').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 dark:text-slate-200 uppercase text-xs tracking-tight italic">{trx.customer_name || trx.customerName || 'UMUM'}</div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">PORTAL {trx.type || 'TX'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="font-black text-slate-900 dark:text-white tracking-widest text-sm italic">{formatRupiah(trx.total || 0)}</div>
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
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden"
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
                                            log.action?.includes('Edit') || log.action?.includes('Update') ? 'bg-blue-50 text-blue-600' :
                                                log.action?.includes('Hapus') ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>
                                        <FiActivity size={18} />
                                    </div>
                                    <div className="pt-0.5">
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                            <span className="text-blue-600 italic font-black mr-2 uppercase tracking-tighter">{log.userName}</span>
                                            {log.action}
                                        </p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed italic opacity-85">"{log.detail}"</p>
                                        <div className="flex items-center gap-2 mt-3 font-black text-[9px] text-slate-300 dark:text-slate-600 uppercase tracking-widest italic">
                                            <FiClock size={10} />
                                            {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
