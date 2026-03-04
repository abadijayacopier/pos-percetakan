import { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import { formatRupiah } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import { FiSettings, FiFile, FiUsers, FiPrinter, FiEdit, FiTrash2, FiPlus, FiSave, FiPackage, FiTool, FiDollarSign, FiFileText, FiSearch, FiClock, FiCheckCircle, FiAlertCircle, FiX, FiDownload, FiUpload, FiRefreshCw, FiCheck, FiTruck, FiCalendar, FiMessageCircle, FiHome, FiBriefcase, FiStar, FiBox, FiActivity, FiLayers, FiList, FiChevronRight, FiChevronDown, FiEye, FiFolder } from 'react-icons/fi';

export default function InventoryPage() {
    const { user } = useAuth();
    const { showToast } = useToast();

    const margin = (buy, sell) => {
        if (!buy || buy === 0) return 100;
        return Math.round(((sell - buy) / buy) * 100);
    };

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('all');
    const [filterStock, setFilterStock] = useState('all');

    // Tab State
    const [activeTab, setActiveTab] = useState('products');

    // Modals & Forms
    const [formOpen, setFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [stockInOpen, setStockInOpen] = useState(false);
    const [opnameOpen, setOpnameOpen] = useState(false);
    const [stockProduct, setStockProduct] = useState(null);
    const [stockQty, setStockQty] = useState('');

    const [form, setForm] = useState({ code: '', name: '', categoryId: '', buyPrice: '', sellPrice: '', stock: '', minStock: '', unit: 'pcs', emoji: '📦' });
    const [newCategoryMode, setNewCategoryMode] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryEmoji, setNewCategoryEmoji] = useState('📁');
    const [newUnitMode, setNewUnitMode] = useState(false);

    // Supplier State
    const [suppliers, setSuppliers] = useState([]);
    const [supplierFormOpen, setSupplierFormOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [supplierForm, setSupplierForm] = useState({ name: '', contact: '', address: '' });

    const fetchData = async () => {
        try {
            const [prodRes, catRes, supRes] = await Promise.all([
                api.get('/products'),
                api.get('/products/categories'),
                api.get('/suppliers').catch(() => ({ data: [] }))
            ]);
            setProducts(prodRes.data);
            setCategories(catRes.data);
            setSuppliers(supRes.data || []);
        } catch (error) {
            console.error('Inventory Fetch Error:', error, error.response?.data);
            showToast('Gagal memuat data inventori: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const refreshProducts = fetchData;

    const handleSaveNewCategory = async () => {
        if (!newCategoryName) { showToast('Nama kategori harus diisi', 'warning'); return; }
        try {
            const res = await api.post('/products/categories', { name: newCategoryName, emoji: newCategoryEmoji });
            setCategories([...categories, { id: res.data.id, name: newCategoryName, emoji: newCategoryEmoji }]);
            setForm(f => ({ ...f, categoryId: res.data.id }));
            setNewCategoryMode(false);
            setNewCategoryName('');
            showToast('Kategori baru ditambahkan!', 'success');
        } catch (error) { showToast('Gagal menambah kategori', 'error'); }
    };

    const filteredProducts = useMemo(() => {
        let items = products;
        if (filterCat !== 'all') items = items.filter(p => p.categoryId === filterCat);
        if (filterStock === 'low') items = items.filter(p => p.stock <= p.minStock);
        if (filterStock === 'empty') items = items.filter(p => p.stock === 0);
        if (search) {
            const q = search.toLowerCase();
            items = items.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
        }
        return items;
    }, [products, filterCat, filterStock, search]);

    const totalValue = products.reduce((s, p) => s + p.buyPrice * p.stock, 0);
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

    const openEdit = (p) => { setEditingProduct(p); setForm(p); setFormOpen(true); };
    const openNew = () => { setEditingProduct(null); setForm({ code: '', name: '', categoryId: '', buyPrice: '', sellPrice: '', stock: '', minStock: '', unit: 'pcs', emoji: '📦' }); setFormOpen(true); };

    const handleSave = async () => {
        if (!form.name || !form.sellPrice || !form.code) { showToast('Kode, nama, dan harga jual wajib diisi!', 'warning'); return; }
        const data = { ...form, buyPrice: parseInt(form.buyPrice) || 0, sellPrice: parseInt(form.sellPrice) || 0, stock: parseInt(form.stock) || 0, minStock: parseInt(form.minStock) || 0 };
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, data);
                showToast('Produk berhasil diupdate!', 'success');
            } else {
                await api.post('/products', data);
                showToast('Produk baru berhasil ditambahkan!', 'success');
            }
            refreshProducts();
            setFormOpen(false);
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal menyimpan produk', 'error');
        }
    };

    const handleDelete = async (p) => {
        if (confirm(`Hapus ${p.name}?`)) {
            try {
                await api.delete(`/products/${p.id}`);
                refreshProducts();
                showToast('Produk dihapus!', 'success');
            } catch (error) {
                showToast(error.response?.data?.message || 'Gagal menghapus produk', 'error');
            }
        }
    };

    const handleStockIn = () => {
        // [Fungsi Lama yang sebelumnya direct DB] - Akan kita ganti jadi pakai edit stock atau opname
        showToast('Fitur ini akan digantikan oleh Stok Opname', 'info');
    };

    const handleOpname = async () => {
        const qty = parseInt(stockQty);
        if (isNaN(qty) || qty < 0) { showToast('Masukkan angka stok aktual yang valid!', 'warning'); return; }

        try {
            const res = await api.post(`/products/${stockProduct.id}/opname`, { actualStock: qty });
            showToast(res.data.message, 'success');
            refreshProducts();
            setOpnameOpen(false);
            setStockQty('');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal menyimpan stok opname', 'error');
        }
    };

    // ----- SUPPLIER FUNCTIONS -----
    const openNewSupplier = () => { setEditingSupplier(null); setSupplierForm({ name: '', contact: '', address: '' }); setSupplierFormOpen(true); };
    const openEditSupplier = (s) => { setEditingSupplier(s); setSupplierForm({ name: s.name, contact: s.contact, address: s.address }); setSupplierFormOpen(true); };

    const handleSaveSupplier = async () => {
        if (!supplierForm.name) { showToast('Nama Supplier wajib diisi!', 'warning'); return; }
        try {
            if (editingSupplier) {
                await api.put(`/suppliers/${editingSupplier.id}`, supplierForm);
                showToast('Supplier diupdate!', 'success');
            } else {
                await api.post('/suppliers', supplierForm);
                showToast('Supplier ditambahkan!', 'success');
            }
            fetchData();
            setSupplierFormOpen(false);
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal menyimpan supplier', 'error');
        }
    };

    const handleDeleteSupplier = async (s) => {
        if (confirm(`Hapus supplier ${s.name}?`)) {
            try {
                await api.delete(`/suppliers/${s.id}`);
                fetchData();
                showToast('Supplier dihapus!', 'success');
            } catch (error) {
                showToast(error.response?.data?.message || 'Gagal menghapus supplier', 'error');
            }
        }
    };

    return (
        <div className="premium-page-wrapper">
            {/* TABS */}
            <div className="tabs" style={{ marginBottom: '20px' }}>
                <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}><FiPackage /> Data Produk</button>
                <button className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`} onClick={() => setActiveTab('suppliers')}><FiBriefcase /> Data Supplier</button>
            </div>

            {activeTab === 'products' && (
                <>
                    <div className="stats-grid" style={{ marginBottom: '16px' }}>
                        <div className="stat-card"><div className="stat-icon green"><FiPackage /></div><div className="stat-value">{products.length}</div><div className="stat-label">Total Produk</div></div>
                        <div className="stat-card"><div className="stat-icon yellow"><FiAlertCircle /></div><div className="stat-value">{lowStockCount}</div><div className="stat-label">Stok Menipis</div></div>
                        <div className="stat-card"><div className="stat-icon purple"><FiDollarSign /></div><div className="stat-value">{formatRupiah(totalValue)}</div><div className="stat-label">Nilai Inventori</div></div>
                    </div>

                    <div className="page-toolbar">
                        <div className="filter-group">
                            <div style={{ position: 'relative', width: '250px' }}>
                                <input className="form-input" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: '32px' }} />
                                <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            </div>
                            <select className="form-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                                <option value="all">Semua Kategori</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select className="form-select" value={filterStock} onChange={e => setFilterStock(e.target.value)}>
                                <option value="all">Semua Stok</option>
                                <option value="low">Stok Menipis</option>
                                <option value="empty">Stok Habis</option>
                            </select>
                        </div>
                        <button className="btn btn-primary" onClick={openNew}><FiPlus /> Tambah Produk</button>
                    </div>

                    <div className="card">
                        <div style={{ overflow: 'auto' }}>
                            <table className="data-table">
                                <thead><tr><th></th><th>Kode</th><th>Nama Produk</th><th>Kategori</th><th>Harga Beli</th><th>Harga Jual</th><th>Margin</th><th>Stok</th><th>Min</th><th>Status</th><th>Aksi</th></tr></thead>
                                <tbody>
                                    {filteredProducts.map(p => (
                                        <tr key={p.id}>
                                            <td>{p.emoji}</td>
                                            <td><code>{p.code}</code></td>
                                            <td><strong>{p.name}</strong></td>
                                            <td>{categories.find(c => c.id === p.categoryId)?.name || '-'}</td>
                                            <td>{formatRupiah(p.buyPrice)}</td>
                                            <td style={{ color: 'var(--primary)', fontWeight: '600' }}>{formatRupiah(p.sellPrice)}</td>
                                            <td><span className="badge badge-success">{margin(p.buyPrice, p.sellPrice)}%</span></td>
                                            <td><strong>{p.stock}</strong> {p.unit}</td>
                                            <td>{p.minStock}</td>
                                            <td><span className={`badge ${p.stock === 0 ? 'badge-danger' : p.stock <= p.minStock ? 'badge-warning' : 'badge-success'}`}>{p.stock === 0 ? 'Habis' : p.stock <= p.minStock ? 'Menipis' : 'OK'}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => { setStockProduct(p); setStockQty(p.stock); setOpnameOpen(true); }} title="Cek & Sesuaikan Stok Opname"><FiSearch /></button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} title="Edit"><FiEdit /></button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p)} title="Hapus"><FiTrash2 /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Product Form */}
                    <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingProduct ? <><FiEdit /> Edit Produk</> : <><FiPlus /> Produk Baru</>}>
                        <div className="form-row">
                            <div className="form-group"><label className="form-label">Kode</label><input className="form-input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="ATK-001" /></div>
                            <div className="form-group">
                                <label className="form-label">Emoji</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input className="form-input" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} style={{ width: '60px', textAlign: 'center', fontSize: '1.2rem' }} />
                                    <select
                                        className="form-select"
                                        style={{ width: '60px', padding: '0 8px', fontSize: '1.2rem' }}
                                        value=""
                                        onChange={e => {
                                            if (e.target.value) setForm(f => ({ ...f, emoji: e.target.value }));
                                        }}
                                    >
                                        <option value="" disabled>Pilih</option>
                                        {['📦', '📄', '✏️', '✂️', '🖥️', '🔋', '💼', '📖', '🏷️', '📁', '🖨️'].map(emj => (
                                            <option key={emj} value={emj}>{emj}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="form-group"><label className="form-label">Nama Produk</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                        <div className="form-row">
                            <div className="form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <label className="form-label" style={{ margin: 0 }}>Kategori</label>
                                    <button className="btn btn-ghost btn-sm" style={{ padding: '0 4px', fontSize: '0.7rem', color: 'var(--primary)' }} onClick={() => setNewCategoryMode(!newCategoryMode)}>
                                        {newCategoryMode ? 'Batal' : '+ Kategori Baru'}
                                    </button>
                                </div>
                                {newCategoryMode ? (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input className="form-input" placeholder="📁" value={newCategoryEmoji} onChange={e => setNewCategoryEmoji(e.target.value)} style={{ width: '60px' }} />
                                        <input className="form-input" placeholder="Nama Kategori" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                                        <button className="btn btn-primary" onClick={handleSaveNewCategory}><FiCheck /></button>
                                    </div>
                                ) : (
                                    <select className="form-select" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                                        <option value="">Pilih Kategori</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                                    </select>
                                )}
                            </div>
                            <div className="form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <label className="form-label" style={{ margin: 0 }}>Satuan</label>
                                    <button className="btn btn-ghost btn-sm" style={{ padding: '0 4px', fontSize: '0.7rem', color: 'var(--primary)' }} onClick={() => setNewUnitMode(!newUnitMode)}>
                                        {newUnitMode ? 'Pilih' : 'Ketik Manual'}
                                    </button>
                                </div>
                                {newUnitMode ? (
                                    <input className="form-input" placeholder="Ketik satuan baru..." value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                                ) : (
                                    <select className="form-select" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                                        {[...new Set(['pcs', 'rim', 'box', 'lusin', 'pack', 'roll', 'set', form.unit])].map(u => <option key={u}>{u}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label className="form-label">Harga Beli</label><input className="form-input" type="number" value={form.buyPrice} onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))} /></div>
                            <div className="form-group"><label className="form-label">Harga Jual</label><input className="form-input" type="number" value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))} /></div>
                        </div>
                        {form.buyPrice && form.sellPrice && <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '8px' }}>Margin: {margin(parseInt(form.buyPrice), parseInt(form.sellPrice))}%</div>}
                        <div className="form-row">
                            <div className="form-group"><label className="form-label">Stok</label><input className="form-input" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
                            <div className="form-group"><label className="form-label">Stok Minimum</label><input className="form-input" type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} /></div>
                        </div>
                        <button className="btn btn-primary btn-block" onClick={handleSave}><FiSave /> Simpan</button>
                    </Modal>

                    {/* Opname Modal */}
                    <Modal isOpen={opnameOpen} onClose={() => setOpnameOpen(false)} title={`<FiSearch /> Stok Opname: ${stockProduct?.name || ''}`}>
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Stok di Sistem / Database</div>
                            <div style={{ fontSize: '2rem', fontWeight: '800' }}>{stockProduct?.stock} {stockProduct?.unit}</div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ color: 'var(--primary)' }}>Cek Fisik Gudang / Toko (Stok Aktual)</label>
                            <input className="form-input" type="number" value={stockQty} onChange={e => setStockQty(e.target.value)} placeholder="0" style={{ fontSize: '1.3rem', textAlign: 'center', fontWeight: '700', border: '2px solid var(--primary)' }} autoFocus />
                            <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                Selisih: <strong style={{ color: (parseInt(stockQty) - stockProduct?.stock) < 0 ? 'var(--danger)' : 'var(--success)' }}>{(parseInt(stockQty) - stockProduct?.stock) || 0}</strong> {stockProduct?.unit}
                            </p>
                        </div>
                        <button className="btn btn-primary btn-block" onClick={handleOpname}><FiCheck /> Simpan Penyesuaian Stok</button>
                    </Modal>
                </>
            )}

            {/* ----- TAB SUPPLIER ----- */}
            {activeTab === 'suppliers' && (
                <>
                    <div className="page-toolbar">
                        <h3>Daftar Supplier</h3>
                        <button className="btn btn-primary" onClick={openNewSupplier}><FiPlus /> Tambah Supplier</button>
                    </div>

                    <div className="card">
                        <div style={{ overflow: 'auto' }}>
                            <table className="data-table">
                                <thead><tr><th>Nama Supplier</th><th>Kontak / Telp</th><th>Alamat</th><th>Aksi</th></tr></thead>
                                <tbody>
                                    {suppliers.length === 0 ? <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Belum ada data supplier.</td></tr> : null}
                                    {suppliers.map(s => (
                                        <tr key={s.id}>
                                            <td><strong>{s.name}</strong></td>
                                            <td>{s.contact || '-'}</td>
                                            <td>{s.address || '-'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => openEditSupplier(s)}><FiEdit /></button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteSupplier(s)}><FiTrash2 /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Supplier Form */}
                    <Modal isOpen={supplierFormOpen} onClose={() => setSupplierFormOpen(false)} title={editingSupplier ? <><FiEdit /> Edit Supplier</> : <><FiPlus /> Supplier Baru</>}>
                        <div className="form-group"><label className="form-label">Nama Supplier</label>
                            <input className="form-input" value={supplierForm.name} onChange={e => setSupplierForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                        </div>
                        <div className="form-group"><label className="form-label">Kontak / Telepon</label>
                            <input className="form-input" value={supplierForm.contact} onChange={e => setSupplierForm(f => ({ ...f, contact: e.target.value }))} />
                        </div>
                        <div className="form-group"><label className="form-label">Alamat Lengkap</label>
                            <textarea className="form-textarea" value={supplierForm.address} onChange={e => setSupplierForm(f => ({ ...f, address: e.target.value }))} />
                        </div>
                        <button className="btn btn-primary btn-block" onClick={handleSaveSupplier}><FiSave /> Simpan Supplier</button>
                    </Modal>
                </>
            )}
        </div>
    );
}
