import { useState, useEffect } from 'react';

import api from '../services/api';
import { formatRupiah, generateInvoice } from '../utils';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { FiCheckCircle, FiClock, FiFileText, FiChevronDown, FiPlus, FiTrash2, FiPrinter, FiEdit, FiEye, FiEdit2, FiSave, FiX, FiZap, FiClipboard, FiUser, FiChevronLeft, FiChevronRight, FiEdit3, FiUserCheck, FiLayers, FiTag, FiMessageSquare, FiPlusCircle, FiActivity } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const fmt = (n) => 'Rp ' + Math.floor(n || 0).toLocaleString('id-ID');
const pad = (n) => String(n).padStart(2, '0');

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
    const [systemStatus, setSystemStatus] = useState('online');

    // Calculator Premium UI
    const [calcOrderData, setCalcOrderData] = useState({
        customerId: '',
        materialId: '',
        width: '',
        height: '',
        notes: '',
        designFee: 0,
        isManualCustomer: false,
        manualCustomerName: '',
        estimatedTotal: 0
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const mat = materials.find(m => m.id === calcOrderData.materialId);
        const luas = (parseFloat(calcOrderData.width) || 0) * (parseFloat(calcOrderData.height) || 0);
        const total = (luas * (mat?.sellPrice || 0)) + (parseFloat(calcOrderData.designFee) || 0);
        setCalcOrderData(prev => ({ ...prev, estimatedTotal: total }));
    }, [calcOrderData.width, calcOrderData.height, calcOrderData.materialId, calcOrderData.designFee, materials]);

    // Pagination for Logs
    const [logPage, setLogPage] = useState(1);
    const logItemsPerPage = 10;

    // CRUD State
    const [selectedTask, setSelectedTask] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ dimensions: { width: '', height: '' }, matId: '', customerId: '' });

    // Cancellation State
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelTaskId, setCancelTaskId] = useState(null);

    // Designer Assignment State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [availableDesigners, setAvailableDesigners] = useState([]);
    const [loadingDesigners, setLoadingDesigners] = useState(false);

    const loadData = async () => {
        try {
            const { data: allMaterials } = await api.get('/materials');
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

        try {
            const { data: allCustomers } = await api.get('/customers');
            setCustomers(allCustomers);
            if (allCustomers.length > 0 && !customerId) {
                const walkIn = allCustomers.find(c => c.name.toLowerCase().includes('umum') || c.name.toLowerCase().includes('walk-in'));
                setCustomerId(walkIn ? walkIn.id : allCustomers[0].id);
            }
        } catch (e) { console.error(e); }

        try {
            // Load active designs from API
            const { data: allTasks } = await api.get('/dp_tasks');
            const designs = allTasks.filter(t =>
                ['menunggu_desain', 'desain', 'ditugaskan', 'dikerjakan'].includes(t.status) &&
                t.type !== 'offset' && (!t.title?.toUpperCase().includes('OFFSET'))
            );
            setActiveDesigns(designs);
            const logs = [...allTasks].filter(t => t.type !== 'offset' && (!t.title?.toUpperCase().includes('OFFSET')));
            setRecentLogs(logs);

            // Queue Stats Fallback
            let menunggu = 0, cetak = 0, finishing = 0;
            allTasks.forEach(t => {
                if (t.status === 'produksi') menunggu++;
                else if (t.status === 'cetak') cetak++;
                else if (t.status === 'finishing') finishing++;
            });

            try {
                const { data: spkRes } = await api.get('/spk');
                const spkData = spkRes.data || [];
                spkData.forEach(s => {
                    if (s.status === 'Menunggu Antrian') menunggu++;
                    else if (s.status === 'Dalam Proses Cetak') cetak++;
                    else if (['Finishing', 'Quality Control'].includes(s.status)) finishing++;
                });
            } catch (e) { }

            setStats({ menunggu, cetak, finishing });
            setSystemStatus('online');
        } catch (err) {
            console.error(err);
            setSystemStatus('offline');
        }
    };

    useEffect(() => {
        loadData();

        // POLL: Check for updates every 10 seconds
        const pollInterval = setInterval(() => {
            loadData();
        }, 10000);

        return () => clearInterval(pollInterval);
    }, []);

    const fetchDesigners = async () => {
        setLoadingDesigners(true);
        try {
            const { data } = await api.get('/designers');
            setAvailableDesigners(data.filter(d => d.is_active && d.status_kerja === 'kosong'));
        } catch { setAvailableDesigners([]); }
        setLoadingDesigners(false);
    };

    const openAssignModal = (task) => {
        setSelectedTask(task);
        setShowAssignModal(true);
        fetchDesigners();
    };

    const handleAssignDesigner = async (designerId) => {
        try {
            await api.post('/designers/assign', {
                task_id: selectedTask.id,
                designer_id: designerId
            });
            await api.put(`/dp_tasks/${selectedTask.id}`, { status: 'ditugaskan' });
            setShowAssignModal(false);
            setSelectedTask(null);
            loadData();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Oops...', text: err.response?.data?.message || 'Gagal menugaskan', timer: 3000 });
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
            pesan_desainer: pesanDesainer || null,
            type: 'digital',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const newTransaction = {
            invoiceNo: generateInvoice(),
            date: new Date().toISOString(),
            customerId: customerId,
            customerName: selectedCust?.name || 'Pelanggan Umum',
            items: [{
                id: null,
                name: newTask.title,
                qty: 1,
                price: totalEstimasi,
                subtotal: totalEstimasi,
                source: 'digital'
            }],
            subtotal: totalEstimasi,
            discount: 0,
            total: totalEstimasi,
            paid: 0,
            changeAmount: 0,
            paymentType: 'none',
            status: 'unpaid',
            type: 'digital_printing'
        };

        api.post('/dp_tasks', newTask).then(() => {
            return api.post('/transactions', newTransaction);
        }).then(() => {
            setPanjang('');
            setLebar('');
            setPesanDesainer('');
            setErrors({});
            loadData();
        }).catch(err => {
            console.error('Err:', err);
            Swal.fire({ icon: 'error', title: 'Oops...', text: 'Gagal buat pesanan', timer: 3000 });
        });
    };

    const handleCreateOrderFromCalc = () => {
        if (!calcOrderData.materialId || calcOrderData.width <= 0 || calcOrderData.height <= 0) return;
        setLoading(true);

        const selectedMat = materials.find(m => m.id === calcOrderData.materialId);
        const selectedCust = customers.find(c => c.id === calcOrderData.customerId);

        const newTask = {
            id: 'ORD-' + pad(Math.floor(Math.random() * 9999)),
            status: 'menunggu_desain',
            customerName: calcOrderData.isManualCustomer ? calcOrderData.manualCustomerName : (selectedCust?.name || 'Pelanggan Umum'),
            customerId: calcOrderData.isManualCustomer ? null : (calcOrderData.customerId || (customers.length > 0 ? customers[0].id : '')),
            title: `${selectedMat?.name} (${calcOrderData.width}x${calcOrderData.height}m)`,
            material_id: calcOrderData.materialId,
            material_name: selectedMat?.name,
            dimensions: { width: calcOrderData.width, height: calcOrderData.height },
            material_price: calcOrderData.estimatedTotal - (parseFloat(calcOrderData.designFee) || 0),
            design_price: parseFloat(calcOrderData.designFee) || 0,
            priority: 'normal',
            pesan_desainer: calcOrderData.notes || null,
            type: 'digital',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const newTransaction = {
            invoiceNo: generateInvoice(),
            date: new Date().toISOString(),
            customerId: newTask.customerId,
            customerName: newTask.customerName,
            items: [{
                id: null,
                name: newTask.title + (newTask.design_price > 0 ? ' + Desain' : ''),
                qty: 1,
                price: calcOrderData.estimatedTotal,
                subtotal: calcOrderData.estimatedTotal,
                source: 'digital'
            }],
            subtotal: calcOrderData.estimatedTotal,
            discount: 0,
            total: calcOrderData.estimatedTotal,
            paid: 0,
            changeAmount: 0,
            paymentType: 'none',
            status: 'unpaid',
            type: 'digital_printing'
        };

        api.post('/dp_tasks', newTask).then(() => {
            return api.post('/transactions', newTransaction);
        }).then(() => {
            setCalcOrderData({ customerId: '', materialId: '', width: '', height: '', notes: '', designFee: 0, isManualCustomer: false, manualCustomerName: '', estimatedTotal: 0 });
            setLoading(false);
            loadData();
        }).catch(err => {
            setLoading(false);
            Swal.fire({ icon: 'error', title: 'Oops...', text: 'Gagal memproses kalkulasi orders', timer: 3000 });
        });
    };


    const handleCancelTask = (taskId) => {
        setCancelTaskId(taskId);
        setShowCancelModal(true);
    };

    const confirmCancelTask = async () => {
        if (!cancelTaskId) return;
        try {
            await api.patch(`/dp_tasks/${cancelTaskId}/status`, { status: 'batal' });
            setShowCancelModal(false);
            setCancelTaskId(null);
            loadData();
        } catch (e) {
            console.error(e);
        }
    };

    const openEdit = (task) => {
        setSelectedTask(task);
        setEditForm({
            dimensions: { height: task.dimensions.height, width: task.dimensions.width },
            matId: task.material_id,
            customerId: task.customerId
        });
        setShowEditModal(true);
    };

    const handleUpdateTask = async () => {
        const mat = materials.find(m => m.id === editForm.matId);
        const cust = customers.find(c => c.id === editForm.customerId);
        const luasValue = (parseFloat(editForm.dimensions.height) || 0) * (parseFloat(editForm.dimensions.width) || 0);
        const price = luasValue * (mat?.sellPrice || 0);

        try {
            await api.put(`/dp_tasks/${selectedTask.id}`, {
                dimensions: { width: editForm.dimensions.width, height: editForm.dimensions.height },
                material_id: editForm.matId,
                material_name: mat?.name,
                customerId: editForm.customerId,
                customerName: cust?.name,
                material_price: price,
                title: `${mat?.name} (${editForm.dimensions.width}x${editForm.dimensions.height}m)`
            });
            setShowEditModal(false);
            loadData();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 font-display bg-slate-50/30 dark:bg-transparent min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 text-slate-900 dark:text-white">
                <div>
                    <h1 className="text-2xl font-black flex items-center gap-3">
                        <span className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200 dark:shadow-none"><FiZap /></span>
                        Alur Kerja Digital Printing
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-1 italic opacity-75">Production Monitoring & Real-time Tracking System</p>
                </div>
                {/* Status Sistem */}
                <div className={`flex items-center gap-4 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border transition-all ${systemStatus === 'online' ? 'border-slate-200 dark:border-slate-800 shadow-sm' : 'border-rose-200 dark:border-rose-900/50 shadow-lg shadow-rose-100 dark:shadow-none bg-rose-50/50 dark:bg-rose-900/10'}`}>
                    <div className={`p-2.5 rounded-xl animate-pulse ${systemStatus === 'online' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600'}`}>
                        {systemStatus === 'online' ? <FiCheckCircle /> : <FiAlertCircle />}
                    </div>
                    <div>
                        <p className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1 ${systemStatus === 'online' ? 'text-slate-400' : 'text-rose-400'}`}>{systemStatus === 'online' ? 'Status Sistem' : 'Sistem Terputus'}</p>
                        <p className={`text-xs font-black uppercase tracking-tighter ${systemStatus === 'online' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {systemStatus === 'online' ? 'Gateway Active' : 'Gateway Offline'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Workflow Pipeline */}
            <div className="relative flex flex-col md:flex-row justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 dark:bg-blue-900/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-[50%] left-10 right-10 h-[2px] bg-slate-100 dark:bg-slate-800 hidden md:block z-0"></div>

                {[
                    { step: '1', title: 'Input & Kalkulasi', sub: 'Harga & Bahan', icon: 'calculate', color: 'blue', active: true },
                    { step: '2', title: 'Jasa Desain', sub: 'Kreatif & Revisi', icon: 'palette', color: 'indigo', active: false },
                    { step: '3', title: 'SPK & Antrean', sub: 'Penerbitan Kerja', icon: 'content_paste', color: 'purple', active: false },
                    { step: '4', title: 'Produksi', sub: 'Cetak & Finishing', icon: 'print', color: 'emerald', active: false },
                    { step: '5', title: 'Penagihan', sub: 'Pelunasan', icon: 'payments', color: 'amber', active: false },
                ].map((s, idx) => (
                    <div key={idx} className="relative z-10 flex flex-col items-center flex-1 group/step">
                        <div className={`size-14 rounded-2xl flex items-center justify-center mb-4 transition-all transform group-hover/step:scale-110 shadow-sm border-2
                            ${s.active
                                ? `bg-blue-600 text-white border-blue-500 shadow-blue-200`
                                : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'}`}>
                            <span className="material-symbols-outlined text-2xl!">{s.icon}</span>
                            {s.active && <div className="absolute -top-1 -right-1 size-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>}
                        </div>
                        <div className="text-center">
                            <p className={`text-[11px] font-black uppercase tracking-tight ${s.active ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{s.step}. {s.title}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Pesanan Aktif */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 text-slate-900 dark:text-white">
                                <span className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><FiZap /></span>
                                Produksi Berjalan
                            </h3>
                            <span className="px-3 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 dark:shadow-none">
                                {activeDesigns.length} Pesanan
                            </span>
                        </div>
                        <div className="p-6 space-y-4">
                            {activeDesigns.length === 0 ? (
                                <div className="py-12 text-center text-slate-300 dark:text-slate-700">
                                    <p className="text-xs font-black uppercase tracking-widest">Tidak ada pesanan aktif</p>
                                </div>
                            ) : (
                                activeDesigns.map(d => (
                                    <div key={d.id} className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all shadow-sm">
                                                <span className="material-symbols-outlined text-2xl!">brush</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">{d.title}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                                    <FiUser size={10} /> {d.customerName}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            <div className="text-right flex-1 sm:flex-none">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-60 text-center sm:text-right">Status</p>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all
                                                    ${d.status === 'menunggu_desain' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800' :
                                                        d.status === 'ditugaskan' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' :
                                                            'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'}`}>
                                                    {d.status === 'menunggu_desain' ? 'Menunggu' :
                                                        d.status === 'ditugaskan' ? <><FiClipboard className="mr-1" /> Ditugaskan</> :
                                                            <><FiZap className="mr-1" /> Dikerjakan</>}
                                                </span>
                                            </div>
                                            <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <button className="p-2 text-slate-400 hover:text-blue-600 transition-all rounded-lg hover:bg-white dark:hover:bg-slate-900" onClick={() => { setSelectedTask(d); setShowViewModal(true); }}>
                                                    <FiEye size={16} />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-amber-500 transition-all rounded-lg hover:bg-white dark:hover:bg-slate-900" onClick={() => openEdit(d)}>
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-rose-600 transition-all rounded-lg hover:bg-white dark:hover:bg-slate-900" onClick={() => handleCancelTask(d.id)}>
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                            {d.status === 'menunggu_desain' ? (
                                                <button className="flex-1 sm:flex-none px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-100 dark:shadow-none whitespace-nowrap" onClick={() => openAssignModal(d)}>
                                                    Tugaskan
                                                </button>
                                            ) : (
                                                <div className="flex-1 sm:flex-none px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-center gap-2">
                                                    <FiCheckCircle /> Assigned
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Monitoring Antrean */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 group">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-8 text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-blue-600">analytics</span>
                            Live Queue Monitor
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Menunggu', value: stats.menunggu, color: 'amber', icon: 'hourglass_empty', sub: 'Ready to Assign' },
                                { label: 'Proses Cetak', value: stats.cetak, color: 'blue', icon: 'print', sub: 'Active Printers' },
                                { label: 'Finishing', value: stats.finishing, color: 'emerald', icon: 'task_alt', sub: 'Ready for Pickup' },
                            ].map((s, idx) => (
                                <div key={idx} className={`p-6 rounded-2xl border transition-all hover:shadow-md group/card bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-2.5 rounded-xl group-hover/card:scale-110 transition-transform ${s.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : s.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                                            <span className="material-symbols-outlined text-xl!">{s.icon}</span>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${s.color === 'amber' ? 'text-amber-500' : s.color === 'blue' ? 'text-blue-500' : 'text-emerald-500'}`}>{s.sub}</span>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                    <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                                        {pad(s.value)} <span className="text-xs font-bold text-slate-400 uppercase not-italic">Order</span>
                                    </h4>
                                </div>
                            ))}
                        </div>

                        {/* Tips Operasional Tambahan */}
                        <div className="mt-8 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-[2.5rem] p-8 relative overflow-hidden group/tips shadow-sm">
                            <div className="absolute -right-6 -top-6 text-blue-500/10 transform group-hover/tips:rotate-12 transition-transform select-none">
                                <FiZap size={120} />
                            </div>
                            <div className="flex items-start gap-6 relative z-10">
                                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                                    <FiCheckCircle size={20} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-[12px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">Rekomendasi Workflow</h4>
                                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                                        Pastikan <strong className="text-blue-600 dark:text-blue-400 font-black underline decoration-blue-500/30 underline-offset-4">Biaya Desain</strong> selalu diinputkan pada Kalkulator Banner sebelum menerbitkan SPK agar tagihan ke pelanggan terakumulasi dengan benar di modul Kasir.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Space Filler: Price Reference & Machine Status */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                    <FiTag className="text-blue-500" /> Referensi Harga Bahan
                                </h5>
                                <div className="space-y-3">
                                    {[
                                        { name: 'Banner Flexi 280gr', price: 'Rp 15.000/m' },
                                        { name: 'Banner Flexi 340gr', price: 'Rp 20.000/m' },
                                        { name: 'Banner Flexi Korea 440gr', price: 'Rp 35.000/m' },
                                        { name: 'Stiker Vinyl Ritrama', price: 'Rp 65.000/m' }
                                    ].map((p, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-all">
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{p.name}</span>
                                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 italic">{p.price}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                        <FiActivity className="text-emerald-500" /> Status Mesin Produksi
                                    </h5>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="size-3 rounded-full bg-emerald-500 animate-pulse border-4 border-emerald-500/20"></div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Main Printer (Konica)</p>
                                                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Siap Produksi • Optimal</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="size-3 rounded-full bg-emerald-500 animate-pulse border-4 border-emerald-500/20"></div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Secondary Printer (XP600)</p>
                                                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Siap Produksi • Optimal</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-[10px] font-medium text-slate-400 italic leading-relaxed border-l-4 border-emerald-500">
                                    "Printer optimal meningkatkan akurasi warna dan ketepatan waktu pengiriman."
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Kalkulator */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                        <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 text-slate-900 dark:text-white flex items-center gap-3 relative z-10">
                            <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg"><FiSave /></span>
                            Kalkulator Banner
                        </h3>

                        <form className="space-y-5 relative z-10" onSubmit={e => e.preventDefault()}>
                            <div className="grid grid-cols-1 gap-5">
                                <div>
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pelanggan</label>
                                        <button
                                            onClick={() => setCalcOrderData({ ...calcOrderData, isManualCustomer: !calcOrderData.isManualCustomer })}
                                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all border ${calcOrderData.isManualCustomer ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                                        >
                                            {calcOrderData.isManualCustomer ? 'Input Manual Aktif' : 'Pilih dari Database'}
                                        </button>
                                    </div>
                                    {calcOrderData.isManualCustomer ? (
                                        <input
                                            type="text"
                                            value={calcOrderData.manualCustomerName}
                                            onChange={(e) => setCalcOrderData({ ...calcOrderData, manualCustomerName: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-blue-200 dark:border-blue-500/30 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200 outline-none text-[14px] shadow-sm"
                                            placeholder="Ketik Nama Pelanggan Manual..."
                                        />
                                    ) : (
                                        <select
                                            value={calcOrderData.customerId}
                                            onChange={(e) => setCalcOrderData({ ...calcOrderData, customerId: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200 outline-none text-[14px] shadow-sm appearance-none"
                                        >
                                            <option value="" className="text-slate-900 dark:text-white">-- Pilih Pelanggan --</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id} className="text-slate-900 dark:text-white">{c.name} {c.company ? `(${c.company})` : ''}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest pl-1">Bahan Cetak (Stok)</label>
                                    <select
                                        value={calcOrderData.materialId}
                                        onChange={(e) => setCalcOrderData({ ...calcOrderData, materialId: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200 outline-none text-[14px] shadow-sm appearance-none"
                                    >
                                        <option value="" className="text-slate-900 dark:text-white">Pilih Bahan Roll/Banner</option>
                                        {materials.map(m => (
                                            <option key={m.id} value={m.id} className="text-slate-900 dark:text-white">
                                                {m.name} — Rp {(m.sellPrice || 0).toLocaleString('id-ID')}/{m.unit} (Stok: {m.stok})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest pl-1">Lebar (M)</label>
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        value={calcOrderData.width}
                                        onChange={(e) => setCalcOrderData({ ...calcOrderData, width: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200 outline-none text-[14px] shadow-sm"
                                        placeholder="0.0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest pl-1">Tinggi (M)</label>
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        value={calcOrderData.height}
                                        onChange={(e) => setCalcOrderData({ ...calcOrderData, height: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200 outline-none text-[14px] shadow-sm"
                                        placeholder="0.0"
                                    />
                                </div>
                            </div>

                            {/* ESTIMASI KOTAK */}
                            <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl p-6 text-white shadow-lg shadow-red-500/30 border border-red-500/50 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                                    <FiTag size={64} />
                                </div>
                                <p className="text-[10px] font-bold text-white/90 uppercase tracking-[0.2em] mb-1 relative z-10">Estimasi Total Biaya</p>
                                <p className="text-3xl font-black italic tracking-tight relative z-10 drop-shadow-md">
                                    Rp {calcOrderData.estimatedTotal.toLocaleString('id-ID')}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest pl-1">Biaya Desain (RP)</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 transition-colors">Rp</div>
                                        <input
                                            type="number"
                                            value={calcOrderData.designFee}
                                            onChange={(e) => setCalcOrderData({ ...calcOrderData, designFee: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 pl-10 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-blue-600 dark:text-blue-400 font-black outline-none text-[14px] shadow-sm"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest pl-1">Catatan Desainer</label>
                                <textarea
                                    value={calcOrderData.notes}
                                    onChange={(e) => setCalcOrderData({ ...calcOrderData, notes: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200 outline-none text-[13px] shadow-sm resize-none"
                                    rows="3"
                                    placeholder="Warna dominan, font, ornamen, dll..."
                                />
                            </div>

                            <button
                                onClick={handleCreateOrderFromCalc}
                                disabled={!calcOrderData.materialId || calcOrderData.width <= 0 || calcOrderData.height <= 0 || loading}
                                className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest transition-all shadow-md flex justify-center items-center gap-2 uppercase
                            ${(!calcOrderData.materialId || calcOrderData.width <= 0 || calcOrderData.height <= 0 || loading)
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                                        : 'bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-500/30 hover:shadow-lg hover:-translate-y-0.5'}`}
                            >
                                <FiPlusCircle size={18} />
                                {loading ? 'Memproses...' : 'Buat Pesanan & SPK'}
                            </button>


                            {/* WA Gateway */}
                            <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                                            <FiMessageSquare size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-wider">WA Gateway</h3>
                                            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active Connection</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { icon: <FiCheckCircle />, text: 'SPK Terbit: Notifikasi WA Otomatis' },
                                            { icon: <FiZap />, text: 'Update Produksi: Real-time Alert' },
                                            { icon: <FiCheckCircle />, text: 'Selesai: Undangan Pengambilan' },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex gap-4 items-center group/item">
                                                <div className="size-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover/item:bg-emerald-500/20 transition-colors text-emerald-400">
                                                    {item.icon}
                                                </div>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide group-hover/item:text-white transition-colors">{item.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                </div>
            </div>

            {/* Logs Table */}
            <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 text-slate-900 dark:text-white">
                        <span className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg"><FiClock /></span>
                        Riwayat Kerja & Operasional
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {recentLogs.length} Records
                        </div>
                    </div>
                </div>

                <div className="overflow-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Layanan</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tahapan</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pembayaran</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {recentLogs.slice((logPage - 1) * logItemsPerPage, logPage * logItemsPerPage).map((log, i) => (
                                <tr key={i} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 tracking-tighter">#{log.id}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
                                                <FiUser size={14} />
                                            </div>
                                            <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{log.customerName}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{log.material_name}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getTahapanClasses(log.status === 'desain' || log.status === 'menunggu_desain' ? 'amber' : (['selesai', 'Diambil'].includes(log.status) ? 'green' : 'blue'))}`}>
                                            {log.status?.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${log.isPaid || log.status === 'Diambil' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                                            {log.isPaid || log.status === 'Diambil' ? 'Lunas' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => {
                                                if (['desain', 'menunggu_desain', 'ditugaskan', 'dikerjakan'].includes(log.status)) onNavigate('design-finalization', { taskId: log.id });
                                                else if (log.status === 'checkout') onNavigate('dp-cart', { taskId: log.id });
                                                else onNavigate('production-queue');
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-600 dark:text-slate-400 shadow-sm"
                                        >
                                            <FiEye /> Detail
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {recentLogs.length > 0 && (
                    <div className="p-6 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Showing {Math.min(recentLogs.length, (logPage - 1) * logItemsPerPage + 1)}-{Math.min(recentLogs.length, logPage * logItemsPerPage)} of {recentLogs.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setLogPage(p => Math.max(1, p - 1))}
                                disabled={logPage === 1}
                                className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
                            >
                                <FiChevronLeft size={18} />
                            </button>
                            <span className="text-xs font-black px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl min-w-[70px] text-center shadow-sm">
                                {logPage} / {Math.ceil(recentLogs.length / logItemsPerPage)}
                            </span>
                            <button
                                onClick={() => setLogPage(p => Math.min(Math.ceil(recentLogs.length / logItemsPerPage), p + 1))}
                                disabled={logPage === Math.ceil(recentLogs.length / logItemsPerPage)}
                                className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
                            >
                                <FiChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Detail Operasional"
                icon={<FiEye className="text-blue-600" />}
            >
                {selectedTask && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Produksi</p>
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getTahapanClasses(selectedTask.status === 'desain' || selectedTask.status === 'menunggu_desain' ? 'amber' : (['selesai', 'Diambil'].includes(selectedTask.status) ? 'green' : 'blue'))}`}>
                                    {selectedTask.status?.toUpperCase()}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Pesanan</p>
                                <p className="font-black text-slate-900 dark:text-white">#{selectedTask.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedTask.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Judul Pekerjaan</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedTask.title}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dimensi & Bahan</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedTask.dimensions.width}m x {selectedTask.dimensions.height}m — {selectedTask.material_name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Metode Pembayaran</p>
                                    <p className={`text-sm font-bold ${selectedTask.isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>{selectedTask.isPaid ? 'Lunas / Dibayar' : 'Tagihan Belum Lunas'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-slate-900 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 relative z-10">Rincian Estimasi Biaya</p>
                            <div className="space-y-2 relative z-10">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">Bahan & Cetak:</span>
                                    <span className="text-white font-bold">{fmt(selectedTask.material_price)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">Jasa Desain:</span>
                                    <span className="text-white font-bold">{fmt(selectedTask.design_price)}</span>
                                </div>
                                <div className="h-px bg-white/10 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Grand Total</span>
                                    <span className="text-xl font-black text-blue-400 italic tracking-tighter">{fmt((parseFloat(selectedTask.material_price) || 0) + (parseFloat(selectedTask.design_price) || 0))}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Koreksi Data Pesanan"
                icon={<FiEdit3 className="text-amber-500" />}
                footer={(
                    <div className="flex gap-3 w-full">
                        <button className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all" onClick={() => setShowEditModal(false)}>Batal</button>
                        <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20" onClick={handleUpdateTask}>Simpan Koreksi</button>
                    </div>
                )}
            >
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pelanggan</label>
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={editForm.customerId}
                            onChange={e => setEditForm({ ...editForm, customerId: e.target.value })}
                        >
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bahan Cetak</label>
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={editForm.matId}
                            onChange={e => setEditForm({ ...editForm, matId: e.target.value })}
                        >
                            {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lebar (m)</label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                                type="number" step="0.1"
                                value={editForm.dimensions.width}
                                onChange={e => setEditForm({ ...editForm, dimensions: { ...editForm.dimensions, width: e.target.value } })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tinggi (m)</label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                                type="number" step="0.1"
                                value={editForm.dimensions.height}
                                onChange={e => setEditForm({ ...editForm, dimensions: { ...editForm.dimensions, height: e.target.value } })}
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Assign Modal Wrapper */}
            <AssignModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                selectedTask={selectedTask}
                availableDesigners={availableDesigners}
                loadingDesigners={loadingDesigners}
                handleAssignDesigner={handleAssignDesigner}
            />

            <ConfirmationModal
                isOpen={showCancelModal}
                title="Batalkan Pesanan"
                message="Apakah Anda yakin ingin membatalkan pesanan ini? Status pesanan akan diubah menjadi 'batal'."
                confirmText="Ya, Batalkan"
                cancelText="Tutup"
                onConfirm={confirmCancelTask}
                onCancel={() => { setShowCancelModal(false); setCancelTaskId(null); }}
                type="danger"
            />
        </div>

    );
};

const AssignModal = ({ isOpen, onClose, selectedTask, availableDesigners, loadingDesigners, handleAssignDesigner }) => {
    if (!selectedTask) return null;
    return (
        <div className={`fixed inset-0 z-100 flex items-center justify-center p-4 transition-all ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 text-slate-900 dark:text-white">
                        <span className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><FiUserCheck /></span>
                        Tugaskan Operator
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"><FiX /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                        <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Pekerjaan Terpilih</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedTask.title}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">#{selectedTask.id} • {selectedTask.customerName}</p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Operator Aktif</p>
                        {loadingDesigners ? (
                            <div className="text-center py-10">
                                <span className="material-symbols-outlined text-blue-600 animate-spin text-3xl">progress_activity</span>
                            </div>
                        ) : availableDesigners.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tidak ada operator aktif</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {availableDesigners.map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => handleAssignDesigner(d.id)}
                                        className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all text-left group"
                                    >
                                        <div className="size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-blue-600 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                            {d.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-tight">{d.name}</p>
                                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Siap Melayani</p>
                                        </div>
                                        <FiChevronRight className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
