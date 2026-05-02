import { useState, useEffect } from 'react';
import api from './services/api';
import './App.css';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import IntegratedPos from './pages/IntegratedPos';
import DigitalPrintingPage from './pages/DigitalPrintingPage';
import ProductionQueuePage from './pages/ProductionQueuePage';
import OffsetPrintingPage from './pages/OffsetPrintingPage';
import MaterialsPage from './pages/MaterialsPage';
import SPKListPage from './pages/SPKListPage';
import DesignerManagementPage from './pages/DesignerManagementPage';
import ServicePage from './pages/ServicePage';
import HandoverPage from './pages/HandoverPage';
import DesignerDashboardPage from './pages/DesignerDashboardPage';
import TechnicianDashboardPage from './pages/TechnicianDashboardPage';
import ReceivablesPage from './pages/ReceivablesPage';
import InventoryPage from './pages/InventoryPage';
import DamagedGoodsPage from './pages/DamagedGoodsPage';
import PurchasingPage from './pages/PurchasingPage';
import SuppliersPage from './pages/SuppliersPage';
import CustomersPage from './pages/CustomersPage';
import FinancePage from './pages/FinancePage';
import PayrollPage from './pages/PayrollPage';
import CashierPaymentPage from './pages/CashierPaymentPage';
import QRISMonitorPage from './pages/QRISMonitorPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

// POS Abadi Jaya - Main Application Entry
// Version: 1.1.3 (Scroll Fix Edition)

function App() {
    const { user, loading } = useAuth();
    const [activePage, setActivePage] = useState('dashboard');
    const [pageOptions, setPageOptions] = useState({});
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [storeSettings, setStoreSettings] = useState({ name: '', logo: '' });
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            const sMap = {};
            res.data.forEach(s => { sMap[s.key] = s.value; });
            setStoreSettings({
                name: sMap.store_name || '',
                logo: sMap.store_logo || ''
            });
        } catch (e) {
            console.error("Failed to fetch settings:", e);
        }
    };

    useEffect(() => {
        if (user) {
            fetchSettings();
        }

        const handleRefresh = () => fetchSettings();
        window.addEventListener('sync-branding', handleRefresh);
        return () => window.removeEventListener('sync-branding', handleRefresh);
    }, [user]);

    useEffect(() => {
        if (storeSettings.name) {
            document.title = `${storeSettings.name} - POS Percetakan`;
        }
    }, [storeSettings.name]);

    const handleNavigate = (page, options = {}) => {
        setActivePage(page);
        setPageOptions(options || {});
        if (window.innerWidth < 1024) setSidebarOpen(false);
    };

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4 animate-spin" />
                <p className="text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase text-xs">Memuat Aplikasi...</p>
            </div>
        );
    }

    if (!user) return <LoginPage storeSettings={storeSettings} />;

    const renderPage = () => {
        const props = { onNavigate: handleNavigate, storeSettings, ...pageOptions };
        switch (activePage) {
            case 'dashboard': return <DashboardPage {...props} />;
            case 'pos': return <IntegratedPos {...props} />;
            case 'digital-printing': return <DigitalPrintingPage {...props} />;
            case 'production-queue': return <ProductionQueuePage {...props} />;
            case 'cetak-offset': return <OffsetPrintingPage {...props} />;
            case 'stok-bahan': return <MaterialsPage {...props} />;
            case 'spk-list': return <SPKListPage {...props} />;
            case 'manajemen-desainer': return <DesignerManagementPage {...props} />;
            case 'service': return <ServicePage {...props} />;
            case 'handover': return <HandoverPage {...props} />;
            case 'dashboard-desainer': return <DesignerDashboardPage {...props} />;
            case 'dashboard-teknisi': return <TechnicianDashboardPage {...props} />;
            case 'receivables': return <ReceivablesPage {...props} />;
            case 'inventory': return <InventoryPage {...props} />;
            case 'damaged-goods': return <DamagedGoodsPage {...props} />;
            case 'pembelian': return <PurchasingPage {...props} />;
            case 'suppliers': return <SuppliersPage {...props} />;
            case 'customers': return <CustomersPage {...props} />;
            case 'finance': return <FinancePage {...props} />;
            case 'payroll': return <PayrollPage {...props} />;
            case 'kasir-payment': return <CashierPaymentPage {...props} />;
            case 'qris-monitor': return <QRISMonitorPage {...props} />;
            case 'reports': return <ReportsPage {...props} />;
            case 'settings': return <SettingsPage {...props} />;
            default: return <DashboardPage {...props} />;
        }
    };

    return (
        <Layout 
            activePage={activePage} 
            onNavigate={handleNavigate} 
            isSidebarOpen={isSidebarOpen} 
            setSidebarOpen={setSidebarOpen}
            storeSettings={storeSettings}
        >
            <div className="w-full min-h-0">
                {renderPage()}
            </div>
            
            {/* Version Label Floating */}
            <div className="fixed bottom-4 right-4 z-50 pointer-events-none opacity-20 group">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] group-hover:opacity-100 transition-opacity">v1.1.4 (PRO MAX)</span>
            </div>
        </Layout>
    );
}

export default App;
