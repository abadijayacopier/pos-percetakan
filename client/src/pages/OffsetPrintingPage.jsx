import { useState } from 'react';

export default function OffsetPrintingPage() {
    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">

            {/* Sidebar Kiri - Timer */}
            <div className="w-full lg:w-64 flex flex-col gap-6 shrink-0">
                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Design Timer</span>
                        <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-100 mb-4">01:24:45</div>
                    <p className="text-[10px] text-slate-500 mb-4">Kalkulasi biaya jasa desain berdasarkan durasi pengerjaan (jam).</p>
                    <button className="w-full py-2 px-4 bg-primary/10 text-primary text-sm font-bold rounded-lg hover:bg-primary/20 transition-colors">
                        Mulai Desain Baru
                    </button>
                </div>
            </div>

            {/* Area Utama - Konten */}
            <div className="flex-1 flex flex-col gap-6 w-full">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Katalog Cetak Offset & Nota</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Pilih kategori produk untuk mengatur spesifikasi detail dan estimasi biaya.</p>
                    </div>
                    <button className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
                        <span className="material-symbols-outlined text-sm">add</span>
                        Produk Baru
                    </button>
                </div>

                {/* Product Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Product 1 */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="aspect-video w-full bg-slate-100 relative bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDMgfwrAIlaZdWLSpxLs9NyOgCz4zf-IrZfN1Yvi6f99yJDo8mweygmRfa8--3yCIFRnzdJOHW5P35Bn1KRYdFyw2jrICLdBUcLX_id_Cu-v9AiR1vHCQIxxU_MEVei0-q3uGOdyIACm5rrJbhQ11ipOjRxxVqO3Y191zCpd5MvqjML5UJ8FfOwumGyXWmxl8lDbDJfBUcHTHvqWJl49HURQxCk2_HW6AoIl53UUZihtX460BjMsQm7YJ3JUK_8c0JUYlQ5joEuXNkm")' }}>
                            <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-white text-[10px] font-bold rounded">BEST SELLER</div>
                        </div>
                        <div className="p-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cetak Nota</h3>
                            <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="material-symbols-outlined text-sm">layers</span>
                                    <span>Rangkap/NCR (2-4 Ply)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="material-symbols-outlined text-sm">straighten</span>
                                    <span>Ukuran Custom (A4, A5, 1/3 A4)</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                                <span className="text-primary font-bold">Rp 25rb<span className="text-[10px] text-slate-400 font-normal">/buku</span></span>
                                <button className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">arrow_forward</span></button>
                            </div>
                        </div>
                    </div>

                    {/* Product 2 */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="aspect-video w-full bg-slate-100 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC88_KSMhfq64ZwkjLY5HAW67tEkFW_dIils_LyOVc1i63-fsgJRBdd5qKlsLrAlEfegPwhuJ1oDxyssFWP5EySttyv87-Dawc1LQsPq-kkRnnoDm9kLzhtpJLARpmOKpC3GgtcHseuJOtg-kxmM9k6mnJvwXQufMhK0l3I2MleslqsHz0mxCDQmoN_Vy_hGnQU7KyL860s2Yw2psIYLx-UcCDBTK2Z8P51CnS_qr8QOtYsLjG53fAinwSXn2t2_QW0YAQaJzN_fLhh")' }}></div>
                        <div className="p-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cetak Buku</h3>
                            <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="material-symbols-outlined text-sm">menu_book</span>
                                    <span>Hard/Soft Cover Laminating</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="material-symbols-outlined text-sm">format_list_numbered</span>
                                    <span>Jumlah Min. 50 Eks</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                                <span className="text-primary font-bold">Rp 50rb<span className="text-[10px] text-slate-400 font-normal">/eks</span></span>
                                <button className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">arrow_forward</span></button>
                            </div>
                        </div>
                    </div>

                    {/* Product 3 */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="aspect-video w-full bg-slate-100 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBRJwnskgoQH46Z4pe1L6VmqNqeUagAqiw3j8jz9Giy0mGRXzf8jzPwwu-c4ExI_Vx5Vp4z40mGfXM-ENY_Bcx2Pa94Z6fxILhbbTrhKqePFvLb94CZ1Q1uuLSDFP8kCsSUT80xKB1HWmC2F-8ySK6w18LQfcxi5xBV7fLIImyBL0a1jfnOUZCqmr0aTE8nXxcKV-jCUmmojg2PRHIAiBFWuy6aEMib_x3XAfAqDsXRvHcOtUw035y11tzGIuTKUGQ5sohTNVOoUWdL")' }}></div>
                        <div className="p-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cetak Kalender</h3>
                            <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                                    <span>Kalender Dinding & Meja</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="material-symbols-outlined text-sm">history_edu</span>
                                    <span>Art Paper / Ivory</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                                <span className="text-primary font-bold">Rp 15rb<span className="text-[10px] text-slate-400 font-normal">/pcs</span></span>
                                <button className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">arrow_forward</span></button>
                            </div>
                        </div>
                    </div>

                    {/* Product 4 */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="aspect-video w-full bg-slate-100 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBQyDjbqIXur-BC0kO_x7BRI5_GfkG3SLB4FqMOu90jY-78DaYIeT0YPs-MJkuKx0d0Q9S5iPzks3VI15sZDMUdc4bHSu-05zmONLTX6oqVEW2PRSe2-RD3Mc3dwXSJIjhpi0d4SJ4v_LBU31BOwr5OaH8B6SsXoGkjrCaJwKqaHutzrAmUu7Nd33LgDHKwqt_y5clYC7qsavpw7S54Dt7yGslweDh6xaEq2jsHUW_x_JIP21zFn0Wu0Ey_h5PGLxKa83mEloOkwTXE")' }}></div>
                        <div className="p-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kartu Nama</h3>
                            <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="material-symbols-outlined text-sm">credit_card</span>
                                    <span>Standar & Premium (UV)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="material-symbols-outlined text-sm">sell</span>
                                    <span>Min. Order 1 Box</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                                <span className="text-primary font-bold">Rp 35rb<span className="text-[10px] text-slate-400 font-normal">/box</span></span>
                                <button className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">arrow_forward</span></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Specification Section */}
                <div className="mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-primary/10 text-primary rounded-xl">
                            <span className="material-symbols-outlined text-3xl">calculate</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Estimasi Biaya Produksi</h2>
                            <p className="text-slate-500 dark:text-slate-400">Sesuaikan variabel untuk mendapatkan kalkulasi harga instan.</p>
                        </div>
                    </div>

                    <form className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Jenis Produk</span>
                                <select className="form-input w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white">
                                    <option>Nota NCR</option>
                                    <option>Buku Hardcover</option>
                                    <option>Kalender Dinding</option>
                                    <option>Kartu Nama</option>
                                </select>
                            </label>

                            <label className="block">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Ukuran</span>
                                <select className="form-input w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white">
                                    <option>A4 (21 x 29.7 cm)</option>
                                    <option>A5 (14.8 x 21 cm)</option>
                                    <option>1/3 A4 (10 x 21 cm)</option>
                                    <option>Custom Size</option>
                                </select>
                            </label>
                        </div>

                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Rangkap (NCR) / Halaman</span>
                                <div className="flex gap-2">
                                    <button type="button" className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-lg cursor-pointer">2 Ply</button>
                                    <button type="button" className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">3 Ply</button>
                                    <button type="button" className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">4 Ply</button>
                                </div>
                            </label>

                            <label className="block">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Jumlah Pesanan</span>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        defaultValue="40"
                                        className="form-input w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white"
                                    />
                                    <span className="ml-3 text-sm text-slate-500 font-medium">Buku</span>
                                </div>
                            </label>
                        </div>

                        <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-2xl flex flex-col justify-between border border-primary/20">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-primary/70">Total Estimasi</span>
                                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">Rp 1.000.000</div>
                                <div className="mt-1 text-xs text-slate-500 font-medium">+ Biaya Desain (Berdasarkan Timer)</div>
                            </div>
                            <button type="button" className="w-full mt-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                <span className="material-symbols-outlined">shopping_cart</span>
                                Buat Order Sekarang
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
