import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiLock, FiUser, FiGlobe, FiCpu } from 'react-icons/fi';
import api from '../services/api';

export default function SuperAdminLoginPage({ onNavigate }) {
    const { superAdminLogin } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await superAdminLogin(username, password);
        if (res.success) {
            onNavigate('superadmin-dashboard');
        } else {
            setError(res.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6 font-display overflow-hidden relative">

            {/* Background Orbs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>

            <div className="max-w-[450px] w-full space-y-8 relative z-10">
                <div className="text-center space-y-4">
                    <div className="inline-block p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-600/30 transform -rotate-6">
                        <FiCpu size={40} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Platform Admin</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-3">Master Control Center</p>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-600 to-emerald-400"></div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                                    <FiUser />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600 font-bold"
                                    placeholder="Username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secret Access Key</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                                    <FiLock />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600 font-bold"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-500 text-xs font-bold text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? 'Authenticating...' : 'Enter Dashboard'}
                        </button>
                    </form>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={() => onNavigate('landing')}
                        className="text-slate-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                        <FiGlobe /> Exit to Public Site
                    </button>
                </div>
            </div>

            <p className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] whitespace-nowrap">
                Encrypted Session • Tier III Data Center • v4.0.0
            </p>
        </div>
    );
}
