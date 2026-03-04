import { useState } from 'react';
import './App.css';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PosPage from './pages/PosPage';
import PrintingPage from './pages/PrintingPage';
import ServicePage from './pages/ServicePage';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
import FinancePage from './pages/FinancePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

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
      case 'dashboard': return <DashboardPage onNavigate={setActivePage} />;
      case 'pos': return <PosPage />;
      case 'printing': return <PrintingPage />;
      case 'service': return <ServicePage />;
      case 'inventory': return <InventoryPage />;
      case 'customers': return <CustomersPage />;
      case 'finance': return <FinancePage />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {renderPage()}
    </Layout>
  );
}
