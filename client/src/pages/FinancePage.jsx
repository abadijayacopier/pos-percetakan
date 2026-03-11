import { useState, useMemo } from 'react';
import db from '../db';
import { formatRupiah, formatDateTime, formatDate } from '../utils';
import Modal from '../components/Modal';
import { FiDollarSign, FiPlus, FiEdit, FiTrash2, FiSearch, FiSave, FiX, FiArrowUpCircle, FiArrowDownCircle, FiBookOpen, FiChevronLeft, FiChevronRight, FiCalendar, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const CATEGORIES_IN = ['Penjualan', 'Setoran Modal', 'Piutang Masuk', 'Pendapatan Lain'];
const CATEGORIES_OUT = ['Pembelian Stok', 'Gaji', 'Listrik & Air', 'Sewa', 'Operasional', 'Pengeluaran Lain'];

const emptyForm = { date: new Date().toISOString().slice(0, 10), description: '', amount: '', type: 'in', category: '', reference: '' };

export default function FinancePage() {
    const [cashFlow, setCashFlow] = useState(() => db.getAll('cash_flow'));
    const [activeTab, setActiveTab] = useState('journal');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    const reload = () => setCashFlow(db.getAll('cash_flow'));
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return cashFlow.filter(c => {
            const matchSearch = !q || (c.description || '').toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q);
            if (activeTab === 'in') return matchSearch && c.type === 'in';
            if (activeTab === 'out') return matchSearch && c.type === 'out';
            return matchSearch;
        }).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    }, [cashFlow, search, activeTab]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const totalIn = cashFlow.filter(c => c.type === 'in').reduce((s, c) => s + (c.amount || 0), 0);
    const totalOut = cashFlow.filter(c => c.type === 'out').reduce((s, c) => s + (c.amount || 0), 0);
    const saldo = totalIn - totalOut;

    const openAdd = (type) => { setEditItem(null); setForm({ ...emptyForm, type: type || 'in' }); setShowModal(true); };
    const openEdit = (c) => { setEditItem(c); setForm({ date: (c.date || c.createdAt || '').slice(0, 10), description: c.description || '', amount: c.amount || '', type: c.type || 'in', category: c.category || '', reference: c.reference || '' }); setShowModal(true); };

    const handleSave = () => {
        if (!form.description.trim() || !form.amount) return;
        const record = { ...form, amount: Number(form.amount) || 0 };
        if (editItem) {
            db.update('cash_flow', editItem.id, record);
        } else {
            db.insert('cash_flow', record);
        }
        db.logActivity('Admin', editItem ? 'Edit Kas' : 'Tambah Kas', `${record.type === 'in' ? 'Kas Masuk' : 'Kas Keluar'}: ${record.description} - ${formatRupiah(record.amount)}`);
        setShowModal(false);
        reload();
    };

    const handleDelete = (id) => { db.delete('cash_flow', id); setConfirmDelete(null); reload(); };
    const handleSearch = (v) => { setSearch(v); setPage(1); };
    const handleTab = (v) => { setActiveTab(v); setPage(1); };

    return (
        <div style={{ padding: '24px 28px', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <style>{CSS}</style>

            <div className="fin-header">
                <div>
                    <h1 className="fin-title"><FiDollarSign /> Kas & Keuangan</h1>
                    <p className="fin-sub">Jurnal umum, kas masuk & keluar</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="fin-btn-success" onClick={() => openAdd('in')}><FiArrowDownCircle /> Kas Masuk</button>
                    <button className="fin-btn-danger" onClick={() => openAdd('out')}><FiArrowUpCircle /> Kas Keluar</button>
                </div>
            </div>

            {/* Stats */}
            <div className="fin-stats">
                <div className="fin-stat-card">
                    <div className="fin-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}><FiTrendingUp /></div>
                    <div><p className="fin-stat-label">Kas Masuk</p><p className="fin-stat-value" style={{ color: '#10b981' }}>{formatRupiah(totalIn)}</p></div>
                </div>
                <div className="fin-stat-card">
                    <div className="fin-stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}><FiTrendingDown /></div>
                    <div><p className="fin-stat-label">Kas Keluar</p><p className="fin-stat-value" style={{ color: '#ef4444' }}>{formatRupiah(totalOut)}</p></div>
                </div>
                <div className="fin-stat-card">
                    <div className="fin-stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}><FiDollarSign /></div>
                    <div><p className="fin-stat-label">Saldo</p><p className="fin-stat-value" style={{ color: saldo >= 0 ? '#10b981' : '#ef4444' }}>{formatRupiah(saldo)}</p></div>
                </div>
                <div className="fin-stat-card">
                    <div className="fin-stat-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}><FiBookOpen /></div>
                    <div><p className="fin-stat-label">Total Entri</p><p className="fin-stat-value" style={{ color: '#8b5cf6' }}>{cashFlow.length}</p></div>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="fin-card">
                <div className="fin-filter-bar">
                    <div className="fin-tabs">
                        {[
                            { key: 'journal', label: 'Jurnal Umum', icon: <FiBookOpen size={14} /> },
                            { key: 'in', label: 'Kas Masuk', icon: <FiArrowDownCircle size={14} /> },
                            { key: 'out', label: 'Kas Keluar', icon: <FiArrowUpCircle size={14} /> },
                        ].map(t => (
                            <button key={t.key} className={`fin-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => handleTab(t.key)}>{t.icon} {t.label}</button>
                        ))}
                    </div>
                    <div className="fin-search-wrap">
                        <FiSearch className="fin-search-icon" />
                        <input className="fin-search" placeholder="Cari deskripsi / kategori..." value={search} onChange={e => handleSearch(e.target.value)} />
                    </div>
                </div>

                {paginated.length === 0 ? (
                    <div className="fin-empty"><FiBookOpen size={48} /><p>Belum ada entri jurnal.</p></div>
                ) : (
                    <div className="fin-table-wrap">
                        <table className="fin-table">
                            <thead><tr>
                                <th>Tanggal</th><th>Deskripsi</th><th>Kategori</th><th>Referensi</th><th>Debit</th><th>Kredit</th><th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr></thead>
                            <tbody>
                                {paginated.map(c => (
                                    <tr key={c.id} className="fin-tr">
                                        <td style={{ fontSize: '.82rem', whiteSpace: 'nowrap' }}>{formatDate(c.date || c.createdAt)}</td>
                                        <td style={{ fontWeight: 600 }}>{c.description}</td>
                                        <td><span className={`fin-badge ${c.type}`}>{c.category || c.type === 'in' ? 'Masuk' : 'Keluar'}</span></td>
                                        <td style={{ fontSize: '.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.reference || '-'}</td>
                                        <td style={{ fontWeight: 700, color: c.type === 'in' ? '#10b981' : 'var(--text-muted)' }}>{c.type === 'in' ? formatRupiah(c.amount) : '-'}</td>
                                        <td style={{ fontWeight: 700, color: c.type === 'out' ? '#ef4444' : 'var(--text-muted)' }}>{c.type === 'out' ? formatRupiah(c.amount) : '-'}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                                                <button className="fin-action-btn" onClick={() => openEdit(c)}><FiEdit size={15} /></button>
                                                <button className="fin-action-btn del" onClick={() => setConfirmDelete(c)}><FiTrash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {filtered.length > PER_PAGE && (
                    <div className="fin-pagination">
                        <span className="fin-page-info">Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length}</span>
                        <div className="fin-page-btns">
                            <button className="fin-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><FiChevronLeft size={16} /> Prev</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                <button key={n} className={`fin-page-num ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                            ))}
                            <button className="fin-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next <FiChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Entri Kas' : `Tambah Kas ${form.type === 'in' ? 'Masuk' : 'Keluar'}`} footer={
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button className="fin-btn-ghost" onClick={() => setShowModal(false)}><FiX /> Batal</button>
                    <button className="fin-btn-primary" onClick={handleSave}><FiSave /> Simpan</button>
                </div>
            }>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="fin-form-row">
                        <div className="fin-form-group">
                            <label className="fin-label">Tanggal</label>
                            <input className="fin-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                        </div>
                        <div className="fin-form-group">
                            <label className="fin-label">Tipe</label>
                            <select className="fin-input" value={form.type} onChange={e => set('type', e.target.value)}>
                                <option value="in">Kas Masuk</option>
                                <option value="out">Kas Keluar</option>
                            </select>
                        </div>
                    </div>
                    <div className="fin-form-group">
                        <label className="fin-label">Deskripsi *</label>
                        <input className="fin-input" placeholder="Penjualan fotocopy 500 lembar" value={form.description} onChange={e => set('description', e.target.value)} />
                    </div>
                    <div className="fin-form-row">
                        <div className="fin-form-group">
                            <label className="fin-label">Jumlah (Rp) *</label>
                            <input className="fin-input" type="number" min="0" placeholder="150000" value={form.amount} onChange={e => set('amount', e.target.value)} />
                        </div>
                        <div className="fin-form-group">
                            <label className="fin-label">Kategori</label>
                            <select className="fin-input" value={form.category} onChange={e => set('category', e.target.value)}>
                                <option value="">-- Pilih --</option>
                                {(form.type === 'in' ? CATEGORIES_IN : CATEGORIES_OUT).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="fin-form-group">
                        <label className="fin-label">Referensi / No. Bukti</label>
                        <input className="fin-input" placeholder="INV-001 (opsional)" value={form.reference} onChange={e => set('reference', e.target.value)} />
                    </div>
                </div>
            </Modal>

            {/* Delete */}
            <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Hapus Entri" footer={
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button className="fin-btn-ghost" onClick={() => setConfirmDelete(null)}>Batal</button>
                    <button className="fin-btn-del" onClick={() => handleDelete(confirmDelete.id)}><FiTrash2 /> Hapus</button>
                </div>
            }>
                <p>Yakin ingin menghapus entri <strong>{confirmDelete?.description}</strong>?</p>
            </Modal>
        </div>
    );
}

const CSS = `
.fin-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.fin-title { font-size:1.4rem; font-weight:800; margin:0; display:flex; align-items:center; gap:8px; color:var(--text-primary); }
.fin-sub { color:var(--text-secondary); margin:4px 0 0; font-size:.875rem; }
.fin-btn-success { display:flex; align-items:center; gap:6px; background:#10b981; color:#fff; font-weight:700; font-size:.82rem; padding:9px 16px; border-radius:10px; border:none; cursor:pointer; transition:all .15s; }
.fin-btn-success:hover { background:#059669; }
.fin-btn-danger { display:flex; align-items:center; gap:6px; background:#ef4444; color:#fff; font-weight:700; font-size:.82rem; padding:9px 16px; border-radius:10px; border:none; cursor:pointer; transition:all .15s; }
.fin-btn-danger:hover { background:#dc2626; }
.fin-btn-primary { display:flex; align-items:center; gap:6px; background:#3b82f6; color:#fff; font-weight:700; font-size:.875rem; padding:10px 20px; border-radius:10px; border:none; cursor:pointer; flex:1; justify-content:center; }
.fin-btn-ghost { display:flex; align-items:center; gap:6px; background:var(--bg-input); color:var(--text-secondary); font-weight:700; font-size:.875rem; padding:9px 16px; border-radius:9px; border:1px solid var(--border); cursor:pointer; flex:1; justify-content:center; }
.fin-btn-del { display:flex; align-items:center; gap:6px; background:#ef4444; color:#fff; font-weight:700; font-size:.875rem; padding:9px 16px; border-radius:9px; border:none; cursor:pointer; flex:1; justify-content:center; }

.fin-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
@media(max-width:900px){ .fin-stats { grid-template-columns:repeat(2,1fr); } }
@media(max-width:500px){ .fin-stats { grid-template-columns:1fr; } }
.fin-stat-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:14px; padding:18px; display:flex; align-items:center; gap:14px; }
.fin-stat-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:1.2rem; }
.fin-stat-label { font-size:.72rem; color:var(--text-muted); font-weight:600; margin:0 0 3px; text-transform:uppercase; letter-spacing:.04em; }
.fin-stat-value { font-size:1.2rem; font-weight:900; margin:0; }

.fin-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
.fin-filter-bar { display:flex; align-items:center; gap:14px; padding:16px 20px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
.fin-tabs { display:flex; gap:6px; }
.fin-tab { padding:7px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.78rem; font-weight:700; color:var(--text-secondary); cursor:pointer; transition:all .15s; display:flex; align-items:center; gap:5px; white-space:nowrap; }
.fin-tab:hover { border-color:#3b82f6; color:#3b82f6; }
.fin-tab.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }
.fin-search-wrap { position:relative; flex:1; min-width:160px; }
.fin-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:16px; }
.fin-search { width:100%; padding:8px 12px 8px 36px; border:1px solid var(--border); border-radius:8px; font-size:.875rem; outline:none; background:var(--bg-input); color:var(--text-primary); }
.fin-search:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
.fin-empty { padding:48px; text-align:center; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; gap:8px; }
.fin-table-wrap { overflow-x:auto; }
.fin-table { width:100%; border-collapse:collapse; text-align:left; }
.fin-table thead tr { background:var(--bg-input); }
.fin-table th { padding:11px 18px; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); white-space:nowrap; }
.fin-tr { border-top:1px solid var(--border); transition:background .1s; }
.fin-tr:hover { background:var(--bg-card-hover); }
.fin-table td { padding:12px 18px; vertical-align:middle; }
.fin-badge { padding:3px 9px; font-size:.68rem; font-weight:700; border-radius:9999px; white-space:nowrap; }
.fin-badge.in { background:#d1fae5; color:#059669; }
.fin-badge.out { background:#fee2e2; color:#dc2626; }
.fin-action-btn { background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; align-items:center; padding:6px; border-radius:7px; transition:all .15s; }
.fin-action-btn:hover { color:#3b82f6; background:rgba(59,130,246,.1); }
.fin-action-btn.del:hover { color:#ef4444; background:rgba(239,68,68,.1); }

.fin-form-row { display:flex; gap:12px; }
@media(max-width:500px){ .fin-form-row { flex-direction:column; } }
.fin-form-group { display:flex; flex-direction:column; flex:1; }
.fin-label { display:block; font-size:.77rem; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.fin-input { width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:.875rem; outline:none; background:var(--bg-input); color:var(--text-primary); box-sizing:border-box; }
.fin-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
select.fin-input { appearance:auto; }

.fin-pagination { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-top:1px solid var(--border); flex-wrap:wrap; gap:10px; }
.fin-page-info { font-size:.78rem; color:var(--text-muted); font-weight:600; }
.fin-page-btns { display:flex; align-items:center; gap:4px; }
.fin-page-btn { display:flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.78rem; font-weight:600; color:var(--text-secondary); cursor:pointer; transition:all .15s; }
.fin-page-btn:hover:not(:disabled) { border-color:#3b82f6; color:#3b82f6; }
.fin-page-btn:disabled { opacity:.4; cursor:not-allowed; }
.fin-page-num { width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.78rem; font-weight:700; color:var(--text-secondary); cursor:pointer; }
.fin-page-num:hover { border-color:#3b82f6; color:#3b82f6; }
.fin-page-num.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }
`;
