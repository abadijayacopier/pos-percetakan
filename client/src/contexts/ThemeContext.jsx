import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);

const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
    const [themeMode, setThemeMode] = useState(() => {
        return localStorage.getItem('pos_theme') || 'dark';
    });

    const activeTheme = themeMode === 'system' ? getSystemTheme() : themeMode;

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', activeTheme);
        if (activeTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('pos_theme', themeMode);
    }, [themeMode, activeTheme]);

    // Listen for system theme changes
    useEffect(() => {
        if (themeMode !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            document.documentElement.setAttribute('data-theme', getSystemTheme());
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [themeMode]);

    const setTheme = (mode) => setThemeMode(mode);

    return (
        <ThemeContext.Provider value={{ themeMode, activeTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
