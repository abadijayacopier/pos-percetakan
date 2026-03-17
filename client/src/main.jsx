import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import seedData from './seed';

// Initialize seed data on first load
seedData();

// Set default theme
if (!document.documentElement.getAttribute('data-theme')) {
  document.documentElement.setAttribute('data-theme', localStorage.getItem('pos_theme') || 'dark');
}

// Also add 'dark' class for Tailwind class-based dark mode
const savedTheme = localStorage.getItem('pos_theme') || 'dark';
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
