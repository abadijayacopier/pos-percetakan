import React, { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatDateTime, printViaBluetooth } from '../utils';
import Modal from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSettings, FiFile, FiUsers, FiPrinter, FiEdit, FiTrash2, FiPlus, FiSave, FiPackage, FiCpu, FiDollarSign, FiFileText, FiSearch, FiClock, FiCheckCircle, FiAlertCircle, FiX, FiDownload, FiUpload, FiRefreshCw, FiCheck, FiTruck, FiCalendar, FiMessageCircle, FiHome, FiBriefcase, FiStar, FiBox, FiActivity, FiLayers, FiList, FiChevronRight, FiChevronDown, FiEye, FiBook, FiTag, FiInfo, FiFolder, FiZap, FiSun, FiMoon, FiMonitor, FiImage } from 'react-icons/fi';

export default function SettingsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const themeCtx = useTheme();

    // Core states
    const [activeTab, setActiveTab] = useState('general');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [loading, setLoading] = useState(true);

    // Data States
    const [fotocopyPrices, setFotocopyPrices] = useState([]);
    const [users, setUsers] = useState([]);
    const [printPrices, setPrintPrices] = useState([]);
    const [bindPrices, setBindPrices] = useState([]);
    const [systemPrinters, setSystemPrinters] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);

    const [fcDiscounts, setFcDiscounts] = useState([]);

    // Branding & Terminal States
    const [storeName, setStoreName] = useState('');
    const [storeAddress, setStoreAddress] = useState('');
    const [storePhone, setStorePhone] = useState('');
    const [storeMapsUrl, setStoreMapsUrl] = useState('');
    const [storeLogo, setStoreLogo] = useState('');
    const [landingLogo, setLandingLogo] = useState('');
    const [landingFavicon, setLandingFavicon] = useState('');
    const [receiptFooter, setReceiptFooter] = useState('');
    const [printerSize, setPrinterSize] = useState('80mm');
    const [printerName, setPrinterName] = useState('');
    const [paperSize, setPaperSize] = useState('A4');
    const [autoPrint, setAutoPrint] = useState(true);

    // Payment & QRIS States
    const [midtransKey, setMidtransKey] = useState('');
    const [midtransIsProduction, setMidtransIsProduction] = useState(false);
    const [danaNumber, setDanaNumber] = useState('');
    const [danaName, setDanaName] = useState('');
    const [bankName, setBankName] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [bankAccountName, setBankAccountName] = useState('');

    // UI/Form States
    const [userFormOpen, setUserFormOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [userForm, setUserForm] = useState({ name: '', username: '', password: '', role: 'kasir', isActive: true });

    // Price Pagination States
    const [fcPage, setFcPage] = useState(1);
    const [printPage, setPrintPage] = useState(1);
    const [bindPage, setBindPage] = useState(1);
    const pageSize = 10;

    const [logPage, setLogPage] = useState(1);
    const [logPageSize] = useState(15);
    const [allLogs, setAllLogs] = useState([]);
    const activityLog = useMemo(() => {
        const start = (logPage - 1) * logPageSize;
        return allLogs.slice(start, start + logPageSize);
    }, [allLogs, logPage, logPageSize]);
    const totalLogPages = Math.ceil(allLogs.length / logPageSize);

    // Effects
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const [settingsRes, usersRes, logsRes, fcRes, printRes] = await Promise.all([
                api.get('/settings').catch(() => ({ data: [] })),
                api.get('/users').catch(() => ({ data: [] })),
                api.get('/settings/logs').catch(() => ({ data: [] })),
                api.get('/transactions/fotocopy-prices').catch(() => ({ data: [] })),
                api.get('/print/printers').catch(() => ({ data: [] }))
            ]);

            const sMap = {};
            settingsRes.data.forEach(s => { sMap[s.key] = s.value; });

            setFotocopyPrices(fcRes.data || []);
            setSystemPrinters(printRes.data || []);
            setUsers(usersRes.data || []);
            setAllLogs(logsRes.data || []);

            try { setGalleryImages(sMap.landing_gallery ? JSON.parse(sMap.landing_gallery) : []); } catch { setGalleryImages([]); }
            try {
                const defFc = [{ id: '1', minQty: 100, discountPerSheet: 50 }, { id: '2', minQty: 500, discountPerSheet: 75 }];
                setFcDiscounts(sMap.fc_discounts ? JSON.parse(sMap.fc_discounts) : defFc);
            } catch { setFcDiscounts([]); }
            try { setPrintPrices(sMap.print_prices ? JSON.parse(sMap.print_prices) : []); } catch { setPrintPrices([]); }
            try { setBindPrices(sMap.binding_prices ? JSON.parse(sMap.binding_prices) : []); } catch { setBindPrices([]); }

            setStoreName(sMap.store_name || 'FOTOCOPY ABADI JAYA');
            setStoreAddress(sMap.store_address || 'Dsn. Selungguh Rt 06 Desa Kediren Kec. Lembeyan, Kab. Magetan');
            setStorePhone(sMap.store_phone || '085655620979');
            setStoreMapsUrl(sMap.store_maps_url || 'https://maps.app.goo.gl/DD3kUGfTmqaZ9iDd7');
            setStoreLogo(sMap.store_logo || '');
            setLandingLogo(sMap.landing_logo || '');
            setLandingFavicon(sMap.landing_favicon || '');
            setReceiptFooter(sMap.receipt_footer || '');

            setPrinterSize(sMap.printer_size || '80mm');
            setPrinterName(sMap.printer_name || '');
            setPaperSize(sMap.paper_size || 'A4');
            setAutoPrint(sMap.auto_print === 'true' || sMap.auto_print === true);

            setMidtransKey(sMap.midtrans_key || '');
            setMidtransIsProduction(sMap.midtrans_is_production === 'true' || sMap.midtrans_is_production === true);
            setDanaNumber(sMap.dana_number || '085655620979');
            setDanaName(sMap.dana_name || 'SUPRIYANTO');
            setBankName(sMap.bank_name || 'BANK BCA');
            setBankAccount(sMap.bank_account || '');
            setBankAccountName(sMap.bank_account_name || 'SUPRIYANTO');

        } catch (error) {
            console.error(error);
            showToast('Gagal memuat data dari server', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    // Functions
    const refreshUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch { }
    };

    const updateFotocopyPrice = async (id, newPrice) => {
        try {
            await api.put(`/transactions/fotocopy-prices/${id}`, { price: parseInt(newPrice) });
            showToast('Harga berhasil diupdate!', 'success');
            const res = await api.get('/transactions/fotocopy-prices');
            setFotocopyPrices(res.data);
        } catch { showToast('Gagal update harga', 'error'); }
    };

    const saveAllFotocopyPrices = async () => {
        try {
            for (const p of fotocopyPrices) {
                await api.put(`/transactions/fotocopy-prices/${p.id}`, { price: parseInt(p.price), paper: p.paper, color: p.color, side: p.side });
            }
            showToast('Semua harga fotocopy berhasil disimpan!', 'success');
            const res = await api.get('/transactions/fotocopy-prices');
            setFotocopyPrices(res.data);
        } catch { showToast('Gagal menyimpan harga fotocopy', 'error'); }
    };

    const saveSettings = async () => {
        try {
            const payload = [
                { key: 'store_name', value: storeName },
                { key: 'store_address', value: storeAddress },
                { key: 'store_phone', value: storePhone },
                { key: 'store_maps_url', value: storeMapsUrl },
                { key: 'store_logo', value: storeLogo },
                { key: 'landing_logo', value: landingLogo },
                { key: 'landing_favicon', value: landingFavicon },
                { key: 'receipt_footer', value: receiptFooter },
                { key: 'printer_size', value: printerSize },
                { key: 'printer_name', value: printerName },
                { key: 'paper_size', value: paperSize },
                { key: 'auto_print', value: autoPrint ? 'true' : 'false' },
                { key: 'landing_gallery', value: JSON.stringify(galleryImages) },
                { key: 'fc_discounts', value: JSON.stringify(fcDiscounts) },
                { key: 'midtrans_key', value: midtransKey },
                { key: 'midtrans_is_production', value: midtransIsProduction ? 'true' : 'false' },
                { key: 'dana_number', value: danaNumber },
                { key: 'dana_name', value: danaName },
                { key: 'bank_name', value: bankName },
                { key: 'bank_account', value: bankAccount },
                { key: 'bank_account_name', value: bankAccountName },
                { key: 'print_prices', value: JSON.stringify(printPrices) },
                { key: 'binding_prices', value: JSON.stringify(bindPrices) }
            ];
            await api.post('/settings', payload);
            showToast('Pengaturan berhasil disimpan!', 'success');
            loadSettings();
        } catch (error) {
            console.error(error);
            showToast('Gagal menyimpan pengaturan', 'error');
        }
    };

    const resizeImage = (file, maxWidth, maxHeight, quality = 0.7) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/webp', quality));
                };
            };
        });
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast('Ukuran gambar maksimal 5 MB!', 'error');
            return;
        }
        const compressed = await resizeImage(file, 400, 400, 0.8);
        setStoreLogo(compressed);
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        let hasError = false;
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                hasError = true;
                continue;
            }
            const compressed = await resizeImage(file, 800, 800, 0.6);
            setGalleryImages(prev => [...prev, compressed]);
        }

        if (hasError) {
            showToast('Beberapa gambar tidak diproses karena max 5 MB!', 'error');
        } else {
            showToast(`${files.length} Gambar berhasil ditambahkan ke Galeri!`, 'success');
        }
    };

    const removeGalleryImage = (index) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveUser = async () => {
        if (!userForm.name || !userForm.username || (!editUser && !userForm.password)) {
            showToast('Lengkapi data user!', 'warning'); return;
        }
        try {
            if (editUser) {
                const updates = { ...userForm };
                if (!updates.password) delete updates.password;
                await api.put(`/users/${editUser.id}`, updates);
            } else {
                await api.post('/users', userForm);
            }
            refreshUsers();
            setUserFormOpen(false);
            showToast(editUser ? 'User diupdate!' : 'User baru ditambahkan!', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal menyimpan user', 'error');
        }
    };

    const handleBackup = () => {
        showToast('Fitur backup manual via endpoint dinonaktifkan di mode MySQL', 'warning');
    };

    const handleRestore = (e) => {
        showToast('Fitur restore manual via endpoint dinonaktifkan', 'warning');
    };

    const resetData = () => {
        if (confirm('PERINGATAN: Fitur reset manual via endpoint dinonaktifkan di mode MySQL. Hubungi administrator database.')) {
            showToast('Proses dibatalkan', 'info');
        }
    };

    const TABS = [
        { id: 'general', icon: <FiSettings />, text: 'Umum' },
        { id: 'fotocopy', icon: <FiFile />, text: 'Harga Layanan' },
        { id: 'landing', icon: <FiImage />, text: 'Landing Page' },
        { id: 'users', icon: <FiUsers />, text: 'Users' },
        { id: 'printer', icon: <FiPrinter />, text: 'Printer & Nota' },
        { id: 'log', icon: <FiEdit />, text: 'Log Aktivitas' },
        { id: 'payment', icon: <FiDollarSign />, text: 'Pembayaran & QRIS' },
        { id: 'backup', icon: <FiSave />, text: 'Backup & Restore' },
    ];

    return (
        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100 font-display transition-colors pb-10">
            {/* Header */}
            <header className="px-6 py-6 md:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
                        <FiSettings size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Pengaturan Sistem</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Kelola harga layanan, identitas toko, dan perangkat keras</p>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">

                {/* Navigation Tabs */}
                <div className="mb-8 overflow-auto no-scrollbar pb-2">
                    <div className="flex gap-2 min-w-max p-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl w-fit">
                        {TABS.map(t => {
                            const isActive = activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    className={`relative flex items-center gap-2 px-5 py-3 transition-all rounded-xl font-medium z-10 ${isActive
                                        ? 'text-blue-700 dark:text-blue-300'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                    onClick={() => {
                                        setActiveTab(t.id);
                                        if (t.id === 'log') setLogPage(1);
                                    }}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="settings-tab-bubble"
                                            className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600/50"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-20 text-lg">{t.icon}</span>
                                    <span className="relative z-20 whitespace-nowrap">{t.text}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* General (Theme) */}
                        {activeTab === 'general' && (
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

                                <button
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                                    onClick={saveSettings}
                                >
                                    <FiSave /> Simpan Pengaturan
                                </button>
                            </div>
                        )}

                        {/* Landing Page Settings */}
                        {activeTab === 'landing' && (
                            <div className="space-y-6">
                                <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-4xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/80 dark:bg-slate-800/50">
                                        <FiSettings className="text-blue-600" />
                                        <h3 className="font-bold text-slate-800 dark:text-white">Identitas & Lokasi Toko</h3>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nama Toko</label>
                                                <input className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" value={storeName} onChange={e => setStoreName(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Alamat Lengkap</label>
                                                <textarea className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white min-h-[100px]" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">WhatsApp (No. Telepon)</label>
                                                <input className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" value={storePhone} onChange={e => setStorePhone(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Link Google Maps (URL)</label>
                                                <input className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" value={storeMapsUrl} onChange={e => setStoreMapsUrl(e.target.value)} placeholder="https://maps.app.goo.gl/..." />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Logo Landing Page</label>
                                                <div className="relative group aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center p-4 transition-all hover:border-blue-400 cursor-pointer overflow-hidden">
                                                    {landingLogo ? (
                                                        <img src={landingLogo} alt="Landing Logo" className="max-h-full object-contain" />
                                                    ) : (
                                                        <div className="text-center">
                                                            <FiPlus className="mx-auto text-slate-400 mb-2" size={24} />
                                                            <span className="text-xs text-slate-500">Upload Logo</span>
                                                        </div>
                                                    )}
                                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        if (file.size > 5 * 1024 * 1024) {
                                                            showToast('Ukuran logo maksimal 5 MB!', 'error');
                                                            return;
                                                        }
                                                        const compressed = await resizeImage(file, 400, 400, 0.8);
                                                        showToast('Logo Landing Page diganti!', 'success');
                                                        setLandingLogo(compressed);
                                                    }} />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Favicon</label>
                                                <div className="relative group aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center p-4 transition-all hover:border-blue-400 cursor-pointer overflow-hidden">
                                                    {landingFavicon ? (
                                                        <img src={landingFavicon} alt="Favicon" className="w-12 h-12 object-contain" />
                                                    ) : (
                                                        <div className="text-center">
                                                            <FiPlus className="mx-auto text-slate-400 mb-2" size={24} />
                                                            <span className="text-xs text-slate-500">Upload Icon</span>
                                                        </div>
                                                    )}
                                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        if (file.size > 5 * 1024 * 1024) {
                                                            showToast('Ukuran icon maksimal 5 MB!', 'error');
                                                            return;
                                                        }
                                                        const compressed = await resizeImage(file, 128, 128, 0.8);
                                                        showToast('Favicon diganti!', 'success');
                                                        setLandingFavicon(compressed);
                                                    }} />
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
                        )}

                        {/* Fotocopy Prices */}
                        {activeTab === 'fotocopy' && (
                            <div className="space-y-8 pb-12">
                                {/* Master Harga Fotocopy */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                                <FiFile size={20} />
                                            </div>
                                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Master Harga Fotocopy</h3>
                                        </div>
                                        <div className="flex w-full sm:w-auto gap-3">
                                            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all text-sm font-semibold" onClick={() => {
                                                const newId = 'fc' + Date.now();
                                                const newItem = { id: newId, paper: 'HVS A4', color: 'bw', side: '1', price: 0, label: 'Baru' };
                                                setFotocopyPrices([...fotocopyPrices, newItem]);
                                            }}><FiPlus /> Tambah</button>
                                            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none" onClick={saveAllFotocopyPrices}><FiSave /> Simpan</button>
                                        </div>
                                    </div>

                                    <div className="p-0 sm:p-6">
                                        <div className="overflow-auto">
                                            <table className="w-full text-left border-collapse min-w-[700px]">
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
                                                                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" onClick={() => {
                                                                        if (confirm(`Hapus harga ${p.paper} ${p.color === 'bw' ? 'B/W' : 'Warna'} ${p.side} Sisi?`)) {
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
                                            <table className="w-full text-left border-collapse min-w-[600px]">
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
                                                                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" onClick={() => {
                                                                        if (confirm(`Hapus harga Print ${p.paper} ${p.color === 'bw' ? 'B/W' : 'Warna'}?`)) {
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
                                            <table className="w-full text-left border-collapse min-w-[400px]">
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
                                                                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" onClick={() => {
                                                                        if (confirm(`Hapus jilid "${p.name}"?`)) {
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
                                            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
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
                                            <table className="w-full text-left border-collapse min-w-[500px]">
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
                        )}

                        {/* Users Management */}
                        {activeTab === 'users' && (
                            <div className="space-y-6 pb-12">
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                                <FiUsers size={20} />
                                            </div>
                                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Manajemen Pengguna</h3>
                                        </div>
                                        <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none" onClick={() => { setEditUser(null); setUserForm({ name: '', username: '', password: '', role: 'kasir', isActive: true }); setUserFormOpen(true); }}>
                                            <FiPlus /> Tambah User
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nama</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Username</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                                {users.map(u => (
                                                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                                    {u.name.substring(0, 1)}
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{u.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{u.username}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                                                                }`}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${u.isActive ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                                                                }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                                {u.isActive ? 'Aktif' : 'Nonaktif'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" onClick={() => { setEditUser(u); setUserForm({ ...u, password: '' }); setUserFormOpen(true); }}>
                                                                <FiEdit size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Printer & Nota */}
                        {activeTab === 'printer' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Hardware Settings */}
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                                <FiPrinter size={20} />
                                            </div>
                                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Pengaturan Perangkat Keras</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Tipe Printer & Kertas Nota</label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {[
                                                        { id: '58mm', icon: <FiFileText />, title: 'Thermal 58mm', desc: 'Printer POS kecil' },
                                                        { id: '80mm', icon: <FiFileText />, title: 'Thermal 80mm', desc: 'Printer POS standar' },
                                                        { id: 'lx310', icon: <FiPrinter />, title: 'Dot Matrix LX310', desc: 'Kertas continuous 12×14cm' },
                                                        { id: 'inkjet', icon: <FiPrinter />, title: 'Inkjet / Laser', desc: 'Ukuran A4 / A5 / Folio' },
                                                    ].map(t => (
                                                        <button key={t.id} className={`flex text-left p-4 rounded-2xl border-2 transition-all group ${printerSize === t.id
                                                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                                                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                                            }`} onClick={() => setPrinterSize(t.id)}>
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-colors ${printerSize === t.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                                }`}>
                                                                {t.icon}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className={`font-bold text-sm ${printerSize === t.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>{t.title}</h4>
                                                                <p className="text-[11px] text-slate-500 mt-0.5">{t.desc}</p>
                                                            </div>
                                                            {printerSize === t.id && <FiCheckCircle className="text-blue-600 self-start mt-1" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {printerSize === 'inkjet' && (
                                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Ukuran Kertas</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['A5', 'A4', 'Folio'].map(sz => (
                                                            <button key={sz} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${paperSize === sz
                                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
                                                                }`} onClick={() => setPaperSize(sz)}>{sz}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                                                <div className="max-w-[80%]">
                                                    <h4 className="text-sm font-bold text-slate-700 dark:text-white">Cetak Struk Otomatis</h4>
                                                    <p className="text-[11px] text-slate-500 mt-1">Memicu pencetakan secara otomatis saat transaksi selesai.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={autoPrint} onChange={e => setAutoPrint(e.target.checked)} />
                                                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>

                                            <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <FiZap className="text-blue-600" />
                                                    <label className="text-sm font-bold text-blue-800 dark:text-blue-300">Mode Cetak Cepat (Direct Print)</label>
                                                </div>
                                                <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mb-4 leading-relaxed">Struk dikirim langsung ke hardware printer tanpa dialog browser (Silent Print).</p>
                                                <select className="w-full bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={printerName} onChange={e => setPrinterName(e.target.value)}>
                                                    <option value="">Cetak via Dialog Browser (Bawaan PDF)</option>
                                                    {systemPrinters.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Branding Header & Footer */}
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                                <FiEdit size={20} />
                                            </div>
                                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Branding Header & Footer</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nama Toko</label>
                                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={storeName} onChange={e => setStoreName(e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alamat Toko</label>
                                                    <textarea rows="3" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nomor Telepon</label>
                                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={storePhone} onChange={e => setStorePhone(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pesan Footer Struk</label>
                                                    <textarea rows="3" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} placeholder="Terima kasih telah berbelanja!" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Logo Struk</label>
                                                    <div className="relative group overflow-hidden bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl p-6 transition-all flex flex-col items-center justify-center cursor-pointer">
                                                        {storeLogo ? (
                                                            <img src={storeLogo} alt="Logo" className="h-16 object-contain mb-3" />
                                                        ) : (
                                                            <FiUpload size={24} className="text-slate-400 mb-2" />
                                                        )}
                                                        <p className="text-[10px] text-slate-500 font-bold group-hover:text-blue-500 uppercase tracking-widest">{storeLogo ? 'Ganti Logo' : 'Unggah Logo'}</p>
                                                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Struk Digital */}
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                                <FiMessageCircle size={20} />
                                            </div>
                                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Layanan Struk Digital</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-none">
                                                    <FiMessageCircle size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <h4 className="font-bold text-sm text-slate-700 dark:text-white">WhatsApp Struk</h4>
                                                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 font-medium">Kirim otomatis via API WhatsApp</p>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4 opacity-70">
                                                <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center">
                                                    <FiFileText size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <h4 className="font-bold text-sm text-slate-700 dark:text-white">Email Struk</h4>
                                                        <input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 font-medium">Kirim struk ke email pelanggan</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-4">
                                        <button className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-200 dark:shadow-none group" onClick={saveSettings}>
                                            <FiSave className="group-hover:scale-110 transition-transform" /> Simpan Perubahan Printer
                                        </button>
                                        <button className="flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-sm" onClick={async () => {
                                            // Test print logic (same as before)
                                            const W = printerSize === 'lx310' ? 36 : printerSize === 'inkjet' ? 60 : printerSize === '80mm' ? 42 : 32;
                                            const M = printerSize === 'lx310' ? '  ' : '';
                                            const pad = (label, val) => { const sp = W - label.length - val.length; return label + ' '.repeat(sp > 0 ? sp : 1) + val; };
                                            const center = (str) => { const p = Math.max(0, Math.floor((W - str.length) / 2)); return ' '.repeat(p) + str; };

                                            const lines = [
                                                center(storeName || 'NAMA TOKO'),
                                                center(storeAddress || 'Alamat toko'),
                                                center('Telp: ' + (storePhone || '-')),
                                                '-'.repeat(W),
                                                center('TEST PRINT RECEIPT'),
                                                '-'.repeat(W),
                                                `No      : TEST-${Date.now().toString(36).toUpperCase()}`,
                                                `Tanggal : ${new Date().toLocaleString('id-ID')}`,
                                                '-'.repeat(W),
                                                pad('  ITEM TEST 1', 'Rp 10.000'),
                                                pad('  ITEM TEST 2', 'Rp 5.000'),
                                                '-'.repeat(W),
                                                pad('TOTAL    :', 'Rp 15.000'),
                                                '-'.repeat(W),
                                                center('TEST BERHASIL'),
                                                '',
                                                `Dicetak: ${new Date().toLocaleString('id-ID')}`,
                                            ];
                                            let testText = lines.map(l => M + l).join('\n') + '\n\n\n';

                                            if (window.innerWidth < 1024) {
                                                printViaBluetooth(testText);
                                                showToast('Draft dikirim ke Bluetooth Printer', 'success');
                                                return;
                                            }

                                            if (printerName) {
                                                try {
                                                    const payload = { text: testText, printerName };
                                                    if (printerSize === 'lx310') payload.raw = true;
                                                    await api.post('/print/receipt', payload);
                                                    showToast(`Test print dikirim ke ${printerName}`, 'success');
                                                } catch (err) {
                                                    showToast('Gagal mengirim test print', 'error');
                                                }
                                            } else {
                                                showToast('Pilih printer dulu', 'error');
                                            }
                                        }}>
                                            <FiActivity /> Test Print
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column: Live Preview */}
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden sticky top-32">
                                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                            <div className="flex items-center gap-2">
                                                <FiEye className="text-blue-500" />
                                                <h3 className="font-bold text-slate-700 dark:text-white text-sm">Pratinjau Struk</h3>
                                            </div>
                                        </div>
                                        <div className="p-8 flex justify-center bg-slate-100/50 dark:bg-slate-950/50">
                                            <div className="bg-white dark:bg-white text-slate-800 w-full max-w-[280px] min-h-[400px] shadow-2xl p-6 relative">
                                                <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-slate-100 dark:from-slate-900 to-transparent pointer-events-none z-10" />
                                                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-size-[16px_16px] opacity-30 pointer-events-none" />
                                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar -mx-2 px-2 relative z-20">
                                                    <div className="flex justify-center mb-4">
                                                        {storeLogo ? (
                                                            <img src={storeLogo} alt="Logo" className="h-10 object-contain" />
                                                        ) : (
                                                            <div className="w-10 h-10 border-2 border-slate-200 flex items-center justify-center text-slate-300">
                                                                <FiPrinter size={16} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-center">
                                                        <h4 className="font-black text-xs uppercase tracking-tighter leading-tight">{storeName || 'NAMA TOKO'}</h4>
                                                        <p className="text-[9px] mt-1 leading-snug">{storeAddress || 'Alamat lengkap toko Anda mencakup jalan, kota, dan kode pos'}</p>
                                                        <p className="text-[9px] font-bold mt-0.5">TELP: {storePhone || '-'}</p>
                                                    </div>
                                                    <div className="border-t border-dashed border-slate-300 my-4"></div>
                                                    <div className="flex justify-between text-[9px] mb-2 font-mono">
                                                        <span>#INV-9823</span>
                                                        <span>{new Date().toLocaleDateString('id-ID')}</span>
                                                    </div>
                                                    <div className="border-t border-dashed border-slate-300 my-4"></div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-[10px]">
                                                            <span>Fotocopi A4 BW x50</span>
                                                            <span className="font-bold">25.000</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px]">
                                                            <span>Kertas A4 (Rim)</span>
                                                            <span className="font-bold">55.000</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px]">
                                                            <span>Jasa Jilid Spiral</span>
                                                            <span className="font-bold">15.000</span>
                                                        </div>
                                                    </div>
                                                    <div className="border-t border-dashed border-slate-500 my-4 opacity-30"></div>
                                                    <div className="flex justify-between text-sm font-black">
                                                        <span>TOTAL</span>
                                                        <span>95.000</span>
                                                    </div>
                                                    <div className="border-t border-dashed border-slate-300 my-4"></div>
                                                    <div className="text-center italic text-[9px] px-2 leading-relaxed text-slate-500">
                                                        {receiptFooter || 'Terima kasih telah berbelanja!'}
                                                    </div>
                                                    <div className="mt-6 text-center">
                                                        <div className="w-12 h-12 border border-slate-200 mx-auto flex items-center justify-center opacity-30">
                                                            <FiZap size={24} />
                                                        </div>
                                                        <p className="text-[7px] text-slate-300 mt-1 uppercase font-bold tracking-[0.2em]">{storeName || 'BADJAH'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/10 text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Mockup: {printerSize === '58mm' ? 'Thermal 58mm' : printerSize === '80mm' ? 'Thermal 80mm' : printerSize === 'lx310' ? 'Dot Matrix' : `Inkjet ${paperSize}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Activity Log */}
                        {activeTab === 'log' && (
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
                                        <table className="w-full text-left border-collapse min-w-[800px]">
                                            <thead>
                                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Waktu</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Aksi</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Detail</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                                {activityLog.map(l => (
                                                    <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                                            {formatDateTime(l.timestamp)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
                                                                    {(l.userName || 'AD').substring(0, 2)}
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{l.userName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${l.action?.includes('Tambah') || l.action?.includes('Simpan') ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                                                                l.action?.includes('Update') || l.action?.includes('Edit') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                                                                    l.action?.includes('Hapus') || l.action?.includes('Restore') ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                                                                        'bg-slate-100 text-slate-600 dark:bg-slate-800'
                                                                }`}>
                                                                {l.action}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md truncate hover:whitespace-normal transition-all">
                                                            {l.detail}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {activityLog.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="py-24 text-center">
                                                            <FiClock size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                                                            <p className="text-slate-400 font-medium">Belum ada aktivitas tercatat</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/30 dark:bg-slate-800/10">
                                        <span className="text-sm text-slate-500">
                                            Halaman <span className="font-bold text-slate-800 dark:text-slate-200">{logPage}</span> dari <span className="font-bold text-slate-800 dark:text-slate-200">{totalLogPages || 1}</span>
                                        </span>
                                        <div className="flex gap-2">
                                            {[...Array(totalLogPages)].map((_, i) => {
                                                const pageNum = i + 1;
                                                const range = isMobile ? 1 : 2;
                                                if (pageNum === 1 || pageNum === totalLogPages || (pageNum >= logPage - range && pageNum <= logPage + range)) {
                                                    return (
                                                        <button key={pageNum} onClick={() => setLogPage(pageNum)} className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${logPage === pageNum
                                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
                                                            }`}>
                                                            {pageNum}
                                                        </button>
                                                    );
                                                } else if (pageNum === logPage - (range + 1) || pageNum === logPage + (range + 1)) {
                                                    return <span key={pageNum} className="text-slate-400 px-1 self-end mb-2">...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment & QRIS */}
                        {activeTab === 'payment' && (
                            <div className="space-y-6 pb-12">
                                {/* Midtrans Server */}
                                <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />
                                    <div className="flex items-center gap-4 mb-6 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shadow-sm">
                                            <FiCpu size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Midtrans Payment Gateway</h3>
                                            <p className="text-sm text-slate-500">Konfigurasi API Key untuk QRIS Dinamis & Virtual Account</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                        <div className="space-y-2 col-span-1 md:col-span-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Server Key / API Key</label>
                                            <input className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" placeholder="SB-Mid-server-..." value={midtransKey} onChange={e => setMidtransKey(e.target.value)} />
                                            <p className="text-xs text-slate-400">Pastikan API Key sudah sesuai dengan akses environment Anda.</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 col-span-1 md:col-span-2">
                                            <div className={`w-12 h-6 flex items-center bg-slate-200 dark:bg-slate-700 rounded-full p-1 cursor-pointer transition-colors ${midtransIsProduction ? 'bg-blue-500' : ''}`} onClick={() => setMidtransIsProduction(!midtransIsProduction)}>
                                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${midtransIsProduction ? 'translate-x-6' : ''}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-800 dark:text-white">Production Mode</h4>
                                                <p className="text-xs text-slate-500">Aktifkan hanya jika Anda sudah Go-Live (bukan Sandbox).</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Manual E-Wallet */}
                                <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none" />
                                    <div className="flex items-center gap-4 mb-6 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shadow-sm">
                                            <FiDollarSign size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">DANA / E-Wallet Manual</h3>
                                            <p className="text-sm text-slate-500">Informasi pembayaran manual melalui DANA</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nomor DANA</label>
                                            <input className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" placeholder="081234..." value={danaNumber} onChange={e => setDanaNumber(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Atas Nama</label>
                                            <input className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase" placeholder="JOHN DOE" value={danaName} onChange={e => setDanaName(e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                {/* Manual Bank Transfer */}
                                <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />
                                    <div className="flex items-center gap-4 mb-6 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shadow-sm">
                                            <FiBriefcase size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Transfer Bank Manual</h3>
                                            <p className="text-sm text-slate-500">Informasi rekening bank operasional</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Bank</label>
                                            <input className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase" placeholder="BCA / MANDIRI" value={bankName} onChange={e => setBankName(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nomor Rekening</label>
                                            <input className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" placeholder="12345678" value={bankAccount} onChange={e => setBankAccount(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Atas Nama</label>
                                            <input className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase" placeholder="JOHN DOE" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                <div className="pb-8">
                                    <button
                                        className="flex items-center justify-center w-full gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                                        onClick={saveSettings}
                                    >
                                        <FiSave /> Simpan Pengaturan Pembayaran
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Backup & Restore */}
                        {activeTab === 'backup' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center md:text-left">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-6 shadow-sm border border-blue-50 dark:border-blue-800/50 mx-auto md:mx-0">
                                        <FiSave size={28} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Pencadangan Data</h3>
                                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">Ekspor seluruh data POS (Harga, Log, Member, Transaksi) ke file JSON yang aman.</p>
                                    <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-200 dark:shadow-none group" onClick={handleBackup}>
                                        <FiDownload className="group-hover:-translate-y-1 transition-transform" /> Mulai Backup Sekarang
                                    </button>
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center md:text-left">
                                    <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 mb-6 shadow-sm border border-orange-50 dark:border-orange-800/50 mx-auto md:mx-0">
                                        <FiUpload size={28} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Pemulihan Data</h3>
                                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">Impor data dari file backup JSON sebelumnya. <span className="font-bold text-orange-600">Peringatan:</span> Data saat ini akan ditimpa!</p>
                                    <label className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl cursor-pointer transition-all border border-slate-200 dark:border-slate-700">
                                        <FiFolder /> Pilih File Backup
                                        <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                                    </label>
                                </div>

                                <div className="md:col-span-2 bg-red-50 dark:bg-red-900/10 rounded-4xl border border-red-100 dark:border-red-900/30 p-8">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 text-center md:text-left">
                                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 shrink-0 mx-auto md:mx-0">
                                                <FiAlertCircle size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-red-800 dark:text-red-400">Reset Data Pabrik</h4>
                                                <p className="text-sm text-red-700/70 dark:text-red-400/70">Hapus semua data transaksi dan pengaturan kembali ke awal.</p>
                                            </div>
                                        </div>
                                        <button className="w-full md:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-200 dark:shadow-none" onClick={resetData}>
                                            <FiTrash2 className="inline mr-2" /> Reset Sekarang
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* User Form Modal */}
                        <Modal isOpen={userFormOpen} onClose={() => setUserFormOpen(false)} title={editUser ? <div className="flex items-center gap-2 text-slate-800 dark:text-white"><FiEdit className="text-blue-500" /> Edit Pengguna</div> : <div className="flex items-center gap-2 text-slate-800 dark:text-white"><FiPlus className="text-blue-500" /> Tambah User Baru</div>}>
                            <div className="space-y-5 py-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nama Lengkap</label>
                                    <div className="relative">
                                        <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" placeholder="Masukkan nama lengkap" value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Username</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                                        <input className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" placeholder="username" value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password {editUser && '(opsional)'}</label>
                                    <div className="relative">
                                        <FiPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" type="password" placeholder={editUser ? "Kosongkan jika tidak diubah" : "••••••••"} value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Role Akses</label>
                                        <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
                                            <option value="admin">Admin</option>
                                            <option value="kasir">Kasir</option>
                                            <option value="operator">Operator</option>
                                            <option value="teknisi">Teknisi</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Status Akun</label>
                                        <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" value={userForm.isActive} onChange={e => setUserForm(f => ({ ...f, isActive: e.target.value === 'true' }))}>
                                            <option value="true">Aktif</option>
                                            <option value="false">Nonaktif</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 group" onClick={handleSaveUser}>
                                        <FiSave className="group-hover:scale-110 transition-transform" /> Simpan Konfigurasi User
                                    </button>
                                </div>
                            </div>
                        </Modal>
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
