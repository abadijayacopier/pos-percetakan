import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    FiUsers, FiShoppingCart, FiCreditCard, FiActivity,
    FiSearch, FiFilter, FiMoreVertical, FiPower,
    FiZap, FiRefreshCw, FiExternalLink, FiPlus,
    FiSettings, FiShield
} from 'react-icons/fi';

export default function SuperAdminDashboard() {
    const { user, logout } = useAuth();
    const [shops, setShops] = useState([]);
    const [stats, setStats] = useState({ totalShops: 0, activeShops: 0, pendingPayments: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [shopsRes, statsRes] = await Promise.all([
                api.get('/super-admin/shops'),
                api.get('/super-admin/stats')
            ]);
            setShops(shopsRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async (shopId, action, data = {}) => {
        try {
            await api.post(`/super-admin/shops/${shopId}/${action}`, data);
            fetchData();
            alert(`Berhasil: ${action}`);
        } catch (err) {
            alert('Aksi gagal: ' + (err.response?.data?.message || 'Error'));
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            expired: 'bg-red-500/10 text-red-500 border-red-500/20',
            trial: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            pending: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        };
        return (
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || styles.pending}`}>
                {status}
            </span>
        );
    };

    const PlanBadge = ({ plan }) => {
        const styles = {
            basic: 'text-slate-400',
            pro: 'text-blue-500 font-bold',
            ultra: 'text-emerald-500 font-black italic'
        };
        return <span className={`uppercase text-xs tracking-tighter ${styles[plan] || ''}`}>{plan}</span>;
    };

    const filteredShops = shops.filter(s =>
        s.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0b0e14] text-slate-100 font-display p-6 md:p-10 space-y-10">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                            <FiShield size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Platform Control</h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] leading-none">Super Admin Hub v4.0.0</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="relative group">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Cari Toko / Email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-xs"
                        />
                    </div>
                    <button
                        onClick={logout}
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-5 rounded-2xl transition-all border border-red-500/20"
                    >
                        <FiPower />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="flex justify-between items-start relative z-10">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Shops Registered</p>
                            <h2 className="text-6xl font-black text-white leading-none italic">{stats.totalShops}</h2>
                        </div>
                        <div className="p-4 bg-blue-500/10 rounded-2xl">
                            <FiUsers className="text-blue-500" size={24} />
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 opacity-[0.03] text-blue-500 pointer-events-none group-hover:scale-110 transition-transform">
                        <FiUsers size={200} />
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="flex justify-between items-start relative z-10">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Subscriptions</p>
                            <h2 className="text-6xl font-black text-emerald-500 leading-none italic">{stats.activeShops}</h2>
                        </div>
                        <div className="p-4 bg-emerald-500/10 rounded-2xl">
                            <FiZap className="text-emerald-500" size={24} />
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 opacity-[0.03] text-emerald-500 pointer-events-none group-hover:scale-110 transition-transform">
                        <FiZap size={200} />
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="flex justify-between items-start relative z-10">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Pending Transactions</p>
                            <h2 className="text-6xl font-black text-blue-400 leading-none italic">{stats.pendingPayments}</h2>
                        </div>
                        <div className="p-4 bg-blue-500/10 rounded-2xl">
                            <FiCreditCard className="text-blue-500" size={24} />
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 opacity-[0.03] text-blue-500 pointer-events-none group-hover:scale-110 transition-transform">
                        <FiCreditCard size={200} />
                    </div>
                </div>
            </div>

            {/* Main Content: Shops Table */}
            <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative">
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-xl font-black italic uppercase text-white flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        Managed Tenants
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={fetchData} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/10">
                                <th className="px-10 py-6">ID / Shop Name</th>
                                <th className="px-10 py-6">Owner / Contacts</th>
                                <th className="px-10 py-6">Plan Info</th>
                                <th className="px-10 py-6">Status</th>
                                <th className="px-10 py-6">Expiry Countdown</th>
                                <th className="px-10 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredShops.map(shop => (
                                <tr key={shop.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center font-black text-blue-500 italic">
                                                {shop.id}
                                            </div>
                                            <div>
                                                <p className="font-black text-white uppercase tracking-tight">{shop.shop_name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase">{shop.subdomain}.domain.com</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="text-xs font-bold text-slate-300">{shop.owner_email}</p>
                                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Verified Account</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <PlanBadge plan={shop.subscription_plan} />
                                    </td>
                                    <td className="px-10 py-6">
                                        <StatusBadge status={shop.subscription_status} />
                                    </td>
                                    <td className="px-10 py-6">
                                        {shop.expiry_date ? (
                                            <div>
                                                <p className="text-xs font-black text-white">
                                                    {new Date(shop.expiry_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase">Manual Extension Avail.</p>
                                            </div>
                                        ) : (
                                            <span className="text-slate-600 text-[10px] font-black uppercase">No Expiry Set</span>
                                        )}
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleAction(shop.id, 'activate', { plan: 'pro', durationMonths: 1 })}
                                                className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10"
                                                title="Aktivasi 1 Bulan"
                                            >
                                                <FiZap />
                                            </button>
                                            <button
                                                onClick={() => handleAction(shop.id, 'suspend')}
                                                className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                                                title="Suspend Toko"
                                            >
                                                <FiPower />
                                            </button>
                                            <button className="p-3 bg-white/5 text-slate-400 rounded-xl hover:bg-white/20 transition-all">
                                                <FiMoreVertical />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] pt-10 border-t border-white/5">
                <p>Abadi Jaya Platform Master • 2026</p>
                <div className="flex gap-6">
                    <p>System Status: Optimal</p>
                    <p>Database: pos_system_master</p>
                </div>
            </div>

        </div>
    );
}
