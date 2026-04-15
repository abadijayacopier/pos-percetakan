import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Load initial state from localStorage synchronously
        try {
            const saved = localStorage.getItem('pos_session');
            if (saved) {
                const session = JSON.parse(saved);
                if (session && session.token) {
                    console.log('AuthContext: Initial state - user found');
                    // Ensure sessionStartTime exists for legacy sessions
                    if (!session.sessionStartTime) {
                        session.sessionStartTime = Date.now();
                        localStorage.setItem('pos_session', JSON.stringify(session));
                    }
                    return session;
                }
            }
        } catch (e) {
            console.error('AuthContext: Error reading initial state:', e);
        }
        console.log('AuthContext: Initial state - no user');
        return null;
    });

    const [loading, setLoading] = useState(false); // Set to false since we load synchronously

    const logout = useCallback(() => {
        console.log('AuthContext: Logging out...');
        setUser(null);
        localStorage.removeItem('pos_session');
    }, []);

    const login = useCallback(async (username, password, shopId) => {
        console.log('AuthContext: Login attempt for:', username, 'Shop:', shopId);
        try {
            const response = await api.post('/auth/login', { username, password, shopId });
            const { token, user: userData } = response.data;

            const session = { ...userData, token, sessionStartTime: Date.now() };
            console.log('AuthContext: Login success, saving session');

            setUser(session);
            localStorage.setItem('pos_session', JSON.stringify(session));
            if (shopId) localStorage.setItem('last_shop_id', shopId);

            return { success: true };
        } catch (error) {
            console.error('AuthContext: Login failed:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Koneksi ke server gagal!'
            };
        }
    }, []);

    const superAdminLogin = useCallback(async (username, password) => {
        console.log('AuthContext: Super Admin Login attempt');
        try {
            const response = await api.post('/super-auth/login', { username, password });
            const { token, admin } = response.data;

            const session = {
                ...admin,
                token,
                isPlatformAdmin: true,
                role: 'SUPERADMIN',
                sessionStartTime: Date.now()
            };

            setUser(session);
            localStorage.setItem('pos_session', JSON.stringify(session));

            return { success: true };
        } catch (error) {
            console.error('AuthContext: Super Admin Login failed:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login Super Admin gagal!'
            };
        }
    }, []);

    const hasAccess = useCallback((requiredRoles) => {
        if (!user) return false;
        if (user.isPlatformAdmin) return true;
        const userRole = user.role ? String(user.role).toLowerCase() : '';
        if (userRole === 'admin' || userRole === 'pemilik') return true;
        return requiredRoles.includes(userRole);
    }, [user]);

    const updateUser = useCallback((userData) => {
        setUser(prev => {
            const updated = { ...prev, ...userData };
            localStorage.setItem('pos_session', JSON.stringify(updated));
            return updated;
        });
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, superAdminLogin, logout, hasAccess, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
