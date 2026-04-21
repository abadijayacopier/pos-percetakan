import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiUsers, FiPlus, FiEdit, FiTrash2, FiClock, FiDollarSign,
    FiSearch, FiFilter, FiDownload, FiCheckCircle, FiAlertCircle,
    FiUserPlus, FiCreditCard, FiCalendar, FiChevronRight, FiFileText,
    FiRefreshCw
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import Modal from '../components/Modal';

export default function PayrollPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [subTab, setSubTab] = useState('employees'); // employees, attendance, loans, salaries

    // Data States
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loans, setLoans] = useState([]);
    const [salaries, setSalaries] = useState([]);
    const [systemUsers, setSystemUsers] = useState([]);
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

    // Form States
    const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
    const [empForm, setEmpForm] = useState({
        name: '', nik: '', phone: '', address: '', position: '',
        salary_type: 'monthly', base_salary: 0, hourly_rate: 0, user_id: null
    });
    const [editingEmp, setEditingEmp] = useState(null);

    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [loanForm, setLoanForm] = useState({ employee_id: '', amount: 0, date: new Date().toISOString().split('T')[0], description: '' });

    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [attendanceForm, setAttendanceForm] = useState({ employee_id: '', date: new Date().toISOString().split('T')[0], clock_in: '08:00', clock_out: '17:00', work_hours: 8, notes: '' });

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [period, setPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

    useEffect(() => {
        loadEmployees();
        loadSystemUsers();
    }, []);

    useEffect(() => {
        if (subTab === 'attendance') loadAttendance();
        if (subTab === 'loans') loadLoans();
        if (subTab === 'salaries') loadSalaries();
    }, [subTab, period]);

    const loadEmployees = async () => {
        try {
            const { data } = await api.get('/employees');
            setEmployees(data);
        } catch (e) { showToast('Gagal memuat data karyawan', 'error'); }
        finally { setLoading(false); }
    };

    const loadSystemUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setSystemUsers(data);
        } catch (e) { }
    };

    const loadAttendance = async () => {
        try {
            const { data } = await api.get('/payroll/attendance');
            setAttendance(data);
        } catch (e) { }
    };

    const loadLoans = async () => {
        try {
            const { data } = await api.get('/payroll/loans');
            setLoans(data);
        } catch (e) { }
    };

    const loadSalaries = async () => {
        try {
            const { data } = await api.get('/payroll/salaries', { params: period });
            setSalaries(data);
        } catch (e) { }
    };

    const handleSaveEmployee = async () => {
        try {
            if (editingEmp) {
                await api.put(`/employees/${editingEmp.id}`, empForm);
                showToast('Karyawan diperbarui', 'success');
            } else {
                await api.post('/employees', empForm);
                showToast('Karyawan ditambahkan', 'success');
            }
            setIsEmpModalOpen(false);
            loadEmployees();
        } catch (e) { showToast('Gagal menyimpan data', 'error'); }
    };

    const handleDeleteEmployee = async (id) => {
        const res = await Swal.fire({
            title: 'Hapus Karyawan?',
            text: 'Data gaji dan absensi terkait mungkin terpengaruh.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444'
        });
        if (res.isConfirmed) {
            try {
                await api.delete(`/employees/${id}`);
                showToast('Karyawan dihapus', 'success');
                loadEmployees();
            } catch (e) { showToast('Gagal menghapus', 'error'); }
        }
    };

    const handleSaveLoan = async () => {
        try {
            await api.post('/payroll/loans', loanForm);
            showToast('Pinjaman berhasil dicatat', 'success');
            setIsLoanModalOpen(false);
            loadLoans();
        } catch (e) { showToast('Gagal mencatat pinjaman', 'error'); }
    };

    const handleSaveAttendance = async () => {
        if (!attendanceForm.employee_id) return showToast('Pilih karyawan', 'error');
        try {
            await api.post('/payroll/attendance', {
                records: [{
                    ...attendanceForm,
                    clock_in: `${attendanceForm.date} ${attendanceForm.clock_in}:00`,
                    clock_out: `${attendanceForm.date} ${attendanceForm.clock_out}:00`
                }]
            });
            showToast('Absensi berhasil dicatat', 'success');
            setIsAttendanceModalOpen(false);
            loadAttendance();
        } catch (e) { showToast('Gagal mencatat absensi', 'error'); }
    };

    const handleGenerateSalaries = async () => {
        try {
            await api.post('/payroll/salaries/generate', period);
            showToast('Draft gaji berhasil digenerate', 'success');
            loadSalaries();
        } catch (e) { showToast('Gagal generate gaji', 'error'); }
    };

    const handlePaySalary = async (salary) => {
        const { value: formValues } = await Swal.fire({
            title: `Bayar Gaji: ${salary.employee_name}`,
            html: `
                <div class="space-y-4 text-left p-2">
                    <label class="block text-sm font-bold">Potongan Kasbon</label>
                    <input id="loan_deduction" type="number" class="swal2-input w-full m-0" value="0">
                    <label class="block text-sm font-bold">Bonus Absensi</label>
                    <input id="attendance_bonus" type="number" class="swal2-input w-full m-0" value="0">
                    <label class="block text-sm font-bold">Lembur</label>
                    <input id="overtime_pay" type="number" class="swal2-input w-full m-0" value="0">
                </div>
            `,
            focusConfirm: false,
            preConfirm: () => {
                return {
                    loan_deduction: document.getElementById('loan_deduction').value,
                    attendance_bonus: document.getElementById('attendance_bonus').value,
                    overtime_pay: document.getElementById('overtime_pay').value
                }
            }
        });

        if (formValues) {
            try {
                await api.post(`/payroll/salaries/pay/${salary.id}`, formValues);
                showToast('Gaji berhasil dibayarkan', 'success');
                loadSalaries();
            } catch (e) { showToast('Gagal memproses pembayaran', 'error'); }
        }
    };

    const handleSyncMachine = async () => {
        try {
            setLoading(true);
            showToast('Menghubungkan ke mesin sidik jari...', 'info');
            const { data } = await api.post('/payroll/attendance/sync-machine');
            showToast(data.message, 'success');
            loadAttendance();
        } catch (e) {
            const msg = e.response?.data?.message || 'Gagal terhubung ke mesin sidik jari. Pastikan IP benar dan satu jaringan.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100 font-display transition-colors pb-10">
            {/* Header */}
            <header className="px-6 py-6 md:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl">
                        <FiUsers size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SDM & Penggajian</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Kelola data karyawan, absensi, dan slip gaji</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {subTab === 'employees' && (
                        <button
                            onClick={() => { setEditingEmp(null); setEmpForm({ name: '', nik: '', phone: '', address: '', position: '', salary_type: 'monthly', base_salary: 0, hourly_rate: 0, user_id: null }); setIsEmpModalOpen(true); }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                        >
                            <FiUserPlus size={18} /> Tambah Karyawan
                        </button>
                    )}
                    {subTab === 'attendance' && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleSyncMachine}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 hover:bg-slate-50"
                            >
                                <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Tarik Data Mesin
                            </button>
                            <button
                                onClick={() => setIsAttendanceModalOpen(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95"
                            >
                                <FiPlus size={18} /> Tambah Absensi
                            </button>
                        </div>
                    )}
                    {subTab === 'loans' && (
                        <button
                            onClick={() => setIsLoanModalOpen(true)}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-amber-200 dark:shadow-none transition-all active:scale-95"
                        >
                            <FiCreditCard size={18} /> Catat Pinjaman
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
                {/* Navigation Tabs */}
                <div className="flex items-center gap-2 mb-8 bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit">
                    {[
                        { id: 'employees', label: 'Data Karyawan', icon: <FiUsers /> },
                        { id: 'attendance', label: 'Absensi', icon: <FiClock /> },
                        { id: 'loans', label: 'Kasbon/Pinjaman', icon: <FiCreditCard /> },
                        { id: 'salaries', label: 'Slip Gaji', icon: <FiDollarSign /> },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSubTab(t.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${subTab === t.id ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            {t.icon} <span>{t.label}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={subTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* 1. EMPLOYEES LIST */}
                        {subTab === 'employees' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {employees.map((emp) => (
                                    <div key={emp.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm group hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="size-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-2xl">
                                                {emp.name.charAt(0)}
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setEditingEmp(emp); setEmpForm(emp); setIsEmpModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><FiEdit /></button>
                                                <button onClick={() => handleDeleteEmployee(emp.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><FiTrash2 /></button>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{emp.name}</h3>
                                        <p className="text-sm text-slate-500 mb-4">{emp.position || 'No Position'}</p>

                                        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Tipe Gaji</span>
                                                <span className="font-bold uppercase text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded">{emp.salary_type}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Gaji Pokok</span>
                                                <span className="font-bold">Rp {emp.base_salary?.toLocaleString()}</span>
                                            </div>
                                            {emp.system_username && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">User Sistem</span>
                                                    <span className="font-medium text-emerald-600">{emp.system_username} ({emp.system_role})</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 2. ATTENDANCE LIST */}
                        {subTab === 'attendance' && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <th className="px-6 py-4">Karyawan</th>
                                            <th className="px-6 py-4">Tanggal</th>
                                            <th className="px-6 py-4">Jam Kerja</th>
                                            <th className="px-6 py-4">Durasi</th>
                                            <th className="px-6 py-4">Catatan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {attendance.map((att) => (
                                            <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                <td className="px-6 py-4 font-bold">{att.employee_name}</td>
                                                <td className="px-6 py-4 text-sm">{new Date(att.date).toLocaleDateString('id-ID')}</td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    {att.clock_in ? new Date(att.clock_in).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : '-'} s/d {att.clock_out ? new Date(att.clock_out).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : '-'}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-emerald-600">{att.work_hours} Jam</td>
                                                <td className="px-6 py-4 text-sm text-slate-500">{att.notes || '-'}</td>
                                            </tr>
                                        ))}
                                        {attendance.length === 0 && (
                                            <tr><td colSpan="5" className="py-20 text-center text-slate-400">Tidak ada data absensi</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 3. LOANS LIST */}
                        {subTab === 'loans' && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <th className="px-6 py-4">Karyawan</th>
                                            <th className="px-6 py-4">Tanggal</th>
                                            <th className="px-6 py-4">Jumlah</th>
                                            <th className="px-6 py-4">Sisa</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {loans.map((loan) => (
                                            <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                <td className="px-6 py-4 font-bold">{loan.employee_name}</td>
                                                <td className="px-6 py-4 text-sm">{new Date(loan.date).toLocaleDateString('id-ID')}</td>
                                                <td className="px-6 py-4 font-bold text-amber-600">Rp {loan.amount.toLocaleString()}</td>
                                                <td className="px-6 py-4 font-bold text-red-500">Rp {loan.remaining_amount.toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${loan.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{loan.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {loans.length === 0 && (
                                            <tr><td colSpan="5" className="py-20 text-center text-slate-400">Tidak ada data pinjaman</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 4. SALARIES LIST */}
                        {subTab === 'salaries' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="flex gap-4">
                                        <select value={period.month} onChange={e => setPeriod({ ...period, month: parseInt(e.target.value) })} className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                                            {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                                                <option key={i + 1} value={i + 1}>{m}</option>
                                            ))}
                                        </select>
                                        <select value={period.year} onChange={e => setPeriod({ ...period, year: parseInt(e.target.value) })} className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={handleGenerateSalaries} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 dark:shadow-none">
                                        <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Generate Slip Gaji
                                    </button>
                                </div>

                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Karyawan</th>
                                                <th className="px-6 py-4">Gaji Pokok</th>
                                                <th className="px-6 py-4">Lain-lain</th>
                                                <th className="px-6 py-4">Potongan</th>
                                                <th className="px-6 py-4">Total Akhir</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {salaries.map((s) => (
                                                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold">{s.employee_name}</p>
                                                        <p className="text-[10px] text-slate-500">{s.position}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium">Rp {s.base_processing_salary.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-sm text-emerald-600">
                                                        +{((s.attendance_bonus || 0) + (s.overtime_pay || 0)).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-red-500">
                                                        -{((s.loan_deduction || 0) + (s.other_deductions || 0)).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 font-black text-indigo-600">Rp {s.net_salary.toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${s.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {s.status === 'draft' ? (
                                                            <button onClick={() => handlePaySalary(s)} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-600 hover:text-white transition-all">Proses Bayar</button>
                                                        ) : (
                                                            <button onClick={() => { setSelectedSalary(s); setIsSlipModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><FiFileText size={18} /></button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {salaries.length === 0 && (
                                                <tr><td colSpan="7" className="py-20 text-center text-slate-400">Belum ada slip gaji dirilis untuk periode ini</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* EMPLOYEE MODAL */}
            <Modal isOpen={isEmpModalOpen} onClose={() => setIsEmpModalOpen(false)} title={editingEmp ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold mb-1">Nama Lengkap</label>
                            <input className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500" value={empForm.name} onChange={e => setEmpForm({ ...empForm, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">NIK/ID</label>
                            <input className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500" value={empForm.nik} onChange={e => setEmpForm({ ...empForm, nik: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Tipe Gaji</label>
                            <select className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500" value={empForm.salary_type} onChange={e => setEmpForm({ ...empForm, salary_type: e.target.value })}>
                                <option value="monthly">Bulanan</option>
                                <option value="hourly">Harian/Jam</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Gaji Pokok</label>
                            <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500" value={empForm.base_salary} onChange={e => setEmpForm({ ...empForm, base_salary: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">User Sistem (Link)</label>
                            <select className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500" value={empForm.user_id || ''} onChange={e => setEmpForm({ ...empForm, user_id: e.target.value || null })}>
                                <option value="">Tidak Terhubung</option>
                                {systemUsers.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={handleSaveEmployee} className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold mt-4">Simpan Data Karyawan</button>
                </div>
            </Modal>

            {/* LOAN MODAL */}
            <Modal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} title="Catat Pinjaman Baru (Kasbon)">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Pilih Karyawan</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-amber-500" value={loanForm.employee_id} onChange={e => setLoanForm({ ...loanForm, employee_id: e.target.value })}>
                            <option value="">-- Pilih Karyawan --</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Jumlah Pinjaman (Rp)</label>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-amber-500" value={loanForm.amount} onChange={e => setLoanForm({ ...loanForm, amount: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Alasan / Deskripsi</label>
                        <textarea className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-amber-500" value={loanForm.description} onChange={e => setLoanForm({ ...loanForm, description: e.target.value })} />
                    </div>
                    <button onClick={handleSaveLoan} className="w-full bg-amber-600 text-white p-3 rounded-xl font-bold mt-4">Simpan Pinjaman</button>
                </div>
            </Modal>

            {/* ATTENDANCE MODAL */}
            <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title="Input Absensi Manual">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Pilih Karyawan</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500" value={attendanceForm.employee_id} onChange={e => setAttendanceForm({ ...attendanceForm, employee_id: e.target.value })}>
                            <option value="">-- Pilih Karyawan --</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Tanggal</label>
                        <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500" value={attendanceForm.date} onChange={e => setAttendanceForm({ ...attendanceForm, date: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Jam Masuk</label>
                            <input type="time" className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500" value={attendanceForm.clock_in} onChange={e => setAttendanceForm({ ...attendanceForm, clock_in: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Jam Pulang</label>
                            <input type="time" className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500" value={attendanceForm.clock_out} onChange={e => setAttendanceForm({ ...attendanceForm, clock_out: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Total Jam Kerja (Durasi)</label>
                        <input type="number" step="0.5" className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500" value={attendanceForm.work_hours} onChange={e => setAttendanceForm({ ...attendanceForm, work_hours: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Catatan</label>
                        <input type="text" placeholder="Hadir / Sakit / Izin / Lembur" className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500" value={attendanceForm.notes} onChange={e => setAttendanceForm({ ...attendanceForm, notes: e.target.value })} />
                    </div>
                    <button onClick={handleSaveAttendance} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold mt-4 transition-colors">Simpan Absensi</button>
                </div>
            </Modal>

            {/* SALARY SLIP MODAL */}
            <Modal isOpen={isSlipModalOpen} onClose={() => setIsSlipModalOpen(false)} title="Detail Slip Gaji">
                {selectedSalary && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border-l-4 border-indigo-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedSalary.employee_name}</h2>
                                    <p className="text-sm text-slate-500">{selectedSalary.position}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Periode</p>
                                    <p className="font-bold">{period.month}/{period.year}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 px-2">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Penerimaan</h3>
                                <div className="flex justify-between text-sm">
                                    <span>Gaji Pokok</span>
                                    <span className="font-bold">Rp {selectedSalary.base_processing_salary.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Bonus Absensi</span>
                                    <span className="font-bold text-emerald-600">+{selectedSalary.attendance_bonus?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Lembur</span>
                                    <span className="font-bold text-emerald-600">+{selectedSalary.overtime_pay?.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Potongan</h3>
                                <div className="flex justify-between text-sm text-red-500">
                                    <span>Potongan Pinjaman</span>
                                    <span className="font-bold">-{selectedSalary.loan_deduction?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-500">
                                    <span>Potongan Lainnya</span>
                                    <span className="font-bold">-{selectedSalary.other_deductions?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-600 text-white p-6 rounded-2xl flex justify-between items-center shadow-lg shadow-indigo-100 dark:shadow-none">
                            <span className="font-bold">Total Gaji Diterima (Net)</span>
                            <span className="text-2xl font-black italic">Rp {selectedSalary.net_salary.toLocaleString()}</span>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white p-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
                                <FiDownload /> Cetak / Download PDF
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
