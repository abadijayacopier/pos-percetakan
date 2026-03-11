import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const fmt = (n) => 'Rp ' + Math.floor(n || 0).toLocaleString('id-ID');

function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    const bg = type === 'error' ? '#ef4444' : type === 'warn' ? '#f59e0b' : '#22c55e';
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            background: bg, color: '#fff', padding: '12px 20px',
            borderRadius: 12, fontWeight: 600, fontSize: '.85rem',
            boxShadow: '0 8px 24px rgba(0,0,0,.18)', maxWidth: 360,
            animation: 'dm-fadeIn .25s ease',
        }}>{msg}</div>
    );
}

export default function DesignerManagementPage({ onNavigate }) {
    const { user } = useAuth();
    const [designers, setDesigners] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', username: '', password: '' });
    const [saving, setSaving] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);

    const toast = useCallback((msg, type = 'success') => setToastMsg({ msg, type }), []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [dRes, aRes] = await Promise.all([
                api.get('/designers'),
                api.get('/designers/assignments')
            ]);
            setDesigners(dRes.data);
            setAssignments(aRes.data);
        } catch {
            setDesigners([]);
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.username.trim()) return toast('Nama dan username wajib diisi', 'warn');
        if (!editItem && !form.password.trim()) return toast('Password wajib diisi', 'warn');
        setSaving(true);
        try {
            if (editItem) {
                await api.put(`/designers/${editItem.id}`, { name: form.name, username: form.username, is_active: form.is_active });
                toast('Data desainer berhasil diperbarui ✅');
            } else {
                await api.post('/designers', form);
                toast('Operator desain baru berhasil ditambahkan ✅');
            }
            setShowForm(false);
            setEditItem(null);
            setForm({ name: '', username: '', password: '' });
            fetchData();
        } catch (err) {
            toast(err.response?.data?.message || 'Gagal menyimpan', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (d, activate) => {
        if (!window.confirm(`${activate ? 'Aktifkan' : 'Nonaktifkan'} operator desain ini?`)) return;
        try {
            if (activate) {
                await api.put(`/designers/${d.id}`, { name: d.name, username: d.username, is_active: true });
                toast('Operator diaktifkan ✅');
            } else {
                await api.delete(`/designers/${d.id}`);
                toast('Operator dinonaktifkan ✅');
            }
            fetchData();
        } catch (err) {
            toast(err.response?.data?.message || 'Gagal', 'error');
        }
    };

    const openEdit = (d) => {
        setEditItem(d);
        setForm({ name: d.name, username: d.username, password: '', is_active: d.is_active });
        setShowForm(true);
    };

    const kosong = designers.filter(d => d.is_active && d.status_kerja === 'kosong').length;
    const sibuk = designers.filter(d => d.is_active && d.status_kerja === 'sibuk').length;
    const aktif = designers.filter(d => d.is_active).length;
    const recentAssignments = assignments.filter(a => ['ditugaskan', 'dikerjakan'].includes(a.status));

    return (
        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24, minHeight: '100%' }}>
            <style>{CSS}</style>

            {toastMsg && <Toast {...toastMsg} onClose={() => setToastMsg(null)} />}

            {/* Header */}
            <div className="dm-topbar">
                <div>
                    <h1 className="dm-title">Manajemen Operator Desain</h1>
                    <p className="dm-sub">Kelola daftar operator desain dan monitoring penugasan secara real-time.</p>
                </div>
                <button className="dm-btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', username: '', password: '' }); setShowForm(true); }}>
                    <span className="material-symbols-outlined">person_add</span>
                    Tambah Operator
                </button>
            </div>

            {/* Stats */}
            <div className="dm-stats-row">
                {[
                    { label: 'Total Operator', value: designers.length, icon: 'groups', color: '#2563eb', bg: '#dbeafe' },
                    { label: 'Aktif', value: aktif, icon: 'check_circle', color: '#16a34a', bg: '#dcfce7' },
                    { label: 'Sedang Sibuk', value: sibuk, icon: 'work', color: '#dc2626', bg: '#fee2e2' },
                    { label: 'Tersedia', value: kosong, icon: 'event_available', color: '#7c3aed', bg: '#ede9fe' },
                ].map(s => (
                    <div key={s.label} className="dm-stat-card">
                        <div className="dm-stat-icon" style={{ background: s.bg, color: s.color }}>
                            <span className="material-symbols-outlined">{s.icon}</span>
                        </div>
                        <div>
                            <p className="dm-stat-label">{s.label}</p>
                            <p className="dm-stat-value" style={{ color: s.color }}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabel Operator */}
            <div className="dm-card">
                <div className="dm-card-head">
                    <h2 className="dm-card-title">
                        <span className="material-symbols-outlined" style={{ color: '#2563eb' }}>groups</span>
                        Daftar Operator Desain
                    </h2>
                </div>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, animation: 'dm-spin 1s linear infinite' }}>progress_activity</span>
                        <p>Memuat data...</p>
                    </div>
                ) : designers.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 48 }}>person_off</span>
                        <p>Belum ada operator desain. Klik "Tambah Operator".</p>
                    </div>
                ) : (
                    <div className="dm-table-wrap">
                        <table className="dm-table">
                            <thead>
                                <tr>
                                    <th>Operator</th>
                                    <th>Username</th>
                                    <th>Status Kerja</th>
                                    <th>Tugas Saat Ini</th>
                                    <th>Status Akun</th>
                                    <th style={{ textAlign: 'right' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {designers.map(d => (
                                    <tr key={d.id} className="dm-tr">
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className={`dm-avatar ${d.status_kerja === 'sibuk' ? 'dm-avatar-busy' : 'dm-avatar-free'}`}>
                                                    {d.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 700, fontSize: '.86rem' }}>{d.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: '.83rem' }}>{d.username}</td>
                                        <td>
                                            <span className={`dm-badge ${d.status_kerja === 'sibuk' ? 'dm-badge-busy' : 'dm-badge-free'}`}>
                                                {d.status_kerja === 'sibuk' ? '🔴 Sibuk' : '🟢 Kosong'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '.83rem' }}>
                                            {d.active_task ? (
                                                <div>
                                                    <span style={{ fontWeight: 600 }}>{d.active_task.task_id}</span>
                                                    <span className={`dm-badge-sm ${d.active_task.status === 'dikerjakan' ? 'dm-badge-working' : 'dm-badge-assigned'}`} style={{ marginLeft: 8 }}>
                                                        {d.active_task.status === 'dikerjakan' ? '⚡ Mengerjakan' : '📋 Ditugaskan'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#94a3b8' }}>— Tidak ada tugas —</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="dm-badge" style={d.is_active ? { background: '#dcfce7', color: '#15803d' } : { background: '#f1f5f9', color: '#94a3b8' }}>
                                                {d.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                                <button className="dm-action-btn" title="Edit" onClick={() => openEdit(d)}>
                                                    <span className="material-symbols-outlined">edit</span>
                                                </button>
                                                {d.is_active ? (
                                                    <button className="dm-action-btn dm-action-danger" title="Nonaktifkan" onClick={() => handleToggleActive(d, false)}>
                                                        <span className="material-symbols-outlined">person_off</span>
                                                    </button>
                                                ) : (
                                                    <button className="dm-action-btn" style={{ color: '#16a34a' }} title="Aktifkan" onClick={() => handleToggleActive(d, true)}>
                                                        <span className="material-symbols-outlined">how_to_reg</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Monitoring Penugasan Aktif */}
            <div className="dm-card">
                <div className="dm-card-head">
                    <h2 className="dm-card-title">
                        <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>monitoring</span>
                        Monitoring Penugasan Aktif
                    </h2>
                    <span className="dm-badge" style={{ background: '#fef3c7', color: '#d97706' }}>{recentAssignments.length} Aktif</span>
                </div>
                {recentAssignments.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 36 }}>task_alt</span>
                        <p style={{ marginTop: 8 }}>Tidak ada penugasan aktif saat ini.</p>
                    </div>
                ) : (
                    <div className="dm-table-wrap">
                        <table className="dm-table">
                            <thead>
                                <tr>
                                    <th>Pesanan</th>
                                    <th>Operator</th>
                                    <th>Status</th>
                                    <th>Ditugaskan</th>
                                    <th>Mulai Kerja</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentAssignments.map(a => (
                                    <tr key={a.id} className="dm-tr">
                                        <td style={{ fontWeight: 700 }}>{a.task_id}</td>
                                        <td>{a.designer_name}</td>
                                        <td>
                                            <span className={`dm-badge-sm ${a.status === 'dikerjakan' ? 'dm-badge-working' : 'dm-badge-assigned'}`}>
                                                {a.status === 'dikerjakan' ? '⚡ Dikerjakan' : '📋 Ditugaskan'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '.83rem', color: '#64748b' }}>
                                            {new Date(a.assigned_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td style={{ fontSize: '.83rem' }}>
                                            {a.started_at
                                                ? new Date(a.started_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
                                                : <span style={{ color: '#94a3b8' }}>Belum dimulai</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="dm-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                    <div className="dm-modal">
                        <div className="dm-modal-head">
                            <h3>{editItem ? 'Edit Operator Desain' : 'Tambah Operator Desain Baru'}</h3>
                            <button className="dm-close-btn" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="dm-modal-body">
                            <div className="dm-group">
                                <label className="dm-label">Nama Lengkap *</label>
                                <input className="dm-input" placeholder="Andi Saputra" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="dm-group">
                                <label className="dm-label">Username *</label>
                                <input className="dm-input" placeholder="andi_desain" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                            </div>
                            {!editItem && (
                                <div className="dm-group">
                                    <label className="dm-label">Password *</label>
                                    <input className="dm-input" type="password" placeholder="Minimal 6 karakter" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                                </div>
                            )}
                            <div className="dm-modal-footer">
                                <button type="button" className="dm-btn-cancel" onClick={() => setShowForm(false)}>Batal</button>
                                <button type="submit" className="dm-btn-save" disabled={saving}>
                                    {saving ? '⏳ Menyimpan...' : '💾 Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const CSS = `
@keyframes dm-fadeIn { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none} }
@keyframes dm-spin { to{transform:rotate(360deg)} }

.dm-topbar { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.dm-title { font-size:1.4rem; font-weight:800; margin:0; letter-spacing:-.02em; }
.dm-sub { color:#64748b; margin:4px 0 0; font-size:.875rem; }
.dm-btn-primary { display:flex; align-items:center; gap:7px; background:#2563eb; color:#fff; font-weight:700; font-size:.875rem; padding:10px 20px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(37,99,235,.25); transition:background .15s; }
.dm-btn-primary:hover { background:#1d4ed8; }

.dm-stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
@media(max-width:860px){.dm-stats-row{grid-template-columns:repeat(2,1fr);}}
.dm-stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,.05);}
[data-theme="dark"] .dm-stat-card{background:#0f172a;border-color:#1e293b;}
.dm-stat-icon{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.dm-stat-label{font-size:.72rem;color:#94a3b8;font-weight:600;margin:0 0 3px;text-transform:uppercase;letter-spacing:.04em;}
.dm-stat-value{font-size:1.6rem;font-weight:900;margin:0;}

.dm-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05);}
[data-theme="dark"] .dm-card{background:#0f172a;border-color:#1e293b;}
.dm-card-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #f1f5f9;}
[data-theme="dark"] .dm-card-head{border-color:#1e293b;}
.dm-card-title{display:flex;align-items:center;gap:8px;font-size:1rem;font-weight:700;margin:0;}

.dm-table-wrap{overflow-x:auto;}
.dm-table{width:100%;border-collapse:collapse;text-align:left;}
.dm-table thead tr{background:#f8fafc;}
[data-theme="dark"] .dm-table thead tr{background:#1e293b;}
.dm-table th{padding:11px 18px;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;white-space:nowrap;}
.dm-tr{border-top:1px solid #f1f5f9;transition:background .1s;}
[data-theme="dark"] .dm-tr{border-color:#1e293b;}
.dm-tr:hover{background:#f8fafc;}
[data-theme="dark"] .dm-tr:hover{background:#1e293b;}
.dm-table td{padding:12px 18px;vertical-align:middle;}

.dm-avatar{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.72rem;color:#fff;flex-shrink:0;}
.dm-avatar-free{background:#2563eb;}
.dm-avatar-busy{background:#dc2626;}

.dm-badge{padding:3px 9px;font-size:.68rem;font-weight:700;border-radius:9999px;white-space:nowrap;}
.dm-badge-free{background:#dcfce7;color:#15803d;}
.dm-badge-busy{background:#fee2e2;color:#dc2626;}
.dm-badge-sm{padding:2px 7px;font-size:.65rem;font-weight:700;border-radius:6px;}
.dm-badge-working{background:#dbeafe;color:#2563eb;}
.dm-badge-assigned{background:#fef3c7;color:#d97706;}

.dm-action-btn{background:none;border:none;cursor:pointer;color:#94a3b8;display:flex;align-items:center;padding:5px;border-radius:7px;transition:all .15s;}
.dm-action-btn:hover{color:#2563eb;background:#eff6ff;}
.dm-action-danger:hover{color:#dc2626;background:#fef2f2;}

.dm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;}
.dm-modal{background:#fff;border-radius:18px;width:100%;max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,.2);animation:dm-fadeIn .2s ease;}
[data-theme="dark"] .dm-modal{background:#0f172a;}
.dm-modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #f1f5f9;}
[data-theme="dark"] .dm-modal-head{border-color:#1e293b;}
.dm-modal-head h3{font-size:1.05rem;font-weight:800;margin:0;}
.dm-close-btn{background:none;border:none;font-size:1.1rem;cursor:pointer;color:#94a3b8;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:7px;}
.dm-close-btn:hover{background:#f1f5f9;color:#475569;}
.dm-modal-body{padding:18px 22px;display:flex;flex-direction:column;gap:14px;}
.dm-modal-footer{display:flex;gap:10px;justify-content:flex-end;padding-top:10px;}
.dm-label{display:block;font-size:.77rem;font-weight:600;color:#475569;margin-bottom:5px;}
[data-theme="dark"] .dm-label{color:#94a3b8;}
.dm-input{width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:.875rem;outline:none;box-sizing:border-box;background:#fff;color:#0f172a;transition:border-color .15s,box-shadow .15s;}
.dm-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px #dbeafe;}
[data-theme="dark"] .dm-input{background:#1e293b;border-color:#334155;color:#f1f5f9;}
.dm-group{display:flex;flex-direction:column;}
.dm-btn-save{display:flex;align-items:center;gap:6px;background:#2563eb;color:#fff;font-weight:700;font-size:.875rem;padding:9px 20px;border-radius:9px;border:none;cursor:pointer;}
.dm-btn-save:hover{background:#1d4ed8;}
.dm-btn-save:disabled{opacity:.6;cursor:not-allowed;}
.dm-btn-cancel{background:#f1f5f9;color:#475569;font-weight:700;font-size:.875rem;padding:9px 16px;border-radius:9px;border:none;cursor:pointer;}
[data-theme="dark"] .dm-btn-cancel{background:#1e293b;color:#94a3b8;}
`;
