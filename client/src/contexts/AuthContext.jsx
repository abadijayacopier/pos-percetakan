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

    const login = useCallback(async (username, password) => {
        console.log('AuthContext: Login attempt for:', username);
        try {
            const response = await api.post('/auth/login', { username, password });
            const { token, user: userData } = response.data;

            const session = { ...userData, token };
            console.log('AuthContext: Login success, saving session');
            
            setUser(session);
            localStorage.setItem('pos_session', JSON.stringify(session));

            return { success: true };
        } catch (error) {
            console.error('AuthContext: Login failed:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Koneksi ke server gagal!'
            };
        }
    }, []);

    const hasAccess = useCallback((requiredRoles) => {
        if (!user) return false;
        const userRole = user.role ? String(user.role).toLowerCase() : '';
        if (userRole === 'admin' || userRole === 'pemilik') return true;
        return requiredRoles.includes(userRole);
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasAccess }}>
            {children}
        </AuthContext.Provider>
    );
};
