import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';

const fmt = (n) => 'Rp ' + Math.floor(n || 0).toLocaleString('id-ID');

export default function DigitalPrintingCartPage({ onNavigate, pageState }) {
    const { user } = useAuth();

    // Default order info
    const taskId = pageState?.taskId;
    const [task, setTask] = useState(null);
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (taskId) {
            const fetchTask = async () => {
                try {
                    const { data } = await api.get('/dp_tasks');
                    const t = data.find(d => d.id === taskId);
                    if (t) {
                        setTask(t);
                        // Map task data to items
                        const newItems = [
                            {
                                id: 'mat-' + t.id,
                                type: 'product',
                                name: t.material_name || 'Bahan Cetak',
                                price: t.material_price || 0,
                                specs: [`${t.dimensions?.width} x ${t.dimensions?.height} Meter`, '1 Pcs'],
                                icon: 'branding_watermark'
                            }
                        ];
                        if (t.design_price > 0) {
                            newItems.push({
                                id: 'design-' + t.id,
                                type: 'service',
                                name: 'Jasa Desain Grafis',
                                price: t.design_price,
                                specs: ['Dikerjakan oleh: Sistem'],
                                icon: 'draw'
                            });
                        }
                        setItems(newItems);
                    }
                } catch (e) { console.error(e); }
            };
            fetchTask();
        }
    }, [taskId]);

    // Removed manual items effect in favor of the one above

    const [paymentMethod, setPaymentMethod] = useState('Tunai / Cash');
    const [transactionType, setTransactionType] = useState('lunas'); // lunas, dp
    const [amountPaid, setAmountPaid] = useState('');

    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const tax = subtotal * 0.1;
    const totalTagihan = subtotal + tax;

    const currentPaid = amountPaid !== '' ? Number(amountPaid) : totalTagihan;
    const kembalian = Math.max(0, currentPaid - totalTagihan);

    const handleProses = async () => {
        if (!taskId || !task) return;

        try {
            // Mapping temporary task data to Real SPK Payload
            const payload = {
                customer_id: task.customerId,
                customer_name: task.customerName,
                product_name: task.material_name || task.title || 'Digital Print',
                product_qty: 1,
                product_unit: 'Pcs',
                kategori: 'Digital Printing',
                specs_material: `Dimensi: ${task.dimensions?.width}x${task.dimensions?.height}m. Bahan: ${task.material_name}`,
                specs_notes: task.pesan_desainer || 'Tanpa catatan',
                biaya_cetak: subtotal,
                biaya_material: 0,
                biaya_finishing: 0,
                biaya_desain: task.design_price || 0,
                biaya_lainnya: 0,
                dp_amount: currentPaid,
                priority: 'Normal',
            };

            await api.post('/spk', payload);

            await Swal.fire({ icon: 'success', title: 'Sukses', text: 'Pesanan berhasil diproses! Mengalihkan kembali...', timer: 2500, showConfirmButton: false });
            onNavigate('digital-printing');

        } catch (error) {
            console.error('Gagal memproses SPK:', error);
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memproses pesanan: ' + (error.response?.data?.message || error.message), timer: 3000 });
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] min-h-screen text-slate-900 font-[Inter]">
            {/* Header section from exact mockup */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 h-16 flex items-center px-8 justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                    <span className="text-sm font-medium text-[#137fec]">Kasir</span>
                    <span className="material-symbols-outlined text-sm!">chevron_right</span>
                    <span className="text-sm font-bold text-slate-900">Keranjang & Pembayaran</span>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <div className="h-8 w-px bg-slate-200 mx-1"></div>
                    <button className="flex items-center gap-3 p-1 pl-2 rounded-full hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-slate-900 leading-none">{user?.name || 'Admin User'}</p>
                            <p className="mt-4 font-medium uppercase tracking-wider text-green-600">{user?.role || 'Administrator'}</p>
                        </div>
                        <div className="size-9 rounded-full bg-blue-100 flex items-center justify-center text-[#137fec] font-bold text-sm">
                            {(user?.name || 'AU').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="material-symbols-outlined text-slate-400 text-lg!">expand_more</span>
                    </button>
                </div>
            </header>

            <main className="p-8 max-w-7xl mx-auto w-full">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Keranjang Pesanan</h1>
                            <span className="px-3 py-1 bg-blue-100 text-[#137fec] text-xs font-bold rounded-full">{taskId || '#ORD-DEMO'}</span>
                        </div>
                        <p className="text-slate-500">Tinjau item pesanan dan selesaikan administrasi pembayaran.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg!">print</span>
                            Cetak Draft Invoice
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Items List */}
                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#137fec]">shopping_cart</span>
                                    <h2 className="text-lg font-bold text-slate-800">Daftar Item Pesanan</h2>
                                </div>
                                <span className="text-6xl! font-black tracking-tight">{items.length} Item Terdaftar</span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {items.map(item => (
                                    <div key={item.id} className={`p-6 transition-colors ${item.isNew ? 'bg-blue-50/50 hover:bg-blue-50 border-l-4 border-[#137fec]' : 'hover:bg-slate-50/50'}`}>
                                        <div className="flex gap-4">
                                            <div className={`size-16 rounded-xl flex items-center justify-center shrink-0 border ${item.isNew ? 'bg-blue-100/50 border-blue-200 text-[#137fec]' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                                                <span className="material-symbols-outlined text-3xl!">{item.icon}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-slate-900">{item.name}</h3>
                                                        {item.isNew && <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded uppercase">Baru</span>}
                                                    </div>
                                                    <p className={`font-bold ${item.isNew ? 'text-[#137fec]' : 'text-slate-900'}`}>{fmt(item.price)}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs text-slate-500 mb-3">
                                                    {item.specs.map((spec, i) => (
                                                        <span key={i} className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm!">{i === 0 ? (item.type === 'service' ? 'schedule' : 'aspect_ratio') : i === 1 ? (item.type === 'service' ? 'attachment' : 'layers') : 'description'}</span>
                                                            {spec}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {item.type === 'service' ? (
                                                        <button className="text-[11px] font-bold text-[#137fec] flex items-center gap-1 hover:underline">
                                                            <span className="material-symbols-outlined text-sm!">visibility</span> Lihat Detail Desain
                                                        </button>
                                                    ) : (
                                                        <button className="text-[11px] font-bold text-[#137fec] flex items-center gap-1 hover:underline">
                                                            <span className="font-black text-rose-500 text-2xl!">-Rp0</span> Edit Spek
                                                        </button>
                                                    )}
                                                    <button className="text-[11px] font-bold text-red-500 flex items-center gap-1 hover:underline">
                                                        <span className="material-symbols-outlined text-sm!">delete</span> Hapus
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-slate-50 flex justify-center border-t border-slate-100">
                                <button className="text-sm font-bold text-slate-500 hover:text-[#137fec] transition-colors flex items-center gap-2">
                                    <span className="material-symbols-outlined">add_circle</span> Tambah Produk/Layanan Lainnya
                                </button>
                            </div>
                        </section>

                        {/* Payment Options */}
                        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-slate-700">payments</span>
                                <h2 className="text-lg font-bold text-slate-800">Opsi Pembayaran</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="text-sm font-bold text-slate-700 block mb-2">Metode Pembayaran</span>
                                        <select
                                            value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                                            className="w-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-primary focus:border-primary shadow-sm h-11 px-4 text-sm appearance-none"
                                        >
                                            <option>Tunai / Cash</option>
                                            <option>Transfer Bank (BCA)</option>
                                            <option>QRIS / E-Wallet</option>
                                            <option>Kartu Debit/Kredit</option>
                                        </select>
                                    </label>
                                    <div className="block">
                                        <span className="text-sm font-bold text-slate-700 block mb-2">Tipe Transaksi</span>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setTransactionType('lunas')}
                                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-bold transition-colors ${transactionType === 'lunas' ? 'border-[#137fec] bg-blue-50 text-[#137fec]' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}>
                                                <span className="material-symbols-outlined text-lg!">check_circle</span>
                                                Lunas
                                            </button>
                                            <button
                                                onClick={() => setTransactionType('dp')}
                                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-bold transition-colors ${transactionType === 'dp' ? 'border-[#137fec] bg-blue-50 text-[#137fec]' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}>
                                                <span className="material-symbols-outlined text-lg!">pending_actions</span>
                                                Uang Muka (DP)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-6 flex flex-col justify-center">
                                    <label className="block mb-4">
                                        <span className="text-sm font-bold text-slate-700 block mb-2">Jumlah Dibayar</span>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                                            <input
                                                className="w-full pl-12 pr-4 py-4 rounded-xl border-slate-200 focus:border-[#137fec] focus:ring-[#137fec] text-2xl font-black text-slate-900 border"
                                                type="text"
                                                inputMode="decimal"
                                                value={transactionType === 'lunas' && amountPaid === '' ? totalTagihan : amountPaid}
                                                onChange={e => {
                                                    const val = e.target.value.replace(',', '.');
                                                    if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                                                        setAmountPaid(val);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </label>
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kembalian</span>
                                        <span className="text-lg font-bold text-green-600">{fmt(kembalian)}</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Informasi Pelanggan</h2>
                            <div className="flex items-center gap-3">
                                <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                    <span className="material-symbols-outlined">person</span>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 leading-tight">{task?.customerName || 'Pelanggan Umum'}</p>
                                    <p className="text-xs text-slate-500">ID Pesanan: {taskId}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500">Metode</span>
                                <span className="text-3xl! font-black">Hp 0</span>
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <span className="material-symbols-outlined text-6xl!">receipt</span>
                            </div>
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Ringkasan Biaya</h2>

                            <div className="space-y-4 mb-6 relative z-10">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="text-slate-900 font-bold">{fmt(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Pajak (PPN 10%)</span>
                                    <span className="text-slate-900 font-bold">{fmt(tax)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Biaya Admin / Lainnya</span>
                                    <span className="font-bold text-green-600">- Rp 0</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t-2 border-dashed border-slate-200 relative z-10">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-slate-900 uppercase">Total Tagihan</span>
                                    <span className="text-3xl font-black text-[#137fec]">{fmt(totalTagihan)}</span>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <button
                                onClick={handleProses}
                                className="w-full bg-[#137fec] text-white font-bold py-5 rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30"
                            >
                                <span className="material-symbols-outlined text-2xl!">payments</span>
                                <div className="text-left">
                                    <p className="leading-none text-base">Bayar Keranjang</p>
                                    <p className="text-[10px] font-medium text-blue-100 opacity-80 mt-1 uppercase tracking-wider">Selesaikan Pembayaran & SPK</p>
                                </div>
                            </button>
                            <button className="w-full bg-white text-slate-600 border border-slate-200 font-bold py-4 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                                <span className="material-symbols-outlined">save</span>
                                Simpan Draft Order
                            </button>
                            <button className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-3">
                                <span className="material-symbols-outlined">delete_forever</span>
                                Batalkan Pesanan
                            </button>
                        </section>

                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                            <div className="flex gap-3">
                                <span className="material-symbols-outlined text-orange-500 text-xl!">priority_high</span>
                                <div>
                                    <p className="text-xs font-bold text-orange-900 mb-1">Peringatan Produksi</p>
                                    <p className="text-[11px] text-orange-700 leading-relaxed">Setelah menekan 'Proses Cetak', status pesanan akan berubah menjadi 'Dalam Produksi' dan SPK akan diterbitkan otomatis.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
