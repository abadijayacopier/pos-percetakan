import { useState, useMemo } from 'react';
import db from '../db';
import { formatRupiah } from '../utils';
import Modal from '../components/Modal';
import {
    FiPackage,
    FiPlus,
    FiEdit,
    FiTrash2,
    FiSearch,
    FiAlertTriangle,
    FiSave,
    FiX,
    FiBox,
    FiLayers,
    FiDollarSign,
    FiPenTool,
    FiBookOpen,
    FiFolder,
    FiPaperclip,
    FiDroplet,
    FiFileText,
    FiPrinter,
    FiImage,
    FiTool,
    FiChevronLeft,
    FiChevronRight,
    FiTag,
    FiInfo
} from 'react-icons/fi';

const emptyForm = { code: '', name: '', categoryId: '', buyPrice: '', sellPrice: '', stock: '', minStock: '', unit: 'pcs', emoji: '📦', image: '' };

const CAT_ICONS = {
    c1: <FiPenTool size={18} />,
    c2: <FiBookOpen size={18} />,
    c3: <FiFolder size={18} />,
    c4: <FiPaperclip size={18} />,
    c5: <FiDroplet size={18} />,
    c6: <FiFileText size={18} />,
    c7: <FiPrinter size={18} />,
    c8: <FiImage size={18} />,
    c9: <FiTool size={18} />,
};

const CAT_ICON_SMALL = {
    c1: <FiPenTool size={12} />,
    c2: <FiBookOpen size={12} />,
    c3: <FiFolder size={12} />,
    c4: <FiPaperclip size={12} />,
    c5: <FiDroplet size={12} />,
    c6: <FiFileText size={12} />,
    c7: <FiPrinter size={12} />,
    c8: <FiImage size={12} />,
    c9: <FiTool size={12} />,
};

export default function InventoryPage() {
    const [products, setProducts] = useState(() => db.getAll('products'));
    const categories = useMemo(() => db.getAll('categories'), []);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    const reload = () => setProducts(db.getAll('products'));
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return products.filter(p => {
            const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q);
            const matchCat = filterCat === 'all' || p.categoryId === filterCat;
            return matchSearch && matchCat;
        });
    }, [products, search, filterCat]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const handleSearch = (v) => { setSearch(v); setPage(1); };
    const handleFilter = (v) => { setFilterCat(v); setPage(1); };

    const lowStockCount = products.filter(p => p.stock <= (p.minStock || 0) && (p.minStock || 0) > 0).length;
    const totalValue = products.reduce((s, p) => s + (p.sellPrice || 0) * (p.stock || 0), 0);
    const catCount = [...new Set(products.map(p => p.categoryId))].length;

    const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (p) => { setEditItem(p); setForm({ ...p, buyPrice: p.buyPrice || '', sellPrice: p.sellPrice || '', stock: p.stock || '', minStock: p.minStock || '' }); setShowModal(true); };

    const handleSave = () => {
        if (!form.name.trim()) return;
        const record = {
            ...form,
            buyPrice: Number(form.buyPrice) || 0,
            sellPrice: Number(form.sellPrice) || 0,
            stock: Number(form.stock) || 0,
            minStock: Number(form.minStock) || 0,
        };
        if (editItem) {
            db.update('products', editItem.id, record);
        } else {
            record.code = form.code || ('PRD-' + Date.now().toString(36).toUpperCase());
            db.insert('products', record);
        }
        setShowModal(false);
        reload();
    };

    const handleDelete = (id) => { db.delete('products', id); setConfirmDelete(null); reload(); };

    const getCatName = (catId) => { const c = categories.find(c => c.id === catId); return c ? c.name : '-'; };
    const getCatIcon = (catId) => CAT_ICONS[catId] || <FiBox size={18} />;
    const getCatIconSmall = (catId) => CAT_ICON_SMALL[catId] || <FiBox size={12} />;

    return (
        <div className="p-4 sm:p-8 space-y-8 font-display bg-slate-50/30 dark:bg-transparent min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100 dark:shadow-none"><FiPackage /></span>
                        Data Inventori
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-1 italic opacity-75">Product Management & Stock Control System</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                >
                    <FiPlus /> Tambah Produk
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Produk', value: products.length, icon: <FiBox />, color: 'blue', sub: 'Active Inventory' },
                    { label: 'Kategori', value: catCount, icon: <FiLayers />, color: 'indigo', sub: 'Product Groups' },
                    { label: 'Stok Menipis', value: lowStockCount, icon: <FiAlertTriangle />, color: lowStockCount > 0 ? 'rose' : 'slate', sub: 'Need Restock' },
                    { label: 'Nilai Inventori', value: formatRupiah(totalValue), icon: <FiDollarSign />, color: 'emerald', sub: 'Total Asset Value' },
                ].map((s, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${s.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                                    s.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' :
                                        s.color === 'rose' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' :
                                            s.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                                                'bg-slate-50 dark:bg-slate-800 text-slate-400'
                                }`}>
                                {s.icon}
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.sub}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-75">{s.label}</p>
                        <h4 className={`text-2xl font-black tracking-tighter italic ${s.color === 'rose' ? 'text-rose-600' : 'text-slate-900 dark:text-white'
                            }`}>
                            {typeof s.value === 'number' ? String(s.value).padStart(2, '0') : s.value}
                        </h4>
                    </div>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Filter Bar */}
                <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col lg:flex-row gap-6 bg-slate-50/30 dark:bg-slate-800/20">
                    <div className="relative group flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none transition-transform group-focus-within:translate-x-1">
                            <div className="p-2 border border-transparent group-focus-within:text-blue-600 text-slate-400">
                                <FiSearch size={16} />
                            </div>
                        </div>
                        <input
                            className="block w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                            placeholder="Cari nama atau kode produk..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterCat === 'all' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600'}`}
                            onClick={() => handleFilter('all')}
                        >
                            Semua
                        </button>
                        {categories.map(c => (
                            <button
                                key={c.id}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterCat === c.id ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600'}`}
                                onClick={() => handleFilter(c.id)}
                            >
                                {getCatIconSmall(c.id)}
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table Area */}
                <div className="overflow-x-auto">
                    {filtered.length === 0 ? (
                        <div className="py-24 text-center">
                            <FiBox size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-800" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">{search ? 'Hasil pencarian tidak ditemukan' : 'Inventori kosong'}</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="text-left bg-slate-50/50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produk & Unit</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kode</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Harga Beli</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Harga Jual</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stok</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {paginated.map(p => {
                                    const isLow = p.stock <= (p.minStock || 0) && (p.minStock || 0) > 0;
                                    return (
                                        <tr key={p.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all shadow-sm">
                                                        {getCatIcon(p.categoryId)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{p.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-75">{p.unit}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                                                    {p.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                    {getCatName(p.categoryId)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-bold text-slate-500 italic">
                                                {formatRupiah(p.buyPrice)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-xs font-black text-slate-900 dark:text-white italic tracking-tighter">
                                                    {formatRupiah(p.sellPrice)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`text-[11px] font-black uppercase tracking-tight flex items-center gap-1.5 ${isLow ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                                                        {isLow && <FiAlertTriangle className="animate-pulse" />}
                                                        {p.stock} <span className="text-[9px] font-bold text-slate-400">{p.unit}</span>
                                                    </span>
                                                    {p.minStock > 0 && <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Min: {p.minStock}</p>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                                                    <button
                                                        onClick={() => openEdit(p)}
                                                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all shadow-sm"
                                                    >
                                                        <FiEdit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(p)}
                                                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all shadow-sm"
                                                    >
                                                        <FiTrash2 size={14} />
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

                {/* Pagination */}
                {filtered.length > PER_PAGE && (
                    <div className="p-6 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Displaying {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} products
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
                            >
                                <FiChevronLeft size={18} />
                            </button>
                            <span className="text-xs font-black min-w-[3rem] text-center dark:text-white">
                                {page} <span className="text-slate-400">/</span> {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
                            >
                                <FiChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editItem ? 'Koreksi Data Produk' : 'Registrasi Produk Baru'}
                icon={editItem ? <FiEdit className="text-blue-600" /> : <FiPlus className="text-emerald-600" />}
                footer={
                    <div className="flex gap-4 w-full">
                        <button className="flex-1 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500" onClick={() => setShowModal(false)}>
                            <FiX className="inline mr-2" /> Batal
                        </button>
                        <button className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center" onClick={handleSave}>
                            <FiSave className="mr-2" /> Simpan Produk
                        </button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex gap-4 items-center">
                        <div className="size-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                            <FiInfo />
                        </div>
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase leading-relaxed tracking-wide">Lengkapi data produk dengan benar untuk akurasi laporan stok dan keuangan.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Produk *</label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400/50"
                                placeholder="Contoh: Kertas HVS A4 80gr"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kode Produk</label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400/50 font-mono"
                                placeholder="Otomatis"
                                value={form.code}
                                onChange={e => set('code', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Satuan Unit</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                value={form.unit}
                                onChange={e => set('unit', e.target.value)}
                            >
                                {['pcs', 'box', 'rim', 'roll', 'lembar', 'kg', 'liter', 'set'].map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                value={form.categoryId}
                                onChange={e => set('categoryId', e.target.value)}
                            >
                                <option value="">-- ILIH KATEGORI --</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stok Awal</label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                type="number"
                                value={form.stock}
                                onChange={e => set('stock', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga Beli</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 italic">Rp</span>
                                <input
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 pl-10 pr-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    type="number"
                                    value={form.buyPrice}
                                    onChange={e => set('buyPrice', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga Jual</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 italic">Rp</span>
                                <input
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 pl-10 pr-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    type="number"
                                    value={form.sellPrice}
                                    onChange={e => set('sellPrice', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Batas Stok Minimum</label>
                            <input
                                className="w-full bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/50 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-indigo-600 placeholder:text-indigo-400/50"
                                type="number"
                                value={form.minStock}
                                onChange={e => set('minStock', e.target.value)}
                                placeholder="Alert stock level..."
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Confirm Delete */}
            <Modal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                title="Konfirmasi Penghapusan"
                icon={<FiAlertTriangle className="text-rose-600" />}
                footer={
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <button className="py-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200" onClick={() => setConfirmDelete(null)}>Gagalkan</button>
                        <button className="py-3.5 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-500/20 active:scale-95" onClick={() => handleDelete(confirmDelete.id)}>Ya, Hapus Permanen</button>
                    </div>
                }
            >
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/50 mb-4">
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-400 leading-relaxed text-center italic">
                        "Apakah Anda yakin ingin menghapus produk <span className="uppercase not-italic font-black text-rose-800 dark:text-rose-300">[{confirmDelete?.name}]</span>? Data yang dihapus tidak dapat dipulihkan kembali."
                    </p>
                </div>
            </Modal>
        </div>
    );
}
