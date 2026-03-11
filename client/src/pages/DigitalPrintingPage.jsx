import { useState, useEffect } from 'react';
import db from '../db';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { FiEye, FiEdit2, FiTrash2, FiSave, FiX, FiCheckCircle } from 'react-icons/fi';

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const fmt = (n) => 'Rp ' + Math.floor(n || 0).toLocaleString('id-ID');
const pad = (n) => String(n).padStart(2, '0');
const hms = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE: DASHBOARD ALUR KERJA
───────────────────────────────────────────────────────────────────────────── */
export default function DigitalPrintingPage({ onNavigate }) {
    const { user } = useAuth();
    const [stats, setStats] = useState({ menunggu: 0, cetak: 0, finishing: 0 });
    const [materials, setMaterials] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [activeDesigns, setActiveDesigns] = useState([]);
    const [recentLogs, setRecentLogs] = useState([]);

    // Kalkulator State
    const [panjang, setPanjang] = useState('');
    const [lebar, setLebar] = useState('');
    const [matId, setMatId] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [errors, setErrors] = useState({});

    // CRUD State
    const [selectedTask, setSelectedTask] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ panjang: '', lebar: '', matId: '', customerId: '' });

    // Designer Assignment State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [availableDesigners, setAvailableDesigners] = useState([]);
    const [assigningTask, setAssigningTask] = useState(null);
    const [loadingDesigners, setLoadingDesigners] = useState(false);

    const loadData = async () => {
        // Ambil bahan cetak dari API /materials (sumber data sama dengan halaman Stok Bahan)
        try {
            const { data: allMaterials } = await api.get('/materials');
            // Filter hanya bahan digital yang aktif
            const mats = allMaterials
                .filter(m => m.is_active && m.kategori === 'digital')
                .map(m => ({
                    id: m.id,
                    name: m.nama_bahan,
                    sellPrice: parseFloat(m.harga_jual) || 0,
                    unit: m.satuan || 'm2',
                    stok: parseFloat(m.stok_saat_ini) || 0,
                }));
            setMaterials(mats);
            if (mats.length > 0 && !matId) setMatId(mats[0].id);
        } catch (err) {
            console.error('Gagal mengambil data bahan:', err);
            setMaterials([]);
        }

        // Load customers
        const allCustomers = db.getAll('customers');
        setCustomers(allCustomers);
        if (allCustomers.length > 0 && !customerId) {
            const walkIn = allCustomers.find(c => c.name.toLowerCase().includes('umum') || c.name.toLowerCase().includes('walk-in'));
            setCustomerId(walkIn ? walkIn.id : allCustomers[0].id);
        }

        // Load all DP tasks
        const allTasks = db.getAll('dp_tasks');

        // Filter for active designs (menunggu_desain, desain, ditugaskan)
        const designs = allTasks.filter(t => ['menunggu_desain', 'desain', 'ditugaskan'].includes(t.status));
        setActiveDesigns(designs);

        // Filter for logs (showing unique orders or latest updates)
        const logs = [...allTasks].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);
        setRecentLogs(logs);

        // Calculate Stats
        let menunggu = 0, cetak = 0, finishing = 0;
        allTasks.forEach(t => {
            if (t.status === 'produksi') menunggu++; // Waiting for printer if auto-assigned but not printing? Or just use mockup columns.
            // Sesuai mockup ProductionQueue: Menunggu, Proses Cetak, Finishing, QC, Selesai
            if (t.status === 'produksi') menunggu++;
            else if (t.status === 'cetak') cetak++;
            else if (t.status === 'finishing') finishing++;
        });

        // If no tasks in production/cetak/finishing, check the old orders table for backward compatibility if needed, 
        // but the plan says transition to dp_tasks.

        setStats({ menunggu, cetak, finishing });
    };

    useEffect(() => {
        loadData();
        // Timer dihapus — waktu desain diatur oleh operator desain
    }, []);

    // Fetch available designers for assignment
    const fetchDesigners = async () => {
        setLoadingDesigners(true);
        try {
            const { data } = await api.get('/designers');
            setAvailableDesigners(data.filter(d => d.is_active && d.status_kerja === 'kosong'));
        } catch { setAvailableDesigners([]); }
        setLoadingDesigners(false);
    };

    const openAssignModal = (task) => {
        setAssigningTask(task);
        setShowAssignModal(true);
        fetchDesigners();
    };

    const handleAssignDesigner = async (designerId) => {
        try {
            await api.post('/designers/assign', {
                task_id: assigningTask.id,
                designer_id: designerId
            });
            // Update status di localStorage
            db.update('dp_tasks', assigningTask.id, {
                status: 'ditugaskan',
                updatedAt: new Date().toISOString()
            });
            db.logActivity(user?.name, 'Tugaskan Desainer', `Pesanan ${assigningTask.id} ditugaskan ke operator desain`);
            setShowAssignModal(false);
            setAssigningTask(null);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menugaskan');
        }
    };

    const mat = materials.find(m => m.id === matId);
    const luas = (parseFloat(panjang) || 0) * (parseFloat(lebar) || 0);
    const totalEstimasi = luas * (mat?.sellPrice || 0);

    const getTahapanClasses = (color) => {
        switch (color) {
            case 'blue': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
            case 'green': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
            case 'amber': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
            default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
        }
    };

    const getPaymentClasses = (isPaid, status) => {
        if (isPaid) return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
        if (status.includes('DP')) return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    };

    const handleBuatPesanan = () => {
        const newErrors = {};
        if (!matId) newErrors.matId = "Pilih bahan cetak";
        if (!customerId) newErrors.customerId = "Pilih pelanggan";
        if (!lebar || parseFloat(lebar) <= 0) newErrors.lebar = "Isi lebar (> 0)";
        if (!panjang || parseFloat(panjang) <= 0) newErrors.panjang = "Isi tinggi (> 0)";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        const selectedMat = materials.find(m => m.id === matId);
        const selectedCust = customers.find(c => c.id === customerId);
        const newTask = {
            id: 'ORD-' + pad(Math.floor(Math.random() * 9999)),
            status: 'menunggu_desain',
            customerName: selectedCust?.name || 'Pelanggan Umum',
            customerId: customerId,
            title: `${selectedMat?.name} (${lebar}x${panjang}m)`,
            material_id: matId,
            material_name: selectedMat?.name,
            dimensions: { width: lebar, height: panjang },
            material_price: totalEstimasi,
            design_price: 0,
            priority: 'normal',
            time: '--:--:--', // Timer belum berjalan, diatur oleh operator desain
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        db.insert('dp_tasks', newTask);
        db.logActivity(user?.name, 'Buat Pesanan Baru', `Menambah pesanan cetak ${newTask.title}`);

        // Reset form
        setPanjang('');
        setLebar('');
        setErrors({});
        loadData();
    };

    const handleCancelTask = (taskId) => {
        if (window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) {
            const task = db.getById('dp_tasks', taskId);
            db.update('dp_tasks', taskId, { status: 'batal' });
            db.logActivity(user?.name, 'Batalkan Pesanan', `Membatalkan pesanan ${task?.title}`);
            loadData();
        }
    };

    const openEdit = (task) => {
        setSelectedTask(task);
        setEditForm({
            panjang: task.dimensions.height,
            lebar: task.dimensions.width,
            matId: task.material_id,
            customerId: task.customerId
        });
        setShowEditModal(true);
    };

    const handleUpdateTask = () => {
        const mat = materials.find(m => m.id === editForm.matId);
        const cust = customers.find(c => c.id === editForm.customerId);
        const luas = (parseFloat(editForm.panjang) || 0) * (parseFloat(editForm.lebar) || 0);
        const price = luas * (mat?.sellPrice || 0);

        db.update('dp_tasks', selectedTask.id, {
            dimensions: { width: editForm.lebar, height: editForm.panjang },
            material_id: editForm.matId,
            material_name: mat?.name,
            customerId: editForm.customerId,
            customerName: cust?.name,
            material_price: price,
            title: `${mat?.name} (${editForm.lebar}x${editForm.panjang}m)`
        });

        db.logActivity(user?.name, 'Update Pesanan', `Memperbarui detail pesanan ${selectedTask.id}`);
        setShowEditModal(false);
        loadData();
    };

    return (
        <div className="flex-1 px-6 py-8 lg:px-20 max-w-[1440px] mx-auto w-full">
            <div className="mb-10">
                <h1 className="text-3xl font-black tracking-tight mb-2">Dashboard Alur Kerja</h1>
                <p className="text-slate-500 max-w-2xl">Sistem monitoring terintegrasi untuk melacak pesanan cetak banner dari tahap input hingga serah terima kepada pelanggan secara real-time.</p>
            </div>

            <div className="relative flex flex-col md:flex-row justify-between gap-4 mb-12">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 hidden md:block z-0"></div>

                <div className="relative z-10 flex flex-col items-center group flex-1">
                    <div className="size-12 rounded-full bg-primary text-white flex items-center justify-center mb-3 ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">calculate</span>
                    </div>
                    <p className="text-sm font-bold text-center">1. Input & Kalkulasi</p>
                    <p className="text-xs text-slate-500 text-center mt-1">Estimasi Harga & Bahan</p>
                </div>

                <div className="relative z-10 flex flex-col items-center group flex-1">
                    <div className="size-12 rounded-full bg-white dark:bg-slate-800 border-2 border-primary text-primary flex items-center justify-center mb-3 ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">palette</span>
                    </div>
                    <p className="text-sm font-bold text-center">2. Jasa Desain</p>
                    <p className="text-xs text-slate-500 text-center mt-1">Proses Kreatif & Revisi</p>
                </div>

                <div className="relative z-10 flex flex-col items-center group flex-1">
                    <div className="size-12 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400 flex items-center justify-center mb-3 ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">description</span>
                    </div>
                    <p className="text-sm font-bold text-center">3. SPK & Notifikasi</p>
                    <p className="text-xs text-slate-500 text-center mt-1">Penerbitan Surat Kerja</p>
                </div>

                <div className="relative z-10 flex flex-col items-center group flex-1">
                    <div className="size-12 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400 flex items-center justify-center mb-3 ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">print_connect</span>
                    </div>
                    <p className="text-sm font-bold text-center">4. Produksi</p>
                    <p className="text-xs text-slate-500 text-center mt-1">Cetak & Finishing</p>
                </div>

                <div className="relative z-10 flex flex-col items-center group flex-1">
                    <div className="size-12 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400 flex items-center justify-center mb-3 ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <p className="text-sm font-bold text-center">5. Penagihan</p>
                    <p className="text-xs text-slate-500 text-center mt-1">Pelunasan & Pickup</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Pesanan Aktif */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">timer</span>
                                Pesanan Aktif (Proses Produksi)
                            </h3>
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{activeDesigns.length} Pesanan Berjalan</span>
                        </div>
                        <div className="space-y-4">
                            {activeDesigns.map(d => (
                                <div key={d.id} className="flex items-center justify-between p-4 rounded-lg bg-background-light dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                            <span className="material-symbols-outlined">brush</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{d.title}</p>
                                            <p className="text-xs text-slate-500">Pelanggan: {d.customer}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right mr-4">
                                            <p className="text-xs text-slate-500 mb-1">Status</p>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${d.status === 'menunggu_desain' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                                                d.status === 'ditugaskan' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                                                    'bg-green-100 dark:bg-green-900/30 text-green-600'
                                                }`}>
                                                {d.status === 'menunggu_desain' ? 'Menunggu' :
                                                    d.status === 'ditugaskan' ? '📋 Ditugaskan' :
                                                        '⚡ Dikerjakan'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                className="p-2 text-slate-400 hover:text-primary transition"
                                                title="Lihat Detail"
                                                onClick={() => { setSelectedTask(d); setShowViewModal(true); }}
                                            >
                                                <FiEye size={18} />
                                            </button>
                                            <button
                                                className="p-2 text-slate-400 hover:text-amber-500 transition"
                                                title="Edit Pesanan"
                                                onClick={() => openEdit(d)}
                                            >
                                                <FiEdit2 size={18} />
                                            </button>
                                            <button
                                                className="p-2 text-slate-400 hover:text-red-500 transition"
                                                title="Batalkan Pesanan"
                                                onClick={() => handleCancelTask(d.id)}
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                        {d.status === 'menunggu_desain' ? (
                                            <button
                                                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-600 transition ml-2 flex items-center gap-1"
                                                onClick={() => openAssignModal(d)}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
                                                Tugaskan Desainer
                                            </button>
                                        ) : (
                                            <button
                                                className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-bold ml-2 cursor-default"
                                                disabled
                                            >
                                                ✅ Sudah Ditugaskan
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Monitoring Antrean */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">analytics</span>
                            Monitoring Antrean Produksi
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Menunggu</p>
                                <p className="text-2xl font-black">{pad(stats.menunggu)} <span className="text-xs font-normal text-slate-500">Pesanan</span></p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Proses Cetak</p>
                                <p className="text-2xl font-black">{pad(stats.cetak)} <span className="text-xs font-normal text-slate-500">Mesin Aktif</span></p>
                            </div>
                            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                                <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Finishing</p>
                                <p className="text-2xl font-black">{pad(stats.finishing)} <span className="text-xs font-normal text-slate-500">Siap Ambil</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Kalkulator */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 className="text-lg font-bold mb-4">Input Kalkulator Banner</h3>
                        <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Pelanggan</label>
                                <select
                                    className={`w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary p-2 border ${errors.customerId ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                    value={customerId}
                                    onChange={e => {
                                        setCustomerId(e.target.value);
                                        setErrors(prev => { const n = { ...prev }; delete n.customerId; return n; });
                                    }}
                                >
                                    <option value="">-- Pilih Pelanggan --</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.type || 'Personal'})</option>
                                    ))}
                                </select>
                                {errors.customerId && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.customerId}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Bahan Cetak (Stok)</label>
                                <select
                                    className={`w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary p-2 border ${errors.matId ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                    value={matId}
                                    onChange={e => {
                                        setMatId(e.target.value);
                                        setErrors(prev => { const n = { ...prev }; delete n.matId; return n; });
                                    }}
                                >
                                    <option value="">-- Pilih Bahan --</option>
                                    {materials.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} — {fmt(m.sellPrice)}/{m.unit} (Stok: {m.stok} {m.unit})</option>
                                    ))}
                                </select>
                                {errors.matId && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.matId}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Lebar (m)</label>
                                    <input
                                        className={`w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm p-2 border ${errors.lebar ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                        placeholder="3"
                                        type="number"
                                        step="0.1"
                                        value={lebar}
                                        onChange={e => {
                                            setLebar(e.target.value);
                                            setErrors(prev => { const n = { ...prev }; delete n.lebar; return n; });
                                        }}
                                    />
                                    {errors.lebar && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.lebar}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tinggi (m)</label>
                                    <input
                                        className={`w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm p-2 border ${errors.panjang ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                        placeholder="1"
                                        type="number"
                                        step="0.1"
                                        value={panjang}
                                        onChange={e => {
                                            setPanjang(e.target.value);
                                            setErrors(prev => { const n = { ...prev }; delete n.panjang; return n; });
                                        }}
                                    />
                                    {errors.panjang && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.panjang}</p>}
                                </div>
                            </div>
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-slate-500">Estimasi Total:</span>
                                    <span className="text-lg font-black text-primary">{fmt(totalEstimasi)}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 italic">*Belum termasuk jasa desain & mata ayam</p>
                            </div>
                            <button
                                className="w-full py-3 bg-primary text-white rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                type="button"
                                onClick={handleBuatPesanan}
                            >
                                <span className="material-symbols-outlined text-sm">add_task</span>
                                Buat Pesanan Baru
                            </button>
                        </form>
                    </div>

                    {/* WA Gateway */}
                    <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl overflow-hidden relative">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-green-400">chat_bubble</span>
                                <h3 className="font-bold">WhatsApp Gateway</h3>
                            </div>
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed">Sistem otomatis mengirim notifikasi SPK dan status produksi kepada pelanggan.</p>
                            <div className="space-y-3">
                                <div className="flex gap-3 items-start">
                                    <div className="size-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-[14px]">done_all</span>
                                    </div>
                                    <p className="text-[11px]">SPK Terbit: Notifikasi WA Terkirim</p>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="size-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-[14px]">done_all</span>
                                    </div>
                                    <p className="text-[11px]">Cetak Selesai: Undangan Pengambilan</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -right-8 -bottom-8 size-32 bg-primary/10 rounded-full blur-3xl"></div>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="mt-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-x-auto">
                <h3 className="text-lg font-bold mb-6">Log Aktivitas Terbaru</h3>
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                            <th className="pb-4 text-xs font-bold text-slate-500 uppercase">Order ID</th>
                            <th className="pb-4 text-xs font-bold text-slate-500 uppercase">Pelanggan</th>
                            <th className="pb-4 text-xs font-bold text-slate-500 uppercase">Layanan</th>
                            <th className="pb-4 text-xs font-bold text-slate-500 uppercase">Tahapan</th>
                            <th className="pb-4 text-xs font-bold text-slate-500 uppercase">Status Pembayaran</th>
                            <th className="pb-4 text-xs font-bold text-slate-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentLogs.map((log, i) => (
                            <tr key={i}>
                                <td className="py-4 text-sm font-medium">{log.id}</td>
                                <td className="py-4 text-sm">{log.customerName}</td>
                                <td className="py-4 text-sm">{log.material_name}</td>
                                <td className="py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getTahapanClasses(log.status === 'desain' ? 'amber' : (log.status === 'selesai' ? 'green' : 'blue'))}`}>
                                        {log.status?.toUpperCase()}
                                    </span>
                                </td>
                                <td className="py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.isPaid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {log.isPaid ? 'Lunas' : 'Belum Bayar'}
                                    </span>
                                </td>
                                <td className="py-4">
                                    <button
                                        onClick={() => {
                                            if (log.status === 'desain') onNavigate('design-finalization', { taskId: log.id });
                                            else if (log.status === 'checkout') onNavigate('dp-cart', { taskId: log.id });
                                            else onNavigate('production-queue');
                                        }}
                                        className="text-primary hover:underline text-sm font-bold"
                                    >
                                        Detail
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* View Modal */}
            <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Detail Pesanan">
                {selectedTask && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Order ID</p>
                                <p className="font-bold">{selectedTask.id}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Status</p>
                                <p className="font-bold text-primary">{selectedTask.status?.toUpperCase()}</p>
                            </div>
                        </div>
                        <div className="pt-2">
                            <p className="text-xs text-slate-500 uppercase font-bold">Pelanggan</p>
                            <p className="font-bold">{selectedTask.customerName}</p>
                        </div>
                        <div className="pt-2">
                            <p className="text-xs text-slate-500 uppercase font-bold">Pekerjaan</p>
                            <p className="font-bold">{selectedTask.title}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Dimensi</p>
                                <p className="font-bold">{selectedTask.dimensions.width}m x {selectedTask.dimensions.height}m</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Bahan</p>
                                <p className="font-bold">{selectedTask.material_name}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm">Harga Cetak:</span>
                                <span className="font-bold">{fmt(selectedTask.material_price)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Biaya Desain:</span>
                                <span className="font-bold">{fmt(selectedTask.design_price)}</span>
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-2 flex justify-between items-center">
                                <span className="font-bold">Total Estimasi:</span>
                                <span className="text-xl font-black text-primary">{fmt(selectedTask.material_price + selectedTask.design_price)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Detail Pesanan"
                footer={(
                    <div className="flex gap-2 w-full">
                        <button className="flex-1 py-2 border border-slate-200 rounded-lg font-bold text-sm" onClick={() => setShowEditModal(false)}>Batal</button>
                        <button className="flex-1 py-2 bg-primary text-white rounded-lg font-bold text-sm" onClick={handleUpdateTask}>Simpan Perubahan</button>
                    </div>
                )}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Pelanggan</label>
                        <select
                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm p-2 border"
                            value={editForm.customerId}
                            onChange={e => setEditForm({ ...editForm, customerId: e.target.value })}
                        >
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Bahan</label>
                        <select
                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm p-2 border"
                            value={editForm.matId}
                            onChange={e => setEditForm({ ...editForm, matId: e.target.value })}
                        >
                            {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Lebar (m)</label>
                            <input
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm p-2 border"
                                type="number"
                                step="0.1"
                                value={editForm.lebar}
                                onChange={e => setEditForm({ ...editForm, lebar: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tinggi (m)</label>
                            <input
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm p-2 border"
                                type="number"
                                step="0.1"
                                value={editForm.panjang}
                                onChange={e => setEditForm({ ...editForm, panjang: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modal Tugaskan Desainer */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowAssignModal(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl" style={{ animation: 'fadeIn .2s ease' }}>
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-bold">Tugaskan ke Operator Desain</h3>
                                <p className="text-xs text-slate-500 mt-1">Pesanan: {assigningTask?.title}</p>
                            </div>
                            <button className="text-slate-400 hover:text-slate-600 p-1" onClick={() => setShowAssignModal(false)}>
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-3">
                            {loadingDesigners ? (
                                <div className="text-center py-8">
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 36, animation: 'spin 1s linear infinite' }}>progress_activity</span>
                                    <p className="text-sm text-slate-500 mt-2">Memuat daftar operator...</p>
                                </div>
                            ) : availableDesigners.length === 0 ? (
                                <div className="text-center py-8">
                                    <span className="material-symbols-outlined text-slate-300" style={{ fontSize: 48 }}>person_off</span>
                                    <p className="text-sm text-slate-500 mt-2 font-bold">Tidak ada operator yang tersedia</p>
                                    <p className="text-xs text-slate-400">Semua operator sedang sibuk atau belum ada operator desain.</p>
                                </div>
                            ) : (
                                availableDesigners.map(d => (
                                    <button
                                        key={d.id}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                                        onClick={() => handleAssignDesigner(d.id)}
                                    >
                                        <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                                            {d.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm">{d.name}</p>
                                            <p className="text-xs text-slate-500">{d.username}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 text-xs font-bold">🟢 Tersedia</span>
                                            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition">arrow_forward</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
