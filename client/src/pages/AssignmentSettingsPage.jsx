import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AssignmentSettingsPage({ onNavigate }) {
    const { user } = useAuth();
    const [limit, setLimit] = useState(5);

    const technicians = [
        { id: 'TECH-001', name: 'Andi Saputra', initials: 'AS', skills: ['Digital Printing', 'Offset'], auto: true, current: 3, max: 5, status: 'Optimal', statusColor: 'green' },
        { id: 'TECH-005', name: 'Rina Marlina', initials: 'RM', skills: ['Jilid & Finishing'], auto: false, current: 5, max: 5, status: 'Penuh', statusColor: 'red' },
        { id: 'TECH-008', name: 'Dedi Wijaya', initials: 'DW', skills: ['Offset', 'Digital Printing'], auto: false, current: 1, max: 5, status: 'Ringan', statusColor: 'slate' },
    ];

    const logs = [
        { id: 1, type: 'auto', title: 'Sistem Otomatis', action: 'menugaskan', target: 'SPK #2901', desc: '(Brosur 500 eks) kepada', name: 'Andi Saputra', time: 'Hari ini, 14:20 • Berdasarkan keahlian Digital Printing', badge: 'BERHASIL', badgeColor: 'green' },
        { id: 2, type: 'manual', title: 'Budi Santoso (Owner)', action: 'mengubah prioritas teknisi', target: '', desc: '', name: 'Dedi Wijaya', extra: 'menjadi Tinggi.', time: 'Kemarin, 16:45 • Perubahan Manual', badge: 'UPDATE', badgeColor: 'blue' },
        { id: 3, type: 'error', title: 'Sistem Otomatis', action: 'gagal menugaskan', target: 'SPK #2899', desc: '. Semua teknisi mencapai batas maksimal.', name: '', time: 'Kemarin, 11:30 • Antrean dialihkan ke manual', badge: 'OVERLOAD', badgeColor: 'red' },
    ];

    return (
        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100 font-display transition-colors pb-10">
            {/* Header */}
            <header className="px-6 py-6 md:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
                        <span className="material-symbols-outlined">tune</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Pengaturan Penugasan & Beban Kerja</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Kelola algoritma distribusi tugas dan kapasitas teknisi cetak secara efisien.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <button
                        onClick={() => onNavigate('production-queue')}
                        className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Batal
                    </button>
                    <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 dark:shadow-none transition-all flex items-center gap-2 group">
                        <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">save</span>
                        Simpan Perubahan
                    </button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-8">
                {/* Section 1: Kapasitas & Batas Beban Kerja */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                            <span className="material-symbols-outlined">speed</span>
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Kapasitas & Batas Beban Kerja</h3>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-4xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1 space-y-3">
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">Batas Maksimal Tugas (Work-in-Progress)</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">Tentukan jumlah maksimal SPK (Surat Perintah Kerja) yang dapat ditangani satu teknisi secara bersamaan untuk menjaga kualitas cetakan dan mengurangi stres pekerjaan.</p>
                        </div>
                        <div className="w-full md:w-80 space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between text-sm font-medium">
                                <span className="text-slate-600 dark:text-slate-300">Batas Limit: <span className="text-blue-600 dark:text-blue-400 font-bold text-lg ml-2">{limit} Tugas</span></span>
                                <span className="bg-orange-100 text-orange-600 dark:bg-orange-900/30 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">Rekomendasi</span>
                            </div>
                            <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer overflow-hidden shadow-inner">
                                <div className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all" style={{ width: `${(limit / 10) * 100}%` }}></div>
                                <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 size-5 bg-white border-4 border-blue-600 rounded-full shadow-md z-10 transition-all" style={{ left: `${(limit / 10) * 100}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-400">
                                <span>1</span>
                                <span>5</span>
                                <span>10</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Daftar Teknisi & Keahlian */}
                <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                <span className="material-symbols-outlined">groups</span>
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Daftar Teknisi & Keahlian</h3>
                        </div>
                        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all text-sm font-semibold flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">add</span> Tambah Teknisi
                        </button>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-4xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse md:min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Teknisi</th>
                                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Keahlian Utama</th>
                                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Prioritas Otomatis</th>
                                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status Beban</th>
                                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {technicians.map((t, idx) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${idx === 0 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : idx === 1 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                                                        {t.initials}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-white">{t.name}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">ID: {t.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-wrap gap-2">
                                                    {t.skills.map((s, i) => (
                                                        <span key={i} className={`px-3 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider ${i === 0 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" className="sr-only peer" checked={t.auto} readOnly />
                                                        <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="w-full max-w-[140px]">
                                                    <div className="flex justify-between text-xs font-bold mb-2">
                                                        <span className="text-slate-600 dark:text-slate-300">{t.current} / {t.max}</span>
                                                        <span className={t.statusColor === 'green' ? 'text-green-600 dark:text-green-400' : t.statusColor === 'red' ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}>{t.status}</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all ${t.statusColor === 'green' ? 'bg-green-500' : t.statusColor === 'red' ? 'bg-red-500' : 'bg-blue-400'}`} style={{ width: `${(t.current / t.max) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                                                    <span className="material-symbols-outlined text-xl">edit_note</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Section 3: Log Riwayat Penugasan */}
                <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
                                <span className="material-symbols-outlined">history_edu</span>
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Log Riwayat Penugasan Otomatis</h3>
                        </div>
                        <button className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
                            <span className="material-symbols-outlined text-sm">download</span> Unduh Audit Log
                        </button>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-4xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden">
                        {logs.map((log) => (
                            <div key={log.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${log.type === 'auto' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50' :
                                    log.type === 'manual' ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 border border-slate-200 dark:border-slate-700' :
                                        'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50'
                                    }`}>
                                    <span className="material-symbols-outlined text-2xl">
                                        {log.type === 'auto' ? 'auto_fix_high' : log.type === 'manual' ? 'person' : 'priority_high'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                        <span className="font-bold text-slate-900 dark:text-white">{log.title}</span> {log.action}{' '}
                                        {log.target && <span className={log.type === 'error' ? 'text-red-600' : 'text-blue-600'}>{log.target}</span>}
                                        {log.desc && <span> {log.desc}</span>}
                                        {log.name && <span className="font-bold text-slate-900 dark:text-white"> {log.name}</span>}
                                        {log.extra && <span> {log.extra}</span>}
                                    </p>
                                    <p className="text-xs text-slate-500 gap-1.5 flex items-center mt-2 font-medium">
                                        <span className="material-symbols-outlined text-[14px]">schedule</span> {log.time}
                                    </p>
                                </div>
                                <span className={`px-4 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider mt-4 sm:mt-0 ${log.badgeColor === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    log.badgeColor === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {log.badge}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Advanced Algorithm Toggle Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-800/50 rounded-4xl p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-200 dark:shadow-none">
                                <span className="material-symbols-outlined text-3xl">insights</span>
                            </div>
                            <div className="pt-2">
                                <h4 className="font-bold text-xl text-blue-900 dark:text-blue-100 mb-2 tracking-tight">AI Smart Load Balancing</h4>
                                <p className="text-sm text-blue-800/80 dark:text-blue-300/80 max-w-xl leading-relaxed">Aktifkan kecerdasan buatan untuk mendistribusikan tugas secara merata berdasarkan tingkat kerumitan SPK, tenggat waktu, dan kecepatan historis masing-masing teknisi.</p>
                            </div>
                        </div>
                        <div className="shrink-0 md:pt-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked readOnly />
                                <div className="w-16 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
