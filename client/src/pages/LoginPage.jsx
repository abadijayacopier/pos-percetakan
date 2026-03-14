import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiPrinter, FiAlertCircle, FiLoader, FiLock, FiShield, FiShoppingBag, FiTool } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 overflow-hidden font-display">
            {/* Premium Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"
                    animate={{
                        x: [0, 50, -30, 0],
                        y: [0, -30, 40, 0],
                        scale: [1, 1.1, 0.9, 1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"
                    animate={{
                        x: [0, -40, 30, 0],
                        y: [0, 50, -20, 0],
                        scale: [1, 1.2, 1, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-md px-6"
            >
                <div className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800/50 p-10 sm:p-12 rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
                    {/* Subtle Top Gradient */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

                    <div className="flex flex-col items-center mb-10 text-center">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="p-5 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-500/20 mb-6"
                        >
                            <FiPrinter className="text-3xl" />
                        </motion.div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
                            Abadi Jaya <span className="text-blue-500">Copier</span>
                        </h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3 italic opacity-75">Premium Printing Solutions</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold"
                            >
                                <FiAlertCircle size={18} />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username Identification</label>
                            <div className="relative group/input">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Enter your system ID"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-5 text-sm font-bold text-white placeholder:text-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Credentials</label>
                            <div className="relative group/input">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-5 text-sm font-bold text-white placeholder:text-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <a href="#" className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">Access Recovery?</a>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <FiLoader className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <FiLock size={18} className="group-hover:rotate-12 transition-transform" />
                                    <span>Secure Entry</span>
                                </>
                            )}
                        </motion.button>
                    </form>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-10 pt-10 border-t border-slate-800/50"
                    >
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] block mb-6 text-center italic">Express Terminal Gateways</span>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Admin', icon: FiShield, u: 'admin', p: 'admin123', color: 'text-amber-500' },
                                { label: 'Cashier', icon: FiShoppingBag, u: 'kasir', p: 'kasir123', color: 'text-emerald-500' },
                                { label: 'Tech', icon: FiTool, u: 'teknisi', p: 'teknisi123', color: 'text-blue-500' },
                            ].map((d, i) => (
                                <motion.button
                                    key={d.u}
                                    onClick={() => quickLogin(d.u, d.p)}
                                    whileHover={{ y: -4, backgroundColor: 'rgba(30, 41, 59, 0.5)' }}
                                    className="flex flex-col items-center gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-3xl transition-all hover:border-slate-700 group/gate"
                                >
                                    <div className={`p-2 rounded-xl bg-slate-800 group-hover/gate:scale-110 transition-transform ${d.color}`}>
                                        <d.icon size={16} />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{d.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </div>

                <p className="mt-8 text-center text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic opacity-50">
                    Proprietary Software — Abadi Jaya System V4.2
                </p>
            </motion.div>
        </div>
    );
}
