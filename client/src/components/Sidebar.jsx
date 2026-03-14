import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiGrid, FiShoppingCart, FiPrinter, FiLayers, FiImage, FiSettings,
    FiUser, FiBox, FiUsers, FiCreditCard, FiActivity,
    FiLogOut, FiChevronDown, FiCommand, FiCpu, FiHash, FiTerminal,
    FiTool, FiSmartphone
} from 'react-icons/fi';
const FiSPK = FiLayers;
import { HiOutlineDocumentReport, HiOutlineCollection } from 'react-icons/hi';
import ConfirmationModal from './ConfirmationModal';

const MENU_GROUPS = [
    {
        title: 'Central Command',
        items: [
            { id: 'dashboard', label: 'Telemetry', icon: <FiGrid />, roles: ['admin', 'kasir', 'operator', 'teknisi', 'desainer'] },
            { id: 'pos', label: 'Nexus POS', icon: <FiShoppingCart />, roles: ['admin', 'kasir'] },
        ]
    },
    {
        title: 'Mission Operations',
        items: [
            {
                id: 'printing',
                label: 'Cortex Printing',
                icon: <FiPrinter />,
                roles: ['admin', 'kasir', 'operator'],
                subItems: [
                    { id: 'digital-printing', label: 'Quantum Digital', icon: <FiImage />, roles: ['admin', 'kasir', 'operator'] },
                    { id: 'production-queue', label: 'Atomic Stack', icon: <HiOutlineCollection />, roles: ['admin', 'operator', 'teknisi'] },
                    { id: 'cetak-offset', label: 'Kinetic Offset', icon: <FiLayers />, roles: ['admin', 'kasir', 'operator'] },
                    { id: 'stok-bahan', label: 'Material Core', icon: <FiBox />, roles: ['admin', 'operator'] },
                    { id: 'spk-list', label: 'SPK Protocols', icon: <FiSPK />, roles: ['admin', 'kasir', 'operator'] },
                    { id: 'manajemen-desainer', label: 'Design Ops', icon: <FiCpu />, roles: ['admin'] },
                ],
            },
            { id: 'service', label: 'Hardware Link', icon: <FiTool />, roles: ['admin', 'kasir', 'teknisi'] },
            { id: 'handover', label: 'Cargo Relay', icon: <FiHash />, roles: ['admin', 'kasir'] },
        ]
    },
    {
        title: 'Entity Database',
        items: [
            { id: 'inventory', label: 'Asset Ledger', icon: <FiBox />, roles: ['admin', 'kasir'] },
            { id: 'customers', label: 'Client Nodes', icon: <FiUsers />, roles: ['admin', 'kasir'] },
        ]
    },
    {
        title: 'Financial Sync',
        items: [
            { id: 'finance', label: 'Credit Flow', icon: <FiCreditCard />, roles: ['admin', 'kasir'] },
            { id: 'kasir-payment', label: 'Settlement Hub', icon: <FiHash />, roles: ['admin', 'kasir'] },
            { id: 'qris-monitor', label: 'QRIS Telemetry', icon: <FiSmartphone />, roles: ['admin'] },
            { id: 'reports', label: 'Audit Logs', icon: <HiOutlineDocumentReport />, roles: ['admin', 'kasir'] },
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
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-40 lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <motion.aside
                variants={sideVariants}
                initial="closed"
                animate={isOpen || window.innerWidth > 1024 ? "open" : "closed"}
                className="fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800/50 flex flex-col overflow-hidden"
            >
                {/* Visual Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col h-full relative z-10">
                    {/* Futuristic Terminal Header */}
                    <div className="p-8 pb-4">
                        <div className="flex items-center gap-4 mb-10 group cursor-default">
                            <div className="relative">
                                <motion.div
                                    className="bg-blue-600 size-12 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                                    whileHover={{ scale: 1.05, rotate: 5 }}
                                >
                                    <FiTerminal size={24} />
                                </motion.div>
                                <div className="absolute -top-1 -right-1 size-3 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-white text-lg font-black tracking-tighter italic uppercase leading-none group-hover:text-blue-500 transition-colors">
                                    Abadi <span className="text-blue-600">Jaya</span>
                                </h1>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-slate-500">Core Engine</span>
                                    <div className="h-0.5 w-4 bg-slate-800 rounded-full" />
                                    <span className="text-[9px] font-mono text-blue-500/50">v4.0_LX</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Stream */}
                    <nav className="flex-1 overflow-y-auto px-5 py-2 space-y-8 hide-scrollbar">
                        {MENU_GROUPS.map((group, gIdx) => {
                            const filteredItems = group.items.filter(item =>
                                user && (user.role === 'admin' || item.roles.includes(user.role))
                            );

                            if (filteredItems.length === 0) return null;

                            return (
                                <div key={gIdx} className="space-y-3">
                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic px-4 flex items-center gap-3">
                                        {group.title}
                                        <div className="h-[1px] flex-1 bg-slate-900" />
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
                                                        whileHover={{ x: 4, backgroundColor: highlightParent ? '' : 'rgba(30, 41, 59, 0.4)' }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => hasChildren ? toggleExpand(item.id) : handleNav(item.id)}
                                                        className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-black italic uppercase tracking-wider text-[11px] transition-all w-full text-left relative overflow-hidden group
                                                        ${highlightParent
                                                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                                                                : 'text-slate-500 hover:text-slate-300'
                                                            }`}
                                                    >
                                                        {highlightParent && (
                                                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                                                        )}
                                                        <span className={`text-lg ${highlightParent ? 'text-white' : 'text-slate-500 group-hover:text-blue-500'}`}>
                                                            {item.icon}
                                                        </span>
                                                        <span className="flex-1">{item.label}</span>
                                                        {hasChildren && (
                                                            <motion.div
                                                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                                                className="text-slate-600"
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
                                                                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                                                className="overflow-hidden bg-slate-900/10 rounded-2xl mx-1"
                                                            >
                                                                <div className="pt-1 pb-2 pl-4 space-y-1">
                                                                    {item.subItems
                                                                        .filter(sub => user && (user.role === 'admin' || sub.roles.includes(user.role)))
                                                                        .map((sub, sIdx) => {
                                                                            const subActive = activePage === sub.id;
                                                                            return (
                                                                                <motion.button
                                                                                    key={sub.id}
                                                                                    whileHover={{ x: 4, color: '#3b82f6' }}
                                                                                    whileTap={{ scale: 0.97 }}
                                                                                    onClick={() => handleNav(sub.id)}
                                                                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-black italic uppercase tracking-widest text-[10px] transition-all w-full text-left
                                                                                    ${subActive
                                                                                            ? 'bg-blue-600/10 text-blue-500'
                                                                                            : 'text-slate-600 hover:text-slate-400'
                                                                                        }`}
                                                                                >
                                                                                    <div className={`size-1 rounded-full ${subActive ? 'bg-blue-500' : 'bg-slate-800'}`} />
                                                                                    <span className="mr-2 text-sm opacity-50">{sub.icon}</span>
                                                                                    <span>{sub.label}</span>
                                                                                </motion.button>
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

                    {/* Telemetry Control Unit (Footer) */}
                    <div className="p-6 bg-slate-950 border-t border-slate-900 relative">
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

                        <div className="space-y-3">
                            <motion.button
                                whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.4)' }}
                                onClick={() => handleNav('settings')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-black italic uppercase tracking-[0.2em] text-[10px] transition-all w-full text-left
                                ${activePage === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 h-11'}`}
                            >
                                <FiSettings className={activePage === 'settings' ? 'animate-spin-slow' : ''} size={18} />
                                <span className="flex-1">Protocols</span>
                                {activePage !== 'settings' && <FiCommand className="text-slate-800" />}
                            </motion.button>

                            <div className="bg-slate-900/40 p-3 rounded-[1.5rem] border border-slate-800/50 flex items-center gap-3 group">
                                <div className="size-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black italic text-xs shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                    {user?.username?.substring(0, 2).toUpperCase() || 'OP'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black italic uppercase text-slate-300 leading-none truncate">{user?.username || 'Root'}</p>
                                    <p className="text-[9px] font-black italic uppercase text-blue-500/60 mt-1 tracking-tighter">Level {user?.role || 'Guest'}_Auth</p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, color: '#f43f5e' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="size-9 flex items-center justify-center text-slate-600 bg-slate-950 border border-slate-800 rounded-xl transition-all"
                                >
                                    <FiLogOut size={16} />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* Premium Confirmation Modal */}
            <ConfirmationModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={logout}
                title="TERMINATE SESSION"
                message="Are you sure you want to de-authorize this terminal session?"
                confirmText="Terminate Now"
                cancelText="Keep Alive"
                type="danger"
            />
        </>
    );
}

