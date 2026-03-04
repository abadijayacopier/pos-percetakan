import { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import db from '../db';
import { formatRupiah, formatDate } from '../utils';
import { FiSettings, FiFile, FiUsers, FiPrinter, FiEdit, FiTrash2, FiPlus, FiSave, FiPackage, FiTool, FiDollarSign, FiFileText, FiSearch, FiClock, FiCheckCircle, FiAlertCircle, FiX, FiDownload, FiUpload, FiRefreshCw, FiCheck, FiTruck, FiCalendar, FiMessageCircle, FiHome, FiBriefcase, FiStar, FiBox, FiActivity, FiLayers, FiList, FiChevronRight, FiChevronDown, FiEye, FiBarChart2, FiTrendingDown, FiAward } from 'react-icons/fi';

export default function ReportsPage() {
    const [reportType, setReportType] = useState('sales');
    const [period, setPeriod] = useState('daily');
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

    const [transactions, setTransactions] = useState([]);
    const [products, setProducts] = useState([]);
    const [printOrders, setPrintOrders] = useState([]);
    const [serviceOrders, setServiceOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [cashFlow, setCashFlow] = useState([]);

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                const [txData, pdData, poData, soData, csData, cfData] = await Promise.all([
                    api.get('/transactions'),
                    api.get('/products'),
                    api.get('/print-orders'),
                    api.get('/service-orders'),
                    api.get('/customers'),
                    api.get('/finance')
                ]);

                setTransactions(txData.data || []);
                setProducts(pdData.data || []);
                setPrintOrders(poData.data || []);
                setServiceOrders(soData.data || []);
                setCustomers(csData.data || []);
                setCashFlow(cfData.data || []);
            } catch (error) {
                console.error("Gagal load reports data", error);
            }
        };
        fetchReportData();
    }, []);

    // Helper: extract YYYY-MM-DD from any date format
    const toDateStr = (raw) => {
        if (!raw) return '';
        const s = raw.toString();
        // Handle ISO "2026-03-03T09:30:00.000Z" or MySQL "2026-03-03 09:30:00"
        return s.substring(0, 10);
    };

    const filteredTrx = useMemo(() => {
        return transactions.filter(t => {
            const d = toDateStr(t.date);
            return d >= dateFrom && d <= dateTo;
        });
    }, [transactions, dateFrom, dateTo]);

    const salesStats = useMemo(() => {
        const total = filteredTrx.reduce((s, t) => s + t.total, 0);
        const count = filteredTrx.length;
        const byType = {};
        filteredTrx.forEach(t => { byType[t.type] = (byType[t.type] || 0) + t.total; });
        // Top products
        const productSales = {};
        filteredTrx.forEach(t => {
            (t.items || []).forEach(i => {
                if (!productSales[i.name]) productSales[i.name] = { name: i.name, qty: 0, total: 0 };
                productSales[i.name].qty += i.qty;
                productSales[i.name].total += i.subtotal;
            });
        });
        const topProducts = Object.values(productSales).sort((a, b) => b.total - a.total).slice(0, 10);
        return { total, count, byType: Object.entries(byType), topProducts };
    }, [filteredTrx]);

    const financeStats = useMemo(() => {
        const flows = cashFlow.filter(c => {
            const d = toDateStr(c.date || c.createdAt || c.created_at);
            return d >= dateFrom && d <= dateTo;
        });

        let income = flows.filter(c => c.type === 'in').reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
        const expense = flows.filter(c => c.type === 'out').reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);

        // Fallback: jika cash_flow kosong tapi ada transaksi paid, hitung income dari transaksi
        if (income === 0 && filteredTrx.length > 0) {
            income = filteredTrx
                .filter(t => t.status === 'paid')
                .reduce((s, t) => s + (parseFloat(t.total) || 0), 0);
        }

        return { income, expense, profit: income - expense, flows };
    }, [cashFlow, filteredTrx, dateFrom, dateTo]);

    const stockStats = useMemo(() => {
        const low = products.filter(p => p.stock <= p.minStock);
        const totalValue = products.reduce((s, p) => s + p.buyPrice * p.stock, 0);
        return { total: products.length, low, totalValue };
    }, [products]);

    const topCustomers = useMemo(() => {
        return [...customers].sort((a, b) => (b.total_spend || 0) - (a.total_spend || 0)).slice(0, 10);
    }, [customers]);

    const [storeInfo, setStoreInfo] = useState({ name: 'FOTOCOPY ABADI JAYA', address: '', phone: '' });

    useEffect(() => {
        const settingsList = db.getAll('settings');
        const getSet = (k) => settingsList.find(s => s.key === k)?.value || '';
        setStoreInfo({
            name: getSet('store_name') || 'FOTOCOPY ABADI JAYA',
            address: getSet('store_address') || '',
            phone: getSet('store_phone') || ''
        });
    }, []);

    const REPORT_TABS = [
        { id: 'sales', icon: <FiFileText />, text: 'Penjualan' },
        { id: 'finance', icon: <FiDollarSign />, text: 'Keuangan' },
        { id: 'stock', icon: <FiPackage />, text: 'Stok' },
        { id: 'orders', icon: <FiFileText />, text: 'Order' },
        { id: 'customers', icon: <FiUsers />, text: 'Pelanggan' },
    ];

    const REPORT_TITLES = {
        sales: 'LAPORAN PENJUALAN',
        finance: 'LAPORAN KEUANGAN',
        stock: 'LAPORAN STOK BARANG',
        orders: 'LAPORAN ORDER PERCETAKAN & SERVICE',
        customers: 'LAPORAN DATA PELANGGAN'
    };

    return (
        <div className="premium-page-wrapper">
            <div className="page-toolbar">
                <div className="tabs" style={{ border: 'none', marginBottom: '0' }}>
                    {REPORT_TABS.map(t => (
                        <button key={t.id} className={`tab-btn ${reportType === t.id ? 'active' : ''}`} onClick={() => setReportType(t.id)}>{t.icon} {t.text}</button>
                    ))}
                </div>
                <div className="filter-group">
                    <input className="form-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '160px' }} />
                    <span style={{ color: 'var(--text-muted)' }}>s/d</span>
                    <input className="form-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '160px' }} />
                    <button className="btn btn-primary" onClick={() => window.print()} style={{ marginLeft: '12px' }}>
                        <FiPrinter /> Cetak / Save PDF
                    </button>
                </div>
            </div>

            {/* === Print-Only Report Header (hidden on screen, visible on PDF) === */}
            <div className="report-print-header">
                <h2 style={{ margin: '0 0 2px 0', fontSize: '16pt' }}>{storeInfo.name}</h2>
                <p style={{ margin: '0', fontSize: '10pt' }}>{storeInfo.address}</p>
                {storeInfo.phone && <p style={{ margin: '0', fontSize: '10pt' }}>Telp: {storeInfo.phone}</p>}
                <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '10px 0' }} />
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14pt', letterSpacing: '2px' }}>LAPORAN LENGKAP</h3>
                <p style={{ margin: '0 0 10px 0', fontSize: '9pt', color: '#555' }}>Periode: {dateFrom} s/d {dateTo} &nbsp;|&nbsp; Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '0 0 16px 0' }} />
            </div>

            {/* ====== ALL REPORT SECTIONS (always rendered, toggle visibility on screen, all visible in print) ====== */}

            {/* 1. Sales Report */}
            <div className={`report-section ${reportType !== 'sales' ? 'report-section-hidden' : ''}`}>
                <h3 className="report-section-title">A. LAPORAN PENJUALAN</h3>
                <div className="stats-grid">
                    <div className="stat-card"><div className="stat-icon green"><FiDollarSign /></div><div className="stat-value">{formatRupiah(salesStats.total)}</div><div className="stat-label">Total Penjualan</div></div>
                    <div className="stat-card"><div className="stat-icon blue"><FiPackage /></div><div className="stat-value">{salesStats.count}</div><div className="stat-label">Jumlah Transaksi</div></div>
                    <div className="stat-card"><div className="stat-icon purple"><FiBarChart2 /></div><div className="stat-value">{salesStats.count > 0 ? formatRupiah(Math.round(salesStats.total / salesStats.count)) : 'Rp 0'}</div><div className="stat-label">Rata-rata / TRX</div></div>
                </div>
                <div className="card" style={{ marginTop: '16px' }}>
                    <div className="card-header"><h3><FiFileText /> Riwayat Transaksi</h3></div>
                    <div style={{ overflow: 'auto', maxHeight: '400px' }}>
                        <table className="data-table">
                            <thead><tr><th>Invoice</th><th>Tanggal</th><th>Customer</th><th>Tipe</th><th>Total</th><th>Bayar</th><th>Status</th></tr></thead>
                            <tbody>
                                {filteredTrx.map(t => (
                                    <tr key={t.id}><td><strong>{t.invoice_no}</strong></td><td>{formatDate(t.date)}</td><td>{t.customer_name}</td><td><span className="badge badge-info">{t.type}</span></td><td style={{ fontWeight: '600' }}>{formatRupiah(t.total)}</td><td>{t.payment_type}</td><td><span className={`badge ${t.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{t.status === 'paid' ? 'Lunas' : 'Belum'}</span></td></tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ fontWeight: '700', borderTop: '2px solid #000' }}>
                                    <td colSpan="4" style={{ textAlign: 'right' }}>TOTAL PENJUALAN:</td>
                                    <td colSpan="3">{formatRupiah(salesStats.total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* 2. Finance Report */}
            <div className={`report-section ${reportType !== 'finance' ? 'report-section-hidden' : ''}`}>
                <h3 className="report-section-title">B. LAPORAN KEUANGAN</h3>
                <div className="stats-grid">
                    <div className="stat-card"><div className="stat-icon green"><FiFileText /></div><div className="stat-value">{formatRupiah(financeStats.income)}</div><div className="stat-label">Pemasukan</div></div>
                    <div className="stat-card"><div className="stat-icon red"><FiTrendingDown /></div><div className="stat-value">{formatRupiah(financeStats.expense)}</div><div className="stat-label">Pengeluaran</div></div>
                    <div className="stat-card"><div className="stat-icon blue"><FiActivity /></div><div className="stat-value" style={{ color: financeStats.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatRupiah(financeStats.profit)}</div><div className="stat-label">Laba / Rugi</div></div>
                </div>
                <div className="card">
                    <div className="card-header"><h3>Arus Kas</h3></div>
                    <div style={{ overflow: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>Tanggal</th><th>Tipe</th><th>Kategori</th><th>Keterangan</th><th>Jumlah</th></tr></thead>
                            <tbody>
                                {financeStats.flows.map(c => (
                                    <tr key={c.id}><td>{new Date(c.date || c.created_at).toLocaleDateString()}</td><td><span className={`badge ${c.type === 'in' ? 'badge-success' : 'badge-danger'}`}>{c.type === 'in' ? 'Masuk' : 'Keluar'}</span></td><td>{c.category}</td><td>{c.description}</td><td style={{ color: c.type === 'in' ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>{c.type === 'in' ? '+' : '-'}{formatRupiah(c.amount)}</td></tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ fontWeight: '700', borderTop: '2px solid #000' }}>
                                    <td colSpan="4" style={{ textAlign: 'right' }}>Total Pemasukan:</td>
                                    <td style={{ color: 'var(--success)' }}>+{formatRupiah(financeStats.income)}</td>
                                </tr>
                                <tr style={{ fontWeight: '700' }}>
                                    <td colSpan="4" style={{ textAlign: 'right' }}>Total Pengeluaran:</td>
                                    <td style={{ color: 'var(--danger)' }}>-{formatRupiah(financeStats.expense)}</td>
                                </tr>
                                <tr style={{ fontWeight: '800', fontSize: '1.1em', borderTop: '2px double #000' }}>
                                    <td colSpan="4" style={{ textAlign: 'right' }}>LABA / RUGI:</td>
                                    <td style={{ color: financeStats.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatRupiah(financeStats.profit)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* 3. Stock Report */}
            <div className={`report-section ${reportType !== 'stock' ? 'report-section-hidden' : ''}`}>
                <h3 className="report-section-title">C. LAPORAN STOK BARANG</h3>
                <div className="stats-grid">
                    <div className="stat-card"><div className="stat-icon blue"><FiPackage /></div><div className="stat-value">{stockStats.total}</div><div className="stat-label">Total Produk</div></div>
                    <div className="stat-card"><div className="stat-icon yellow"><FiAlertCircle /></div><div className="stat-value">{stockStats.low.length}</div><div className="stat-label">Stok Menipis</div></div>
                    <div className="stat-card"><div className="stat-icon purple"><FiActivity /></div><div className="stat-value">{formatRupiah(stockStats.totalValue)}</div><div className="stat-label">Nilai Inventori</div></div>
                </div>
                <div className="card">
                    <div className="card-header"><h3>Semua Stok</h3></div>
                    <div style={{ overflow: 'auto', maxHeight: '500px' }}>
                        <table className="data-table">
                            <thead><tr><th></th><th>Kode</th><th>Nama</th><th>Stok</th><th>Min</th><th>Harga Beli</th><th>Nilai</th><th>Status</th></tr></thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id}><td>{p.emoji}</td><td><code>{p.code}</code></td><td>{p.name}</td><td><strong>{p.stock}</strong> {p.unit}</td><td>{p.minStock}</td><td>{formatRupiah(p.buyPrice)}</td><td>{formatRupiah(p.buyPrice * p.stock)}</td><td><span className={`badge ${p.stock === 0 ? 'badge-danger' : p.stock <= p.minStock ? 'badge-warning' : 'badge-success'}`}>{p.stock === 0 ? 'Habis' : p.stock <= p.minStock ? 'Menipis' : 'OK'}</span></td></tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ fontWeight: '700', borderTop: '2px solid #000' }}>
                                    <td colSpan="6" style={{ textAlign: 'right' }}>TOTAL NILAI INVENTORI:</td>
                                    <td colSpan="2">{formatRupiah(stockStats.totalValue)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* 4. Orders Report */}
            <div className={`report-section ${reportType !== 'orders' ? 'report-section-hidden' : ''}`}>
                <h3 className="report-section-title">D. LAPORAN ORDER</h3>
                <div className="stats-grid">
                    <div className="stat-card"><div className="stat-icon blue"><FiPrinter /></div><div className="stat-value">{printOrders.length}</div><div className="stat-label">Order Cetak</div></div>
                    <div className="stat-card"><div className="stat-icon yellow"><FiTool /></div><div className="stat-value">{serviceOrders.length}</div><div className="stat-label">Order Service</div></div>
                    <div className="stat-card"><div className="stat-icon red"><FiClock /></div><div className="stat-value">{printOrders.filter(o => !['selesai', 'diambil', 'batal'].includes(o.status)).length}</div><div className="stat-label">Belum Selesai</div></div>
                </div>
                <div className="card">
                    <div className="card-header"><h3>Order Percetakan</h3></div>
                    <div style={{ overflow: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>No</th><th>Customer</th><th>Jenis</th><th>Total</th><th>Status</th></tr></thead>
                            <tbody>
                                {printOrders.map(o => (
                                    <tr key={o.id}><td>{o.order_no || o.orderNo}</td><td>{o.customer_name || o.customerName}</td><td>{o.type}</td><td>{formatRupiah(o.total_price || o.totalPrice)}</td><td><span className="badge badge-info">{o.status}</span></td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card" style={{ marginTop: '16px' }}>
                    <div className="card-header"><h3>Order Service</h3></div>
                    <div style={{ overflow: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>No</th><th>Customer</th><th>Mesin</th><th>Total</th><th>Status</th></tr></thead>
                            <tbody>
                                {serviceOrders.map(o => (
                                    <tr key={o.id}><td>{o.service_no || o.serviceNo}</td><td>{o.customer_name || o.customerName}</td><td>{o.machine_info || o.machineInfo}</td><td>{formatRupiah(o.total_cost || o.totalCost)}</td><td><span className="badge badge-info">{o.status}</span></td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 5. Customers Report */}
            <div className={`report-section ${reportType !== 'customers' ? 'report-section-hidden' : ''}`}>
                <h3 className="report-section-title">E. LAPORAN DATA PELANGGAN</h3>
                <div className="card">
                    <div className="card-header"><h3><FiAward /> Top Customer</h3></div>
                    <div style={{ overflow: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>#</th><th>Nama</th><th>Tipe</th><th>Total TRX</th><th>Total Belanja</th></tr></thead>
                            <tbody>
                                {topCustomers.map((c, i) => (
                                    <tr key={c.id}><td><strong>{i + 1}</strong></td><td>{c.name}</td><td><span className="badge badge-info">{c.type}</span></td><td>{c.total_trx || 0}x</td><td style={{ color: 'var(--primary)', fontWeight: '700' }}>{formatRupiah(c.total_spend || 0)}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
