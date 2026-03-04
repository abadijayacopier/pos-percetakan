import { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import { formatRupiah, today, isToday } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import { FiSettings, FiFile, FiUsers, FiPrinter, FiEdit, FiTrash2, FiPlus, FiSave, FiPackage, FiTool, FiDollarSign, FiFileText, FiSearch, FiClock, FiCheckCircle, FiAlertCircle, FiX, FiDownload, FiUpload, FiRefreshCw, FiCheck, FiTruck, FiCalendar, FiMessageCircle, FiHome, FiBriefcase, FiStar, FiBox, FiActivity, FiLayers, FiList, FiChevronRight, FiChevronDown, FiEye, FiMinus } from 'react-icons/fi';

const EXPENSE_CATS = ['Operasional', 'Belanja Stok', 'Listrik & Air', 'Transport', 'Makan Karyawan', 'Lainnya'];

export default function FinancePage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [cashFlow, setCashFlow] = useState([]);
    const [expenseOpen, setExpenseOpen] = useState(false);
    const [expCat, setExpCat] = useState('Operasional');
    const [expAmount, setExpAmount] = useState('');
    const [expDesc, setExpDesc] = useState('');
    const [filterDate, setFilterDate] = useState(today());
    const [transactions, setTransactions] = useState([]);
    const [printOrders, setPrintOrders] = useState([]);

    const fetchFinanceData = async () => {
        try {
            const resCash = await api.get('/finance');
            setCashFlow(resCash.data);

            const resTrx = await api.get('/transactions/history/today'); // Asumsi route yg ada atau get all (akan difilter di useMemo nanti)
            const resPrint = await api.get('/print-orders');

            setTransactions(resTrx.data || []);
            setPrintOrders(resPrint.data || []);
        } catch (e) {
            console.error('Failed to load finance data');
        }
    };

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const refreshCash = fetchFinanceData;

    const toDateStr = (raw) => {
        if (!raw) return '';
        const s = raw.toString();
        return s.substring(0, 10);
    };

    const dayFlow = useMemo(() => {
        const filteredFlows = cashFlow.filter(c => {
            const d = toDateStr(c.date || c.createdAt);
            return d === filterDate;
        });

        // Pemasukan murni dari Cash Flow (DP dll)
        let income = filteredFlows.filter(c => c.type === 'in').reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);

        // Gabungkan dengan rekap penjualan ATK/Fotocopy/Jilid yang Lunas di Kasir pada tgl tsb
        const todayTrx = transactions.filter(t => {
            const d = toDateStr(t.date);
            return d === filterDate && t.status === 'paid';
        });
        const salesIncome = todayTrx.reduce((s, t) => s + (parseFloat(t.total) || 0), 0);
        income += salesIncome;

        const expense = filteredFlows.filter(c => c.type === 'out').reduce((s, c) => s + c.amount, 0);

        return { items: filteredFlows, income, salesIncome, expense, balance: income - expense };
    }, [cashFlow, transactions, filterDate]);

    // Piutang
    const receivables = useMemo(() => {
        const unpaid = transactions.filter(t => t.status === 'unpaid');
        const printRemaining = printOrders.filter(o => o.remaining > 0);
        return [
            ...unpaid.map(t => ({ name: t.customer_name || 'Walk-in', amount: t.total, type: 'Penjualan', ref: t.invoice_no })),
            ...printRemaining.map(o => ({ name: o.customer_name || 'Walk-in', amount: o.remaining, type: 'Percetakan', ref: o.order_no })),
        ];
    }, [transactions, printOrders]);

    const totalReceivable = receivables.reduce((s, r) => s + r.amount, 0);

    const addExpense = async () => {
        const amount = parseInt(expAmount);
        if (!amount || amount <= 0) { showToast('Masukkan jumlah!', 'warning'); return; }

        try {
            await api.post('/finance/expense', {
                date: today(),
                category: expCat,
                amount,
                description: expDesc
            });
            refreshCash();
            setExpenseOpen(false);
            setExpAmount('');
            setExpDesc('');
            showToast('Pengeluaran berhasil dicatat!', 'success');
        } catch (e) {
            showToast('Gagal mencatat pengeluaran', 'error');
        }
    };

    // Income breakdown
    const incomeBreakdown = useMemo(() => {
        const grouped = {};
        dayFlow.items.filter(c => c.type === 'in').forEach(c => {
            grouped[c.category] = (grouped[c.category] || 0) + c.amount;
        });
        return Object.entries(grouped);
    }, [dayFlow]);

    return (
        <div className="premium-page-wrapper">
            <div className="page-toolbar">
                <h2><FiDollarSign /> Kas & Keuangan</h2>
                <div className="toolbar-actions">
                    <input className="form-input" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: '180px' }} />
                    <button className="btn btn-danger" onClick={() => setExpenseOpen(true)}><FiMinus /> Catat Pengeluaran</button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon green"><FiFileText /></div><div className="stat-value">{formatRupiah(dayFlow.income)}</div><div className="stat-label">Pemasukan</div></div>
                <div className="stat-card"><div className="stat-icon red"><FiFileText /></div><div className="stat-value">{formatRupiah(dayFlow.expense)}</div><div className="stat-label">Pengeluaran</div></div>
                <div className="stat-card"><div className="stat-icon blue"><FiDollarSign /></div><div className="stat-value" style={{ color: dayFlow.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatRupiah(dayFlow.balance)}</div><div className="stat-label">Saldo Kas</div></div>
                <div className="stat-card"><div className="stat-icon yellow"><FiFileText /></div><div className="stat-value">{formatRupiah(totalReceivable)}</div><div className="stat-label">Total Piutang</div></div>
            </div>

            <div className="dashboard-grid">
                {/* Income Breakdown */}
                <div className="card">
                    <div className="card-header"><h3><FiFileText /> Pemasukan</h3></div>
                    <div className="card-body">
                        {dayFlow.salesIncome > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                <span>Laba Kotor Penjualan Kasir</span>
                                <strong style={{ color: 'var(--success)' }}>{formatRupiah(dayFlow.salesIncome)}</strong>
                            </div>
                        )}
                        {incomeBreakdown.length === 0 && dayFlow.salesIncome === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Belum ada pemasukan</div>
                        ) : (
                            incomeBreakdown.map(([cat, amount]) => (
                                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                    <span>{cat}</span>
                                    <strong style={{ color: 'var(--success)' }}>{formatRupiah(amount)}</strong>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Expenses */}
                <div className="card">
                    <div className="card-header"><h3><FiFileText /> Pengeluaran</h3></div>
                    <div className="card-body">
                        {dayFlow.items.filter(c => c.type === 'out').length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Belum ada pengeluaran</div>
                        ) : (
                            dayFlow.items.filter(c => c.type === 'out').map(c => (
                                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                    <div><div style={{ fontWeight: '600' }}>{c.category}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.description}</div></div>
                                    <strong style={{ color: 'var(--danger)' }}>-{formatRupiah(c.amount)}</strong>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Piutang */}
            {receivables.length > 0 && (
                <div className="card" style={{ marginTop: '16px' }}>
                    <div className="card-header"><h3><FiFileText /> Piutang</h3></div>
                    <div style={{ overflow: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>Customer</th><th>Jenis</th><th>Referensi</th><th>Jumlah</th></tr></thead>
                            <tbody>
                                {receivables.map((r, i) => (
                                    <tr key={i}><td>{r.name}</td><td><span className="badge badge-info">{r.type}</span></td><td>{r.ref}</td><td style={{ color: 'var(--danger)', fontWeight: '700' }}>{formatRupiah(r.amount)}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Expense Modal */}
            <Modal isOpen={expenseOpen} onClose={() => setExpenseOpen(false)} title={<><FiMinus /> Catat Pengeluaran</>}>
                <div className="form-group">
                    <label className="form-label">Kategori</label>
                    <select className="form-select" value={expCat} onChange={e => setExpCat(e.target.value)}>
                        {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Jumlah</label>
                    <input className="form-input" type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0" style={{ fontSize: '1.3rem', fontWeight: '700', textAlign: 'center' }} autoFocus />
                </div>
                <div className="form-group">
                    <label className="form-label">Keterangan</label>
                    <input className="form-input" value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Deskripsi pengeluaran" />
                </div>
                <button className="btn btn-danger btn-block" onClick={addExpense}><FiSave /> Simpan Pengeluaran</button>
            </Modal>
        </div>
    );
}
