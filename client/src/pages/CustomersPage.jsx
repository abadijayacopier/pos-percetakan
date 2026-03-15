import { useState, useMemo } from 'react';
import db from '../db';
import { formatRupiah, formatDate } from '../utils';
import Modal from '../components/Modal';
import { FiUsers, FiPlus, FiEdit, FiTrash2, FiSearch, FiSave, FiX, FiStar, FiBriefcase, FiUser, FiCpu, FiPhone, FiMapPin, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const TYPE_MAP = {
    walkin: { label: 'Walk-in', color: '#6b7280', bg: '#f3f4f6', icon: <FiUser size={12} /> },
    vip: { label: 'VIP', color: '#f59e0b', bg: '#fef3c7', icon: <FiStar size={12} /> },
    corporate: { label: 'Corporate', color: '#3b82f6', bg: '#dbeafe', icon: <FiBriefcase size={12} /> },
    service: { label: 'Service', color: '#8b5cf6', bg: '#ede9fe', icon: <FiCpu size={12} /> },
};

const emptyForm = { name: '', phone: '', address: '', type: 'walkin', company: '' };

export default function CustomersPage() {
    const [customers, setCustomers] = useState(() => db.getAll('customers'));
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    const reload = () => setCustomers(db.getAll('customers'));
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return customers.filter(c => {
            const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.company || '').toLowerCase().includes(q);
            const matchType = filterType === 'all' || c.type === filterType;
            return matchSearch && matchType;
        });
    }, [customers, search, filterType]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const handleSearch = (v) => { setSearch(v); setPage(1); };
    const handleFilter = (v) => { setFilterType(v); setPage(1); };

    const typeCount = (t) => customers.filter(c => c.type === t).length;

    const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (c) => { setEditItem(c); setForm({ name: c.name, phone: c.phone || '', address: c.address || '', type: c.type || 'walkin', company: c.company || '' }); setShowModal(true); };

    const handleSave = () => {
        if (!form.name.trim()) return;
        if (editItem) {
            db.update('customers', editItem.id, form);
        } else {
            db.insert('customers', { ...form, totalTrx: 0, totalSpend: 0 });
        }
        setShowModal(false);
        reload();
    };

    const handleDelete = (id) => { db.delete('customers', id); setConfirmDelete(null); reload(); };

    return (
        <div className="p-4 sm:p-8 space-y-8 font-display bg-slate-50/30 dark:bg-transparent min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 text-slate-900 dark:text-white">
                <div>
                    <h1 className="text-2xl font-black flex items-center gap-3">
                        <span className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200 dark:shadow-none"><FiUsers /></span>
                        Data Pelanggan
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-1">Kelola data pelanggan & manajemen member</p>
                </div>
                <button className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-100 dark:shadow-none active:scale-95" onClick={openAdd}>
                    <FiPlus /> Tambah Pelanggan
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Pelanggan', value: customers.length, icon: <FiUsers />, color: 'blue', tag: 'Total Database' },
                    { label: 'VIP Pelanggan', value: typeCount('vip'), icon: <FiStar />, color: 'amber', tag: 'Level VIP' },
                    { label: 'Kemitraan Corp', value: typeCount('corporate'), icon: <FiBriefcase />, color: 'purple', tag: 'Corporate' },
                    { label: 'Antrean Servis', value: typeCount('service'), icon: <FiCpu />, color: 'emerald', tag: 'Service Only' },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 bg-${s.color}-100 dark:bg-${s.color}-900/30 text-${s.color}-600 dark:text-${s.color}-400 rounded-xl`}>
                                {s.icon}
                            </div>
                            <span className={`text-[9px] font-black px-2 py-1 rounded bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600 dark:text-${s.color}-400 uppercase tracking-widest`}>
                                {s.tag}
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">{s.label}</p>
                        <h3 className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{s.value}</h3>
                    </div>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                {/* Filter & Search Bar */}
                <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="relative w-full lg:w-96 group">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white"
                            placeholder="Cari nama / telepon / perusahaan..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm w-full lg:w-auto overflow-x-auto no-scrollbar">
                        <button
                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterType === 'all'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                            onClick={() => handleFilter('all')}
                        >
                            Semua
                        </button>
                        {Object.entries(TYPE_MAP).map(([key, t]) => (
                            <button
                                key={key}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === key
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                    }`}
                                onClick={() => handleFilter(key)}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-x-auto">
                    {paginated.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-300 dark:text-slate-700">
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-4">
                                <FiUsers size={48} className="opacity-20" />
                            </div>
                            <p className="text-sm font-black uppercase tracking-[0.2em]">{search ? 'Pelanggan tidak ditemukan' : 'Database masih kosong'}</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Info Pelanggan</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Telepon</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kategori</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Afiliasi</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Loyalty</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Belanja</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Kelola</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {paginated.map(c => {
                                    const t = TYPE_MAP[c.type] || TYPE_MAP.walkin;
                                    const colorMap = {
                                        walkin: 'emerald',
                                        vip: 'amber',
                                        corporate: 'blue',
                                        service: 'purple'
                                    };
                                    const cColor = colorMap[c.type] || 'slate';

                                    return (
                                        <tr key={c.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl bg-${cColor}-50 dark:bg-${cColor}-900/20 text-${cColor}-600 dark:text-${cColor}-400 flex items-center justify-center font-black text-sm uppercase ring-1 ring-${cColor}-100 dark:ring-0`}>
                                                        {c.name.substring(0, 1)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                                            {c.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 mt-0.5">
                                                            <FiMapPin size={10} /> {c.address || 'Alamat tidak diatur'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 tracking-tight flex items-center gap-2">
                                                        <FiPhone className="text-slate-300" size={12} /> {c.phone || '---'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border
                                                    bg-${cColor}-50 text-${cColor}-600 border-${cColor}-100 dark:bg-${cColor}-900/20 dark:border-${cColor}-800`}>
                                                    {t.icon} {t.label}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest italic opacity-75">
                                                    {c.company || 'Personal'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">
                                                        {c.totalTrx || 0}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter opacity-60">Faktur</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-black text-emerald-600 tracking-tighter italic">
                                                    {formatRupiah(c.totalSpend || 0)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right whitespace-nowrap">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4">
                                                    <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all" onClick={() => openEdit(c)} title="Edit Profil">
                                                        <FiEdit size={16} />
                                                    </button>
                                                    <button className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all" onClick={() => setConfirmDelete(c)} title="Hapus Data">
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Footer */}
                {filtered.length > PER_PAGE && (
                    <div className="px-8 py-6 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-50/20">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Menampilkan <span className="text-slate-900 dark:text-white">{(page - 1) * PER_PAGE + 1}</span> sampai <span className="text-slate-900 dark:text-white">{Math.min(page * PER_PAGE, filtered.length)}</span> dari <span className="text-slate-900 dark:text-white">{filtered.length}</span>
                        </p>
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl disabled:opacity-30 transition-all shadow-sm group"
                            >
                                <FiChevronLeft size={18} className="group-active:-translate-x-1 transition-transform" />
                            </button>
                            <div className="flex gap-1 px-2">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum = page;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (page <= 3) pageNum = i + 1;
                                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = page - 2 + i;

                                    return (
                                        <button
                                            key={pageNum}
                                            className={`w-9 h-9 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${page === pageNum
                                                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm border border-slate-200 dark:border-slate-700'
                                                : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                            onClick={() => setPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl disabled:opacity-30 transition-all shadow-sm group"
                            >
                                <FiChevronRight size={18} className="group-active:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={
                <div className="flex items-center gap-3 text-slate-800 dark:text-white uppercase tracking-tight font-black">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                        {editItem ? <FiEdit /> : <FiPlus />}
                    </div>
                    {editItem ? 'Edit Profil Pelanggan' : 'Member Baru'}
                </div>
            }>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap *</label>
                        <div className="relative">
                            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" placeholder="Masukkan nama pelanggan..." value={form.name} onChange={e => set('name', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. WhatsApp / HP</label>
                            <div className="relative">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" placeholder="08..." value={form.phone} onChange={e => set('phone', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipe Pelanggan</label>
                            <select className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white appearance-none cursor-pointer" value={form.type} onChange={e => set('type', e.target.value)}>
                                {Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Domisili</label>
                        <div className="relative">
                            <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" placeholder="Jl. Raya Utama..." value={form.address} onChange={e => set('address', e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Perusahaan / Instansi (Opsional)</label>
                        <div className="relative">
                            <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" placeholder="Instansi pemerintah/swasta..." value={form.company} onChange={e => set('company', e.target.value)} />
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3">
                        <button className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-2xl transition-all uppercase tracking-[0.15em] text-[10px]" onClick={() => setShowModal(false)}>
                            Batal
                        </button>
                        <button className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center justify-center gap-3 uppercase tracking-[0.15em] text-[10px] group" onClick={handleSave}>
                            <FiSave className="group-hover:scale-110 transition-transform" /> Simpan Data
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={<div className="flex items-center gap-2 text-rose-600"><FiTrash2 /> Hapus Data</div>}>
                <div className="p-4 text-center">
                    <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiTrash2 size={40} />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Konfirmasi Hapus</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                        Yakin ingin menghapus pelanggan <span className="font-black text-slate-900 dark:text-white uppercase">"{confirmDelete?.name}"</span>?<br />
                        Seluruh riwayat kaitan data ini akan dihapus permanen.
                    </p>
                    <div className="flex gap-4">
                        <button className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-2xl transition-all uppercase tracking-widest text-[10px]" onClick={() => setConfirmDelete(null)}>
                            Batal
                        </button>
                        <button className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-rose-100 dark:shadow-none uppercase tracking-widest text-[10px]" onClick={() => handleDelete(confirmDelete.id)}>
                            Ya, Hapus
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

const CSS = ``;
