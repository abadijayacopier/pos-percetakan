import { useTheme } from '../contexts/ThemeContext';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

export default function ThemeToggle({ size = 14, className = "" }) {
    const { themeMode, setTheme } = useTheme();

    const themes = [
        { id: 'light', icon: FiSun, title: 'Terang' },
        { id: 'dark', icon: FiMoon, title: 'Gelap' },
        { id: 'system', icon: FiMonitor, title: 'Sistem' },
    ];

    return (
        <div className={`flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ${className}`}>
            {themes.map(t => (
                <button
                    key={t.id}
                    className={`p-1.5 rounded-md transition-all duration-200 ${themeMode === t.id
                            ? 'bg-white dark:bg-slate-600 text-primary shadow-sm scale-110'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    onClick={() => setTheme(t.id)}
                    title={`Tema ${t.title}`}
                >
                    <t.icon size={size} />
                </button>
            ))}
        </div>
    );
}
