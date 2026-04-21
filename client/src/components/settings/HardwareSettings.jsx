import { FiCpu, FiMonitor, FiActivity, FiSave, FiAlertCircle } from 'react-icons/fi';

export default function HardwareSettings({ 
    fingerprintIp, 
    setFingerprintIp, 
    fingerprintPort, 
    setFingerprintPort, 
    saveSettings 
}) {
    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 p-10">
                <div className="flex items-center gap-6 mb-10">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                        <FiCpu size={40} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Mesin Absensi Sidik Jari</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Konfigurasi koneksi ke mesin absensi Iware / ZKTeco.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">IP Address Mesin</label>
                        <div className="relative">
                            <FiMonitor className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Contoh: 192.168.1.201"
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono font-bold dark:text-white"
                                value={fingerprintIp}
                                onChange={e => setFingerprintIp(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-slate-400 ml-1">Pastikan komputer dan mesin dalam satu jaringan WiFi/LAN.</p>
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Port (Default: 4370)</label>
                        <div className="relative">
                            <FiActivity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="number" 
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold dark:text-white"
                                value={fingerprintPort}
                                onChange={e => setFingerprintPort(parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button 
                        onClick={saveSettings}
                        className="flex items-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-200 dark:shadow-none group"
                    >
                        <FiSave className="group-hover:scale-110 transition-transform" /> Simpan Konfigurasi Perangkat
                    </button>
                </div>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-3xl p-8 flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
                    <FiAlertCircle size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-amber-800 dark:text-amber-400 text-lg">Penting: Pencocokan Data</h4>
                    <p className="text-sm text-amber-700/80 dark:text-amber-500/80 mt-2 leading-relaxed">
                        Agar data bisa ditarik secara otomatis, pastikan **NIK** di data karyawan pada aplikasi ini (SDM & Penggajian) diisi **sama persis** dengan **User ID** (Nomor Jari) yang terdaftar di mesin sidik jari Iware Anda.
                    </p>
                </div>
            </div>
        </div>
    );
}
