import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { formatRupiah } from '../utils';
import { 
    FiUsers, 
    FiClock, 
    FiCheckCircle, 
    FiAlertCircle, 
    FiSearch, 
    FiFilter,
    FiMessageCircle,
    FiCreditCard,
    FiChevronRight,
    FiArrowUpRight,
    FiCalendar
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReceivablesPage({ onNavigate }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('unpaid'); // unpaid, partial, all

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/transactions');
            // Filter only those that have receivables (total > paidAmount)
            setTransactions(data.filter(t => t.paidAmount < t.total) || []);
        } catch (e) {
            console.error('Failed to fetch receivables:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return transactions.filter(t => {
            const matchSearch = (t.customerName || '').toLowerCase().includes(q) || (t.invoiceNumber || '').toLowerCase().includes(q);
            const remaining = t.total - t.paidAmount;
            
            if (filterStatus === 'unpaid' && t.paidAmount > 0) return false;
            if (filterStatus === 'partial' && (t.paidAmount === 0 || remaining <= 0)) return false;
            
            return matchSearch;
        });
    }, [transactions, search, filterStatus]);

    const stats = useMemo(() => {
        const totalDebt = transactions.reduce((s, t) => s + (t.total - t.paidAmount), 0);
        const unpaidCount = transactions.filter(t => t.paidAmount === 0).length;
        const partialCount = transactions.filter(t => t.paidAmount > 0).length;
        return { totalDebt, unpaidCount, partialCount };
    }, [transactions]);

    const handlePayment = async (t) => {
        const remaining = t.total - t.paidAmount;
        const { value: amount } = await Swal.fire({
            title: 'Bayar Cicilan',
            html: `
                <div class="text-left space-y-2">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</p>
                    <p class="text-sm font-black text-slate-900 dark:text-white">${t.customerName || 'Umum'}</p>
                    <div class="h-px bg-slate-100 dark:bg-slate-700 my-2"></div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sisa Hutang</p>
                    <p class="text-lg font-black text-rose-600 italic tracking-tighter">${formatRupiah(remaining)}</p>
                </div>
            `,
            input: 'number',
            inputLabel: 'Masukkan Jumlah Bayar',
            inputPlaceholder: 'Contoh: 50000',
            showCancelButton: true,
            confirmButtonText: 'Proses Bayar',
            cancelButtonText: 'Batal',
            customClass: {
                confirmButton: 'bg-blue-600 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/20 text-xs uppercase tracking-widest',
                cancelButton: 'bg-slate-200 text-slate-700 font-black py-4 px-8 rounded-2xl text-xs uppercase tracking-widest ml-3',
                input: 'rounded-2xl border-slate-200 dark:border-slate-700 text-center font-black text-lg h-14'
            },
            buttonsStyling: false
        });

        if (amount) {
            try {
                const newPaidAmount = Number(t.paidAmount) + Number(amount);
                if (newPaidAmount > t.total) {
                    return Swal.fire('Error', 'Jumlah bayar melebihi total tagihan!', 'error');
                }

                await api.put(`/transactions/${t.id}`, { 
                    paidAmount: newPaidAmount,
                    status: newPaidAmount >= t.total ? 'Lunas' : 'Cicil'
                });

                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Pembayaran cicilan telah dicatat.', timer: 1500, showConfirmButton: false });
                fetchTransactions();
            } catch (e) {
                Swal.fire('Gagal', 'Gagal memproses pembayaran.', 'error');
            }
        }
    };

    const handleRemindWA = async (t) => {
        const remaining = t.total - t.paidAmount;
        const message = `Halo Kak ${t.customerName || ''}, kami dari Abad Jaya Copier menginfokan bahwa terdapat sisa tagihan sebesar ${formatRupiah(remaining)} untuk Invoice ${t.invoiceNumber}. Mohon segera melakukan pelunasan ya Kak. Terima kasih!`;
        const phone = t.customerPhone || '';
        if (!phone) return Swal.fire('Info', 'Nomor WhatsApp pelanggan tidak terdaftar.', 'info');
        
        try {
            Swal.fire({ title: 'Mengirim Pesan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            await api.post('/api/wa-gateway/test', { to: phone, message });
            Swal.fire({ icon: 'success', title: 'Terkirim!', text: 'Pesan pengingat telah dikirim via WhatsApp.', timer: 1500, showConfirmButton: false });
        } catch (err) {
            // Fallback to web link if gateway not ready
            window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
            Swal.close();
        }
    };

    const handleBlastWA = async () => {
        const targets = filtered.filter(t => (t.total - t.paidAmount) > 0 && t.customerPhone);
        if (targets.length === 0) return Swal.fire('Info', 'Tidak ada pelanggan dengan nomor WA yang valid untuk ditagih.', 'info');

        const { isConfirmed } = await Swal.fire({
            title: 'Blast WhatsApp Tagihan',
            text: `Anda akan mengirim pesan pengingat otomatis ke ${targets.length} pelanggan. Lanjutkan?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Blast Sekarang!',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#10b981'
        });

        if (isConfirmed) {
            Swal.fire({
                title: 'Sedang Mengirim...',
                html: `Mengirim <b>0</b> dari ${targets.length} pesan.`,
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            let success = 0;
            let fail = 0;

            for (let i = 0; i < targets.length; i++) {
                const t = targets[i];
                const remaining = t.total - t.paidAmount;
                const message = `Halo Kak ${t.customerName || ''}, kami dari Abad Jaya Copier menginfokan bahwa terdapat sisa tagihan sebesar ${formatRupiah(remaining)} untuk Invoice ${t.invoiceNumber}. Mohon segera melakukan pelunasan ya Kak. Terima kasih!`;
                
                try {
                    Swal.update({ html: `Mengirim <b>${i + 1}</b> dari ${targets.length} pesan...` });
                    await api.post('/api/wa-gateway/test', { to: t.customerPhone, message });
                    success++;
                } catch (err) {
                    fail++;
                }
                // Small delay to prevent spam detection
                await new Promise(r => setTimeout(r, 1000));
            }

            Swal.fire({
                icon: 'success',
                title: 'Selesai!',
                text: `${success} pesan berhasil dikirim. ${fail > 0 ? fail + ' gagal.' : ''}`,
                confirmButtonColor: '#3b82f6'
            });
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 font-display bg-slate-50/30 dark:bg-transparent min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-rose-600 rounded-xl text-white shadow-lg shadow-rose-100 dark:shadow-none"><FiCreditCard /></span>
                        Piutang Pelanggan
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-1 italic opacity-75">Monitoring & Debt Collection Management</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleBlastWA}
                        disabled={filtered.length === 0}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                    >
                        <FiMessageCircle /> Blast Tagihan
                    </button>
                   <div className="relative flex-1 sm:w-64">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Cari invoice / pelanggan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-sm"
                        />
                   </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-rose-500 transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600">
                            <FiAlertCircle size={20} />
                        </div>
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-md uppercase">Total Tagihan</span>
                    </div>
                    <div className="mt-4">
                        <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">{formatRupiah(stats.totalDebt)}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sisa Piutang Aktif</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-orange-500 transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-600">
                            <FiClock size={20} />
                        </div>
                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-md uppercase">Belum Bayar</span>
                    </div>
                    <div className="mt-4">
                        <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">{stats.unpaidCount} <span className="text-sm font-bold text-slate-400 italic">Org</span></p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tagihan Belum Ada Cicilan</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-blue-500 transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                            <FiCheckCircle size={20} />
                        </div>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md uppercase">Mencicil</span>
                    </div>
                    <div className="mt-4">
                        <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">{stats.partialCount} <span className="text-sm font-bold text-slate-400 italic">Org</span></p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tagihan Terbayar Sebagian</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex gap-2">
                        {['unpaid', 'partial', 'all'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    filterStatus === s 
                                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 dark:shadow-none' 
                                    : 'bg-white dark:bg-slate-700 text-slate-400 hover:text-slate-600 border border-slate-200 dark:border-slate-600'
                                }`}
                            >
                                {s === 'unpaid' ? 'Belum Ada Cicilan' : s === 'partial' ? 'Sedang Mencicil' : 'Semua Piutang'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 text-center flex flex-col items-center gap-4">
                            <div className="size-12 border-4 border-slate-100 border-t-rose-600 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat Data Piutang...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="p-6 bg-slate-50 dark:bg-slate-700/30 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-slate-300">
                                <FiCreditCard size={32} />
                            </div>
                            <h3 className="mt-6 text-slate-900 dark:text-white font-black">Tidak Ada Piutang</h3>
                            <p className="text-xs text-slate-500 mt-1">Semua tagihan lunas atau tidak ditemukan.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-100 dark:border-slate-700">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan & Invoice</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tgl Transaksi</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Tagihan</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Sudah Bayar</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Sisa Hutang</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                <AnimatePresence>
                                    {filtered.map((t, idx) => {
                                        const remaining = t.total - t.paidAmount;
                                        const progress = (t.paidAmount / t.total) * 100;
                                        
                                        return (
                                            <motion.tr 
                                                key={t.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group"
                                            >
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-rose-600 group-hover:text-white transition-all">
                                                            <FiUsers size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.customerName || 'Umum'}</p>
                                                            <p className="text-[10px] font-bold text-rose-500 font-mono mt-0.5">#{t.invoiceNumber}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                        <FiCalendar size={12} />
                                                        <span className="text-[11px] font-bold">{new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right font-bold text-xs text-slate-900 dark:text-white">
                                                    {formatRupiah(t.total)}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <p className="text-xs font-black text-emerald-600 italic">{formatRupiah(t.paidAmount)}</p>
                                                    <div className="w-24 h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-1.5 ml-auto overflow-hidden">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-[11px] font-black italic">
                                                        {formatRupiah(remaining)}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleRemindWA(t)}
                                                            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                                                            title="Ingatkan via WA"
                                                        >
                                                            <FiMessageCircle size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handlePayment(t)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-slate-200 dark:shadow-none"
                                                        >
                                                            Bayar Cicilan <FiArrowUpRight />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
