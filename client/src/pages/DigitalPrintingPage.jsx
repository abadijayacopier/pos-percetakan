import { useState, useEffect, useRef, useCallback } from 'react';
import { FiCheck } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const fmt = (n) => 'Rp ' + Math.floor(n || 0).toLocaleString('id-ID');
const pad = (n) => String(n).padStart(2, '0');
const hms = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

const KANBAN_COLS = [
    { id: 'menunggu', label: 'Menunggu', color: '#64748b', bg: '#f1f5f9' },
    { id: 'desain', label: 'Desain', color: '#d97706', bg: '#fef3c7' },
    { id: 'approval', label: 'Approval', color: '#7c3aed', bg: '#ede9fe' },
    { id: 'cetak', label: 'Cetak', color: '#2563eb', bg: '#dbeafe' },
    { id: 'finishing', label: 'Finishing', color: '#0891b2', bg: '#cffafe' },
    { id: 'siap_diambil', label: 'Siap Diambil', color: '#16a34a', bg: '#dcfce7' },
    { id: 'selesai', label: 'Selesai', color: '#10b981', bg: '#dcfce7' },
];

const STATUS_BADGE = {
    menunggu: { color: '#475569', bg: '#f1f5f9' },
    desain: { color: '#d97706', bg: '#fef3c7' },
    approval: { color: '#7c3aed', bg: '#ede9fe' },
    cetak: { color: '#2563eb', bg: '#dbeafe' },
    finishing: { color: '#0891b2', bg: '#cffafe' },
    siap_diambil: { color: '#16a34a', bg: '#dcfce7' },
    selesai: { color: '#15803d', bg: '#bbf7d0' },
    batal: { color: '#dc2626', bg: '#fee2e2' },
};

/* ─────────────────────────────────────────────────────────────────────────────
   TOAST MINI
───────────────────────────────────────────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    const bg = type === 'error' ? '#ef4444' : type === 'warn' ? '#f59e0b' : '#22c55e';
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            background: bg, color: '#fff', padding: '12px 20px',
            borderRadius: 12, fontWeight: 600, fontSize: '.85rem',
            boxShadow: '0 8px 24px rgba(0,0,0,.18)', maxWidth: 320,
            animation: 'dp-slideIn .25s ease',
        }}>{msg}</div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MODAL FORM ORDER BARU
───────────────────────────────────────────────────────────────────────────── */
const LAYANAN_LIST = [
    { id: 'digital_printing', label: 'Digital Printing (per m²)' },
    { id: 'offset', label: 'Offset / Cetak Offset (per lembar)' },
    { id: 'atk', label: 'ATK / Alat Tulis' },
    { id: 'jilid', label: 'Jilid / Binding' },
    { id: 'jasa_desain', label: 'Jasa Desain (manual)' },
    { id: 'lainnya', label: 'Lainnya' },
];

const emptyItem = () => ({
    _key: Date.now() + Math.random(),
    layanan: 'digital_printing',
    nama_item: '',
    material_id: '',
    ukuran_p: '',
    ukuran_l: '',
    quantity: 1,
    harga_satuan: '',
    subtotal: 0,
    catatan: '',
});

function FormOrderModal({ materials, onClose, onSaved, toast }) {
    const [form, setForm] = useState({
        customer_name: '', metode_pembayaran: 'tunai',
        dp_amount: 0, deadline: '', catatan: '',
    });
    const [items, setItems] = useState([emptyItem()]);
    const [saving, setSaving] = useState(false);

    // Hitung subtotal setiap item
    const recalc = (items) => items.map(it => {
        const p = parseFloat(it.ukuran_p) || 0;
        const l = parseFloat(it.ukuran_l) || 0;
        const perM2 = ['digital_printing', 'offset'].includes(it.layanan);
        const luas = perM2 ? p * l : 0;
        const qty = parseInt(it.quantity) || 1;
        const harga = parseInt(it.harga_satuan) || 0;
        const sub = perM2 ? Math.round(luas * harga * qty) : harga * qty;
        return { ...it, subtotal: sub };
    });

    const total = items.reduce((s, i) => s + (i.subtotal || 0), 0);

    const setItem = (key, field, val) => {
        setItems(prev => recalc(prev.map(i => i._key === key ? { ...i, [field]: val } : i)));
    };

    const setMaterial = (key, matId) => {
        const mat = materials.find(m => m.id === matId);
        setItems(prev => recalc(prev.map(i =>
            i._key === key
                ? { ...i, material_id: matId, harga_satuan: mat?.harga_jual || i.harga_satuan }
                : i
        )));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.customer_name.trim()) return toast('Nama pelanggan wajib diisi', 'warn');
        if (items.some(i => !i.nama_item.trim())) return toast('Nama item tidak boleh kosong', 'warn');

        setSaving(true);
        try {
            await api.post('/orders', {
                ...form,
                dp_amount: parseInt(form.dp_amount) || 0,
                items: items.map(({ _key, ...rest }) => rest),
            });
            toast(<>Order berhasil dibuat! <FiCheck /></>);
            onSaved();
        } catch (err) {
            toast(err.response?.data?.message || 'Gagal menyimpan order', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="dp-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="dp-modal">
                <div className="dp-modal-head">
                    <h3>Order Percetakan Baru</h3>
                    <button className="dp-modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit} className="dp-modal-body">

                    {/* Info order */}
                    <div className="dp-form-section">
                        <div className="dp-form-row">
                            <div className="dp-form-group">
                                <label className="dp-label">Nama Pelanggan *</label>
                                <input className="dp-input" placeholder="Umum / Nama pelanggan" value={form.customer_name}
                                    onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
                            </div>
                            <div className="dp-form-group">
                                <label className="dp-label">Deadline</label>
                                <input className="dp-input" type="date" value={form.deadline}
                                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                            </div>
                        </div>
                        <div className="dp-form-row">
                            <div className="dp-form-group">
                                <label className="dp-label">Metode Pembayaran</label>
                                <select className="dp-input" value={form.metode_pembayaran}
                                    onChange={e => setForm(f => ({ ...f, metode_pembayaran: e.target.value }))}>
                                    <option value="tunai">Tunai</option>
                                    <option value="transfer">Transfer Bank</option>
                                    <option value="qris">QRIS</option>
                                    <option value="hutang">Hutang / Tempo</option>
                                </select>
                            </div>
                            <div className="dp-form-group">
                                <label className="dp-label">Uang Muka / DP (Rp)</label>
                                <input className="dp-input" type="number" min="0" placeholder="0"
                                    value={form.dp_amount}
                                    onChange={e => setForm(f => ({ ...f, dp_amount: e.target.value }))} />
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="dp-items-head">
                        <span className="dp-items-title">📦 Item Pesanan</span>
                        <button type="button" className="dp-btn-add-item"
                            onClick={() => setItems(p => [...p, emptyItem()])}>
                            + Tambah Item
                        </button>
                    </div>

                    {items.map((it, idx) => {
                        const perM2 = ['digital_printing', 'offset'].includes(it.layanan);
                        return (
                            <div key={it._key} className="dp-item-card">
                                <div className="dp-item-num">#{idx + 1}</div>
                                {items.length > 1 && (
                                    <button type="button" className="dp-item-del"
                                        onClick={() => setItems(p => p.filter(i => i._key !== it._key))}>✕</button>
                                )}
                                <div className="dp-form-row">
                                    <div className="dp-form-group" style={{ flex: 2 }}>
                                        <label className="dp-label">Layanan</label>
                                        <select className="dp-input" value={it.layanan}
                                            onChange={e => setItem(it._key, 'layanan', e.target.value)}>
                                            {LAYANAN_LIST.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="dp-form-group" style={{ flex: 3 }}>
                                        <label className="dp-label">Nama / Deskripsi Item *</label>
                                        <input className="dp-input" placeholder="Banner Warung Makan, Stiker, dll."
                                            value={it.nama_item}
                                            onChange={e => setItem(it._key, 'nama_item', e.target.value)} />
                                    </div>
                                </div>
                                <div className="dp-form-row">
                                    <div className="dp-form-group" style={{ flex: 3 }}>
                                        <label className="dp-label">Bahan</label>
                                        <select className="dp-input" value={it.material_id}
                                            onChange={e => setMaterial(it._key, e.target.value)}>
                                            <option value="">-- Pilih bahan --</option>
                                            {materials.filter(m => m.is_active).map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.nama_bahan} ({fmt(m.harga_jual)}/{m.satuan})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {perM2 && <>
                                        <div className="dp-form-group">
                                            <label className="dp-label">Panjang (m)</label>
                                            <input className="dp-input" type="number" step="0.1" min="0" placeholder="3.0"
                                                value={it.ukuran_p}
                                                onChange={e => setItem(it._key, 'ukuran_p', e.target.value)} />
                                        </div>
                                        <div className="dp-form-group">
                                            <label className="dp-label">Lebar (m)</label>
                                            <input className="dp-input" type="number" step="0.1" min="0" placeholder="1.0"
                                                value={it.ukuran_l}
                                                onChange={e => setItem(it._key, 'ukuran_l', e.target.value)} />
                                        </div>
                                    </>}
                                    {!perM2 && (
                                        <div className="dp-form-group">
                                            <label className="dp-label">Quantity</label>
                                            <input className="dp-input" type="number" min="1" value={it.quantity}
                                                onChange={e => setItem(it._key, 'quantity', e.target.value)} />
                                        </div>
                                    )}
                                    <div className="dp-form-group">
                                        <label className="dp-label">Harga/satuan (Rp)</label>
                                        <input className="dp-input" type="number" min="0" placeholder="25000"
                                            value={it.harga_satuan}
                                            onChange={e => setItem(it._key, 'harga_satuan', e.target.value)} />
                                    </div>
                                </div>
                                <div className="dp-item-sub">
                                    {perM2 && <span>Luas: {((parseFloat(it.ukuran_p) || 0) * (parseFloat(it.ukuran_l) || 0)).toFixed(2)} m²</span>}
                                    <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#2563eb' }}>
                                        Subtotal: {fmt(it.subtotal)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Total & footer */}
                    <div className="dp-order-total">
                        <div>
                            <span className="dp-result-label">Total Pesanan</span>
                            <span className="dp-result-price">{fmt(total)}</span>
                        </div>
                        <div>
                            <span className="dp-result-label">Sisa Tagihan</span>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>
                                {fmt(Math.max(0, total - (parseInt(form.dp_amount) || 0)))}
                            </span>
                        </div>
                    </div>

                    <div className="dp-modal-footer">
                        <button type="button" className="dp-btn-secondary" onClick={onClose}>Batal</button>
                        <button type="submit" className="dp-btn-primary" disabled={saving}>
                            {saving ? '⏳ Menyimpan...' : '💾 Simpan Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TIMER DESAIN (terintegrasi DB)
───────────────────────────────────────────────────────────────────────────── */
function TimerDesain({ orders, toast }) {
    const { user } = useAuth();
    const [activeSession, setActiveSession] = useState(null); // { id, start_time, tarif_per_jam, item_name, order_number }
    const [seconds, setSeconds] = useState(0);
    const [running, setRunning] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState('');
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef(null);

    // Ambil sesi aktif dari server saat mount
    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/design-logs/active');
                if (res.data) {
                    const diff = Math.floor((Date.now() - new Date(res.data.start_time).getTime()) / 1000);
                    setActiveSession(res.data);
                    setSeconds(diff);
                    setRunning(true);
                }
            } catch { /* server mungkin tidak aktif */ }
            setLoading(false);
        })();
    }, []);

    // Tick
    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [running]);

    const biaya = (seconds / 3600) * (activeSession?.tarif_per_jam || 50000);

    // Flatten semua items dari semua order
    const allItems = orders.flatMap(o =>
        (o.items || []).map(i => ({
            ...i,
            order_number: o.order_number,
            display: `${o.order_number} — ${i.nama_item}`,
        }))
    ).filter(i => i.production_status !== 'selesai' && i.production_status !== 'batal');

    const handleStart = async () => {
        if (!selectedItemId) return toast('Pilih item order terlebih dahulu', 'warn');
        try {
            const res = await api.post('/design-logs/start', { order_item_id: selectedItemId });
            const item = allItems.find(i => i.id === selectedItemId);
            setActiveSession({ id: res.data.id, tarif_per_jam: res.data.tarif_per_jam, nama_item: item?.nama_item });
            setSeconds(0);
            setRunning(true);
            toast('Timer desain dimulai ▶');
        } catch (err) {
            toast(err.response?.data?.message || 'Gagal memulai timer', 'error');
        }
    };

    const handleStop = async () => {
        if (!activeSession) return;
        try {
            await api.patch(`/design-logs/${activeSession.id}/stop`);
            setRunning(false);
            setActiveSession(null);
            setSeconds(0);
            toast(<>Timer selesai. Biaya desain: {fmt(biaya)} <FiCheck /></>);
        } catch (err) {
            toast('Gagal menghentikan timer', 'error');
        }
    };

    const handlePause = async () => {
        if (!activeSession) return;
        try {
            await api.patch(`/design-logs/${activeSession.id}/pause`);
            setRunning(false);
            setActiveSession(null);
            toast('Timer dijeda ⏸');
        } catch (err) {
            // Fallback: pause lokal saja
            setRunning(false);
        }
    };

    return (
        <section className="dp-card dp-flex-col">
            <div className="dp-card-header">
                <h2 className="dp-section-title">
                    <span className="material-symbols-outlined dp-icon-orange">timer</span>
                    Timer Jasa Desain
                </h2>
                <div className="dp-status-active">
                    <span className={`dp-dot ${running ? 'dp-dot-green' : 'dp-dot-grey'}`}></span>
                    {loading ? 'MEMUAT...' : running ? 'AKTIF' : activeSession ? 'DIJEDA' : 'SIAP'}
                </div>
            </div>

            <div className="dp-timer-body">
                {!running && !activeSession && (
                    <div style={{ width: '100%', marginBottom: 16 }}>
                        <label className="dp-label">Pilih Item Order</label>
                        <select className="dp-input" value={selectedItemId}
                            onChange={e => setSelectedItemId(e.target.value)}>
                            <option value="">-- Pilih order item --</option>
                            {allItems.map(i => (
                                <option key={i.id} value={i.id}>{i.display}</option>
                            ))}
                        </select>
                    </div>
                )}

                {activeSession && (
                    <div style={{ width: '100%', marginBottom: 12, textAlign: 'center' }}>
                        <span style={{ fontSize: '.8rem', color: '#94a3b8', fontWeight: 600 }}>
                            ✏️ {activeSession.nama_item}
                        </span>
                    </div>
                )}

                <div className="dp-timer-digits">{hms(seconds)}</div>
                <p className="dp-timer-tarif">Tarif: {fmt(activeSession?.tarif_per_jam || 50000)} / Jam</p>

                <div className="dp-cost-box">
                    <div className="dp-cost-inner">
                        <span className="dp-cost-label">Biaya Desain Terkini</span>
                        <span className="dp-cost-value">{fmt(biaya)}</span>
                    </div>
                </div>

                <div className="dp-timer-actions">
                    {!running && !activeSession && (
                        <button className="dp-btn-start" onClick={handleStart}>
                            <span className="material-symbols-outlined">play_arrow</span>
                            Mulai
                        </button>
                    )}
                    {running && (<>
                        <button className="dp-btn-stop" onClick={handleStop}>
                            <span className="material-symbols-outlined">stop_circle</span>
                            Selesai
                        </button>
                        <button className="dp-btn-pause" onClick={handlePause}>
                            <span className="material-symbols-outlined">pause</span>
                            Jeda
                        </button>
                    </>)}
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   KANBAN BOARD
───────────────────────────────────────────────────────────────────────────── */

// Mapping: status saat ini → tombol aksi ke tahap berikutnya
const NEXT_STATUS = {
    menunggu:      { next: 'desain',        label: 'Mulai Desain',      icon: '🎨' },
    desain:        { next: 'approval',      label: 'Ajukan Approval',   icon: '📋' },
    approval:      { next: 'cetak',         label: 'Mulai Cetak',       icon: '🖨️' },
    cetak:         { next: 'finishing',      label: 'Mulai Finishing',   icon: '✂️' },
    finishing:     { next: 'siap_diambil',   label: 'Siap Diambil',     icon: '✅' },
    siap_diambil:  { next: 'selesai',       label: 'Selesai / Diambil', icon: '🏁' },
};

// Tombol batalkan (tersedia di semua tahap kecuali selesai)
const CANCEL_STATUS = { next: 'batal', label: 'Batalkan', icon: '✕' };

function KanbanBoard({ orders, onStatusChange, toast }) {
    const [loading, setLoading] = useState(null); // itemId yang sedang diproses

    // Flatten items dengan status produksi
    const allItems = orders.flatMap(o =>
        (o.items || []).map(i => ({
            ...i,
            order_number: o.order_number,
            customer_name: o.customer_name,
            deadline: o.deadline,
        }))
    );

    const handleAction = async (itemId, nextStatus, label) => {
        setLoading(itemId);
        try {
            await api.patch(`/orders/items/${itemId}/status`, { status: nextStatus });
            onStatusChange();
            toast(`${label} berhasil`);
        } catch {
            toast('Gagal mengubah status', 'error');
        }
        setLoading(null);
    };

    return (
        <section className="dp-card dp-no-padding">
            <div className="dp-table-header">
                <h2 className="dp-section-title">
                    <span className="material-symbols-outlined" style={{ color: '#7c3aed' }}>view_kanban</span>
                    Kanban Produksi
                </h2>
                <span style={{ fontSize: '.75rem', color: '#94a3b8' }}>Gunakan tombol aksi di setiap card</span>
            </div>
            <div className="dp-kanban-board">
                {KANBAN_COLS.map(col => {
                    const colItems = allItems.filter(i =>
                        (i.production_status || 'menunggu') === col.id
                    );
                    const nextAction = NEXT_STATUS[col.id];

                    return (
                        <div key={col.id} className="dp-kanban-col">
                            <div className="dp-kanban-col-head" style={{ borderColor: col.color }}>
                                <span style={{ color: col.color, fontWeight: 700, fontSize: '.78rem' }}>
                                    {col.label}
                                </span>
                                <span className="dp-kanban-count" style={{ background: col.bg, color: col.color }}>
                                    {colItems.length}
                                </span>
                            </div>
                            <div className="dp-kanban-cards">
                                {colItems.map(item => (
                                    <div key={item.id} className="dp-kanban-card">
                                        <div className="dp-kanban-card-order">{item.order_number}</div>
                                        <div className="dp-kanban-card-name">{item.nama_item}</div>
                                        <div className="dp-kanban-card-customer">👤 {item.customer_name}</div>
                                        {item.deadline && (
                                            <div className="dp-kanban-card-deadline">
                                                📅 {new Date(item.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                            </div>
                                        )}

                                        {/* Tombol aksi */}
                                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                            {nextAction && (
                                                <button
                                                    disabled={loading === item.id}
                                                    onClick={() => handleAction(item.id, nextAction.next, nextAction.label)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '5px 8px',
                                                        fontSize: '.7rem',
                                                        fontWeight: 700,
                                                        border: 'none',
                                                        borderRadius: 6,
                                                        cursor: loading === item.id ? 'wait' : 'pointer',
                                                        background: col.color,
                                                        color: '#fff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: 4,
                                                        opacity: loading === item.id ? 0.6 : 1,
                                                    }}
                                                >
                                                    <span style={{ fontSize: '.75rem' }}>{nextAction.icon}</span>
                                                    {loading === item.id ? 'Proses...' : nextAction.label}
                                                </button>
                                            )}
                                            <button
                                                disabled={loading === item.id}
                                                onClick={() => {
                                                    if (confirm(`Batalkan item "${item.nama_item}"?`)) {
                                                        handleAction(item.id, 'batal', 'Batalkan');
                                                    }
                                                }}
                                                style={{
                                                    padding: '5px 8px',
                                                    fontSize: '.65rem',
                                                    fontWeight: 600,
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 6,
                                                    cursor: 'pointer',
                                                    background: '#fff',
                                                    color: '#ef4444',
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {colItems.length === 0 && (
                                    <div className="dp-kanban-empty">Kosong</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DAFTAR PESANAN AKTIF (tabel)
───────────────────────────────────────────────────────────────────────────── */
function DaftarPesanan({ orders, onRefresh, onPay, toast }) {
    const handleBayar = async (order) => {
        const bayar = prompt(`Tambah pembayaran untuk ${order.order_number}\nSisa: ${fmt(order.remaining)}\nJumlah (Rp):`);
        if (!bayar || isNaN(bayar)) return;
        try {
            await api.patch(`/orders/${order.id}/status-bayar`, {
                bayar_tambahan: parseInt(bayar),
                metode_pembayaran: order.metode_pembayaran,
            });
            toast(<>Pembayaran berhasil dicatat <FiCheck /></>);
            onRefresh();
        } catch (err) {
            toast(err.response?.data?.message || 'Gagal mencatat pembayaran', 'error');
        }
    };

    const BAYAR_STATUS = {
        belum_bayar: { label: 'Belum Bayar', color: '#dc2626', bg: '#fee2e2' },
        dp: { label: 'DP', color: '#d97706', bg: '#fef3c7' },
        lunas: { label: 'Lunas', color: '#16a34a', bg: '#dcfce7' },
    };

    const PRODUKSI_STATUS = {
        menunggu:      { label: 'Menunggu',      color: '#475569', bg: '#f1f5f9' },
        desain:        { label: 'Desain',        color: '#d97706', bg: '#fef3c7' },
        approval:      { label: 'Approval',      color: '#7c3aed', bg: '#ede9fe' },
        cetak:         { label: 'Cetak',         color: '#2563eb', bg: '#dbeafe' },
        finishing:     { label: 'Finishing',      color: '#0891b2', bg: '#cffafe' },
        siap_diambil:  { label: 'Siap Diambil',  color: '#16a34a', bg: '#dcfce7' },
        selesai:       { label: 'Selesai',       color: '#15803d', bg: '#bbf7d0' },
        batal:         { label: 'Batal',         color: '#dc2626', bg: '#fee2e2' },
    };

    // Tentukan status produksi keseluruhan order dari item-itemnya
    const getOrderProduksiStatus = (order) => {
        const items = order.items || [];
        if (!items.length) return 'menunggu';
        const statuses = items.map(i => i.production_status || 'menunggu');
        // Jika semua selesai → selesai
        if (statuses.every(s => s === 'selesai')) return 'selesai';
        // Jika semua batal → batal
        if (statuses.every(s => s === 'batal')) return 'batal';
        // Jika ada campuran, ambil status paling "maju" dari item aktif (bukan batal/selesai)
        const PRIORITY = ['menunggu', 'desain', 'approval', 'cetak', 'finishing', 'siap_diambil', 'selesai'];
        const activeStatuses = statuses.filter(s => s !== 'batal');
        if (!activeStatuses.length) return 'batal';
        let highest = 0;
        for (const s of activeStatuses) {
            const idx = PRIORITY.indexOf(s);
            if (idx > highest) highest = idx;
        }
        return PRIORITY[highest];
    };

    return (
        <section className="dp-card dp-no-padding">
            <div className="dp-table-header">
                <h2 className="dp-section-title">
                    <span className="material-symbols-outlined dp-icon-green">pending_actions</span>
                    Daftar Pesanan
                </h2>
                <button className="dp-link-btn" onClick={onRefresh}>
                    <span className="material-symbols-outlined dp-icon-sm">refresh</span> Refresh
                </button>
            </div>
            <div className="dp-table-wrap">
                {orders.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 48 }}>inbox</span>
                        <p>Belum ada pesanan. Buat order baru!</p>
                    </div>
                ) : (
                    <table className="dp-table">
                        <thead>
                            <tr>
                                <th>No. Order</th>
                                <th>Pelanggan</th>
                                <th>Total</th>
                                <th>Biaya Desain</th>
                                <th>Bayar</th>
                                <th>Sisa</th>
                                <th>Status Bayar</th>
                                <th>Produksi</th>
                                <th>Deadline</th>
                                <th className="dp-th-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                {orders.map(o => {
                                const bs = BAYAR_STATUS[o.status_pembayaran] || BAYAR_STATUS.belum_bayar;
                                const prodStatus = getOrderProduksiStatus(o);
                                const ps = PRODUKSI_STATUS[prodStatus] || PRODUKSI_STATUS.menunggu;
                                return (
                                    <tr key={o.id} className="dp-tr">
                                        <td>
                                            <span style={{ fontWeight: 700, fontSize: '.85rem' }}>{o.order_number}</span>
                                            <br />
                                            <span style={{ fontSize: '.7rem', color: '#94a3b8' }}>{o.jumlah_item} item</span>
                                        </td>
                                        <td className="dp-td-customer">{o.customer_name}</td>
                                        <td style={{ fontWeight: 700 }}>{fmt(o.total_harga)}</td>
                                        <td style={{ fontWeight: 700 }}>{fmt(o.total_design_cost || 0)}</td>
                                        <td>{fmt(o.dp_amount)}</td>
                                        <td style={{ color: o.remaining > 0 ? '#ef4444' : '#16a34a', fontWeight: 600 }}>
                                            {fmt(o.remaining)}
                                        </td>
                                        <td>
                                            <span className="dp-status-badge" style={{ background: bs.bg, color: bs.color }}>
                                                {bs.label}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="dp-status-badge" style={{ background: ps.bg, color: ps.color }}>
                                                {ps.label}
                                            </span>
                                        </td>
                                        <td className="dp-td-deadline">
                                            {o.deadline ? new Date(o.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                        </td>
                                        <td className="dp-td-action">
                                        {o.status_pembayaran !== 'lunas' && (
                                            <button className="dp-action-btn" onClick={() => onPay(o)} title="Bayar" style={{ color: '#16a34a' }}>
                                                Bayar
                                            </button>
                                        )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}

// --- Payment modal for orders in Daftar Pesanan ---
function PaymentModal({ order, onClose, onPaid, toast }) {
  const [amount, setAmount] = useState(order?.remaining ?? 0);
  const [method, setMethod] = useState('tunai');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pay = parseInt(amount) || 0;
    if (pay <= 0) return;
    try {
      await api.patch(`/orders/${order.id}/status-bayar`, { bayar_tambahan: pay, metode_pembayaran: method });
      toast('Pembayaran berhasil dicatat');
      onPaid && onPaid();
      onClose && onClose();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal memproses pembayaran', 'error');
    }
  };

  return (
    <div className="dp-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dp-modal">
        <div className="dp-modal-head">
          <h3>Bayar Pesanan {order.order_number}</h3>
          <button className="dp-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="dp-modal-body">
          <div className="dp-form-row">
            <div className="dp-form-group" style={{ flex: 1 }}>
              <label className="dp-label">Jumlah Bayar (Rp)</label>
              <input className="dp-input" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="dp-form-group" style={{ width: 240 }}>
              <label className="dp-label">Metode Pembayaran</label>
              <select className="dp-input" value={method} onChange={e => setMethod(e.target.value)}>
                <option value="tunai">Tunai</option>
                <option value="transfer">Transfer</option>
                <option value="qris">QRIS</option>
                <option value="hutang">Hutang</option>
              </select>
            </div>
          </div>
          <div className="dp-modal-footer">
            <button type="button" className="dp-btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="dp-btn-primary">Bayar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   KALKULATOR BANNER (standalone, tanpa DB)
───────────────────────────────────────────────────────────────────────────── */
function KalkulatorBanner({ materials }) {
    const [panjang, setPanjang] = useState('');
    const [lebar, setLebar] = useState('');
    const [matId, setMatId] = useState('');

    const mat = materials.find(m => m.id === matId);
    const luas = (parseFloat(panjang) || 0) * (parseFloat(lebar) || 0);
    const total = luas * (mat?.harga_jual || 0);

    return (
        <section className="dp-card">
            <div className="dp-card-header">
                <h2 className="dp-section-title">
                    <span className="material-symbols-outlined dp-icon-primary">calculate</span>
                    Kalkulator Biaya Banner
                </h2>
                <span className="dp-badge">ESTIMASI</span>
            </div>
            <div className="dp-grid2 dp-mb4">
                <div>
                    <label className="dp-label">Panjang (m)</label>
                    <input className="dp-input" type="number" step="0.1" min="0" placeholder="3.0"
                        value={panjang} onChange={e => setPanjang(e.target.value)} />
                </div>
                <div>
                    <label className="dp-label">Lebar (m)</label>
                    <input className="dp-input" type="number" step="0.1" min="0" placeholder="1.0"
                        value={lebar} onChange={e => setLebar(e.target.value)} />
                </div>
            </div>
            <div className="dp-mb6">
                <label className="dp-label">Jenis Bahan</label>
                <select className="dp-input" value={matId} onChange={e => setMatId(e.target.value)}>
                    <option value="">-- Pilih bahan --</option>
                    {materials.filter(m => m.is_active && m.kategori === 'digital').map(m => (
                        <option key={m.id} value={m.id}>{m.nama_bahan} ({fmt(m.harga_jual)}/m²)</option>
                    ))}
                </select>
            </div>
            <div className="dp-result-bar">
                <div>
                    <p className="dp-result-label">Total Luas</p>
                    <p className="dp-result-value">{luas.toFixed(2)} m²</p>
                </div>
                <div className="dp-result-right">
                    <p className="dp-result-label">Total Biaya Cetak</p>
                    <p className="dp-result-price">{fmt(total)}</p>
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function DigitalPrintingPage() {
    const [orders, setOrders] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const [loadingOrders, setLoadingOrders] = useState(true);

    const toast = useCallback((msg, type = 'success') => {
        setToastMsg({ msg, type });
    }, []);

    const fetchOrders = useCallback(async () => {
        setLoadingOrders(true);
        try {
            // Ambil list order + detail items setiap order
            const { data: list } = await api.get('/orders');
            const detailed = await Promise.all(
                list.slice(0, 30).map(async o => {
                    try {
                        const { data } = await api.get(`/orders/${o.id}`);
                        return data;
                    } catch {
                        return { ...o, items: [] };
                    }
                })
            );
            setOrders(detailed);
        } catch {
            // Server tidak aktif — pakai data dummy
            setOrders([]);
        } finally {
            setLoadingOrders(false);
        }
    }, []);

    const fetchMaterials = useCallback(async () => {
        try {
            const { data } = await api.get('/materials');
            setMaterials(data);
        } catch {
            // Fallback ke default list
            setMaterials([
                { id: 'mat001', nama_bahan: 'Frontlite Standard 280gr', kategori: 'digital', satuan: 'm2', harga_jual: 25000, is_active: 1 },
                { id: 'mat002', nama_bahan: 'Frontlite High-Res 340gr', kategori: 'digital', satuan: 'm2', harga_jual: 35000, is_active: 1 },
                { id: 'mat003', nama_bahan: 'Albatros', kategori: 'digital', satuan: 'm2', harga_jual: 65000, is_active: 1 },
                { id: 'mat004', nama_bahan: 'Bannertrans / Backlite', kategori: 'digital', satuan: 'm2', harga_jual: 75000, is_active: 1 },
            ]);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        fetchMaterials();
    }, []);

    const handleOrderSaved = () => {
        setShowForm(false);
        fetchOrders();
    };

    // Payment actions will use a top-level state defined above (openPayment/closePayment)

    return (
        <div className="dp-page">
            {/* ── CSS ── */}
            <style>{CSS}</style>

            {/* ── Toast ── */}
            {toastMsg && <Toast {...toastMsg} onClose={() => setToastMsg(null)} />}

            {/* ── Modal Form Order ── */}
            {showForm && (
                <FormOrderModal
                    materials={materials}
                    onClose={() => setShowForm(false)}
                    onSaved={handleOrderSaved}
                    toast={toast}
                />
            )}

            {/* ── Header ── */}
            <div className="dp-page-topbar">
                <div>
                    <h1 className="dp-page-title">Digital Printing</h1>
                    <p className="dp-page-sub">Manajemen produksi cetak dan penghitungan biaya real-time.</p>
                </div>
                <button className="dp-btn-primary" style={{ width: 'auto', padding: '10px 22px' }}
                    onClick={() => setShowForm(true)}>
                    <span className="material-symbols-outlined">add</span>
                    Order Baru
                </button>
            </div>

            {/* ── Row 1: Kalkulator + Timer ── */}
            <div className="dp-two-cols">
                <KalkulatorBanner materials={materials} />
                <TimerDesain orders={orders} toast={toast} />
            </div>

            {/* ── Kanban Board ── */}
            {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 40, animation: 'dp-spin 1s linear infinite' }}>progress_activity</span>
                    <p>Memuat data pesanan...</p>
                </div>
            ) : (
                <>
                    <KanbanBoard orders={orders} onStatusChange={fetchOrders} toast={toast} />
                    <DaftarPesanan orders={orders} onRefresh={fetchOrders} onPay={openPayment} toast={toast} />
                    {paymentOpen && paymentOrder && (
                        <PaymentModal order={paymentOrder} onClose={closePayment} onPaid={() => { fetchOrders(); }} toast={toast} />
                    )}
                    {paymentOpen && paymentOrder && (
                        <PaymentModal order={paymentOrder} onClose={closePayment} onPaid={() => { fetchOrders(); }} toast={toast} />
                    )}
                </>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CSS (scoped via class prefix dp-)
───────────────────────────────────────────────────────────────────────────── */
const CSS = `
@keyframes dp-slideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
@keyframes dp-spin    { to { transform: rotate(360deg); } }

.dp-page { padding:28px 32px; display:flex; flex-direction:column; gap:28px; min-height:100%; }
.dp-page-topbar { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.dp-page-title  { font-size:1.4rem; font-weight:800; margin:0; letter-spacing:-.02em; }
.dp-page-sub    { color:#64748b; margin:4px 0 0; font-size:.875rem; }

/* Card */
.dp-card        { background:var(--card-bg,#fff); border:1px solid var(--border-color,#e2e8f0); border-radius:16px; padding:22px; box-shadow:0 1px 4px rgba(0,0,0,.05); }
.dp-card.dp-flex-col  { display:flex; flex-direction:column; }
.dp-card.dp-no-padding { padding:0; overflow:hidden; }
[data-theme="dark"] .dp-card { background:#0f172a; border-color:#1e293b; }

.dp-card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
.dp-section-title { display:flex; align-items:center; gap:8px; font-size:1rem; font-weight:700; margin:0; }

/* Badge */
.dp-badge { padding:3px 10px; background:#eff6ff; color:#2563eb; font-size:.68rem; font-weight:700; border-radius:9999px; }
[data-theme="dark"] .dp-badge { background:#1e3a5f; color:#93c5fd; }

/* Icons */
.dp-icon-primary { color:#2563eb; }
.dp-icon-orange  { color:#f97316; }
.dp-icon-green   { color:#22c55e; }
.dp-icon-sm      { font-size:16px !important; }

/* Form */
.dp-label { display:block; font-size:.78rem; font-weight:600; color:#475569; margin-bottom:5px; }
[data-theme="dark"] .dp-label { color:#94a3b8; }
.dp-input { width:100%; padding:8px 12px; border:1px solid #e2e8f0; border-radius:8px; font-size:.875rem; outline:none; box-sizing:border-box; transition:border-color .15s,box-shadow .15s; background:#fff; color:#0f172a; }
.dp-input:focus { border-color:#2563eb; box-shadow:0 0 0 3px #dbeafe; }
[data-theme="dark"] .dp-input { background:#1e293b; border-color:#334155; color:#f1f5f9; }
[data-theme="dark"] .dp-input:focus { box-shadow:0 0 0 3px rgba(37,99,235,.3); }
select.dp-input { appearance:auto; }

/* Spacing */
.dp-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.dp-mb4   { margin-bottom:14px; }
.dp-mb6   { margin-bottom:20px; }
.dp-mt4   { margin-top:14px; }

/* Result bar */
.dp-result-bar  { display:flex; align-items:center; justify-content:space-between; background:#f8fafc; border-radius:12px; padding:14px 18px; }
[data-theme="dark"] .dp-result-bar { background:#1e293b; }
.dp-result-label { font-size:.68rem; color:#94a3b8; font-weight:700; margin:0 0 3px; text-transform:uppercase; letter-spacing:.04em; }
.dp-result-value { font-size:1.1rem; font-weight:700; margin:0; }
.dp-result-right { text-align:right; }
.dp-result-price { font-size:1.5rem; font-weight:900; color:#2563eb; margin:0; }

/* Buttons */
.dp-btn-primary  { display:flex; align-items:center; justify-content:center; gap:7px; background:#2563eb; color:#fff; font-weight:700; font-size:.875rem; padding:11px; border-radius:10px; border:none; cursor:pointer; transition:background .15s,transform .1s; box-shadow:0 4px 14px rgba(37,99,235,.25); width:100%; }
.dp-btn-primary:hover  { background:#1d4ed8; }
.dp-btn-primary:disabled { opacity:.6; cursor:not-allowed; }
.dp-btn-secondary { display:flex; align-items:center; justify-content:center; gap:7px; background:#f1f5f9; color:#475569; font-weight:700; font-size:.875rem; padding:11px 20px; border-radius:10px; border:none; cursor:pointer; }
[data-theme="dark"] .dp-btn-secondary { background:#1e293b; color:#94a3b8; }

/* Timer */
.dp-status-active { display:flex; align-items:center; gap:6px; font-size:.7rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
.dp-dot           { width:8px; height:8px; border-radius:9999px; flex-shrink:0; }
.dp-dot-green     { background:#22c55e; animation:dp-pulse 1.5s ease-in-out infinite; }
.dp-dot-grey      { background:#94a3b8; }
@keyframes dp-pulse { 0%,100%{opacity:1}50%{opacity:.4} }

.dp-timer-body   { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:8px 0; gap:0; }
.dp-timer-digits { font-size:3.2rem; font-family:'Courier New',Courier,monospace; font-weight:900; letter-spacing:.1em; color:#0f172a; margin-bottom:4px; }
[data-theme="dark"] .dp-timer-digits { color:#f1f5f9; }
.dp-timer-tarif  { font-size:.78rem; color:#94a3b8; margin:0 0 18px; }
.dp-cost-box     { width:100%; border:1px solid #fed7aa; background:#fff7ed; border-radius:12px; padding:12px 16px; margin-bottom:18px; }
[data-theme="dark"] .dp-cost-box { background:rgba(234,88,12,.1); border-color:rgba(234,88,12,.2); }
.dp-cost-inner   { display:flex; align-items:center; justify-content:space-between; }
.dp-cost-label   { font-size:.82rem; font-weight:600; color:#c2410c; }
[data-theme="dark"] .dp-cost-label { color:#fb923c; }
.dp-cost-value   { font-size:1.2rem; font-weight:800; color:#ea580c; }
[data-theme="dark"] .dp-cost-value { color:#f97316; }
.dp-timer-actions { display:flex; gap:10px; width:100%; }
.dp-btn-stop,
.dp-btn-pause,
.dp-btn-start    { flex:1; display:flex; align-items:center; justify-content:center; gap:6px; font-weight:700; font-size:.82rem; padding:11px; border-radius:10px; border:none; cursor:pointer; transition:background .15s; }
.dp-btn-stop     { background:#ef4444; color:#fff; box-shadow:0 4px 12px rgba(239,68,68,.22); }
.dp-btn-stop:hover  { background:#dc2626; }
.dp-btn-pause    { background:#f1f5f9; color:#475569; }
[data-theme="dark"] .dp-btn-pause { background:#1e293b; color:#94a3b8; }
.dp-btn-start    { background:#22c55e; color:#fff; box-shadow:0 4px 12px rgba(34,197,94,.22); width:100%; }
.dp-btn-start:hover { background:#16a34a; }

/* Table */
.dp-table-header { display:flex; align-items:center; justify-content:space-between; padding:18px 22px; border-bottom:1px solid #f1f5f9; }
[data-theme="dark"] .dp-table-header { border-color:#1e293b; }
.dp-link-btn { display:flex; align-items:center; gap:4px; font-size:.78rem; font-weight:700; color:#2563eb; border:none; background:none; cursor:pointer; }
.dp-link-btn:hover { opacity:.8; }
.dp-table-wrap { overflow-x:auto; }
.dp-table { width:100%; border-collapse:collapse; text-align:left; }
.dp-table thead tr { background:#f8fafc; }
[data-theme="dark"] .dp-table thead tr { background:#1e293b; }
.dp-table th { padding:11px 20px; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#94a3b8; white-space:nowrap; }
.dp-th-right { text-align:right; }
.dp-tr { border-top:1px solid #f1f5f9; transition:background .1s; }
[data-theme="dark"] .dp-tr { border-color:#1e293b; }
.dp-tr:hover { background:#f8fafc; }
[data-theme="dark"] .dp-tr:hover { background:#1e293b; }
.dp-table td { padding:12px 20px; vertical-align:middle; }
.dp-td-customer { font-size:.83rem; font-weight:600; }
.dp-td-deadline { font-size:.82rem; color:#94a3b8; }
.dp-td-action   { text-align:right; }
.dp-action-btn  { background:none; border:none; cursor:pointer; color:#94a3b8; transition:color .12s; display:inline-flex; align-items:center; padding:4px; border-radius:6px; }
.dp-action-btn:hover { color:#2563eb; background:#eff6ff; }
.dp-status-badge { padding:4px 10px; font-size:.68rem; font-weight:700; border-radius:9999px; white-space:nowrap; letter-spacing:.04em; }

/* Two-column layout */
.dp-two-cols { display:grid; grid-template-columns:1fr 1fr; gap:28px; }
@media (max-width:900px) { .dp-two-cols { grid-template-columns:1fr; } }

/* Kanban */
.dp-kanban-board { overflow-x:auto; display:flex; gap:12px; padding:0 18px 18px; }
.dp-kanban-col   { min-width:190px; flex:1; display:flex; flex-direction:column; gap:8px; }
.dp-kanban-col-head { display:flex; align-items:center; justify-content:space-between; padding:8px 10px; border-left:3px solid; border-radius:0 8px 8px 0; background:#f8fafc; }
[data-theme="dark"] .dp-kanban-col-head { background:#1e293b; }
.dp-kanban-count { font-size:.72rem; font-weight:700; padding:2px 7px; border-radius:9999px; }
.dp-kanban-cards { display:flex; flex-direction:column; gap:8px; min-height:80px; }
.dp-kanban-card  { background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; cursor:grab; transition:box-shadow .15s,transform .1s; }
[data-theme="dark"] .dp-kanban-card { background:#1e293b; border-color:#334155; }
.dp-kanban-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.1); transform:translateY(-1px); }
.dp-kanban-card:active { cursor:grabbing; }
.dp-kanban-card-order    { font-size:.68rem; font-weight:700; color:#2563eb; margin-bottom:3px; }
.dp-kanban-card-name     { font-size:.8rem; font-weight:600; margin-bottom:4px; color:#0f172a; }
[data-theme="dark"] .dp-kanban-card-name { color:#f1f5f9; }
.dp-kanban-card-customer { font-size:.72rem; color:#64748b; margin-bottom:2px; }
.dp-kanban-card-deadline { font-size:.7rem; color:#f97316; font-weight:600; }
.dp-kanban-empty { padding:20px; text-align:center; font-size:.75rem; color:#cbd5e1; border:2px dashed #e2e8f0; border-radius:8px; }
[data-theme="dark"] .dp-kanban-empty { border-color:#334155; }

/* Modal */
.dp-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:flex-start; justify-content:center; padding:40px 16px; overflow-y:auto; }
.dp-modal { background:#fff; border-radius:18px; width:100%; max-width:720px; box-shadow:0 20px 60px rgba(0,0,0,.2); animation:dp-slideIn .2s ease; }
[data-theme="dark"] .dp-modal { background:#0f172a; }
.dp-modal-head { display:flex; align-items:center; justify-content:space-between; padding:20px 24px; border-bottom:1px solid #f1f5f9; }
[data-theme="dark"] .dp-modal-head { border-color:#1e293b; }
.dp-modal-head h3 { font-size:1.1rem; font-weight:800; margin:0; }
.dp-modal-close { background:none; border:none; font-size:1.2rem; cursor:pointer; color:#94a3b8; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:8px; }
.dp-modal-close:hover { background:#f1f5f9; color:#475569; }
[data-theme="dark"] .dp-modal-close:hover { background:#1e293b; }
.dp-modal-body { padding:20px 24px; display:flex; flex-direction:column; gap:16px; max-height:75vh; overflow-y:auto; }
.dp-modal-footer { display:flex; gap:10px; justify-content:flex-end; padding:16px 24px; border-top:1px solid #f1f5f9; }
[data-theme="dark"] .dp-modal-footer { border-color:#1e293b; }
.dp-form-section { display:flex; flex-direction:column; gap:12px; }
.dp-form-row  { display:flex; gap:12px; }
.dp-form-group { display:flex; flex-direction:column; flex:1; }

.dp-items-head  { display:flex; align-items:center; justify-content:space-between; }
.dp-items-title { font-weight:700; font-size:.9rem; }
.dp-btn-add-item { font-size:.78rem; font-weight:700; color:#2563eb; background:#eff6ff; border:none; padding:6px 14px; border-radius:8px; cursor:pointer; }
.dp-btn-add-item:hover { background:#dbeafe; }

.dp-item-card { border:1px solid #e2e8f0; border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:10px; position:relative; }
[data-theme="dark"] .dp-item-card { border-color:#334155; }
.dp-item-num  { position:absolute; top:12px; left:14px; font-size:.68rem; font-weight:700; color:#94a3b8; }
.dp-item-del  { position:absolute; top:8px; right:8px; background:none; border:none; cursor:pointer; color:#ef4444; font-size:1rem; width:24px; height:24px; display:flex; align-items:center; justify-content:center; border-radius:6px; }
.dp-item-del:hover { background:#fee2e2; }
.dp-item-sub  { display:flex; align-items:center; justify-content:space-between; font-size:.78rem; color:#94a3b8; padding-top:4px; border-top:1px dashed #e2e8f0; }

.dp-order-total { background:#eff6ff; border-radius:12px; padding:14px 18px; display:flex; gap:32px; flex-wrap:wrap; }
[data-theme="dark"] .dp-order-total { background:#1e3a5f; }
.dp-order-total > div { display:flex; flex-direction:column; gap:4px; }
`;
