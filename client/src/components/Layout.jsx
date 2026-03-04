import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FiSun, FiMoon, FiBell, FiHelpCircle, FiLogOut, FiUser, FiMenu, FiSearch } from 'react-icons/fi';

export default function Layout({ activePage, onNavigate, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const { themeMode, setTheme } = useTheme();

    const PAGE_TITLES = {
        dashboard: 'Dasbor Utama',
        pos: 'Transaksi Baru',
        printing: 'Percetakan',
        service: 'Tiket Servis',
        inventory: 'Data Inventori',
        customers: 'Pelanggan',
        finance: 'Keuangan',
        reports: 'Laporan',
        settings: 'Pengaturan',
    };

    return (
        <div className="app-layout">
            <style>{`
                .app-layout {
                    background: var(--bg-primary);
                    color: var(--text-primary);
                }
                .p-top-header {
                    height: 64px;
                    min-height: 64px;
                    padding: 0 32px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border);
                }
                .p-header-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0;
                }
                .p-header-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .p-search-box {
                    position: relative;
                    width: 100%;
                    max-width: 500px;
                }
                .p-search-box input {
                    width: 100%;
                    padding: 8px 16px 8px 36px;
                    background: var(--bg-input);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-size: 0.85rem;
                    outline: none;
                    transition: 0.2s;
                }
                .p-search-box input:focus {
                    border-color: #2563eb;
                    background: var(--bg-secondary);
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }
                .p-search-box .icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-muted);
                    font-size: 1rem;
                }
                .p-icon-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                    cursor: pointer;
                    transition: 0.2s;
                    position: relative;
                }
                .p-icon-btn:hover {
                    background: var(--bg-input);
                    color: var(--text-primary);
                }
                .p-badge {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border-radius: 50%;
                    border: 2px solid var(--bg-secondary);
                }
                
                /* Layout Header New Elements */
                .h-theme-toggle {
                    display: flex;
                    gap: 4px;
                    padding: 3px;
                    background: var(--bg-input);
                    border-radius: 8px;
                    border: 1px solid var(--border);
                }
                .h-theme-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 6px 12px;
                    border: none;
                    border-radius: 6px;
                    background: transparent;
                    color: var(--text-muted);
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    gap: 6px;
                }
                .h-theme-btn:hover {
                    color: var(--text-primary);
                }
                .h-theme-btn.active {
                    background: #2563eb;
                    color: white;
                    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
                }
                
                .h-user-profile {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding-left: 12px;
                    border-left: 1px solid var(--border);
                }
                .h-avatar {
                    width: 36px;
                    height: 36px;
                    background: var(--bg-input);
                    border: 1px solid var(--border);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                }
                .h-user-info {
                    display: flex;
                    flex-direction: column;
                }
                .h-user-name {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    line-height: 1.2;
                }
                .h-user-role {
                    font-size: 0.7rem;
                    color: var(--text-muted);
                }
                
                .menu-toggle {
                    display: none;
                }
                @media (max-width: 1024px) {
                    .menu-toggle {
                        display: flex;
                    }
                }
                .p-btn-blue {
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .p-btn-blue:hover {
                    background: #1d4ed8;
                }
                @media (max-width: 768px) {
                    .p-top-header { padding: 0 16px; gap: 8px; overflow-x: auto; flex-wrap: wrap; height: auto; padding-top: 12px; padding-bottom: 12px;}
                    .p-search-box { order: 3; width: 100%; max-width: 100%; margin-top: 8px; }
                    .p-header-title { font-size: 0.95rem; white-space: nowrap; }
                    .h-user-info { display: none; }
                    .h-theme-btn span:last-child { display: none; } /* hide text on mobile */
                    .p-btn-blue { padding: 6px 12px; font-size: 0.8rem; white-space: nowrap; }
                    .p-icon-btn { width: 32px; height: 32px; }
                    .p-header-right { gap: 8px; }
                }
            `}</style>

            <Sidebar activePage={activePage} onNavigate={onNavigate} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="main-content" style={{ background: 'var(--bg-primary)' }}>
                <header className="p-top-header">
                    {/* LEFT: Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '200px' }}>
                        <button className="header-btn menu-toggle" onClick={() => setSidebarOpen(true)}><FiMenu /></button>
                        <h1 className="p-header-title">{PAGE_TITLES[activePage] || 'Dasbor Utama'}</h1>
                    </div>

                    {/* CENTER: Search */}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 20px' }}>
                        <div className="p-search-box">
                            <span className="icon"><FiSearch /></span>
                            <input type="text" placeholder="Cari transaksi, pelanggan, barang..." />
                        </div>
                    </div>

                    {/* RIGHT: Toggles & Profile */}
                    <div className="p-header-right" style={{ display: 'flex', gap: '16px', alignItems: 'center', minWidth: 'max-content' }}>

                        <div className="h-theme-toggle">
                            {[
                                { id: 'light', icon: FiSun, label: 'Terang' },
                                { id: 'dark', icon: FiMoon, label: 'Gelap' },
                            ].map(t => (
                                <button
                                    key={t.id}
                                    className={`h-theme-btn ${themeMode === t.id || (themeMode === 'system' && t.id === 'light') ? 'active' : ''}`}
                                    onClick={() => setTheme(t.id)}
                                    title={t.label}
                                >
                                    <span><t.icon size={14} /></span>
                                    <span>{t.label}</span>
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button className="p-icon-btn">
                                <FiBell size={18} />
                                <span className="p-badge"></span>
                            </button>
                            <button className="p-icon-btn" style={{ marginRight: '8px' }}>
                                <FiHelpCircle size={18} />
                            </button>
                        </div>

                        <div className="h-user-profile">
                            <div className="h-avatar">
                                <FiUser size={18} />
                            </div>
                            <div className="h-user-info">
                                <span className="h-user-name">{user?.name || 'Budi Santoso'}</span>
                                <span className="h-user-role">{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Super Admin'}</span>
                            </div>
                            <button
                                onClick={logout}
                                title="Keluar"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.2rem', marginLeft: '4px' }}>
                                <FiLogOut size={18} />
                            </button>
                        </div>

                    </div>
                </header>

                {activePage === 'pos' ? children : <div className="page-container">{children}</div>}
            </div>
        </div>
    );
}

