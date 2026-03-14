import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const SESSION_TIMEOUT = 4 * 60 * 60 * 1000; // 4 jam

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = () => {
        setUser(null);
        localStorage.removeItem('pos_session');
    };

    const checkSession = () => {
        const saved = localStorage.getItem('pos_session');
        if (saved) {
            try {
                const session = JSON.parse(saved);
                const now = Date.now();
                const lastActive = session.lastActive || 0;

                if (now - lastActive > SESSION_TIMEOUT) {
                    console.log('Session timeout - logging out');
                    logout();
                    return null;
                }
                return session;
            } catch {
                localStorage.removeItem('pos_session');
                return null;
            }
        }
        return null;
    };

    useEffect(() => {
        const session = checkSession();
        if (session) {
            setUser(session);
        }
        setLoading(false);

        // Timer berkala untuk cek timeout (setiap 1 menit)
        const interval = setInterval(() => {
            checkSession();
        }, 60000);

        // Activity listeners to reset the timer
        const resetTimer = () => {
            const saved = localStorage.getItem('pos_session');
            if (saved) {
                try {
                    const session = JSON.parse(saved);
                    session.lastActive = Date.now();
                    localStorage.setItem('pos_session', JSON.stringify(session));
                    // Optional: update state to keep it in sync if needed, 
                    // but since we only care about the timestamp in localStorage for the next check,
                    // we don't necessarily need to trigger a re-render of the whole app context every mouse move.
                } catch { /* ignore */ }
            }
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('click', resetTimer);
        window.addEventListener('scroll', resetTimer);

        return () => {
            clearInterval(interval);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('scroll', resetTimer);
        };
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });
            const { token, user: userData } = response.data;

            const session = { ...userData, token, lastActive: Date.now() };
            setUser(session);
            localStorage.setItem('pos_session', JSON.stringify(session));

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Koneksi ke server gagal!'
            };
        }
    };

    const hasAccess = (requiredRoles) => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        return requiredRoles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasAccess }}>
            {children}
        </AuthContext.Provider>
    );
};
