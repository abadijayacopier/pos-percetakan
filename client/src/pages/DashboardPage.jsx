import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatRupiah } from '../utils';
import {
    FiDollarSign, FiPrinter, FiTool, FiShoppingCart, FiAlertCircle,
    FiFileText, FiPlus, FiEdit, FiCheckCircle, FiClock, FiUsers,
    FiPackage, FiArrowRight
} from 'react-icons/fi';

export default function DashboardPage({ onNavigate }) {
    const [stats, setStats] = useState({
        omset: 0, trxCount: 0, saldo: 0,
        lowStockCount: 0, pendingPrintCount: 0, pendingServiceCount: 0,
        activityLog: []
    });
    const [chartBars, setChartBars] = useState([]);
    const [recentTrx, setRecentTrx] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardInfo = async () => {
            setLoading(true);
            try {
                const [statsRes, trxRes] = await Promise.all([
                    api.get('/finance/stats'),
                    api.get('/transactions')
                ]);

                const data = statsRes.data;

                setStats({
                    omset: data.todaySales || 0,
                    trxCount: data.trxCount || 0,
                    saldo: data.saldo || 0,
                    lowStockCount: data.lowStock || 0,
                    pendingPrintCount: data.pendingPrint || 0,
                    pendingServiceCount: data.pendingService || 0,
                    activityLog: data.activityLog || []
                });

                if (data.chartData) {
                    setChartBars(data.chartData);
                }

                if (trxRes.data) {
                    const sorted = trxRes.data.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
                    setRecentTrx(sorted.slice(0, 5));
                }
            } catch (e) {
                console.error('Gagal load dashboard', e);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardInfo();
    }, []);

    return (
        <div className="p-4 sm:p-8 space-y-8 font-display">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                        <span className="material-symbols-outlined text-8xl text-emerald-500">payments</span>
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">+12% <span className="material-symbols-outlined text-xs">trending_up</span></span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium relative z-10">Pendapatan Hari Ini</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white relative z-10">{formatRupiah(stats.omset)}</h3>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                        <span className="material-symbols-outlined text-8xl text-blue-500">print</span>
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <span className="material-symbols-outlined">print</span>
                        </div>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center">Antrean SPK</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium relative z-10">Antrean Cetak</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white relative z-10">{stats.pendingPrintCount} Tugas</h3>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                        <span className="material-symbols-outlined text-8xl text-amber-500">home_repair_service</span>
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                            <span className="material-symbols-outlined">home_repair_service</span>
                        </div>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center">Servis Berjalan</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium relative z-10">Servis Aktif</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white relative z-10">{stats.pendingServiceCount} Tiket</h3>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                        <span className="material-symbols-outlined text-8xl text-rose-500">warning</span>
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                            <span className="material-symbols-outlined">warning</span>
                        </div>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center">Penting</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium relative z-10">Stok Barang Menipis</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white relative z-10">{stats.lowStockCount} Barang</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Performa Penjualan</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Statistik pendapatan mingguan</p>
                        </div>
                        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <span className="px-3 py-1 text-[10px] font-bold bg-white dark:bg-slate-700 text-primary rounded shadow-sm">MINGGUAN</span>
                            <span className="px-3 py-1 text-[10px] font-bold text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors">BULANAN</span>
                        </div>
                    </div>
                    <div className="relative h-64 w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg overflow-hidden flex flex-col justify-end">
                        <div className="flex items-end justify-between px-6 h-full pb-8 pt-10">
                            {chartBars.length > 0 ? chartBars.map((bar, i) => {
                                const maxVal = Math.max(...chartBars.map(b => b.total), 1000);
                                const height = (bar.total / maxVal) * 100;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-2 group flex-1">
                                        <div
                                            className="w-8 md:w-16 bg-primary hover:bg-primary-dark transition-all duration-500 rounded-t relative group"
                                            style={{ height: `${Math.max(5, height)}%` }}
                                        >
                                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                                                {formatRupiah(bar.total)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="w-full text-center text-slate-400 text-xs italic pb-10">Belum ada data transaksi 7 hari terakhir</div>
                            )}
                        </div>
                        <div className="flex justify-between px-6 pb-2 text-[10px] font-bold text-slate-400 uppercase border-t border-slate-200 dark:border-slate-800 pt-2">
                            {chartBars.length > 0 ? chartBars.map((bar, i) => (
                                <span key={i} className="flex-1 text-center">{bar.label}</span>
                            )) : (
                                <><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span></>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-base font-bold mb-6 text-slate-900 dark:text-white">Aksi Cepat</h3>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => onNavigate('pos')} className="flex items-center justify-between w-full p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all group text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
                                    <span className="material-symbols-outlined">add_shopping_cart</span>
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Transaksi Baru</p>
                                    <p className="text-xs text-primary/70 font-medium">Entri penjualan cepat</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">chevron_right</span>
                        </button>

                        <button onClick={() => onNavigate('service')} className="flex items-center justify-between w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group text-left">
                            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">confirmation_number</span>
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Buat Tiket Servis</p>
                                    <p className="text-xs text-slate-500 font-medium">Permintaan perbaikan baru</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-slate-400">chevron_right</span>
                        </button>

                        <button onClick={() => onNavigate('printing')} className="flex items-center justify-between w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group text-left">
                            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">playlist_add_check</span>
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Antrean Cetak</p>
                                    <p className="text-xs text-slate-500 font-medium">Kelola daftar tugas</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-slate-400">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Transactions & Activity Log */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Transactions Table */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Transaksi Terakhir</h3>
                        <button className="text-primary text-xs font-bold hover:underline" onClick={() => onNavigate('reports')}>Lihat Semua</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">ID Transaksi</th>
                                    <th className="px-6 py-4">Pelanggan</th>
                                    <th className="px-6 py-4">Jumlah</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                {loading ? (
                                    [...Array(3)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div></td>
                                        </tr>
                                    ))
                                ) : recentTrx.length > 0 ? recentTrx.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => onNavigate('print-receipt', { trxId: trx.id })}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-white">{trx.invoice_no || trx.invoiceNo}</div>
                                            <div className="text-[10px] text-slate-500 font-medium">
                                                {new Date(trx.date || trx.created_at).toLocaleDateString('id-ID')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{trx.customer_name || trx.customerName || 'Umum'}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatRupiah(trx.total || 0)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter
                                                ${trx.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {trx.status === 'paid' ? 'Lunas' : 'Piutang'}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-slate-500 text-sm italic">
                                            <span className="material-symbols-outlined block text-3xl mb-2 opacity-20">inbox</span>
                                            Belum ada transaksi hari ini
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Activity Log */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Log Aktivitas</h3>
                        <span className="material-symbols-outlined text-slate-400 text-sm">history</span>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[400px] p-6 space-y-6 custom-scrollbar">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="flex gap-3 animate-pulse">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                                    <div className="space-y-2 flex-1">
                                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                                        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))
                        ) : stats.activityLog.length > 0 ? stats.activityLog.map((log) => (
                            <div key={log.id} className="relative flex gap-4 group">
                                <div className="absolute left-[15px] top-8 bottom-[-24px] w-px bg-slate-100 dark:bg-slate-800 group-last:hidden"></div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm
                                    ${log.action === 'add' ? 'bg-emerald-100 text-emerald-600' :
                                        log.action === 'edit' || log.action?.includes('update') ? 'bg-blue-100 text-blue-600' :
                                            log.action === 'delete' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                                    <span className="material-symbols-outlined text-base">
                                        {log.action?.includes('transaction') ? 'payments' :
                                            log.action?.includes('stock') ? 'inventory_2' :
                                                log.action?.includes('service') ? 'build' : 'notifications'}
                                    </span>
                                </div>
                                <div className="pb-4">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug">
                                        <span className="font-bold">{log.user_name}</span> {log.action?.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">{log.detail}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                        {(() => {
                                            const d = new Date(log.timestamp);
                                            const diff = Date.now() - d.getTime();
                                            if (diff < 60000) return 'Baru Saja';
                                            if (diff < 3600000) return `${Math.floor(diff / 60000)}m yang lalu`;
                                            return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                                        })()}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-slate-400 text-sm italic">Belum ada aktivitas tercatat</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
