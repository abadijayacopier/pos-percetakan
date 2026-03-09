import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FiSun, FiMoon, FiBell, FiHelpCircle, FiLogOut, FiUser, FiMenu, FiSearch } from 'react-icons/fi';

export default function Layout({ activePage, onNavigate, children, isFullscreen }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const { themeMode, setTheme } = useTheme();

    const PAGE_TITLES = {
        dashboard: 'Dasbor Utama',
        pos: 'Transaksi Baru',
        printing: 'Percetakan',
        'digital-printing': 'Digital Printing',
        'cetak-offset': 'Katalog Cetak Offset & Nota',
        'stok-bahan': 'Stok Bahan Cetak',
        service: 'Tiket Servis',
        inventory: 'Data Inventori',
        customers: 'Pelanggan',
        finance: 'Keuangan',
        reports: 'Laporan',
        settings: 'Pengaturan',
        'spk-list': 'Daftar Tugas Produksi (SPK)',
        'spk-detail': 'Detail SPK',
        'spk-settlement': 'Penyelesaian Tagihan (SPK)',
        'kasir-payment': 'Pelunasan Kasir',
        'handover': 'Serah Terima Barang',
        'wa-settings': 'Pengaturan WhatsApp',
        'print-invoice': 'Cetak Invoice',
        'print-label': 'Cetak Label Produk',
        'print-spk': 'Cetak Dokumen SPK',
        'qris-monitor': 'Monitor Transaksi QRIS',
    };

    return (
        <div className="flex h-screen print:h-auto overflow-hidden print:overflow-visible bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            {!(isFullscreen && activePage === 'pos') && <Sidebar activePage={activePage} onNavigate={onNavigate} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

            <main className={`flex-1 flex flex-col overflow-hidden print:overflow-visible ${isFullscreen ? 'ml-0' : ''}`}>
                {activePage !== 'pos' && (
                    <header className="print:hidden h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-8 shrink-0">
                        <div className="flex items-center gap-4">
                            {/* Mobile Menu Button */}
                            <button
                                className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <FiMenu size={20} />
                            </button>
                            <h2 className="text-lg font-bold hidden md:block">{PAGE_TITLES[activePage] || 'Ringkasan Bisnis'}</h2>
                            <div className="relative group ml-0 md:ml-4">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <span className="material-symbols-outlined text-sm">search</span>
                                </span>
                                <input
                                    className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm w-48 md:w-64 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white"
                                    placeholder="Cari pesanan, klien..."
                                    type="text"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Theme Toggle */}
                            <div className="hidden lg:flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                {[
                                    { id: 'light', icon: FiSun },
                                    { id: 'dark', icon: FiMoon },
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        className={`p-1.5 rounded-md transition-colors ${themeMode === t.id || (themeMode === 'system' && t.id === 'light') ? 'bg-white dark:bg-slate-600 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        onClick={() => setTheme(t.id)}
                                        title={`Tema ${t.id}`}
                                    >
                                        <t.icon size={14} />
                                    </button>
                                ))}
                            </div>

                            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                            </button>

                            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold leading-none">{user?.name || 'Admin User'}</p>
                                    <p className="text-xs text-slate-500 font-medium">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Pemilik'}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 dark:border-slate-700 overflow-hidden ring-2 ring-primary/20 flex items-center justify-center cursor-pointer" onClick={logout} title="Keluar">
                                    {/* Use icon instead of hardcoded avatar since we don't know the exact user avatar */}
                                    <FiUser className="text-slate-500" size={20} />
                                </div>
                            </div>
                        </div>
                    </header>
                )}

                {activePage === 'pos' ? (
                    children
                ) : (
                    <div className="flex-1 overflow-y-auto print:overflow-visible w-full h-full bg-background-light dark:bg-background-dark">
                        {children}
                    </div>
                )}
            </main>
        </div>
    );
}

