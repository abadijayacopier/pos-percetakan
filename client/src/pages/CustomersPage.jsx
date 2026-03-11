import { useState, useMemo } from 'react';
import db from '../db';
import { formatRupiah, formatDate } from '../utils';
import Modal from '../components/Modal';
import { FiUsers, FiPlus, FiEdit, FiTrash2, FiSearch, FiSave, FiX, FiStar, FiBriefcase, FiUser, FiTool, FiPhone, FiMapPin, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const TYPE_MAP = {
    walkin: { label: 'Walk-in', color: '#6b7280', bg: '#f3f4f6', icon: <FiUser size={12} /> },
    vip: { label: 'VIP', color: '#f59e0b', bg: '#fef3c7', icon: <FiStar size={12} /> },
    corporate: { label: 'Corporate', color: '#3b82f6', bg: '#dbeafe', icon: <FiBriefcase size={12} /> },
    service: { label: 'Service', color: '#8b5cf6', bg: '#ede9fe', icon: <FiTool size={12} /> },
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
        <div style={{ padding: '24px 28px', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <style>{CSS}</style>

            {/* Header */}
            <div className="cust-header">
                <div>
                    <h1 className="cust-title"><FiUsers style={{ verticalAlign: 'middle' }} /> Data Pelanggan</h1>
                    <p className="cust-sub">Kelola data pelanggan toko</p>
                </div>
                <button className="cust-btn-primary" onClick={openAdd}><FiPlus /> Tambah Pelanggan</button>
            </div>

            {/* Stats */}
            <div className="cust-stats">
                {[
                    { label: 'Total Pelanggan', value: customers.length, ...TYPE_MAP.walkin, color: '#3b82f6', bg: '#dbeafe' },
                    { label: 'VIP', value: typeCount('vip'), ...TYPE_MAP.vip },
                    { label: 'Corporate', value: typeCount('corporate'), ...TYPE_MAP.corporate },
                    { label: 'Service', value: typeCount('service'), ...TYPE_MAP.service },
                ].map(s => (
                    <div key={s.label} className="cust-stat-card">
                        <div className="cust-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        <div>
                            <p className="cust-stat-label">{s.label}</p>
                            <p className="cust-stat-value" style={{ color: s.color }}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter & Search */}
            <div className="cust-card">
                <div className="cust-filter-bar">
                    <div className="cust-search-wrap">
                        <FiSearch className="cust-search-icon" />
                        <input className="cust-search" placeholder="Cari nama / telepon / perusahaan..." value={search} onChange={e => handleSearch(e.target.value)} />
                    </div>
                    <div className="cust-filter-tabs">
                        <button className={`cust-tab ${filterType === 'all' ? 'active' : ''}`} onClick={() => handleFilter('all')}>Semua</button>
                        {Object.entries(TYPE_MAP).map(([key, t]) => (
                            <button key={key} className={`cust-tab ${filterType === key ? 'active' : ''}`} onClick={() => handleFilter(key)}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                {filtered.length === 0 ? (
                    <div className="cust-empty"><FiUsers size={48} /><p>{search ? 'Pelanggan tidak ditemukan.' : 'Belum ada data pelanggan.'}</p></div>
                ) : (
                    <div className="cust-table-wrap">
                        <table className="cust-table">
                            <thead>
                                <tr>
                                    <th>Nama</th>
                                    <th>Telepon</th>
                                    <th>Tipe</th>
                                    <th>Perusahaan</th>
                                    <th>Total Transaksi</th>
                                    <th>Total Belanja</th>
                                    <th style={{ textAlign: 'right' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map(c => {
                                    const t = TYPE_MAP[c.type] || TYPE_MAP.walkin;
                                    return (
                                        <tr key={c.id} className="cust-tr">
                                            <td>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{c.name}</div>
                                                    {c.address && <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}><FiMapPin size={10} /> {c.address}</div>}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}><FiPhone size={12} /> {c.phone || '-'}</td>
                                            <td><span className="cust-badge" style={{ background: t.bg, color: t.color }}>{t.icon} {t.label}</span></td>
                                            <td style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>{c.company || '-'}</td>
                                            <td style={{ fontWeight: 600, textAlign: 'center' }}>{c.totalTrx || 0}x</td>
                                            <td style={{ fontWeight: 700, color: '#10b981' }}>{formatRupiah(c.totalSpend || 0)}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                                                    <button className="cust-action-btn" onClick={() => openEdit(c)} title="Edit"><FiEdit size={15} /></button>
                                                    <button className="cust-action-btn del" onClick={() => setConfirmDelete(c)} title="Hapus"><FiTrash2 size={15} /></button>
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
                    <div className="cust-pagination">
                        <span className="cust-page-info">Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length}</span>
                        <div className="cust-page-btns">
                            <button className="cust-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><FiChevronLeft size={16} /> Prev</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                <button key={n} className={`cust-page-num ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                            ))}
                            <button className="cust-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next <FiChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'} footer={
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button className="cust-btn-ghost" onClick={() => setShowModal(false)}><FiX /> Batal</button>
                    <button className="cust-btn-primary" onClick={handleSave}><FiSave /> Simpan</button>
                </div>
            }>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="cust-form-group">
                        <label className="cust-label">Nama Pelanggan *</label>
                        <input className="cust-input" placeholder="Pak Ahmad" value={form.name} onChange={e => set('name', e.target.value)} />
                    </div>
                    <div className="cust-form-row">
                        <div className="cust-form-group">
                            <label className="cust-label">No. Telepon</label>
                            <input className="cust-input" placeholder="081234567890" value={form.phone} onChange={e => set('phone', e.target.value)} />
                        </div>
                        <div className="cust-form-group">
                            <label className="cust-label">Tipe Pelanggan</label>
                            <select className="cust-input" value={form.type} onChange={e => set('type', e.target.value)}>
                                {Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="cust-form-group">
                        <label className="cust-label">Alamat</label>
                        <input className="cust-input" placeholder="Jl. Merdeka No. 5" value={form.address} onChange={e => set('address', e.target.value)} />
                    </div>
                    <div className="cust-form-group">
                        <label className="cust-label">Perusahaan / Instansi</label>
                        <input className="cust-input" placeholder="Kantor Kecamatan (opsional)" value={form.company} onChange={e => set('company', e.target.value)} />
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Hapus Pelanggan" footer={
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button className="cust-btn-ghost" onClick={() => setConfirmDelete(null)}>Batal</button>
                    <button className="cust-btn-danger" onClick={() => handleDelete(confirmDelete.id)}><FiTrash2 /> Hapus</button>
                </div>
            }>
                <p>Yakin ingin menghapus pelanggan <strong>{confirmDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
            </Modal>
        </div >
    );
}

const CSS = `
.cust-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.cust-title { font-size:1.4rem; font-weight:800; margin:0; display:flex; align-items:center; gap:8px; color:var(--text-primary); }
.cust-sub { color:var(--text-secondary); margin:4px 0 0; font-size:.875rem; }
.cust-btn-primary { display:flex; align-items:center; gap:7px; background:#3b82f6; color:#fff; font-weight:700; font-size:.875rem; padding:10px 20px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(59,130,246,.25); transition:all .15s; }
.cust-btn-primary:hover { background:#2563eb; }
.cust-btn-ghost { display:flex; align-items:center; gap:6px; background:var(--bg-input); color:var(--text-secondary); font-weight:700; font-size:.875rem; padding:9px 16px; border-radius:9px; border:1px solid var(--border); cursor:pointer; flex:1; justify-content:center; }
.cust-btn-danger { display:flex; align-items:center; gap:6px; background:#ef4444; color:#fff; font-weight:700; font-size:.875rem; padding:9px 16px; border-radius:9px; border:none; cursor:pointer; flex:1; justify-content:center; }

.cust-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
@media(max-width:900px){ .cust-stats { grid-template-columns:repeat(2,1fr); } }
@media(max-width:500px){ .cust-stats { grid-template-columns:1fr; } }
.cust-stat-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:14px; padding:18px; display:flex; align-items:center; gap:14px; }
.cust-stat-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:1.2rem; }
.cust-stat-label { font-size:.72rem; color:var(--text-muted); font-weight:600; margin:0 0 3px; text-transform:uppercase; letter-spacing:.04em; }
.cust-stat-value { font-size:1.4rem; font-weight:900; margin:0; }

.cust-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
.cust-filter-bar { display:flex; align-items:center; gap:14px; padding:16px 20px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
.cust-search-wrap { position:relative; flex:1; min-width:180px; }
.cust-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:16px; }
.cust-search { width:100%; padding:8px 12px 8px 36px; border:1px solid var(--border); border-radius:8px; font-size:.875rem; outline:none; background:var(--bg-input); color:var(--text-primary); }
.cust-search:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
.cust-filter-tabs { display:flex; gap:6px; flex-wrap:wrap; }
.cust-tab { padding:6px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.73rem; font-weight:600; color:var(--text-secondary); cursor:pointer; transition:all .15s; white-space:nowrap; display:flex; align-items:center; gap:4px; }
.cust-tab:hover { border-color:#3b82f6; color:#3b82f6; }
.cust-tab.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }

.cust-empty { padding:48px; text-align:center; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; gap:8px; }
.cust-table-wrap { overflow-x:auto; }
.cust-table { width:100%; border-collapse:collapse; text-align:left; }
.cust-table thead tr { background:var(--bg-input); }
.cust-table th { padding:11px 18px; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); white-space:nowrap; }
.cust-tr { border-top:1px solid var(--border); transition:background .1s; }
.cust-tr:hover { background:var(--bg-card-hover); }
.cust-table td { padding:12px 18px; vertical-align:middle; }
.cust-badge { padding:3px 9px; font-size:.68rem; font-weight:700; border-radius:9999px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px; }
.cust-action-btn { background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; align-items:center; padding:6px; border-radius:7px; transition:all .15s; }
.cust-action-btn:hover { color:#3b82f6; background:rgba(59,130,246,.1); }
.cust-action-btn.del:hover { color:#ef4444; background:rgba(239,68,68,.1); }

.cust-form-row { display:flex; gap:12px; }
@media(max-width:500px){ .cust-form-row { flex-direction:column; } }
.cust-form-group { display:flex; flex-direction:column; flex:1; }
.cust-label { display:block; font-size:.77rem; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.cust-input { width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:.875rem; outline:none; background:var(--bg-input); color:var(--text-primary); box-sizing:border-box; }
.cust-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
select.cust-input { appearance:auto; }

.cust-pagination { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-top:1px solid var(--border); flex-wrap:wrap; gap:10px; }
.cust-page-info { font-size:.78rem; color:var(--text-muted); font-weight:600; }
.cust-page-btns { display:flex; align-items:center; gap:4px; }
.cust-page-btn { display:flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.78rem; font-weight:600; color:var(--text-secondary); cursor:pointer; transition:all .15s; }
.cust-page-btn:hover:not(:disabled) { border-color:#3b82f6; color:#3b82f6; }
.cust-page-btn:disabled { opacity:.4; cursor:not-allowed; }
.cust-page-num { width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.78rem; font-weight:700; color:var(--text-secondary); cursor:pointer; transition:all .15s; }
.cust-page-num:hover { border-color:#3b82f6; color:#3b82f6; }
.cust-page-num.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }
`;
