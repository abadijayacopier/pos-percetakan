import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { generateRawReceipt, printViaBluetooth, initQZ, printViaQZ, formatDateTime } from '../utils';
import { FiPrinter, FiArrowLeft, FiPlus, FiCheck } from 'react-icons/fi';
import ReceiptProMax from '../components/ReceiptProMax';

export default function PrintReceiptPage({ onNavigate, pageState }) {
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

    // Dynamic Printer Auto-Switching: Mobile -> 58mm Bluetooth, Desktop -> User Preferred (LX-310/80mm)
    const effectivePrinterSize = isMobile ? '58mm' : printSettings.printerSize;

    const getPrinterWidthClass = () => {
        switch (effectivePrinterSize) {
            case '58mm': return 'max-w-[300px]';
            case '80mm': return 'max-w-[380px]';
            case 'lx310': return 'max-w-[600px] text-lg'; // continuous prints usually need wider
            case 'inkjet': return 'max-w-[794px] text-lg'; // a4 width
            default: return 'max-w-[380px]';
        }
    };

    const getPrintWidth = () => {
        switch (effectivePrinterSize) {
            case '58mm': return '58mm';
            case '80mm': return '80mm';
            case 'lx310': return '9.5in';
            case 'inkjet': return '210mm';
            default: return '80mm';
        }
    };

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
                    width: ${getPrintWidth()} !important;
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
    }, [printSettings.printerSize]);

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
                        setReceiptData({
                            invoiceNo: trx.invoiceNo || trx.invoice_no,
                            date: formatDateTime(trx.date || new Date().toISOString()),
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
                            paymentType: trx.paymentType || trx.payment_type || 'Tunai',
                            paid: trx.paid || 0,
                            changeAmount: trx.changeAmount || trx.change_amount || 0,
                            status: trx.status || (trx.paid >= trx.total ? 'paid' : 'debt')
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
        initQZ();
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

            const receiptText = generateRawReceipt(txForPrint, storeInfo, effectivePrinterSize, isMobile, printSettings.paperSize);

            if (isMobile) {
                await printViaBluetooth(receiptText);
                console.log('Receipt sent via Web Bluetooth');
                return;
            }

            if (effectivePrinterSize === 'lx310') {
                await printViaQZ({ data: receiptText, paperSize: printSettings.paperSize }, printSettings.printerName || 'LX-310');
                console.log('Receipt sent via QZ Tray (LX-310)');
                return;
            }

            if (effectivePrinterSize === 'inkjet') {
                window.print();
                return;
            }

            const payload = {
                text: receiptText,
                printerName: printSettings.printerName,
                raw: effectivePrinterSize === 'lx310'
            };

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
        if (!receiptData) return;

        // Formatted Receipt Text for WhatsApp
        const storeName = (printSettings.storeName || 'Abadi Jaya').toUpperCase();
        const itemsText = (receiptData.items || []).map(item => {
            const name = item.desc || item.name || 'Item';
            const qty = item.qty || item.quantity || 1;
            const subtotal = item.total || item.subtotal || ((item.price || item.sellPrice || 0) * qty);
            return `» ${name} x${qty} = Rp ${formatCurrency(subtotal)}`;
        }).join('\n');

        const status = receiptData.paid >= receiptData.total ? '*LUNAS*' : `*SISA BAYAR: Rp ${formatCurrency(receiptData.total - receiptData.paid)}*`;

        const waText = `*${storeName}*\n` +
            `────────────────────────\n` +
            `■ *NOTA PEMBAYARAN*\n` +
            `––––––––––––––––––––––––––\n` +
            `ID Nota  : ${receiptData.invoiceNo}\n` +
            `Tanggal : ${receiptData.date}\n` +
            `Kasir   : ${receiptData.cashier}\n` +
            `Pelanggan: ${receiptData.customer || receiptData.customerName || 'Umum'}\n` +
            `––––––––––––––––––––––––––\n` +
            `${itemsText}\n` +
            `––––––––––––––––––––––––––\n` +
            `*TOTAL: Rp ${formatCurrency(receiptData.total)}*\n` +
            `Status: ${status}\n\n` +
            `Terima kasih telah berlangganan di ${storeName} ✦\n` +
            `Barang yang sudah dibeli tidak dapat ditukar.`;

        const encodedText = encodeURIComponent(waText);
        const waUrl = `https://wa.me/?text=${encodedText}`;

        // Action sheet for sharing using custom HTML for better visibility and UX
        Swal.fire({
            title: 'Bagikan Nota',
            html: `
                <div class="flex flex-col gap-3 mt-4">
                    <button id="swal-wa" class="flex items-center justify-between p-4 bg-[#25D366] text-white rounded-2xl font-bold hover:brightness-110 transition-all shadow-lg shadow-emerald-500/20">
                        <div class="flex items-center gap-3">
                            <i class="fab fa-whatsapp text-xl"></i>
                            <span>WhatsApp</span>
                        </div>
                        <i class="fas fa-chevron-right opacity-50"></i>
                    </button>
                    
                    <button id="swal-copy" class="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-copy text-xl"></i>
                            <span>Salin Teks Nota</span>
                        </div>
                        <i class="fas fa-chevron-right opacity-30"></i>
                    </button>
                    
                    <button id="swal-share" class="flex items-center justify-between p-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-share-alt text-xl"></i>
                            <span>Lainnya (System Share)</span>
                        </div>
                        <i class="fas fa-chevron-right opacity-50"></i>
                    </button>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                popup: 'rounded-[1.5rem] dark:bg-slate-800 p-6',
                title: 'text-2xl font-black text-slate-800 dark:text-white mb-2'
            },
            didOpen: () => {
                const waBtn = document.getElementById('swal-wa');
                const copyBtn = document.getElementById('swal-copy');
                const shareBtn = document.getElementById('swal-share');

                waBtn.addEventListener('click', () => {
                    window.open(waUrl, '_blank');
                    Swal.close();
                });

                copyBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(waText);
                    Swal.close();
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'Teks nota telah disalin!',
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: { popup: 'rounded-2xl' }
                    });
                });

                shareBtn.addEventListener('click', () => {
                    if (navigator.share) {
                        navigator.share({
                            title: `Nota ${receiptData.invoiceNo}`,
                            text: waText,
                        }).catch(() => { });
                    } else {
                        navigator.clipboard.writeText(waText);
                        Swal.fire({ icon: 'info', title: 'Clipboard', text: 'Teks disalin ke clipboard.', timer: 1500, showConfirmButton: false });
                    }
                    Swal.close();
                });
            }
        });
    };

    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen flex flex-col items-center pt-8 pb-32 px-4 scroll-smooth print:bg-white print:p-0">
            {/* Ambient Background Glow (Preview Only) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden no-print">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Action Bar (No Print) */}
            <div className={`no-print sticky top-6 z-50 mb-10 flex flex-wrap sm:flex-nowrap gap-3 w-full ${getPrinterWidthClass()} bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl p-4 rounded-[2rem] shadow-2xl shadow-blue-500/10 border border-white/40 dark:border-slate-700/50 transition-all duration-500`}>
                <button
                    className="flex-none flex items-center justify-center p-3.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl hover:bg-slate-200 transition-all shadow-sm active:scale-95"
                    onClick={() => onNavigate('pos')}
                    title="Kembali ke POS"
                >
                    <FiArrowLeft className="text-xl" />
                </button>
                <button
                    className="flex-1 flex items-center justify-center gap-3 bg-blue-600 text-white py-3.5 px-6 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 active:scale-95 group"
                    onClick={handleDirectPrint}
                >
                    <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">print</span>
                    Cetak Nota
                </button>
                <button
                    className="flex-1 flex items-center justify-center gap-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-3.5 px-6 rounded-2xl font-black border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95 group"
                    onClick={handleShare}
                >
                    <span className="material-symbols-outlined group-hover:-translate-y-1 transition-transform">share</span>
                    Bagikan
                </button>
            </div>

            {/* Receipt Preview Area */}
            <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-12 overflow-y-auto bg-slate-100/50 dark:bg-slate-900/50 custom-scrollbar">
                <ReceiptProMax
                    receiptData={receiptData}
                    printSettings={{ ...printSettings, printerSize: effectivePrinterSize }}
                    formatCurrency={formatCurrency}
                    printerWidthClass={getPrinterWidthClass()}
                />

                {/* Additional Guidance (No Print) */}
                <div className="no-print mt-12 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-12">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none pt-0.5">Printer Siap Mencetak</p>
                    </div>
                    <p className="text-slate-400 text-xs text-center max-w-[300px] font-medium leading-relaxed">Gunakan tombol biru di atas untuk mengirim perintah ke printer thermal atau inkjet anda.</p>
                </div>
            </div>
        </div>
    );
}
