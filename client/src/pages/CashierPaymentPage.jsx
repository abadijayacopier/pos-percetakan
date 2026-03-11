import { useState, useMemo } from 'react';
import db from '../db';
import { formatRupiah, formatDateTime } from '../utils';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { FiCreditCard, FiSearch, FiCheckCircle, FiClock, FiDollarSign, FiChevronLeft, FiChevronRight, FiPrinter, FiAlertTriangle } from 'react-icons/fi';

export default function CashierPaymentPage({ onNavigate }) {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState(() => db.getAll('transactions'));
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [payMethod, setPayMethod] = useState('tunai');
    const [amountPaid, setAmountPaid] = useState('');
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    const reload = () => setTransactions(db.getAll('transactions'));

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return transactions.filter(t => {
            const matchSearch = !q || (t.invoiceNo || '').toLowerCase().includes(q) || (t.customerName || '').toLowerCase().includes(q);
            if (filterStatus === 'lunas') return matchSearch && t.paidAmount >= t.total;
            if (filterStatus === 'belum') return matchSearch && (!t.paidAmount || t.paidAmount < t.total);
            return matchSearch;
        });
    }, [transactions, search, filterStatus]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const totalPaid = transactions.filter(t => t.paidAmount >= t.total).length;
    const totalUnpaid = transactions.filter(t => !t.paidAmount || t.paidAmount < t.total).length;
    const totalRevenue = transactions.reduce((s, t) => s + (t.paidAmount || 0), 0);

    const handlePrintReceipt = (trx) => {
        if (!onNavigate) return;
        const paid = trx.paidAmount || 0;
        const receiptData = {
            invoiceNo: trx.invoiceNo,
            date: formatDateTime(trx.settledAt || trx.date || new Date().toISOString()),
            cashier: user?.name || 'Kasir',
            customer: trx.customerName || 'Umum',
            items: trx.items || [],
            subtotal: trx.subtotal || trx.total,
            tax: trx.tax || 0,
            total: trx.total,
            paymentMethod: trx.paymentType || 'Tunai',
            paid: paid,
            change: paid > trx.total ? paid - trx.total : 0
        };
        onNavigate('print-receipt', { receipt: receiptData });
    };

    const openSettle = (trx) => {
        setSelectedTrx(trx);
        setAmountPaid(trx.total - (trx.paidAmount || 0));
        setPayMethod('tunai');
    };

    const handleSettle = () => {
        if (!selectedTrx) return;
        const paid = Number(amountPaid) || 0;
        const newPaid = (selectedTrx.paidAmount || 0) + paid;
        db.update('transactions', selectedTrx.id, { paidAmount: newPaid, paymentType: payMethod, settledAt: new Date().toISOString() });
        db.insert('cash_flow', { type: 'in', amount: paid, description: `Pelunasan ${selectedTrx.invoiceNo}`, category: 'Penjualan', reference: selectedTrx.invoiceNo, date: new Date().toISOString() });
        db.logActivity('Kasir', 'Pelunasan', `${selectedTrx.invoiceNo} - ${formatRupiah(paid)} via ${payMethod}`);
        setSelectedTrx(null);
        reload();
    };

    const handleSearch = (v) => { setSearch(v); setPage(1); };
    const handleFilter = (v) => { setFilterStatus(v); setPage(1); };

    return (
        <div style={{ padding: '24px 28px', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <style>{CSS}</style>

            <div className="cp-header">
                <div>
                    <h1 className="cp-title"><FiCreditCard /> Pelunasan Kasir</h1>
                    <p className="cp-sub">Proses pembayaran dan pelunasan transaksi</p>
                </div>
            </div>

            {/* Stats */}
            <div className="cp-stats">
                <div className="cp-stat-card">
                    <div className="cp-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}><FiCheckCircle /></div>
                    <div><p className="cp-stat-label">Lunas</p><p className="cp-stat-value" style={{ color: '#10b981' }}>{totalPaid}</p></div>
                </div>
                <div className="cp-stat-card">
                    <div className="cp-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}><FiClock /></div>
                    <div><p className="cp-stat-label">Belum Lunas</p><p className="cp-stat-value" style={{ color: '#f59e0b' }}>{totalUnpaid}</p></div>
                </div>
                <div className="cp-stat-card">
                    <div className="cp-stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}><FiDollarSign /></div>
                    <div><p className="cp-stat-label">Total Diterima</p><p className="cp-stat-value" style={{ color: '#3b82f6' }}>{formatRupiah(totalRevenue)}</p></div>
                </div>
            </div>

            {/* Table Card */}
            <div className="cp-card">
                <div className="cp-filter-bar">
                    <div className="cp-search-wrap">
                        <FiSearch className="cp-search-icon" />
                        <input className="cp-search" placeholder="Cari invoice / pelanggan..." value={search} onChange={e => handleSearch(e.target.value)} />
                    </div>
                    <div className="cp-filter-tabs">
                        {[
                            { key: 'all', label: 'Semua' },
                            { key: 'belum', label: `Belum Lunas (${totalUnpaid})` },
                            { key: 'lunas', label: `Lunas (${totalPaid})` },
                        ].map(f => (
                            <button key={f.key} className={`cp-tab ${filterStatus === f.key ? 'active' : ''}`} onClick={() => handleFilter(f.key)}>{f.label}</button>
                        ))}
                    </div>
                </div>

                {paginated.length === 0 ? (
                    <div className="cp-empty"><FiCreditCard size={48} /><p>Tidak ada transaksi.</p></div>
                ) : (
                    <div className="cp-table-wrap">
                        <table className="cp-table">
                            <thead><tr>
                                <th>Invoice</th><th>Tanggal</th><th>Pelanggan</th><th>Total</th><th>Dibayar</th><th>Sisa</th><th>Status</th><th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr></thead>
                            <tbody>
                                {paginated.map(t => {
                                    const paid = t.paidAmount || 0;
                                    const remaining = t.total - paid;
                                    const isLunas = paid >= t.total;
                                    return (
                                        <tr key={t.id} className="cp-tr">
                                            <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '.82rem' }}>{t.invoiceNo}</td>
                                            <td style={{ fontSize: '.82rem' }}>{formatDateTime(t.date)}</td>
                                            <td style={{ fontWeight: 600 }}>{t.customerName || 'Umum'}</td>
                                            <td style={{ fontWeight: 700 }}>{formatRupiah(t.total)}</td>
                                            <td style={{ color: '#10b981', fontWeight: 600 }}>{formatRupiah(paid)}</td>
                                            <td style={{ color: remaining > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 700 }}>{remaining > 0 ? formatRupiah(remaining) : '-'}</td>
                                            <td>
                                                {isLunas ? (
                                                    <span className="cp-badge lunas"><FiCheckCircle size={12} /> Lunas</span>
                                                ) : (
                                                    <span className="cp-badge belum"><FiAlertTriangle size={12} /> Belum</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {!isLunas ? (
                                                    <button className="cp-btn-sm" onClick={() => openSettle(t)}><FiDollarSign size={14} /> Lunasi</button>
                                                ) : (
                                                    <button className="cp-btn-ghost" style={{ padding: '6px 14px', fontSize: '.78rem', flex: 'none', display: 'inline-flex', width: 'auto' }} onClick={() => handlePrintReceipt(t)}><FiPrinter size={14} /> Cetak Struk</button>
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
                    <div className="cp-pagination">
                        <span className="cp-page-info">Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length}</span>
                        <div className="cp-page-btns">
                            <button className="cp-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><FiChevronLeft size={16} /> Prev</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                <button key={n} className={`cp-page-num ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                            ))}
                            <button className="cp-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next <FiChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Settle Modal */}
            <Modal isOpen={!!selectedTrx} onClose={() => setSelectedTrx(null)} title="Proses Pelunasan" footer={
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button className="cp-btn-ghost" onClick={() => setSelectedTrx(null)}>Batal</button>
                    <button className="cp-btn-primary" onClick={handleSettle}><FiCheckCircle /> Proses Pelunasan</button>
                </div>
            }>
                {selectedTrx && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div className="cp-info-box">
                            <div className="cp-info-row"><span>Invoice</span><strong>{selectedTrx.invoiceNo}</strong></div>
                            <div className="cp-info-row"><span>Pelanggan</span><strong>{selectedTrx.customerName || 'Umum'}</strong></div>
                            <div className="cp-info-row"><span>Total</span><strong>{formatRupiah(selectedTrx.total)}</strong></div>
                            <div className="cp-info-row"><span>Sudah Dibayar</span><strong style={{ color: '#10b981' }}>{formatRupiah(selectedTrx.paidAmount || 0)}</strong></div>
                            <div className="cp-info-row"><span>Sisa Tagihan</span><strong style={{ color: '#ef4444', fontSize: '1.1rem' }}>{formatRupiah(selectedTrx.total - (selectedTrx.paidAmount || 0))}</strong></div>
                        </div>
                        <div className="cp-form-group">
                            <label className="cp-label">Jumlah Bayar (Rp)</label>
                            <input className="cp-input" type="number" min="0" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
                        </div>
                        <div className="cp-form-group">
                            <label className="cp-label">Metode Pembayaran</label>
                            <div className="cp-pay-methods">
                                {[
                                    { key: 'tunai', label: 'Tunai', icon: <FiDollarSign /> },
                                    { key: 'qris', label: 'QRIS', icon: <FiCreditCard /> },
                                    { key: 'transfer', label: 'Transfer', icon: <FiCreditCard /> },
                                ].map(m => (
                                    <button key={m.key} className={`cp-pay-btn ${payMethod === m.key ? 'active' : ''}`} onClick={() => setPayMethod(m.key)}>{m.icon} {m.label}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

const CSS = `
.cp-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.cp-title { font-size:1.4rem; font-weight:800; margin:0; display:flex; align-items:center; gap:8px; color:var(--text-primary); }
.cp-sub { color:var(--text-secondary); margin:4px 0 0; font-size:.875rem; }
.cp-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
@media(max-width:700px){ .cp-stats { grid-template-columns:1fr; } }
.cp-stat-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:14px; padding:18px; display:flex; align-items:center; gap:14px; }
.cp-stat-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:1.2rem; }
.cp-stat-label { font-size:.72rem; color:var(--text-muted); font-weight:600; margin:0 0 3px; text-transform:uppercase; letter-spacing:.04em; }
.cp-stat-value { font-size:1.4rem; font-weight:900; margin:0; }
.cp-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
.cp-filter-bar { display:flex; align-items:center; gap:14px; padding:16px 20px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
.cp-search-wrap { position:relative; flex:1; min-width:180px; }
.cp-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:16px; }
.cp-search { width:100%; padding:8px 12px 8px 36px; border:1px solid var(--border); border-radius:8px; font-size:.875rem; outline:none; background:var(--bg-input); color:var(--text-primary); }
.cp-search:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
.cp-filter-tabs { display:flex; gap:6px; flex-wrap:wrap; }
.cp-tab { padding:6px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.73rem; font-weight:600; color:var(--text-secondary); cursor:pointer; transition:all .15s; white-space:nowrap; }
.cp-tab:hover { border-color:#3b82f6; color:#3b82f6; }
.cp-tab.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }
.cp-empty { padding:48px; text-align:center; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; gap:8px; }
.cp-table-wrap { overflow-x:auto; }
.cp-table { width:100%; border-collapse:collapse; text-align:left; }
.cp-table thead tr { background:var(--bg-input); }
.cp-table th { padding:11px 18px; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); white-space:nowrap; }
.cp-tr { border-top:1px solid var(--border); transition:background .1s; }
.cp-tr:hover { background:var(--bg-card-hover); }
.cp-table td { padding:12px 18px; vertical-align:middle; }
.cp-badge { padding:4px 10px; font-size:.7rem; font-weight:700; border-radius:9999px; display:inline-flex; align-items:center; gap:4px; }
.cp-badge.lunas { background:#d1fae5; color:#059669; }
.cp-badge.belum { background:#fef3c7; color:#d97706; }
.cp-btn-sm { display:inline-flex; align-items:center; gap:5px; padding:6px 14px; font-size:.78rem; font-weight:700; border-radius:8px; border:none; cursor:pointer; background:#10b981; color:#fff; transition:all .15s; }
.cp-btn-sm:hover { background:#059669; }
.cp-btn-primary { display:flex; align-items:center; gap:6px; background:#10b981; color:#fff; font-weight:700; font-size:.875rem; padding:10px 20px; border-radius:10px; border:none; cursor:pointer; flex:1; justify-content:center; }
.cp-btn-ghost { display:flex; align-items:center; gap:6px; background:var(--bg-input); color:var(--text-secondary); font-weight:700; font-size:.875rem; padding:9px 16px; border-radius:9px; border:1px solid var(--border); cursor:pointer; flex:1; justify-content:center; }
.cp-info-box { background:var(--bg-input); border:1px solid var(--border); border-radius:10px; padding:14px; }
.cp-info-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border); font-size:.85rem; }
.cp-info-row:last-child { border:none; }
.cp-info-row span { color:var(--text-muted); }
.cp-form-group { display:flex; flex-direction:column; }
.cp-label { font-size:.77rem; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.cp-input { width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:.875rem; outline:none; background:var(--bg-input); color:var(--text-primary); box-sizing:border-box; }
.cp-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
.cp-pay-methods { display:flex; gap:8px; }
.cp-pay-btn { flex:1; display:flex; align-items:center; justify-content:center; gap:6px; padding:10px; border-radius:10px; border:2px solid var(--border); background:var(--bg-input); font-size:.82rem; font-weight:700; color:var(--text-secondary); cursor:pointer; transition:all .15s; }
.cp-pay-btn:hover { border-color:#3b82f6; }
.cp-pay-btn.active { border-color:#3b82f6; background:rgba(59,130,246,.08); color:#3b82f6; }
.cp-pagination { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-top:1px solid var(--border); flex-wrap:wrap; gap:10px; }
.cp-page-info { font-size:.78rem; color:var(--text-muted); font-weight:600; }
.cp-page-btns { display:flex; align-items:center; gap:4px; }
.cp-page-btn { display:flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.78rem; font-weight:600; color:var(--text-secondary); cursor:pointer; transition:all .15s; }
.cp-page-btn:hover:not(:disabled) { border-color:#3b82f6; color:#3b82f6; }
.cp-page-btn:disabled { opacity:.4; cursor:not-allowed; }
.cp-page-num { width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); font-size:.78rem; font-weight:700; color:var(--text-secondary); cursor:pointer; }
.cp-page-num:hover { border-color:#3b82f6; color:#3b82f6; }
.cp-page-num.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }
`;
