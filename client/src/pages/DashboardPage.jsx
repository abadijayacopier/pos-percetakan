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
        lowStock: [], pendingOrders: [], activeService: [], notifications: []
    });
    const [recentTrx, setRecentTrx] = useState([]);

    useEffect(() => {
        const fetchDashboardInfo = async () => {
            try {
                const res = await api.get('/finance/stats');
                const productsRes = await api.get('/products');
                const printRes = await api.get('/print-orders');
                const srvRes = await api.get('/service-orders');
                const trxRes = await api.get('/transactions');

                const data = res.data;
                const products = productsRes.data || [];
                const printOrders = printRes.data || [];
                const serviceOrders = srvRes.data || [];

                const lowStock = products.filter(p => p.stock <= p.min_stock);
                const pendingOrders = printOrders.filter(o => !['selesai', 'diambil'].includes(o.status));
                const activeService = serviceOrders.filter(o => !['selesai', 'diambil'].includes(o.status));

                setStats({
                    omset: data.todaySales || 0,
                    trxCount: data.trxCount || 0,
                    saldo: data.saldo || 0,
                    lowStock, pendingOrders, activeService
                });

                if (trxRes.data) {
                    // Sorting by date desc
                    const sorted = trxRes.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    setRecentTrx(sorted.slice(0, 5));
                }
            } catch (e) { console.error('Gagal load dashboard', e) }
        };
        fetchDashboardInfo();
    }, []);

    // Placeholder chart data
    const chartBars = [
        { day: 'Sen', h1: 30, h2: 40 },
        { day: 'Sel', h1: 50, h2: 70 },
        { day: 'Rab', h1: 20, h2: 30 },
        { day: 'Kam', h1: 80, h2: 90 },
        { day: 'Jum', h1: 100, h2: 120 },
        { day: 'Sab', h1: 40, h2: 60 },
        { day: 'Min', h1: 20, h2: 40 },
    ];

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
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center">{Math.min(3, stats.pendingOrders.length)} Baru</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium relative z-10">Antrean Cetak</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white relative z-10">{stats.pendingOrders.length} Tugas</h3>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                        <span className="material-symbols-outlined text-8xl text-amber-500">home_repair_service</span>
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                            <span className="material-symbols-outlined">home_repair_service</span>
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center">Tepat waktu</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium relative z-10">Servis Aktif</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white relative z-10">{stats.activeService.length} Tiket</h3>
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
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium relative z-10">Stok ATK Menipis</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white relative z-10">{stats.lowStock.length} Barang</h3>
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
                        <div className="flex items-end justify-between px-6 h-full pb-8">
                            <div className="w-8 md:w-16 bg-primary/20 hover:bg-primary/40 transition-colors cursor-pointer rounded-t h-[40%]"></div>
                            <div className="w-8 md:w-16 bg-primary/20 hover:bg-primary/40 transition-colors cursor-pointer rounded-t h-[60%]"></div>
                            <div className="w-8 md:w-16 bg-primary/40 hover:bg-primary/60 transition-colors cursor-pointer rounded-t h-[35%]"></div>
                            <div className="w-8 md:w-16 bg-primary/30 hover:bg-primary/50 transition-colors cursor-pointer rounded-t h-[75%]"></div>
                            <div className="w-8 md:w-16 bg-primary hover:bg-primary-dark transition-colors cursor-pointer rounded-t h-[90%] relative group">
                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Rp 1.2M</div>
                            </div>
                            <div className="w-8 md:w-16 bg-primary/20 hover:bg-primary/40 transition-colors cursor-pointer rounded-t h-[45%]"></div>
                            <div className="w-8 md:w-16 bg-primary/60 hover:bg-primary/80 transition-colors cursor-pointer rounded-t h-[55%]"></div>
                        </div>
                        <div className="flex justify-between px-6 pb-2 text-[10px] font-bold text-slate-400 uppercase border-t border-slate-200 dark:border-slate-800 pt-2">
                            <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span>
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

            {/* Recent Transactions Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Transaksi Terakhir</h3>
                    <button className="text-primary text-xs font-bold hover:underline" onClick={() => onNavigate('reports')}>Lihat Semua Catatan</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">ID Transaksi</th>
                                <th className="px-6 py-4">Pelanggan</th>
                                <th className="px-6 py-4">Jenis Layanan</th>
                                <th className="px-6 py-4">Jumlah</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                            {recentTrx.length > 0 ? recentTrx.map((trx, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">#TX-{idx + 8490}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{trx.customer_name || 'Pelanggan Umum'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold
                                            ${trx.type === 'service' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                                                trx.type === 'print' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                                                    'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                            <span className="material-symbols-outlined text-xs">
                                                {trx.type === 'service' ? 'build' : trx.type === 'print' ? 'print_connect' : 'print'}
                                            </span>
                                            {trx.type?.charAt(0).toUpperCase() + trx.type?.slice(1) || 'Fotokopi'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{formatRupiah(trx.total || trx.grand_total)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1.5 font-bold text-xs
                                            ${trx.status === 'selesai' ? 'text-emerald-600 dark:text-emerald-400' :
                                                trx.status === 'proses' ? 'text-blue-600 dark:text-blue-400' :
                                                    trx.status === 'batal' ? 'text-rose-600 dark:text-rose-400' :
                                                        'text-slate-500 dark:text-slate-400'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full
                                                ${trx.status === 'selesai' ? 'bg-emerald-600' :
                                                    trx.status === 'proses' ? 'bg-blue-600' :
                                                        trx.status === 'batal' ? 'bg-rose-600' :
                                                            'bg-slate-500'}`}></span>
                                            {trx.status ? trx.status.charAt(0).toUpperCase() + trx.status.slice(1) : 'Selesai'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined">more_horiz</span>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-500">#TX-8492</td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">Sarah Wilson</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
                                            <span className="material-symbols-outlined text-xs">print</span> Fotokopi
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">Rp 24.000</td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Selesai
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined">more_horiz</span>
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
