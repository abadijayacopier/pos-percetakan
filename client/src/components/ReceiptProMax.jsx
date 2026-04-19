import React from 'react';

/**
 * ReceiptProMax Component
 * A premium, realistic thermal receipt preview with zigzag edges and Outfit/Inter typography.
 */
const ReceiptProMax = ({
    receiptData,
    printSettings,
    formatCurrency = (num) => Number(num).toLocaleString('id-ID'),
    printerWidthClass = "w-[380px]" // Default for 80mm
}) => {
    if (!receiptData) return null;

    const items = receiptData.items || [];
    const safeDate = receiptData.date ? new Date(receiptData.date).toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) : '-';

    return (
        <div className={`relative bg-white shadow-2xl mx-auto transition-all duration-700 animate-in fade-in zoom-in-95 ${printerWidthClass} font-sans overflow-visible group`}>
            {/* Top Serrated Edge */}
            <div className="absolute -top-3 left-0 w-full h-4 no-print flex overflow-hidden">
                {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="min-w-[16px] h-4 bg-slate-100" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
                ))}
            </div>

            {/* Receipt Content */}
            <div className="p-8 sm:p-10 text-slate-900 relative">
                {/* Header */}
                <div className="text-center mb-10 border-b-2 border-slate-900 pb-8">
                    <div className="bg-slate-900 print:bg-transparent print:border print:border-slate-900 text-white print:text-slate-900 p-3 rounded-2xl inline-flex mb-6 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                        <span className="material-symbols-outlined text-3xl">local_printshop</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase mb-2 font-display">{printSettings.storeName || 'FOTOCOPY ABADI JAYA'}</h2>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed max-w-[80%] mx-auto whitespace-pre-wrap font-display">{printSettings.storeAddress}</p>
                    {printSettings.storePhone && (
                        <p className="text-[10px] font-black text-slate-400 mt-2 tracking-widest font-display">TELP: {printSettings.storePhone}</p>
                    )}
                </div>

                {/* Subtitle / Status Banner */}
                <div className={`px-4 py-2 mt-4 text-center border-2 border-dashed rounded-xl font-black text-xs relative overflow-hidden ${
                    (Number(receiptData.paid) < Number(receiptData.total) || 
                     ['pending', 'debt'].includes(String(receiptData.status).toLowerCase()) || 
                     ['pending', 'debt'].includes(String(receiptData.paymentType).toLowerCase()))
                    ? 'bg-red-50 text-red-600 border-red-200 print:bg-transparent print:text-black print:border-black'
                    : 'bg-slate-900 text-white border-slate-900 print:bg-transparent print:text-slate-900 print:border-slate-900'
                    }`}>
                    {(Number(receiptData.paid) < Number(receiptData.total) || 
                      ['pending', 'debt'].includes(String(receiptData.status).toLowerCase()) || 
                      ['pending', 'debt'].includes(String(receiptData.paymentType).toLowerCase()))
                        ? '*** BELUM LUNAS ***'
                        : 'NOTA PEMBAYARAN'}
                </div>


                {/* Metadata */}
                <div className="flex flex-col gap-2.5 mb-10 text-[11px] font-bold text-slate-600 uppercase tracking-tight border-b border-dashed border-slate-200 pb-8 font-code">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Invoice</span>
                        <span className="text-slate-900"># {receiptData.invoiceNo}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Tanggal</span>
                        <span className="text-slate-900">{safeDate}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Kasir</span>
                        <span className="text-slate-900">{receiptData.userName || printSettings.userName || 'Staf Utama'}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                        <span className="text-slate-400">Pelanggan</span>
                        <span className="bg-blue-600 print:bg-transparent print:border print:border-slate-900 text-white print:text-slate-900 px-2 py-0.5 rounded text-[10px]">{receiptData.customerName || 'UMUM'}</span>
                    </div>

                </div>

                {/* Items Table */}
                <div className="flex flex-col gap-6 mb-10">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                        <span>Deskripsi Item</span>
                        <span>Total</span>
                    </div>
                    {items.map((item, idx) => {
                        const qty = item.qty || item.quantity || 1;
                        const price = item.price || item.sellPrice || 0;
                        const itemSubtotal = item.subtotal || (qty * price);

                        return (
                            <div key={idx} className="flex flex-col gap-1 group/item">
                                <div className="flex justify-between items-start">
                                    <span className="text-[12px] font-black text-slate-800 leading-tight flex-1 pr-4 font-display">{item.name}</span>
                                    <span className="text-[12px] font-black text-slate-900 font-code">Rp {formatCurrency(itemSubtotal)}</span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 font-code">
                                    {qty} x {formatCurrency(price)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="h-px w-full border-t-2 border-dashed border-slate-300 py-3" />

                {/* Calculation Section */}
                <div className="flex flex-col gap-2.5 font-code">
                    <div className="flex justify-between text-[11px] text-slate-500 font-bold uppercase pr-0.5">
                        <span>Subtotal</span>
                        <span>{formatCurrency(receiptData.subtotal)}</span>
                    </div>
                    {(receiptData.tax > 0 || receiptData.discount > 0) && (
                        <>
                            {receiptData.discount > 0 && (
                                <div className="flex justify-between text-[11px] text-red-500 font-bold uppercase pr-0.5">
                                    <span>Diskon</span>
                                    <span>-{formatCurrency(receiptData.discount)}</span>
                                </div>
                            )}
                            {receiptData.tax > 0 && (
                                <div className="flex justify-between text-[11px] text-slate-500 font-bold uppercase pr-0.5">
                                    <span>Pajak</span>
                                    <span>{formatCurrency(receiptData.tax)}</span>
                                </div>
                            )}
                        </>
                    )}
                    <div className="flex justify-between items-center text-xl font-black mt-4 pt-4 border-t-2 border-slate-900">
                        <span className="tracking-tighter">TOTAL</span>
                        <span className="bg-slate-900 print:bg-transparent print:border print:border-slate-900 text-white print:text-slate-900 px-3 py-1 rounded-lg">Rp {formatCurrency(receiptData.total)}</span>
                    </div>

                </div>

                {/* Payment Info */}
                <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-2 text-[10px] font-bold uppercase bg-slate-50 print:bg-transparent p-4 rounded-2xl border border-slate-100 print:border-slate-900 font-display">
                    <div className="text-slate-400">Pembayaran</div>
                    <div className="text-right text-slate-800">{receiptData.paymentMethod || receiptData.paymentType || 'Tunai'}</div>
                    <div className="text-slate-400">Diterima</div>
                    <div className="text-right text-slate-800">{formatCurrency(receiptData.paid ?? 0)}</div>
                    <div className="text-slate-400">Kembalian</div>
                    <div className="text-right font-black text-blue-600 print:text-slate-900 text-[11px]">{formatCurrency(receiptData.changeAmount || receiptData.change || 0)}</div>
                    <div className="text-slate-400">Status</div>
                    <div className={`text-right font-black ${(Number(receiptData.paid) < Number(receiptData.total) || 
                        ['pending', 'debt'].includes(String(receiptData.status).toLowerCase()) || 
                        ['pending', 'debt'].includes(String(receiptData.paymentType).toLowerCase())) ? 'text-red-600' : 'text-emerald-600'} print:text-slate-900 text-[11px]`}>
                        {(Number(receiptData.paid) < Number(receiptData.total) || 
                            ['pending', 'debt'].includes(String(receiptData.status).toLowerCase()) || 
                            ['pending', 'debt'].includes(String(receiptData.paymentType).toLowerCase())) ? 'BELUM LUNAS' : 'LUNAS'}
                    </div>
                </div>


                {/* Footer */}
                <div className="mt-10 text-center flex flex-col items-center">
                    <div className="w-8 h-1 bg-slate-200 rounded-full mb-6" />
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest whitespace-pre-wrap leading-relaxed px-4 font-display">{printSettings.receiptFooter || 'Terima Kasih Atas Kunjungan Anda!'}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-4 leading-relaxed max-w-[90%] font-display">Barang yang sudah dibeli tidak dapat ditukar kecuali ada perjanjian khusus.</p>

                    {/* Aesthetic Barcode Mockup */}
                    <div className="mt-8 flex justify-center h-14 w-full items-end pb-1 overflow-hidden opacity-90 hover:opacity-100 transition-opacity">
                        {[2, 4, 1, 3, 2, 5, 1, 2, 4, 3, 1, 2, 5, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3, 2, 1, 4, 2, 2, 5, 1, 3, 2].map((w, i) => (
                            <div key={i} className="bg-slate-900 h-full rounded-sm" style={{ width: `${w}px`, minWidth: `${w}px`, marginRight: `${(i % 3 === 0) ? 3 : 1.5}px` }}></div>
                        ))}
                    </div>
                    <p className="font-code text-[11px] font-black mt-3 text-slate-400 tracking-[0.3em] pl-2">{receiptData.invoiceNo}</p>
                </div>
            </div>

            {/* Bottom Serrated Edge */}
            <div className="absolute -bottom-3 left-0 w-full h-4 no-print flex overflow-hidden">
                {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="min-w-[16px] h-4 bg-slate-100" style={{ clipPath: 'polygon(50% 0, 0 100%, 100% 100%)' }}></div>
                ))}
            </div>
        </div>
    );
};

export default ReceiptProMax;
