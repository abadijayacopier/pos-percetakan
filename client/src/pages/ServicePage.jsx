import { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import { formatRupiah, generateOrderNo } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import { FiSettings, FiFile, FiUsers, FiPrinter, FiEdit, FiTrash2, FiPlus, FiSave, FiPackage, FiTool, FiDollarSign, FiFileText, FiSearch, FiClock, FiCheckCircle, FiAlertCircle, FiX, FiDownload, FiUpload, FiRefreshCw, FiCheck, FiTruck, FiCalendar, FiMessageCircle, FiHome, FiBriefcase, FiStar, FiBox, FiActivity, FiLayers, FiList, FiChevronRight, FiChevronDown, FiEye } from 'react-icons/fi';

const STATUS_LIST = [
    { id: 'diterima', label: <><FiDownload /> Diterima</> },
    { id: 'diagnosa', label: <><FiSearch /> Diagnosa</> },
    { id: 'approval', label: <><FiCheck /> Approval</> },
    { id: 'tunggu_part', label: <><FiPackage /> Tunggu Part</> },
    { id: 'pengerjaan', label: <><FiTool /> Pengerjaan</> },
    { id: 'testing', label: <><FiActivity /> Testing</> },
    { id: 'selesai', label: <><FiCheck /> Selesai</> },
    { id: 'diambil', label: <><FiPackage /> Diambil</> },
    { id: 'batal', label: <><FiX /> Batal</> }
];

export default function ServicePage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [formOpen, setFormOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [viewMode, setViewMode] = useState('kanban');
    const [customers, setCustomers] = useState([]);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/service-orders');
            setOrders(res.data);
        } catch (error) {
            console.error('Failed fetching service orders', error);
        }
    };

    useEffect(() => {
        fetchOrders();
        api.get('/customers').then(res => setCustomers(res.data)).catch(() => { });
    }, []);

    const refreshOrders = fetchOrders;

    const [form, setForm] = useState({
        customerId: '', customerName: '', phone: '', machineInfo: '', serialNo: '',
        complaint: '', condition: '', diagnosis: '', laborCost: '',
        spareparts: [{ name: '', qty: 1, price: '' }]
    });

    const handleUpdateDetail = async () => {
        try {
            await api.put(`/service-orders/${selected.id}`, {
                diagnosis: selected.diagnosis,
                laborCost: selected.laborCost,
                status: selected.status,
                warrantyEnd: selected.warrantyEnd,
                spareparts: selected.spareparts
            });
            refreshOrders();
            setDetailOpen(false);
            showToast('Detail service berhasil diperbarui!', 'success');
        } catch (error) {
            showToast('Gagal memperbarui service', 'error');
        }
    };

    const handlePay = async () => {
        try {
            await api.post(`/service-orders/${selected.id}/pay`, {
                serviceNo: selected.serviceNo,
                totalCost: selected.totalCost
            });
            refreshOrders();
            setDetailOpen(false);
            showToast('Pembayaran service selesai diproses!', 'success');
        } catch (error) {
            showToast('Gagal memproses pembayaran', 'error');
        }
    };
    const addSparepart = () => setForm(f => ({ ...f, spareparts: [...f.spareparts, { name: '', qty: 1, price: '' }] }));
    const updateSparepart = (i, field, val) => {
        setForm(f => {
            const sp = [...f.spareparts];
            sp[i] = { ...sp[i], [field]: val };
            return { ...f, spareparts: sp };
        });
    };
    const removeSparepart = (i) => setForm(f => ({ ...f, spareparts: f.spareparts.filter((_, idx) => idx !== i) }));

    const sparepartTotal = form.spareparts.reduce((s, p) => s + (parseInt(p.price) || 0) * (parseInt(p.qty) || 0), 0);
    const totalCost = sparepartTotal + (parseInt(form.laborCost) || 0);

    const handleSubmit = async () => {
        if (!form.customerName || !form.machineInfo || !form.complaint) {
            showToast('Lengkapi data service!', 'warning'); return;
        }

        try {
            await api.post('/service-orders', {
                serviceNo: generateOrderNo('SRV'),
                ...form
            });
            refreshOrders();
            setFormOpen(false);
            setForm({ customerId: '', customerName: '', phone: '', machineInfo: '', serialNo: '', complaint: '', condition: '', diagnosis: '', laborCost: '', spareparts: [{ name: '', qty: 1, price: '' }] });
            showToast(`Service order berhasil dibuat!`, 'success');
        } catch (error) {
            showToast('Gagal menyimpan tiket', 'error');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/service-orders/${id}/status`, { status });
            refreshOrders();
            showToast(`Status diupdate: ${status}`, 'success');
        } catch (error) {
            showToast('Gagal update status', 'error');
        }
    };

    const loadDetail = async (orderInfo) => {
        try {
            const res = await api.get(`/service-orders/${orderInfo.id}`);
            setSelected(res.data);
            setDetailOpen(true);
        } catch (e) {
            showToast('Gagal memuat detail', 'error');
        }
    };

    const kanbanCols = [
        { statuses: ['diterima', 'diagnosa'], label: <><FiDownload /> Masuk & Diagnosa</>, color: 'var(--warning)' },
        { statuses: ['approval', 'tunggu_part'], label: <><FiClock /> Menunggu</>, color: 'var(--info)' },
        { statuses: ['pengerjaan', 'testing'], label: <><FiTool /> Proses</>, color: 'var(--primary)' },
        { statuses: ['selesai', 'diambil'], label: <><FiCheck /> Selesai</>, color: 'var(--success)' },
        { statuses: ['batal'], label: <><FiX /> Batal</>, color: 'var(--danger)' }
    ];

    return (
        <div className="premium-page-wrapper">
            <div className="page-toolbar">
                <h2><FiTool /> Service Mesin</h2>
                <div className="toolbar-actions">
                    <div className="tabs" style={{ border: 'none' }}>
                        <button className={`tab-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}><FiFileText /> Kanban</button>
                        <button className={`tab-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><FiFileText /> List</button>
                    </div>
                    <button className="btn btn-primary" onClick={() => setFormOpen(true)}><FiPlus /> Service Baru</button>
                </div>
            </div>

            {viewMode === 'kanban' ? (
                <div className="kanban-board">
                    {kanbanCols.map(col => {
                        const colOrders = orders.filter(o => col.statuses.includes(o.status));
                        return (
                            <div className="kanban-column" key={col.label}>
                                <div className="kanban-column-header">
                                    <h4>{col.label}</h4>
                                    <span className="kanban-count">{colOrders.length}</span>
                                </div>
                                <div className="kanban-cards">
                                    {colOrders.map(o => (
                                        <div key={o.id} className="kanban-card" onClick={() => loadDetail(o)}>
                                            <div className="card-order-no">{o.serviceNo}</div>
                                            <div className="card-title">{o.machineInfo}</div>
                                            <div className="card-customer"><FiUsers /> {o.customerName}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '4px 0' }}>{o.complaint}</div>
                                            <div className="card-footer">
                                                <span>{formatRupiah(o.totalCost)}</span>
                                                <span className={`badge badge-${col.statuses.indexOf(o.status) === 0 ? 'warning' : 'info'}`}>{o.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card"><div style={{ overflow: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>No</th><th>Customer</th><th>Mesin</th><th>Keluhan</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
                        <tbody>
                            {orders.map(o => (
                                <tr key={o.id}>
                                    <td><strong>{o.serviceNo}</strong></td>
                                    <td>{o.customerName}</td>
                                    <td>{o.machineInfo}</td>
                                    <td>{o.complaint}</td>
                                    <td>{formatRupiah(o.totalCost)}</td>
                                    <td><span className="badge badge-info">{o.status}</span></td>
                                    <td><button className="btn btn-ghost btn-sm" onClick={() => loadDetail(o)}><FiEye /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div></div>
            )}

            {/* Form Modal */}
            <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title="<FiTool /> Service Baru" size="lg">
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Nama Customer</label>
                        <input className="form-input" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">No. HP</label>
                        <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Merk/Model Mesin</label>
                        <input className="form-input" value={form.machineInfo} onChange={e => setForm(f => ({ ...f, machineInfo: e.target.value }))} placeholder="Canon IR 2520" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">No. Seri</label>
                        <input className="form-input" value={form.serialNo} onChange={e => setForm(f => ({ ...f, serialNo: e.target.value }))} />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Keluhan</label>
                    <textarea className="form-textarea" value={form.complaint} onChange={e => setForm(f => ({ ...f, complaint: e.target.value }))} placeholder="Paper jam, hasil bergaris..." />
                </div>
                <div className="form-group">
                    <label className="form-label">Kondisi Fisik</label>
                    <input className="form-input" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} placeholder="Cukup baik" />
                </div>
                <div className="form-group">
                    <label className="form-label">Diagnosa</label>
                    <textarea className="form-textarea" value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="Roller aus, drum scratch..." />
                </div>

                <label className="form-label">Sparepart</label>
                {form.spareparts.map((sp, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <input className="form-input" placeholder="Nama part" value={sp.name} onChange={e => updateSparepart(i, 'name', e.target.value)} style={{ flex: 2 }} />
                        <input className="form-input" type="number" placeholder="Qty" value={sp.qty} onChange={e => updateSparepart(i, 'qty', e.target.value)} style={{ width: '70px' }} />
                        <input className="form-input" type="number" placeholder="Harga" value={sp.price} onChange={e => updateSparepart(i, 'price', e.target.value)} style={{ flex: 1 }} />
                        <button className="btn btn-ghost btn-sm" onClick={() => removeSparepart(i)}><FiX /></button>
                    </div>
                ))}
                <button className="btn btn-secondary btn-sm" onClick={addSparepart} style={{ marginBottom: '12px' }}><FiPlus /> Tambah Part</button>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Sparepart</label>
                        <div style={{ fontWeight: '700' }}>{formatRupiah(sparepartTotal)}</div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Biaya Jasa</label>
                        <input className="form-input" type="number" value={form.laborCost} onChange={e => setForm(f => ({ ...f, laborCost: e.target.value }))} placeholder="250000" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Total Estimasi</label>
                        <div style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--primary)' }}>{formatRupiah(totalCost)}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setFormOpen(false)}><FiX /> Batal</button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit}><FiSave /> Simpan Service</button>
                </div>
            </Modal>

            {/* Detail Modal */}
            <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={`Detail ${selected?.serviceNo || ''}`} size="lg">
                {selected && (
                    <div>
                        <div className="form-row">
                            <div><label className="form-label">Customer</label><p>{selected.customerName} ({selected.phone})</p></div>
                            <div><label className="form-label">Mesin</label><p>{selected.machineInfo} — SN: {selected.serialNo}</p></div>
                        </div>
                        <div><label className="form-label">Keluhan</label><p>{selected.complaint}</p></div>
                        <div><label className="form-label">Diagnosa</label>
                            <textarea className="form-textarea" value={selected.diagnosis || ''} onChange={e => setSelected(s => ({ ...s, diagnosis: e.target.value }))} placeholder="Roller aus, drum scratch..." />
                        </div>

                        <div style={{ marginTop: '12px' }}>
                            <label className="form-label">Sparepart</label>
                            <table className="data-table">
                                <thead><tr><th>Part</th><th>Qty</th><th>Harga</th><th>Subtotal</th><th>Aksi</th></tr></thead>
                                <tbody>
                                    {(selected.spareparts || []).map((sp, i) => (
                                        <tr key={i}>
                                            <td><input className="form-input" value={sp.name} onChange={e => {
                                                const sps = [...selected.spareparts]; sps[i].name = e.target.value; setSelected({ ...selected, spareparts: sps });
                                            }} /></td>
                                            <td><input type="number" className="form-input" value={sp.qty} onChange={e => {
                                                const sps = [...selected.spareparts]; sps[i].qty = Number(e.target.value); setSelected({ ...selected, spareparts: sps });
                                            }} /></td>
                                            <td><input type="number" className="form-input" value={sp.price} onChange={e => {
                                                const sps = [...selected.spareparts]; sps[i].price = Number(e.target.value); setSelected({ ...selected, spareparts: sps });
                                            }} /></td>
                                            <td>{formatRupiah((sp.qty || 0) * (sp.price || 0))}</td>
                                            <td><button className="btn btn-ghost btn-sm" onClick={() => {
                                                setSelected({ ...selected, spareparts: selected.spareparts.filter((_, idx) => idx !== i) });
                                            }}><FiX /></button></td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan="5">
                                            <button className="btn btn-secondary btn-sm" onClick={() => setSelected({ ...selected, spareparts: [...(selected.spareparts || []), { name: '', qty: 1, price: 0 }] })}><FiPlus /> Tambah Part</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="form-row" style={{ marginTop: '12px' }}>
                            <div>
                                <label className="form-label">Biaya Jasa</label>
                                <input type="number" className="form-input" value={selected.laborCost || 0} onChange={e => setSelected(s => ({ ...s, laborCost: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <label className="form-label">Total Sementara</label>
                                <p style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--primary)' }}>
                                    {formatRupiah((selected.laborCost || 0) + (selected.spareparts || []).reduce((s, p) => s + (p.qty * p.price), 0))}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', margin: '12px 0' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDetailOpen(false)}><FiX /> Batal</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpdateDetail}><FiSave /> Simpan Detail & Kalkulasi</button>
                        </div>

                        <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                            <label className="form-label">Update Status</label>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {STATUS_LIST.map(s => (
                                    <button key={s.id} className={`btn btn-sm ${selected.status === s.id ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => { updateStatus(selected.id, s.id); setSelected({ ...selected, status: s.id }); }}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selected.status === 'selesai' && (
                            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                <button className="btn btn-success btn-block" onClick={handlePay} style={{ fontSize: '1.1rem', padding: '12px' }}>
                                    <FiCheck /> Proses Pelunasan (Diambil) - {formatRupiah(selected.totalCost)}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
