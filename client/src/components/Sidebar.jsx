import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiGrid, FiShoppingCart, FiPrinter, FiLayers, FiImage, FiSettings,
    FiUser, FiBox, FiUsers, FiCreditCard, FiActivity,
    FiLogOut, FiChevronDown, FiCommand, FiCpu, FiHash, FiTerminal,
    FiSmartphone,
    FiDollarSign,
    FiTrendingUp,
    FiPackage,
    FiTruck,
    FiChevronLeft
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
            { id: 'inventory', label: 'Barang ATK', icon: <FiBox />, roles: ['admin', 'kasir'] },
            { id: 'pembelian', label: 'Barang Masuk', icon: <FiPackage />, roles: ['admin', 'operator'] },
            { id: 'suppliers', label: 'Data Supplier', icon: <FiTruck />, roles: ['admin', 'operator'] },
            { id: 'customers', label: 'Pelanggan', icon: <FiUsers />, roles: ['admin', 'kasir'] },
        ]
    },
    {
        title: 'Keuangan',
        items: [
            { id: 'finance', label: 'Kas & Keuangan', icon: <FiCreditCard />, roles: ['admin'] },
            { id: 'kasir-payment', label: 'Pembayaran', icon: <FiDollarSign />, roles: ['admin', 'kasir'] },
            { id: 'qris-monitor', label: 'Monitoring QRIS', icon: <FiSmartphone />, roles: ['admin'] },
            { id: 'reports', label: 'Laporan', icon: <HiOutlineDocumentReport />, roles: ['admin'] },
        ]
    },
];

export default function Sidebar({ activePage, onNavigate, isOpen, onClose, isCollapsed, toggleCollapse }) {
    const { user, logout } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Add event listener to detect desktop screen size robustly
    const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth > 1024 : true);

    React.useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth > 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Track which parent menus are expanded (by item id)
    const [expanded, setExpanded] = useState(() => {
        const printingSubIds = ['digital-printing', 'production-queue', 'cetak-offset', 'stok-bahan', 'spk-list', 'manajemen-desainer'];
        return printingSubIds.includes(activePage) ? { printing: true } : {};
    });

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleNav = (id) => {
        let targetId = id;
        if (targetId === 'dashboard' && user?.role === 'desainer') {
            targetId = 'dashboard-desainer';
        }
        onNavigate(targetId);
        if (window.innerWidth < 1024) onClose();
    };

    const sideVariants = {
        open: { x: 0, transition: { type: 'spring', stiffness: 500, damping: 35 } },
        closed: { x: '-100%', transition: { type: 'spring', stiffness: 450, damping: 40 } }
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 10 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.015, duration: 0.2, ease: 'easeOut' }
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
                animate={isOpen || isDesktop ? "open" : "closed"}
                className={`shrink-0 fixed lg:relative inset-y-0 left-0 z-[100] ${isCollapsed && isDesktop ? 'w-[88px]' : 'w-[280px]'} 
                bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 
                flex flex-col overflow-visible shadow-[4px_0_24px_rgba(0,0,0,0.02)] print:hidden`}
            >
                <div className="flex flex-col h-full relative z-10">
                    {/* Clean Simple Header */}
                    <div className={`p-4 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col ${isCollapsed && isDesktop ? 'items-center' : ''}`}>
                        <div className={`flex items-center gap-3 cursor-default w-full ${isCollapsed && isDesktop ? 'justify-center' : ''}`}>
                            <div className="relative shrink-0">
                                <motion.div
                                    className="bg-blue-600 size-10 rounded-full flex items-center justify-center text-white"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <FiPrinter size={20} />
                                </motion.div>
                                <div className="absolute top-0 right-0 size-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                            </div>
                            {!(isCollapsed && isDesktop) && (
                                <div className="flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300">
                                    <h1 className="text-slate-900 dark:text-white text-lg font-black tracking-tighter leading-none italic uppercase">
                                        Abadi <span className="text-blue-600 dark:text-blue-500">Jaya</span>
                                    </h1>
                                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Percetakan & POS</span>
                                </div>
                            )}

                            <button onClick={onClose} className="lg:hidden ml-auto p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                <span className="material-symbols-outlined text-2xl flex items-center justify-center relative -right-1">close</span>
                            </button>
                        </div>

                        {isDesktop && (
                            <button
                                onClick={toggleCollapse}
                                className="absolute -right-3.5 top-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full p-1 text-slate-400 hover:text-blue-600 hover:scale-110 hover:shadow-md shadow-sm z-50 transition-all"
                                title={isCollapsed ? "Perbesar Menu" : "Perkecil Menu"}
                            >
                                <FiChevronLeft size={16} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
                            </button>
                        )}
                    </div>

                    {/* Navigation Stream */}
                    <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-700 bg-transparent">
                        {MENU_GROUPS.map((group, gIdx) => {
                            const userRole = user?.role ? String(user.role).toLowerCase() : '';
                            const filteredItems = group.items.filter(item =>
                                userRole === 'admin' || item.roles?.includes(userRole) || userRole === 'pemilik'
                            );

                            if (filteredItems.length === 0) return null;

                            return (
                                <div key={gIdx} className="space-y-1">
                                    {!(isCollapsed && isDesktop) ? (
                                        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-3">
                                            {group.title}
                                        </div>
                                    ) : (
                                        <div className="h-4 border-b border-slate-100 dark:border-slate-800/60 w-1/2 mx-auto mb-3" aria-hidden="true" />
                                    )}

                                    <div className={`space-y-1.5 ${isCollapsed && isDesktop ? 'flex flex-col items-center' : ''}`}>
                                        {filteredItems.map((item, iIdx) => {
                                            const isActive = activePage === item.id;
                                            const hasChildren = item.subItems && item.subItems.length > 0;
                                            const isExpanded = !!expanded[item.id];
                                            const isParentOfActive = hasChildren && item.subItems.some(sub => activePage === sub.id);
                                            const highlightParent = isActive || isParentOfActive;
                                            const userRoleNormalized = (user?.role || '').toLowerCase();
                                            const isAdminOrPemilik = userRoleNormalized === 'admin' || userRoleNormalized === 'pemilik';

                                            return (
                                                <motion.div
                                                    key={item.id}
                                                    custom={iIdx}
                                                    variants={fadeInUp}
                                                    initial="hidden"
                                                    animate="visible"
                                                >
                                                    <motion.button
                                                        whileHover={{ x: isCollapsed && isDesktop ? 0 : 4, scale: isCollapsed && isDesktop ? 1.05 : 1 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => {
                                                            if (hasChildren) {
                                                                if (isCollapsed && isDesktop) {
                                                                    toggleCollapse(); // Expand global sidebar
                                                                    setExpanded(prev => ({ ...prev, [item.id]: true })); // Buka spesifik accordion
                                                                } else {
                                                                    toggleExpand(item.id);
                                                                }
                                                            } else {
                                                                handleNav(item.id);
                                                            }
                                                        }}
                                                        title={isCollapsed && isDesktop ? item.label : undefined}
                                                        className={`flex items-center gap-3 py-2.5 rounded-xl font-semibold text-[13px] tracking-wide transition-all outline-none relative group
                                                        ${isCollapsed && isDesktop ? 'justify-center w-12 px-0' : 'w-full px-3 text-left'}
                                                        ${highlightParent
                                                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold shadow-sm ring-1 ring-blue-500/20'
                                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                                                            }`}
                                                    >
                                                        <span className={`text-[18px] transition-colors shrink-0 ${highlightParent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400'}`}>
                                                            {item.icon}
                                                        </span>
                                                        {!(isCollapsed && isDesktop) && (
                                                            <>
                                                                <span className="flex-1 whitespace-nowrap overflow-hidden text-clip">{item.label}</span>
                                                                {hasChildren && (
                                                                    <motion.div
                                                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                                                        className={`transition-opacity shrink-0 ${highlightParent ? 'opacity-100 text-white' : 'opacity-50 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}
                                                                    >
                                                                        <FiChevronDown size={14} />
                                                                    </motion.div>
                                                                )}
                                                            </>
                                                        )}
                                                    </motion.button>

                                                    <AnimatePresence>
                                                        {hasChildren && isExpanded && !(isCollapsed && isDesktop) && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                                                className="overflow-hidden bg-transparent mt-1 ml-4 border-l-2 border-slate-100 dark:border-slate-800/80 pl-2"
                                                            >
                                                                <div className="py-1 space-y-1">
                                                                    {item.subItems
                                                                        .filter(sub => {
                                                                            return isAdminOrPemilik || sub.roles?.includes(userRoleNormalized);
                                                                        })
                                                                        .map((sub) => {
                                                                            const subActive = activePage === sub.id;
                                                                            return (
                                                                                <button
                                                                                    key={sub.id}
                                                                                    onClick={() => handleNav(sub.id)}
                                                                                    className={`flex items-center gap-3 px-3 py-2 text-[12px] font-medium tracking-wide transition-all w-full text-left rounded-lg group
                                                                                    ${subActive
                                                                                            ? 'text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20 font-semibold'
                                                                                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-white/5'
                                                                                        }`}
                                                                                >
                                                                                    {subActive && <div className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                                                                                    <span className={`text-[16px] transition-colors ${subActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-blue-500'}`}>{sub.icon}</span>
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
                    <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className={`space-y-2 flex flex-col ${isCollapsed && isDesktop ? 'items-center' : ''}`}>
                            {((user?.role || '').toLowerCase() === 'admin' || (user?.role || '').toLowerCase() === 'pemilik') && (
                                <button
                                    onClick={() => handleNav('settings')}
                                    title={isCollapsed && isDesktop ? "Pengaturan Sistem" : undefined}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-full font-bold text-[10px] uppercase tracking-wider transition-all border-2
                                    ${isCollapsed && isDesktop ? 'w-10 h-10 px-0' : 'w-full px-4 text-center'}
                                    ${activePage === 'settings'
                                            ? 'bg-white text-blue-600 border-blue-600'
                                            : 'bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                >
                                    <FiSettings size={isCollapsed && isDesktop ? 16 : 14} />
                                    {!(isCollapsed && isDesktop) && <span>Pengaturan Sistem</span>}
                                </button>
                            )}

                            <div className={`bg-white dark:bg-slate-950 px-3 py-2 rounded-full border-2 border-slate-200 dark:border-slate-800 flex items-center group
                                ${isCollapsed && isDesktop ? 'justify-center p-1 border-none bg-transparent dark:bg-transparent px-1' : 'justify-between'}`}>
                                <div className={`flex items-center gap-3 min-w-0 ${isCollapsed && isDesktop ? 'justify-center' : ''}`}>
                                    <div className={`size-8 bg-[#f1f5f9] dark:bg-slate-800 rounded-full flex items-center justify-center text-[#334155] dark:text-slate-300 font-black text-[10px] border border-slate-200 dark:border-slate-700 shrink-0
                                        ${isCollapsed && isDesktop && 'ring-2 ring-transparent hover:ring-blue-500 transition-all cursor-pointer'}`}
                                        title={isCollapsed && isDesktop ? user?.username || 'ADMIN' : undefined}>
                                        {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
                                    </div>
                                    {!(isCollapsed && isDesktop) && (
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <p className="text-[11px] font-black text-slate-900 dark:text-white truncate uppercase tracking-tight italic">{user?.username || 'ADMIN'}</p>
                                            <p className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest mt-0.5 truncate">{user?.role || 'ADMIN'}</p>
                                        </div>
                                    )}
                                </div>
                                {!(isCollapsed && isDesktop) && (
                                    <button
                                        onClick={() => setShowLogoutConfirm(true)}
                                        className="size-8 flex items-center justify-center text-slate-400 hover:text-blue-600 rounded-full transition-colors shrink-0"
                                    >
                                        <FiLogOut size={14} />
                                    </button>
                                )}
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

