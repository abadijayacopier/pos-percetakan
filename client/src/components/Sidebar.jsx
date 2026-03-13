import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const MENU_GROUPS = [
    {
        title: 'UTAMA',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['admin', 'kasir', 'operator', 'teknisi', 'desainer'] },
            { id: 'pos', label: 'Kasir/POS', icon: 'receipt_long', roles: ['admin', 'kasir'] },
        ]
    },
    {
        title: 'ORDER',
        items: [
            {
                id: 'printing',
                label: 'Percetakan',
                icon: 'print_connect',
                roles: ['admin', 'kasir', 'operator'],
                subItems: [
                    { id: 'digital-printing', label: 'Digital Printing', icon: 'local_printshop', roles: ['admin', 'kasir', 'operator'] },
                    { id: 'production-queue', label: 'Antrean Produksi', icon: 'view_kanban', roles: ['admin', 'operator', 'teknisi'] },
                    { id: 'cetak-offset', label: 'Cetak Offset', icon: 'print', roles: ['admin', 'kasir', 'operator'] },
                    { id: 'stok-bahan', label: 'Stok Bahan', icon: 'inventory_2', roles: ['admin', 'operator'] },
                    { id: 'spk-list', label: 'Daftar SPK', icon: 'description', roles: ['admin', 'kasir', 'operator'] },
                    { id: 'manajemen-desainer', label: 'Operator Desain', icon: 'palette', roles: ['admin'] },
                ],
            },
            { id: 'service', label: 'Service', icon: 'build', roles: ['admin', 'kasir', 'teknisi'] },
            { id: 'handover', label: 'Serah Terima', icon: 'local_mall', roles: ['admin', 'kasir'] },
        ]
    },
    {
        title: 'DATA',
        items: [
            { id: 'inventory', label: 'Inventori', icon: 'inventory_2', roles: ['admin', 'kasir'] },
            { id: 'customers', label: 'Pelanggan', icon: 'group', roles: ['admin', 'kasir'] },
        ]
    },
    {
        title: 'KEUANGAN',
        items: [
            { id: 'finance', label: 'Kas & Keuangan', icon: 'account_balance_wallet', roles: ['admin', 'kasir'] },
            { id: 'kasir-payment', label: 'Pelunasan Kasir', icon: 'payments', roles: ['admin', 'kasir'] },
            { id: 'qris-monitor', label: 'Monitor QRIS', icon: 'qr_code_scanner', roles: ['admin'] },
            { id: 'reports', label: 'Laporan', icon: 'bar_chart', roles: ['admin', 'kasir'] },
        ]
    },
    {
        title: 'SISTEM',
        items: [
            { id: 'wa-settings', label: 'Pengaturan WA', icon: 'chat', roles: ['admin'] },
        ]
    },
];

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
    const { user } = useAuth();

    // Track which parent menus are expanded (by item id)
    const [expanded, setExpanded] = useState(() => {
        // Auto-expand "printing" if any sub-page is active
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

    const isActiveOrChildActive = (item) => {
        if (activePage === item.id) return true;
        if (item.subItems) return item.subItems.some(sub => activePage === sub.id);
        return false;
    };

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={`print:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity lg:hidden ${isOpen ? 'opacity-100 block' : 'opacity-0 hidden'}`}
                onClick={onClose}
            />

            <aside className={`print:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 lg:relative lg:translate-x-0 overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/30">
                            <span className="material-symbols-outlined">print</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-slate-900 dark:text-white text-base font-bold leading-none">ABADI JAYA</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Dashboard Admin</p>
                        </div>
                    </div>

                    <nav className="flex-1 flex flex-col gap-6">
                        {MENU_GROUPS.map((group, groupIndex) => {
                            const filteredItems = group.items.filter(item =>
                                user && (user.role === 'admin' || item.roles.includes(user.role))
                            );

                            if (filteredItems.length === 0) return null;

                            return (
                                <div key={groupIndex} className="flex flex-col gap-1">
                                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-3">{group.title}</div>
                                    {filteredItems.map(item => {
                                        const isActive = activePage === item.id;
                                        const hasChildren = item.subItems && item.subItems.length > 0;
                                        const isExpanded = !!expanded[item.id];
                                        const isParentOfActive = hasChildren && item.subItems.some(sub => activePage === sub.id);
                                        const highlightParent = isActive || isParentOfActive;

                                        return (
                                            <div key={item.id}>
                                                {/* Parent button */}
                                                <button
                                                    onClick={() => {
                                                        if (hasChildren) {
                                                            toggleExpand(item.id);
                                                        } else {
                                                            handleNav(item.id);
                                                        }
                                                    }}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors w-full text-left
                                                        ${highlightParent
                                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                                >
                                                    <span className="material-symbols-outlined">{item.icon}</span>
                                                    <span className="text-sm flex-1">{item.label}</span>
                                                    {hasChildren && (
                                                        <span
                                                            className="material-symbols-outlined transition-transform duration-200"
                                                            style={{
                                                                fontSize: '18px',
                                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                            }}
                                                        >
                                                            expand_more
                                                        </span>
                                                    )}
                                                </button>

                                                {/* Sub-menu items */}
                                                {hasChildren && (
                                                    <div
                                                        style={{
                                                            maxHeight: isExpanded ? `${item.subItems.length * 60}px` : '0px',
                                                            overflow: 'hidden',
                                                            transition: 'max-height 0.25s cubic-bezier(0.4,0,0.2,1)',
                                                        }}
                                                    >
                                                        <div className="mt-1 flex flex-col gap-0.5 pl-4">
                                                            {/* Vertical connector line */}
                                                            <div className="relative">
                                                                {item.subItems
                                                                    .filter(sub => user && (user.role === 'admin' || sub.roles.includes(user.role)))
                                                                    .map((sub, si, arr) => {
                                                                        const subActive = activePage === sub.id;
                                                                        return (
                                                                            <div key={sub.id} className="relative flex items-center">
                                                                                {/* Tree line */}
                                                                                <div className="flex flex-col items-center mr-2" style={{ width: 16 }}>
                                                                                    <div style={{
                                                                                        width: 1,
                                                                                        height: si === 0 ? 20 : 10,
                                                                                        background: 'var(--border)',
                                                                                    }} />
                                                                                    <div style={{
                                                                                        width: 12,
                                                                                        height: 1,
                                                                                        background: 'var(--border)',
                                                                                        alignSelf: 'flex-end',
                                                                                    }} />
                                                                                    {si < arr.length - 1 && (
                                                                                        <div style={{ flex: 1, width: 1, background: 'var(--border)', minHeight: 10 }} />
                                                                                    )}
                                                                                </div>
                                                                                <button
                                                                                    onClick={() => handleNav(sub.id)}
                                                                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors w-full text-left my-0.5
                                                                                        ${subActive
                                                                                            ? 'bg-primary/10 text-primary font-semibold'
                                                                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                                                                >
                                                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{sub.icon}</span>
                                                                                    <span className="text-xs">{sub.label}</span>
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </nav>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                        <button
                            onClick={() => handleNav('settings')}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors w-full text-left
                                ${activePage === 'settings'
                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <span className="material-symbols-outlined">settings</span>
                            <span className="text-sm">Pengaturan</span>
                        </button>
                        <button className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mt-2">
                            <span className="material-symbols-outlined text-lg">support_agent</span>
                            Pusat Bantuan
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
