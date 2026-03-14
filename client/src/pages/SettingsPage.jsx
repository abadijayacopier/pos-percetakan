import { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import db from '../db';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatDateTime, printViaRawBT } from '../utils';
import Modal from '../components/Modal';
import { FiSettings, FiFile, FiUsers, FiPrinter, FiEdit, FiTrash2, FiPlus, FiSave, FiPackage, FiTool, FiDollarSign, FiFileText, FiSearch, FiClock, FiCheckCircle, FiAlertCircle, FiX, FiDownload, FiUpload, FiRefreshCw, FiCheck, FiTruck, FiCalendar, FiMessageCircle, FiHome, FiBriefcase, FiStar, FiBox, FiActivity, FiLayers, FiList, FiChevronRight, FiChevronDown, FiEye, FiBook, FiTag, FiInfo, FiFolder, FiZap, FiSun, FiMoon, FiMonitor, FiImage } from 'react-icons/fi';

export default function SettingsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const themeCtx = useTheme();

    // Core states
    const [activeTab, setActiveTab] = useState('general');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Settings memo and helper
    const settings = useMemo(() => {
        const all = db.getAll('settings');
        const map = {};
        all.forEach(s => { map[s.key] = s; });
        return map;
    }, []);

    const getSetting = (key) => settings[key]?.value || '';

    // Data States
    const [fotocopyPrices, setFotocopyPrices] = useState([]);
    const [users, setUsers] = useState(() => db.getAll('users'));
    const [printPrices, setPrintPrices] = useState(db.getAll('print_prices') || []);
    const [bindPrices, setBindPrices] = useState(db.getAll('binding_prices') || []);
    const [systemPrinters, setSystemPrinters] = useState([]);
    const [galleryImages, setGalleryImages] = useState(() => {
        const saved = getSetting('landing_gallery');
        try { return saved ? JSON.parse(saved) : []; } catch { return []; }
    });

    const defaultFcDiscounts = [
        { id: '1', minQty: 100, discountPerSheet: 50 },
        { id: '2', minQty: 500, discountPerSheet: 75 },
        { id: '3', minQty: 1000, discountPerSheet: 100 }
    ];
    const [fcDiscounts, setFcDiscounts] = useState(() => {
        const saved = getSetting('fc_discounts');
        return saved ? JSON.parse(saved) : defaultFcDiscounts;
    });

    // Branding & Terminal States
    const [storeName, setStoreName] = useState(getSetting('store_name') || 'FOTOCOPY ABADI JAYA');
    const [storeAddress, setStoreAddress] = useState(getSetting('store_address') || '');
    const [storePhone, setStorePhone] = useState(getSetting('store_phone') || '');
    const [storeMapsUrl, setStoreMapsUrl] = useState(getSetting('store_maps_url') || 'https://maps.app.goo.gl/DD3kUGfTmqaZ9iDd7');
    const [storeLogo, setStoreLogo] = useState(getSetting('store_logo') || '');
    const [receiptFooter, setReceiptFooter] = useState(getSetting('receipt_footer') || '');
    const [printerSize, setPrinterSize] = useState(getSetting('printer_size') || '80mm');
    const [printerName, setPrinterName] = useState(getSetting('printer_name') || '');
    const [paperSize, setPaperSize] = useState(getSetting('paper_size') || 'A4');
    const [autoPrint, setAutoPrint] = useState(getSetting('auto_print') === 'true');

    // UI/Form States
    const [userFormOpen, setUserFormOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [userForm, setUserForm] = useState({ name: '', username: '', password: '', role: 'kasir', isActive: true });

    const activityLog = useMemo(() => db.getAll('activity_log').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50), []);

    // Effects
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        api.get('/transactions/fotocopy-prices').then(res => setFotocopyPrices(res.data)).catch(() => setFotocopyPrices(db.getAll('fotocopy_prices')));
        api.get('/print/printers').then(res => setSystemPrinters(res.data)).catch(() => { });
    }, []);

    // Functions
    const refreshUsers = () => setUsers(db.getAll('users'));

    const updateFotocopyPrice = async (id, newPrice) => {
        try {
            await api.put(`/transactions/fotocopy-prices/${id}`, { price: parseInt(newPrice) });
            showToast('Harga berhasil diupdate!', 'success');
            api.get('/transactions/fotocopy-prices').then(res => setFotocopyPrices(res.data));
        } catch { showToast('Gagal update harga', 'error'); }
    };

    const saveAllFotocopyPrices = async () => {
        try {
            for (const p of fotocopyPrices) {
                await api.put(`/transactions/fotocopy-prices/${p.id}`, { price: parseInt(p.price), paper: p.paper, color: p.color, side: p.side });
            }
            showToast('Semua harga fotocopy berhasil disimpan!', 'success');
            api.get('/transactions/fotocopy-prices').then(res => setFotocopyPrices(res.data));
        } catch { showToast('Gagal menyimpan harga fotocopy', 'error'); }
    };

    const saveSettings = () => {
        const set = (key, value) => {
            const existing = db.getAll('settings').find(s => s.key === key);
            if (existing) db.update('settings', existing.id, { value });
            else db.insert('settings', { key, value });
        };
        set('store_name', storeName);
        set('store_address', storeAddress);
        set('store_phone', storePhone);
        set('store_maps_url', storeMapsUrl);
        set('store_logo', storeLogo);
        set('receipt_footer', receiptFooter);
        set('printer_size', printerSize);
        set('printer_name', printerName);
        set('paper_size', paperSize);
        set('auto_print', autoPrint ? 'true' : 'false');
        set('landing_gallery', JSON.stringify(galleryImages));
        db.setAll('print_prices', printPrices);
        db.setAll('binding_prices', bindPrices);
        showToast('Pengaturan berhasil disimpan!', 'success');
        db.logActivity(user?.name || 'Admin', 'Simpan Pengaturan', 'Pengaturan umum dan harga layanan diperbarui');
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setStoreLogo(ev.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleGalleryUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setGalleryImages(prev => [...prev, ev.target.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeGalleryImage = (index) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveUser = () => {
        if (!userForm.name || !userForm.username || (!editUser && !userForm.password)) {
            showToast('Lengkapi data user!', 'warning'); return;
        }
        if (editUser) {
            const updates = { ...userForm };
            if (!updates.password) delete updates.password;
            db.update('users', editUser.id, updates);
        } else {
            db.insert('users', userForm);
        }
        refreshUsers();
        setUserFormOpen(false);
        showToast(editUser ? 'User diupdate!' : 'User baru ditambahkan!', 'success');
        db.logActivity(user?.name || 'Admin', editUser ? 'Update User' : 'Tambah User', `User: ${userForm.name} (${userForm.role})`);
    };

    const handleBackup = () => {
        const data = db.exportAll();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `backup-pos-${new Date().toISOString().split('T')[0]}.json`;
        a.click(); URL.revokeObjectURL(url);
        showToast('Backup berhasil didownload!', 'success');
        db.logActivity(user?.name || 'Admin', 'Backup Data', 'Data di-export ke file JSON');
    };

    const handleRestore = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                db.importAll(ev.target.result);
                showToast('Data berhasil di-restore! Refresh halaman.', 'success');
                db.logActivity(user?.name || 'Admin', 'Restore Data', 'Data di-restore dari backup');
                setTimeout(() => window.location.reload(), 1500);
            } catch { showToast('File tidak valid!', 'error'); }
        };
        reader.readAsText(file);
    };

    const resetData = () => {
        if (confirm('<FiAlertCircle /> PERINGATAN: Semua data akan dihapus dan di-reset ke data awal. Lanjutkan?')) {
            const tables = ['users', 'categories', 'products', 'customers', 'suppliers', 'transactions', 'transaction_details', 'print_orders', 'service_orders', 'cash_flow', 'stock_movements', 'activity_log', 'settings', 'fotocopy_prices'];
            tables.forEach(t => db.clear(t));
            showToast('Data di-reset! Refresh halaman.', 'success');
            setTimeout(() => window.location.reload(), 1500);
        }
    };

    const TABS = [
        { id: 'general', icon: <FiSettings />, text: 'Umum' },
        { id: 'fotocopy', icon: <FiFile />, text: 'Harga Layanan' },
        { id: 'landing', icon: <FiImage />, text: 'Landing Page' },
        { id: 'users', icon: <FiUsers />, text: 'Users' },
        { id: 'printer', icon: <FiPrinter />, text: 'Printer & Nota' },
        { id: 'log', icon: <FiEdit />, text: 'Log Aktivitas' },
        { id: 'backup', icon: <FiSave />, text: 'Backup & Restore' },
    ];

    return (
        <div className="premium-settings-wrapper premium-page-wrapper" style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>

            <div className="tabs" style={{ marginBottom: '16px' }}>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(t.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center' }}>{t.icon}</span>
                        {t.text}
                    </button>
                ))}
            </div>

            {/* General */}
            {activeTab === 'general' && (
                <div className="card">
                    <div className="card-body">
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiMonitor size={14} /> Mode Tampilan</label>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                {[
                                    { id: 'light', icon: <FiSun size={16} />, label: 'Terang' },
                                    { id: 'dark', icon: <FiMoon size={16} />, label: 'Gelap' },
                                    { id: 'system', icon: <FiMonitor size={16} />, label: 'Sistem' },
                                ].map(t => (
                                    <button key={t.id} onClick={() => themeCtx.setTheme(t.id)} className={`btn ${themeCtx.themeMode === t.id ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>{t.icon}{t.label}</button>
                                ))}
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={saveSettings} style={{ marginTop: '16px' }}><FiSave /> Simpan Tema</button>
                    </div>
                </div>
            )}

            {/* Landing Page Settings */}
            {activeTab === 'landing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="card">
                        <div className="card-header"><h3><FiSettings /> Identitas & Lokasi Toko</h3></div>
                        <div className="card-body">
                            <div className="form-group"><label className="form-label">Nama Toko</label><input className="form-input" value={storeName} onChange={e => setStoreName(e.target.value)} /></div>
                            <div className="form-group"><label className="form-label">Alamat Lengkap</label><textarea className="form-textarea" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} /></div>
                            <div className="form-group"><label className="form-label">WhatsApp (No. Telepon)</label><input className="form-input" value={storePhone} onChange={e => setStorePhone(e.target.value)} /></div>
                            <div className="form-group"><label className="form-label">Link Google Maps (URL)</label><input className="form-input" value={storeMapsUrl} onChange={e => setStoreMapsUrl(e.target.value)} placeholder="Contool: https://maps.app.goo.gl/..." /></div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3><FiImage /> Galeri Toko & Hasil Kerja</h3>
                            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                                <FiPlus /> Tambah Foto
                                <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} style={{ display: 'none' }} />
                            </label>
                        </div>
                        <div className="card-body">
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                Upload foto interior toko, peralatan, atau hasil cetakan yang pernah dikerjakan.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                                {galleryImages.map((img, idx) => (
                                    <div key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1/1', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                        <img src={img} alt={`Gallery ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button
                                            onClick={() => removeGalleryImage(idx)}
                                            style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                                            title="Hapus Foto"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {galleryImages.length === 0 && (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '2px dashed var(--border)', color: 'var(--text-secondary)' }}>
                                        <FiImage size={32} style={{ marginBottom: '12px', opacity: 0.5 }} /><br />
                                        Belum ada foto galeri. Klik "Tambah Foto" untuk mengunggah.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={saveSettings} style={{ alignSelf: 'flex-start' }}><FiSave /> Simpan Semua Pengaturan Landing Page</button>
                </div>
            )}

            {/* Fotocopy Prices */}
            {activeTab === 'fotocopy' && (
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FiFile style={{ fontSize: '1.2rem', color: 'var(--primary)' }} />
                            <h3 style={{ margin: 0 }}>Master Harga Fotocopy</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => {
                                const newId = 'fc' + Date.now();
                                const newItem = { id: newId, paper: 'HVS A4', color: 'bw', side: '1', price: 0, label: 'Baru' };
                                setFotocopyPrices([...fotocopyPrices, newItem]);
                            }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiPlus /> Tambah Aturan</button>
                            <button className="btn btn-primary" onClick={saveAllFotocopyPrices} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiSave /> Simpan Harga</button>
                        </div>
                    </div>
                    <div className="card-body">
                        {isMobile ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {fotocopyPrices.map((p, idx) => (
                                    <div key={p.id} style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Jenis Kertas</label>
                                                <select className="form-select" value={p.paper} onChange={(e) => {
                                                    const newPrices = [...fotocopyPrices];
                                                    newPrices[idx] = { ...newPrices[idx], paper: e.target.value };
                                                    setFotocopyPrices(newPrices);
                                                }} style={{ width: '100%', backgroundColor: 'var(--bg-primary)' }}>
                                                    {['HVS A4', 'HVS F4', 'HVS A3'].map(o => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Warna</label>
                                                <select className="form-select" value={p.color} onChange={(e) => {
                                                    const newPrices = [...fotocopyPrices];
                                                    newPrices[idx] = { ...newPrices[idx], color: e.target.value };
                                                    setFotocopyPrices(newPrices);
                                                }} style={{ width: '100%', backgroundColor: 'var(--bg-primary)' }}>
                                                    <option value="bw">Hitam Putih</option>
                                                    <option value="color">Berwarna</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Sisi</label>
                                                <select className="form-select" value={p.side} onChange={(e) => {
                                                    const newPrices = [...fotocopyPrices];
                                                    newPrices[idx] = { ...newPrices[idx], side: e.target.value };
                                                    setFotocopyPrices(newPrices);
                                                }} style={{ width: '100%', backgroundColor: 'var(--bg-primary)' }}>
                                                    <option value="1">1 Sisi</option>
                                                    <option value="2">Bolak-balik</option>
                                                </select>
                                            </div>
                                            <div style={{ flex: 1.5 }}>
                                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Harga (Rp)</label>
                                                <input type="number" className="form-input" value={p.price} onChange={(e) => {
                                                    const newPrices = [...fotocopyPrices];
                                                    newPrices[idx].price = e.target.value;
                                                    setFotocopyPrices(newPrices);
                                                }} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', fontWeight: 'bold' }} />
                                            </div>
                                            <button className="btn btn-secondary" style={{ color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px' }} onClick={() => {
                                                if (confirm(`Hapus harga ${p.paper} ${p.color === 'bw' ? 'B/W' : 'Warna'} ${p.side} Sisi?`)) {
                                                    setFotocopyPrices(fotocopyPrices.filter((_, i) => i !== idx));
                                                }
                                            }}><FiTrash2 /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table">
                                    <thead><tr><th>Jenis Kertas</th><th>Warna</th><th>Sisi</th><th>Harga (Rp) / Lembar</th><th>Aksi</th></tr></thead>
                                    <tbody>
                                        {fotocopyPrices.map((p, idx) => (
                                            <tr key={p.id}>
                                                <td data-label="Jenis Kertas">
                                                    <select className="form-select" value={p.paper} onChange={(e) => {
                                                        const newPrices = [...fotocopyPrices];
                                                        newPrices[idx] = { ...newPrices[idx], paper: e.target.value };
                                                        setFotocopyPrices(newPrices);
                                                    }} style={{ width: '130px' }}>
                                                        {['HVS A4', 'HVS F4', 'HVS A3'].map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                </td>
                                                <td data-label="Warna">
                                                    <select className="form-select" value={p.color} onChange={(e) => {
                                                        const newPrices = [...fotocopyPrices];
                                                        newPrices[idx] = { ...newPrices[idx], color: e.target.value };
                                                        setFotocopyPrices(newPrices);
                                                    }} style={{ width: '120px' }}>
                                                        <option value="bw">Hitam Putih</option>
                                                        <option value="color">Berwarna</option>
                                                    </select>
                                                </td>
                                                <td data-label="Sisi">
                                                    <select className="form-select" value={p.side} onChange={(e) => {
                                                        const newPrices = [...fotocopyPrices];
                                                        newPrices[idx] = { ...newPrices[idx], side: e.target.value };
                                                        setFotocopyPrices(newPrices);
                                                    }} style={{ width: '100px' }}>
                                                        <option value="1">1 Sisi</option>
                                                        <option value="2">Bolak-balik</option>
                                                    </select>
                                                </td>
                                                <td data-label="Harga">
                                                    <input type="number" className="form-input"
                                                        value={p.price}
                                                        onChange={(e) => {
                                                            const newPrices = [...fotocopyPrices];
                                                            newPrices[idx].price = e.target.value;
                                                            setFotocopyPrices(newPrices);
                                                        }}
                                                        style={{ width: '120px' }}
                                                    />
                                                </td>
                                                <td data-label="Aksi">
                                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => {
                                                        if (confirm(`Hapus harga ${p.paper} ${p.color === 'bw' ? 'B/W' : 'Warna'} ${p.side} Sisi?`)) {
                                                            setFotocopyPrices(fotocopyPrices.filter((_, i) => i !== idx));
                                                        }
                                                    }}><FiTrash2 /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px dashed var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3><FiPrinter /> Master Harga Jasa Print</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => {
                                        setPrintPrices([...printPrices, { id: Date.now().toString(), paper: 'HVS A4', color: 'bw', price: 0 }]);
                                    }}><FiPlus /> Tambah Aturan</button>
                                    <button className="btn btn-primary" onClick={saveSettings}><FiSave /> Simpan Harga Print</button>
                                </div>
                            </div>
                            {isMobile ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {printPrices.map((p, idx) => (
                                        <div key={p.id} style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Jenis Kertas</label>
                                                    <input className="form-input" value={p.paper} onChange={(e) => {
                                                        const newPrices = [...printPrices];
                                                        newPrices[idx] = { ...newPrices[idx], paper: e.target.value };
                                                        setPrintPrices(newPrices);
                                                    }} style={{ width: '100%', backgroundColor: 'var(--bg-primary)' }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Warna</label>
                                                    <select className="form-select" value={p.color} onChange={(e) => {
                                                        const newPrices = [...printPrices];
                                                        newPrices[idx] = { ...newPrices[idx], color: e.target.value };
                                                        setPrintPrices(newPrices);
                                                    }} style={{ width: '100%', backgroundColor: 'var(--bg-primary)' }}>
                                                        <option value="bw">Hitam Putih</option>
                                                        <option value="color">Berwarna</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                                <div style={{ flex: 1.5 }}>
                                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Harga (Rp)</label>
                                                    <input type="number" className="form-input" value={p.price} onChange={(e) => {
                                                        const newPrices = [...printPrices];
                                                        newPrices[idx].price = e.target.value;
                                                        setPrintPrices(newPrices);
                                                    }} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', fontWeight: 'bold' }} />
                                                </div>
                                                <button className="btn btn-secondary" style={{ color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px' }} onClick={() => {
                                                    if (confirm(`Hapus harga Print ${p.paper} ${p.color === 'bw' ? 'B/W' : 'Warna'}?`)) {
                                                        setPrintPrices(printPrices.filter((_, i) => i !== idx));
                                                    }
                                                }}><FiTrash2 /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead><tr><th>Jenis Kertas</th><th>Warna</th><th>Harga (Rp) / Lembar</th><th>Aksi</th></tr></thead>
                                        <tbody>
                                            {printPrices.map((p, idx) => (
                                                <tr key={p.id}>
                                                    <td data-label="Jenis Kertas">
                                                        <input className="form-input" value={p.paper} onChange={(e) => {
                                                            const newPrices = [...printPrices];
                                                            newPrices[idx] = { ...newPrices[idx], paper: e.target.value };
                                                            setPrintPrices(newPrices);
                                                        }} style={{ width: '150px' }} />
                                                    </td>
                                                    <td data-label="Warna">
                                                        <select className="form-select" value={p.color} onChange={(e) => {
                                                            const newPrices = [...printPrices];
                                                            newPrices[idx] = { ...newPrices[idx], color: e.target.value };
                                                            setPrintPrices(newPrices);
                                                        }} style={{ width: '120px' }}>
                                                            <option value="bw">Hitam Putih</option>
                                                            <option value="color">Berwarna</option>
                                                        </select>
                                                    </td>
                                                    <td data-label="Harga">
                                                        <input type="number" className="form-input"
                                                            value={p.price}
                                                            onChange={(e) => {
                                                                const newPrices = [...printPrices];
                                                                newPrices[idx].price = e.target.value;
                                                                setPrintPrices(newPrices);
                                                            }}
                                                            style={{ width: '120px' }}
                                                        />
                                                    </td>
                                                    <td data-label="Aksi">
                                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => {
                                                            if (confirm(`Hapus harga Print ${p.paper} ${p.color === 'bw' ? 'B/W' : 'Warna'}?`)) {
                                                                setPrintPrices(printPrices.filter((_, i) => i !== idx));
                                                            }
                                                        }}><FiTrash2 /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px dashed var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3><FiBook /> Master Harga Penjilidan</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => {
                                        setBindPrices([...bindPrices, { id: Date.now().toString(), name: '', price: 0 }]);
                                    }}><FiPlus /> Tambah Aturan</button>
                                    <button className="btn btn-primary" onClick={saveSettings}><FiSave /> Simpan Harga Jilid</button>
                                </div>
                            </div>
                            {isMobile ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {bindPrices.map((p, idx) => (
                                        <div key={p.id} style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                            <div style={{ marginBottom: '12px' }}>
                                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Jenis Jilid</label>
                                                <input className="form-input" value={p.name} onChange={(e) => {
                                                    const newPrices = [...bindPrices];
                                                    newPrices[idx] = { ...newPrices[idx], name: e.target.value };
                                                    setBindPrices(newPrices);
                                                }} style={{ width: '100%', backgroundColor: 'var(--bg-primary)' }} placeholder="Nama jenis jilid" />
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                                <div style={{ flex: 1.5 }}>
                                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Harga (Rp)</label>
                                                    <input type="number" className="form-input" value={p.price} onChange={(e) => {
                                                        const newPrices = [...bindPrices];
                                                        newPrices[idx].price = e.target.value;
                                                        setBindPrices(newPrices);
                                                    }} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', fontWeight: 'bold' }} />
                                                </div>
                                                <button className="btn btn-secondary" style={{ color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px' }} onClick={() => {
                                                    if (confirm(`Hapus jilid "${p.name}"?`)) {
                                                        setBindPrices(bindPrices.filter((_, i) => i !== idx));
                                                    }
                                                }}><FiTrash2 /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead><tr><th>Jenis Jilid</th><th>Harga (Rp) / Buku</th><th>Aksi</th></tr></thead>
                                        <tbody>
                                            {bindPrices.map((p, idx) => (
                                                <tr key={p.id}>
                                                    <td data-label="Jenis Jilid">
                                                        <input className="form-input" value={p.name} onChange={(e) => {
                                                            const newPrices = [...bindPrices];
                                                            newPrices[idx] = { ...newPrices[idx], name: e.target.value };
                                                            setBindPrices(newPrices);
                                                        }} style={{ width: '250px' }} placeholder="Nama jenis jilid" />
                                                    </td>
                                                    <td data-label="Harga">
                                                        <input type="number" className="form-input"
                                                            value={p.price}
                                                            onChange={(e) => {
                                                                const newPrices = [...bindPrices];
                                                                newPrices[idx].price = e.target.value;
                                                                setBindPrices(newPrices);
                                                            }}
                                                            style={{ width: '150px' }}
                                                        />
                                                    </td>
                                                    <td data-label="Aksi">
                                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => {
                                                            if (confirm(`Hapus jilid "${p.name}"?`)) {
                                                                setBindPrices(bindPrices.filter((_, i) => i !== idx));
                                                            }
                                                        }}><FiTrash2 /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px dashed var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3><FiTag /> Aturan Diskon Grosir Fotocopy</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => {
                                        setFcDiscounts([...fcDiscounts, { id: Date.now().toString(), minQty: 0, discountPerSheet: 0 }]);
                                    }}><FiPlus /> Tambah Aturan</button>
                                    <button className="btn btn-primary" onClick={saveSettings}><FiSave /> Simpan Diskon</button>
                                </div>
                            </div>
                            {isMobile ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {fcDiscounts.map((d, idx) => (
                                        <div key={d.id} style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                            <div style={{ marginBottom: '12px' }}>
                                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Minimal Jumlah / Lembar ({'>='})</label>
                                                <input type="number" className="form-input" value={d.minQty} onChange={(e) => {
                                                    const newDiscounts = [...fcDiscounts];
                                                    newDiscounts[idx].minQty = e.target.value;
                                                    setFcDiscounts(newDiscounts);
                                                }} style={{ width: '100%', backgroundColor: 'var(--bg-primary)' }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                                <div style={{ flex: 1.5 }}>
                                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Potongan Harga (Rp) / Lbr</label>
                                                    <input type="number" className="form-input" value={d.discountPerSheet} onChange={(e) => {
                                                        const newDiscounts = [...fcDiscounts];
                                                        newDiscounts[idx].discountPerSheet = e.target.value;
                                                        setFcDiscounts(newDiscounts);
                                                    }} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', fontWeight: 'bold' }} />
                                                </div>
                                                <button className="btn btn-secondary" style={{ color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px' }} onClick={() => {
                                                    const newDiscounts = fcDiscounts.filter((_, i) => i !== idx);
                                                    setFcDiscounts(newDiscounts);
                                                }}><FiTrash2 /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {fcDiscounts.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Belum ada aturan diskon tercatat.</div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead><tr><th>Minimal Jumlah / Lembar ({'>='})</th><th>Potongan Harga (Rp) / Lembar</th><th>Aksi</th></tr></thead>
                                        <tbody>
                                            {fcDiscounts.map((d, idx) => (
                                                <tr key={d.id}>
                                                    <td data-label="Min. Jumlah / Lbr">
                                                        <input type="number" className="form-input"
                                                            value={d.minQty}
                                                            onChange={(e) => {
                                                                const newDiscounts = [...fcDiscounts];
                                                                newDiscounts[idx].minQty = e.target.value;
                                                                setFcDiscounts(newDiscounts);
                                                            }}
                                                            style={{ width: '150px' }}
                                                        />
                                                    </td>
                                                    <td data-label="Potongan (Rp) / Lbr">
                                                        <input type="number" className="form-input"
                                                            value={d.discountPerSheet}
                                                            onChange={(e) => {
                                                                const newDiscounts = [...fcDiscounts];
                                                                newDiscounts[idx].discountPerSheet = e.target.value;
                                                                setFcDiscounts(newDiscounts);
                                                            }}
                                                            style={{ width: '150px' }}
                                                        />
                                                    </td>
                                                    <td data-label="Aksi">
                                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => {
                                                            const newDiscounts = fcDiscounts.filter((_, i) => i !== idx);
                                                            setFcDiscounts(newDiscounts);
                                                        }}><FiTrash2 /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {fcDiscounts.length === 0 && (
                                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '16px' }}>Belum ada aturan diskon tercatat.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius)' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--info)' }}>
                                <FiInfo /> <strong>Catatan:</strong><br />
                                Diskon volume akan otomatis memotong harga per-lembar saat <strong>Fotocopy</strong> mencapai target kuantitas di atas. Pastikan mengurutkannya mulai dari lembar paling tinggi untuk hasil pemotongan diskon yang maksimal.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Users */}
            {activeTab === 'users' && (
                <div className="card">
                    <div className="card-header">
                        <h3><FiUsers /> Manajemen User</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => { setEditUser(null); setUserForm({ name: '', username: '', password: '', role: 'kasir', isActive: true }); setUserFormOpen(true); }}><FiPlus /> Tambah</button>
                    </div>
                    <div style={{ overflow: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>Nama</th><th>Username</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td><strong>{u.name}</strong></td>
                                        <td>{u.username}</td>
                                        <td><span className="badge badge-primary">{u.role}</span></td>
                                        <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                                        <td><button className="btn btn-ghost btn-sm" onClick={() => { setEditUser(u); setUserForm({ ...u, password: '' }); setUserFormOpen(true); }}><FiEdit /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Printer & Nota */}
            {activeTab === 'printer' && (
                <div className="printer-settings-grid">
                    {/* Left Column */}
                    <div className="ps-main">
                        {/* Hardware Settings */}
                        <div className="ps-section">
                            <div className="ps-section-header">
                                <div className="ps-section-icon"><FiPrinter /></div>
                                <h3>Pengaturan Perangkat Keras</h3>
                            </div>

                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>Tipe Printer & Kertas Nota</label>
                            <div className="ps-type-grid">
                                {[
                                    { id: '58mm', icon: <FiFileText />, title: 'Thermal 58mm', desc: 'Printer POS kecil' },
                                    { id: '80mm', icon: <FiFileText />, title: 'Thermal 80mm', desc: 'Printer POS standar' },
                                    { id: 'lx310', icon: <FiPrinter />, title: 'Dot Matrix LX310', desc: 'Kertas continuous 12×14cm' },
                                    { id: 'inkjet', icon: <FiPrinter />, title: 'Inkjet / Laser', desc: 'Ukuran A4 / A5 / Folio' },
                                ].map(t => (
                                    <button key={t.id} className={`ps-type-card ${printerSize === t.id ? 'selected' : ''}`} onClick={() => setPrinterSize(t.id)}>
                                        <span className="ps-type-icon">{t.icon}</span>
                                        <div className="ps-type-info">
                                            <h4>{t.title}</h4>
                                            <p>{t.desc}</p>
                                        </div>
                                        <span className="ps-type-check"><FiCheckCircle /></span>
                                    </button>
                                ))}
                            </div>

                            {printerSize === 'inkjet' && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>Ukuran Kertas</label>
                                    <div className="ps-size-pills">
                                        {['A5', 'A4', 'Folio'].map(sz => (
                                            <button key={sz} className={`ps-size-pill ${paperSize === sz ? 'active' : ''}`} onClick={() => setPaperSize(sz)}>{sz}</button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="ps-toggle-info">
                                <span>Cetak Struk Otomatis setelah Pembayaran</span>
                                <span>Memicu pencetakan secara otomatis saat transaksi selesai</span>
                            </div>
                            <label className="ps-switch">
                                <input type="checkbox" checked={autoPrint} onChange={e => setAutoPrint(e.target.checked)} />
                                <span className="ps-switch-slider"></span>
                            </label>
                        </div>

                        <div className="ps-direct-print" style={{ marginTop: '16px' }}>
                            <label><FiZap /> Mode Cetak Cepat (Direct Print)</label>
                            <p>Struk dikirim langsung ke hardware printer tanpa dialog browser (Silent Print).</p>
                            <select className="form-select" style={{ width: '100%' }} value={printerName} onChange={e => setPrinterName(e.target.value)}>
                                <option value="">Cetak via Dialog Browser (Bawaan PDF)</option>
                                {systemPrinters.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        {/* Branding Header & Footer */}
                        <div className="ps-section">
                            <div className="ps-section-header">
                                <div className="ps-section-icon"><FiEdit /></div>
                                <h3>Branding Header & Footer</h3>
                            </div>
                            <div className="ps-form-grid">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="ps-form-group">
                                        <label>Nama Toko</label>
                                        <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} />
                                    </div>
                                    <div className="ps-form-group">
                                        <label>Alamat</label>
                                        <textarea rows="2" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} />
                                    </div>
                                    <div className="ps-form-group">
                                        <label>Nomor Telepon</label>
                                        <input type="text" value={storePhone} onChange={e => setStorePhone(e.target.value)} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="ps-form-group">
                                        <label>Pesan Kaki (Footer Struk)</label>
                                        <textarea rows="2" value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} placeholder="Terima kasih telah berbelanja!" />
                                    </div>
                                    <div className="ps-form-group">
                                        <label className="ps-logo-drop">
                                            {storeLogo ? (
                                                <img src={storeLogo} alt="Logo" className="ps-logo-preview" />
                                            ) : (
                                                <span className="drop-icon"><FiUpload /></span>
                                            )}
                                            <p>{storeLogo ? 'Klik untuk ganti logo' : 'Unggah Logo (PNG/JPG, maks 500KB)'}</p>
                                            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Digital Receipts */}
                        <div className="ps-section">
                            <div className="ps-section-header">
                                <div className="ps-section-icon"><FiMessageCircle /></div>
                                <h3>Struk Digital</h3>
                            </div>
                            <div className="ps-digital-grid">
                                <div className="ps-digital-card">
                                    <div className="ps-digital-icon whatsapp"><FiMessageCircle /></div>
                                    <div className="ps-digital-content">
                                        <div className="d-header">
                                            <h4>Struk WhatsApp</h4>
                                            <label className="ps-switch" style={{ transform: 'scale(0.8)' }}>
                                                <input type="checkbox" defaultChecked />
                                                <span className="ps-switch-slider" style={{ backgroundColor: 'var(--border)' }}></span>
                                            </label>
                                        </div>
                                        <p>Kirim struk PDF melalui API WhatsApp</p>
                                    </div>
                                </div>
                                <div className="ps-digital-card">
                                    <div className="ps-digital-icon email"><FiFileText /></div>
                                    <div className="ps-digital-content">
                                        <div className="d-header">
                                            <h4>Struk Email</h4>
                                            <label className="ps-switch" style={{ transform: 'scale(0.8)' }}>
                                                <input type="checkbox" />
                                                <span className="ps-switch-slider"></span>
                                            </label>
                                        </div>
                                        <p>Kirim struk ke alamat email pelanggan</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn btn-primary" onClick={saveSettings}><FiSave /> Simpan Perubahan</button>
                            <button className="btn btn-secondary" onClick={async () => {
                                const W = printerSize === 'lx310' ? 36 : printerSize === 'inkjet' ? 60 : printerSize === '80mm' ? 42 : 32;
                                const M = printerSize === 'lx310' ? '  ' : '';
                                const pad = (label, val) => {
                                    const sp = W - label.length - val.length;
                                    return label + ' '.repeat(sp > 0 ? sp : 1) + val;
                                };
                                const center = (str) => {
                                    const p = Math.max(0, Math.floor((W - str.length) / 2));
                                    return ' '.repeat(p) + str;
                                };
                                const lines = [
                                    center(storeName || 'NAMA TOKO'),
                                    center(storeAddress || 'Alamat toko'),
                                    center('Telp: ' + (storePhone || '-')),
                                ];
                                if (printerSize === 'lx310' || printerSize === 'inkjet') {
                                    lines.push('='.repeat(W), center('NOTA PEMBAYARAN'), '='.repeat(W));
                                } else {
                                    lines.push('-'.repeat(W));
                                }
                                lines.push(
                                    `No      : TEST-${Date.now().toString(36).toUpperCase()}`,
                                    `Tanggal : ${new Date().toLocaleString('id-ID')}`,
                                    `Kasir   : Admin`,
                                    '-'.repeat(W),
                                    'Kertas HVS A4',
                                    pad('  10x Rp 500', 'Rp 5.000'),
                                    'Pulpen Pilot',
                                    pad('  1x Rp 3.000', 'Rp 3.000'),
                                    '-'.repeat(W),
                                    pad('TOTAL    :', 'Rp 8.000'),
                                    pad('BAYAR    :', 'Rp 10.000'),
                                    pad('KEMBALI  :', 'Rp 2.000'),
                                    pad('Metode   :', 'TUNAI'),
                                    '-'.repeat(W),
                                    center(receiptFooter || 'Terima kasih!'),
                                    '',
                                    `Dicetak: ${new Date().toLocaleString('id-ID')}`,
                                );
                                let testText = lines.map(l => M + l).join('\n') + '\n';
                                if (printerSize === 'lx310') {
                                    testText += '\n\n\n\n';
                                } else if (printerSize !== 'inkjet') {
                                    testText += '\n\n\n';
                                }
                                if (window.innerWidth < 1024) {
                                    printViaRawBT(testText);
                                    showToast('Draft dikirim ke aplikasi Bluetooth Printer', 'success');
                                    return;
                                }

                                if (printerName) {
                                    try {
                                        const payload = { text: testText, printerName };
                                        if (printerSize === 'lx310') payload.raw = true;
                                        else if (printerSize === 'inkjet') { payload.mode = 'inkjet'; payload.paperSize = paperSize; }
                                        await api.post('/print/receipt', payload);
                                        showToast(`Test print berhasil dikirim ke ${printerName}!`, 'success');
                                    } catch (err) {
                                        showToast(err.response?.data?.message || 'Gagal mengirim test print', 'error');
                                    }
                                } else {
                                    showToast('Pilih printer dulu di dropdown Direct Print', 'error');
                                }
                            }}><FiActivity /> Cetak Uji Coba</button>
                        </div>
                    </div>

                    {/* Right Column: Live Preview */}
                    <div className="ps-section ps-preview-panel">
                        <h3><FiEye /> Pratinjau Langsung</h3>
                        <div className="ps-receipt-frame">
                            <div className="ps-receipt">
                                <div className="r-logo">
                                    {storeLogo ? <img src={storeLogo} alt="Logo" /> : <FiPrinter style={{ color: '#94a3b8', fontSize: '16px' }} />}
                                </div>
                                <div className="r-store">{storeName || 'NAMA TOKO'}</div>
                                <div className="r-addr">{storeAddress || 'Alamat toko'}</div>
                                <div className="r-phone">TELP: {storePhone || '-'}</div>
                                <hr className="r-divider" />
                                <div className="r-meta">
                                    <span>{new Date().toLocaleDateString('id-ID')}</span>
                                    <span>#INV-9823</span>
                                </div>
                                <hr className="r-divider" />
                                <div className="r-item"><span>Fotokopi (50 x 500)</span><span>25.000</span></div>
                                <div className="r-item"><span>Kertas A4 (Rim)</span><span>55.000</span></div>
                                <div className="r-item"><span>Jasa Penjilidan</span><span>15.000</span></div>
                                <hr className="r-divider" />
                                <div className="r-total"><span>Total</span><span>95.000</span></div>
                                <hr className="r-divider" />
                                <div className="r-footer">{receiptFooter || 'Terima kasih telah berbelanja!'}</div>
                            </div>
                        </div>
                        <p className="ps-preview-label">
                            Pratinjau format {printerSize === '58mm' ? 'Thermal 58mm' : printerSize === '80mm' ? 'Thermal 80mm' : printerSize === 'lx310' ? 'Dot Matrix' : `Inkjet ${paperSize}`}
                        </p>
                    </div>
                </div>
            )}

            {/* Activity Log */}
            {activeTab === 'log' && (
                <div className="card">
                    <div className="card-header"><h3><FiEdit /> Log Aktivitas </h3></div>
                    <div style={{ overflow: 'auto', maxHeight: '500px' }}>
                        <table className="data-table">
                            <thead><tr><th>Waktu</th><th>User</th><th>Aksi</th><th>Detail</th></tr></thead>
                            <tbody>
                                {activityLog.map(l => (
                                    <tr key={l.id}><td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(l.timestamp)}</td><td>{l.userName}</td><td><span className="badge badge-info">{l.action}</span></td><td>{l.detail}</td></tr>
                                ))}
                                {activityLog.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada aktivitas</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Backup & Restore */}
            {activeTab === 'backup' && (
                <div>
                    <div className="dashboard-grid">
                        <div className="card">
                            <div className="card-header"><h3><FiSave /> Backup Data</h3></div>
                            <div className="card-body">
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Export seluruh data POS ke file JSON. Simpan file ini sebagai backup.</p>
                                <button className="btn btn-primary btn-block" onClick={handleBackup}><FiDownload /> Download Backup</button>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header"><h3><FiUpload /> Restore Data</h3></div>
                            <div className="card-body">
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Import data dari file backup JSON. Data saat ini akan ditimpa.</p>
                                <label className="btn btn-warning btn-block" style={{ textAlign: 'center' }}>
                                    <FiFolder /> Pilih File Backup
                                    <input type="file" accept=".json" onChange={handleRestore} style={{ display: 'none' }} />
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ marginTop: '16px' }}>
                        <div className="card-header"><h3><FiAlertCircle /> Reset Data</h3></div>
                        <div className="card-body">
                            <p style={{ fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '16px' }}>Hapus semua data dan kembalikan ke data awal (demo). Tindakan ini tidak dapat dibatalkan!</p>
                            <button className="btn btn-danger" onClick={resetData}><FiTrash2 /> Reset Semua Data</button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Form Modal */}
            <Modal isOpen={userFormOpen} onClose={() => setUserFormOpen(false)} title={editUser ? <><FiEdit /> Edit User</> : <><FiPlus /> User Baru</>}>
                <div className="form-group"><label className="form-label">Nama</label><input className="form-input" value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Username</label><input className="form-input" value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Password {editUser && '(kosongkan jika tidak diubah)'}</label><input className="form-input" type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} /></div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Role</label>
                        <select className="form-select" value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
                            <option value="admin">Admin</option>
                            <option value="kasir">Kasir</option>
                            <option value="operator"><FiPrinter /> Operator</option>
                            <option value="teknisi"><FiTool /> Teknisi</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={userForm.isActive} onChange={e => setUserForm(f => ({ ...f, isActive: e.target.value === 'true' }))}>
                            <option value="true">Aktif</option>
                            <option value="false">Nonaktif</option>
                        </select>
                    </div>
                </div>
                <button className="btn btn-primary btn-block" onClick={handleSaveUser}><FiSave /> Simpan</button>
            </Modal>
        </div>
    );
}
