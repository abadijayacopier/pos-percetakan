import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiPrinter, FiAlertCircle, FiLoader, FiLock, FiShield, FiShoppingBag, FiTool, FiPenTool } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './LoginPage.css';

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) { setError('Username dan password harus diisi!'); return; }
        setLoading(true);

        const result = await login(username, password);
        if (!result.success) setError(result.message);

        setLoading(false);
    };

    const quickLogin = (u, p) => { setUsername(u); setPassword(p); };

    return (
        <div className="login-page">
            {/* Organic Floating Background Orbs */}
            <motion.div
                className="login-bg-orb orb-1"
                animate={{
                    x: [0, 50, -30, 0],
                    y: [0, -30, 40, 0],
                    scale: [1, 1.1, 0.9, 1]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
                className="login-bg-orb orb-2"
                animate={{
                    x: [0, -40, 30, 0],
                    y: [0, 50, -20, 0],
                    scale: [1, 1.2, 1, 1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />

            <motion.div
                className="login-card-container"
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="modern-login-card">
                    <div className="login-brand-section">
                        <motion.div
                            className="premium-logo-box"
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <FiPrinter />
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            Abadi Jaya Copier
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            Premium Printing Solutions
                        </motion.p>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                className="login-error-toast"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <FiAlertCircle /> <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin}>
                        <div className="modern-input-group">
                            <label>Username</label>
                            <div className="modern-input-wrapper">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="modern-input-group">
                            <label>Password</label>
                            <div className="modern-input-wrapper">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                            <a href="#" style={{ fontSize: '0.8rem', color: '#137fec', textDecoration: 'none', fontWeight: '600', opacity: 0.7 }}>Forgot Password?</a>
                        </div>

                        <motion.button
                            className="btn-premium"
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.01, y: -2 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            {loading ? (
                                <FiLoader className="spin" size={20} />
                            ) : (
                                <><FiLock size={18} /> Secure Login</>
                            )}
                        </motion.button>
                    </form>

                    <motion.div
                        className="quick-access-panel"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <span className="quick-access-label">Quick Access</span>
                        <div className="quick-access-grid">
                            {[
                                { label: 'Admin', icon: FiShield, u: 'admin', p: 'admin123' },
                                { label: 'Cashier', icon: FiShoppingBag, u: 'kasir', p: 'kasir123' },
                                { label: 'Tech', icon: FiTool, u: 'teknisi', p: 'teknisi123' },
                            ].map((d, i) => (
                                <motion.button
                                    key={d.u}
                                    className="quick-btn"
                                    onClick={() => quickLogin(d.u, d.p)}
                                    whileHover={{ y: -3, background: 'rgba(19, 127, 236, 0.08)' }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 + (i * 0.1) }}
                                >
                                    <d.icon /> <span>{d.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
