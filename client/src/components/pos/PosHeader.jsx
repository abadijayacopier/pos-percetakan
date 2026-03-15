import React from 'react';
import { motion } from 'framer-motion';
import { FiChevronRight, FiZap, FiShoppingCart, FiBell, FiUser } from 'react-icons/fi';
import ThemeToggle from '../ThemeToggle';

export default function PosHeader({
    user,
    currentTime,
    onNavigate,
    isCartOpen,
    setIsCartOpen,
    cartCount,
    onOpenDrawer
}) {
    return (
        <header className="relative z-50 flex h-20 items-center justify-between px-8 bg-slate-900/40 backdrop-blur-3xl border-b border-slate-800/50">
            <div className="flex items-center gap-6">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigate('dashboard')}
                    className="flex items-center justify-center size-12 bg-slate-800/50 hover:bg-slate-800 rounded-2xl text-slate-300 transition-colors border border-slate-700/50 group"
                >
                    <FiChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={24} />
                </motion.button>

                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-10 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                            <FiZap className="text-xl" />
                        </div>
                        <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                            Abadi Jaya <span className="text-blue-500">Terminal</span>
                        </h1>
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic ml-13">Express Transaction Hub v4.0</p>
                </div>
            </div>

            <nav className="hidden lg:flex items-center gap-4 px-6 py-2 bg-slate-950/50 rounded-[2rem] border border-slate-800/50 backdrop-blur-md">
                <div className="flex items-center gap-2 text-slate-400">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                        {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
                <div className="w-px h-4 bg-slate-800"></div>
                <div className="flex items-center gap-2 text-blue-400">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span className="text-lg font-black tracking-tighter italic leading-none">
                        {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            </nav>

            <div className="flex items-center gap-4">
                {/* Cart Trigger (Mobile) */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCartOpen(!isCartOpen)}
                    className="lg:hidden relative flex items-center justify-center rounded-2xl h-12 w-12 bg-blue-600/10 text-blue-500 border border-blue-500/20"
                >
                    <FiShoppingCart size={22} />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white border-2 border-slate-950 shadow-lg">
                            {cartCount}
                        </span>
                    )}
                </motion.button>

                <div className="flex items-center gap-2">
                    <ThemeToggle className="hidden sm:flex" />
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onOpenDrawer}
                        title="Open Drawer (F8)"
                        className="hidden sm:flex items-center justify-center size-11 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-slate-400 hover:text-blue-500 transition-all"
                    >
                        <span className="material-symbols-outlined">inbox</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                        whileTap={{ scale: 0.95 }}
                        className="hidden sm:flex items-center justify-center size-11 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-slate-400 hover:text-blue-500 transition-all"
                    >
                        <FiBell size={18} />
                    </motion.button>
                </div>

                <div className="w-px h-8 bg-slate-800 mx-2"></div>

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-black italic uppercase tracking-widest text-white leading-none mb-1">{user?.name || 'Administrator'}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none italic">Active Terminal 01</p>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="size-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-[2px] shadow-lg shadow-blue-500/20"
                    >
                        <div className="size-full rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden">
                            {user?.name ? (
                                <span className="text-sm font-black italic">{user.name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
                            ) : (
                                <FiUser className="text-blue-400" size={18} />
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </header>
    );
}
