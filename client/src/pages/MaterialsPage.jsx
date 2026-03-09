import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { FiCheck, FiX, FiSave } from 'react-icons/fi';

/* ── Helpers ─────────────────────────────────────────────────────────── */
const fmt = (n) => 'Rp ' + Math.floor(n || 0).toLocaleString('id-ID');

function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    const bg = type === 'error' ? '#ef4444' : type === 'warn' ? '#f59e0b' : '#22c55e';
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            background: bg, color: '#fff', padding: '12px 20px',
            borderRadius: 12, fontWeight: 600, fontSize: '.85rem',
            boxShadow: '0 8px 24px rgba(0,0,0,.18)', maxWidth: 320,
            animation: 'ms-fadeIn .25s ease',
        }}>{msg}</div>
    );
}

/* ── Modal Form Bahan ────────────────────────────────────────────────── */
const emptyForm = { nama_bahan: '', kategori: 'digital', satuan: 'm2', harga_modal: '', harga_jual: '', stok_saat_ini: '', stok_minimum: '' };

function FormBahanModal({ initial, onClose, onSaved, toast }) {
    const [form, setForm] = useState(initial ? {
        nama_bahan: initial.nama_bahan, kategori: initial.kategori,
        satuan: initial.satuan, harga_modal: initial.harga_modal,
        harga_jual: initial.harga_jual, stok_saat_ini: initial.stok_saat_ini,
        stok_minimum: initial.stok_minimum, is_active: initial.is_active,
    } : emptyForm);
    const [saving, setSaving] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nama_bahan.trim()) return toast('Nama bahan wajib diisi', 'warn');
        setSaving(true);
        try {
            if (initial) {
                await api.put(`/materials/${initial.id}`, form);
                toast(<>Bahan berhasil diperbarui <FiCheck /></>);
            } else {
                await api.post('/materials', form);
                toast(<>Bahan baru berhasil ditambahkan <FiCheck /></>);
            }
            onSaved();
        } catch (err) {
            toast(err.response?.data?.message || 'Gagal menyimpan', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="ms-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="ms-modal">
                <div className="ms-modal-head">
                    <h3>{initial ? 'Edit Bahan Cetak' : 'Tambah Bahan Baru'}</h3>
                    <button className="ms-close-btn" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit} className="ms-modal-body">
                    <div className="ms-row">
                        <div className="ms-group" style={{ flex: 3 }}>
                            <label className="ms-label">Nama Bahan *</label>
                            <input className="ms-input" placeholder="Frontlite Standard 280gr"
                                value={form.nama_bahan} onChange={e => set('nama_bahan', e.target.value)} />
                        </div>
                        <div className="ms-group">
                            <label className="ms-label">Kategori</label>
                            <select className="ms-input" value={form.kategori} onChange={e => set('kategori', e.target.value)}>
                                <option value="digital">Digital Printing</option>
                                <option value="offset">Offset / Cetak Offset</option>
                                <option value="atk">ATK</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div className="ms-group">
                            <label className="ms-label">Satuan</label>
                            <select className="ms-input" value={form.satuan} onChange={e => set('satuan', e.target.value)}>
                                <option value="m2">m² (meter persegi)</option>
                                <option value="lembar">Lembar</option>
                                <option value="rim">Rim</option>
                                <option value="pcs">Pcs</option>
                                <option value="roll">Roll</option>
                            </select>
                        </div>
                    </div>
                    <div className="ms-row">
                        <div className="ms-group">
                            <label className="ms-label">Harga Modal (Rp)</label>
                            <input className="ms-input" type="number" min="0" placeholder="15000"
                                value={form.harga_modal} onChange={e => set('harga_modal', e.target.value)} />
                        </div>
                        <div className="ms-group">
                            <label className="ms-label">Harga Jual (Rp)</label>
                            <input className="ms-input" type="number" min="0" placeholder="25000"
                                value={form.harga_jual} onChange={e => set('harga_jual', e.target.value)} />
                        </div>
                    </div>
                    <div className="ms-row">
                        <div className="ms-group">
                            <label className="ms-label">Stok Saat Ini</label>
                            <input className="ms-input" type="number" min="0" step="0.01" placeholder="50"
                                value={form.stok_saat_ini} onChange={e => set('stok_saat_ini', e.target.value)} />
                        </div>
                        <div className="ms-group">
                            <label className="ms-label">Stok Minimum (notifikasi)</label>
                            <input className="ms-input" type="number" min="0" step="0.01" placeholder="5"
                                value={form.stok_minimum} onChange={e => set('stok_minimum', e.target.value)} />
                        </div>
                        {initial && (
                            <div className="ms-group">
                                <label className="ms-label">Status</label>
                                <select className="ms-input" value={form.is_active ? '1' : '0'}
                                    onChange={e => set('is_active', e.target.value === '1')}>
                                    <option value="1">Aktif</option>
                                    <option value="0">Nonaktif</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="ms-modal-footer">
                        <button type="button" className="ms-btn-cancel" onClick={onClose}>Batal</button>
                        <button type="submit" className="ms-btn-save" disabled={saving}>
                            {saving ? '⏳ Menyimpan...' : '💾 Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Modal Sesuaikan Stok ────────────────────────────────────────────── */
function StokModal({ bahan, onClose, onSaved, toast }) {
    const [form, setForm] = useState({ tipe: 'masuk', jumlah: '', catatan: '' });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.jumlah || parseFloat(form.jumlah) <= 0) return toast('Jumlah harus > 0', 'warn');
        setSaving(true);
        try {
            await api.post(`/materials/${bahan.id}/stok`, { ...form, jumlah: parseFloat(form.jumlah) });
            toast(<>Stok berhasil disesuaikan <FiCheck /></>);
            onSaved();
        } catch (err) {
            toast(err.response?.data?.message || 'Gagal menyesuaikan stok', 'error');
        } finally {
            setSaving(false);
        }
    };

    const preview = () => {
        const j = parseFloat(form.jumlah) || 0;
        const s = parseFloat(bahan.stok_saat_ini) || 0;
        if (form.tipe === 'masuk') return s + j;
        if (form.tipe === 'keluar') return Math.max(0, s - j);
        if (form.tipe === 'penyesuaian') return j;
        return s;
    };

    return (
        <div className="ms-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="ms-modal" style={{ maxWidth: 450 }}>
                <div className="ms-modal-head">
                    <h3>Sesuaikan Stok</h3>
                    <button className="ms-close-btn" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit} className="ms-modal-body">
                    <div className="ms-bahan-info">
                        <span className="ms-bahan-badge">{bahan.kategori}</span>
                        <span style={{ fontWeight: 700 }}>{bahan.nama_bahan}</span>
                        <span style={{ color: '#94a3b8', fontSize: '.8rem' }}>
                            Stok saat ini: <b style={{ color: '#0f172a' }}>{parseFloat(bahan.stok_saat_ini).toFixed(2)} {bahan.satuan}</b>
                        </span>
                    </div>
                    <div className="ms-group">
                        <label className="ms-label">Jenis Mutasi</label>
                        <div className="ms-radio-group">
                            {[
                                { val: 'masuk', label: '📥 Barang Masuk', color: '#16a34a' },
                                { val: 'keluar', label: '📤 Barang Keluar', color: '#dc2626' },
                                { val: 'penyesuaian', label: '⚖️ Set Manual', color: '#7c3aed' },
                            ].map(opt => (
                                <label key={opt.val} className={`ms-radio-btn ${form.tipe === opt.val ? 'ms-radio-active' : ''}`}
                                    style={form.tipe === opt.val ? { borderColor: opt.color, background: opt.color + '15', color: opt.color } : {}}>
                                    <input type="radio" style={{ display: 'none' }} value={opt.val}
                                        checked={form.tipe === opt.val}
                                        onChange={() => setForm(f => ({ ...f, tipe: opt.val }))} />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="ms-row">
                        <div className="ms-group" style={{ flex: 2 }}>
                            <label className="ms-label">
                                {form.tipe === 'penyesuaian' ? `Set ke (${bahan.satuan})` : `Jumlah (${bahan.satuan})`}
                            </label>
                            <input className="ms-input ms-input-big" type="number" min="0" step="0.01" placeholder="0"
                                value={form.jumlah} onChange={e => setForm(f => ({ ...f, jumlah: e.target.value }))} />
                        </div>
                        <div className="ms-group" style={{ flex: 3 }}>
                            <label className="ms-label">Keterangan</label>
                            <input className="ms-input" placeholder="Pembelian dari supplier, dll."
                                value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} />
                        </div>
                    </div>

                    {form.jumlah && (
                        <div className="ms-stok-preview">
                            <span>Stok setelah penyesuaian:</span>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#2563eb' }}>
                                {preview().toFixed(2)} {bahan.satuan}
                            </span>
                        </div>
                    )}

                    <div className="ms-modal-footer">
                        <button type="button" className="ms-btn-cancel" onClick={onClose}>Batal</button>
                        <button type="submit" className="ms-btn-save" disabled={saving}>
                            {saving ? '⏳...' : <>Simpan <FiSave /></>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── MAIN PAGE ───────────────────────────────────────────────────────── */
export default function MaterialsPage({ onNavigate }) {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [stokItem, setStokItem] = useState(null);
    const [toastMsg, setToastMsg] = useState(null);

    const toast = useCallback((msg, type = 'success') => setToastMsg({ msg, type }), []);

    const fetchMaterials = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/materials');
            setMaterials(data);
        } catch {
            setMaterials([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMaterials(); }, []);

    const displayed = materials.filter(m => {
        const q = search.toLowerCase();
        const matchSearch = !q || m.nama_bahan.toLowerCase().includes(q) || m.kategori.toLowerCase().includes(q);
        const matchFilter = filter === 'all' || (filter === 'low' ? parseFloat(m.stok_saat_ini) <= parseFloat(m.stok_minimum) : m.kategori === filter);
        return matchSearch && matchFilter;
    });

    const lowStockCount = materials.filter(m => parseFloat(m.stok_saat_ini) <= parseFloat(m.stok_minimum) && parseFloat(m.stok_minimum) > 0).length;

    const handleSaved = () => {
        setShowForm(false);
        setEditItem(null);
        setStokItem(null);
        fetchMaterials();
    };

    const KATGORI_COLORS = {
        digital: { color: '#2563eb', bg: '#dbeafe' },
        offset: { color: '#7c3aed', bg: '#ede9fe' },
        atk: { color: '#d97706', bg: '#fef3c7' },
        lainnya: { color: '#475569', bg: '#f1f5f9' },
    };

    return (
        <div className="ms-page">
            <style>{CSS}</style>

            {toastMsg && <Toast {...toastMsg} onClose={() => setToastMsg(null)} />}

            {/* Modal FormBahanModal has been replaced by MaterialFormPage */}

            {stokItem && (
                <StokModal
                    bahan={stokItem}
                    onClose={() => setStokItem(null)}
                    onSaved={handleSaved}
                    toast={toast}
                />
            )}

            {/* ── Header ── */}
            <div className="ms-topbar">
                <div>
                    <h1 className="ms-title">Stok Bahan Cetak</h1>
                    <p className="ms-sub">Manajemen master bahan dan penyesuaian stok.</p>
                </div>
                <button className="ms-btn-primary" onClick={() => onNavigate('tambah-bahan')}>
                    <span className="material-symbols-outlined">add</span>
                    Tambah Bahan
                </button>
            </div>

            {/* ── Stats ── */}
            <div className="ms-stats-row">
                {[
                    { label: 'Total Bahan', value: materials.length, icon: 'inventory_2', color: '#2563eb', bg: '#dbeafe' },
                    { label: 'Bahan Aktif', value: materials.filter(m => m.is_active).length, icon: 'check_circle', color: '#16a34a', bg: '#dcfce7' },
                    { label: 'Stok Menipis', value: lowStockCount, icon: 'warning', color: lowStockCount > 0 ? '#dc2626' : '#94a3b8', bg: lowStockCount > 0 ? '#fee2e2' : '#f1f5f9' },
                    { label: 'Kategori', value: [...new Set(materials.map(m => m.kategori))].length, icon: 'category', color: '#7c3aed', bg: '#ede9fe' },
                ].map(s => (
                    <div key={s.label} className="ms-stat-card">
                        <div className="ms-stat-icon" style={{ background: s.bg, color: s.color }}>
                            <span className="material-symbols-outlined">{s.icon}</span>
                        </div>
                        <div>
                            <p className="ms-stat-label">{s.label}</p>
                            <p className="ms-stat-value" style={{ color: s.color }}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filter & Search ── */}
            <div className="ms-card">
                <div className="ms-filter-bar">
                    <div className="ms-search-wrap">
                        <span className="material-symbols-outlined ms-search-icon">search</span>
                        <input className="ms-search-input" placeholder="Cari nama bahan..." value={search}
                            onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="ms-filter-tabs">
                        {[
                            { id: 'all', label: 'Semua', icon: '' },
                            { id: 'digital', label: 'Digital', icon: 'print' },
                            { id: 'offset', label: 'Offset', icon: 'layers' },
                            { id: 'atk', label: 'ATK', icon: 'edit' },
                            { id: 'low', label: `Menipis (${lowStockCount})`, icon: 'warning' },
                        ].map(f => (
                            <button key={f.id} className={`ms-tab ${filter === f.id ? 'ms-tab-active' : ''}`}
                                onClick={() => setFilter(f.id)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {f.icon && <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{f.icon}</span>}
                                    {f.label}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Table ── */}
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, animation: 'ms-spin 1s linear infinite' }}>progress_activity</span>
                        <p>Memuat data bahan...</p>
                    </div>
                ) : displayed.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 48 }}>inventory_2</span>
                        <p>{search ? 'Bahan tidak ditemukan.' : 'Belum ada bahan cetak. Klik "Tambah Bahan".'}</p>
                    </div>
                ) : (
                    <div className="ms-table-wrap">
                        <table className="ms-table">
                            <thead>
                                <tr>
                                    <th>Nama Bahan</th>
                                    <th>Kategori</th>
                                    <th>Satuan</th>
                                    <th>Harga Modal</th>
                                    <th>Harga Jual</th>
                                    <th>Margin</th>
                                    <th>Stok</th>
                                    <th>Status</th>
                                    <th className="ms-th-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayed.map(m => {
                                    const modal = parseFloat(m.harga_modal) || 0;
                                    const jual = parseFloat(m.harga_jual) || 0;
                                    const margin = modal > 0 ? Math.round(((jual - modal) / modal) * 100) : 0;
                                    const stok = parseFloat(m.stok_saat_ini) || 0;
                                    const minStok = parseFloat(m.stok_minimum) || 0;
                                    const isLow = stok <= minStok && minStok > 0;
                                    const kc = KATGORI_COLORS[m.kategori] || KATGORI_COLORS.lainnya;

                                    return (
                                        <tr key={m.id} className="ms-tr">
                                            <td>
                                                <span style={{ fontWeight: 700, fontSize: '.86rem' }}>{m.nama_bahan}</span>
                                            </td>
                                            <td>
                                                <span className="ms-badge" style={{ background: kc.bg, color: kc.color }}>
                                                    {m.kategori}
                                                </span>
                                            </td>
                                            <td style={{ color: '#64748b', fontSize: '.83rem' }}>{m.satuan}</td>
                                            <td style={{ fontSize: '.83rem' }}>{fmt(m.harga_modal)}</td>
                                            <td style={{ fontWeight: 700 }}>{fmt(m.harga_jual)}</td>
                                            <td>
                                                <span style={{
                                                    fontWeight: 700, fontSize: '.78rem',
                                                    color: margin >= 30 ? '#16a34a' : margin >= 10 ? '#d97706' : '#dc2626',
                                                }}>
                                                    {margin}%
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                    <span className={`ms-stok-val ${isLow ? 'ms-stok-low' : ''}`}>
                                                        {isLow && '⚠️ '}
                                                        {stok.toFixed(2)} {m.satuan}
                                                    </span>
                                                    {minStok > 0 && (
                                                        <span style={{ fontSize: '.68rem', color: '#94a3b8' }}>
                                                            Min: {minStok.toFixed(2)}
                                                        </span>
                                                    )}
                                                    {minStok > 0 && (
                                                        <div className="ms-stok-bar">
                                                            <div className="ms-stok-bar-fill"
                                                                style={{
                                                                    width: `${Math.min(100, (stok / (minStok * 3)) * 100)}%`,
                                                                    background: isLow ? '#ef4444' : '#22c55e',
                                                                }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="ms-badge" style={
                                                    m.is_active
                                                        ? { background: '#dcfce7', color: '#15803d' }
                                                        : { background: '#f1f5f9', color: '#94a3b8' }
                                                }>
                                                    {m.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="ms-td-action">
                                                <button className="ms-action-btn" title="Sesuaikan Stok"
                                                    onClick={() => setStokItem(m)}>
                                                    <span className="material-symbols-outlined">tune</span>
                                                </button>
                                                <button className="ms-action-btn" title="Edit Bahan"
                                                    onClick={() => onNavigate('tambah-bahan', { material: m })}>
                                                    <span className="material-symbols-outlined">edit</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── CSS ─────────────────────────────────────────────────────────────── */
const CSS = `
@keyframes ms-fadeIn { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none} }
@keyframes ms-spin    { to{transform:rotate(360deg)} }

.ms-page  { padding:28px 32px; display:flex; flex-direction:column; gap:24px; min-height:100%; }
.ms-topbar { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.ms-title { font-size:1.4rem; font-weight:800; margin:0; letter-spacing:-.02em; }
.ms-sub   { color:#64748b; margin:4px 0 0; font-size:.875rem; }

.ms-btn-primary { display:flex; align-items:center; gap:7px; background:#2563eb; color:#fff; font-weight:700; font-size:.875rem; padding:10px 20px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(37,99,235,.25); transition:background .15s; }
.ms-btn-primary:hover { background:#1d4ed8; }

/* Stats */
.ms-stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
@media(max-width:860px){.ms-stats-row{grid-template-columns:repeat(2,1fr);}}
.ms-stat-card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:18px; display:flex; align-items:center; gap:14px; box-shadow:0 1px 4px rgba(0,0,0,.05); }
[data-theme="dark"] .ms-stat-card { background:#0f172a; border-color:#1e293b; }
.ms-stat-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ms-stat-label { font-size:.72rem; color:#94a3b8; font-weight:600; margin:0 0 3px; text-transform:uppercase; letter-spacing:.04em; }
.ms-stat-value { font-size:1.6rem; font-weight:900; margin:0; }

/* Card & filter */
.ms-card { background:#fff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.05); }
[data-theme="dark"] .ms-card { background:#0f172a; border-color:#1e293b; }
.ms-filter-bar { display:flex; align-items:center; gap:14px; padding:16px 20px; border-bottom:1px solid #f1f5f9; flex-wrap:wrap; }
[data-theme="dark"] .ms-filter-bar { border-color:#1e293b; }

.ms-search-wrap  { position:relative; flex:1; min-width:180px; }
.ms-search-icon  { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:18px!important; }
.ms-search-input { width:100%; padding:8px 12px 8px 36px; border:1px solid #e2e8f0; border-radius:8px; font-size:.875rem; outline:none; box-sizing:border-box; background:#f8fafc; }
.ms-search-input:focus { border-color:#2563eb; background:#fff; box-shadow:0 0 0 3px #dbeafe; }
[data-theme="dark"] .ms-search-input { background:#1e293b; border-color:#334155; color:#f1f5f9; }

.ms-filter-tabs { display:flex; gap:6px; flex-wrap:wrap; }
.ms-tab { padding:6px 12px; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc; font-size:.75rem; font-weight:600; color:#64748b; cursor:pointer; transition:all .15s; }
.ms-tab:hover { background:#eff6ff; border-color:#bfdbfe; color:#2563eb; }
.ms-tab.ms-tab-active { background:#2563eb; color:#fff; border-color:#2563eb; }

/* Table */
.ms-table-wrap { overflow-x:auto; }
.ms-table { width:100%; border-collapse:collapse; text-align:left; }
.ms-table thead tr { background:#f8fafc; }
[data-theme="dark"] .ms-table thead tr { background:#1e293b; }
.ms-table th { padding:11px 18px; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#94a3b8; white-space:nowrap; }
.ms-th-right { text-align:right; }
.ms-tr { border-top:1px solid #f1f5f9; transition:background .1s; }
[data-theme="dark"] .ms-tr { border-color:#1e293b; }
.ms-tr:hover { background:#f8fafc; }
[data-theme="dark"] .ms-tr:hover { background:#1e293b; }
.ms-table td { padding:12px 18px; vertical-align:middle; }
.ms-td-action { text-align:right; display:flex; justify-content:flex-end; gap:4px; }

.ms-badge { padding:3px 9px; font-size:.68rem; font-weight:700; border-radius:9999px; white-space:nowrap; }
.ms-stok-val { font-size:.83rem; font-weight:600; }
.ms-stok-low { color:#dc2626!important; }
.ms-stok-bar { height:4px; background:#e2e8f0; border-radius:9999px; width:80px; margin-top:3px; overflow:hidden; }
.ms-stok-bar-fill { height:100%; border-radius:9999px; transition:width .4s; }

.ms-action-btn { background:none; border:none; cursor:pointer; color:#94a3b8; display:flex; align-items:center; padding:5px; border-radius:7px; transition:all .15s; }
.ms-action-btn:hover { color:#2563eb; background:#eff6ff; }

/* Modal */
.ms-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:24px; }
.ms-modal { background:#fff; border-radius:18px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,.2); animation:ms-fadeIn .2s ease; }
[data-theme="dark"] .ms-modal { background:#0f172a; }
.ms-modal-head { display:flex; align-items:center; justify-content:space-between; padding:18px 22px; border-bottom:1px solid #f1f5f9; }
[data-theme="dark"] .ms-modal-head { border-color:#1e293b; }
.ms-modal-head h3 { font-size:1.05rem; font-weight:800; margin:0; }
.ms-close-btn { background:none; border:none; font-size:1.1rem; cursor:pointer; color:#94a3b8; width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:7px; }
.ms-close-btn:hover { background:#f1f5f9; color:#475569; }
.ms-modal-body { padding:18px 22px; display:flex; flex-direction:column; gap:14px; max-height:70vh; overflow-y:auto; }
.ms-modal-footer { display:flex; gap:10px; justify-content:flex-end; padding:14px 22px; border-top:1px solid #f1f5f9; }
[data-theme="dark"] .ms-modal-footer { border-color:#1e293b; }

.ms-label { display:block; font-size:.77rem; font-weight:600; color:#475569; margin-bottom:5px; }
[data-theme="dark"] .ms-label { color:#94a3b8; }
.ms-input { width:100%; padding:8px 12px; border:1px solid #e2e8f0; border-radius:8px; font-size:.875rem; outline:none; box-sizing:border-box; background:#fff; color:#0f172a; transition:border-color .15s,box-shadow .15s; }
.ms-input:focus { border-color:#2563eb; box-shadow:0 0 0 3px #dbeafe; }
[data-theme="dark"] .ms-input { background:#1e293b; border-color:#334155; color:#f1f5f9; }
.ms-input-big { font-size:1.2rem; font-weight:700; text-align:center; padding:10px; }
select.ms-input { appearance:auto; }
.ms-row { display:flex; gap:12px; }
.ms-group { display:flex; flex-direction:column; flex:1; }

.ms-btn-save { display:flex; align-items:center; gap:6px; background:#2563eb; color:#fff; font-weight:700; font-size:.875rem; padding:9px 20px; border-radius:9px; border:none; cursor:pointer; }
.ms-btn-save:hover { background:#1d4ed8; }
.ms-btn-save:disabled { opacity:.6; cursor:not-allowed; }
.ms-btn-cancel { background:#f1f5f9; color:#475569; font-weight:700; font-size:.875rem; padding:9px 16px; border-radius:9px; border:none; cursor:pointer; }
[data-theme="dark"] .ms-btn-cancel { background:#1e293b; color:#94a3b8; }

.ms-bahan-info { display:flex; flex-direction:column; gap:4px; padding:12px 14px; background:#f8fafc; border-radius:10px; }
[data-theme="dark"] .ms-bahan-info { background:#1e293b; }
[data-theme="dark"] .ms-bahan-info span:first-child { color:#f1f5f9; }

.ms-radio-group { display:flex; gap:8px; flex-wrap:wrap; }
.ms-radio-btn { padding:8px 14px; border:2px solid #e2e8f0; border-radius:9px; font-size:.8rem; font-weight:600; cursor:pointer; transition:all .15s; color:#64748b; }
.ms-radio-btn:hover { border-color:#bfdbfe; color:#2563eb; }
.ms-radio-active { border-color:#2563eb; background:#eff6ff; color:#2563eb; }

.ms-stok-preview { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:#eff6ff; border-radius:10px; font-size:.85rem; font-weight:600; }
[data-theme="dark"] .ms-stok-preview { background:#1e3a5f; }
`;
