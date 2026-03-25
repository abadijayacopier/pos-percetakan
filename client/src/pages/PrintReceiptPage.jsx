import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { generateRawReceipt, printViaBluetooth } from '../utils';

export default function PrintReceiptPage({ pageState }) {
    const { user } = useAuth();
    const [receiptData, setReceiptData] = useState(pageState?.receipt || null);
    const [isLoading, setIsLoading] = useState(!pageState?.receipt);
    const [printSettings, setPrintSettings] = useState({
        storeName: 'JAYA COPY & PERCETAKAN',
        storeAddress: 'Jl. Pendidikan No. 45, Jakarta Pusat',
        storePhone: '0812-3456-7890',
        receiptFooter: 'Terima Kasih Atas Kunjungan Anda!',
        printerSize: '80mm',
        printerName: ''
    });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        // Apply print-specific styles dynamically
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                body {
                    background: white !important;
                    margin: 0;
                    padding: 0;
                }
                .no-print {
                    display: none !important;
                }
                .thermal-width {
                    width: 80mm !important;
                    max-width: 100% !important;
                    margin: 0 auto !important;
                    box-shadow: none !important;
                    border: none !important;
                }
                @page {
                    margin: 0; 
                }
                /* Hide global Layout elements during print */
                header, aside, .sidebar {
                    display: none !important;
                }
                main {
                    margin: 0 !important;
                    padding: 0 !important;
                }
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchSettingsAndData = async () => {
            try {
                // Fetch settings
                const settingsRes = await api.get('/settings');
                if (settingsRes.data) {
                    const sMap = {};
                    settingsRes.data.forEach(s => sMap[s.key] = s.value);
                    setPrintSettings({
                        storeName: sMap.store_name || 'JAYA COPY & PERCETAKAN',
                        storeAddress: sMap.store_address || 'Jl. Pendidikan No. 45, Jakarta Pusat',
                        storePhone: sMap.store_phone || '0812-3456-7890',
                        receiptFooter: sMap.receipt_footer || 'Terima Kasih Atas Kunjungan Anda!',
                        printerSize: sMap.printer_size || '80mm',
                        printerName: sMap.printer_name || ''
                    });
                }
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            }

            if (!pageState?.receipt) {
                try {
                    const res = await api.get('/transactions');
                    if (res.data && res.data.length > 0) {
                        const trx = res.data[0];
                        const dateObj = new Date(trx.date || new Date());

                        setReceiptData({
                            invoiceNo: trx.invoiceNo || trx.invoice_no,
                            date: dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                            cashier: trx.userName || trx.user_name || user?.name || 'Kasir',
                            customer: trx.customerName || trx.customer_name || 'Umum',
                            items: (trx.items || []).map(i => ({
                                desc: i.name || 'Item Cetak',
                                qty: i.qty || 1,
                                total: i.subtotal || 0,
                                note: ''
                            })),
                            subtotal: trx.subtotal || trx.total,
                            tax: trx.tax || 0,
                            total: trx.total,
                            paymentMethod: trx.paymentType || 'Tunai',
                            paid: trx.paid || trx.total,
                            change: trx.changeAmount || 0
                        });
                    }
                } catch (error) {
                    console.error('Failed to fetch latest transaction:', error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };
        fetchSettingsAndData();
    }, [pageState, user]);

    if (isLoading) {
        return (
            <div className="bg-slate-100 dark:bg-slate-900 min-h-screen flex items-center justify-center font-display">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse">Memuat Nota Transaksi...</p>
                </div>
            </div>
        );
    }

    if (!receiptData) {
        return (
            <div className="bg-slate-100 dark:bg-slate-900 min-h-screen flex items-center justify-center font-display">
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">receipt_long</span>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Data Nota Kosong</h3>
                    <p className="text-sm text-slate-500 mt-1">Belum ada transaksi di database.</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount);
    };

    const handleDirectPrint = async () => {
        if (!receiptData) return;

        try {
            const storeInfo = {
                name: printSettings.storeName,
                address: printSettings.storeAddress,
                phone: printSettings.storePhone,
                footer: printSettings.receiptFooter
            };

            const txForPrint = {
                ...receiptData,
                userName: receiptData.cashier,
                customerName: receiptData.customer,
                items: receiptData.items.map(item => ({
                    name: item.desc || item.name || 'Item',
                    qty: item.qty || item.quantity || 1,
                    price: Math.round((item.total || 0) / (item.qty || item.quantity || 1)),
                    subtotal: item.total || item.subtotal || 0
                }))
            };

            const receiptText = generateRawReceipt(txForPrint, storeInfo, printSettings.printerSize, isMobile);

            if (isMobile) {
                await printViaBluetooth(receiptText);
                console.log('Receipt sent via Web Bluetooth');
                return;
            }

            const payload = {
                text: receiptText,
                printerName: printSettings.printerName
            };

            if (printSettings.printerSize === 'lx310') payload.raw = true;

            await api.post('/print/receipt', payload);
            console.log('Receipt printed successfully via API');

            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: 'Perintah cetak telah dikirim ke printer!',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (err) {
            console.error('Failed to print receipt:', err);
            Swal.fire({ icon: 'error', title: 'Oops...', text: 'Gagal mencetak nota: ' + (err.response?.data?.message || err.message), timer: 3000 });
        }
    };

    const handleShare = async () => {
        const textData = `*NOTA PEMBAYARAN - ${printSettings.storeName.toUpperCase()}*\nNo. Nota: ${receiptData.invoiceNo}\nKasir: ${receiptData.cashier}\nTotal: Rp ${formatCurrency(receiptData.total)}\nStatus: ${receiptData.paid >= receiptData.total ? 'LUNAS' : 'SISA BAYAR Rp ' + formatCurrency(receiptData.total - receiptData.paid)}\n\nTerima Kasih Atas Kunjungan Anda!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Nota ${receiptData.invoiceNo}`,
                    text: textData,
                });
            } catch (err) {
                console.log('User cancelled share or share failed', err);
            }
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(textData);
            Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Teks nota telah disalin ke clipboard! Silakan paste (tempel) di WhatsApp.', timer: 3000 });
        }
    };

    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen flex flex-col items-center pt-8 pb-24 px-4 font-display print:bg-white print:p-0">
            {/* Action Bar (No Print) */}
            <div className="no-print sticky top-4 z-50 mb-6 flex gap-4 w-full max-w-[380px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50">
                <button
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 px-4 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
                    onClick={handleDirectPrint}
                >
                    <span className="material-symbols-outlined">print</span>
                    Cetak Nota
                </button>
                <button
                    className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-2.5 px-4 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                    onClick={handleShare}
                >
                    <span className="material-symbols-outlined">share</span>
                    Bagikan
                </button>
            </div>

            {/* Main Receipt Container */}
            <div className="thermal-width w-[380px] bg-white text-black shadow-2xl shadow-slate-300/50 dark:shadow-black/50 border-t-8 border-t-slate-800 p-6 flex flex-col mx-auto print:shadow-none print:border-none print:p-2 relative overflow-hidden">
                {/* Header / Logo Section */}
                <div className="flex flex-col items-center text-center border-b-2 border-dashed border-slate-800 pb-4 mb-4">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-2 text-white">
                        <span className="material-symbols-outlined !text-3xl">print</span>
                    </div>
                    <h1 className="text-xl font-black uppercase tracking-tighter">{printSettings.storeName}</h1>
                    <p className="text-[10.5px] font-medium mt-1">{printSettings.storeAddress}</p>
                    <p className="text-[10.5px] font-medium">Telp: {printSettings.storePhone}</p>
                </div>

                {/* Metadata Section */}
                <div className="flex flex-col gap-1 text-[11px] mb-4 border-b-2 border-dashed border-slate-800 pb-4 font-code">
                    <div className="flex justify-between">
                        <span className="font-bold">No. Nota</span>
                        <span className="font-medium">: {receiptData.invoiceNo}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold">Tanggal</span>
                        <span className="font-medium">: {receiptData.date}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold">Kasir</span>
                        <span className="font-medium uppercase">: {receiptData.cashier}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold">Pelanggan</span>
                        <span className="font-medium uppercase">: {receiptData.customer}</span>
                    </div>
                </div>

                {/* Items Table */}
                <div className="flex flex-col gap-3 mb-6 relative">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider border-b border-black pb-1 mb-1">
                        <span className="w-1/2">Deskripsi</span>
                        <span className="w-1/4 text-right">Qty</span>
                        <span className="w-1/4 text-right">Total</span>
                    </div>

                    {receiptData.items.map((item, index) => {
                        const desc = item.desc || item.name || 'Item Cetak';
                        const qty = item.qty || item.quantity || 1;
                        const total = item.total || (item.price * qty) || 0;
                        const note = item.note || '';

                        return (
                            <div key={index} className="flex flex-col gap-1 font-code">
                                <div className="flex justify-between text-[11px] sm:text-xs">
                                    <span className="w-1/2 font-medium break-words leading-tight pr-2 uppercase">{desc}</span>
                                    <span className="w-1/4 text-right font-bold">{qty}</span>
                                    <span className="w-1/4 text-right font-medium">{formatCurrency(total)}</span>
                                </div>
                                {note && <span className="text-[10px] text-slate-500 uppercase font-medium">{note}</span>}
                            </div>
                        );
                    })}
                </div>

                {/* Calculation Section */}
                <div className="border-t-2 border-dashed border-slate-800 pt-4 flex flex-col gap-2 font-code">
                    <div className="flex justify-between text-xs">
                        <span className="font-bold uppercase">Subtotal</span>
                        <span className="font-medium">{formatCurrency(receiptData.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="font-bold uppercase">Pajak (PPN 11%)</span>
                        <span className="font-medium ">{formatCurrency(receiptData.tax)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black mt-2 pt-2 border-t border-black">
                        <span>TOTAL</span>
                        <span>Rp {formatCurrency(receiptData.total)}</span>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="mt-6 flex flex-col gap-1 text-[11px] border-b-2 border-dashed border-slate-800 pb-4 font-code">
                    <div className="flex justify-between">
                        <span className="font-bold uppercase">Metode Bayar</span>
                        <span className="font-medium uppercase">: {receiptData.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold uppercase">Bayar</span>
                        <span className="font-medium">: {formatCurrency(receiptData.paid)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold uppercase">Kembali</span>
                        <span className="font-medium">: {formatCurrency(receiptData.change)}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center flex flex-col items-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider whitespace-pre-wrap">{printSettings.receiptFooter}</p>
                    <p className="text-[9px] mt-4 border-t border-slate-300 pt-2 w-3/4 mx-auto uppercase">Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.</p>

                    <div className="mt-6 flex justify-center h-12 w-full items-end pb-1 overflow-hidden">
                        {[2, 4, 1, 3, 2, 5, 1, 2, 4, 2, 1, 1, 3, 2, 4, 1, 2, 5, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2].map((w, i) => (
                            <div key={i} className="bg-black h-full" style={{ width: `${w}px`, minWidth: `${w}px`, marginRight: `${w % 2 === 0 ? 2 : 1.5}px` }}></div>
                        ))}
                    </div>
                    <p className="font-code text-[10px] font-bold mt-2">{receiptData.invoiceNo}</p>
                </div>
            </div>

            {/* Additional Info (No Print) */}
            <div className="no-print mt-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs max-w-[380px] text-center mb-10 transition-colors">
                <p>Siapkan printer thermal Anda, lalu gunakan tombol cetak di atas untuk mencetak nota ini.</p>
            </div>
        </div>
    );
}
