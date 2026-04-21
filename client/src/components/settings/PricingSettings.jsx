import { FiEdit, FiSave, FiFile, FiTrash2, FiPrinter, FiPlus, FiBook, FiTag, FiInfo } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function PricingSettings({
    tarifDesainPerJam, setTarifDesainPerJam,
    fotocopyPrices, setFotocopyPrices,
    fcPage, setFcPage,
    printPrices, setPrintPrices,
    printPage, setPrintPage,
    bindPrices, setBindPrices,
    bindPage, setBindPage,
    fcDiscounts, setFcDiscounts,
    saveSettings, pageSize
}) {
    return (
        <div className="space-y-8 pb-12">
            {/* Tarif Desain (Standalone Section) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
                            <FiEdit size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-base">Tarif Desain per Jam</h4>
                            <p className="text-xs text-slate-500">Biaya kerja desain per jam (digunakan di modul Desain & Offset)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative w-full max-w-[240px]">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rp</span>
                            <input
                                type="number"
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                value={tarifDesainPerJam}
                                onChange={(e) => setTarifDesainPerJam(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={saveSettings}
                            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-200 dark:shadow-none flex items-center gap-2 shrink-0 active:scale-95"
                        >
                            <FiSave size={16} /> Simpan
                        </button>
                    </div>
                </div>
            </div>

            {/* Master Harga Fotocopy */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                            <FiFile size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Master Harga Fotocopy</h3>
                    </div>
                </div>

                <div className="p-0 sm:p-6">
                    <div className="overflow-auto">
                        <table className="w-full text-left border-collapse md:min-w-[700px]">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Jenis Kertas</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Warna</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Sisi</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Harga (Rp)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {fotocopyPrices.slice((fcPage - 1) * pageSize, fcPage * pageSize).map((p, idx) => {
                                    const realIdx = (fcPage - 1) * pageSize + idx;
                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                            <td className="px-6 py-3">
                                                <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-[140px] dark:text-white font-medium" value={p.paper} onChange={(e) => {
                                                    const newPrices = [...fotocopyPrices];
                                                    newPrices[realIdx] = { ...newPrices[realIdx], paper: e.target.value };
                                                    setFotocopyPrices(newPrices);
                                                }}>
                                                    {['HVS A4', 'HVS F4', 'HVS A3'].map(o => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-3">
                                                <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-[140px] dark:text-white font-medium" value={p.color} onChange={(e) => {
                                                    const newPrices = [...fotocopyPrices];
                                                    newPrices[realIdx] = { ...newPrices[realIdx], color: e.target.value };
                                                    setFotocopyPrices(newPrices);
                                                }}>
                                                    <option value="bw">Hitam Putih</option>
                                                    <option value="color">Berwarna</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-3">
                                                <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-[120px] dark:text-white font-medium" value={p.side} onChange={(e) => {
                                                    const newPrices = [...fotocopyPrices];
                                                    newPrices[realIdx] = { ...newPrices[realIdx], side: e.target.value };
                                                    setFotocopyPrices(newPrices);
                                                }}>
                                                    <option value="1">1 Sisi</option>
                                                    <option value="2">Bolak-balik</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="relative w-full max-w-[120px]">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rp</span>
                                                    <input type="number" className="pl-9 pr-3 py-2 w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold"
                                                        value={p.price}
                                                        onChange={(e) => {
                                                            const newPrices = [...fotocopyPrices];
                                                            newPrices[realIdx].price = e.target.value;
                                                            setFotocopyPrices(newPrices);
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" onClick={async () => {
                                                    const result = await Swal.fire({
                                                        title: 'Hapus Harga?',
                                                        text: `Hapus harga ${p.paper} ${p.color === 'bw' ? 'B/W' : 'Warna'} ${p.side} Sisi?`,
                                                        icon: 'warning',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#ef4444',
                                                        confirmButtonText: 'Ya, Hapus!',
                                                        cancelButtonText: 'Batal'
                                                    });
                                                    if (result.isConfirmed) {
                                                        setFotocopyPrices(fotocopyPrices.filter((_, i) => i !== realIdx));
                                                    }
                                                }}><FiTrash2 /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {fotocopyPrices.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center text-slate-400">Belum ada data harga fotocopy</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {fotocopyPrices.length > pageSize && (
                        <div className="mt-6 flex justify-center gap-2">
                            {Array.from({ length: Math.ceil(fotocopyPrices.length / pageSize) }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setFcPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${fcPage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Master Harga Print */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                            <FiPrinter size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Master Harga Jasa Print</h3>
                    </div>
                    <div className="flex w-full sm:w-auto gap-3">
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all text-sm font-semibold" onClick={() => {
                            setPrintPrices([...printPrices, { id: Date.now().toString(), paper: 'HVS A4', color: 'bw', price: 0 }]);
                        }}><FiPlus /> Tambah</button>
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none" onClick={saveSettings}><FiSave /> Simpan</button>
                    </div>
                </div>
                <div className="p-0 sm:p-6">
                    <div className="overflow-auto">
                        <table className="w-full text-left border-collapse md:min-w-[600px]">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Jenis Kertas</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Warna</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Harga (Rp) / Lembar</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {printPrices.slice((printPage - 1) * pageSize, printPage * pageSize).map((p, idx) => {
                                    const realIdx = (printPage - 1) * pageSize + idx;
                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-3">
                                                <input className="w-full max-w-[200px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-medium" value={p.paper} onChange={(e) => {
                                                    const newPrices = [...printPrices];
                                                    newPrices[realIdx] = { ...newPrices[realIdx], paper: e.target.value };
                                                    setPrintPrices(newPrices);
                                                }} />
                                            </td>
                                            <td className="px-6 py-3">
                                                <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-[140px] dark:text-white font-medium" value={p.color} onChange={(e) => {
                                                    const newPrices = [...printPrices];
                                                    newPrices[realIdx] = { ...newPrices[realIdx], color: e.target.value };
                                                    setPrintPrices(newPrices);
                                                }}>
                                                    <option value="bw">Hitam Putih</option>
                                                    <option value="color">Berwarna</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="relative w-full max-w-[120px]">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rp</span>
                                                    <input type="number" className="pl-9 pr-3 py-2 w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold"
                                                        value={p.price}
                                                        onChange={(e) => {
                                                            const newPrices = [...printPrices];
                                                            newPrices[realIdx].price = e.target.value;
                                                            setPrintPrices(newPrices);
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" onClick={async () => {
                                                    const result = await Swal.fire({
                                                        title: 'Hapus Harga Print?',
                                                        text: `Hapus harga Print ${p.paper} ${p.color === 'bw' ? 'B/W' : 'Warna'}?`,
                                                        icon: 'warning',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#ef4444',
                                                        confirmButtonText: 'Ya, Hapus!',
                                                        cancelButtonText: 'Batal'
                                                    });
                                                    if (result.isConfirmed) {
                                                        setPrintPrices(printPrices.filter((_, i) => i !== realIdx));
                                                    }
                                                }}><FiTrash2 /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {printPrices.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-slate-400">Belum ada data harga print</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {printPrices.length > pageSize && (
                        <div className="mt-6 flex justify-center gap-2">
                            {Array.from({ length: Math.ceil(printPrices.length / pageSize) }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPrintPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${printPage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Master Harga Jilid */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
                            <FiBook size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Master Harga Penjilidan</h3>
                    </div>
                    <div className="flex w-full sm:w-auto gap-3">
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all text-sm font-semibold" onClick={() => {
                            setBindPrices([...bindPrices, { id: Date.now().toString(), name: '', price: 0 }]);
                        }}><FiPlus /> Tambah</button>
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none" onClick={saveSettings}><FiSave /> Simpan</button>
                    </div>
                </div>
                <div className="p-0 sm:p-6">
                    <div className="overflow-auto">
                        <table className="w-full text-left border-collapse md:min-w-[400px]">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Jenis Jilid</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Harga (Rp) / Buku</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {bindPrices.slice((bindPage - 1) * pageSize, bindPage * pageSize).map((p, idx) => {
                                    const realIdx = (bindPage - 1) * pageSize + idx;
                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-3">
                                                <input className="w-full max-w-[300px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-medium" value={p.name} onChange={(e) => {
                                                    const newPrices = [...bindPrices];
                                                    newPrices[realIdx] = { ...newPrices[realIdx], name: e.target.value };
                                                    setBindPrices(newPrices);
                                                }} placeholder="Nama jenis jilid" />
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="relative w-full max-w-[150px]">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rp</span>
                                                    <input type="number" className="pl-9 pr-3 py-2 w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold"
                                                        value={p.price}
                                                        onChange={(e) => {
                                                            const newPrices = [...bindPrices];
                                                            newPrices[realIdx].price = e.target.value;
                                                            setBindPrices(newPrices);
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" onClick={async () => {
                                                    const result = await Swal.fire({
                                                        title: 'Hapus Jilid?',
                                                        text: `Hapus jilid "${p.name}"?`,
                                                        icon: 'warning',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#ef4444',
                                                        confirmButtonText: 'Ya, Hapus!',
                                                        cancelButtonText: 'Batal'
                                                    });
                                                    if (result.isConfirmed) {
                                                        setBindPrices(bindPrices.filter((_, i) => i !== realIdx));
                                                    }
                                                }}><FiTrash2 /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {bindPrices.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="py-12 text-center text-slate-400">Belum ada data harga jilid</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {bindPrices.length > pageSize && (
                        <div className="mt-6 flex justify-center gap-2">
                            {Array.from({ length: Math.ceil(bindPrices.length / pageSize) }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setBindPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${bindPage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Aturan Diskon Grosir */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                            <FiTag size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Aturan Diskon Grosir Fotocopy</h3>
                    </div>
                    <div className="flex w-full sm:w-auto gap-3">
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all text-sm font-semibold" onClick={() => {
                            setFcDiscounts([...fcDiscounts, { id: Date.now().toString(), minQty: 0, discountPerSheet: 0 }]);
                        }}><FiPlus /> Tambah</button>
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none" onClick={saveSettings}><FiSave /> Simpan</button>
                    </div>
                </div>
                <div className="p-0 sm:p-6">
                    <div className="overflow-auto">
                        <table className="w-full text-left border-collapse md:min-w-[500px]">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Minimal Jumlah / Lembar (≥)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Potongan Harga (Rp) / Lembar</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {fcDiscounts.map((d, idx) => (
                                    <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-3">
                                            <input type="number" className="w-full max-w-[150px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-medium"
                                                value={d.minQty}
                                                onChange={(e) => {
                                                    const newDiscounts = [...fcDiscounts];
                                                    newDiscounts[idx].minQty = e.target.value;
                                                    setFcDiscounts(newDiscounts);
                                                }}
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="relative w-full max-w-[150px]">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rp</span>
                                                <input type="number" className="pl-9 pr-3 py-2 w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold"
                                                    value={d.discountPerSheet}
                                                    onChange={(e) => {
                                                        const newDiscounts = [...fcDiscounts];
                                                        newDiscounts[idx].discountPerSheet = e.target.value;
                                                        setFcDiscounts(newDiscounts);
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" onClick={() => {
                                                const newDiscounts = fcDiscounts.filter((_, i) => i !== idx);
                                                setFcDiscounts(newDiscounts);
                                            }}><FiTrash2 /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Note Section */}
                    <div className="mx-6 my-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                        <div className="flex gap-3">
                            <FiInfo className="text-blue-500 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">Catatan Diskon</h4>
                                <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-1 leading-relaxed">
                                    Diskon volume akan otomatis memotong harga per-lembar saat <strong>Fotocopy</strong> mencapai target kuantitas di atas.
                                    Pastikan mengurutkannya mulai dari lembar paling tinggi untuk hasil pemotongan diskon yang maksimal.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
