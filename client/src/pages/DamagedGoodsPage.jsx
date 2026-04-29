import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { formatRupiah } from '../utils';
import { 
    FiAlertTriangle, 
    FiBox, 
    FiPlus, 
    FiSearch, 
    FiTrash2, 
    FiCalendar,
    FiInfo,
    FiCheck
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import Modal from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';

export default function DamagedGoodsPage({ onNavigate }) {
    const [damagedItems, setDamagedItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ productId: '', quantity: '', note: '' });

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch damaged items
            try {
                const damagedRes = await api.get('/products/damaged');
                setDamagedItems(damagedRes.data || []);
            } catch (err) {
                console.error('Failed to fetch damaged items:', err);
                setDamagedItems([]);
            }

            // Fetch products for dropdown
            try {
                const productsRes = await api.get('/products');
                setProducts(productsRes.data || []);
            } catch (err) {
                console.error('Failed to fetch products:', err);
                setProducts([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return damagedItems.filter(item => 
            (item.productName || '').toLowerCase().includes(q) || 
            (item.note || '').toLowerCase().includes(q)
        );
    }, [damagedItems, search]);

    const handleReport = async () => {
        if (!form.productId || !form.quantity) {
            return Swal.fire('Error', 'Pilih barang dan jumlah yang rusak!', 'error');
        }

        try {
            const product = products.find(p => p.id === form.productId);
            if (Number(form.quantity) > product.stock) {
                return Swal.fire('Gagal', 'Jumlah rusak melebihi stok yang ada!', 'error');
            }

            const result = await Swal.fire({
                title: 'Konfirmasi Laporan',
                text: `Stok ${product.name} akan dikurangi sebanyak ${form.quantity}. Lanjutkan?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, Laporkan',
                cancelButtonText: 'Batal'
            });

            if (result.isConfirmed) {
                await api.post('/products/report-damaged', {
                    productId: form.productId,
                    qty: form.quantity,
                    notes: form.note
                });
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Laporan barang rusak telah dicatat.', timer: 1500, showConfirmButton: false });
                setShowModal(false);
                setForm({ productId: '', quantity: '', note: '' });
                fetchData();
            }
        } catch (e) {
            Swal.fire('Gagal', 'Gagal melaporkan barang rusak.', 'error');
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 font-display bg-slate-50/30 dark:bg-transparent min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-100 dark:shadow-none"><FiAlertTriangle /></span>
                        Laporan Barang Rusak
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-1 italic opacity-75">Inventory Loss & Damage Tracking</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 dark:bg-slate-700 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95"
                    >
                        <FiPlus /> Laporkan Kerusakan
                    </button>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/50 p-6 rounded-[2rem] flex items-center gap-6">
                <div className="p-4 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-200 dark:shadow-none">
                    <FiInfo size={24} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-orange-900 dark:text-orange-400 uppercase tracking-tight">Penting!</h3>
                    <p className="text-[11px] text-orange-700 dark:text-orange-300/70 font-medium leading-relaxed mt-1">
                        Setiap laporan barang rusak akan **otomatis memotong stok** gudang. <br/>
                        Pastikan jumlah yang dimasukkan sesuai dengan kondisi fisik barang untuk menjaga akurasi inventory.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text"
                    placeholder="Cari histori kerusakan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Barang</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tgl Laporan</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Jumlah</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <div className="size-10 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
                                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat Histori...</p>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center text-slate-400">
                                        <FiBox size={40} className="mx-auto opacity-20 mb-4" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Belum ada laporan kerusakan</p>
                                    </td>
                                </tr>
                            ) : filtered.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                                                <FiBox size={14} />
                                            </div>
                                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.productName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold">
                                            <FiCalendar size={12} />
                                            {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-[11px] font-black">
                                            -{item.quantity}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-xs text-slate-500 dark:text-slate-400 italic">
                                        {item.note || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Laporkan Barang Rusak"
                maxWidth="max-w-xl"
            >
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Pilih Barang</label>
                            <select 
                                value={form.productId}
                                onChange={(e) => setForm(f => ({ ...f, productId: e.target.value }))}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none"
                            >
                                <option value="">-- Pilih Barang --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock} {p.unit})</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Jumlah Rusak</label>
                                <input 
                                    type="number"
                                    value={form.quantity}
                                    onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))}
                                    placeholder="0"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Keterangan</label>
                                <input 
                                    type="text"
                                    value={form.note}
                                    onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
                                    placeholder="Contoh: Pecah saat bongkar"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button 
                            onClick={() => setShowModal(false)}
                            className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={handleReport}
                            className="flex-[2] bg-orange-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <FiCheck /> Simpan Laporan
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
