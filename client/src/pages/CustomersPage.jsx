import { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import db from '../db';
import { formatRupiah, formatDate } from '../utils';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import { FiSettings, FiFile, FiUsers, FiPrinter, FiEdit, FiTrash2, FiPlus, FiSave, FiPackage, FiTool, FiDollarSign, FiFileText, FiSearch, FiClock, FiCheckCircle, FiAlertCircle, FiX, FiDownload, FiUpload, FiRefreshCw, FiCheck, FiTruck, FiCalendar, FiMessageCircle, FiHome, FiBriefcase, FiStar, FiBox, FiActivity, FiLayers, FiList, FiChevronRight, FiChevronDown, FiEye } from 'react-icons/fi';

const TYPES = [
    { id: 'walkin', icon: <FiHome />, text: 'Walk-in', color: 'badge-info' },
    { id: 'corporate', icon: <FiBriefcase />, text: 'Corporate', color: 'badge-purple' },
    { id: 'vip', icon: <FiStar />, text: 'VIP', color: 'badge-warning' },
    { id: 'service', icon: <FiTool />, text: 'Service', color: 'badge-primary' },
];

export default function CustomersPage() {
    const { showToast } = useToast();
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [formOpen, setFormOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ name: '', phone: '', address: '', type: 'walkin', company: '' });


    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data);
        } catch (error) {
            console.error('Failed to load customers');
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const refreshCustomers = fetchCustomers;

    const filtered = useMemo(() => {
        let items = customers;
        if (filterType !== 'all') items = items.filter(c => c.type === filterType);
        if (search) {
            const q = search.toLowerCase();
            items = items.filter(c => c.name.toLowerCase().includes(q) || c.phone?.includes(q) || c.company?.toLowerCase().includes(q));
        }
        return items;
    }, [customers, filterType, search]);

    const handleSave = async () => {
        if (!form.name) { showToast('Nama harus diisi!', 'warning'); return; }
        try {
            if (editing) {
                await api.put(`/customers/${editing.id}`, form);
                showToast('Pelanggan berhasil diupdate!', 'success');
            } else {
                await api.post('/customers', form);
                showToast('Pelanggan baru ditambahkan!', 'success');
            }
            refreshCustomers();
            setFormOpen(false);
        } catch (error) {
            showToast('Gagal menyimpan pelanggan', 'error');
        }
    };

    const openDetail = async (c) => {
        try {
            const res = await api.get(`/customers/${c.id}/history`);
            setSelected({
                ...c,
                transactions: res.data.transactions || [],
                printOrders: res.data.printOrders || [],
                serviceOrders: res.data.serviceOrders || []
            });
            setDetailOpen(true);
        } catch (error) {
            showToast('Gagal memuat riwayat transaksi', 'error');
        }
    };

    return (
        <div className="premium-page-wrapper">
            <div className="page-toolbar">
                <h2><FiUsers /> Data Pelanggan</h2>
                <div className="filter-group">
                    <div style={{ position: 'relative', width: '300px' }}>
                        <input className="form-input" placeholder="Cari nama, HP, perusahaan..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: '32px' }} />
                        <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                    <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="all">Semua Tipe</option>
                        {TYPES.map(t => <option key={t.id} value={t.id}>{t.text}</option>)}
                    </select>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', phone: '', address: '', type: 'walkin', company: '' }); setFormOpen(true); }}><FiPlus /> Tambah Pelanggan</button>
            </div>

            <div className="card">
                <div style={{ overflow: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Nama</th><th>No HP</th><th>Tipe</th><th>Perusahaan</th><th>Total TRX</th><th>Total Spend</th><th>Aksi</th></tr></thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c.id}>
                                    <td><strong>{c.name}</strong></td>
                                    <td>{c.phone || '-'}</td>
                                    <td><span className={`badge ${TYPES.find(t => t.id === c.type)?.color || 'badge-info'}`}>{TYPES.find(t => t.id === c.type)?.icon} {TYPES.find(t => t.id === c.type)?.text || c.type}</span></td>
                                    <td>{c.company || '-'}</td>
                                    <td>{c.totalTrx || 0}x</td>
                                    <td style={{ color: 'var(--primary)', fontWeight: '600' }}>{formatRupiah(c.totalSpend || 0)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => openDetail(c)}><FiEye /></button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(c); setForm(c); setFormOpen(true); }}><FiEdit /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Form */}
            <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? <><FiEdit /> Edit Pelanggan</> : <><FiPlus /> Pelanggan Baru</>}>
                <div className="form-group"><label className="form-label">Nama</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">No HP</label><input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Alamat</label><textarea className="form-textarea" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Tipe</label>
                        <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                            {TYPES.map(t => <option key={t.id} value={t.id}>{t.text}</option>)}
                        </select>
                    </div>
                    <div className="form-group"><label className="form-label">Perusahaan/Instansi</label><input className="form-input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
                </div>
                <button className="btn btn-primary btn-block" onClick={handleSave}><FiSave /> Simpan</button>
            </Modal>

            {/* Detail */}
            <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={<><FiUsers /> {selected?.name || ''}</>} size="lg">
                {selected && (
                    <div>
                        <div className="form-row">
                            <div><label className="form-label">No HP</label><p>{selected.phone || '-'}</p></div>
                            <div><label className="form-label">Tipe</label><p><span className={`badge ${TYPES.find(t => t.id === selected.type)?.color}`}>{TYPES.find(t => t.id === selected.type)?.icon} {TYPES.find(t => t.id === selected.type)?.text}</span></p></div>
                        </div>
                        <div><label className="form-label">Alamat</label><p>{selected.address || '-'}</p></div>
                        <div className="stats-grid" style={{ margin: '16px 0' }}>
                            <div className="stat-card"><div className="stat-value">{selected.totalTrx || 0}</div><div className="stat-label">Total Transaksi</div></div>
                            <div className="stat-card"><div className="stat-value">{formatRupiah(selected.totalSpend || 0)}</div><div className="stat-label">Total Belanja</div></div>
                        </div>
                        {selected.transactions?.length > 0 && (
                            <div>
                                <label className="form-label">Riwayat Transaksi</label>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead><tr><th>Tanggal</th><th>Invoice</th><th>Total</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {selected.transactions.slice(0, 10).map(t => (
                                                <tr key={t.id}><td>{formatDate(t.date)}</td><td>{t.invoiceNo}</td><td>{formatRupiah(t.total)}</td><td><span className={`badge ${t.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{t.status === 'paid' ? 'Lunas' : 'Belum'}</span></td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
