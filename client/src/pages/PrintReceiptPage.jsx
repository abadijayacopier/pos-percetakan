import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function PrintReceiptPage({ pageState }) {
    const { user } = useAuth();

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
                    width: 100% !important;
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }
                @page {
                    size: 80mm auto; /* Typical thermal printer width */
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

    // Placeholder data, this can be swapped with real pageState data later
    const receiptData = pageState?.receipt || {
        invoiceNo: '#INV-20231025-01',
        date: '25 Okt 2023 14:30',
        cashier: user?.name || 'Budi Santoso',
        customer: 'Umum',
        items: [
            { desc: 'Fotocopy A4 (B/W)', qty: 50, total: 12500, note: '@250 per lembar' },
            { desc: 'Jilid Spiral Keras', qty: 1, total: 15000, note: 'Ukuran A4' },
            { desc: 'Pulpen Pilot Black', qty: 2, total: 6000, note: '@3.000 per pcs' }
        ],
        subtotal: 33500,
        tax: 3685,
        total: 37185,
        paymentMethod: 'Tunai',
        paid: 50000,
        change: 12815
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center pt-10 pb-20 px-4 font-display">
            {/* Action Bar (No Print) */}
            <div className="no-print mb-6 flex gap-4 w-full max-w-[380px]">
                <button
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2 px-4 rounded-lg font-bold hover:opacity-90 transition-opacity"
                    onClick={() => window.print()}
                >
                    <span className="material-symbols-outlined">print</span>
                    Cetak Nota
                </button>
                <button
                    className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-2 px-4 rounded-lg font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <span className="material-symbols-outlined">share</span>
                    Bagikan
                </button>
            </div>

            {/* Main Receipt Container */}
            <div className="thermal-width w-[380px] bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col text-slate-900 dark:text-slate-100">
                {/* Header / Logo Section */}
                <div className="flex flex-col items-center text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-4 mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3 text-primary">
                        <span className="material-symbols-outlined !text-4xl">print</span>
                    </div>
                    <h1 className="text-xl font-bold uppercase tracking-tight">Jaya Copy & Percetakan</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Jl. Pendidikan No. 45, Jakarta Pusat</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Telp: 0812-3456-7890</p>
                </div>

                {/* Metadata Section */}
                <div className="flex flex-col gap-1 text-xs mb-4 border-b border-dashed border-slate-300 dark:border-slate-700 pb-4">
                    <div className="flex justify-between">
                        <span className="text-slate-500">No. Nota:</span>
                        <span className="font-medium">{receiptData.invoiceNo}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Tanggal:</span>
                        <span className="font-medium">{receiptData.date}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Kasir:</span>
                        <span className="font-medium">{receiptData.cashier}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Pelanggan:</span>
                        <span className="font-medium">{receiptData.customer}</span>
                    </div>
                </div>

                {/* Items Table */}
                <div className="flex flex-col gap-3 mb-6 relative">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        <span className="w-1/2">Deskripsi</span>
                        <span className="w-1/4 text-right">Qty</span>
                        <span className="w-1/4 text-right">Total</span>
                    </div>

                    {receiptData.items.map((item, index) => (
                        <div key={index} className="flex flex-col gap-1">
                            <div className="flex justify-between text-sm">
                                <span className="w-1/2 font-medium">{item.desc}</span>
                                <span className="w-1/4 text-right text-slate-600 dark:text-slate-400">{item.qty}</span>
                                <span className="w-1/4 text-right font-medium">{formatCurrency(item.total)}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{item.note}</span>
                        </div>
                    ))}
                </div>

                {/* Calculation Section */}
                <div className="border-t border-dashed border-slate-300 dark:border-slate-700 pt-4 flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-medium">{formatCurrency(receiptData.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Pajak (PPN 11%)</span>
                        <span className="font-medium">{formatCurrency(receiptData.tax)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span>TOTAL</span>
                        <span className="text-primary">Rp {formatCurrency(receiptData.total)}</span>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="mt-6 flex flex-col gap-1 text-xs text-slate-500 border-b border-dashed border-slate-300 dark:border-slate-700 pb-4">
                    <div className="flex justify-between">
                        <span>Metode Pembayaran:</span>
                        <span className="text-slate-900 dark:text-slate-100 font-medium">{receiptData.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Bayar:</span>
                        <span className="text-slate-900 dark:text-slate-100 font-medium">{formatCurrency(receiptData.paid)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Kembali:</span>
                        <span className="text-slate-900 dark:text-slate-100 font-medium">{formatCurrency(receiptData.change)}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm font-medium italic">Terima Kasih Atas Kunjungan Anda!</p>
                    <p className="text-[10px] text-slate-400 mt-2">Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.</p>

                    <div className="mt-6 flex justify-center opacity-30 grayscale print:opacity-100 print:grayscale-0">
                        {/* Simple barcode placeholder */}
                        <div className="flex gap-1 h-8">
                            <div className="w-1 bg-black dark:bg-white print:bg-black h-full"></div>
                            <div className="w-2 bg-black dark:bg-white print:bg-black h-full"></div>
                            <div className="w-0.5 bg-black dark:bg-white print:bg-black h-full"></div>
                            <div className="w-3 bg-black dark:bg-white print:bg-black h-full"></div>
                            <div className="w-1 bg-black dark:bg-white print:bg-black h-full"></div>
                            <div className="w-2 bg-black dark:bg-white print:bg-black h-full"></div>
                            <div className="w-1 bg-black dark:bg-white print:bg-black h-full"></div>
                            <div className="w-0.5 bg-black dark:bg-white print:bg-black h-full"></div>
                            <div className="w-3 bg-black dark:bg-white print:bg-black h-full"></div>
                            <div className="w-1 bg-black dark:bg-white print:bg-black h-full"></div>
                            <div className="w-2 bg-black dark:bg-white print:bg-black h-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Info (No Print) */}
            <div className="no-print mt-8 text-slate-500 text-sm max-w-[380px] text-center">
                <p>Gunakan tombol cetak di atas untuk mencetak nota ini langsung ke printer thermal Anda.</p>
            </div>
        </div>
    );
}
