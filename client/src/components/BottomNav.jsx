import React from 'react';
import { FiHome, FiCreditCard, FiList, FiGrid, FiUser } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function BottomNav({ activePage, onNavigate }) {
    const { user } = useAuth();

    // Customize items based on role if needed, but these are generally safe for kasir/admin
    const items = [
        { id: 'dashboard', label: 'Beranda', icon: <FiHome size={22} /> },
        { id: 'pos', label: 'Kasir', icon: <FiCreditCard size={22} /> },
        { id: 'spk-list', label: 'Daftar SPK', icon: <FiList size={22} /> },
        { id: 'inventory', label: 'Data ATK', icon: <FiGrid size={22} /> },
        { id: 'profile', label: 'Profil Saya', icon: <FiUser size={22} /> },
    ];

    return (
        <div className="md:hidden print:hidden fixed bottom-6 left-6 right-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/40 dark:border-slate-800/40 flex justify-around items-end px-2 pt-2 pb-safe z-[90] shadow-premium rounded-[32px]">
            {items.map(item => {
                const isActive = activePage === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`relative flex flex-col items-center justify-center w-[20%] h-16 rounded-2xl transition-all duration-300 ${isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                    >
                        {isActive && (
                            <motion.span
                                layoutId="activeTab"
                                className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                            ></motion.span>
                        )}
                        <div className={`mb-1 transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                            {item.icon}
                        </div>
                        <span className={`text-[9px] transition-all duration-300 ${isActive ? 'font-black opacity-100' : 'font-bold opacity-70'}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

// Add CSS to handle safe area on iOS
const style = document.createElement('style');
style.innerHTML = `
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .pb-safe {
    padding-bottom: max(env(safe-area-inset-bottom), 12px);
  }
}
@supports not (padding-bottom: env(safe-area-inset-bottom)) {
  .pb-safe {
    padding-bottom: 12px;
  }
}
`;
document.head.appendChild(style);
