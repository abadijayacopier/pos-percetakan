import React from 'react';
import { FiHome, FiCreditCard, FiList, FiGrid, FiUser } from 'react-icons/fi';
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-around items-end px-2 pt-2 pb-safe z-[90] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
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
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full"></span>
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
