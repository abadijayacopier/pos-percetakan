import { useState, useEffect, useMemo } from 'react';
import db from '../db';
import { formatRupiah } from '../utils';
import {
    FiDollarSign, FiPrinter, FiTool, FiShoppingCart, FiAlertCircle,
    FiFileText, FiPlus, FiEdit, FiCheckCircle, FiClock, FiUsers,
    FiPackage, FiArrowRight, FiTag, FiTrendingUp, FiActivity,
    FiChevronLeft, FiChevronRight, FiInbox, FiLayers, FiBriefcase
} from 'react-icons/fi';
import {
    AreaChart as RechartsAreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

// Custom Area Chart Component using Recharts
const AreaChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="w-full h-full text-xs" style={{ minHeight: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                        dy={10}
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
                        stroke="#3b82f6"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                    />
                </RechartsAreaChart>
            </ResponsiveContainer>
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
        const fetchDashboardInfo = () => {
            setLoading(true);
            try {
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

                    weeklyData.push({ label: dayName, total: dayTotal });
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

    return (
        <div className="p-4 sm:p-8 space-y-8 font-display bg-slate-50/30 dark:bg-transparent min-h-screen">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Pendapatan Hari Ini', value: formatRupiah(stats.omset), icon: <FiDollarSign />, color: 'emerald', tag: 'Hari Ini' },
                    { label: 'Antrean Cetak', value: `${stats.pendingPrintCount} Tugas`, icon: <FiPrinter />, color: 'blue', tag: 'Antrean SPK' },
                    { label: 'Servis Aktif', value: `${stats.pendingServiceCount} Tiket`, icon: <FiTool />, color: 'amber', tag: 'Servis Berjalan' },
                    { label: 'Stok Menipis', value: `${stats.lowStockCount} Barang`, icon: <FiLayers />, color: 'rose', tag: 'Penting' },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className={`absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-125 text-8xl text-${s.color}-500`}>
                            {s.icon}
                        </div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={`p-3 bg-${s.color}-100 dark:bg-${s.color}-900/30 text-${s.color}-600 dark:text-${s.color}-400 rounded-xl`}>
                                {s.icon}
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600 dark:text-${s.color}-400 uppercase tracking-widest`}>
                                {s.tag}
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest relative z-10">{s.label}</p>
                        <h3 className="text-2xl font-black mt-1 text-slate-900 dark:text-white relative z-10">{s.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Modern Area Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[400px]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                                <span className="p-2 bg-primary/10 rounded-lg text-primary"><FiTrendingUp /></span>
                                Performa Penjualan
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-11">Statistik Pendapatan 7 Hari Terakhir</p>
                        </div>
                        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl self-start md:self-auto">
                            <button className="px-4 py-1.5 text-[10px] font-black bg-white dark:bg-slate-900 text-primary rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">WEEKLY</button>
                            <button className="px-4 py-1.5 text-[10px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">MONTHLY</button>
                        </div>
                    </div>

                    <div className="flex-1 relative mt-4">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <FiActivity className="animate-pulse text-4xl text-slate-200" />
                            </div>
                        ) : (
                            <div className="h-64 md:h-72">
                                <AreaChart data={chartData} />
                            </div>
                        )}
                    </div>

                    <div className="mt-14 pt-6 border-t border-slate-50 dark:border-slate-800/50 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/20"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pendapatan Aktual</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-30">
                            <div className="w-4 h-4 rounded-full border-2 border-slate-400"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Proyeksi</span>
                        </div>
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-xs font-black mb-6 text-slate-400 uppercase tracking-[0.2em]">Panel Navigasi</h3>
                        <div className="flex flex-col gap-3">
                            {[
                                { id: 'pos', title: 'Transaksi Baru', sub: 'Entri kasir cepat', icon: <FiShoppingCart />, color: 'primary', bg: 'bg-primary', text: 'text-primary-700', darkText: 'dark:text-primary-300', lightBg: 'bg-primary/5', border: 'border-primary/10' },
                                { id: 'service', title: 'Unit Servis', sub: 'Input perbaikan baru', icon: <FiTool />, color: 'amber', bg: 'bg-amber-500', text: 'text-amber-700', darkText: 'dark:text-amber-300', lightBg: 'bg-amber-50/50', border: 'border-amber-200/50' },
                                { id: 'printing', title: 'Produksi Cetak', sub: 'Mulai proses cetak', icon: <FiPrinter />, color: 'blue', bg: 'bg-blue-600', text: 'text-blue-700', darkText: 'dark:text-blue-300', lightBg: 'bg-blue-50/50', border: 'border-blue-200/50' },
                            ].map(btn => (
                                <button key={btn.id} onClick={() => onNavigate(btn.id)} className={`flex items-center justify-between w-full p-4 rounded-2xl border ${btn.border} ${btn.lightBg} hover:opacity-80 transition-all group overflow-hidden relative`}>
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={`w-12 h-12 rounded-xl ${btn.bg} text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105`}>
                                            {btn.icon}
                                        </div>
                                        <div>
                                            <p className={`font-black text-sm ${btn.text} ${btn.darkText}`}>{btn.title}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight opacity-70">{btn.sub}</p>
                                        </div>
                                    </div>
                                    <FiChevronRight className="relative z-10 group-hover:translate-x-1 transition-transform text-slate-400" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Activity Brief */}
                    <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-2xl border border-primary/10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                            <FiActivity size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-primary uppercase tracking-wider">Aktivitas Tim</p>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5">Semua sistem sinkron & berjalan optimal.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Paginated Transactions Table */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <FiBriefcase className="text-primary" /> Transaksi Terakhir
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg disabled:opacity-30 transition-all shadow-sm"
                                >
                                    <FiChevronLeft size={16} />
                                </button>
                                <span className="text-[10px] font-black px-4 text-slate-500 uppercase tracking-widest">
                                    {currentPage} / {totalPages || 1}
                                </span>
                                <button
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg disabled:opacity-30 transition-all shadow-sm"
                                >
                                    <FiChevronRight size={16} />
                                </button>
                            </div>
                            <button onClick={() => onNavigate('reports')} className="text-primary hover:text-primary-dark p-2 rounded-lg bg-primary/10 transition-colors" title="Buka Laporan">
                                <FiArrowRight size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                                <tr>
                                    <th className="px-6 py-4">Faktur</th>
                                    <th className="px-6 py-4">Pelanggan</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {loading ? (
                                    [...Array(pageSize)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="4" className="px-6 py-8"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div></td>
                                        </tr>
                                    ))
                                ) : recentTrx.length > 0 ? recentTrx.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all cursor-pointer group" onClick={() => onNavigate('print-receipt', { trxId: trx.id })}>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 dark:text-white group-hover:text-primary uppercase tracking-tighter italic">
                                                    {trx.invoice_no || trx.invoiceNo}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                                    {new Date(trx.date || trx.created_at || trx.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs truncate max-w-[140px]">{trx.customer_name || trx.customerName || 'UMUM'}</div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 opacity-60 italic">{trx.type || 'PJP'} PORTAL</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-black text-slate-900 dark:text-white tracking-tighter text-sm">{formatRupiah(trx.total || 0)}</div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase italic opacity-60">Via {trx.paymentType || 'Tunai'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                                                ${(trx.status === 'paid' || trx.status === 'completed' || trx.status === 'Lunas')
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800'}`}>
                                                {(trx.status === 'paid' || trx.status === 'completed' || trx.status === 'Lunas') ? 'Lunas' : 'Pending'}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center">
                                            <FiInbox size={48} className="mx-auto mb-4 text-slate-200" />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada transaksi</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Activity Log */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Log Aktivitas</h3>
                        <FiClock className="text-slate-300" />
                    </div>
                    <div className="p-6 space-y-6 overflow-y-auto max-h-[440px] custom-scrollbar">
                        {stats.activityLog.map((log) => (
                            <div key={log.id} className="relative flex gap-4">
                                <div className="absolute left-[18px] top-9 bottom-[-24px] w-[2px] bg-slate-50 dark:bg-slate-800 last:hidden"></div>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 z-10 shadow-sm
                                    ${log.action?.includes('Tambah') ? 'bg-emerald-100 text-emerald-600' :
                                        log.action?.includes('Edit') || log.action?.includes('Update') ? 'bg-blue-100 text-blue-600' :
                                            log.action?.includes('Hapus') ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                                    <FiActivity size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                                        <span className="text-primary italic font-black mr-1">{log.userName}</span>
                                        {log.action}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed italic">"{log.detail}"</p>
                                    <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase mt-2 tracking-widest">
                                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
