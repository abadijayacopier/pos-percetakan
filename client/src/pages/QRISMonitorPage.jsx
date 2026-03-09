import { useState, useEffect } from 'react';
import api from '../services/api';

export default function QRISMonitorPage({ onNavigate }) {
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({ total_tx: 0, success_tx: 0, pending_tx: 0, total_amount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/spk/payments/qris');
                const data = res.data;
                setTransactions(data.transactions || []);
                setStats(data.stats || {});
            } catch (err) {
                console.error('Gagal fetch QRIS:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 15000); // Refresh 15 detik
        return () => clearInterval(interval);
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Berhasil': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'Pending': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'Gagal': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);
    const formatTime = (d) => d ? new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-';

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight mb-2">Pantau Pembayaran QRIS</h1>
                        <p className="text-slate-500">Lihat status transaksi masuk secara instan.</p>
                    </div>
                    <button onClick={fetchData} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all shadow-sm cursor-pointer">
                        <span className="material-symbols-outlined text-xl">sync_alt</span>
                        <span>Rekonsiliasi Data</span>
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                <span className="material-symbols-outlined text-blue-600">account_balance_wallet</span>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Total QRIS Masuk</p>
                        <p className="text-2xl font-black">{formatCurrency(stats.total_amount)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                <span className="material-symbols-outlined text-green-600">check_circle</span>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Transaksi Sukses</p>
                        <p className="text-2xl font-black">{stats.success_tx || 0} <span className="text-sm font-normal text-slate-400 ml-1">Transaksi</span></p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                                <span className="material-symbols-outlined text-orange-600">hourglass_empty</span>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Transaksi Pending</p>
                        <p className="text-2xl font-black">{stats.pending_tx || 0} <span className="text-sm font-normal text-slate-400 ml-1">Menunggu</span></p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="font-bold">Log Transaksi QRIS</h3>
                        <div className="flex items-center gap-2">
                            <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Update</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Waktu</th>
                                    <th className="px-6 py-4">Pelanggan</th>
                                    <th className="px-6 py-4">No. SPK</th>
                                    <th className="px-6 py-4 text-right">Nominal</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>Memuat...
                                    </td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Belum ada transaksi QRIS</td></tr>
                                ) : transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-medium">{formatTime(tx.created_at)}</p>
                                            <p className="text-[10px] text-slate-400">{formatDate(tx.created_at)}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-bold">{tx.customer_name}</p>
                                            <p className="text-[10px] text-slate-400">{tx.cashier_name || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{tx.spk_number}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <p className="text-sm font-bold text-primary">{formatCurrency(tx.amount)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${getStatusStyle(tx.status)}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-500">Menampilkan {transactions.length} transaksi QRIS</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
