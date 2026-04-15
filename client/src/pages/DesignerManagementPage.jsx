import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';
import {
    FiUserPlus, FiUsers, FiCheckCircle, FiTrash2, FiEdit2,
    FiAlertCircle, FiActivity, FiSearch, FiMonitor, FiUserMinus,
    FiLoader, FiCheck, FiChevronLeft, FiChevronRight, FiSave, FiX
} from 'react-icons/fi';

const fmt = (n) => 'Rp ' + Math.floor(n || 0).toLocaleString('id-ID');

function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    const bg = type === 'error' ? 'bg-red-500' : type === 'warn' ? 'bg-amber-500' : 'bg-emerald-500';
    return (
        <div className={`fixed bottom-6 right-6 z-[9999] ${bg} text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-w-sm flex items-center gap-3`}>
            <span className="flex-1">{msg}</span>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <FiX size={14} />
            </button>
        </div>
    );
}

export default function DesignerManagementPage({ onNavigate }) {
    const { user } = useAuth();
    const [designers, setDesigners] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', username: '', password: '', is_active: true });
    const [saving, setSaving] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Search & Pagination States
    const [opSearch, setOpSearch] = useState('');
    const [opPage, setOpPage] = useState(1);
    const opPerPage = 5;

    const [queueSearch, setQueueSearch] = useState('');
    const [queuePage, setQueuePage] = useState(1);
    const queuePerPage = 5;

    const toast = useCallback((msg, type = 'success') => setToastMsg({ msg, type }), []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [dRes, aRes] = await Promise.all([
                api.get('/designers'),
                api.get('/designers/assignments')
            ]);
            setDesigners(dRes.data);
            setAssignments(aRes.data);
        } catch {
            setDesigners([]);
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.username.trim()) return toast('Nama dan username wajib diisi', 'warn');
        if (!editItem && !form.password.trim()) return toast('Password wajib diisi', 'warn');
        setSaving(true);
        try {
            if (editItem) {
                const payload = { name: form.name, username: form.username, is_active: form.is_active };
                if (form.password.trim()) payload.password = form.password;
                await api.put(`/designers/${editItem.id}`, payload);
                toast('Data desainer berhasil diperbarui ✅');
            } else {
                await api.post('/designers', form);
                toast('Operator desain baru berhasil ditambahkan ✅');
            }
            setShowForm(false);
            setEditItem(null);
            setForm({ name: '', username: '', password: '', is_active: true });
            fetchData();
        } catch (err) {
            toast(err.response?.data?.message || 'Gagal menyimpan', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (d, activate) => {
        const result = await Swal.fire({
            title: activate ? 'Aktifkan Operator?' : 'Nonaktifkan Operator?',
            text: `Apakah Anda yakin ingin ${activate ? 'mengaktifkan' : 'menonaktifkan'} ${d.name}?`,
            confirmButtonText: activate ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan',
            cancelButtonText: 'Batal',
            buttonsStyling: false,
            customClass: {
                popup: 'rounded-[2rem] border border-slate-200 dark:border-slate-800',
                confirmButton: `rounded-xl font-black uppercase tracking-widest text-[10px] ${activate ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2.5 mx-2`,
                cancelButton: 'rounded-xl font-black uppercase tracking-widest text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2.5 mx-2'
            }
        });
        if (!result.isConfirmed) return;
        try {
            if (activate) {
                await api.put(`/designers/${d.id}`, { name: d.name, username: d.username, is_active: true });
                toast('Operator diaktifkan ✅');
            } else {
                await api.delete(`/designers/${d.id}`);
                toast('Operator dinonaktifkan ✅');
            }
            fetchData();
        } catch (err) {
            toast(err.response?.data?.message || 'Gagal', 'error');
        }
    };

    const openEdit = (d) => {
        setEditItem(d);
        setForm({ name: d.name || '', username: d.username || '', password: '', is_active: d.is_active });
        setShowForm(true);
    };

    const kosongCount = designers.filter(d => d.is_active && d.status_kerja === 'kosong').length;
    const sibukCount = designers.filter(d => d.is_active && d.status_kerja === 'sibuk').length;
    const aktifCount = designers.filter(d => d.is_active).length;
    const recentAssignments = assignments.filter(a => ['ditugaskan', 'dikerjakan'].includes(a.status));

    // Computed Filtered & Paginated Data
    const filteredDesigners = designers.filter(d =>
        d.name.toLowerCase().includes(opSearch.toLowerCase()) ||
        d.username.toLowerCase().includes(opSearch.toLowerCase())
    );
    const paginatedDesigners = filteredDesigners.slice((opPage - 1) * opPerPage, opPage * opPerPage);

    const filteredQueue = recentAssignments.filter(a =>
        a.task_id.toLowerCase().includes(queueSearch.toLowerCase()) ||
        a.designer_name.toLowerCase().includes(queueSearch.toLowerCase())
    );
    const paginatedQueue = filteredQueue.slice((queuePage - 1) * queuePerPage, queuePage * queuePerPage);

    return (
        <div className="p-4 md:p-8 pb-28 md:pb-8 flex flex-col gap-6 bg-slate-50/50 dark:bg-transparent">
            {toastMsg && <Toast {...toastMsg} onClose={() => setToastMsg(null)} />}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                            <FiUsers className="text-2xl" />
                        </div>
                        Manajemen Operator
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 ml-1 italic opacity-75 underline decoration-indigo-500/30 underline-offset-4">Real-time Designer Team Management</p>
                </div>
                <button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 text-[10px] uppercase tracking-widest"
                    onClick={() => { setEditItem(null); setForm({ name: '', username: '', password: '', is_active: true }); setShowForm(true); }}
                >
                    <FiUserPlus size={16} />
                    <span>Tambah Operator</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Tim', value: designers.length, icon: FiUsers, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Aktif', value: aktifCount, icon: FiCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Sibuk', value: sibukCount, icon: FiActivity, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                    { label: 'Tersedia', value: kosongCount, icon: FiCheck, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm group">
                        <div className="flex justify-between items-start mb-3">
                            <div className={`p-3 rounded-2xl ${s.bg}`}>
                                {s.icon && <s.icon className={`text-xl ${s.color}`} />}
                            </div>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{s.label}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-75">{s.label}</p>
                        <p className={`text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-auto shadow-sm">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <FiUsers className="text-indigo-600" /> Daftar Operator Desain
                    </h2>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama atau username..."
                            value={opSearch}
                            onChange={(e) => { setOpSearch(e.target.value); setOpPage(1); }}
                            className="w-full md:w-64 pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-slate-400">
                        <FiLoader className="mx-auto mb-3 animate-spin text-3xl" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Memuat data tim...</p>
                    </div>
                ) : designers.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                        <FiUserMinus className="mx-auto mb-3 text-4xl opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Belum ada operator desainer</p>
                    </div>
                ) : (
                    <div className="overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse md:min-w-[700px]">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operator</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Username</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Tugas</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {paginatedDesigners.map(d => (
                                    <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-inner ${d.status_kerja === 'sibuk' ? 'bg-rose-500' : 'bg-primary'}`}>
                                                    {(d.name || 'NN').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{d.name}</p>
                                                    <p className="text-[10px] text-slate-500 md:hidden mt-0.5">@{d.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500 hidden md:table-cell">@{d.username}</td>
                                        <td className="p-4 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider
                                                ${d.status_kerja === 'sibuk'
                                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'
                                                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
                                                }`}
                                            >
                                                <span className={`w-2 h-2 rounded-full ${d.status_kerja === 'sibuk' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                                {d.status_kerja === 'sibuk' ? 'Sibuk' : 'Kosong'}
                                            </div>
                                        </td>
                                        <td className="p-4 hidden sm:table-cell">
                                            {d.active_task ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{d.active_task.task_id}</span>
                                                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md ${d.active_task.status === 'dikerjakan' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'}`}>
                                                        {d.active_task.status === 'dikerjakan' ? '⚡ Mengerjakan' : '📋 Ditugaskan'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Standby</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Edit Profile" onClick={() => openEdit(d)}>
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button
                                                    className={`p-2 rounded-lg transition-all ${d.is_active ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                    title={d.is_active ? "Nonaktifkan" : "Aktifkan"}
                                                    onClick={() => handleToggleActive(d, !d.is_active)}
                                                >
                                                    {d.is_active ? <FiUserMinus size={16} /> : <FiCheckCircle size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {/* Pagination Operators */}
                {!loading && filteredDesigners.length > 0 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                            Menampilkan {Math.min(filteredDesigners.length, (opPage - 1) * opPerPage + 1)}-{Math.min(filteredDesigners.length, opPage * opPerPage)} dari {filteredDesigners.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setOpPage(p => Math.max(1, p - 1))}
                                disabled={opPage === 1}
                                className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30"
                            ><FiChevronLeft /></button>
                            <span className="text-xs font-bold w-12 text-center whitespace-nowrap">{opPage} / {Math.max(1, Math.ceil(filteredDesigners.length / opPerPage))}</span>
                            <button
                                onClick={() => setOpPage(p => Math.min(Math.ceil(filteredDesigners.length / opPerPage), p + 1))}
                                disabled={opPage === Math.ceil(filteredDesigners.length / opPerPage) || filteredDesigners.length === 0}
                                className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30"
                            ><FiChevronRight /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Monitoring Penugasan Aktif */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-auto shadow-sm">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <FiMonitor className="text-amber-500" /> Antrean Aktif
                        </h2>
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-600 dark:bg-amber-900/20 text-[10px] font-black rounded-lg">
                            {recentAssignments.length} Tugas
                        </span>
                    </div>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari Order ID atau Operator..."
                            value={queueSearch}
                            onChange={(e) => { setQueueSearch(e.target.value); setQueuePage(1); }}
                            className="w-full md:w-64 pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                </div>

                {recentAssignments.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                        <FiCheckCircle className="mx-auto mb-2 text-3xl opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest italic">Tidak ada antrean desain</p>
                    </div>
                ) : (
                    <div className="overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse md:min-w-[600px]">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job ID</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operator</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Durasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {paginatedQueue.map(a => (
                                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                        <td className="p-4 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">{a.task_id}</td>
                                        <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">{a.designer_name}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full ${a.status === 'dikerjakan' ? 'bg-primary/10 text-primary' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30'}`}>
                                                {a.status === 'dikerjakan' ? '⚡ Sedang Dikerjakan' : '📋 Antre'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-[10px] text-slate-500 font-bold font-mono">
                                            {new Date(a.assigned_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {/* Pagination Antrean Aktif */}
                {recentAssignments.length > 0 && filteredQueue.length > 0 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                            Menampilkan {Math.min(filteredQueue.length, (queuePage - 1) * queuePerPage + 1)}-{Math.min(filteredQueue.length, queuePage * queuePerPage)} dari {filteredQueue.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setQueuePage(p => Math.max(1, p - 1))}
                                disabled={queuePage === 1}
                                className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30"
                            ><FiChevronLeft /></button>
                            <span className="text-xs font-bold w-12 text-center whitespace-nowrap">{queuePage} / {Math.max(1, Math.ceil(filteredQueue.length / queuePerPage))}</span>
                            <button
                                onClick={() => setQueuePage(p => Math.min(Math.ceil(filteredQueue.length / queuePerPage), p + 1))}
                                disabled={queuePage === Math.ceil(filteredQueue.length / queuePerPage) || filteredQueue.length === 0}
                                className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30"
                            ><FiChevronRight /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">{editItem ? 'Ubah Akun Operator' : 'Tambah Tim Baru'}</h3>
                            <button className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 flex flex-col gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                                    <input className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary shadow-inner" placeholder="Andi Saputra" value={form?.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username Login</label>
                                    <input className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary shadow-inner" placeholder="andi_desain" value={form?.username || ''} onChange={e => setForm({ ...form, username: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password {editItem ? '(Kosongkan jika tidak diubah)' : ''}</label>
                                    <input className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary shadow-inner" type="password" placeholder={editItem ? '••••••••' : 'Min. 6 karakter'} value={form?.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} />
                                </div>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                                <button type="button" className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-100" onClick={() => setShowForm(false)}>Batal</button>
                                <button type="submit" className="flex-[1.5] bg-blue-600 text-white font-black py-3 rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2" disabled={saving}>
                                    {saving ? '⏳ Menyimpan...' : <><FiSave size={18} /> Simpan Data</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
