import { motion } from 'framer-motion';
import { FiMonitor, FiSun, FiMoon, FiDollarSign, FiSave, FiImage, FiUpload } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

export default function GeneralSettings({
    storeName, setStoreName,
    storeAddress, setStoreAddress,
    storePhone, setStorePhone,
    storeEmail, setStoreEmail,
    storeLogo, setStoreLogo,
    handleLogoUpload,
    taxEnabled, setTaxEnabled,
    taxPercentage, setTaxPercentage,
    saveSettings
}) {
    const themeCtx = useTheme();

    return (
        <div className="space-y-8 pb-12">
            {/* Business Identity */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                
                <div className="flex items-center gap-4 mb-10 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <FiSave size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Identitas Bisnis</h3>
                        <p className="text-sm text-slate-500">Informasi utama toko yang akan muncul di sistem & nota.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 relative z-10">
                    {/* Left Side: Inputs */}
                    <div className="xl:col-span-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Toko / Bisnis</label>
                                <input 
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" 
                                    placeholder="Contoh: Abadi Jaya Fotocopy" 
                                    value={storeName} 
                                    onChange={e => setStoreName(e.target.value)} 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nomor Telepon/WA</label>
                                <input 
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" 
                                    placeholder="0812..." 
                                    value={storePhone} 
                                    onChange={e => setStorePhone(e.target.value)} 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Bisnis (Gmail)</label>
                                <input 
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" 
                                    placeholder="bisnisanda@gmail.com" 
                                    value={storeEmail} 
                                    onChange={e => setStoreEmail(e.target.value)} 
                                />
                            </div>
                            <div className="space-y-2 opacity-50 cursor-not-allowed">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Website URL (Auto)</label>
                                <input 
                                    className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none cursor-not-allowed" 
                                    readOnly 
                                    value={window.location.origin}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Alamat Lengkap Toko</label>
                            <textarea 
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white h-24 resize-none" 
                                placeholder="Alamat lengkap lokasi bisnis..." 
                                value={storeAddress} 
                                onChange={e => setStoreAddress(e.target.value)} 
                            />
                        </div>
                    </div>

                    {/* Right Side: Logo Uploader */}
                    <div className="xl:col-span-4 flex flex-col items-center justify-center border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-slate-800 xl:pl-10 pt-10 xl:pt-0">
                        <div className="text-center mb-6">
                            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Logo Bisnis</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Format: JPG, PNG, WEBP (Max 5MB)</p>
                        </div>

                        <div className="relative group">
                            <div className="w-40 h-40 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-2xl flex items-center justify-center overflow-hidden transition-all group-hover:scale-105">
                                {storeLogo ? (
                                    <img src={storeLogo} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <FiImage size={40} className="text-slate-300 dark:text-slate-700" />
                                )}
                                
                                <label className="absolute inset-0 bg-blue-600/60 backdrop-blur-sm flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                    <FiUpload size={24} className="mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Ganti Logo</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                </label>
                            </div>
                            
                            {storeLogo && (
                                <button 
                                    onClick={() => setStoreLogo('')}
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-rose-600 transition-all"
                                    title="Hapus Logo"
                                >
                                    <FiSave className="rotate-45" size={14} />
                                </button>
                            )}
                        </div>

                        <div className="mt-8 flex flex-col gap-2 w-full">
                             <button 
                                onClick={() => document.querySelector('input[type="file"]').click()}
                                className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                             >
                                <FiUpload /> Pilih File
                             </button>
                        </div>
                    </div>
                </div>
            </div>



            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <FiMonitor size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Mode Tampilan</h3>
                    <p className="text-sm text-slate-500">Pilih tema yang paling nyaman untuk mata Anda.</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { id: 'light', icon: <FiSun size={20} />, label: 'Terang' },
                    { id: 'dark', icon: <FiMoon size={20} />, label: 'Gelap' },
                    { id: 'system', icon: <FiMonitor size={20} />, label: 'Sistem' },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => themeCtx.setTheme(t.id)}
                        className={`flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all ${themeCtx.themeMode === t.id
                            ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-slate-700'
                            }`}
                    >
                        {t.icon}
                        <span className="text-sm font-medium">{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-8 mt-4 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                        <FiDollarSign size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Pajak Pertambahan Nilai (PPN)</h3>
                        <p className="text-sm text-slate-500">Aktifkan untuk menambahkan pajak otomatis pada setiap transaksi.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${taxEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} onClick={() => setTaxEnabled(!taxEnabled)}>
                                <motion.div
                                    animate={{ x: taxEnabled ? 24 : 4 }}
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                />
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{taxEnabled ? 'Pajak Aktif' : 'Pajak Nonaktif'}</span>
                        </div>
                        {taxEnabled && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">Persentase:</span>
                                <div className="relative w-24">
                                    <input
                                        type="number"
                                        className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-right font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={taxPercentage}
                                        onChange={e => setTaxPercentage(e.target.value)}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                onClick={saveSettings}
            >
                <FiSave /> Simpan Pengaturan
            </button>
            </div>
        </div>
    );
}
