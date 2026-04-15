import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiPrinter, FiAlertCircle, FiLoader, FiLock, FiCpu } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage({ storeSettings, onNavigate, systemInfo }) {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [shopId, setShopId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isSaaS = systemInfo?.isSaaS;

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) {
            setError('Username dan password harus diisi!');
            return;
        }
        setLoading(true);

        try {
            const result = await login(username, password, shopId);
            if (!result.success) setError(result.message);
        } catch (err) {
            setError('Terjadi kesalahan pada sistem. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden font-display">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-[120px]"
                    animate={{
                        x: [0, 30, -20, 0],
                        y: [0, -20, 30, 0],
                        scale: [1, 1.05, 0.95, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-[120px]"
                    animate={{
                        x: [0, -30, 20, 0],
                        y: [0, 40, -30, 0],
                        scale: [1, 1.1, 1, 1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-md px-6"
            >
                <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800/50 p-10 sm:p-14 rounded-[3rem] shadow-2xl dark:shadow-slate-950/50 overflow-hidden relative group">
                    {/* Visual Accent */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-blue-500/40 dark:via-blue-500/50 to-transparent"></div>

                    <div className="flex flex-col items-center mb-12 text-center">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 1 }}
                            whileTap={{ scale: 0.95 }}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-blue-600 shadow-xl mb-6 flex items-center justify-center w-20 h-20 border border-slate-200 dark:border-slate-700"
                        >
                            {storeSettings?.logo ? (
                                <img src={storeSettings.logo} className="max-w-full max-h-full object-contain" alt="Logo" />
                            ) : (
                                <FiPrinter className="text-4xl" />
                            )}
                        </motion.div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-tight">
                            {storeSettings?.name?.split(' ')[0] || 'ABADI'} <span className="text-blue-600 dark:text-blue-500">{storeSettings?.name?.split(' ').slice(1).join(' ') || 'JAYA'}</span>
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mt-4 italic opacity-80">Premium Printing Solutions</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                className="p-4 bg-rose-500/10 dark:bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs font-bold overflow-hidden"
                            >
                                <FiAlertCircle size={18} className="shrink-0" />
                                <span className="flex-1">{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} className="space-y-7">
                        {isSaaS && (
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1.5 flex items-center gap-2">
                                    <FiCpu size={12} className="text-blue-500" /> Identitas Toko (Shop ID)
                                </label>
                                <div className="relative group/input">
                                    <input
                                        type="text"
                                        value={shopId}
                                        onChange={e => setShopId(e.target.value)}
                                        placeholder="Contoh: abadi-jaya"
                                        className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[1.25rem] py-4.5 px-6 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:ring-4 focus:ring-blue-500/5 dark:focus:ring-blue-500/10 focus:border-blue-500/50 dark:focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1.5">Identitas Sistem</label>
                            <div className="relative group/input">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Username / ID"
                                    className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[1.25rem] py-4.5 px-6 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:ring-4 focus:ring-blue-500/5 dark:focus:ring-blue-500/10 focus:border-blue-500/50 dark:focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1.5">Kredensial Keamanan</label>
                            <div className="relative group/input">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[1.25rem] py-4.5 px-6 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:ring-4 focus:ring-blue-500/5 dark:focus:ring-blue-500/10 focus:border-blue-500/50 dark:focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pr-1">
                            <button type="button" className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                                Lupa Akses?
                            </button>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 text-white rounded-[1.25rem] font-bold uppercase tracking-[0.25em] text-xs shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 group ring-offset-2 ring-blue-500 focus:ring-2"
                        >
                            {loading ? (
                                <FiLoader className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <FiLock size={18} className="group-hover:rotate-6 transition-transform" />
                                    <span>Masuk Sistem</span>
                                </>
                            )}
                        </motion.button>
                    </form>
                </div>

                <div className="mt-12 text-center space-y-3">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] italic leading-relaxed">
                        Licensed POS Software — Abadi Jaya System V4.2
                    </p>
                    <button
                        type="button"
                        onClick={() => onNavigate('superadmin-login')}
                        className="text-[9px] font-bold text-slate-500 hover:text-blue-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        <FiCpu size={12} /> Master Portal
                    </button>
                    <div className="h-0.5 w-6 bg-slate-200 dark:bg-slate-800 mx-auto rounded-full"></div>
                </div>
            </motion.div>
        </div>
    );
}
