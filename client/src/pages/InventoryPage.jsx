import { useState, useMemo } from 'react';
import db from '../db';
import { formatRupiah } from '../utils';
import Modal from '../components/Modal';
import { FiPackage, FiPlus, FiEdit, FiTrash2, FiSearch, FiAlertTriangle, FiSave, FiX, FiBox, FiTag, FiLayers, FiDollarSign, FiPenTool, FiBookOpen, FiFolder, FiPaperclip, FiDroplet, FiFileText, FiPrinter, FiImage, FiTool, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const emptyForm = { code: '', name: '', categoryId: '', buyPrice: '', sellPrice: '', stock: '', minStock: '', unit: 'pcs', emoji: '📦', image: '' };

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

    // Reset page when filter/search changes
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
    const getCatIcon = (catId) => CAT_ICONS[catId] || <FiBox size={18} />;

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
    const getCatIconSmall = (catId) => CAT_ICON_SMALL[catId] || <FiBox size={12} />;

    return (
        <div style={{ padding: '24px 28px', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <style>{CSS}</style>

            {/* Header */}
            <div className="inv-header">
                <div>
                    <h1 className="inv-title"><FiPackage style={{ verticalAlign: 'middle' }} /> Data Inventori</h1>
                    <p className="inv-sub">Kelola produk dan stok barang</p>
                </div>
                <button className="inv-btn-primary" onClick={openAdd}><FiPlus /> Tambah Produk</button>
            </div>

            {/* Stats */}
            <div className="inv-stats">
                {[
                    { label: 'Total Produk', value: products.length, icon: <FiBox />, color: '#3b82f6', bg: '#dbeafe' },
                    { label: 'Kategori', value: catCount, icon: <FiLayers />, color: '#8b5cf6', bg: '#ede9fe' },
                    { label: 'Stok Menipis', value: lowStockCount, icon: <FiAlertTriangle />, color: lowStockCount > 0 ? '#ef4444' : '#94a3b8', bg: lowStockCount > 0 ? '#fee2e2' : '#f1f5f9' },
                    { label: 'Nilai Inventori', value: formatRupiah(totalValue), icon: <FiDollarSign />, color: '#10b981', bg: '#d1fae5' },
                ].map(s => (
                    <div key={s.label} className="inv-stat-card">
                        <div className="inv-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        <div>
                            <p className="inv-stat-label">{s.label}</p>
                            <p className="inv-stat-value" style={{ color: s.color }}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter & Search */}
            <div className="inv-card">
                <div className="inv-filter-bar">
                    <div className="inv-search-wrap">
                        <FiSearch className="inv-search-icon" />
                        <input className="inv-search" placeholder="Cari nama / kode produk..." value={search} onChange={e => handleSearch(e.target.value)} />
                    </div>
                    <div className="inv-filter-tabs">
                        <button className={`inv-tab ${filterCat === 'all' ? 'active' : ''}`} onClick={() => handleFilter('all')}>Semua</button>
                        {categories.map(c => (
                            <button key={c.id} className={`inv-tab ${filterCat === c.id ? 'active' : ''}`} onClick={() => handleFilter(c.id)}>
                                {getCatIconSmall(c.id)} {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                {filtered.length === 0 ? (
                    <div className="inv-empty"><FiPackage size={48} /><p>{search ? 'Produk tidak ditemukan.' : 'Belum ada produk.'}</p></div>
                ) : (
                    <div className="inv-table-wrap">
                        <table className="inv-table">
                            <thead>
                                <tr>
                                    <th>Produk</th>
                                    <th>Kode</th>
                                    <th>Kategori</th>
                                    <th>Harga Beli</th>
                                    <th>Harga Jual</th>
                                    <th>Stok</th>
                                    <th style={{ textAlign: 'right' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map(p => {
                                    const isLow = p.stock <= (p.minStock || 0) && (p.minStock || 0) > 0;
                                    return (
                                        <tr key={p.id} className="inv-tr">
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span className="inv-product-icon">{getCatIcon(p.categoryId)}</span>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{p.name}</div>
                                                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{p.unit}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '.8rem', color: 'var(--text-secondary)' }}>{p.code}</td>
                                            <td><span className="inv-badge">{getCatName(p.categoryId)}</span></td>
                                            <td style={{ fontSize: '.85rem' }}>{formatRupiah(p.buyPrice)}</td>
                                            <td style={{ fontWeight: 700 }}>{formatRupiah(p.sellPrice)}</td>
                                            <td>
                                                <span style={{ fontWeight: 700, color: isLow ? '#ef4444' : 'var(--text-primary)' }}>
                                                    {isLow && <FiAlertTriangle size={13} style={{ marginRight: 3, verticalAlign: 'middle' }} />}{p.stock} {p.unit}
                                                </span>
                                                {p.minStock > 0 && <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>Min: {p.minStock}</div>}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                                                    <button className="inv-action-btn" onClick={() => openEdit(p)} title="Edit"><FiEdit size={15} /></button>
                                                    <button className="inv-action-btn del" onClick={() => setConfirmDelete(p)} title="Hapus"><FiTrash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {filtered.length > PER_PAGE && (
                    <div className="inv-pagination">
                        <span className="inv-page-info">Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length}</span>
                        <div className="inv-page-btns">
                            <button className="inv-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><FiChevronLeft size={16} /> Prev</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                <button key={n} className={`inv-page-num ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                            ))}
                            <button className="inv-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next <FiChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Produk' : 'Tambah Produk Baru'} footer={
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button className="inv-btn-ghost" onClick={() => setShowModal(false)}><FiX /> Batal</button>
                    <button className="inv-btn-primary" onClick={handleSave}><FiSave /> Simpan</button>
                </div>
            }>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="inv-form-row">
                        <div className="inv-form-group" style={{ flex: 2 }}>
                            <label className="inv-label">Nama Produk *</label>
                            <input className="inv-input" placeholder="Pulpen Pilot BP-1RT" value={form.name} onChange={e => set('name', e.target.value)} />
                        </div>
                        <div className="inv-form-group">
                            <label className="inv-label">Kode</label>
                            <input className="inv-input" placeholder="ATK-001" value={form.code} onChange={e => set('code', e.target.value)} />
                        </div>
                    </div>
                    <div className="inv-form-row">
                        <div className="inv-form-group">
                            <label className="inv-label">Kategori</label>
                            <select className="inv-input" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                                <option value="">-- Pilih --</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="inv-form-group">
                            <label className="inv-label">Satuan</label>
                            <select className="inv-input" value={form.unit} onChange={e => set('unit', e.target.value)}>
                                {['pcs', 'box', 'rim', 'roll', 'lembar', 'kg', 'liter', 'set'].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="inv-form-row">
                        <div className="inv-form-group">
                            <label className="inv-label">Harga Beli (Rp)</label>
                            <input className="inv-input" type="number" min="0" placeholder="3500" value={form.buyPrice} onChange={e => set('buyPrice', e.target.value)} />
                        </div>
                        <div className="inv-form-group">
                            <label className="inv-label">Harga Jual (Rp)</label>
                            <input className="inv-input" type="number" min="0" placeholder="5000" value={form.sellPrice} onChange={e => set('sellPrice', e.target.value)} />
                        </div>
                    </div>
                    <div className="inv-form-row">
                        <div className="inv-form-group">
                            <label className="inv-label">Stok</label>
                            <input className="inv-input" type="number" min="0" placeholder="50" value={form.stock} onChange={e => set('stock', e.target.value)} />
                        </div>
                        <div className="inv-form-group">
                            <label className="inv-label">Stok Minimum</label>
                            <input className="inv-input" type="number" min="0" placeholder="10" value={form.minStock} onChange={e => set('minStock', e.target.value)} />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Hapus Produk" footer={
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button className="inv-btn-ghost" onClick={() => setConfirmDelete(null)}>Batal</button>
                    <button className="inv-btn-danger" onClick={() => handleDelete(confirmDelete.id)}><FiTrash2 /> Hapus</button>
                </div>
            }>
                <p>Yakin ingin menghapus produk <strong>{confirmDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
            </Modal>
        </div>
    );
}

const CSS = `
.inv-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.inv-title { font-size:1.4rem; font-weight:800; margin:0; display:flex; align-items:center; gap:8px; color:var(--text-primary); }
.inv-sub { color:var(--text-secondary); margin:4px 0 0; font-size:.875rem; }
.inv-btn-primary { display:flex; align-items:center; gap:7px; background:#3b82f6; color:#fff; font-weight:700; font-size:.875rem; padding:10px 20px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(59,130,246,.25); transition:all .15s; }
.inv-btn-primary:hover { background:#2563eb; }
.inv-btn-ghost { display:flex; align-items:center; gap:6px; background:var(--bg-input); color:var(--text-secondary); font-weight:700; font-size:.875rem; padding:9px 16px; border-radius:9px; border:1px solid var(--border); cursor:pointer; flex:1; justify-content:center; }
.inv-btn-danger { display:flex; align-items:center; gap:6px; background:#ef4444; color:#fff; font-weight:700; font-size:.875rem; padding:9px 16px; border-radius:9px; border:none; cursor:pointer; flex:1; justify-content:center; }

.inv-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
@media(max-width:900px){ .inv-stats { grid-template-columns:repeat(2,1fr); } }
@media(max-width:500px){ .inv-stats { grid-template-columns:1fr; } }
.inv-stat-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:14px; padding:18px; display:flex; align-items:center; gap:14px; }
.inv-stat-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:1.2rem; }
.inv-stat-label { font-size:.72rem; color:var(--text-muted); font-weight:600; margin:0 0 3px; text-transform:uppercase; letter-spacing:.04em; }
.inv-stat-value { font-size:1.4rem; font-weight:900; margin:0; }

.inv-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
.inv-filter-bar { display:flex; align-items:center; gap:14px; padding:16px 20px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
.inv-search-wrap { position:relative; flex:1; min-width:180px; }
.inv-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:16px; }
.inv-search { width:100%; padding:8px 12px 8px 36px; border:1px solid var(--border); border-radius:8px; font-size:.875rem; outline:none; background:var(--bg-input); color:var(--text-primary); }
.inv-search:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
.inv-filter-tabs { display:flex; gap:6px; flex-wrap:wrap; }
.inv-tab { padding:6px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.73rem; font-weight:600; color:var(--text-secondary); cursor:pointer; transition:all .15s; white-space:nowrap; }
.inv-tab:hover { border-color:#3b82f6; color:#3b82f6; }
.inv-tab.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }

.inv-empty { padding:48px; text-align:center; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; gap:8px; }
.inv-table-wrap { overflow-x:auto; }
.inv-table { width:100%; border-collapse:collapse; text-align:left; }
.inv-table thead tr { background:var(--bg-input); }
.inv-table th { padding:11px 18px; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); white-space:nowrap; }
.inv-tr { border-top:1px solid var(--border); transition:background .1s; }
.inv-tr:hover { background:var(--bg-card-hover); }
.inv-table td { padding:12px 18px; vertical-align:middle; }
.inv-badge { padding:3px 9px; font-size:.68rem; font-weight:700; border-radius:9999px; background:var(--bg-input); color:var(--text-secondary); white-space:nowrap; }
.inv-product-icon { width:36px; height:36px; border-radius:8px; background:var(--bg-input); display:flex; align-items:center; justify-content:center; color:var(--text-secondary); flex-shrink:0; }
.inv-tab { display:flex; align-items:center; gap:4px; }
.inv-action-btn { background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; align-items:center; padding:6px; border-radius:7px; transition:all .15s; }
.inv-action-btn:hover { color:#3b82f6; background:rgba(59,130,246,.1); }
.inv-action-btn.del:hover { color:#ef4444; background:rgba(239,68,68,.1); }

.inv-form-row { display:flex; gap:12px; }
@media(max-width:500px){ .inv-form-row { flex-direction:column; } }
.inv-form-group { display:flex; flex-direction:column; flex:1; }
.inv-label { display:block; font-size:.77rem; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.inv-input { width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:.875rem; outline:none; background:var(--bg-input); color:var(--text-primary); box-sizing:border-box; }
.inv-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
select.inv-input { appearance:auto; }

.inv-pagination { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-top:1px solid var(--border); flex-wrap:wrap; gap:10px; }
.inv-page-info { font-size:.78rem; color:var(--text-muted); font-weight:600; }
.inv-page-btns { display:flex; align-items:center; gap:4px; }
.inv-page-btn { display:flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.78rem; font-weight:600; color:var(--text-secondary); cursor:pointer; transition:all .15s; }
.inv-page-btn:hover:not(:disabled) { border-color:#3b82f6; color:#3b82f6; }
.inv-page-btn:disabled { opacity:.4; cursor:not-allowed; }
.inv-page-num { width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.78rem; font-weight:700; color:var(--text-secondary); cursor:pointer; transition:all .15s; }
.inv-page-num:hover { border-color:#3b82f6; color:#3b82f6; }
.inv-page-num.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }
`;
