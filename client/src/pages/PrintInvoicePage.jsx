import { useState, useEffect } from 'react';
import api from '../services/api';
import db from '../db';
import { FiGlobe, FiPhone, FiMapPin, FiMail } from 'react-icons/fi';

export default function PrintInvoicePage({ onNavigate, pageState }) {
    const spkId = pageState?.spkId || null;
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({});

    useEffect(() => {
        const fetchDetail = async () => {
            if (!spkId) {
                setLoading(false);
                return;
            }
            try {
                const res = await api.get(`/spk/${spkId}`);
                setInvoiceData(res.data);
            } catch (err) {
                console.error('Gagal fetch detail Invoice:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();

        const allSettings = db.getAll('settings');
        const sObj = {};
        allSettings.forEach(s => sObj[s.key] = s.value);
        setSettings(sObj);
    }, [spkId]);

    // Tambahkan style cetak format A4
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                .no-print { display: none !important; }
                .print-container { 
                    box-shadow: none !important; 
                    border: none !important; 
                    width: 210mm !important; 
                    min-height: 297mm !important;
                    margin: 0 auto !important; 
                    padding: 10mm !important; 
                    max-width: none !important;
                }
                @page { size: auto; margin: 0; }
                body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const storeName = settings.store_name || 'ABADI JAYA';
    const storeAddress = settings.store_address || 'Jl. Contoh No. 123, Kota';
    const storePhone = settings.store_phone || '021-12345678';
    const storeLogo = settings.store_logo || '/logo.png';

    // Use fetched data or fallback to dummy values from mockup
    const invNumber = invoiceData ? `INV-${invoiceData.spk_number?.replace('SPK-', '') || spkId}` : 'INV-2024-0524';
    const customerName = invoiceData?.customer_company || invoiceData?.customer_name || 'Pelanggan Umum';
    const dateNow = formatDate(new Date());
    const deadline = formatDate(invoiceData?.deadline || '2024-05-31T00:00:00Z');

    // Items
    const items = [];
    if (invoiceData) {
        if (invoiceData.biaya_cetak > 0) items.push({ desc: invoiceData.product_name, cat: 'Digital', catColor: 'blue', qty: invoiceData.product_qty + ' ' + invoiceData.product_unit, price: invoiceData.biaya_cetak / invoiceData.product_qty, total: invoiceData.biaya_cetak });
        if (invoiceData.biaya_finishing > 0) items.push({ desc: 'Finishing ' + (invoiceData.specs_finishing || ''), cat: 'Finishing', catColor: 'purple', qty: '1 Lot', price: invoiceData.biaya_finishing, total: invoiceData.biaya_finishing });
        if (invoiceData.biaya_desain > 0) items.push({ desc: 'Jasa Desain Grafis', cat: 'Jasa', catColor: 'orange', qty: '1 Paket', price: invoiceData.biaya_desain, total: invoiceData.biaya_desain });
        if (invoiceData.biaya_lainnya > 0) items.push({ desc: 'Lainnya', cat: 'Lainnya', catColor: 'slate', qty: '1', price: invoiceData.biaya_lainnya, total: invoiceData.biaya_lainnya });
        if (invoiceData.biaya_material > 0) items.push({ desc: 'Material ' + (invoiceData.specs_material || ''), cat: 'Bahan', catColor: 'emerald', qty: '1 Kebutuhan', price: invoiceData.biaya_material, total: invoiceData.biaya_material });
    } else {
        // Fallback items
        items.push({ desc: 'Banner Vinyl High-Res', descSub: 'Outdoor 280gr, Mata Ayam, 1x3m', cat: 'Digital', catColor: 'blue', qty: '10 Pcs', price: 75000, total: 750000 });
        items.push({ desc: 'Cetak Brosur A4 (Lipat 3)', descSub: 'Art Paper 150gr, Full Color, 2 Sisi', cat: 'Offset', catColor: 'purple', qty: '2.000 Pcs', price: 1250, total: 2500000 });
        items.push({ desc: 'Jasa Desain Grafis', descSub: 'Revisi & Layouting (Berdasarkan Timer)', cat: 'Jasa', catColor: 'orange', qty: '4,5 Jam', price: 150000, total: 675000 });
    }

    const subtotal = invoiceData ? invoiceData.total_biaya : 3925000;
    const ppn = invoiceData ? subtotal * 0.11 : 431750;
    const totalAkhir = subtotal + ppn;
    const isLunas = invoiceData ? invoiceData.sisa_tagihan <= 0 : true;

    return (
        <div className="bg-background-light dark:bg-background-dark font-[Inter] text-slate-900 dark:text-slate-100 min-h-screen">
            <div className="layout-container flex h-full grow flex-col">

                {/* Top Navigation Bar (No Print) */}
                <header className="no-print flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 sm:px-10 py-3 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="text-primary size-8 flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl">print</span>
                        </div>
                        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">Faktur Percetakan</h2>
                    </div>

                    <div className="flex flex-1 justify-end gap-2 sm:gap-4 items-center">
                        <nav className="hidden md:flex items-center gap-6 mr-6">
                            <button onClick={() => onNavigate('dashboard')} className="text-slate-600 dark:text-slate-300 text-sm font-medium hover:text-primary transition-colors cursor-pointer">Beranda</button>
                            <button onClick={() => onNavigate('spk-list')} className="text-slate-600 dark:text-slate-300 text-sm font-medium hover:text-primary transition-colors cursor-pointer">Daftar SPK</button>
                            {spkId && (
                                <button onClick={() => onNavigate('spk-detail', { spkId })} className="text-slate-600 dark:text-slate-300 text-sm font-medium hover:text-primary transition-colors cursor-pointer">Detail SPK</button>
                            )}
                        </nav>
                        <div className="flex gap-2">
                            <button onClick={() => window.print()} className="flex cursor-pointer items-center justify-center rounded-lg h-10 bg-[#137fec] text-white gap-2 text-sm font-bold px-4 hover:bg-blue-600 transition-all shadow-md">
                                <span className="material-symbols-outlined text-[20px]">print</span>
                                <span className="hidden sm:inline">Cetak PDF</span>
                            </button>
                            <button className="flex cursor-pointer items-center justify-center rounded-lg h-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 gap-2 text-sm font-bold px-4 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                <span className="material-symbols-outlined text-[20px]">share</span>
                                <span className="hidden sm:inline">Bagikan</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Invoice Container (A4 Proportions) */}
                <main className="flex-1 flex justify-center py-4 px-4 sm:px-10 print:py-0 print:px-0">
                    <div className="print-container w-full max-w-[960px] bg-white dark:bg-slate-900 shadow-xl rounded-xl overflow-hidden p-8 sm:p-12 border border-slate-200 dark:border-slate-800">

                        {/* Header Invoice */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10 pb-8 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center gap-5">
                                    <div className="w-20 h-20 bg-white dark:bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-800 p-2 overflow-hidden">
                                        <img src={storeLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">{storeName}</h1>
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-2">Specialist Printing & Digital Solutions</p>
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-sm text-slate-500 font-medium">
                                    <p className="flex items-center gap-2"><FiMapPin className="text-blue-500" size={14} /> {storeAddress}</p>
                                    <p className="flex items-center gap-2"><FiPhone className="text-blue-500" size={14} /> {storePhone}</p>
                                    <p className="flex items-center gap-2"><FiGlobe className="text-blue-500" size={14} /> www.abadijayapos.com</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 text-right">
                                <h2 className="text-5xl font-black text-slate-200 dark:text-slate-800 italic uppercase leading-none tracking-tighter mb-4 select-none">INVOICE</h2>
                                <div className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-black shadow-md shadow-blue-500/20">#{invNumber}</div>
                                <div className="mt-4 flex flex-col gap-1 items-end">
                                    <p className="text-xs font-bold text-slate-400">Entry Date: <span className="text-slate-700 dark:text-slate-300 ml-2">{formatDate(invoiceData?.createdAt || new Date())}</span></p>
                                    <p className="text-xs font-bold text-slate-400">Due Date: <span className="text-slate-700 dark:text-slate-300 ml-2">{deadline}</span></p>
                                    {isLunas ? (
                                        <div className="mt-3 inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                            <span className="material-symbols-outlined text-[14px] mr-1.5">verified</span>
                                            PAID IN FULL
                                        </div>
                                    ) : (
                                        <div className="mt-3 inline-flex items-center px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                                            <span className="material-symbols-outlined text-[14px] mr-1.5">pending</span>
                                            PENDING PAYMENT
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Detail Pelanggan */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            <div className="p-4 bg-background-light dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">person</span>
                                    Tagihan Untuk
                                </h3>
                                <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">{customerName}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Up: {invoiceData?.customer_name || 'Budi Santoso'}</p>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    {invoiceData?.customer_address || (
                                        <>
                                            Jl. Merdeka No. 10, Blok C<br />
                                            Kawasan Industri Terpadu, Tangerang<br />
                                            Banten, 15111
                                        </>
                                    )}
                                </p>
                            </div>
                            <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">payments</span>
                                    Informasi Pembayaran
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Metode</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">Transfer Bank / QRIS</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Bank</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">Bank Mandiri</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">No. Rekening</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">123-00-9988776-5</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">A/N</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">PT Printhub Solutions</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabel Item */}
                        <div className="mb-10 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Deskripsi Pekerjaan</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Kategori</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Qty</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Harga</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-5">
                                                <p className="font-bold text-slate-800 dark:text-slate-100">{item.desc}</p>
                                                {item.descSub && <p className="text-xs text-slate-500">{item.descSub}</p>}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${item.catColor === 'blue' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                                    item.catColor === 'purple' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                                                        item.catColor === 'orange' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                                                            item.catColor === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                                                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                    }`}>
                                                    {item.cat}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right font-medium text-slate-600 dark:text-slate-400">{item.qty}</td>
                                            <td className="px-6 py-5 text-right font-medium text-slate-600 dark:text-slate-400">{formatCurrency(item.price)}</td>
                                            <td className="px-6 py-5 text-right font-bold text-slate-800 dark:text-slate-100">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer & Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* QRIS & Notes */}
                            <div className="flex flex-col gap-6">
                                <div className="p-5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-6">
                                    <div className="bg-white p-2 rounded-lg shadow-inner">
                                        <div className="w-28 h-28 bg-slate-100 flex items-center justify-center relative">
                                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                                <span className="material-symbols-outlined text-6xl">qr_code_2</span>
                                            </div>
                                            {/* Placeholder for Dynamic QRIS */}
                                            <img alt="QRIS Payment Code" className="w-full h-full object-contain relative z-10" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcsSbctj7ajC8-L_P_TOO_vcoPotYI0iOwfoD5NjPeYMeTTbr1vgOWdKIeUMJjPOmFi_bRqjNbbbaZD31N4FJUaJLpPgM4crJs024gRqru2FW7Fo8jEIGbQVN0-D805XWZH6RmcQMLmFFNG_Xewy1Al2LQJFjXYjkhGJ7CFRdRolmnSvdnkxLGvYPKGN3AC-gUrr75KnWfZM2nFILLhVToZWhoBlCgqfjXwbI7Vl5uBHojSAypjpxQmj1LNQ3Sn5k5hauomdT2vWSz" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                                            <span className="material-symbols-outlined text-[#137fec]">qr_code_scanner</span>
                                            Bayar via QRIS
                                        </h4>
                                        <p className="text-xs text-slate-500 mb-3">Scan menggunakan GoPay, OVO, Dana, ShopeePay atau Mobile Banking.</p>
                                        <div className="flex gap-2">
                                            <div className="h-4 w-8 bg-slate-100 dark:bg-slate-700 rounded text-[8px] flex items-center justify-center font-bold text-slate-400">QRIS</div>
                                            <div className="h-4 w-8 bg-slate-100 dark:bg-slate-700 rounded text-[8px] flex items-center justify-center font-bold text-slate-400">GPN</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 italic leading-relaxed">
                                    * Syarat & Ketentuan: Pembayaran DP minimal 50% untuk pesanan di atas 5 juta. Pelunasan dilakukan saat pengambilan barang.
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 font-medium">Subtotal</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-bold">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 font-medium">PPN (11%)</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-bold">{formatCurrency(ppn)}</span>
                                </div>
                                <div className="flex justify-between items-center py-4 bg-blue-50 dark:bg-blue-900/10 px-4 rounded-lg mt-4 border border-blue-100 dark:border-blue-900/30">
                                    <span className="text-[#137fec] font-black uppercase tracking-wider">Total Akhir</span>
                                    <span className="text-[#137fec] text-2xl font-black">{formatCurrency(totalAkhir)}</span>
                                </div>

                                {/* Status Badge Big */}
                                <div className="mt-8 pt-8 flex flex-col items-center">
                                    <div className="text-center">
                                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-4">Otorisasi</p>
                                        <div className="mb-4 text-[#137fec] opacity-20">
                                            <span className="material-symbols-outlined text-7xl">verified</span>
                                        </div>
                                        <div className="h-px w-48 bg-slate-200 dark:bg-slate-700 mb-2"></div>
                                        <p className="font-bold text-slate-800 dark:text-white">Admin Keuangan</p>
                                        <p className="text-xs text-slate-500">Jakarta, {dateNow}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer Info */}
                <footer className="no-print py-8 text-center text-slate-500 text-sm">
                    &copy; 2026 Abadi Jaya Solutions. Seluruh hak cipta dilindungi.
                </footer>
            </div>
        </div>
    );
}
