import { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ConfirmationModal from './ConfirmationModal';
import BottomNav from './BottomNav';
import { FiBell, FiHelpCircle, FiLogOut, FiUser, FiMenu, FiSearch, FiDatabase } from 'react-icons/fi';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ activePage, onNavigate, children, isFullscreen }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('abadi_sidebar_collapsed');
        return saved === 'true';
    });
    const { user, logout } = useAuth();
    const { themeMode, setTheme } = useTheme();
    const [profileOpen, setProfileOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const profileRef = useRef(null);
    const notifRef = useRef(null);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [dbStatus, setDbStatus] = useState('checking'); // 'checking', 'connected', 'disconnected'

    const toggleSidebarCollapse = () => {
        setSidebarCollapsed(prev => {
            const newVal = !prev;
            localStorage.setItem('abadi_sidebar_collapsed', newVal);
            return newVal;
        });
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
            if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Notifications (Low Stock Alerts)
    useEffect(() => {
        let isMounted = true;
        const fetchNotifs = async () => {
            try {
                const [prodRes, matRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/materials')
                ]);
                if (!isMounted) return;

                const prods = prodRes.data || [];
                const mats = matRes.data || [];
                const alerts = [];

                prods.forEach(p => {
                    if (p.stock <= (p.minStock || 0) && (p.minStock || 0) > 0) {
                        alerts.push({ id: `p-${p.id}`, title: 'Stok ATK Menipis', message: `${p.name} tersisa ${p.stock} ${p.unit}`, type: 'warning' });
                    }
                });
                mats.forEach(m => {
                    if (m.stok_saat_ini <= (m.stok_minimum || 0) && (m.stok_minimum || 0) > 0) {
                        alerts.push({ id: `m-${m.id}`, title: 'Bahan Cetak Hampir Habis', message: `${m.nama_bahan} tersisa ${m.stok_saat_ini} ${m.satuan}`, type: 'danger' });
                    }
                });

                setNotifications(alerts);
            } catch (e) {
                console.error("Failed to fetch notifications");
            }
        };
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 60000); // refresh every 1 min
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    // Global listener for toggling sidebar from child pages
    useEffect(() => {
        const handleToggleSidebar = () => setSidebarOpen(prev => !prev);
        window.addEventListener('toggleSidebar', handleToggleSidebar);
        return () => window.removeEventListener('toggleSidebar', handleToggleSidebar);
    }, []);

    // Real-time Database Status polling
    useEffect(() => {
        let isMounted = true;
        const checkDb = async () => {
            try {
                const res = await api.get('/health/db-status');
                if (isMounted) setDbStatus(res.data.connected ? 'connected' : 'disconnected');
            } catch (err) {
                if (isMounted) setDbStatus('disconnected');
            }
        };
        checkDb();
        const interval = setInterval(checkDb, 5000); // verify every 5s
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
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
        'production-queue': 'Antrean Produksi',
    };

    return (
        <div className="flex h-screen print:h-auto overflow-hidden print:overflow-visible bg-background-light dark:bg-background-dark print:bg-white font-display text-slate-900 dark:text-slate-100 print:text-black">
            {!(activePage === 'pos-v1' || isFullscreen) && <Sidebar activePage={activePage} onNavigate={onNavigate} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} toggleCollapse={toggleSidebarCollapse} />}

            <main className={`flex-1 flex flex-col overflow-hidden min-w-0 print:overflow-visible print:p-0 print:m-0 print:h-auto print:block ${isFullscreen ? 'ml-0' : ''} transition-all duration-300`}>
                {!(activePage === 'pos' || activePage === 'pos-v1') && (
                    <header className="print:hidden h-16 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 sticky top-0 z-50">
                        <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto overflow-hidden">
                            {/* Mobile Menu Button */}
                            <button
                                className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <FiMenu size={20} />
                            </button>
                            <h2 className="text-sm sm:text-lg font-bold truncate md:block flex-1 min-w-0">{PAGE_TITLES[activePage] || 'Ringkasan Bisnis'}</h2>
                            <div className="relative group ml-auto md:ml-4 hidden sm:block shrink-0">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <span className="material-symbols-outlined text-sm">search</span>
                                </span>
                                <input
                                    className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm w-36 md:w-64 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white"
                                    placeholder="Cari pesanan..."
                                    type="text"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                            <div className="items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md hidden lg:flex shrink-0 shadow-sm">
                                <FiDatabase className={`text-sm ${dbStatus === 'connected' ? 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' : dbStatus === 'disconnected' ? 'text-red-500 animate-pulse' : 'text-yellow-500 animate-spin'}`} />
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    {dbStatus === 'connected' ? 'System Online' : dbStatus === 'disconnected' ? 'DB Error' : 'Checking...'}
                                </span>
                            </div>

                            {/* Theme Toggle */}
                            <ThemeToggle />

                            <div className="relative" ref={notifRef}>
                                <button
                                    className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative"
                                    onClick={() => setNotifOpen(!notifOpen)}
                                >
                                    <span className="material-symbols-outlined">notifications</span>
                                    {notifications.length > 0 && (
                                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {notifOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[100]"
                                        >
                                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                    <FiBell className="text-blue-500" /> Notifikasi
                                                </h3>
                                                {notifications.length > 0 && (
                                                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase tracking-widest">{notifications.length} Baru</span>
                                                )}
                                            </div>
                                            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-slate-400">
                                                        <span className="material-symbols-outlined text-4xl opacity-20 mb-2">notifications_paused</span>
                                                        <p className="text-xs font-bold uppercase tracking-widest">Aman Terkendali</p>
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                                        {notifications.map(n => (
                                                            <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${n.type === 'danger' ? 'text-rose-500' : 'text-amber-500'}`}>{n.title}</p>
                                                                <p className="text-xs text-slate-600 dark:text-slate-300 font-bold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{n.message}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                            <div className="relative" ref={profileRef}>
                                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setProfileOpen(!profileOpen)}>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-bold leading-none text-slate-900 dark:text-white group-hover:text-primary transition-colors">{user?.name || 'Admin User'}</p>
                                        <p className="text-xs text-slate-500 font-medium">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Pemilik'}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all flex items-center justify-center">
                                        {/* Profile Picture Placeholder */}
                                        <div className="w-full h-full bg-linear-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm">
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

                {(activePage === 'pos' || activePage === 'pos-v1') ? (
                    children
                ) : (
                    <div className="flex-1 overflow-y-auto block print:overflow-visible w-full print:h-auto print:block bg-background-light dark:bg-background-dark min-w-0 pb-28 md:pb-0">
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
            {!(isFullscreen || activePage === 'pos' || activePage === 'pos-v1') && (
                <BottomNav activePage={activePage} onNavigate={onNavigate} />
            )}
        </div>
    );
}
