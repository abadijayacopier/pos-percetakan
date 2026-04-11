import { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
    FiCpu, FiPlus, FiSearch, FiFilter, FiCalendar, FiClock,
    FiCheckCircle, FiAlertCircle, FiChevronRight, FiMoreVertical,
    FiPrinter, FiEdit2, FiTrash2, FiUser, FiInfo, FiActivity,
    FiSettings, FiBox, FiPhone, FiCreditCard, FiShield, FiX, FiSave,
    FiChevronLeft
} from 'react-icons/fi';
import api from '../services/api';
import { formatRupiah } from '../utils';
import PelunasanModal from '../components/PelunasanModal';
import { FiDollarSign as FiDollar } from 'react-icons/fi';

const formatDate = (dateStr, pattern = 'dd/MM/yyyy') => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (pattern === 'dd MMM yyyy HH:mm') {
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
            date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function ServicePage({ onNavigate }) {
    const [services, setServices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [products, setProducts] = useState([]); // Opsi A
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [page, setPage] = useState(1);
    const [settleTask, setSettleTask] = useState(null);
    const PER_PAGE = 10;

    // Form State
    const [formData, setFormData] = useState({
        customerId: '',
        customerName: '',
        phone: '',
        machineInfo: '',
        serialNo: '',
        complaint: '',
        condition: '',
        priority: 'normal',
        technicianId: '',
        laborCost: 0,
        dpAmount: 0,
        spareparts: []
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [srvRes, custRes, usersRes, prodRes] = await Promise.all([
                api.get('/service').catch(() => ({ data: [] })),
                api.get('/customers').catch(() => ({ data: [] })),
                api.get('/users').catch(() => ({ data: [] })),
                api.get('/products').catch(() => ({ data: [] }))
            ]);
            setServices((srvRes.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            setCustomers(custRes.data || []);
            setTechnicians((usersRes.data || []).filter(u => u.role === 'teknisi'));
            setProducts(prodRes.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const stats = useMemo(() => ({
        total: services.length,
        pending: services.filter(s => s.status === 'approval' || s.status === 'pending').length,
        active: services.filter(s => s.status === 'pengerjaan').length,
        completed: services.filter(s => s.status === 'selesai').length
    }), [services]);

    const filteredServices = useMemo(() => {
        return services.filter(s => {
            const matchesSearch =
                (s.serviceNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.machineInfo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.serialNo || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [services, searchQuery, filterStatus]);

    const paginatedServices = useMemo(() => {
        return filteredServices.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    }, [filteredServices, page]);

    const totalPages = Math.ceil(filteredServices.length / PER_PAGE);

    const handleSearch = (v) => { setSearchQuery(v); setPage(1); };
    const handleFilter = (v) => { setFilterStatus(v); setPage(1); };

    const handleSaveService = async (e) => {
        e.preventDefault();
        const totalSpareparts = formData.spareparts.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
        const totalCost = (Number(formData.laborCost) || 0) + totalSpareparts;

        const technician = technicians.find(t => t.id === formData.technicianId);

        const getNextServiceNo = () => {
            if (selectedService?.serviceNo) return selectedService.serviceNo;
            const yearMonth = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
            const prefix = `SRV-${yearMonth}-`;
            const currentMonthServices = services.filter(s => s.serviceNo?.startsWith(prefix));
            let nextNum = 1;
            if (currentMonthServices.length > 0) {
                const nums = currentMonthServices.map(s => {
                    const parts = s.serviceNo.split('-');
                    return parseInt(parts[parts.length - 1], 10) || 0;
                }).filter(n => !isNaN(n));
                nextNum = Math.max(0, ...nums) + 1;
            } else if (services.length > 0) {
                nextNum = services.length + 1;
            }
            return `${prefix}${nextNum.toString().padStart(4, '0')}`;
        };

        const newRecord = {
            ...formData,
            serviceNo: getNextServiceNo(),
            customerName: customers.find(c => c.id === formData.customerId)?.name || formData.customerName || 'Pelanggan Umum',
            conditionPhysic: formData.condition,
            totalCost,
            status: formData.status || selectedService?.status || 'approval',
        };


        try {
            let targetId = selectedService?.id;

            if (selectedService) {
                // If it's just a status change without diagnosis/spareparts, PATCH status
                // But full form uses PUT to update everything
                await api.put(`/service/${targetId}`, newRecord);
            } else {
                const res = await api.post('/service', newRecord);
                targetId = res.data.id;

                // If we have spareparts/diagnosis right at creation, we immediately update it
                if (newRecord.spareparts?.length > 0 || newRecord.laborCost > 0 || newRecord.diagnosis) {
                    await api.put(`/service/${targetId}`, newRecord);
                }
            }
            setShowForm(false);
            setSelectedService(null);
            resetForm();
            loadData();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Terjadi kesalahan sistem', timer: 3000 });
        }
    };

    const resetForm = () => {
        setFormData({
            customerId: '',
            customerName: '',
            phone: '',
            machineInfo: '',
            serialNo: '',
            complaint: '',
            condition: '',
            priority: 'normal',
            technicianId: '',
            laborCost: 0,
            dpAmount: 0,
            spareparts: []
        });
    };

    const addSparepart = () => {
        setFormData({
            ...formData,
            spareparts: [...formData.spareparts, { id: Date.now(), productId: '', name: '', qty: 1, price: 0, subtotal: 0 }]
        });
    };

    const removeSparepart = (id) => {
        setFormData({
            ...formData,
            spareparts: formData.spareparts.filter(p => p.id !== id)
        });
    };

    const updateSparepart = (id, field, value) => {
        const updated = formData.spareparts.map(p => {
            if (p.id === id) {
                const newPart = { ...p, [field]: value };
                if (field === 'qty' || field === 'price') {
                    newPart.subtotal = (Number(newPart.qty) || 0) * (Number(newPart.price) || 0);
                }
                return newPart;
            }
            return p;
        });
        setFormData({ ...formData, spareparts: updated });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approval': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50';
            case 'pengerjaan': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50';
            case 'selesai': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50';
            case 'diambil': return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border border-slate-200 dark:border-slate-800/50';
            case 'batal': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 font-display bg-slate-50/30 dark:bg-transparent min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-500/20">
                            <FiCpu className="text-xl sm:text-2xl" />
                        </div>
                        <span className="truncate">Servis Mesin Fotocopy</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 ml-1 italic opacity-75">Tiket Perbaikan & Pemeliharaan Teknisi</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setSelectedService(null); resetForm(); }}
                    className="flex items-center justify-center gap-2 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95 group"
                >
                    <FiPlus className="text-lg group-hover:rotate-90 transition-transform" />
                    Tiket Baru
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: 'Total Tiket', value: stats.total, icon: FiActivity, color: 'blue', sub: 'Semua Tiket' },
                    { label: 'Menunggu', value: stats.pending, icon: FiClock, color: 'amber', sub: 'Perlu Konfirmasi' },
                    { label: 'Proses', value: stats.active, icon: FiSettings, color: 'indigo', sub: 'Sedang Diperbaiki' },
                    { label: 'Selesai', value: stats.completed, icon: FiCheckCircle, color: 'emerald', sub: 'Siap Diambil' },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-5 group hover:shadow-md transition-all">
                        <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${s.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                            s.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' :
                                s.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' :
                                    'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                            }`}>
                            <s.icon className="text-2xl" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{s.label}</p>
                                <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase border border-slate-100 dark:border-slate-800 px-1 rounded">{s.sub}</span>
                            </div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-2 italic tracking-tighter">
                                {String(s.value).padStart(2, '0')}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content: Table & Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden 
                            flex flex-col w-full min-w-0">
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 sm:gap-6 justify-between bg-slate-50/30 dark:bg-slate-800/20">
                    <div className="relative flex-1 group w-full lg:max-w-xl">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari Tiket, Pelanggan, atau Unit..."
                            className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-xs font-bold placeholder:text-slate-400 placeholder:font-medium"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full overflow-auto pb-2 lg:pb-0 items-center custom-scrollbar">
                        <div className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mr-2 border-r border-slate-200 dark:border-slate-800 pr-4 whitespace-nowrap">Filter:</div>
                        {['all', 'approval', 'pengerjaan', 'selesai'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === status
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                                    }`}
                            >
                                {status === 'all' ? 'Semua' : status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-auto w-full">
                    <table className="w-full text-left border-collapse md:min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4 sm:p-6 text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/10 whitespace-nowrap">ID Tiket</th>
                                <th className="p-4 sm:p-6 text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/10">Pelanggan & Unit</th>
                                <th className="p-4 sm:p-6 text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/10">Problem Triage</th>
                                <th className="p-4 sm:p-6 text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/10 text-center">Status</th>
                                <th className="p-4 sm:p-6 text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/10 text-right">Progress/Est.</th>
                                <th className="p-4 sm:p-6 text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/10 text-center w-24">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {paginatedServices.map((srv) => (
                                <tr key={srv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-black text-blue-600 dark:text-blue-400 text-xs font-mono tracking-wider bg-blue-50/50 dark:bg-blue-900/10 px-2 py-1 rounded w-fit">{srv.serviceNo}</span>
                                            <span className="text-[9px] text-slate-400 mt-2 font-black uppercase tracking-widest">{formatDate(srv.createdAt, 'dd MMM yyyy HH:mm')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 dark:text-white uppercase text-[11px] tracking-tight">{srv.customerName}</span>
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-1.5 opacity-75">
                                                <FiBox className="text-blue-500" /> {srv.machineInfo} <span className="opacity-50">/</span> {srv.serialNo || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm ${getStatusColor(srv.status)}`}>
                                            {srv.status === 'approval' ? <FiClock /> : srv.status === 'pengerjaan' ? <FiSettings className="animate-spin-slow" /> : <FiCheckCircle />}
                                            {srv.status === 'approval' ? 'Pending' : srv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                <FiUser />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{srv.technicianName || 'unassigned'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="font-black text-slate-900 dark:text-white text-xs italic tracking-tighter">
                                            {formatRupiah(srv.totalCost)}
                                        </div>
                                        {srv.dpAmount > 0 && (
                                            <div className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mt-1 relative inline-flex items-center gap-1">
                                                <div className="size-1 bg-emerald-500 rounded-full animate-pulse"></div>
                                                DP: {formatRupiah(srv.dpAmount)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {[
                                                {
                                                    icon: <FiEdit2 />, label: 'Edit', color: 'blue', onClick: () => {
                                                        setSelectedService(srv);
                                                        api.get(`/service/${srv.id}`).then(res => {
                                                            const detail = res.data;
                                                            setFormData({
                                                                ...detail,
                                                                condition: detail.conditionPhysic || detail.condition || '',
                                                                spareparts: detail.spareparts || [],
                                                                laborCost: detail.laborCost || 0
                                                            });
                                                            setShowForm(true);
                                                        }).catch(() => {
                                                            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memuat detail tiket', timer: 3000 });
                                                        });
                                                    }
                                                },
                                                { icon: <FiPrinter />, label: 'Invoice', color: 'emerald', onClick: () => onNavigate('print-service-invoice', { serviceId: srv.id }) },
                                                { icon: <FiShield />, label: 'Warranty', color: 'blue', onClick: () => onNavigate('print-warranty-sticker', { serviceId: srv.id }) },
                                                { icon: <FiTrash2 />, label: 'Hapus', color: 'rose', onClick: () => { } /* Add delete confirmation if needed */ },
                                            ].map((btn, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={btn.onClick}
                                                    className={`p-2 rounded-xl text-slate-400 transition-all border border-transparent shadow-sm flex items-center justify-center
                                                        ${btn.color === 'blue' ? 'hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-100 dark:hover:border-blue-900/50' :
                                                            btn.color === 'emerald' ? 'hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-100 dark:hover:border-emerald-900/50' :
                                                                'hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 hover:border-rose-100 dark:hover:border-rose-900/50'
                                                        }`}
                                                    title={btn.label}
                                                >
                                                    {btn.icon}
                                                </button>
                                            ))}
                                            {srv.status === 'selesai' && (
                                                <button
                                                    onClick={() => setSettleTask(srv)}
                                                    className="p-2 rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 transition-all shadow-sm flex items-center justify-center hover:bg-emerald-600 hover:text-white"
                                                    title="Pelunasan & Ambil"
                                                >
                                                    <FiDollar />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredServices.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center text-center">
                            <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
                                <FiCpu size={32} className="text-slate-200 dark:text-slate-700" />
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">Database tiket kosong / tidak ditemukan</p>
                            <button
                                onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
                                className="mt-4 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                            >
                                Reset Pencarian
                            </button>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {filteredServices.length > PER_PAGE && (
                    <div className="p-6 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Displaying {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filteredServices.length)} of {filteredServices.length} service records
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
                            >
                                <FiChevronLeft size={18} />
                            </button>
                            <span className="text-xs font-black min-w-[3rem] text-center dark:text-white">
                                {page} <span className="text-slate-400">/</span> {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
                            >
                                <FiChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Service Ticket Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[96vh] sm:max-h-[90vh] overflow-hidden rounded-[2rem] sm:rounded-[3rem] shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 slide-in-from-bottom-12 duration-500 transform transition-all">
                        <div className="p-4 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex items-center gap-3 sm:gap-6">
                                <div className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl text-white shadow-xl ${selectedService ? 'bg-blue-600 shadow-blue-500/20' : 'bg-emerald-600 shadow-emerald-500/20'}`}>
                                    {selectedService ? <FiEdit2 size={20} className="sm:w-6 sm:h-6" /> : <FiPlus size={20} className="sm:w-6 sm:h-6" />}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight sm:tracking-tighter uppercase italic flex flex-wrap items-center gap-2 sm:gap-3">
                                        {selectedService ? 'Koreksi Tiket' : 'Tiket Servis Baru'}
                                        {selectedService && <span className="text-[10px] sm:text-sm font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl not-italic tracking-normal">{selectedService.serviceNo}</span>}
                                    </h2>
                                    <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] mt-1 sm:mt-2 italic opacity-75 underline decoration-blue-500/30 underline-offset-4 hidden sm:block">Maintenance & Repair Log Authorization</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowForm(false)}
                                className="group w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl sm:rounded-[1.5rem] bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 transition-all shadow-sm border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50 flex-shrink-0"
                            >
                                <FiX className="text-xl sm:text-2xl group-hover:rotate-180 transition-transform duration-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-10 custom-scrollbar bg-white dark:bg-transparent">
                            <form id="serviceForm" onSubmit={handleSaveService} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
                                {/* Left Column: Client & Unit */}
                                <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                                    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800/50 space-y-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>

                                        <div className="flex items-center gap-3 relative z-10">
                                            <FiUser className="text-blue-600" />
                                            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Identitas Pelanggan</h3>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Database Pelanggan *</label>
                                                <select
                                                    required
                                                    className="w-full bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-800/50 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                                    value={formData.customerId}
                                                    onChange={(e) => {
                                                        const c = customers.find(x => x.id === e.target.value);
                                                        setFormData({ ...formData, customerId: e.target.value, customerName: c?.name || '', phone: c?.phone || '' });
                                                    }}
                                                >
                                                    <option value="">-- ILIH DATA PELANGGAN --</option>
                                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()} {c.company ? `(${c.company.toUpperCase()})` : ''}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none italic opacity-75">Verified Phone No.</label>
                                                <div className="flex gap-2">
                                                    <div className="flex-1 bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-mono font-bold text-slate-500 flex items-center gap-2">
                                                        <FiPhone size={12} className="text-emerald-500" />
                                                        {formData.phone || 'AUTO-FETCHED'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <FiBox className="text-slate-400" />
                                            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Parameter Unit</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Model / Tipe Mesin *</label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="Contoh: Kyocera TASKalfa 2554ci"
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400/50"
                                                    value={formData.machineInfo}
                                                    onChange={(e) => setFormData({ ...formData, machineInfo: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Serial Number (SN)</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-mono font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400/50"
                                                    placeholder="X-000-000"
                                                    value={formData.serialNo}
                                                    onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Fisik</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400/50"
                                                    placeholder="Lecet halus, dll..."
                                                    value={formData.condition}
                                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Issues, Spareparts, Costs */}
                                <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <FiAlertCircle className="text-rose-500" />
                                                <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Diagnosis Problem</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Keluhan Kerusakan *</label>
                                                    <textarea
                                                        required
                                                        rows="3"
                                                        placeholder="Deskripsikan masalah mesin secara detail..."
                                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] py-3.5 px-4 text-xs font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all placeholder:text-slate-400/50 resize-none"
                                                        value={formData.complaint}
                                                        onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Teknisi *</label>
                                                        <select
                                                            required
                                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                                            value={formData.technicianId}
                                                            onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                                                        >
                                                            <option value="">-- ILIH TEKNISI --</option>
                                                            {technicians.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioritas Kerja</label>
                                                        <select
                                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer text-indigo-600 uppercase"
                                                            value={formData.priority}
                                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                        >
                                                            <option value="low">Standard</option>
                                                            <option value="normal">Normal</option>
                                                            <option value="urgent">Urgent / High</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Operational (Real-time)</label>
                                                    <select
                                                        className="w-full bg-slate-900 text-white rounded-2xl py-3.5 px-4 text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-500/20 transition-all cursor-pointer"
                                                        value={formData.status || 'approval'}
                                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                    >
                                                        <option value="approval">Awaiting Approval (New Ticket)</option>
                                                        <option value="pengerjaan">Under Maintenance (Processing)</option>
                                                        <option value="selesai">Ready for Pickup (Complete)</option>
                                                        <option value="diambil">Settled / Taken (Archive)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <FiSettings className="text-emerald-500" />
                                                    <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Inventory Assignment</h3>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={addSparepart}
                                                    className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 dark:border-emerald-800/50"
                                                >
                                                    <FiPlus size={14} />
                                                </button>
                                            </div>

                                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                {formData.spareparts.map((part) => (
                                                    <div key={part.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 group relative hover:border-emerald-200 transition-colors">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSparepart(part.id)}
                                                            className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <FiTrash2 size={12} />
                                                        </button>
                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Sparepart dari Inventory</label>
                                                                <select
                                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl py-2 px-3 text-[10px] font-black focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                                                                    value={part.productId || ''}
                                                                    onChange={(e) => {
                                                                        const p = products.find(prod => prod.id === e.target.value);
                                                                        if (p) {
                                                                            updateSparepart(part.id, 'productId', p.id);
                                                                            updateSparepart(part.id, 'name', p.name);
                                                                            updateSparepart(part.id, 'price', p.sellPrice);
                                                                        } else {
                                                                            updateSparepart(part.id, 'productId', '');
                                                                        }
                                                                    }}
                                                                >
                                                                    <option value="">-- PILIH BARANG --</option>
                                                                    {products.filter(p => !p.category_name || p.category_name.toLowerCase().includes('sparepart')).map(p => (
                                                                        <option key={p.id} value={p.id}>{p.name.toUpperCase()} (STOK: {p.stock})</option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Deskripsi (Custom)</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Nama Komponen / Sparepart"
                                                                    className="w-full bg-transparent border-b border-slate-100 dark:border-slate-800 p-0 focus:ring-0 font-black text-[11px] text-slate-800 dark:text-white uppercase placeholder:text-slate-300 placeholder:normal-case"
                                                                    value={part.name}
                                                                    onChange={(e) => updateSparepart(part.id, 'name', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-4 items-center">
                                                            <div className="flex-1 flex flex-col gap-1">
                                                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity/Qty</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg py-1.5 px-2 text-xs font-black focus:ring-2 focus:ring-emerald-500"
                                                                    value={part.qty}
                                                                    onChange={(e) => updateSparepart(part.id, 'qty', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="flex-2 flex flex-col gap-1">
                                                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (Rp)</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg py-1.5 px-2 text-xs font-black focus:ring-2 focus:ring-emerald-500"
                                                                    placeholder="Unit Price..."
                                                                    value={part.price}
                                                                    onChange={(e) => updateSparepart(part.id, 'price', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="flex-2 text-right">
                                                                <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Subtotal</span>
                                                                <span className="font-black text-slate-900 dark:text-white text-[11px] italic tracking-tight">
                                                                    {formatRupiah(part.subtotal || 0)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {formData.spareparts.length === 0 && (
                                                    <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] flex flex-col items-center gap-2">
                                                        <FiBox size={24} className="text-slate-200" />
                                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">No components assigned</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial Settlement */}
                                    <div className="p-8 bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] text-white flex flex-col md:flex-row gap-8 items-center justify-between relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none"></div>
                                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full -mb-24 -mr-24 blur-3xl group-hover:scale-125 transition-transform duration-700"></div>

                                        <div className="space-y-6 flex-1 w-full">
                                            <div className="flex items-center gap-3">
                                                <FiCreditCard className="text-blue-500" />
                                                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Financial Settlement Analysis</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative z-10">
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Labor Cost (Rp)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-500 italic">IDR</span>
                                                        <input
                                                            type="number"
                                                            className="w-full bg-white/5 dark:bg-slate-800/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-xl font-black text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all tracking-tighter"
                                                            value={formData.laborCost}
                                                            onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">DP / Amanah (Rp)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500 italic">IDR</span>
                                                        <input
                                                            type="number"
                                                            className="w-full bg-white/5 dark:bg-slate-800/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-xl font-black text-emerald-400 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all tracking-tighter"
                                                            value={formData.dpAmount}
                                                            onChange={(e) => setFormData({ ...formData, dpAmount: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-px h-20 bg-slate-800 hidden md:block"></div>

                                        <div className="text-center md:text-right min-w-[200px] relative z-10">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Total Estimated Invoice</p>
                                            <p className="text-5xl font-black text-white italic tracking-tighter flex items-center justify-center md:justify-end gap-2 drop-shadow-2xl">
                                                <span className="text-2xl not-italic text-blue-500 -mt-2">Rp</span>
                                                {((Number(formData.laborCost) || 0) + formData.spareparts.reduce((s, i) => s + (Number(i.subtotal) || 0), 0)).toLocaleString('id-ID')}
                                                <span className="text-[12px] not-italic text-slate-500 uppercase tracking-[0.05em] align-baseline">,-</span>
                                            </p>
                                            <div className="flex items-center justify-center md:justify-end gap-2 mt-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                                <FiActivity className="text-blue-500 animate-pulse" /> Final settlement based on actual usage
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 pb-24 sm:pb-8">
                            <div className="flex gap-3 sm:gap-4 items-center p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 max-w-lg shadow-sm w-full md:w-auto">
                                <div className="size-10 sm:size-12 flex-shrink-0 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600 border border-blue-50 dark:border-blue-900/30">
                                    <FiInfo size={20} className="sm:w-6 sm:h-6" />
                                </div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wide italic">
                                    "Pastikan diagnosis awal disetujui pelanggan sebelum masuk fase <span className="text-blue-600 font-black not-italic">[PENGERJAAN]</span>."
                                </p>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 w-full md:w-auto mt-2 md:mt-0">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 bg-white dark:bg-slate-900 text-slate-500 text-[11px] font-black uppercase tracking-widest rounded-2xl sm:rounded-[1.5rem] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 active:scale-95 text-center"
                                >
                                    Dismiss / Batal
                                </button>
                                <button
                                    form="serviceForm"
                                    type="submit"
                                    className="w-full sm:w-auto md:flex-none px-8 sm:px-16 py-4 sm:py-5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl sm:rounded-[1.5rem] shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all active:scale-95 flex items-center justify-center gap-2 sm:gap-3 group"
                                >
                                    <FiSave className="text-base sm:text-lg group-hover:bounce" />
                                    Authorize / Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Pelunasan Modal */}
            <PelunasanModal
                isOpen={!!settleTask}
                onClose={() => setSettleTask(null)}
                task={settleTask}
                type="service"
                onSuccess={() => {
                    loadData();
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'Pelunasan servis berhasil diproses.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }}
            />
        </div>
    );
}
