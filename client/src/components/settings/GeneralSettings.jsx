import { motion } from 'framer-motion';
import { FiMonitor, FiSun, FiMoon, FiDollarSign, FiSave } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

export default function GeneralSettings({
    taxEnabled, setTaxEnabled,
    taxPercentage, setTaxPercentage,
    saveSettings
}) {
    const themeCtx = useTheme();

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 max-w-2xl">
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
    );
}
