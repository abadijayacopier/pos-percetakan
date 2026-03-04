import { useState } from 'react';

export default function PricingRulesPage() {
    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 w-full">
            {/* Area Utama - Form Pengaturan Harga */}
            <section className="flex-1 flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">Pengaturan Harga Berjenjang</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal mt-1">Atur harga otomatis berdasarkan jumlah pesanan pelanggan.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center justify-center rounded-lg h-10 px-6 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                            Batal
                        </button>
                        <button className="flex items-center justify-center rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
                            Simpan Perubahan
                        </button>
                    </div>
                </div>

                {/* Step 1: Pilih Produk */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                        <span className="flex items-center justify-center size-6 bg-primary text-white text-xs rounded-full">1</span>
                        Pilih Kategori & Produk
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Kategori</label>
                            <select className="form-input w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-12 focus:border-primary focus:ring-1 focus:ring-primary">
                                <option>Digital Printing</option>
                                <option>Offset Printing</option>
                                <option>ATK (Alat Tulis Kantor)</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Produk Spesifik</label>
                            <select className="form-input w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-12 focus:border-primary focus:ring-1 focus:ring-primary">
                                <option>Buku Nota A5 NCR 2 Play</option>
                                <option>Kartu Nama Premium 260gr</option>
                                <option>Banner Outdoor (m2)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Step 2: Tabel Harga */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <span className="flex items-center justify-center size-6 bg-primary text-white text-xs rounded-full">2</span>
                            Tabel Aturan Harga
                        </h2>
                        <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                            <span className="material-symbols-outlined text-lg">add_circle</span>
                            Tambah Tingkatan
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Min. Kuantitas</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Maks. Kuantitas</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Harga Per Unit</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Diskon (%)</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <tr>
                                    <td className="px-6 py-4">
                                        <input type="number" defaultValue="1" className="w-24 form-input bg-transparent border-slate-200 dark:border-slate-700 rounded focus:ring-primary focus:border-primary text-sm text-slate-900 dark:text-white" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input type="number" defaultValue="10" className="w-24 form-input bg-transparent border-slate-200 dark:border-slate-700 rounded focus:ring-primary focus:border-primary text-sm text-slate-900 dark:text-white" />
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Rp 25.000</td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-400 text-sm italic">Harga Normal</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-slate-300 dark:text-slate-600 cursor-not-allowed"><span className="material-symbols-outlined">delete</span></button>
                                    </td>
                                </tr>
                                <tr className="bg-primary/5 dark:bg-primary/10">
                                    <td className="px-6 py-4">
                                        <input type="number" defaultValue="11" className="w-24 form-input bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-primary focus:border-primary text-sm text-slate-900 dark:text-white" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input type="number" defaultValue="50" className="w-24 form-input bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-primary focus:border-primary text-sm text-slate-900 dark:text-white" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 line-through">Rp 25k</span>
                                            <span className="font-bold text-primary">Rp 22.500</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-emerald-600 font-bold">
                                            <input type="number" defaultValue="10" className="w-16 form-input bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-primary focus:border-primary text-sm text-emerald-600" />
                                            <span>%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-slate-500 hover:text-red-500 transition-colors"><span className="material-symbols-outlined">delete</span></button>
                                    </td>
                                </tr>
                                <tr className="bg-primary/10 dark:bg-primary/20">
                                    <td className="px-6 py-4">
                                        <input type="number" defaultValue="51" className="w-24 form-input bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-primary focus:border-primary text-sm text-slate-900 dark:text-white" />
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                                        Tak Terhingga
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 line-through">Rp 25k</span>
                                            <span className="font-bold text-primary">Rp 18.750</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-emerald-600 font-bold">
                                            <input type="number" defaultValue="25" className="w-16 form-input bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-primary focus:border-primary text-sm text-emerald-600" />
                                            <span>%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-slate-500 hover:text-red-500 transition-colors"><span className="material-symbols-outlined">delete</span></button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Step 3: Simulasi */}
                <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <span className="material-symbols-outlined text-[120px]">calculate</span>
                    </div>
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="flex items-center justify-center size-6 bg-white text-slate-900 text-xs rounded-full">3</span>
                        Pratinjau Kalkulasi (Simulasi)
                    </h2>
                    <div className="flex flex-col md:flex-row items-end gap-6 relative z-10">
                        <div className="flex flex-col gap-2 flex-1">
                            <label className="text-sm font-medium text-slate-400">Masukkan Jumlah Pesanan</label>
                            <div className="relative">
                                <input type="number" defaultValue="55" className="form-input w-full bg-slate-800 border-none rounded-lg h-14 pl-4 pr-12 text-xl font-bold focus:ring-1 focus:ring-primary text-white" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">Unit</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 py-4 px-6 bg-white/5 rounded-lg border border-white/10 flex-1">
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">Tier Berlaku</span>
                                <span className="text-lg font-bold text-primary">Grosir 25% OFF</span>
                            </div>
                            <div className="h-10 w-px bg-white/10"></div>
                            <div className="flex flex-col flex-1 text-right">
                                <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">Total Estimasi</span>
                                <span className="text-2xl font-black text-white">Rp 1.031.250</span>
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-slate-500 relative z-10">* Simulasi ini dihitung berdasarkan unit price tier yang dipilih (Rp 18.750 x 55 unit).</p>
                </div>
            </section>
        </div>
    );
}
