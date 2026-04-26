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
        <header className="print:hidden h-[80px] border-b border-slate-200/50 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl flex items-center justify-between px-8 shrink-0 sticky top-0 z-[60] shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-12">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => onNavigate('dashboard')}>
                    <div className="flex items-center justify-center size-12 bg-gradient-to-br from-primary to-primary-dark rounded-[1.2rem] text-white shadow-xl shadow-primary/20 rotate-[-4deg] hover:rotate-0 transition-transform duration-500">
                        <span className="material-symbols-outlined text-3xl font-black">point_of_sale</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter leading-tight text-slate-800 dark:text-white uppercase italic">
                            Kasir <span className="text-primary">Terpadu</span>
                        </h1>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mt-1">Enterprise <span className="text-primary">Pos</span></p>
                    </div>
                </div>

                <nav className="hidden xl:flex items-center gap-1">
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="relative flex items-center gap-3 px-6 py-2.5 rounded-full text-primary font-black uppercase text-xs tracking-widest bg-primary/5 hover:bg-primary/10 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">home</span>
                        <span>Beranda</span>
                        <div className="absolute -bottom-[23px] left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(var(--color-primary),0.5)]"></div>
                    </button>
                    <button
                        onClick={() => onNavigate('products')}
                        className="flex items-center gap-3 px-6 py-2.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white font-black uppercase text-xs tracking-widest transition-all hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">inventory_2</span>
                        <span>Stok</span>
                    </button>
                </nav>
            </div>

            <div className="hidden 2xl:flex items-center gap-6 px-8 py-3 bg-slate-500/[0.03] dark:bg-white/[0.02] rounded-[2rem] border-2 border-white dark:border-white/5 shadow-inner">
                <div className="flex items-center gap-3 text-slate-400">
                    <span className="material-symbols-outlined text-xl">calendar_today</span>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] leading-none">
                        {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
                <div className="w-px h-6 bg-slate-200 dark:bg-white/10"></div>
                <div className="flex items-center gap-3 text-primary">
                    <span className="material-symbols-outlined text-xl animate-pulse">schedule</span>
                    <span className="text-2xl font-black tracking-tighter italic leading-none font-mono">
                        {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3 whitespace-nowrap">
                {/* Desktop Utility Pill */}
                <div className="hidden sm:flex items-center p-1.5 bg-slate-500/[0.03] dark:bg-white/[0.02] rounded-2xl border-2 border-white dark:border-white/5 gap-2 shadow-inner">
                    <div className="px-1"><ThemeToggle /></div>
                    <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
                    
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onToggleFullscreen}
                        title="Layar Penuh (F11)"
                        className="p-2.5 rounded-xl text-slate-400 hover:text-primary transition-all"
                    >
                        <FiMaximize className="text-xl" />
                    </motion.button>
                    
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onOpenDrawer}
                        title="Buka Laci Kasir (F8)"
                        className="p-2.5 rounded-xl text-slate-400 hover:text-primary transition-all"
                    >
                        <FiInbox className="text-xl" />
                    </motion.button>
                    
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCartOpen(!isCartOpen)}
                        className={`px-5 py-2.5 rounded-xl flex items-center gap-3 transition-all relative border-2 ${isCartOpen ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' : 'bg-primary/10 text-primary border-transparent hover:border-primary/30'}`}
                    >
                        <FiShoppingCart className="text-xl" />
                        <span className="text-xs font-black uppercase tracking-widest hidden lg:inline">Pesanan</span>
                        {cartCount > 0 && (
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black border-2 shadow-lg transition-colors ${isCartOpen ? 'bg-white text-primary border-primary' : 'bg-rose-500 text-white border-white'}`}>
                                {cartCount}
                            </span>
                        )}
                    </motion.button>
                </div>

                <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-white/10 mx-2"></div>

                <div className="relative">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 cursor-pointer group bg-white dark:bg-slate-800 p-1 pr-4 rounded-full border-2 border-white dark:border-white/5 shadow-lg shadow-black/5"
                    >
                        <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/20">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="hidden xl:flex flex-col">
                            <span className="text-[13px] font-black text-slate-800 dark:text-white leading-none whitespace-nowrap group-hover:text-primary transition-colors uppercase tracking-tighter">{user?.name || 'Admin Utama'}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{user?.role || 'Admin'}</span>
                        </div>
                        <FiChevronRight className={`text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-90' : ''}`} />
                    </motion.div>

                    <AnimatePresence>
                        {isProfileOpen && (
                            <>
                                <div className="fixed inset-0 z-[-1]" onClick={() => setIsProfileOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                    className="absolute right-0 mt-4 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-2 border-white dark:border-white/5 py-5 overflow-hidden z-[70]"
                                >
                                    <div className="px-6 py-4 border-b-2 border-slate-50 dark:border-white/5 mb-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-1">Current Session</p>
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                                                {user?.name?.charAt(0) || 'A'}
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-slate-900 dark:text-white leading-none uppercase tracking-tighter">{user?.name || 'Admin Utama'}</p>
                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{user?.role || 'Administrator'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-3 space-y-1">
                                        <button
                                            onClick={() => { onNavigate('profile'); setIsProfileOpen(false); }}
                                            className="w-full flex items-center gap-4 px-5 py-3.5 text-[13px] font-black text-slate-600 dark:text-slate-400 hover:bg-primary/[0.03] hover:text-primary dark:hover:text-primary rounded-2xl transition-all group uppercase tracking-widest"
                                        >
                                            <div className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                <FiUser className="text-lg" />
                                            </div>
                                            <span>Profil</span>
                                        </button>
                                        <button
                                            onClick={() => { onNavigate('settings'); setIsProfileOpen(false); }}
                                            className="w-full flex items-center gap-4 px-5 py-3.5 text-[13px] font-black text-slate-600 dark:text-slate-400 hover:bg-primary/[0.03] hover:text-primary dark:hover:text-primary rounded-2xl transition-all group uppercase tracking-widest"
                                        >
                                            <div className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                <FiSettings className="text-lg" />
                                            </div>
                                            <span>Pengaturan</span>
                                        </button>
                                    </div>

                                    <div className="mt-4 pt-4 px-3 border-t-2 border-slate-50 dark:border-white/5">
                                        <button
                                            onClick={() => { logout(); setIsProfileOpen(false); }}
                                            className="w-full flex items-center gap-4 px-5 py-4 text-[13px] font-black text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all group uppercase tracking-widest"
                                        >
                                            <div className="size-8 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
                                                <FiLogOut className="text-lg" />
                                            </div>
                                            <span>Logout</span>
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
