import { useState, useEffect } from 'react';
import {
    FiTool, FiPlus, FiSearch, FiFilter, FiCalendar, FiClock,
    FiCheckCircle, FiAlertCircle, FiChevronRight, FiMoreVertical,
    FiPrinter, FiEdit2, FiTrash2, FiUser, FiInfo, FiActivity,
    FiSettings, FiBox, FiPhone, FiCreditCard
} from 'react-icons/fi';
import db from '../db';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

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

    const loadData = () => {
        const srv = db.getAll('service_orders');
        const cust = db.getAll('customers');
        const users = db.getAll('users');
        setServices(srv.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setCustomers(cust);
        setTechnicians(users.filter(u => u.role === 'teknisi'));
    };

    const stats = {
        total: services.length,
        pending: services.filter(s => s.status === 'approval' || s.status === 'pending').length,
        active: services.filter(s => s.status === 'pengerjaan').length,
        completed: services.filter(s => s.status === 'selesai').length
    };

    const filteredServices = services.filter(s => {
        const matchesSearch =
            s.serviceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.machineInfo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.serialNo && s.serialNo.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleSaveService = (e) => {
        e.preventDefault();
        const totalSpareparts = formData.spareparts.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
        const totalCost = (Number(formData.laborCost) || 0) + totalSpareparts;

        const technician = technicians.find(t => t.id === formData.technicianId);

        const newRecord = {
            ...formData,
            id: selectedService?.id || `so_${Date.now()}`,
            serviceNo: selectedService?.serviceNo || `SRV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${(services.length + 1).toString().padStart(4, '0')}`,
            customerName: customers.find(c => c.id === formData.customerId)?.name || formData.customerName,
            technicianName: technician?.name || '',
            totalCost,
            status: formData.status || selectedService?.status || 'approval',
            entryDate: selectedService?.entryDate || new Date().toISOString(),
            createdAt: selectedService?.createdAt || new Date().toISOString(),
        };

        if (selectedService) {
            db.update('service_orders', selectedService.id, newRecord);
        } else {
            db.insert('service_orders', newRecord);
        }

        setShowForm(false);
        setSelectedService(null);
        resetForm();
        loadData();
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
            spareparts: [...formData.spareparts, { id: Date.now(), name: '', qty: 1, price: 0, subtotal: 0 }]
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
            case 'approval': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'pengerjaan': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'selesai': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'diambil': return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 bg-[#f8fafc] dark:bg-[#0f1117] min-h-screen font-display">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                            <FiTool className="text-2xl" />
                        </div>
                        Servis Mesin Fotocopy
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Pengelolaan tiket perbaikan dan perawatan mesin.</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setSelectedService(null); resetForm(); }}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95"
                >
                    <FiPlus className="text-xl" />
                    Tiket Baru
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'Total Tiket', value: stats.total, icon: FiActivity, color: 'blue' },
                    { label: 'Menunggu', value: stats.pending, icon: FiClock, color: 'amber' },
                    { label: 'Proses', value: stats.active, icon: FiSettings, color: 'blue' },
                    { label: 'Selesai', value: stats.completed, icon: FiCheckCircle, color: 'emerald' },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-${s.color}-100 dark:bg-${s.color}-900/30 text-${s.color}-600 dark:text-${s.color}-400`}>
                            <s.icon className="text-2xl" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content: Table & Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari No. Servis, Pelanggan, atau Unit..."
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        {['all', 'approval', 'pengerjaan', 'selesai'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${filterStatus === status
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                    : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100'
                                    } shadow-sm`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                                <th className="px-6 py-4">No. Servis</th>
                                <th className="px-6 py-4">Pelanggan & Unit</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Teknisi</th>
                                <th className="px-6 py-4 text-right">Total Biaya</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredServices.map((srv) => (
                                <tr key={srv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-blue-600 dark:text-blue-400">{srv.serviceNo}</span>
                                            <span className="text-[10px] text-slate-400 mt-1 font-medium">{formatDate(srv.createdAt, 'dd MMM yyyy HH:mm')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-white uppercase text-sm tracking-tight">{srv.customerName}</span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <FiBox className="text-[10px]" /> {srv.machineInfo} {srv.serialNo && `(SN: ${srv.serialNo})`}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusColor(srv.status)}`}>
                                            {srv.status === 'approval' ? 'Menunggu Konfirmasi' : srv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-500">
                                                <FiUser />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{srv.technicianName || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="font-black text-slate-900 dark:text-white">
                                            Rp {srv.totalCost?.toLocaleString('id-ID')}
                                        </div>
                                        {srv.dpAmount > 0 && (
                                            <div className="text-[10px] text-emerald-600 font-bold">DP: Rp {srv.dpAmount.toLocaleString('id-ID')}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-2 transition-opacity">
                                            <button
                                                onClick={() => { setSelectedService(srv); setFormData({ ...srv }); setShowForm(true); }}
                                                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                                title="Edit Tiket"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => onNavigate('print-service-invoice', { serviceId: srv.id })}
                                                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                                                title="Cetak Invoice"
                                            >
                                                <FiPrinter size={16} />
                                            </button>
                                            <button
                                                className="p-2 bg-slate-100 dark:bg-slate-800 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                                                title="Hapus"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredServices.length === 0 && (
                        <div className="p-20 flex flex-col items-center justify-center text-slate-400">
                            <FiInfo size={48} className="mb-4 opacity-20" />
                            <p className="font-bold tracking-tight">Tidak ada tiket servis ditemukan.</p>
                            <p className="text-xs">Coba ubah filter atau kata kunci pencarian Anda.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Service Ticket Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 slide-in-from-bottom-8 duration-300">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                                    {selectedService ? 'Edit Tiket Servis' : 'Tiket Servis Baru'}
                                </h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Lengkapi detail perbaikan unit</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                                <FiPlus className="rotate-45 text-2xl" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <form id="serviceForm" onSubmit={handleSaveService} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Pelanggan Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                            <FiUser />
                                        </div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Data Pelanggan</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Pelanggan / Perusahaan</label>
                                            <select
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500"
                                                value={formData.customerId}
                                                onChange={(e) => {
                                                    const c = customers.find(x => x.id === e.target.value);
                                                    setFormData({ ...formData, customerId: e.target.value, customerName: c?.name || '', phone: c?.phone || '' });
                                                }}
                                            >
                                                <option value="">Pilih Pelanggan Existing</option>
                                                {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `- ${c.company}` : ''}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Telepon / WA (Auto-fill)</label>
                                            <input
                                                disabled
                                                type="text"
                                                className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl py-3 px-4 text-slate-500 cursor-not-allowed"
                                                value={formData.phone}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mb-2 pt-4">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                                            <FiBox />
                                        </div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Detail Unit</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Model & Tipe Mesin</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Contoh: Canon IR 2520"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500"
                                                value={formData.machineInfo}
                                                onChange={(e) => setFormData({ ...formData, machineInfo: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Serial Number (SN)</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500"
                                                value={formData.serialNo}
                                                onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kondisi Saat Masuk</label>
                                            <textarea
                                                rows="2"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500"
                                                value={formData.condition}
                                                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Kerusakan & Biaya Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center">
                                            <FiAlertCircle />
                                        </div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Diagnosis & Masalah</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keluhan Pelanggan</label>
                                            <textarea
                                                required
                                                rows="2"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500"
                                                value={formData.complaint}
                                                onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioritas</label>
                                                <select
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500"
                                                    value={formData.priority}
                                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                >
                                                    <option value="low">Low</option>
                                                    <option value="normal">Normal</option>
                                                    <option value="urgent">Urgent / High</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teknisi</label>
                                                <select
                                                    required
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500"
                                                    value={formData.technicianId}
                                                    onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                                                >
                                                    <option value="">Pilih Teknisi</option>
                                                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        {/* Status Update */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Update Status Pengerjaan</label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500"
                                                value={formData.status || 'approval'}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            >
                                                <option value="approval">Menunggu Konfirmasi</option>
                                                <option value="pengerjaan">Sedang Dikerjakan</option>
                                                <option value="selesai">Selesai (Siap Diambil)</option>
                                                <option value="diambil">Sudah Diambil</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mb-2 pt-4">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                                            <FiSettings />
                                        </div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Sparepart & Suku Cadang</h3>
                                    </div>

                                    {/* Spareparts Dynamic List */}
                                    <div className="space-y-4">
                                        {formData.spareparts.map((part) => (
                                            <div key={part.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 group">
                                                <div className="flex justify-between items-start">
                                                    <input
                                                        type="text"
                                                        placeholder="Nama Sparepart"
                                                        className="flex-1 bg-transparent border-none p-0 focus:ring-0 font-bold text-sm text-slate-800 dark:text-white"
                                                        value={part.name}
                                                        onChange={(e) => updateSparepart(part.id, 'name', e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSparepart(part.id)}
                                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                                <div className="flex gap-4 items-center">
                                                    <div className="flex-1 flex gap-2 items-baseline">
                                                        <input
                                                            type="number"
                                                            className="w-12 bg-white dark:bg-slate-800 border-none rounded-lg py-1 px-2 text-xs text-center focus:ring-1 focus:ring-blue-500"
                                                            value={part.qty}
                                                            onChange={(e) => updateSparepart(part.id, 'qty', e.target.value)}
                                                        />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">Qty</span>
                                                    </div>
                                                    <div className="flex-[2] flex gap-2 items-baseline">
                                                        <input
                                                            type="number"
                                                            className="w-full bg-white dark:bg-slate-800 border-none rounded-lg py-1 px-2 text-xs focus:ring-1 focus:ring-blue-500"
                                                            placeholder="Harga"
                                                            value={part.price}
                                                            onChange={(e) => updateSparepart(part.id, 'price', e.target.value)}
                                                        />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">Satuan</span>
                                                    </div>
                                                    <div className="flex-[2] text-right font-black text-slate-900 dark:text-white text-xs">
                                                        Rp {(part.subtotal || 0).toLocaleString('id-ID')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={addSparepart}
                                            className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FiPlus /> Tambah Sparepart
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3 mb-2 pt-4">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                                            <FiCreditCard />
                                        </div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Rincian Biaya</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Biaya Jasa (Rp)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 font-bold"
                                                value={formData.laborCost}
                                                onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Uang Muka / DP (Rp)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 font-bold"
                                                value={formData.dpAmount}
                                                onChange={(e) => setFormData({ ...formData, dpAmount: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                            <div className="hidden sm:block">
                                <p className="text-xs text-slate-400 font-bold">Total Estimasi (Jasa + Sparepart)</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">
                                    Rp {((Number(formData.laborCost) || 0) + formData.spareparts.reduce((s, i) => s + (Number(i.subtotal) || 0), 0)).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <div className="flex gap-4 w-full sm:w-auto">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 sm:flex-none px-8 py-4 bg-white dark:bg-slate-800 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-all border border-slate-200 dark:border-slate-700"
                                >
                                    Batal
                                </button>
                                <button
                                    form="serviceForm"
                                    className="flex-1 sm:flex-none px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all active:scale-95"
                                >
                                    Simpan Tiket
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

