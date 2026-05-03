import React, { useState, useMemo } from 'react';
import { FiUsers, FiPlus, FiEdit, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function UserManagement({
    users,
    setEditUser,
    setUserForm,
    setUserFormOpen,
    isAdmin,
    currentUser
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Filter Logic
    const filteredUsers = useMemo(() => {
        const baseUsers = isAdmin ? users : users.filter(u => u.id === currentUser?.id);
        return baseUsers.filter(u => 
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm, isAdmin, currentUser]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(start, start + itemsPerPage);
    }, [filteredUsers, currentPage]);

    // Reset page on search
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shadow-sm">
                            <FiUsers size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 dark:text-white text-xl tracking-tight uppercase">{isAdmin ? 'Manajemen Pengguna' : 'Profil Saya'}</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{isAdmin ? `Total: ${filteredUsers.length} Account` : 'Informasi Akun Anda'}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Search Bar */}
                        {isAdmin && (
                            <div className="relative flex-1 md:w-64">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Cari nama/user..."
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                />
                            </div>
                        )}
                        {isAdmin && (
                            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all text-xs font-black shadow-xl shadow-blue-500/20 uppercase tracking-widest whitespace-nowrap" onClick={() => { setEditUser(null); setUserForm({ name: '', username: '', password: '', role: 'kasir', isActive: true }); setUserFormOpen(true); }}>
                                <FiPlus size={18} /> Tambah User
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nama Pegawai</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ID Username</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Otoritas Role</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Akun</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {paginatedUsers.length > 0 ? paginatedUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                {u.name.substring(0, 1).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-slate-500 dark:text-slate-400 font-mono">@{u.username}</td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                            u.role === 'admin' ? 'bg-emerald-500/10 text-emerald-600' :
                                            u.role === 'desainer' ? 'bg-indigo-500/10 text-indigo-600' :
                                            u.role === 'teknisi' ? 'bg-orange-500/10 text-orange-600' :
                                            'bg-blue-500/10 text-blue-600'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${u.isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                            <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                            {u.isActive ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all shadow-sm" onClick={() => { setEditUser(u); setUserForm({ ...u, password: '' }); setUserFormOpen(true); }}>
                                            <FiEdit size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        Data tidak ditemukan...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Halaman <span className="text-slate-800 dark:text-white">{currentPage}</span> dari {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'bg-white dark:bg-slate-800 text-slate-600 hover:bg-blue-600 hover:text-white shadow-sm'}`}
                            >
                                <FiChevronLeft size={20} />
                            </button>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'bg-white dark:bg-slate-800 text-slate-600 hover:bg-blue-600 hover:text-white shadow-sm'}`}
                            >
                                <FiChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
