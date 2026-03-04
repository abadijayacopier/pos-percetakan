import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatRupiah } from '../utils';
import {
    FiDollarSign, FiPrinter, FiTool, FiShoppingCart, FiAlertCircle,
    FiFileText, FiPlus, FiEdit, FiCheckCircle, FiClock, FiUsers,
    FiPackage, FiArrowRight
} from 'react-icons/fi';

export default function DashboardPage({ onNavigate }) {
    const [stats, setStats] = useState({
        omset: 0, trxCount: 0, saldo: 0,
        lowStock: [], pendingOrders: [], activeService: [], notifications: []
    });
    const [recentTrx, setRecentTrx] = useState([]);

    useEffect(() => {
        const fetchDashboardInfo = async () => {
            try {
                const res = await api.get('/finance/stats');
                const productsRes = await api.get('/products');
                const printRes = await api.get('/print-orders');
                const srvRes = await api.get('/service-orders');
                const trxRes = await api.get('/transactions');

                const data = res.data;
                const products = productsRes.data || [];
                const printOrders = printRes.data || [];
                const serviceOrders = srvRes.data || [];

                const lowStock = products.filter(p => p.stock <= p.min_stock);
                const pendingOrders = printOrders.filter(o => !['selesai', 'diambil'].includes(o.status));
                const activeService = serviceOrders.filter(o => !['selesai', 'diambil'].includes(o.status));

                setStats({
                    omset: data.todaySales || 0,
                    trxCount: data.trxCount || 0,
                    saldo: data.saldo || 0,
                    lowStock, pendingOrders, activeService
                });

                if (trxRes.data) {
                    // Sorting by date desc
                    const sorted = trxRes.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    setRecentTrx(sorted.slice(0, 5));
                }
            } catch (e) { console.error('Gagal load dashboard', e) }
        };
        fetchDashboardInfo();
    }, []);

    // Placeholder chart data
    const chartBars = [
        { day: 'Sen', h1: 30, h2: 40 },
        { day: 'Sel', h1: 50, h2: 70 },
        { day: 'Rab', h1: 20, h2: 30 },
        { day: 'Kam', h1: 80, h2: 90 },
        { day: 'Jum', h1: 100, h2: 120 },
        { day: 'Sab', h1: 40, h2: 60 },
        { day: 'Min', h1: 20, h2: 40 },
    ];

    return (
        <div className="premium-dashboard">
            <style>{`
                .premium-dashboard {
                    font-family: 'Inter', sans-serif;
                    background-color: var(--bg-primary);
                    color: var(--text-primary);
                    padding: 0;
                    min-height: 100%;
                }
                .dash-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }
                .dash-cards {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 24px;
                }
                .p-card {
                    background: var(--bg-secondary);
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                    border: 1px solid var(--border);
                    position: relative;
                }
                .p-card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;
                }
                .p-card-title {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                }
                .p-icon-box {
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }
                .i-green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .i-blue { background: rgba(79, 70, 229, 0.1); color: #4f46e5; }
                .i-orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
                .i-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                
                .p-card-value {
                    font-size: 1.7rem;
                    font-weight: 700;
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    margin-bottom: 4px;
                    color: var(--text-primary);
                }
                .p-card-value span { font-size: 0.8rem; font-weight: 600; }
                .p-card-value span.v-green { color: #10b981; }
                .p-card-value span.v-blue { color: #3b82f6; }
                .p-card-subtitle {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .main-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 24px;
                }

                .action-btns {
                    display: flex;
                    gap: 12px;
                    margin-top: 16px;
                }
                .btn-act {
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    border: none;
                    transition: 0.2s;
                }
                .btn-act.primary {
                    background: #1877f2;
                    color: white;
                    box-shadow: 0 4px 12px rgba(24, 119, 242, 0.2);
                }
                .btn-act.primary:hover { background: #155ecc; }
                .btn-act.secondary {
                    background: var(--bg-input);
                    color: var(--text-secondary);
                }
                .btn-act.secondary:hover { background: var(--border); }

                .chart-container {
                    margin-top: 24px;
                    height: 200px;
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    padding: 0 10px;
                }
                .chart-bar-group {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    width: 32px;
                }
                .chart-bar {
                    width: 100%;
                    background: var(--bg-input);
                    border-radius: 4px;
                    position: relative;
                    height: 160px;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                }
                .bar-fill-top {
                    background: rgba(37, 99, 235, 0.25);
                    width: 100%;
                    border-radius: 4px 4px 0 0;
                }
                .bar-fill-bottom {
                    background: #2563eb;
                    width: 100%;
                    border-radius: 0 0 4px 4px;
                }
                .chart-label {
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    font-weight: 500;
                }

                .trx-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-top: 16px;
                }
                .trx-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .trx-icon {
                    width: 36px;
                    height: 36px;
                    background: var(--bg-input);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                }
                .trx-info { flex: 1; }
                .trx-name { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
                .trx-id { font-size: 0.7rem; color: var(--text-muted); }
                .trx-amount { text-align: right; }
                .trx-price { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
                .trx-badge {
                    font-size: 0.65rem;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-weight: 600;
                    display: inline-block;
                    margin-top: 4px;
                }
                .b-completed { background: rgba(22, 163, 74, 0.15); color: #22c55e; }
                .b-progress { background: rgba(37, 99, 235, 0.15); color: #3b82f6; }
                .b-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
                .b-cancelled { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

                .alert-banner {
                    margin-top: 24px;
                    background: rgba(79, 70, 229, 0.1);
                    border-left: 4px solid #4f46e5;
                    border-radius: 8px;
                    padding: 16px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .alert-text { font-size: 0.85rem; color: var(--text-primary); }
                .alert-btn {
                    background: transparent;
                    border: none;
                    color: #4f46e5;
                    font-weight: 600;
                    font-size: 0.85rem;
                    cursor: pointer;
                }
                
                @media (max-width: 1024px) {
                    .dash-cards {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .main-grid {
                        display: flex;
                        flex-direction: column;
                    }
                }

                @media (max-width: 768px) {
                    .dash-cards {
                        grid-template-columns: 1fr;
                    }
                    .action-btns {
                        flex-direction: column;
                    }
                    .btn-act {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>

            <div className="dash-cards">
                <div className="p-card">
                    <div className="p-card-top">
                        <span className="p-card-title">Penjualan Hari Ini</span>
                        <div className="p-icon-box i-green"><FiDollarSign /></div>
                    </div>
                    <div className="p-card-value">
                        {formatRupiah(stats.omset)} <span className="v-green">+12.5%</span>
                    </div>
                    <div className="p-card-subtitle">vs kemarin</div>
                </div>

                <div className="p-card">
                    <div className="p-card-top">
                        <span className="p-card-title">Pesanan Aktif</span>
                        <div className="p-icon-box i-blue"><FiPrinter /></div>
                    </div>
                    <div className="p-card-value">
                        {stats.pendingOrders.length} Pesanan <span className="v-blue">+{Math.min(2, stats.pendingOrders.length)}</span>
                    </div>
                    <div className="p-card-subtitle">Siap diproses</div>
                </div>

                <div className="p-card">
                    <div className="p-card-top">
                        <span className="p-card-title">Servis Berjalan</span>
                        <div className="p-icon-box i-orange"><FiTool /></div>
                    </div>
                    <div className="p-card-value">
                        {stats.activeService.length} Tiket <span style={{ color: '#f97316', fontSize: '0.75rem' }}>Prioritas</span>
                    </div>
                    <div className="p-card-subtitle">{Math.max(0, stats.activeService.length - 1)} jatuh tempo hari ini</div>
                </div>

                <div className="p-card">
                    <div className="p-card-top">
                        <span className="p-card-title">Stok Menipis</span>
                        <div className="p-icon-box i-red"><FiShoppingCart /></div>
                    </div>
                    <div className="p-card-value">
                        {stats.lowStock.length} Item <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>Siaga</span>
                    </div>
                    <div className="p-card-subtitle">Perlu isi ulang</div>
                </div>
            </div>

            <div className="main-grid">
                <div className="left-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="p-card">
                        <h3 style={{ fontSize: '1rem', margin: 0 }}>Aksi Cepat</h3>
                        <div className="action-btns">
                            <button className="btn-act primary" onClick={() => onNavigate('pos')}>
                                <FiShoppingCart /> Transaksi Baru
                            </button>
                            <button className="btn-act secondary" onClick={() => onNavigate('service')}>
                                <FiTool /> Buat Tiket Servis
                            </button>
                            <button className="btn-act secondary" onClick={() => onNavigate('printing')}>
                                <FiPrinter /> Antrean Cetak
                            </button>
                        </div>
                    </div>

                    <div className="p-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', margin: 0, marginBottom: '4px' }}>Performa Penjualan</h3>
                                <span className="p-card-subtitle">Ringkasan omzet mingguan</span>
                            </div>
                            <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-input)' }}>
                                <option>7 Hari Terakhir</option>
                            </select>
                        </div>

                        <div className="chart-container">
                            {chartBars.map((b, i) => (
                                <div className="chart-bar-group" key={i}>
                                    <div className="chart-bar">
                                        <div className="bar-fill-top" style={{ height: `${b.h2}%` }}></div>
                                        <div className="bar-fill-bottom" style={{ height: `${b.h1}%` }}></div>
                                    </div>
                                    <span className="chart-label">{b.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="right-col">
                    <div className="p-card" style={{ height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1rem', margin: 0 }}>Transaksi Terbaru</h3>
                            <a href="#" style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: '600' }} onClick={(e) => { e.preventDefault(); onNavigate('reports'); }}>Lihat Semua</a>
                        </div>

                        <div className="trx-list">
                            {recentTrx.length > 0 ? recentTrx.map((trx, idx) => (
                                <div className="trx-item" key={idx}>
                                    <div className="trx-icon">{trx.type === 'service' ? <FiTool /> : trx.type === 'print' ? <FiPrinter /> : <FiFileText />}</div>
                                    <div className="trx-info">
                                        <div className="trx-name">{trx.customer_name || 'Pelanggan Umum'} ({trx.type})</div>
                                        <div className="trx-id">ID Transaksi: #{trx.id.toString().padStart(4, '0')}</div>
                                    </div>
                                    <div className="trx-amount">
                                        <div className="trx-price">{formatRupiah(trx.total || trx.grand_total)}</div>
                                        <div className={`trx-badge ${trx.status === 'selesai' ? 'b-completed' : trx.status === 'proses' ? 'b-progress' : trx.status === 'batal' ? 'b-cancelled' : 'b-completed'}`}>
                                            {trx.status || 'Selesai'}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <>
                                    <div className="trx-item">
                                        <div className="trx-icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}><FiPrinter /></div>
                                        <div className="trx-info">
                                            <div className="trx-name">Kartu Nama (500)</div>
                                            <div className="trx-id">ID Transaksi: #8487</div>
                                        </div>
                                        <div className="trx-amount">
                                            <div className="trx-price">Rp 120.000</div>
                                            <div className="trx-badge b-pending">Menunggu</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Sinkronisasi data otomatis setiap 2 menit
                        </div>
                    </div>
                </div>
            </div>

            <div className="alert-banner">
                <div className="alert-text">
                    <span style={{ background: '#2563eb', color: 'white', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', marginRight: '12px', fontWeight: 'bold' }}>i</span>
                    Anda memiliki <strong>3 mesin</strong> yang memerlukan perawatan rutin akhir minggu ini.
                </div>
                <button className="alert-btn">Jadwalkan</button>
            </div>
        </div>
    );
}
