import { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ConfirmationModal from './ConfirmationModal';
import { FiBell, FiHelpCircle, FiLogOut, FiUser, FiMenu, FiSearch } from 'react-icons/fi';

export default function Layout({ activePage, onNavigate, children, isFullscreen }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const { themeMode, setTheme } = useTheme();
    const [profileOpen, setProfileOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const profileRef = useRef(null);

    // Close profile dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        'print-receipt': 'Cetak Nota',
        'print-label': 'Cetak Label Produk',
        'print-spk': 'Cetak Dokumen SPK',
        'qris-monitor': 'Monitor Transaksi QRIS',
        'manajemen-desainer': 'Manajemen Operator Desain',
        'dashboard-desainer': 'Dashboard Desainer',
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
                            <ThemeToggle />

                            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                            </button>

                            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                            <div className="relative" ref={profileRef}>
                                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setProfileOpen(!profileOpen)}>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-bold leading-none text-slate-900 dark:text-white group-hover:text-primary transition-colors">{user?.name || 'Admin User'}</p>
                                        <p className="text-xs text-slate-500 font-medium">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Pemilik'}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all flex items-center justify-center">
                                        {/* Profile Picture Placeholder */}
                                        <div className="w-full h-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                            {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AU'}
                                        </div>
                                    </div>
                                    <span className={`material-symbols-outlined text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                </div>

                                {/* Premium Profile Dropdown */}
                                {profileOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 md:hidden">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name || 'Admin User'}</p>
                                            <p className="text-xs text-slate-500">{user?.role || 'Administrator'}</p>
                                        </div>

                                        <button onClick={() => { onNavigate('profile'); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-lg">person</span>
                                            Profil Saya
                                        </button>
                                        <button onClick={() => { onNavigate('settings'); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-lg">lock_reset</span>
                                            Ganti Kata Sandi
                                        </button>

                                        <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>

                                        <button
                                            onClick={() => {
                                                setProfileOpen(false);
                                                setShowLogoutModal(true);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">logout</span>
                                            Logout / Keluar
                                        </button>
                                    </div>
                                )}
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

            {/* Logout Confirmation Modal */}
            <ConfirmationModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={logout}
                title="Konfirmasi Keluar"
                message="Apakah Anda yakin ingin keluar dari aplikasi ini? Sesi Anda akan dihentikan."
                confirmText="Ya, Keluar"
                cancelText="Batal"
                type="danger"
            />
        </div>
    );
}
