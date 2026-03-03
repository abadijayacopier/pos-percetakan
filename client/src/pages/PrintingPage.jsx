import { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import db from '../db';
import { formatRupiah, generateOrderNo, formatDate, generateOrderReceipt } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';

const STATUS_COLUMNS = [
    { id: 'pending', label: '📋 Antrean Baru', color: 'var(--danger)' },
    { id: 'desain', label: '🎨 Desain', color: 'var(--warning)' },
    { id: 'approval', label: '✅ Approval', color: 'var(--info)' },
    { id: 'cetak', label: '🖨️ Cetak', color: 'var(--primary)' },
    { id: 'selesai', label: '✅ Selesai', color: 'var(--success)' },
    { id: 'diambil', label: '📦 Diambil', color: 'var(--text-muted)' },
    { id: 'batal', label: '❌ Batal', color: 'var(--danger)' }
];

const JENIS_CETAK = ['Undangan Pernikahan', 'Spanduk / Banner', 'Kartu Nama', 'Brosur / Flyer', 'Nota / Kwitansi', 'Stiker', 'ID Card', 'Sertifikat', 'Custom Lainnya'];

export default function PrintingPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [viewMode, setViewMode] = useState('kanban');
    const [formOpen, setFormOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [storeInfo, setStoreInfo] = useState({ name: 'FOTOCOPY ABADI JAYA', address: '', phone: '', footer: 'Terima Kasih!' });


    const fetchOrders = async () => {
        try {
            const res = await api.get('/print-orders');
            setOrders(res.data);
        } catch (error) {
            console.error('Failed to load print orders');
        }
    };

    useEffect(() => {
        fetchOrders();
        // Coba load customer dari API
        api.get('/customers').then(res => setCustomers(res.data)).catch(() => { });

        // Load Settings for Printer & Store Info
        const settingsList = db.getAll('settings');
        const getSet = (k) => settingsList.find(s => s.key === k)?.value || '';
        setStoreInfo({
            name: getSet('store_name') || 'FOTOCOPY ABADI JAYA',
            address: getSet('store_address') || '',
            phone: getSet('store_phone') || '',
            footer: getSet('receipt_footer') || 'Terima kasih telah memesan!'
        });
    }, []);

    const refreshOrders = fetchOrders;

    const [form, setForm] = useState({
        customerId: '', customerName: '', phone: '', type: 'Undangan Pernikahan',
        description: '', specs: '', qty: '', unit: 'lembar', totalPrice: '', dpAmount: '',
        shippingCost: 0, deadline: '', notes: '', panjang: '', lebar: '', hargaMeter: ''
    });

    const [isCustomUnit, setIsCustomUnit] = useState(false);

    const handleSubmit = async () => {
        if (!form.customerName || !form.qty || !form.totalPrice) {
            showToast('Lengkapi data order!', 'warning'); return;
        }

        const total = parseInt(form.totalPrice) || 0;
        const dp = parseInt(form.dpAmount) || 0;
        const shipping = parseInt(form.shippingCost) || 0;
        const grandTotal = total + shipping;

        const orderData = {
            orderNo: generateOrderNo('ORD'), ...form,
            qty: parseInt(form.qty), totalPrice: grandTotal, dpAmount: dp,
            remaining: grandTotal - dp, shippingCost: shipping,
            status: 'pending', createdAt: new Date().toISOString()
        };

        try {
            await api.post('/print-orders', orderData);
            refreshOrders();
            setFormOpen(false);
            setForm({ customerId: '', customerName: '', phone: '', type: 'Undangan Pernikahan', description: '', specs: '', qty: '', unit: 'lembar', totalPrice: '', dpAmount: '', shippingCost: 0, deadline: '', notes: '', panjang: '', lebar: '', hargaMeter: '' });
            setIsCustomUnit(false);
            showToast(`Order ${orderData.orderNo} berhasil dibuat!`, 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal menyimpan pesanan', 'error');
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            await api.patch(`/print-orders/${orderId}/status`, { status: newStatus });
            refreshOrders();
            showToast(`Status diupdate ke: ${newStatus}`, 'success');
        } catch (error) {
            showToast('Gagal update status', 'error');
        }
    };

    const openDetail = (order) => { setSelectedOrder(order); setDetailOpen(true); };

    // ----- WHATSAPP SENDER -----
    const sendWaOrder = () => {
        if (!selectedOrder) return;
        let p = selectedOrder.phone || selectedOrder.customerPhone;
        if (!p) {
            p = prompt("Masukkan nomor WhatsApp pelanggan (misal: 0812... dsb):");
            if (!p) return;
        }

        if (p.startsWith('0')) p = '62' + p.substring(1);
        else if (p.startsWith('+62')) p = p.substring(1);

        let text = `*${storeInfo.name}*\n`;
        text += `${storeInfo.address}\n\n`;
        text += `No Order: ${selectedOrder.orderNo}\n`;
        text += `Status: *${selectedOrder.status.toUpperCase()}*\n`;
        text += `--------------------------------\n`;
        text += `Pesanan: ${selectedOrder.type}\n`;
        text += `Jumlah: ${selectedOrder.qty} ${selectedOrder.unit}\n`;
        text += `Deadline: ${formatDate(selectedOrder.deadline)}\n`;
        text += `--------------------------------\n`;
        text += `Total Biaya: ${formatRupiah(selectedOrder.totalPrice)}\n`;
        text += `Sudah Dibayar (DP): ${formatRupiah(selectedOrder.dpAmount)}\n`;
        text += `Sisa Tagihan: *${formatRupiah(selectedOrder.remaining)}*\n\n`;
        text += `${storeInfo.footer}`;

        window.open(`https://wa.me/${p}?text=${encodeURIComponent(text)}`, '_blank');
    };

    // ----- DIRECT PRINT SENDER -----
    const handlePrint = async () => {
        if (!selectedOrder) return;
        const printerName = db.getAll('settings').find(s => s.key === 'printer_name')?.value;
        if (printerName) {
            try {
                const text = generateOrderReceipt(selectedOrder, storeInfo);
                await api.post('/print/receipt', { text, printerName });
                showToast(`Tagihan dicetak ke ${printerName}!`, 'success');
            } catch (err) {
                console.error(err);
                showToast(err.response?.data?.message || 'Gagal mengirim instruksi cetak', 'error');
            }
        } else {
            window.print();
        }
    };

    return (
        <div className="premium-page-wrapper">
            <div className="page-toolbar">
                <h2>🖨️ Order Percetakan</h2>
                <div className="toolbar-actions">
                    <div className="tabs" style={{ border: 'none' }}>
                        <button className={`tab-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>📋 Kanban</button>
                        <button className={`tab-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>📄 List</button>
                    </div>
                    <button className="btn btn-primary" onClick={() => setFormOpen(true)}>➕ Order Baru</button>
                </div>
            </div>

            {viewMode === 'kanban' ? (
                <div className="kanban-board">
                    {STATUS_COLUMNS.map(col => {
                        const colOrders = orders.filter(o => o.status === col.id);
                        return (
                            <div className="kanban-column" key={col.id}>
                                <div className="kanban-column-header">
                                    <h4>{col.label}</h4>
                                    <span className="kanban-count">{colOrders.length}</span>
                                </div>
                                <div className="kanban-cards">
                                    {colOrders.map(o => (
                                        <div key={o.id} className="kanban-card" onClick={() => openDetail(o)}>
                                            <div className="card-order-no">{o.orderNo}</div>
                                            <div className="card-title">{o.type}</div>
                                            <div className="card-customer">👤 {o.customerName}</div>
                                            {o.shippingCost > 0 && <div style={{ fontSize: '0.7rem', color: 'var(--info)' }}>🚚 Ongkir: {formatRupiah(o.shippingCost)}</div>}
                                            <div className="card-footer">
                                                <span>{formatRupiah(o.totalPrice)}</span>
                                                <span>📅 {o.deadline}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card">
                    <div style={{ overflow: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>No Order</th><th>Customer</th><th>Jenis</th><th>Total</th><th>Ongkir</th><th>DP</th><th>Sisa</th><th>Deadline</th><th>Status</th><th>Aksi</th></tr></thead>
                            <tbody>
                                {orders.map(o => (
                                    <tr key={o.id}>
                                        <td><strong>{o.orderNo}</strong></td>
                                        <td>{o.customerName}</td>
                                        <td>{o.type}</td>
                                        <td>{formatRupiah(o.totalPrice)}</td>
                                        <td>{o.shippingCost > 0 ? formatRupiah(o.shippingCost) : '-'}</td>
                                        <td>{formatRupiah(o.dpAmount)}</td>
                                        <td style={{ color: o.remaining > 0 ? 'var(--danger)' : 'var(--success)' }}>{formatRupiah(o.remaining)}</td>
                                        <td>{o.deadline}</td>
                                        <td><span className={`badge badge-${o.status === 'selesai' || o.status === 'diambil' ? 'success' : o.status === 'pending' ? 'danger' : 'warning'}`}>{o.status}</span></td>
                                        <td><button className="btn btn-ghost btn-sm" onClick={() => openDetail(o)}>👁️</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Form Modal */}
            <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title="🖨️ Order Percetakan Baru" size="lg">
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Customer</label>
                        <select className="form-select" value={form.customerId} onChange={e => {
                            const c = customers.find(c => c.id === e.target.value);
                            setForm(f => ({ ...f, customerId: e.target.value, customerName: c?.name || '', phone: c?.phone || '' }));
                        }}>
                            <option value="">-- Pilih atau isi manual --</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nama Customer</label>
                        <input className="form-input" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Jenis Cetakan</label>
                        <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                            {JENIS_CETAK.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Deskripsi</label>
                        <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Deskripsi singkat" />
                    </div>
                </div>

                {form.type === 'Spanduk / Banner' && (
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Panjang (Meter)</label>
                            <input className="form-input" type="number" step="0.1" value={form.panjang} onChange={e => {
                                const p = parseFloat(e.target.value) || 0;
                                const l = parseFloat(form.lebar) || 0;
                                const hm = parseFloat(form.hargaMeter) || 0;
                                let luas = p * l;
                                let total = luas * hm;
                                setForm(f => ({ ...f, panjang: e.target.value, qty: luas > 0 ? luas.toString() : '', unit: 'meter', specs: `Panjang ${e.target.value}m x Lebar ${f.lebar || 0}m`, totalPrice: total > 0 ? total.toString() : '' }));
                            }} placeholder="Contoh: 2.0" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Lebar (Meter)</label>
                            <input className="form-input" type="number" step="0.1" value={form.lebar} onChange={e => {
                                const l = parseFloat(e.target.value) || 0;
                                const p = parseFloat(form.panjang) || 0;
                                const hm = parseFloat(form.hargaMeter) || 0;
                                let luas = p * l;
                                let total = luas * hm;
                                setForm(f => ({ ...f, lebar: e.target.value, qty: luas > 0 ? luas.toString() : '', unit: 'meter', specs: `Panjang ${f.panjang || 0}m x Lebar ${e.target.value}m`, totalPrice: total > 0 ? total.toString() : '' }));
                            }} placeholder="Contoh: 1.5" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Harga per Meter</label>
                            <input className="form-input" type="number" value={form.hargaMeter} onChange={e => {
                                const hm = parseFloat(e.target.value) || 0;
                                const p = parseFloat(form.panjang) || 0;
                                const l = parseFloat(form.lebar) || 0;
                                let luas = p * l;
                                let total = luas * hm;
                                setForm(f => ({ ...f, hargaMeter: e.target.value, totalPrice: total > 0 ? total.toString() : '' }));
                            }} placeholder="Rp" />
                        </div>
                    </div>
                )}

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Spesifikasi (Ukuran, Bahan, Finishing)</label>
                        <input className="form-input" value={form.specs} onChange={e => setForm(f => ({ ...f, specs: e.target.value }))} placeholder="A5, Art Paper 260gsm, Laminasi Doff" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Jumlah</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input className="form-input" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="500" />
                            {isCustomUnit ? (
                                <input className="form-input" placeholder="Ketik satuan..." style={{ width: '120px' }} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} autoFocus />
                            ) : (
                                <select className="form-select" value={form.unit} onChange={e => {
                                    if (e.target.value === 'custom') {
                                        setIsCustomUnit(true);
                                        setForm(f => ({ ...f, unit: '' }));
                                    } else {
                                        setForm(f => ({ ...f, unit: e.target.value }));
                                    }
                                }} style={{ width: '120px' }}>
                                    <option value="lembar">lembar</option>
                                    <option value="pcs">pcs</option>
                                    <option value="set">set</option>
                                    <option value="box">box</option>
                                    <option value="meter">meter</option>
                                    <option value="custom">➕ Ketik Manual</option>
                                </select>
                            )}
                        </div>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Harga Total</label>
                        <input className="form-input" type="number" value={form.totalPrice} onChange={e => setForm(f => ({ ...f, totalPrice: e.target.value }))} placeholder="1500000" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">🚚 Biaya Ongkir</label>
                        <input className="form-input" type="number" value={form.shippingCost} onChange={e => setForm(f => ({ ...f, shippingCost: e.target.value }))} placeholder="0" />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Bayar DP</label>
                        <input className="form-input" type="number" value={form.dpAmount} onChange={e => setForm(f => ({ ...f, dpAmount: e.target.value }))} placeholder="750000" />
                        {form.totalPrice && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Min 50%: {formatRupiah(Math.ceil((parseInt(form.totalPrice) + parseInt(form.shippingCost || 0)) / 2))}</div>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Deadline</label>
                        <input className="form-input" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Catatan</label>
                    <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Catatan tambahan..." />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setFormOpen(false)}>❌ Batal</button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>💾 Simpan Order</button>
                </div>
            </Modal>

            {/* Detail Modal */}
            <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={`Detail Order ${selectedOrder?.orderNo || ''}`} size="lg">
                {selectedOrder && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px dashed var(--border)' }}>
                            {storeInfo.logo && <img src={storeInfo.logo} alt="Logo Toko" style={{ maxHeight: '70px', width: 'auto', marginBottom: '8px', objectFit: 'contain' }} />}
                            <h3 style={{ margin: '0 0 4px 0' }}>{storeInfo.name}</h3>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{storeInfo.address} | Telp: {storeInfo.phone}</div>
                        </div>
                        <div className="form-row">
                            <div><label className="form-label">Customer</label><p>{selectedOrder.customerName}</p></div>
                            <div><label className="form-label">Jenis</label><p>{selectedOrder.type}</p></div>
                        </div>
                        <div className="form-row">
                            <div><label className="form-label">Deskripsi</label><p>{selectedOrder.description || '-'}</p></div>
                            <div><label className="form-label">Spesifikasi</label><p>{selectedOrder.specs || '-'}</p></div>
                        </div>
                        <div className="form-row">
                            <div><label className="form-label">Jumlah</label><p>{selectedOrder.qty} {selectedOrder.unit}</p></div>
                            <div><label className="form-label">Deadline</label><p>📅 {selectedOrder.deadline}</p></div>
                        </div>
                        <div className="form-row">
                            <div><label className="form-label">Total</label><p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{formatRupiah(selectedOrder.totalPrice)}</p></div>
                            <div><label className="form-label">🚚 Ongkir</label><p>{formatRupiah(selectedOrder.shippingCost || 0)}</p></div>
                        </div>
                        <div className="form-row">
                            <div><label className="form-label">DP</label><p style={{ color: 'var(--success)' }}>{formatRupiah(selectedOrder.dpAmount)}</p></div>
                            <div><label className="form-label">Sisa</label><p style={{ color: selectedOrder.remaining > 0 ? 'var(--danger)' : 'var(--success)' }}>{formatRupiah(selectedOrder.remaining)}</p></div>
                        </div>
                        {selectedOrder.notes && <div><label className="form-label">Catatan</label><p>{selectedOrder.notes}</p></div>}

                        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                            <label className="form-label">Update Status</label>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {STATUS_COLUMNS.map(s => (
                                    <button key={s.id} className={`btn btn-sm ${selectedOrder.status === s.id ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => { updateStatus(selectedOrder.id, s.id); setSelectedOrder({ ...selectedOrder, status: s.id }); }}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }} className="no-print">
                            <button className="btn btn-danger" onClick={() => setDetailOpen(false)}>
                                ❌ Tutup
                            </button>
                            <button className="btn btn-primary" style={{ background: '#25D366', color: 'white' }} onClick={sendWaOrder}>
                                💬 Kirim Tagihan / Update via WA
                            </button>
                            <button className="btn btn-secondary" onClick={handlePrint}>
                                🖨️ Cetak Invoice
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
