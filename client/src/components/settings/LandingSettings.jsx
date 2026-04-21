import { FiHome, FiBriefcase, FiStar, FiImage, FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import { resizeImage } from '../../utils';

export default function LandingSettings({
    storeName, setStoreName,
    storeAddress, setStoreAddress,
    storePhone, setStorePhone,
    storeMapsUrl, setStoreMapsUrl,
    landingLogo, setLandingLogo,
    landingFavicon, setLandingFavicon,
    galleryImages, handleGalleryUpload,
    removeGalleryImage, saveSettings,
    showToast
}) {
    return (
        <div className="space-y-8 pb-12">
            <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-4xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/80 dark:bg-slate-800/50">
                    <FiHome className="text-blue-600" />
                    <h3 className="font-bold text-slate-800 dark:text-white">Identitas Toko & Kontak</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nama Toko (Header)</label>
                        <input
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            placeholder="Contoh: Abadi Jaya Copier"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">No. WhatsApp Toko</label>
                        <input
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            placeholder="Contoh: 08123456789"
                            value={storePhone}
                            onChange={(e) => setStorePhone(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Alamat Lengkap Toko</label>
                        <textarea
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white h-24 resize-none"
                            placeholder="Masukkan alamat lengkap toko Anda..."
                            value={storeAddress}
                            onChange={(e) => setStoreAddress(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Google Maps URL</label>
                        <input
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            placeholder="Paste link dari Google Maps..."
                            value={storeMapsUrl}
                            onChange={(e) => setStoreMapsUrl(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-4xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/80 dark:bg-slate-800/50">
                        <FiBriefcase className="text-blue-600" />
                        <h3 className="font-bold text-slate-800 dark:text-white">Logo Landing Page</h3>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-32 h-32 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700">
                                {landingLogo ? (
                                    <img src={landingLogo} alt="Landing Logo" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <FiImage className="text-slate-300" size={32} />
                                )}
                            </div>
                            <div className="flex flex-col items-center">
                                <label className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer transition-all text-sm font-bold">
                                    Pilih Logo
                                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        if (file.size > 5 * 1024 * 1024) {
                                            showToast('Ukuran logo maksimal 5 MB!', 'error');
                                            return;
                                        }
                                        const compressed = await resizeImage(file, 400, 400, 0.8);
                                        showToast('Logo landing page diganti!', 'success');
                                        setLandingLogo(compressed);
                                    }} />
                                </label>
                                <p className="text-[10px] text-slate-400 mt-3 uppercase tracking-widest font-bold">Recommended: PNG 512x512</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-4xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/80 dark:bg-slate-800/50">
                        <FiStar className="text-blue-600" />
                        <h3 className="font-bold text-slate-800 dark:text-white">Favicon (Browser Icon)</h3>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700">
                                {landingFavicon ? (
                                    <img src={landingFavicon} alt="Favicon" className="w-full h-full object-contain p-1" />
                                ) : (
                                    <FiImage className="text-slate-300" size={20} />
                                )}
                            </div>
                            <div className="flex flex-col items-center">
                                <label className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer transition-all text-sm font-bold">
                                    Ganti Icon
                                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        if (file.size > 5 * 1024 * 1024) {
                                            showToast('Ukuran icon maksimal 5 MB!', 'error');
                                            return;
                                        }
                                        const compressed = await resizeImage(file, 512, 512, 0.9);
                                        showToast('Favicon diganti!', 'success');
                                        setLandingFavicon(compressed);
                                    }} />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-4xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <FiImage className="text-blue-600" />
                        <h3 className="font-bold text-slate-800 dark:text-white">Galeri Toko & Hasil Kerja</h3>
                    </div>
                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer transition-all text-sm font-semibold">
                        <FiPlus /> Tambah Foto
                        <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                    </label>
                </div>
                <div className="p-6">
                    <p className="text-sm text-slate-500 mb-6">Upload foto interior toko, peralatan, atau hasil cetakan terbaik Anda.</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {galleryImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-3xl bg-slate-100 dark:bg-slate-800 overflow-hidden group border border-slate-200 dark:border-slate-700">
                                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => removeGalleryImage(idx)}
                                        className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                                        title="Hapus Foto"
                                    >
                                        <FiTrash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {galleryImages.length === 0 && (
                            <div className="col-span-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-12 flex flex-col items-center justify-center text-slate-400">
                                <FiImage size={40} className="mb-3 opacity-20" />
                                <p className="text-sm">Belum ada foto galeri.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pb-8">
                <button
                    className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                    onClick={saveSettings}
                >
                    <FiSave /> Simpan Perubahan Landing Page
                </button>
            </div>
        </div>
    );
}
