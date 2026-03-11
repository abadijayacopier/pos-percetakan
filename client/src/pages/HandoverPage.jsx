import { useState, useMemo } from 'react';
import db from '../db';
import { formatRupiah, formatDateTime } from '../utils';
import Modal from '../components/Modal';
import { FiPackage, FiSearch, FiCheckCircle, FiAlertTriangle, FiUser, FiPhone, FiFileText, FiClock, FiChevronLeft, FiChevronRight, FiPrinter } from 'react-icons/fi';

export default function HandoverPage() {
    const [transactions] = useState(() => db.getAll('transactions'));
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [handovers, setHandovers] = useState(() => db.getAll('handovers'));
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    const getHandoverStatus = (trxId) => handovers.find(h => h.transactionId === trxId);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return transactions.filter(t => {
            const matchSearch = !q || (t.invoiceNo || '').toLowerCase().includes(q) || (t.customerName || '').toLowerCase().includes(q);
            const ho = getHandoverStatus(t.id);
            if (filterStatus === 'pending') return matchSearch && !ho;
            if (filterStatus === 'done') return matchSearch && ho;
            return matchSearch;
        });
    }, [transactions, search, filterStatus, handovers]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const pendingCount = transactions.filter(t => !getHandoverStatus(t.id)).length;
    const doneCount = handovers.length;

    const openHandover = (trx) => {
        setSelectedTrx(trx);
        setReceiverName(trx.customerName || '');
        setReceiverPhone('');
        setNotes('');
    };

    const handleHandover = () => {
        if (!receiverName.trim() || !selectedTrx) return;
        db.insert('handovers', {
            transactionId: selectedTrx.id,
            invoiceNo: selectedTrx.invoiceNo,
            customerName: selectedTrx.customerName,
            receiverName,
            receiverPhone,
            notes,
            handoverDate: new Date().toISOString(),
            handoverBy: 'Admin',
        });
        db.logActivity('Admin', 'Serah Terima', `Pesanan ${selectedTrx.invoiceNo} diserahkan ke ${receiverName}`);
        setHandovers(db.getAll('handovers'));
        setSelectedTrx(null);
    };

    const handleSearch = (v) => { setSearch(v); setPage(1); };
    const handleFilter = (v) => { setFilterStatus(v); setPage(1); };

    return (
        <div style={{ padding: '24px 28px', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <style>{CSS}</style>

            {/* Header */}
            <div className="ho-header">
                <div>
                    <h1 className="ho-title"><FiPackage /> Serah Terima Barang</h1>
                    <p className="ho-sub">Proses verifikasi dan penyerahan pesanan kepada pelanggan</p>
                </div>
                <div className="ho-date">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>

            {/* Stats */}
            <div className="ho-stats">
                <div className="ho-stat-card">
                    <div className="ho-stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}><FiPackage /></div>
                    <div><p className="ho-stat-label">Total Pesanan</p><p className="ho-stat-value" style={{ color: '#3b82f6' }}>{transactions.length}</p></div>
                </div>
                <div className="ho-stat-card">
                    <div className="ho-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}><FiClock /></div>
                    <div><p className="ho-stat-label">Menunggu</p><p className="ho-stat-value" style={{ color: '#f59e0b' }}>{pendingCount}</p></div>
                </div>
                <div className="ho-stat-card">
                    <div className="ho-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}><FiCheckCircle /></div>
                    <div><p className="ho-stat-label">Sudah Diserahkan</p><p className="ho-stat-value" style={{ color: '#10b981' }}>{doneCount}</p></div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="ho-card">
                <div className="ho-filter-bar">
                    <div className="ho-search-wrap">
                        <FiSearch className="ho-search-icon" />
                        <input className="ho-search" placeholder="Cari invoice / nama pelanggan..." value={search} onChange={e => handleSearch(e.target.value)} />
                    </div>
                    <div className="ho-filter-tabs">
                        {[
                            { key: 'all', label: 'Semua' },
                            { key: 'pending', label: `Menunggu (${pendingCount})` },
                            { key: 'done', label: `Selesai (${doneCount})` },
                        ].map(f => (
                            <button key={f.key} className={`ho-tab ${filterStatus === f.key ? 'active' : ''}`} onClick={() => handleFilter(f.key)}>{f.label}</button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                {paginated.length === 0 ? (
                    <div className="ho-empty"><FiPackage size={48} /><p>Tidak ada pesanan ditemukan.</p></div>
                ) : (
                    <div className="ho-table-wrap">
                        <table className="ho-table">
                            <thead><tr>
                                <th>Invoice</th><th>Tanggal</th><th>Pelanggan</th><th>Total</th><th>Status</th><th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr></thead>
                            <tbody>
                                {paginated.map(t => {
                                    const ho = getHandoverStatus(t.id);
                                    return (
                                        <tr key={t.id} className="ho-tr">
                                            <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '.82rem' }}>{t.invoiceNo}</td>
                                            <td style={{ fontSize: '.82rem' }}>{formatDateTime(t.date)}</td>
                                            <td style={{ fontWeight: 600 }}>{t.customerName || 'Umum'}</td>
                                            <td style={{ fontWeight: 700, color: '#10b981' }}>{formatRupiah(t.total)}</td>
                                            <td>
                                                {ho ? (
                                                    <span className="ho-badge done"><FiCheckCircle size={12} /> Diserahkan</span>
                                                ) : (
                                                    <span className="ho-badge pending"><FiClock size={12} /> Menunggu</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {ho ? (
                                                    <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>oleh {ho.receiverName}</span>
                                                ) : (
                                                    <button className="ho-btn-sm" onClick={() => openHandover(t)}><FiCheckCircle size={14} /> Serah Terima</button>
                                                )}
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
                    <div className="ho-pagination">
                        <span className="ho-page-info">Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length}</span>
                        <div className="ho-page-btns">
                            <button className="ho-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><FiChevronLeft size={16} /> Prev</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                <button key={n} className={`ho-page-num ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                            ))}
                            <button className="ho-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next <FiChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Handover Modal */}
            <Modal isOpen={!!selectedTrx} onClose={() => setSelectedTrx(null)} title="Proses Serah Terima" footer={
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button className="ho-btn-ghost" onClick={() => setSelectedTrx(null)}>Batal</button>
                    <button className="ho-btn-primary" onClick={handleHandover} disabled={!receiverName.trim()}><FiCheckCircle /> Barang Diserahkan</button>
                </div>
            }>
                {selectedTrx && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div className="ho-info-box">
                            <div className="ho-info-row"><span>No. Invoice</span><strong>{selectedTrx.invoiceNo}</strong></div>
                            <div className="ho-info-row"><span>Pelanggan</span><strong>{selectedTrx.customerName || 'Umum'}</strong></div>
                            <div className="ho-info-row"><span>Total</span><strong style={{ color: '#10b981' }}>{formatRupiah(selectedTrx.total)}</strong></div>
                            <div className="ho-info-row"><span>Tipe</span><strong>{selectedTrx.type}</strong></div>
                        </div>
                        <div className="ho-form-group">
                            <label className="ho-label"><FiUser size={13} /> Nama Penerima *</label>
                            <input className="ho-input" value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Nama penerima barang" />
                        </div>
                        <div className="ho-form-group">
                            <label className="ho-label"><FiPhone size={13} /> Telepon Penerima</label>
                            <input className="ho-input" value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)} placeholder="081234567890" />
                        </div>
                        <div className="ho-form-group">
                            <label className="ho-label"><FiFileText size={13} /> Catatan</label>
                            <textarea className="ho-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan serah terima..." style={{ resize: 'none' }} />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

const CSS = `
.ho-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.ho-title { font-size:1.4rem; font-weight:800; margin:0; display:flex; align-items:center; gap:8px; color:var(--text-primary); }
.ho-sub { color:var(--text-secondary); margin:4px 0 0; font-size:.875rem; }
.ho-date { font-size:.82rem; color:var(--text-secondary); font-weight:600; padding:8px 14px; background:var(--bg-secondary); border:1px solid var(--border); border-radius:10px; }
.ho-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
@media(max-width:700px){ .ho-stats { grid-template-columns:1fr; } }
.ho-stat-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:14px; padding:18px; display:flex; align-items:center; gap:14px; }
.ho-stat-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:1.2rem; }
.ho-stat-label { font-size:.72rem; color:var(--text-muted); font-weight:600; margin:0 0 3px; text-transform:uppercase; letter-spacing:.04em; }
.ho-stat-value { font-size:1.4rem; font-weight:900; margin:0; }
.ho-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
.ho-filter-bar { display:flex; align-items:center; gap:14px; padding:16px 20px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
.ho-search-wrap { position:relative; flex:1; min-width:180px; }
.ho-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:16px; }
.ho-search { width:100%; padding:8px 12px 8px 36px; border:1px solid var(--border); border-radius:8px; font-size:.875rem; outline:none; background:var(--bg-input); color:var(--text-primary); }
.ho-search:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
.ho-filter-tabs { display:flex; gap:6px; flex-wrap:wrap; }
.ho-tab { padding:6px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.73rem; font-weight:600; color:var(--text-secondary); cursor:pointer; transition:all .15s; white-space:nowrap; }
.ho-tab:hover { border-color:#3b82f6; color:#3b82f6; }
.ho-tab.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }
.ho-empty { padding:48px; text-align:center; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; gap:8px; }
.ho-table-wrap { overflow-x:auto; }
.ho-table { width:100%; border-collapse:collapse; text-align:left; }
.ho-table thead tr { background:var(--bg-input); }
.ho-table th { padding:11px 18px; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); white-space:nowrap; }
.ho-tr { border-top:1px solid var(--border); transition:background .1s; }
.ho-tr:hover { background:var(--bg-card-hover); }
.ho-table td { padding:12px 18px; vertical-align:middle; }
.ho-badge { padding:4px 10px; font-size:.7rem; font-weight:700; border-radius:9999px; display:inline-flex; align-items:center; gap:4px; }
.ho-badge.done { background:#d1fae5; color:#059669; }
.ho-badge.pending { background:#fef3c7; color:#d97706; }
.ho-btn-sm { display:inline-flex; align-items:center; gap:5px; padding:6px 14px; font-size:.78rem; font-weight:700; border-radius:8px; border:none; cursor:pointer; background:#3b82f6; color:#fff; transition:all .15s; }
.ho-btn-sm:hover { background:#2563eb; }
.ho-btn-primary { display:flex; align-items:center; gap:6px; background:#10b981; color:#fff; font-weight:700; font-size:.875rem; padding:10px 20px; border-radius:10px; border:none; cursor:pointer; flex:1; justify-content:center; }
.ho-btn-primary:disabled { opacity:.4; cursor:not-allowed; }
.ho-btn-ghost { display:flex; align-items:center; gap:6px; background:var(--bg-input); color:var(--text-secondary); font-weight:700; font-size:.875rem; padding:9px 16px; border-radius:9px; border:1px solid var(--border); cursor:pointer; flex:1; justify-content:center; }
.ho-info-box { background:var(--bg-input); border:1px solid var(--border); border-radius:10px; padding:14px; }
.ho-info-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border); font-size:.85rem; }
.ho-info-row:last-child { border:none; }
.ho-info-row span { color:var(--text-muted); }
.ho-form-group { display:flex; flex-direction:column; }
.ho-label { font-size:.77rem; font-weight:600; color:var(--text-secondary); margin-bottom:5px; display:flex; align-items:center; gap:5px; }
.ho-input { width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:.875rem; outline:none; background:var(--bg-input); color:var(--text-primary); box-sizing:border-box; }
.ho-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
.ho-pagination { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-top:1px solid var(--border); flex-wrap:wrap; gap:10px; }
.ho-page-info { font-size:.78rem; color:var(--text-muted); font-weight:600; }
.ho-page-btns { display:flex; align-items:center; gap:4px; }
.ho-page-btn { display:flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.78rem; font-weight:600; color:var(--text-secondary); cursor:pointer; transition:all .15s; }
.ho-page-btn:hover:not(:disabled) { border-color:#3b82f6; color:#3b82f6; }
.ho-page-btn:disabled { opacity:.4; cursor:not-allowed; }
.ho-page-num { width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.78rem; font-weight:700; color:var(--text-secondary); cursor:pointer; }
.ho-page-num:hover { border-color:#3b82f6; color:#3b82f6; }
.ho-page-num.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }
`;
