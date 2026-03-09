import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { FiCheck, FiX } from 'react-icons/fi';

export default function MaterialFormPage({ onNavigate, pageState }) {
    const initial = pageState?.material || null;
    const [form, setForm] = useState({
        nama_bahan: initial?.nama_bahan || '',
        kategori: initial?.kategori || '',
        satuan: initial?.satuan || '',
        stok_saat_ini: initial?.stok_saat_ini || '',
        stok_minimum: initial?.stok_minimum || '',
        lokasi_rak: initial?.lokasi_rak || '',
        harga_modal: initial?.harga_modal || '',
        harga_jual: initial?.harga_jual || '',
        supplier_id: initial?.supplier_id || '',
        barcode: initial?.barcode || 'SKU-' + Date.now().toString().slice(-6),
        autoBarcode: !initial?.barcode,
        margin_persen: ''
    });
    const [saving, setSaving] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const toast = useCallback((msg, type = 'success') => {
        setToastMsg({ msg, type });
        setTimeout(() => setToastMsg(null), 3000);
    }, []);

    useEffect(() => {
        if (form.harga_modal && form.harga_jual) {
            const hpp = parseFloat(form.harga_modal);
            const hj = parseFloat(form.harga_jual);
            if (hpp > 0 && hj > hpp) {
                const margin = ((hj - hpp) / hpp) * 100;
                setForm(f => ({ ...f, margin_persen: margin.toFixed(2).replace(/\.00$/, '') }));
            }
        }
    }, []);

    const handleHargaModalChange = (e) => {
        const val = e.target.value;
        set('harga_modal', val);
        const hpp = parseFloat(val) || 0;
        const mp = parseFloat(form.margin_persen) || 0;
        if (hpp > 0 && mp > 0) {
            set('harga_jual', Math.round(hpp + (hpp * mp / 100)));
        }
    };

    const handleMarginChange = (e) => {
        const val = e.target.value;
        set('margin_persen', val);
        const hpp = parseFloat(form.harga_modal) || 0;
        const mp = parseFloat(val) || 0;
        if (hpp > 0) {
            set('harga_jual', Math.round(hpp + (hpp * mp / 100)));
        }
    };

    const handleHargaJualChange = (e) => {
        const val = e.target.value;
        set('harga_jual', val);
        const hpp = parseFloat(form.harga_modal) || 0;
        const hj = parseFloat(val) || 0;
        if (hpp > 0 && hj >= hpp) {
            const margin = ((hj - hpp) / hpp) * 100;
            set('margin_persen', margin.toFixed(2).replace(/\.00$/, ''));
        } else if (hj < hpp) {
            set('margin_persen', 0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nama_bahan.trim()) return toast('Nama bahan wajib diisi', 'warn');
        setSaving(true);
        try {
            const payload = {
                ...form,
                harga_modal: form.harga_modal || 0,
                harga_jual: form.harga_jual || 0,
                stok_saat_ini: form.stok_saat_ini || 0,
                stok_minimum: form.stok_minimum || 0,
                is_active: 1
            };
            if (initial) {
                await api.put(`/materials/${initial.id}`, payload);
                toast(<>Bahan berhasil diperbarui <FiCheck /></>);
            } else {
                await api.post('/materials', payload);
                toast(<>Bahan baru berhasil ditambahkan <FiCheck /></>);
            }
            setTimeout(() => onNavigate('stok-bahan'), 1000);
        } catch (err) {
            toast(err.response?.data?.message || 'Gagal menyimpan data', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            {/* Toast Notification */}
            {toastMsg && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                    background: toastMsg.type === 'error' ? '#ef4444' : toastMsg.type === 'warn' ? '#f59e0b' : '#22c55e', color: '#fff', padding: '12px 20px',
                    borderRadius: 12, fontWeight: 600, fontSize: '.85rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,.18)', maxWidth: 320,
                    animation: 'fadeIn .25s ease'
                }}>{toastMsg.msg}</div>
            )}

            {/* Breadcrumb Header */}
            <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-8 shrink-0">
                <div className="flex items-center gap-2 text-sm">
                    <button onClick={() => onNavigate('stok-bahan')} className="text-slate-400 hover:text-primary cursor-pointer transition-colors">Stok Bahan</button>
                    <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                        {initial ? 'Edit Bahan' : 'Tambah Bahan Baru'}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-5xl mx-auto">
                    <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {initial ? 'Edit Data Bahan' : 'Formulir Tambah Bahan Baru'}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Lengkapi detail identitas, stok, dan harga bahan untuk inventaris.</p>
                        </div>
                        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-sm cursor-pointer">
                            <span className="material-symbols-outlined text-lg">print</span>
                            Cetak Label Barcode
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section 1: Identitas Bahan */}
                        <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 text-primary">
                                <span className="material-symbols-outlined">badge</span>
                                <h3 className="font-bold text-slate-900 dark:text-white">Identitas Bahan</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Bahan *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.nama_bahan}
                                        onChange={e => set('nama_bahan', e.target.value)}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white"
                                        placeholder="Contoh: Art Paper 260gr"
                                    />
                                </div>

                                {/* Barcode generator section */}
                                <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Generate Barcode Otomatis</span>
                                            <div className="relative inline-block w-10 mr-2 align-middle select-none transition-all">
                                                <input
                                                    type="checkbox"
                                                    id="toggle"
                                                    checked={form.autoBarcode}
                                                    onChange={() => set('autoBarcode', !form.autoBarcode)}
                                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer duration-300 ease-in-out right-4 checked:right-0 checked:border-primary"
                                                    style={{ border: form.autoBarcode ? '4px solid #137fec' : '4px solid #cbd5e1' }}
                                                />
                                                <label
                                                    htmlFor="toggle"
                                                    className="toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ease-in-out"
                                                    style={{ backgroundColor: form.autoBarcode ? 'rgba(19, 127, 236, 0.2)' : '#e2e8f0' }}
                                                ></label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kode SKU / Barcode</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    readOnly={form.autoBarcode}
                                                    value={form.barcode}
                                                    onChange={e => set('barcode', e.target.value)}
                                                    className={`w-full rounded-lg border-slate-300 dark:border-slate-700 focus:border-primary focus:ring-primary dark:text-white ${form.autoBarcode ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-white dark:bg-slate-800'}`}
                                                    placeholder="SKU-2023-001"
                                                />
                                                {form.autoBarcode && (
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">lock</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-1">Nonaktifkan switch untuk input manual.</p>
                                        </div>
                                    </div>

                                    {/* Barcode Preview - Decorative only as per original HTML */}
                                    <div className="md:col-span-2 flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Pratinjau Barcode</p>
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-48 h-12 flex gap-0.5 items-end">
                                                {Array.from({ length: 23 }).map((_, i) => (
                                                    <div key={i} className={`h-full ${i % 2 === 0 ? 'bg-slate-800 dark:bg-slate-200' : 'bg-transparent'} ${[0, 3, 6, 9, 11, 14, 18].includes(i) ? 'w-1' : [1, 5, 8, 12].includes(i) ? 'w-0.5' : [2, 10].includes(i) ? 'w-1.5' : 'w-2'}`}></div>
                                                ))}
                                            </div>
                                            <span className="text-xs font-mono font-bold tracking-[0.2em] text-slate-800 dark:text-slate-300">{form.barcode || 'SKU-000000'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                                    <input
                                        type="text"
                                        list="list-kategori"
                                        value={form.kategori}
                                        onChange={e => set('kategori', e.target.value)}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white"
                                        placeholder="Pilih atau ketik kategori baru"
                                    />
                                    <datalist id="list-kategori">
                                        <option value="digital">Digital Printing</option>
                                        <option value="offset">Offset Printing</option>
                                        <option value="atk">Alat Tulis Kantor (ATK)</option>
                                        <option value="finishing">Finishing</option>
                                    </datalist>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Satuan</label>
                                    <input
                                        type="text"
                                        list="list-satuan"
                                        value={form.satuan}
                                        onChange={e => set('satuan', e.target.value)}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white"
                                        placeholder="Pilih atau ketik satuan baru"
                                    />
                                    <datalist id="list-satuan">
                                        <option value="lembar">Lembar</option>
                                        <option value="roll">Roll</option>
                                        <option value="m2">Meter Persegi (m2)</option>
                                        <option value="pcs">Pcs / Buah</option>
                                        <option value="box">Box</option>
                                    </datalist>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Pengaturan Stok */}
                        <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 text-primary">
                                <span className="material-symbols-outlined">inventory</span>
                                <h3 className="font-bold text-slate-900 dark:text-white">Pengaturan Stok & Lokasi</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stok Awal</label>
                                    <input
                                        type="number"
                                        value={form.stok_saat_ini}
                                        onChange={e => set('stok_saat_ini', e.target.value)}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stok Minimum</label>
                                    <input
                                        type="number"
                                        value={form.stok_minimum}
                                        onChange={e => set('stok_minimum', e.target.value)}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white"
                                        placeholder="5"
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">Peringatan otomatis saat stok di bawah angka ini.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lokasi Rak</label>
                                    <input
                                        type="text"
                                        value={form.lokasi_rak}
                                        onChange={e => set('lokasi_rak', e.target.value)}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white"
                                        placeholder="Misal: Rak A-12"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Informasi Harga */}
                        <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 text-primary">
                                <span className="material-symbols-outlined">payments</span>
                                <h3 className="font-bold text-slate-900 dark:text-white">Informasi Harga & Supplier</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Harga Beli / Modal Terakhir (Rp)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                                        <input
                                            type="number"
                                            value={form.harga_modal}
                                            onChange={handleHargaModalChange}
                                            className="w-full pl-10 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Margin / Keuntungan (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.margin_persen}
                                            onChange={handleMarginChange}
                                            className="w-full pr-10 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white"
                                            placeholder="Opsional (cth: 50)"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Harga Jual Retail (Rp)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                                        <input
                                            type="number"
                                            value={form.harga_jual}
                                            onChange={handleHargaJualChange}
                                            className="w-full pl-10 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Pemasok (Supplier)</label>
                                    <select
                                        value={form.supplier_id}
                                        onChange={e => set('supplier_id', e.target.value)}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white"
                                    >
                                        <option value="">Pilih Pemasok</option>
                                        <option value="1">PT. Kertas Jaya Mandiri</option>
                                        <option value="2">CV. Grafika Utama</option>
                                        <option value="3">Supplier Tinta Berkah</option>
                                        <option value="NEW">+ Tambah Pemasok Baru</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Foto */}
                        <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 text-primary">
                                <span className="material-symbols-outlined">image</span>
                                <h3 className="font-bold text-slate-900 dark:text-white">Foto Produk / Bahan</h3>
                            </div>

                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <span className="material-symbols-outlined text-slate-400 text-4xl mb-2">cloud_upload</span>
                                        <p className="mb-2 text-sm text-slate-500"><span className="font-semibold text-slate-700 dark:text-slate-300">Klik untuk unggah</span> atau seret file</p>
                                        <p className="text-xs text-slate-400">PNG, JPG atau WEBP (Maks. 2MB)</p>
                                    </div>
                                    <input type="file" className="hidden" />
                                </label>
                            </div>
                        </section>

                        {/* Button Actions */}
                        <div className="flex items-center justify-end gap-4 pb-12 border-t border-slate-200 dark:border-slate-800 pt-8">
                            <button
                                type="button"
                                onClick={() => onNavigate('stok-bahan')}
                                className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-8 py-2.5 rounded-lg bg-primary text-white font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">save</span>
                                        Simpan Bahan
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
