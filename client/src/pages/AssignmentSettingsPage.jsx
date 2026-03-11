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
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] dark:bg-slate-900 min-h-screen text-slate-900 dark:text-slate-100 font-[Inter]">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-6 sticky top-0 z-10">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Pengaturan Penugasan & Beban Kerja</h2>
                        <p className="text-slate-500 text-sm mt-1">Kelola algoritma distribusi tugas dan kapasitas teknisi cetak secara efisien.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onNavigate('production-queue')}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Batal
                        </button>
                        <button className="px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 shadow-sm transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">save</span>
                            Simpan Perubahan
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-8 max-w-6xl mx-auto space-y-8 w-full">
                {/* Section 1: Kapasitas & Batas Beban Kerja */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#137fec]">speed</span>
                            Kapasitas & Batas Beban Kerja
                        </h3>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1 space-y-2">
                            <h4 className="font-bold text-slate-900 dark:text-white">Batas Maksimal Tugas (Work-in-Progress)</h4>
                            <p className="text-slate-500 text-sm">Tentukan jumlah maksimal SPK (Surat Perintah Kerja) yang dapat ditangani satu teknisi secara bersamaan untuk menjaga kualitas cetakan.</p>
                        </div>
                        <div className="w-full md:w-64 space-y-3">
                            <div className="flex items-center justify-between text-sm font-medium">
                                <span>Limit: <span className="text-[#137fec] font-bold">{limit} Tugas</span></span>
                                <span className="text-slate-400 italic font-normal text-xs">Rekomendasi</span>
                            </div>
                            <div className="relative w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full cursor-pointer">
                                <div className="absolute top-0 left-0 h-full bg-[#137fec] rounded-full" style={{ width: `${(limit / 10) * 100}%` }}></div>
                                <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 size-4 bg-white border-2 border-[#137fec] rounded-full shadow-md" style={{ left: `${(limit / 10) * 100}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>1</span>
                                <span>5</span>
                                <span>10</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Daftar Teknisi & Keahlian */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#137fec]">groups</span>
                            Daftar Teknisi & Keahlian
                        </h3>
                        <button className="text-[#137fec] text-sm font-semibold hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">add</span>
                            Tambah Teknisi
                        </button>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Teknisi</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Keahlian Utama</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Prioritas Otomatis</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status Beban</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {technicians.map((t, idx) => (
                                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-9 rounded-lg flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-blue-100 text-blue-600' : idx === 1 ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'}`}>
                                                        {t.initials}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold">{t.name}</p>
                                                        <p className="text-[10px] text-slate-500">ID: {t.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {t.skills.map((s, i) => (
                                                        <span key={i} className={`px-2 py-0.5 text-[10px] font-bold rounded ${i === 0 ? 'bg-blue-50 text-[#137fec]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" className="sr-only peer" checked={t.auto} readOnly />
                                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#137fec]"></div>
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-full max-w-[100px]">
                                                    <div className="flex justify-between text-[10px] mb-1">
                                                        <span>{t.current} / {t.max}</span>
                                                        <span className={t.statusColor === 'green' ? 'text-green-600' : t.statusColor === 'red' ? 'text-red-500 font-bold' : 'text-slate-400'}>{t.status}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                                                        <div className={`h-full rounded-full ${t.statusColor === 'green' ? 'bg-green-500' : t.statusColor === 'red' ? 'bg-red-500' : 'bg-blue-400'}`} style={{ width: `${(t.current / t.max) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-slate-400 hover:text-[#137fec] transition-colors">
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
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#137fec]">history_edu</span>
                            Log Riwayat Penugasan Otomatis
                        </h3>
                        <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">download</span> Unduh Audit Log
                        </button>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                        {logs.map((log) => (
                            <div key={log.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${log.type === 'auto' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                                        log.type === 'manual' ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-500' :
                                            'bg-red-50 dark:bg-red-900/20 text-red-600'
                                    }`}>
                                    <span className="material-symbols-outlined text-xl">
                                        {log.type === 'auto' ? 'auto_fix_high' : log.type === 'manual' ? 'person' : 'priority_high'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium leading-relaxed">
                                        <span className="font-bold">{log.title}</span> {log.action}{' '}
                                        {log.target && <span className={log.type === 'error' ? 'text-red-600 font-bold' : 'text-[#137fec] font-bold'}>{log.target}</span>}
                                        {log.desc && <span> {log.desc}</span>}
                                        {log.name && <span className="font-bold"> {log.name}</span>}
                                        {log.extra && <span> {log.extra}</span>}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">{log.time}</p>
                                </div>
                                <span className={`px-2 py-1 text-[10px] font-bold rounded mt-2 sm:mt-0 ${log.badgeColor === 'green' ? 'bg-green-100 text-green-700' :
                                        log.badgeColor === 'blue' ? 'bg-blue-100 text-blue-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {log.badge}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Advanced Algorithm Toggle Card */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex gap-4">
                            <div className="size-12 rounded-xl bg-[#137fec] text-white flex items-center justify-center shrink-0 shadow-sm">
                                <span className="material-symbols-outlined text-2xl">insights</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Smart Load Balancing</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Aktifkan AI untuk mendistribusikan tugas berdasarkan tingkat kesulitan SPK dan estimasi waktu penyelesaian teknisi.</p>
                            </div>
                        </div>
                        <div className="shrink-0">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked readOnly />
                                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#137fec]"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
