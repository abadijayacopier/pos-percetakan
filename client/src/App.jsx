import { useState, useEffect } from 'react';
import './App.css';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PosPage from './pages/PosPage';
import IntegratedPos from './pages/IntegratedPos';
import PrintingPage from './pages/PrintingPage';
import DigitalPrintingPage from './pages/DigitalPrintingPage';
import OffsetPrintingPage from './pages/OffsetPrintingPage';
import MaterialsPage from './pages/MaterialsPage';
import MaterialFormPage from './pages/MaterialFormPage';
import ServicePage from './pages/ServicePage';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
import FinancePage from './pages/FinancePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import SPKListPage from './pages/SPKListPage';
import SPKDetailPage from './pages/SPKDetailPage';
import SPKSettlementPage from './pages/SPKSettlementPage';
import CashierPaymentPage from './pages/CashierPaymentPage';
import HandoverPage from './pages/HandoverPage';
import WASettingsPage from './pages/WASettingsPage';
import PrintInvoicePage from './pages/PrintInvoicePage';
import PrintLabelPage from './pages/PrintLabelPage';
import PrintSPKPage from './pages/PrintSPKPage';
import QRISMonitorPage from './pages/QRISMonitorPage';
import DesignFinalizationPage from './pages/DesignFinalizationPage';
import ProductionQueuePage from './pages/ProductionQueuePage';
import AssignmentSettingsPage from './pages/AssignmentSettingsPage';
import DigitalPrintingCartPage from './pages/DigitalPrintingCartPage';
import PrintReceiptPage from './pages/PrintReceiptPage';
import DesignerManagementPage from './pages/DesignerManagementPage';
import DesignerDashboardPage from './pages/DesignerDashboardPage';
import ServiceInvoicePage from './pages/ServiceInvoicePage';

export default function App() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState(() => {
    // Auto-redirect desainer to their dashboard
    if (user?.role === 'desainer') return 'dashboard-desainer';
    return 'dashboard';
  });
  const [pageState, setPageState] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // When user finishes loading, auto-redirect desainer to their dashboard 
  // if they are currently mapped to the default 'dashboard'.
  useEffect(() => {
    if (user && user.role === 'desainer' && activePage === 'dashboard') {
      setActivePage('dashboard-desainer');
    }
  }, [user, activePage]);

  const handleNavigate = (pageId, state = null) => {
    setActivePage(pageId);
    setPageState(state);
  };

  // Temporary migration script to sync old dp_tasks to transactions
  useEffect(() => {
    import('./db').then(m => {
      const db = m.default;
      const migrated = localStorage.getItem('dp_tasks_migrated_v3');
      if (!migrated) {
        const dpTasks = db.getAll('dp_tasks');
        const transactions = db.getAll('transactions');
        let modifications = 0;

        dpTasks.forEach(task => {
          const hasTrx = transactions.some(t => t.dp_task_id === task.id || t.items?.some(i => i.id === task.id));
          if (!hasTrx) {
            const now = new Date();
            const y = now.getFullYear();
            const mo = String(now.getMonth() + 1).padStart(2, '0');
            const count = Math.floor(Math.random() * 9000 + 1000);
            const invoiceNo = `TRX-${y}${mo}-${count}`;

            const newTransaction = {
              id: task.id + '_TRX_MIG',
              invoiceNo: invoiceNo,
              date: task.createdAt || new Date().toISOString(),
              userId: 'admin',
              userName: 'Admin',
              customerName: task.customerName || 'Pelanggan Umum',
              customerId: task.customerId,
              items: [{
                id: task.id,
                name: Math.random() < 0.5 ? 'Kartu Nama (Digital)' : 'Brosur Lipat (Digital)', // mock name since title might be undefined
                qty: 1,
                price: task.material_price || 0,
                subtotal: task.material_price || 0,
                type: 'digital_printing'
              }],
              subtotal: task.material_price || 0,
              discount: 0,
              tax: 0,
              total: task.material_price || 0,
              paymentType: '',
              paid: 0,
              change: 0,
              status: 'unpaid',
              type: 'digital_printing',
              dp_task_id: task.id
            };
            if (task.title) newTransaction.items[0].name = task.title;

            db.insert('transactions', newTransaction);
            modifications++;
          }
        });

        if (modifications > 0) {
          console.log(`Migrated ${modifications} old DP tasks to transactions`);
        }
        localStorage.setItem('dp_tasks_migrated_v3', 'true');
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="adaptive-loading-screen">
        <style>{`
          .adaptive-loading-screen {
            height: 100vh;
            width: 100vw;
            display: flex;
            background: var(--bg-primary);
            overflow: hidden;
            font-family: 'Inter', sans-serif;
          }
          /* Skeleton Theme Colors (Fallback to CSS variables if available) */
          :root {
            --skel-bg: #f1f5f9;
            --skel-shimmer: #e2e8f0;
            --skel-panel: #ffffff;
            --skel-border: #f1f5f9;
          }
          [data-theme="dark"] .adaptive-loading-screen {
            --bg-primary: #0f1117;
            --skel-bg: #1a1d27;
            --skel-shimmer: #232734;
            --skel-panel: rgba(26, 29, 39, 0.8);
            --skel-border: rgba(255, 255, 255, 0.05);
          }
          
          /* Shimmer Animation */
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          .skeleton {
            background: var(--skel-bg);
            background-image: linear-gradient(
                to right,
                var(--skel-bg) 0%,
                var(--skel-shimmer) 20%,
                var(--skel-bg) 40%,
                var(--skel-bg) 100%
            );
            background-repeat: no-repeat;
            background-size: 1000px 100%;
            animation: shimmer 2s infinite linear forwards;
            border-radius: 8px;
          }

          /* Loading Layout */
          .skel-sidebar {
            width: 260px;
            background: var(--skel-panel);
            border-right: 1px solid var(--skel-border);
            padding: 24px 20px;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          .skel-brand { display: flex; gap: 12px; align-items: center; }
          .skel-brand-icon { width: 40px; height: 40px; border-radius: 8px; }
          .skel-brand-text { width: 120px; height: 16px; }
          
          .skel-nav-list { display: flex; flex-direction: column; gap: 16px; margin-top: 10px; }
          .skel-nav-item { width: 100%; height: 40px; border-radius: 8px; }
          
          .skel-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: var(--bg-primary, #f4f6f8);
          }
          .skel-header {
            height: 64px;
            background: var(--skel-panel);
            border-bottom: 1px solid var(--skel-border);
            padding: 0 32px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .skel-title { width: 200px; height: 24px; }
          .skel-top-actions { display: flex; gap: 16px; align-items: center; }
          .skel-search { width: 300px; height: 36px; border-radius: 8px; }
          .skel-circle { width: 36px; height: 36px; border-radius: 50%; }

          .skel-content {
            padding: 32px;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          .skel-cards-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
          .skel-card {
            height: 120px;
            background: var(--skel-panel);
            border: 1px solid var(--skel-border);
            border-radius: 12px;
            padding: 20px;
          }
          .skel-table {
            height: 400px;
            background: var(--skel-panel);
            border: 1px solid var(--skel-border);
            border-radius: 12px;
            padding: 20px;
          }
          
          /* Top Loading Bar */
          .top-loader-bar {
             position: absolute;
             top: 0;
             left: 0;
             height: 3px;
             background: #2563eb;
             animation: loadingBar 1.5s ease-in-out infinite;
             z-index: 9999;
          }
          @keyframes loadingBar {
             0% { width: 0%; left: 0; }
             50% { width: 50%; left: 25%; }
             100% { width: 0%; left: 100%; }
          }
        `}</style>

        <div className="top-loader-bar"></div>

        <div className="skel-sidebar">
          <div className="skel-brand">
            <div className="skeleton skel-brand-icon"></div>
            <div className="skeleton skel-brand-text"></div>
          </div>
          <div className="skel-nav-list">
            <div className="skeleton skel-nav-item"></div>
            <div className="skeleton skel-nav-item"></div>
            <div className="skeleton skel-nav-item"></div>
            <div className="skeleton skel-nav-item"></div>
            <div className="skeleton skel-nav-item"></div>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="skeleton skel-circle"></div>
            <div className="skeleton" style={{ width: '100px', height: '16px' }}></div>
          </div>
        </div>

        <div className="skel-main">
          <div className="skel-header">
            <div className="skeleton skel-title"></div>
            <div className="skel-top-actions">
              <div className="skeleton skel-search"></div>
              <div className="skeleton skel-circle"></div>
              <div className="skeleton skel-circle"></div>
              <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: '8px' }}></div>
            </div>
          </div>
          <div className="skel-content">
            <div className="skel-cards-row">
              <div className="skeleton skel-card"></div>
              <div className="skeleton skel-card"></div>
              <div className="skeleton skel-card"></div>
              <div className="skeleton skel-card"></div>
            </div>
            <div className="skeleton skel-table"></div>
          </div>
        </div>

      </div>
    );
  }

  if (!user) return <LoginPage />;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage onNavigate={handleNavigate} />;
      case 'pos': return <IntegratedPos onNavigate={handleNavigate} pageState={pageState} onFullscreenChange={setIsFullscreen} />;
      case 'pos-v1': return <PosPage onNavigate={handleNavigate} pageState={pageState} onFullscreenChange={setIsFullscreen} />;
      case 'printing': return <PrintingPage onNavigate={handleNavigate} />;
      case 'digital-printing': return <DigitalPrintingPage onNavigate={handleNavigate} />;
      case 'cetak-offset': return <OffsetPrintingPage onNavigate={handleNavigate} />;
      case 'stok-bahan': return <MaterialsPage onNavigate={handleNavigate} />;
      case 'tambah-bahan': return <MaterialFormPage onNavigate={handleNavigate} pageState={pageState} />;
      case 'service': return <ServicePage onNavigate={handleNavigate} />;
      case 'inventory': return <InventoryPage onNavigate={handleNavigate} />;
      case 'customers': return <CustomersPage onNavigate={handleNavigate} />;
      case 'finance': return <FinancePage onNavigate={handleNavigate} />;
      case 'reports': return <ReportsPage onNavigate={handleNavigate} />;
      case 'settings': return <SettingsPage onNavigate={handleNavigate} />;
      case 'spk-list': return <SPKListPage onNavigate={handleNavigate} />;
      case 'spk-detail': return <SPKDetailPage onNavigate={handleNavigate} pageState={pageState} />;
      case 'spk-settlement': return <SPKSettlementPage onNavigate={handleNavigate} pageState={pageState} />;
      case 'kasir-payment': return <CashierPaymentPage onNavigate={handleNavigate} pageState={pageState} />;
      case 'handover': return <HandoverPage onNavigate={handleNavigate} pageState={pageState} />;
      case 'wa-settings': return <WASettingsPage onNavigate={handleNavigate} />;
      case 'print-invoice': return <PrintInvoicePage onNavigate={handleNavigate} pageState={pageState} />;
      case 'print-label': return <PrintLabelPage onNavigate={handleNavigate} pageState={pageState} />;
      case 'print-spk': return <PrintSPKPage onNavigate={handleNavigate} pageState={pageState} />;
      case 'qris-monitor': return <QRISMonitorPage onNavigate={handleNavigate} />;
      case 'design-finalization': return <DesignFinalizationPage onNavigate={handleNavigate} pageState={pageState} />;
      case 'production-queue': return <ProductionQueuePage onNavigate={handleNavigate} />;
      case 'assignment-settings': return <AssignmentSettingsPage onNavigate={handleNavigate} />;
      case 'dp-cart': return <DigitalPrintingCartPage onNavigate={handleNavigate} pageState={pageState} />;
      case 'print-receipt': return <PrintReceiptPage onNavigate={handleNavigate} pageState={pageState} />;
      case 'manajemen-desainer': return <DesignerManagementPage onNavigate={handleNavigate} />;
      case 'dashboard-desainer': return <DesignerDashboardPage onNavigate={handleNavigate} />;
      case 'print-service-invoice': return <ServiceInvoicePage onNavigate={handleNavigate} pageState={pageState} />;
      default: return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout activePage={activePage} onNavigate={handleNavigate} isFullscreen={isFullscreen}>
      {renderPage()}
    </Layout>
  );
}
