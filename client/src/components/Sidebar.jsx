import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    FiGrid, FiShoppingCart, FiPrinter, FiTool, FiPackage,
    FiUsers, FiDollarSign, FiFileText, FiSettings, FiLogOut,
    FiSun, FiMoon
} from 'react-icons/fi';

const MENU_GROUPS = [
    {
        title: 'UTAMA',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: FiGrid, roles: ['admin', 'kasir', 'operator', 'teknisi'] },
            { id: 'pos', label: 'Kasir/POS', icon: FiShoppingCart, roles: ['admin', 'kasir'] },
        ]
    },
    {
        title: 'ORDER',
        items: [
            { id: 'printing', label: 'Percetakan', icon: FiPrinter, roles: ['admin', 'kasir', 'operator'] },
            { id: 'service', label: 'Service', icon: FiTool, roles: ['admin', 'kasir', 'teknisi'] },
        ]
    },
    {
        title: 'DATA',
        items: [
            { id: 'inventory', label: 'Inventori', icon: FiPackage, roles: ['admin', 'kasir'] },
            { id: 'customers', label: 'Pelanggan', icon: FiUsers, roles: ['admin', 'kasir'] },
        ]
    },
    {
        title: 'KEUANGAN',
        items: [
            { id: 'finance', label: 'Kas & Keuangan', icon: FiDollarSign, roles: ['admin', 'kasir'] },
            { id: 'reports', label: 'Laporan', icon: FiFileText, roles: ['admin', 'kasir'] },
        ]
    },
];

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
    const { user, logout } = useAuth();
    const { themeMode, setTheme } = useTheme();

    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

    const handleNav = (id) => {
        onNavigate(id);
        if (window.innerWidth <= 768) onClose();
    };

    return (
        <>
            <style>{`
                .premium-sidebar {
                    width: 260px;
                    min-width: 260px;
                    background: var(--sidebar-bg, #ffffff);
                    border-right: 1px solid var(--sidebar-border, #f1f5f9);
                    display: flex;
                    flex-direction: column;
                    z-index: 100;
                    height: 100vh;
                    font-family: 'Inter', sans-serif;
                }
                [data-theme="light"] .premium-sidebar,
                :root .premium-sidebar {
                    --sidebar-bg: #ffffff;
                    --sidebar-border: #f1f5f9;
                    --sidebar-text: #1e293b;
                    --sidebar-text-muted: #64748b;
                    --sidebar-hover: #f8fafc;
                    --sidebar-avatar-bg: #f1f5f9;
                }
                [data-theme="dark"] .premium-sidebar {
                    --sidebar-bg: #0f172a;
                    --sidebar-border: #1e293b;
                    --sidebar-text: #e2e8f0;
                    --sidebar-text-muted: #94a3b8;
                    --sidebar-hover: #1e293b;
                    --sidebar-avatar-bg: #1e293b;
                }
                .s-brand {
                    padding: 24px 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .s-brand-icon {
                    width: 40px;
                    height: 40px;
                    background: #2563eb;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.5rem;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
                }
                .s-brand-info h3 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--sidebar-text, #1e293b);
                }
                .s-brand-info span {
                    font-size: 0.75rem;
                    color: var(--sidebar-text-muted, #64748b);
                }
                .s-nav {
                    flex: 1;
                    padding: 12px 16px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .s-nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 8px;
                    color: var(--sidebar-text-muted, #64748b);
                    font-size: 0.9rem;
                    font-weight: 500;
                    background: none;
                    border: none;
                    cursor: pointer;
                    width: 100%;
                    text-align: left;
                    transition: all 0.2s;
                }
                .s-nav-item:hover {
                    background: var(--sidebar-hover, #f8fafc);
                    color: var(--sidebar-text, #1e293b);
                }
                .s-nav-item.active {
                    background: #2563eb;
                    color: white;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
                }
                .s-nav-item .s-icon {
                    font-size: 1.2rem;
                }
                .s-footer {
                    padding: 16px 16px 20px;
                    border-top: 1px solid var(--sidebar-border, #f1f5f9);
                }
                .s-group-title {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--sidebar-text-muted, #94a3b8);
                    margin: 16px 16px 8px 16px;
                    letter-spacing: 0.5px;
                }
                .nav-group {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                /* Theme Toggle */
                .s-theme-toggle {
                    display: flex;
                    gap: 4px;
                    padding: 3px;
                    background: var(--sidebar-avatar-bg, #f1f5f9);
                    border-radius: 10px;
                    margin-bottom: 16px;
                }
                .s-theme-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: 8px 4px;
                    border: none;
                    border-radius: 8px;
                    background: transparent;
                    color: var(--sidebar-text-muted, #64748b);
                    font-size: 0.7rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }
                .s-theme-btn:hover {
                    color: var(--sidebar-text, #1e293b);
                }
                .s-theme-btn.active {
                    background: #2563eb;
                    color: white;
                    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
                }
                .s-theme-btn .t-icon {
                    font-size: 0.85rem;
                }

                .s-user-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-top: 0;
                    padding: 0 8px;
                }
                .s-avatar {
                    width: 36px;
                    height: 36px;
                    background: var(--sidebar-avatar-bg, #f1f5f9);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--sidebar-text-muted, #64748b);
                    font-weight: 600;
                    font-size: 0.85rem;
                }
                .s-user-details .s-name {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--sidebar-text, #1e293b);
                    margin: 0;
                }
                .s-user-details .s-role {
                    font-size: 0.7rem;
                    color: var(--sidebar-text-muted, #94a3b8);
                }

                @media (max-width: 1024px) {
                    .premium-sidebar {
                        position: fixed;
                        left: -260px;
                        top: 0;
                        bottom: 0;
                        transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 4px 0 24px rgba(0,0,0,0.15);
                    }
                    .premium-sidebar.open {
                        left: 0;
                    }
                    .sidebar-overlay {
                        display: none;
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(15, 23, 42, 0.6);
                        z-index: 99;
                        backdrop-filter: blur(4px);
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    .sidebar-overlay.open {
                        display: block;
                        opacity: 1;
                    }
                    .s-nav-item {
                        padding: 16px;
                        font-size: 1rem;
                    }
                }
            `}</style>

            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <aside className={`premium-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="s-brand">
                    <div className="s-brand-icon"><FiPrinter size={24} /></div>
                    <div className="s-brand-info">
                        <h3>ABADI JAYA</h3>
                        <span>POINT OF SALE</span>
                    </div>
                </div>

                <nav className="s-nav">
                    {MENU_GROUPS.map((group, groupIndex) => {
                        const filteredItems = group.items.filter(item =>
                            user && (user.role === 'admin' || item.roles.includes(user.role))
                        );

                        if (filteredItems.length === 0) return null;

                        return (
                            <div key={groupIndex} className="nav-group">
                                <div className="s-group-title">{group.title}</div>
                                {filteredItems.map(item => (
                                    <button
                                        key={item.id}
                                        className={`s-nav-item ${activePage === item.id ? 'active' : ''}`}
                                        onClick={() => handleNav(item.id)}
                                    >
                                        <span className="s-icon"><item.icon /></span>
                                        {item.label}
                                        {item.badge && <span className="nav-badge">{item.badge}</span>}
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </nav>

                <div className="s-footer">
                    <button
                        className={`s-nav-item ${activePage === 'settings' ? 'active' : ''}`}
                        onClick={() => handleNav('settings')}
                    >
                        <span className="s-icon"><FiSettings /></span>
                        Pengaturan
                    </button>
                </div>
            </aside>
        </>
    );
}

