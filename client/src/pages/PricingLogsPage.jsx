import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const fmt = (n) => 'Rp ' + Math.floor(n || 0).toLocaleString('id-ID');
const pad = (n) => String(n).padStart(2, '0');
const hms = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

/* ─────────────────────────────────────────────────────────────────────────────
   TOAST MINI
───────────────────────────────────────────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    const bg = type === 'error' ? '#ef4444' : type === 'warn' ? '#f59e0b' : '#22c55e';
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            background: bg, color: '#fff', padding: '12px 20px',
            borderRadius: 12, fontWeight: 600, fontSize: '.85rem',
            boxShadow: '0 8px 24px rgba(0,0,0,.18)', maxWidth: 320,
            animation: 'dp-slideIn .25s ease',
        }}>{msg}</div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function PricingLogsPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState([
        {
            id: 'log-1',
            product_name: 'Buku Nota A5 NCR 2 Play',
            user_name: 'Admin Utama',
            user_role: 'admin',
            created_at: '2024-03-04 14:30:22',
            action: 'UPDATE',
            changes: 'Tier 51-Tak Terhingga: Diskon diubah dari 20% menjadi 25%'
        },
        {
            id: 'log-2',
            product_name: 'Kartu Nama Premium 260gr',
            user_name: 'Budi (Kasir 1)',
            user_role: 'kasir',
            created_at: '2024-03-02 09:15:00',
            action: 'CREATE',
            changes: 'Menambahkan aturan grosir baru untuk pembelian > 10 box'
        },
        {
            id: 'log-3',
            product_name: 'Banner Outdoor (m2)',
            user_name: 'Admin Utama',
            user_role: 'admin',
            created_at: '2024-02-28 16:45:10',
            action: 'DELETE',
            changes: 'Menghapus tier diskon 5% untuk kuantitas 11-20'
        }
    ]);

    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 w-full h-full">
            {/* Sidebar Kiri - Navigasi Sub-menu Katalog */}
            <aside className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
                <div className="p-2">
                    <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 px-3">Katalog Produk</h3>
                    <nav className="flex flex-col gap-1">
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                            <span className="material-symbols-outlined text-xl group-hover:text-primary">inventory_2</span>
                            <span className="text-sm font-medium">Daftar Produk</span>
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                            <span className="material-symbols-outlined text-xl group-hover:text-primary">category</span>
                            <span className="text-sm font-medium">Kategori</span>
                        </a>
                        <a href="/harga-grosir" className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                            <span className="material-symbols-outlined text-xl group-hover:text-primary">sell</span>
                            <span className="text-sm font-medium">Harga Grosir</span>
                        </a>
                        {/* Aktifkan Menu Riwayat Harga Grosir */}
                        <a href="#" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-xl">history</span>
                            <span className="text-sm font-bold">Riwayat Harga</span>
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                            <span className="material-symbols-outlined text-xl group-hover:text-primary">database</span>
                            <span className="text-sm font-medium">Stok</span>
                        </a>
                    </nav>
                </div>
            </aside>

            {/* Area Utama - Log Riwayat */}
            <section className="flex-1 flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">Riwayat Perubahan Harga</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal mt-1">Lacak setiap pembaruan aturan harga grosir dan berjenjang oleh staf Anda.</p>
                    </div>
                    <div className="flex gap-3">
                        {/* Filter Tanggal atau User */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400 text-sm">filter_list</span>
                            </div>
                            <select className="form-input pl-10 h-10 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold focus:ring-primary focus:border-primary">
                                <option>Semua Staf</option>
                                <option>Admin Utama</option>
                                <option>Budi (Kasir 1)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex-1">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <span className="material-symbols-outlined text-primary">manage_search</span>
                            Log Audit sistem
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-48">Waktu & Tanggal</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pengguna</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Target Produk</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Detail Perubahan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900 dark:text-white text-sm">{log.created_at.split(' ')[0]}</span>
                                                <span className="text-xs text-slate-500">{log.created_at.split(' ')[1]}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-primary text-sm">
                                                        {log.user_role === 'admin' ? 'admin_panel_settings' : 'person'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white text-sm">{log.user_name}</span>
                                                    <span className="text-xs text-slate-500 uppercase">{log.user_role}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                                {log.product_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {log.action === 'UPDATE' && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded w-max">TIDAK SESUAI</span>}
                                                {log.action === 'UPDATE' && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded w-max">UPDATE</span>}
                                                {log.action === 'CREATE' && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded w-max">CREATE</span>}
                                                {log.action === 'DELETE' && <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded w-max">DELETE</span>}

                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{log.changes}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                            Belum ada riwayat perubahan harga.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
