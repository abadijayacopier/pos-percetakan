import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiGrid, FiShoppingCart, FiPrinter, FiLayers, FiImage, FiSettings,
    FiUser, FiBox, FiUsers, FiCreditCard, FiActivity,
    FiLogOut, FiChevronDown, FiCommand, FiCpu, FiHash, FiTerminal,
    FiSmartphone,
    FiDollarSign
} from 'react-icons/fi';
const FiSPK = FiLayers;
import { HiOutlineDocumentReport, HiOutlineCollection } from 'react-icons/hi';
import ConfirmationModal from './ConfirmationModal';

const MENU_GROUPS = [
    {
        title: 'Utama',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: <FiGrid />, roles: ['admin', 'kasir', 'operator', 'teknisi', 'desainer'] },
            { id: 'pos', label: 'Kasir POS', icon: <FiShoppingCart />, roles: ['admin', 'kasir'] },
        ]
    },
    {
        title: 'Operasional',
        items: [
            {
                id: 'printing',
                label: 'Percetakan',
                icon: <FiPrinter />,
                roles: ['admin', 'kasir', 'operator'],
                subItems: [
                    { id: 'digital-printing', label: 'Digital Printing', icon: <FiImage />, roles: ['admin', 'kasir', 'operator'] },
                    { id: 'production-queue', label: 'Antrean Produksi', icon: <HiOutlineCollection />, roles: ['admin', 'operator', 'teknisi'] },
                    { id: 'cetak-offset', label: 'Cetak Offset', icon: <FiLayers />, roles: ['admin', 'kasir', 'operator'] },
                    { id: 'stok-bahan', label: 'Stok Bahan', icon: <FiBox />, roles: ['admin', 'operator'] },
                    { id: 'spk-list', label: 'Daftar SPK', icon: <FiSPK />, roles: ['admin', 'kasir', 'operator'] },
                    { id: 'manajemen-desainer', label: 'Manajemen Desain', icon: <FiCpu />, roles: ['admin'] },
                ],
            },
            { id: 'service', label: 'Service Fotocopy', icon: <FiCpu />, roles: ['admin', 'kasir', 'teknisi'] },
            { id: 'handover', label: 'Serah Terima', icon: <FiHash />, roles: ['admin', 'kasir'] },
        ]
    },
    {
        title: 'Data Master',
        items: [
            { id: 'inventory', label: 'Inventaris', icon: <FiBox />, roles: ['admin', 'kasir'] },
            { id: 'customers', label: 'Pelanggan', icon: <FiUsers />, roles: ['admin', 'kasir'] },
        ]
    },
    {
        title: 'Keuangan',
        items: [
            { id: 'finance', label: 'Kas & Keuangan', icon: <FiCreditCard />, roles: ['admin', 'kasir'] },
            { id: 'kasir-payment', label: 'Pembayaran', icon: <FiDollarSign />, roles: ['admin', 'kasir'] },
            { id: 'qris-monitor', label: 'Monitoring QRIS', icon: <FiSmartphone />, roles: ['admin'] },
            { id: 'reports', label: 'Laporan', icon: <HiOutlineDocumentReport />, roles: ['admin', 'kasir'] },
        ]
    },
];

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
    const { user, logout } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Track which parent menus are expanded (by item id)
    const [expanded, setExpanded] = useState(() => {
        const printingSubIds = ['digital-printing', 'production-queue', 'cetak-offset', 'stok-bahan', 'spk-list', 'manajemen-desainer'];
        return printingSubIds.includes(activePage) ? { printing: true } : {};
    });

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleNav = (id) => {
        onNavigate(id);
        if (window.innerWidth <= 768) onClose();
    };

    const sideVariants = {
        open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
        closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } }
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 10 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' }
        })
    };

    return (
        <>
            {/* Mobile Overlay with Blur */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/40 backdrop-blur-md z-[90] lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <motion.aside
                variants={sideVariants}
                initial="closed"
                animate={isOpen || (typeof window !== 'undefined' && window.innerWidth > 1024) ? "open" : "closed"}
                className="fixed lg:relative inset-y-0 left-0 z-[100] w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/50 flex flex-col overflow-hidden"
            >
                <div className="flex flex-col h-full relative z-10">
                    {/* Clean Simple Header */}
                    <div className="p-8 pb-8">
                        <div className="flex items-center gap-4 group cursor-default">
                            <div className="relative">
                                <motion.div
                                    className="bg-blue-600 size-11 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <FiPrinter size={22} />
                                </motion.div>
                                <div className="absolute -top-1 -right-1 size-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight leading-none">
                                    Abadi <span className="text-blue-600 dark:text-blue-500">Jaya</span>
                                </h1>
                                <span className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Percetakan & POS</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Stream */}
                    <nav className="flex-1 overflow-y-auto px-5 py-2 space-y-6 hide-scrollbar">
                        {MENU_GROUPS.map((group, gIdx) => {
                            const filteredItems = group.items.filter(item =>
                                user && (user.role === 'admin' || item.roles.includes(user.role))
                            );

                            if (filteredItems.length === 0) return null;

                            return (
                                <div key={gIdx} className="space-y-2">
                                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 flex items-center gap-3">
                                        {group.title}
                                        <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
                                    </div>

                                    <div className="space-y-1">
                                        {filteredItems.map((item, iIdx) => {
                                            const isActive = activePage === item.id;
                                            const hasChildren = item.subItems && item.subItems.length > 0;
                                            const isExpanded = !!expanded[item.id];
                                            const isParentOfActive = hasChildren && item.subItems.some(sub => activePage === sub.id);
                                            const highlightParent = isActive || isParentOfActive;

                                            return (
                                                <motion.div
                                                    key={item.id}
                                                    custom={iIdx}
                                                    variants={fadeInUp}
                                                    initial="hidden"
                                                    animate="visible"
                                                >
                                                    <motion.button
                                                        whileHover={{ x: 4 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => hasChildren ? toggleExpand(item.id) : handleNav(item.id)}
                                                        className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-[13px] tracking-tight transition-all w-full text-left relative overflow-hidden group
                                                        ${highlightParent
                                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                                                            }`}
                                                    >
                                                        <span className={`text-xl ${highlightParent ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                                                            {item.icon}
                                                        </span>
                                                        <span className="flex-1">{item.label}</span>
                                                        {hasChildren && (
                                                            <motion.div
                                                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                                                className={`transition-opacity ${highlightParent ? 'opacity-100 text-white' : 'opacity-50 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}
                                                            >
                                                                <FiChevronDown size={14} />
                                                            </motion.div>
                                                        )}
                                                    </motion.button>

                                                    <AnimatePresence>
                                                        {hasChildren && isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                                                className="overflow-hidden bg-slate-50 dark:bg-white/5 rounded-xl mt-1 mx-1"
                                                            >
                                                                <div className="py-1 px-1 space-y-1">
                                                                    {item.subItems
                                                                        .filter(sub => user && (user.role === 'admin' || sub.roles.includes(user.role)))
                                                                        .map((sub) => {
                                                                            const subActive = activePage === sub.id;
                                                                            return (
                                                                                <button
                                                                                    key={sub.id}
                                                                                    onClick={() => handleNav(sub.id)}
                                                                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[12px] font-medium transition-all w-full text-left
                                                                                    ${subActive
                                                                                            ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 relative'
                                                                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5'
                                                                                        }`}
                                                                                >
                                                                                    {subActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-blue-600 rounded-r-md" />}
                                                                                    <span className={`text-base ml-1 ${subActive ? 'text-blue-600 dark:text-blue-400' : 'opacity-50'}`}>{sub.icon}</span>
                                                                                    <span>{sub.label}</span>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>

                    {/* Footer / User Info */}
                    <div className="p-6 border-t border-slate-200 dark:border-slate-800/50">
                        <div className="space-y-4">
                            <button
                                onClick={() => handleNav('settings')}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-[13px] transition-all w-full text-left
                                ${activePage === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                            >
                                <FiSettings size={18} />
                                <span className="flex-1">Pengaturan</span>
                            </button>

                            <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center gap-3 group">
                                <div className="size-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                    {user?.username?.substring(0, 2).toUpperCase() || 'OP'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.username || 'Pengguna'}</p>
                                    <p className="text-[10px] text-slate-500 capitalize">{user?.role || 'Guest'}</p>
                                </div>
                                <button
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="size-8 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                >
                                    <FiLogOut size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.aside>

            <ConfirmationModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={logout}
                title="Keluar Sesi"
                message="Apakah Anda yakin ingin mengakhiri sesi ini?"
                confirmText="Keluar Sekarang"
                cancelText="Batal"
                type="danger"
            />
        </>
    );
}

