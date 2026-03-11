import { useState, useMemo } from 'react';
import db from '../db';
import { formatRupiah, formatDate, formatDateTime } from '../utils';
import { FiFileText, FiDollarSign, FiShoppingCart, FiUsers, FiPrinter, FiDownload, FiCalendar, FiTrendingUp, FiBox, FiAlertTriangle } from 'react-icons/fi';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('sales');
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date(); d.setMonth(d.getMonth() - 1);
        return d.toISOString().slice(0, 10);
    });
    const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

    const allTransactions = useMemo(() => db.getAll('transactions'), []);
    const allProducts = useMemo(() => db.getAll('products'), []);
    const allCustomers = useMemo(() => db.getAll('customers'), []);
    const allCashFlow = useMemo(() => db.getAll('cash_flow'), []);

    // Filter transactions by date range
    const transactions = useMemo(() => {
        return allTransactions.filter(t => {
            const d = t.date ? t.date.slice(0, 10) : '';
            return d >= dateFrom && d <= dateTo;
        });
    }, [allTransactions, dateFrom, dateTo]);

    // Sales metrics
    const totalRevenue = transactions.reduce((s, t) => s + (t.total || 0), 0);
    const totalTrx = transactions.length;
    const avgTrx = totalTrx > 0 ? Math.round(totalRevenue / totalTrx) : 0;
    const cashIn = allCashFlow.filter(c => c.type === 'in').reduce((s, c) => s + (c.amount || 0), 0);
    const cashOut = allCashFlow.filter(c => c.type === 'out').reduce((s, c) => s + (c.amount || 0), 0);

    // Product metrics
    const lowStockProducts = allProducts.filter(p => p.stock <= (p.minStock || 0) && (p.minStock || 0) > 0);
    const totalStockValue = allProducts.reduce((s, p) => s + (p.sellPrice || 0) * (p.stock || 0), 0);

    // Best selling products from transactions
    const productSales = useMemo(() => {
        const map = {};
        transactions.forEach(t => {
            (t.items || []).forEach(item => {
                const key = item.productId || item.name;
                if (!map[key]) map[key] = { name: item.name, qty: 0, revenue: 0 };
                map[key].qty += item.qty;
                map[key].revenue += item.subtotal || (item.qty * item.price);
            });
        });
        return Object.values(map).sort((a, b) => b.revenue - a.revenue);
    }, [transactions]);

    // Customer metrics
    const topCustomers = [...allCustomers].sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0)).slice(0, 10);

    // Payment method breakdown
    const paymentBreakdown = useMemo(() => {
        const map = {};
        transactions.forEach(t => {
            const m = t.paymentType || 'tunai';
            map[m] = (map[m] || 0) + (t.total || 0);
        });
        return Object.entries(map).map(([method, amount]) => ({ method, amount }));
    }, [transactions]);

    // Print handler
    const handlePrint = () => window.print();

    // CSV Export
    const exportCSV = (data, filename, headers) => {
        const csv = [headers.join(','), ...data.map(row => headers.map(h => {
            const val = row[h] ?? '';
            return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(','))].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    const exportSalesCSV = () => {
        const data = transactions.map(t => ({
            'No Invoice': t.invoiceNo,
            'Tanggal': formatDateTime(t.date),
            'Pelanggan': t.customerName || 'Umum',
            'Tipe': t.type,
            'Total': t.total,
            'Pembayaran': t.paymentType,
            'Kasir': t.userName,
        }));
        exportCSV(data, 'laporan_penjualan', ['No Invoice', 'Tanggal', 'Pelanggan', 'Tipe', 'Total', 'Pembayaran', 'Kasir']);
    };

    const exportProductCSV = () => {
        const data = allProducts.map(p => ({
            'Kode': p.code,
            'Nama': p.name,
            'Harga Beli': p.buyPrice,
            'Harga Jual': p.sellPrice,
            'Stok': p.stock,
            'Satuan': p.unit,
        }));
        exportCSV(data, 'laporan_produk', ['Kode', 'Nama', 'Harga Beli', 'Harga Jual', 'Stok', 'Satuan']);
    };

    const exportCustomerCSV = () => {
        const data = allCustomers.map(c => ({
            'Nama': c.name,
            'Telepon': c.phone,
            'Alamat': c.address,
            'Tipe': c.type,
            'Total Transaksi': c.totalTrx || 0,
            'Total Belanja': c.totalSpend || 0,
        }));
        exportCSV(data, 'laporan_pelanggan', ['Nama', 'Telepon', 'Alamat', 'Tipe', 'Total Transaksi', 'Total Belanja']);
    };

    return (
        <div className="rpt-page" style={{ padding: '24px 28px', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <style>{CSS}</style>

            {/* Header */}
            <div className="rpt-header print-hide">
                <div>
                    <h1 className="rpt-title"><FiFileText /> Laporan Bisnis</h1>
                    <p className="rpt-sub">Data real-time dari database</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="rpt-btn-outline" onClick={handlePrint}><FiPrinter /> Print</button>
                    <button className="rpt-btn-primary" onClick={activeTab === 'sales' ? exportSalesCSV : activeTab === 'products' ? exportProductCSV : exportCustomerCSV}>
                        <FiDownload /> Export CSV
                    </button>
                </div>
            </div>

            {/* Print Header */}
            <div className="print-only-header">
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Laporan {activeTab === 'sales' ? 'Penjualan' : activeTab === 'products' ? 'Produk' : 'Pelanggan'}</h1>
                <p style={{ margin: '4px 0 0', fontSize: '.85rem', color: '#64748b' }}>
                    Periode: {formatDate(dateFrom)} - {formatDate(dateTo)} | Dicetak: {formatDateTime(new Date())}
                </p>
            </div>

            {/* Tabs & Date Filter */}
            <div className="rpt-controls print-hide">
                <div className="rpt-tabs">
                    {[
                        { id: 'sales', label: 'Penjualan', icon: <FiShoppingCart size={14} /> },
                        { id: 'products', label: 'Produk', icon: <FiBox size={14} /> },
                        { id: 'customers', label: 'Pelanggan', icon: <FiUsers size={14} /> },
                    ].map(tab => (
                        <button key={tab.id} className={`rpt-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
                <div className="rpt-date-range">
                    <FiCalendar size={14} />
                    <input type="date" className="rpt-date-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                    <input type="date" className="rpt-date-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
            </div>

            {/* ============ SALES REPORT ============ */}
            {activeTab === 'sales' && (
                <>
                    <div className="rpt-stats">
                        {[
                            { label: 'Pendapatan', value: formatRupiah(totalRevenue), icon: <FiDollarSign />, color: '#10b981', bg: '#d1fae5' },
                            { label: 'Jumlah Transaksi', value: totalTrx, icon: <FiShoppingCart />, color: '#3b82f6', bg: '#dbeafe' },
                            { label: 'Rata-rata / Trx', value: formatRupiah(avgTrx), icon: <FiTrendingUp />, color: '#8b5cf6', bg: '#ede9fe' },
                            { label: 'Kas Masuk', value: formatRupiah(cashIn), icon: <FiDollarSign />, color: '#16a34a', bg: '#dcfce7' },
                        ].map(s => (
                            <div key={s.label} className="rpt-stat-card">
                                <div className="rpt-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                                <div><p className="rpt-stat-label">{s.label}</p><p className="rpt-stat-value" style={{ color: s.color }}>{s.value}</p></div>
                            </div>
                        ))}
                    </div>

                    {/* Payment Breakdown */}
                    {paymentBreakdown.length > 0 && (
                        <div className="rpt-card">
                            <h3 className="rpt-card-title">Metode Pembayaran</h3>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '0 20px 16px' }}>
                                {paymentBreakdown.map(pb => (
                                    <div key={pb.method} className="rpt-pill">
                                        <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{pb.method}</span>
                                        <span style={{ color: '#10b981', fontWeight: 800 }}>{formatRupiah(pb.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Transaction Table */}
                    <div className="rpt-card">
                        <h3 className="rpt-card-title">Riwayat Transaksi ({transactions.length})</h3>
                        {transactions.length === 0 ? (
                            <div className="rpt-empty"><FiShoppingCart size={40} /><p>Belum ada transaksi di periode ini.</p></div>
                        ) : (
                            <div className="rpt-table-wrap">
                                <table className="rpt-table">
                                    <thead><tr>
                                        <th>No Invoice</th><th>Tanggal</th><th>Pelanggan</th><th>Tipe</th><th>Total</th><th>Pembayaran</th><th>Kasir</th>
                                    </tr></thead>
                                    <tbody>
                                        {transactions.map(t => (
                                            <tr key={t.id} className="rpt-tr">
                                                <td style={{ fontFamily: 'monospace', fontSize: '.8rem' }}>{t.invoiceNo}</td>
                                                <td style={{ fontSize: '.82rem' }}>{formatDateTime(t.date)}</td>
                                                <td style={{ fontWeight: 600 }}>{t.customerName || 'Umum'}</td>
                                                <td><span className="rpt-badge">{t.type}</span></td>
                                                <td style={{ fontWeight: 700, color: '#10b981' }}>{formatRupiah(t.total)}</td>
                                                <td style={{ textTransform: 'capitalize', fontSize: '.85rem' }}>{t.paymentType}</td>
                                                <td style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>{t.userName}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ============ PRODUCT REPORT ============ */}
            {activeTab === 'products' && (
                <>
                    <div className="rpt-stats">
                        {[
                            { label: 'Total Produk', value: allProducts.length, icon: <FiBox />, color: '#3b82f6', bg: '#dbeafe' },
                            { label: 'Nilai Stok', value: formatRupiah(totalStockValue), icon: <FiDollarSign />, color: '#10b981', bg: '#d1fae5' },
                            { label: 'Stok Menipis', value: lowStockProducts.length, icon: <FiAlertTriangle />, color: lowStockProducts.length > 0 ? '#ef4444' : '#94a3b8', bg: lowStockProducts.length > 0 ? '#fee2e2' : '#f1f5f9' },
                            { label: 'Produk Terjual', value: productSales.length, icon: <FiTrendingUp />, color: '#8b5cf6', bg: '#ede9fe' },
                        ].map(s => (
                            <div key={s.label} className="rpt-stat-card">
                                <div className="rpt-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                                <div><p className="rpt-stat-label">{s.label}</p><p className="rpt-stat-value" style={{ color: s.color }}>{s.value}</p></div>
                            </div>
                        ))}
                    </div>

                    {/* Best Selling */}
                    {productSales.length > 0 && (
                        <div className="rpt-card">
                            <h3 className="rpt-card-title">Produk Terlaris</h3>
                            <div className="rpt-table-wrap">
                                <table className="rpt-table">
                                    <thead><tr><th>#</th><th>Produk</th><th>Qty Terjual</th><th>Pendapatan</th></tr></thead>
                                    <tbody>
                                        {productSales.slice(0, 10).map((ps, i) => (
                                            <tr key={i} className="rpt-tr">
                                                <td style={{ fontWeight: 800, color: i < 3 ? '#f59e0b' : 'var(--text-muted)' }}>{i + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{ps.name}</td>
                                                <td>{ps.qty}</td>
                                                <td style={{ fontWeight: 700, color: '#10b981' }}>{formatRupiah(ps.revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Low Stock Alert */}
                    {lowStockProducts.length > 0 && (
                        <div className="rpt-card">
                            <h3 className="rpt-card-title" style={{ color: '#ef4444' }}>⚠️ Stok Menipis</h3>
                            <div className="rpt-table-wrap">
                                <table className="rpt-table">
                                    <thead><tr><th>Kode</th><th>Produk</th><th>Stok</th><th>Min Stok</th><th>Harga Jual</th></tr></thead>
                                    <tbody>
                                        {lowStockProducts.map(p => (
                                            <tr key={p.id} className="rpt-tr">
                                                <td style={{ fontFamily: 'monospace', fontSize: '.8rem' }}>{p.code}</td>
                                                <td style={{ fontWeight: 600 }}>{p.name}</td>
                                                <td style={{ fontWeight: 700, color: '#ef4444' }}>{p.stock} {p.unit}</td>
                                                <td>{p.minStock} {p.unit}</td>
                                                <td>{formatRupiah(p.sellPrice)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Full Product List */}
                    <div className="rpt-card">
                        <h3 className="rpt-card-title">Daftar Produk Lengkap ({allProducts.length})</h3>
                        <div className="rpt-table-wrap">
                            <table className="rpt-table">
                                <thead><tr><th>Kode</th><th>Nama</th><th>Harga Beli</th><th>Harga Jual</th><th>Stok</th><th>Nilai</th></tr></thead>
                                <tbody>
                                    {allProducts.map(p => (
                                        <tr key={p.id} className="rpt-tr">
                                            <td style={{ fontFamily: 'monospace', fontSize: '.8rem' }}>{p.code}</td>
                                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                                            <td>{formatRupiah(p.buyPrice)}</td>
                                            <td style={{ fontWeight: 700 }}>{formatRupiah(p.sellPrice)}</td>
                                            <td>{p.stock} {p.unit}</td>
                                            <td style={{ fontWeight: 700, color: '#10b981' }}>{formatRupiah(p.sellPrice * p.stock)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ============ CUSTOMER REPORT ============ */}
            {activeTab === 'customers' && (
                <>
                    <div className="rpt-stats">
                        {[
                            { label: 'Total Pelanggan', value: allCustomers.length, icon: <FiUsers />, color: '#3b82f6', bg: '#dbeafe' },
                            { label: 'Total Belanja', value: formatRupiah(allCustomers.reduce((s, c) => s + (c.totalSpend || 0), 0)), icon: <FiDollarSign />, color: '#10b981', bg: '#d1fae5' },
                            { label: 'Total Transaksi', value: allCustomers.reduce((s, c) => s + (c.totalTrx || 0), 0), icon: <FiShoppingCart />, color: '#8b5cf6', bg: '#ede9fe' },
                            { label: 'Corporate', value: allCustomers.filter(c => c.type === 'corporate').length, icon: <FiUsers />, color: '#f59e0b', bg: '#fef3c7' },
                        ].map(s => (
                            <div key={s.label} className="rpt-stat-card">
                                <div className="rpt-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                                <div><p className="rpt-stat-label">{s.label}</p><p className="rpt-stat-value" style={{ color: s.color }}>{s.value}</p></div>
                            </div>
                        ))}
                    </div>

                    {/* Top Customers */}
                    <div className="rpt-card">
                        <h3 className="rpt-card-title">🏆 Pelanggan Teratas (berdasarkan belanja)</h3>
                        <div className="rpt-table-wrap">
                            <table className="rpt-table">
                                <thead><tr><th>#</th><th>Nama</th><th>Tipe</th><th>Telepon</th><th>Total Trx</th><th>Total Belanja</th></tr></thead>
                                <tbody>
                                    {topCustomers.map((c, i) => (
                                        <tr key={c.id} className="rpt-tr">
                                            <td style={{ fontWeight: 800, color: i < 3 ? '#f59e0b' : 'var(--text-muted)' }}>{i + 1}</td>
                                            <td style={{ fontWeight: 700 }}>{c.name}</td>
                                            <td><span className="rpt-badge">{c.type}</span></td>
                                            <td style={{ fontSize: '.85rem' }}>{c.phone}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{c.totalTrx || 0}x</td>
                                            <td style={{ fontWeight: 700, color: '#10b981' }}>{formatRupiah(c.totalSpend || 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Full Customer List */}
                    <div className="rpt-card">
                        <h3 className="rpt-card-title">Daftar Pelanggan Lengkap ({allCustomers.length})</h3>
                        <div className="rpt-table-wrap">
                            <table className="rpt-table">
                                <thead><tr><th>Nama</th><th>Telepon</th><th>Alamat</th><th>Tipe</th><th>Perusahaan</th><th>Total Belanja</th></tr></thead>
                                <tbody>
                                    {allCustomers.map(c => (
                                        <tr key={c.id} className="rpt-tr">
                                            <td style={{ fontWeight: 600 }}>{c.name}</td>
                                            <td style={{ fontSize: '.85rem' }}>{c.phone || '-'}</td>
                                            <td style={{ fontSize: '.85rem', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '-'}</td>
                                            <td><span className="rpt-badge">{c.type}</span></td>
                                            <td style={{ fontSize: '.85rem' }}>{c.company || '-'}</td>
                                            <td style={{ fontWeight: 700, color: '#10b981' }}>{formatRupiah(c.totalSpend || 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

const CSS = `
.rpt-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.rpt-title { font-size:1.4rem; font-weight:800; margin:0; display:flex; align-items:center; gap:8px; color:var(--text-primary); }
.rpt-sub { color:var(--text-secondary); margin:4px 0 0; font-size:.875rem; }
.rpt-btn-primary { display:flex; align-items:center; gap:7px; background:#3b82f6; color:#fff; font-weight:700; font-size:.85rem; padding:10px 18px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(59,130,246,.25); transition:all .15s; }
.rpt-btn-primary:hover { background:#2563eb; }
.rpt-btn-outline { display:flex; align-items:center; gap:7px; background:var(--bg-secondary); color:var(--text-primary); font-weight:700; font-size:.85rem; padding:10px 18px; border-radius:10px; border:1px solid var(--border); cursor:pointer; transition:all .15s; }
.rpt-btn-outline:hover { border-color:#3b82f6; color:#3b82f6; }

.rpt-controls { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.rpt-tabs { display:flex; gap:6px; }
.rpt-tab { padding:8px 16px; border-radius:10px; border:1px solid var(--border); background:var(--bg-input); font-size:.82rem; font-weight:700; color:var(--text-secondary); cursor:pointer; transition:all .15s; display:flex; align-items:center; gap:6px; }
.rpt-tab:hover { border-color:#3b82f6; color:#3b82f6; }
.rpt-tab.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }
.rpt-date-range { display:flex; align-items:center; gap:8px; }
.rpt-date-input { padding:8px 12px; border:1px solid var(--border); border-radius:8px; font-size:.85rem; background:var(--bg-input); color:var(--text-primary); outline:none; }
.rpt-date-input:focus { border-color:#3b82f6; }

.rpt-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
@media(max-width:900px){ .rpt-stats { grid-template-columns:repeat(2,1fr); } }
@media(max-width:500px){ .rpt-stats { grid-template-columns:1fr; } }
.rpt-stat-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:14px; padding:18px; display:flex; align-items:center; gap:14px; }
.rpt-stat-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:1.2rem; }
.rpt-stat-label { font-size:.72rem; color:var(--text-muted); font-weight:600; margin:0 0 3px; text-transform:uppercase; letter-spacing:.04em; }
.rpt-stat-value { font-size:1.3rem; font-weight:900; margin:0; }

.rpt-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
.rpt-card-title { font-size:.95rem; font-weight:800; padding:16px 20px 10px; margin:0; color:var(--text-primary); }
.rpt-pill { padding:10px 16px; background:var(--bg-input); border:1px solid var(--border); border-radius:12px; display:flex; flex-direction:column; gap:2px; font-size:.82rem; }
.rpt-empty { padding:40px; text-align:center; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; gap:8px; }
.rpt-table-wrap { overflow-x:auto; }
.rpt-table { width:100%; border-collapse:collapse; text-align:left; }
.rpt-table thead tr { background:var(--bg-input); }
.rpt-table th { padding:10px 18px; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); white-space:nowrap; }
.rpt-tr { border-top:1px solid var(--border); transition:background .1s; }
.rpt-tr:hover { background:var(--bg-card-hover); }
.rpt-table td { padding:10px 18px; vertical-align:middle; }
.rpt-badge { padding:3px 9px; font-size:.68rem; font-weight:700; border-radius:9999px; background:var(--bg-input); color:var(--text-secondary); white-space:nowrap; text-transform:capitalize; }

/* Print */
.print-only-header { display:none; }
@media print {
    .print-hide { display:none !important; }
    .print-only-header { display:block !important; text-align:center; margin-bottom:16px; }
    .rpt-page { padding:0 !important; }
    .rpt-card, .rpt-stat-card { border:1px solid #ddd !important; box-shadow:none !important; break-inside:avoid; }
    .rpt-table { font-size:.75rem; }
    .rpt-stat-value { font-size:1rem; }
}
`;
