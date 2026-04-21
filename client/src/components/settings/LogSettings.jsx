export default function LogSettings({
    activityLog,
    logPage,
    setLogPage,
    totalLogPages
}) {
    return (
        <div className="space-y-6 pb-12">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-slate-400">person</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">Log Aktivitas Sistem</h3>
                            <p className="text-[10px] text-slate-500 font-medium">Rekaman jejak aktivitas admin dan kasir</p>
                        </div>
                    </div>
                    <div className="flex w-full md:w-auto gap-3">
                        <span className="text-sm text-slate-500">Halaman <span className="font-bold text-slate-800 dark:text-slate-200">{logPage}</span> dari <span className="font-bold text-slate-800 dark:text-slate-200">{totalLogPages || 1}</span></span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse md:min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Waktu</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Aksi</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Target</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">IP</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {activityLog.map(l => (
                                <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                        {new Date(l.created_at).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
                                                {l.username?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{l.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                            l.action === 'login' ? 'bg-green-100 text-green-600' :
                                            l.action === 'logout' ? 'bg-slate-100 text-slate-600' :
                                            l.action?.includes('delete') ? 'bg-red-100 text-red-600' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                            {l.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 italic">
                                        {l.target_table}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                                        {l.ip_address}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                                        {l.details}
                                    </td>
                                </tr>
                            ))}
                            {activityLog.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">Belum ada log aktivitas</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/10">
                    <button 
                        disabled={logPage === 1}
                        onClick={() => setLogPage(p => p - 1)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Sebelumnya
                    </button>
                    <div className="flex gap-2">
                        {Array.from({ length: Math.min(5, totalLogPages) }).map((_, i) => {
                            let pageNum = i + 1;
                            if (totalLogPages > 5 && logPage > 3) {
                                pageNum = logPage - 2 + i;
                                if (pageNum > totalLogPages) pageNum = totalLogPages - (4 - i);
                            }
                            if (pageNum <= 0) return null;
                            if (pageNum > totalLogPages) return null;
                            
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setLogPage(pageNum)}
                                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                                        logPage === pageNum 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' 
                                        : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>
                    <button 
                        disabled={logPage === totalLogPages}
                        onClick={() => setLogPage(p => p + 1)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Selanjutnya
                    </button>
                </div>
            </div>
        </div>
    );
}
