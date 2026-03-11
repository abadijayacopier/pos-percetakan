import { useState, useMemo, useEffect } from 'react';
import db from '../db';
import { formatRupiah, formatDateTime } from '../utils';
import { FiWifi, FiCheckCircle, FiClock, FiAlertTriangle, FiDollarSign, FiRefreshCw, FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';

export default function QRISMonitorPage() {
    const [transactions, setTransactions] = useState(() => db.getAll('transactions'));
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const PER_PAGE = 10;

    // Simulate live refresh every 15s
    useEffect(() => {
        const interval = setInterval(() => {
            setTransactions(db.getAll('transactions'));
            setLastRefresh(new Date());
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const qrisTransactions = useMemo(() => {
        return transactions.filter(t => (t.paymentType || '').toLowerCase().includes('qris'));
    }, [transactions]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return qrisTransactions.filter(t => {
            const matchSearch = !q || (t.invoiceNo || '').toLowerCase().includes(q) || (t.customerName || '').toLowerCase().includes(q);
            if (filterStatus === 'success') return matchSearch && t.paidAmount >= t.total;
            if (filterStatus === 'pending') return matchSearch && (!t.paidAmount || t.paidAmount < t.total);
            return matchSearch;
        }).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    }, [qrisTransactions, search, filterStatus]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const totalAmount = qrisTransactions.reduce((s, t) => s + (t.total || 0), 0);
    const successCount = qrisTransactions.filter(t => t.paidAmount >= t.total).length;
    const pendingCount = qrisTransactions.filter(t => !t.paidAmount || t.paidAmount < t.total).length;

    const handleRefresh = () => {
        setTransactions(db.getAll('transactions'));
        setLastRefresh(new Date());
    };

    const handleSearch = (v) => { setSearch(v); setPage(1); };
    const handleFilter = (v) => { setFilterStatus(v); setPage(1); };

    return (
        <div style={{ padding: '24px 28px', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <style>{CSS}</style>

            <div className="qr-header">
                <div>
                    <h1 className="qr-title"><FiWifi /> Monitoring QRIS</h1>
                    <p className="qr-sub">Pantau status pembayaran QRIS secara real-time</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="qr-live-badge">
                        <span className="qr-pulse"></span>
                        <span>Live • {lastRefresh.toLocaleTimeString('id-ID')}</span>
                    </div>
                    <button className="qr-refresh-btn" onClick={handleRefresh}><FiRefreshCw size={16} /> Refresh</button>
                </div>
            </div>

            {/* Stats */}
            <div className="qr-stats">
                <div className="qr-stat-card">
                    <div className="qr-stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}><FiDollarSign /></div>
                    <div><p className="qr-stat-label">Total QRIS Masuk</p><p className="qr-stat-value" style={{ color: '#3b82f6' }}>{formatRupiah(totalAmount)}</p></div>
                </div>
                <div className="qr-stat-card">
                    <div className="qr-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}><FiCheckCircle /></div>
                    <div><p className="qr-stat-label">Sukses</p><p className="qr-stat-value" style={{ color: '#10b981' }}>{successCount}</p></div>
                </div>
                <div className="qr-stat-card">
                    <div className="qr-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}><FiClock /></div>
                    <div><p className="qr-stat-label">Pending</p><p className="qr-stat-value" style={{ color: '#f59e0b' }}>{pendingCount}</p></div>
                </div>
            </div>

            {/* Table */}
            <div className="qr-card">
                <div className="qr-filter-bar">
                    <div className="qr-search-wrap">
                        <FiSearch className="qr-search-icon" />
                        <input className="qr-search" placeholder="Cari invoice / pelanggan..." value={search} onChange={e => handleSearch(e.target.value)} />
                    </div>
                    <div className="qr-filter-tabs">
                        {[
                            { key: 'all', label: 'Semua' },
                            { key: 'success', label: `Sukses (${successCount})` },
                            { key: 'pending', label: `Pending (${pendingCount})` },
                        ].map(f => (
                            <button key={f.key} className={`qr-tab ${filterStatus === f.key ? 'active' : ''}`} onClick={() => handleFilter(f.key)}>{f.label}</button>
                        ))}
                    </div>
                </div>

                {paginated.length === 0 ? (
                    <div className="qr-empty"><FiWifi size={48} /><p>{qrisTransactions.length === 0 ? 'Belum ada transaksi QRIS.' : 'Tidak ditemukan.'}</p></div>
                ) : (
                    <div className="qr-table-wrap">
                        <table className="qr-table">
                            <thead><tr>
                                <th>Waktu</th><th>Invoice</th><th>Pelanggan</th><th>Kasir</th><th>Nominal</th><th>Status</th>
                            </tr></thead>
                            <tbody>
                                {paginated.map(t => {
                                    const isSuccess = t.paidAmount >= t.total;
                                    return (
                                        <tr key={t.id} className="qr-tr">
                                            <td>
                                                <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{new Date(t.date || t.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                                                <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{new Date(t.date || t.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</div>
                                            </td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '.8rem', fontWeight: 600 }}>{t.invoiceNo}</td>
                                            <td style={{ fontWeight: 600 }}>{t.customerName || 'Umum'}</td>
                                            <td style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>{t.userName || '-'}</td>
                                            <td style={{ fontWeight: 800, color: '#3b82f6' }}>{formatRupiah(t.total)}</td>
                                            <td>
                                                {isSuccess ? (
                                                    <span className="qr-status-badge success"><FiCheckCircle size={12} /> Berhasil</span>
                                                ) : (
                                                    <span className="qr-status-badge pending"><FiClock size={12} /> Pending</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {filtered.length > PER_PAGE && (
                    <div className="qr-pagination">
                        <span className="qr-page-info">Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length}</span>
                        <div className="qr-page-btns">
                            <button className="qr-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><FiChevronLeft size={16} /> Prev</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                <button key={n} className={`qr-page-num ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                            ))}
                            <button className="qr-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next <FiChevronRight size={16} /></button>
                        </div>
                    </div>
                )}

                <div className="qr-footer">
                    <p>Menampilkan {qrisTransactions.length} transaksi QRIS • Auto-refresh setiap 15 detik</p>
                </div>
            </div>
        </div>
    );
}

const CSS = `
.qr-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.qr-title { font-size:1.4rem; font-weight:800; margin:0; display:flex; align-items:center; gap:8px; color:var(--text-primary); }
.qr-sub { color:var(--text-secondary); margin:4px 0 0; font-size:.875rem; }
.qr-live-badge { display:flex; align-items:center; gap:8px; padding:6px 14px; border-radius:9999px; background:#d1fae5; color:#059669; font-size:.72rem; font-weight:700; }
.qr-pulse { width:8px; height:8px; border-radius:50%; background:#10b981; box-shadow:0 0 0 0 rgba(16,185,129,.6); animation:qr-ping 1.5s infinite; }
@keyframes qr-ping { 0% { box-shadow:0 0 0 0 rgba(16,185,129,.6); } 70% { box-shadow:0 0 0 8px rgba(16,185,129,0); } 100% { box-shadow:0 0 0 0 rgba(16,185,129,0); } }
.qr-refresh-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:10px; border:1px solid var(--border); background:var(--bg-secondary); font-size:.82rem; font-weight:700; color:var(--text-primary); cursor:pointer; transition:all .15s; }
.qr-refresh-btn:hover { border-color:#3b82f6; color:#3b82f6; }

.qr-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
@media(max-width:700px){ .qr-stats { grid-template-columns:1fr; } }
.qr-stat-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:14px; padding:18px; display:flex; align-items:center; gap:14px; }
.qr-stat-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:1.2rem; }
.qr-stat-label { font-size:.72rem; color:var(--text-muted); font-weight:600; margin:0 0 3px; text-transform:uppercase; letter-spacing:.04em; }
.qr-stat-value { font-size:1.4rem; font-weight:900; margin:0; }

.qr-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
.qr-filter-bar { display:flex; align-items:center; gap:14px; padding:16px 20px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
.qr-search-wrap { position:relative; flex:1; min-width:180px; }
.qr-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:16px; }
.qr-search { width:100%; padding:8px 12px 8px 36px; border:1px solid var(--border); border-radius:8px; font-size:.875rem; outline:none; background:var(--bg-input); color:var(--text-primary); }
.qr-search:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
.qr-filter-tabs { display:flex; gap:6px; flex-wrap:wrap; }
.qr-tab { padding:6px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.73rem; font-weight:600; color:var(--text-secondary); cursor:pointer; transition:all .15s; white-space:nowrap; }
.qr-tab:hover { border-color:#3b82f6; color:#3b82f6; }
.qr-tab.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }
.qr-empty { padding:48px; text-align:center; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; gap:8px; }
.qr-table-wrap { overflow-x:auto; }
.qr-table { width:100%; border-collapse:collapse; text-align:left; }
.qr-table thead tr { background:var(--bg-input); }
.qr-table th { padding:11px 18px; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); white-space:nowrap; }
.qr-tr { border-top:1px solid var(--border); transition:background .1s; }
.qr-tr:hover { background:var(--bg-card-hover); }
.qr-table td { padding:12px 18px; vertical-align:middle; }
.qr-status-badge { padding:4px 10px; font-size:.7rem; font-weight:700; border-radius:9999px; display:inline-flex; align-items:center; gap:4px; }
.qr-status-badge.success { background:#d1fae5; color:#059669; }
.qr-status-badge.pending { background:#fef3c7; color:#d97706; }
.qr-footer { padding:12px 20px; border-top:1px solid var(--border); text-align:center; }
.qr-footer p { font-size:.75rem; color:var(--text-muted); margin:0; }

.qr-pagination { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-top:1px solid var(--border); flex-wrap:wrap; gap:10px; }
.qr-page-info { font-size:.78rem; color:var(--text-muted); font-weight:600; }
.qr-page-btns { display:flex; align-items:center; gap:4px; }
.qr-page-btn { display:flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.78rem; font-weight:600; color:var(--text-secondary); cursor:pointer; transition:all .15s; }
.qr-page-btn:hover:not(:disabled) { border-color:#3b82f6; color:#3b82f6; }
.qr-page-btn:disabled { opacity:.4; cursor:not-allowed; }
.qr-page-num { width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.78rem; font-weight:700; color:var(--text-secondary); cursor:pointer; }
.qr-page-num:hover { border-color:#3b82f6; color:#3b82f6; }
.qr-page-num.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }
`;
