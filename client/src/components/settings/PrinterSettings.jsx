import { FiPrinter, FiFileText, FiZap, FiEdit, FiUpload, FiMessageCircle, FiSave, FiActivity, FiEye, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';
import { generateRawReceipt, printViaQZ } from '../../utils';

export default function PrinterSettings({
    printerSize, setPrinterSize,
    paperSize, setPaperSize,
    autoPrint, setAutoPrint,
    printerName, setPrinterName,
    systemPrinters, qzPrinters,
    storeName, setStoreName,
    storeAddress, setStoreAddress,
    storePhone, setStorePhone,
    receiptFooter, setReceiptFooter,
    storeLogo, handleLogoUpload,
    saveSettings, showToast
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
            <div className="lg:col-span-2 space-y-6">
                {/* Hardware Settings */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                            <FiPrinter size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Pengaturan Perangkat Keras</h3>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Tipe Printer & Kertas Nota</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { id: '58mm', icon: <FiFileText />, title: 'Thermal 58mm', desc: 'Printer POS kecil' },
                                    { id: '80mm', icon: <FiFileText />, title: 'Thermal 80mm', desc: 'Printer POS standar' },
                                    { id: 'lx310', icon: <FiPrinter />, title: 'Dot Matrix LX310', desc: 'Kertas continuous 12×14cm' },
                                    { id: 'inkjet', icon: <FiPrinter />, title: 'Inkjet / Laser', desc: 'Ukuran A4 / A5 / Folio' },
                                ].map(t => (
                                    <button key={t.id} className={`flex text-left p-4 rounded-2xl border-2 transition-all group ${printerSize === t.id
                                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                        }`} onClick={() => setPrinterSize(t.id)}>
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-colors ${printerSize === t.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                            }`}>
                                            {t.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`font-bold text-sm ${printerSize === t.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>{t.title}</h4>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{t.desc}</p>
                                        </div>
                                        {printerSize === t.id && <FiCheckCircle className="text-blue-600 self-start mt-1" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {printerSize === 'inkjet' && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Ukuran Kertas</label>
                                <div className="flex flex-wrap gap-2">
                                    {['A5', 'A4', 'Folio'].map(sz => (
                                        <button key={sz} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${paperSize === sz
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
                                            }`} onClick={() => setPaperSize(sz)}>{sz}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {printerSize === 'lx310' && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-orange-600">Ukuran Continuous Form</label>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { id: 'standard', label: '9.5 x 11" (Standard)', desc: 'Faktur/Slip' },
                                        { id: 'half', label: '9.5 x 5.5" (Half)', desc: 'Kuintasi/Nota' },
                                        { id: 'wartel', label: '12 x 14 cm (Wartel)', desc: 'Nota Kecil' },
                                    ].map(sz => (
                                        <button key={sz.id} className={`flex flex-col items-start px-5 py-3 rounded-2xl border-2 transition-all min-w-[160px] ${paperSize === sz.id
                                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700 border-slate-100 dark:border-slate-800'
                                            }`} onClick={() => setPaperSize(sz.id)}>
                                            <span className="text-sm font-bold">{sz.label}</span>
                                            <span className="text-[10px] opacity-60 font-medium">{sz.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                            <div className="max-w-[80%]">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-white">Cetak Struk Otomatis</h4>
                                <p className="text-[11px] text-slate-500 mt-1">Memicu pencetakan secara otomatis saat transaksi selesai.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={autoPrint} onChange={e => setAutoPrint(e.target.checked)} />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                            <div className="flex items-center gap-2 mb-3">
                                <FiZap className="text-blue-600" />
                                <label className="text-sm font-bold text-blue-800 dark:text-blue-300">Mode Cetak Cepat (Direct Print)</label>
                            </div>
                            <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mb-4 leading-relaxed">Struk dikirim langsung ke hardware printer tanpa dialog browser (Silent Print).</p>
                            <select className="w-full bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={printerName} onChange={e => setPrinterName(e.target.value)}>
                                <option value="">Cetak via Dialog Browser (Bawaan PDF)</option>
                                {printerSize === 'lx310' ? (
                                    qzPrinters.map(p => <option key={p} value={p}>{p} (QZ Tray)</option>)
                                ) : (
                                    systemPrinters.map(p => <option key={p} value={p}>{p}</option>)
                                )}
                            </select>
                            {printerSize === 'lx310' && qzPrinters.length === 0 && (
                                <p className="text-[10px] text-red-500 mt-2 font-bold animate-pulse">Menghubungkan ke QZ Tray... Pastikan aplikasi aktif di komputer.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Branding Header & Footer */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                            <FiEdit size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Branding Header & Footer</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nama Toko</label>
                                <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={storeName} onChange={e => setStoreName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alamat Toko</label>
                                <textarea rows="3" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nomor Telepon</label>
                                <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={storePhone} onChange={e => setStorePhone(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pesan Footer Struk</label>
                                <textarea rows="3" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} placeholder="Terima kasih telah berbelanja!" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Logo Struk</label>
                                <div className="relative group overflow-hidden bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl p-6 transition-all flex flex-col items-center justify-center cursor-pointer">
                                    {storeLogo ? (
                                        <img src={storeLogo} alt="Logo" className="h-16 object-contain mb-3" />
                                    ) : (
                                        <FiUpload size={24} className="text-slate-400 mb-2" />
                                    )}
                                    <p className="text-[10px] text-slate-500 font-bold group-hover:text-blue-500 uppercase tracking-widest">{storeLogo ? 'Ganti Logo' : 'Unggah Logo'}</p>
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Struk Digital */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                            <FiMessageCircle size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Layanan Struk Digital</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-none">
                                <FiMessageCircle size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h4 className="font-bold text-sm text-slate-700 dark:text-white">WhatsApp Struk</h4>
                                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium">Kirim otomatis via API WhatsApp</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4 opacity-70">
                            <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center">
                                <FiFileText size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h4 className="font-bold text-sm text-slate-700 dark:text-white">Email Struk</h4>
                                    <input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium">Kirim struk ke email pelanggan</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-200 dark:shadow-none group" onClick={saveSettings}>
                        <FiSave className="group-hover:scale-110 transition-transform" /> Simpan Perubahan Printer
                    </button>
                    <button className="flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-sm" onClick={async () => {
                        const dummyReceipt = {
                            invoiceNo: 'TEST-001',
                            date: new Date(),
                            items: [
                                { name: 'TEST PRINT SERVICE', qty: 1, price: 5000, subtotal: 5000 },
                                { name: 'KERTAS HVS A4', qty: 10, price: 500, subtotal: 5000 }
                            ],
                            subtotal: 10000,
                            discount: 0,
                            total: 10000,
                            paid: 10000,
                            change: 0,
                            paymentType: 'Tunai',
                            status: 'Lunas',
                            userName: 'TEST ADMIN'
                        };
                        const storeInfo = {
                            name: storeName,
                            address: storeAddress,
                            phone: storePhone,
                            footer: receiptFooter,
                            userName: 'TEST ADMIN'
                        };

                        const receiptText = generateRawReceipt(dummyReceipt, storeInfo, printerSize, false, paperSize);

                        if (printerSize === 'lx310') {
                            await printViaQZ({ data: receiptText, paperSize: paperSize }, printerName || 'LX-310');
                        } else {
                            await api.post('/print/receipt', {
                                text: receiptText,
                                printerName: printerName,
                                mode: printerSize === 'inkjet' ? 'inkjet' : 'normal'
                            });
                        }
                        showToast('Percobaan cetak dikirim!', 'info');
                    }}>
                        <FiActivity /> Tes Cetak
                    </button>
                </div>
            </div>

            {/* Right Column: Live Preview */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden sticky top-32">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-center gap-2">
                            <FiEye className="text-blue-500" />
                            <h3 className="font-bold text-slate-700 dark:text-white text-sm">Pratinjau Struk</h3>
                        </div>
                    </div>
                    <div className="p-8 flex justify-center bg-slate-100/50 dark:bg-slate-950/50">
                        <div className="bg-white dark:bg-white text-slate-800 w-full max-w-[280px] min-h-[400px] shadow-2xl p-6 relative">
                            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-100 dark:from-slate-900 to-transparent pointer-events-none z-10" />
                            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-size-[16px_16px] opacity-30 pointer-events-none" />
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar -mx-2 px-2 relative z-20">
                                <div className="flex justify-center mb-4">
                                    {storeLogo ? (
                                        <img src={storeLogo} alt="Logo" className="h-10 object-contain" />
                                    ) : (
                                        <div className="w-10 h-10 border-2 border-slate-200 flex items-center justify-center text-slate-300">
                                            <FiPrinter size={16} />
                                        </div>
                                    )}
                                </div>
                                <div className="text-center">
                                    <h4 className="font-black text-xs uppercase tracking-tighter leading-tight">{storeName || 'NAMA TOKO'}</h4>
                                    <p className="text-[9px] mt-1 leading-snug">{storeAddress || 'Alamat lengkap toko Anda mencakup jalan, kota, dan kode pos'}</p>
                                    <p className="text-[9px] font-bold mt-0.5">TELP: {storePhone || '-'}</p>
                                </div>
                                <div className="border-t border-dashed border-slate-300 my-4"></div>
                                <div className="flex justify-between text-[9px] mb-2 font-mono">
                                    <span>#INV-9823</span>
                                    <span>{new Date().toLocaleDateString('id-ID')}</span>
                                </div>
                                <div className="border-t border-dashed border-slate-300 my-4"></div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px]">
                                        <span>Fotocopi A4 BW x50</span>
                                        <span className="font-bold">25.000</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span>Kertas A4 (Rim)</span>
                                        <span className="font-bold">55.000</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span>Jasa Jilid Spiral</span>
                                        <span className="font-bold">15.000</span>
                                    </div>
                                </div>
                                <div className="border-t border-dashed border-slate-500 my-4 opacity-30"></div>
                                <div className="flex justify-between text-sm font-black">
                                    <span>TOTAL</span>
                                    <span>95.000</span>
                                </div>
                                <div className="border-t border-dashed border-slate-300 my-4"></div>
                                <div className="text-center italic text-[9px] px-2 leading-relaxed text-slate-500">
                                    {receiptFooter || 'Terima kasih telah berbelanja!'}
                                </div>
                                <div className="mt-6 text-center">
                                    <div className="w-12 h-12 border border-slate-200 mx-auto flex items-center justify-center opacity-30">
                                        <FiZap size={24} />
                                    </div>
                                    <p className="text-[7px] text-slate-300 mt-1 uppercase font-bold tracking-[0.2em]">{storeName || 'BADJAH'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/10 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Mockup: {printerSize === '58mm' ? 'Thermal 58mm' : printerSize === '80mm' ? 'Thermal 80mm' : printerSize === 'lx310' ? 'Dot Matrix' : `Inkjet ${paperSize}`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
