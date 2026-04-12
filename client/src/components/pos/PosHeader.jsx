import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight, FiZap, FiShoppingCart, FiBell, FiUser, FiSettings, FiLogOut, FiEdit, FiMaximize, FiInbox, FiSun, FiMoon } from 'react-icons/fi';
import ThemeToggle from '../ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';

export default function PosHeader({
    user,
    currentTime,
    onNavigate,
    isCartOpen,
    setIsCartOpen,
    cartCount,
    onOpenDrawer,
    onToggleFullscreen,
    storeSettings
}) {
    const { logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    return (
        <header className="print:hidden h-[72px] border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-8 shrink-0 sticky top-0 z-[60]">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center justify-center size-9 sm:size-10 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                        <span className="material-symbols-outlined text-xl sm:text-2xl">point_of_sale</span>
                    </div>
                    <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight leading-none text-slate-800 dark:text-white">
                        Kasir <span className="hidden sm:inline text-blue-600">Terpadu</span>
                    </h1>
                </div>

                <nav className="flex items-center h-[72px]">
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="relative flex items-center gap-2 px-3 sm:px-4 h-full text-blue-600 font-bold transition-all"
                    >
                        <FiMaximize className="hidden sm:inline" style={{ display: 'none' }} /> {/* Hidden helper */}
                        <span className="material-symbols-outlined">home</span>
                        <span className="hidden sm:inline">Beranda</span>
                        <motion.div
                            layoutId="activeTabPos"
                            className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"
                        />
                    </button>
                </nav>
            </div>

            <div className="hidden lg:flex items-center gap-4 px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                        {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-700"></div>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span className="text-lg font-black tracking-tighter italic leading-none">
                        {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 whitespace-nowrap">
                {/* Desktop Utility Pill */}
                <div className="hidden sm:flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 gap-1 shadow-sm">
                    <div className="scale-95"><ThemeToggle /></div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggleFullscreen}
                        title="Layar Penuh (F11)"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                    >
                        <FiMaximize className="text-xl" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onOpenDrawer}
                        title="Buka Laci Kasir (F8)"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                    >
                        <FiInbox className="text-xl" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCartOpen(!isCartOpen)}
                        title="Buka Keranjang"
                        className="p-2 rounded-xl text-blue-600 bg-blue-600/10 dark:bg-blue-600/20 border border-blue-600/20 relative shadow-sm"
                    >
                        <FiShoppingCart className="text-xl" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white border-2 border-white dark:border-slate-900 shadow-lg">
                                {cartCount}
                            </span>
                        )}
                    </motion.button>
                </div>

                {/* Mobile Cart Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCartOpen(!isCartOpen)}
                    className="sm:hidden p-2.5 rounded-xl text-blue-600 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 relative"
                >
                    <FiShoppingCart className="text-xl" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white border-2 border-white dark:border-slate-900">
                            {cartCount}
                        </span>
                    )}
                </motion.button>

                <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>

                <div className="relative">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        title="Informasi Profil & Pengaturan"
                        className="flex items-center gap-2 cursor-pointer group"
                    >
                        <div className="size-9 sm:size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="hidden xl:flex flex-col">
                            <span className="text-[13px] font-black text-slate-800 dark:text-white leading-none whitespace-nowrap group-hover:text-blue-600 transition-colors">{user?.name || 'Admin Utama'}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{user?.role || 'Admin'}</span>
                        </div>
                    </motion.div>

                    <AnimatePresence>
                        {isProfileOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-[-1]"
                                    onClick={() => setIsProfileOpen(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-3 overflow-hidden"
                                >
                                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 mb-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Akun Anda</p>
                                        <p className="text-sm font-black text-slate-800 dark:text-white truncate">{user?.name || 'Admin Utama'}</p>
                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{user?.role || 'Administrator'}</p>
                                    </div>

                                    <div className="px-2 space-y-1">
                                        <button
                                            onClick={() => { onNavigate('profile'); setIsProfileOpen(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all group"
                                        >
                                            <FiEdit className="text-lg group-hover:scale-110 transition-transform" />
                                            <span>Edit Profil</span>
                                        </button>
                                        <button
                                            onClick={() => { onNavigate('settings'); setIsProfileOpen(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all group"
                                        >
                                            <FiSettings className="text-lg group-hover:scale-110 transition-transform" />
                                            <span>Pengaturan POS</span>
                                        </button>

                                        {/* Mobile-only utilities inside profile menu */}
                                        <div className="sm:hidden border-t border-slate-100 dark:border-slate-700/50 my-1 pt-1">
                                            <button
                                                onClick={() => { onOpenDrawer(); setIsProfileOpen(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all"
                                            >
                                                <FiInbox className="text-lg" />
                                                <span>Buka Laci Kasir</span>
                                            </button>
                                            <button
                                                onClick={() => { onToggleFullscreen(); setIsProfileOpen(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all"
                                            >
                                                <FiMaximize className="text-lg" />
                                                <span>Layar Penuh</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-2 pt-2 px-2 border-t border-slate-100 dark:border-slate-700/50">
                                        <button
                                            onClick={() => { logout(); setIsProfileOpen(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all group"
                                        >
                                            <FiLogOut className="text-lg group-hover:translate-x-1 transition-transform" />
                                            <span>Keluar Sistem</span>
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
