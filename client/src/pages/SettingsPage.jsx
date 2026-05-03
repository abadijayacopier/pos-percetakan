import React from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatDateTime, printViaBluetooth, listQZPrinters } from '../utils';
import Modal from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSettings, FiFile, FiUsers, FiPrinter, FiEdit, FiTrash2, FiPlus, FiSave, FiPackage, FiCpu, FiDollarSign, FiFileText, FiSearch, FiClock, FiCheckCircle, FiAlertCircle, FiX, FiDownload, FiUpload, FiRefreshCw, FiCheck, FiTruck, FiCalendar, FiMessageCircle, FiHome, FiBriefcase, FiStar, FiBox, FiActivity, FiLayers, FiList, FiChevronRight, FiChevronDown, FiEye, FiEyeOff, FiBook, FiTag, FiInfo, FiFolder, FiZap, FiSun, FiMoon, FiMonitor, FiImage, FiShield, FiKey, FiSend, FiDatabase, FiCloud } from 'react-icons/fi';
import ActivationModal from '../components/ActivationModal';
import GeneralSettings from '../components/settings/GeneralSettings';
import PrinterSettings from '../components/settings/PrinterSettings';
import UserManagement from '../components/settings/UserManagement';
import HardwareSettings from '../components/settings/HardwareSettings';
import PricingSettings from '../components/settings/PricingSettings';
import LandingSettings from '../components/settings/LandingSettings';
import LogSettings from '../components/settings/LogSettings';
import WhatsAppSettings from '../components/settings/WhatsAppSettings';
import TelegramSettings from '../components/settings/TelegramSettings';
import CDNSettings from '../components/settings/CDNSettings';
import SystemSettings from '../components/settings/SystemSettings';
import { resizeImage } from '../utils';


export default function SettingsPage({ onNavigate, pageState }) {
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();
    const themeCtx = useTheme();
    const isAdmin = user?.role === 'admin' || user?.role === 'pemilik';

    // Core states
    const [activeTab, setActiveTab] = React.useState(pageState?.tab || 'hub');
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
    const [loading, setLoading] = React.useState(true);

    // Data States
    const [fotocopyPrices, setFotocopyPrices] = React.useState([]);
    const [users, setUsers] = React.useState([]);
    const [printPrices, setPrintPrices] = React.useState([]);
    const [bindPrices, setBindPrices] = React.useState([]);
    const [systemPrinters, setSystemPrinters] = React.useState([]);
    const [qzPrinters, setQZPrinters] = React.useState([]);
    const [galleryImages, setGalleryImages] = React.useState([]);

    const [fcDiscounts, setFcDiscounts] = React.useState([]);
    const [tarifDesainPerJam, setTarifDesainPerJam] = React.useState(50000);

    // License States
    const [licenseInfo, setLicenseInfo] = React.useState({ activated: false });
    const [isActivationModalOpen, setIsActivationModalOpen] = React.useState(false);

    // Branding & Terminal States
    const [storeName, setStoreName] = React.useState('');
    const [storeAddress, setStoreAddress] = React.useState('');
    const [storePhone, setStorePhone] = React.useState('');
    const [storeEmail, setStoreEmail] = React.useState('');
    const [storeMapsUrl, setStoreMapsUrl] = React.useState('');
    const [storeLogo, setStoreLogo] = React.useState('');
    const [landingLogo, setLandingLogo] = React.useState('');
    const [landingFavicon, setLandingFavicon] = React.useState('');
    const [receiptFooter, setReceiptFooter] = React.useState('');
    const [printerSize, setPrinterSize] = React.useState('80mm');
    const [printerName, setPrinterName] = React.useState('');
    const [paperSize, setPaperSize] = React.useState('A4');
    const [autoPrint, setAutoPrint] = React.useState(true);

    // Payment & QRIS States
    const [midtransKey, setMidtransKey] = React.useState('');
    const [midtransIsProduction, setMidtransIsProduction] = React.useState(false);
    const [danaNumber, setDanaNumber] = React.useState('');
    const [danaName, setDanaName] = React.useState('');
    const [bankName, setBankName] = React.useState('');
    const [bankAccount, setBankAccount] = React.useState('');
    const [bankAccountName, setBankAccountName] = React.useState('');
    const [taxEnabled, setTaxEnabled] = React.useState(false);
    const [taxPercentage, setTaxPercentage] = React.useState(11);
    const [fingerprintIp, setFingerprintIp] = React.useState('192.168.1.201');
    const [fingerprintPort, setFingerprintPort] = React.useState(4370);

    const [telegramBotToken, setTelegramBotToken] = React.useState('');
    const [telegramChatId, setTelegramChatId] = React.useState('');
    const [telegramEnabled, setTelegramEnabled] = React.useState(false);
    const [telegramStokKritis, setTelegramStokKritis] = React.useState(true);
    const [telegramLaporanKasir, setTelegramLaporanKasir] = React.useState(true);
    const [telegramSecurityAlert, setTelegramSecurityAlert] = React.useState(false);
    const [telegramErrorMonitoring, setTelegramErrorMonitoring] = React.useState(false);

    // WhatsApp Gateway States
    const [waGatewayUrl, setWaGatewayUrl] = React.useState('');
    const [waApiKey, setWaApiKey] = React.useState('');
    const [waSessionName, setWaSessionName] = React.useState('default');
    const [waSenderNumber, setWaSenderNumber] = React.useState('');
    const [waTemplateInv, setWaTemplateInv] = React.useState('Halo *{{name}}*, pesanan Anda *#{{invoice}}* sebesar *{{total}}* sedang kami proses. Terima kasih!');
    const [waTemplateProcess, setWaTemplateProcess] = React.useState('Halo *{{name}}*, pesanan *#{{invoice}}* sedang dalam proses produksi/pengerjaan.');
    const [waTemplateDone, setWaTemplateDone] = React.useState('Halo *{{name}}*, pesanan *#{{invoice}}* sudah selesai dan siap diambil. Silakan datang ke toko.');
    const [waTemplateKasir, setWaTemplateKasir] = React.useState('LAPORAN KASIR: Transaksi baru *#{{invoice}}* senilai *{{total}}* oleh *{{user}}*.');

    // CDN & Cloud Storage States
    const [cdnAccountId, setCdnAccountId] = React.useState('');
    const [cdnBucketName, setCdnBucketName] = React.useState('');

    // Visibility States
    const [showMidtransKey, setShowMidtransKey] = React.useState(false);
    const [cdnAccessKey, setCdnAccessKey] = React.useState('');
    const [cdnSecretKey, setCdnSecretKey] = React.useState('');
    const [cdnCustomDomain, setCdnCustomDomain] = React.useState('');

    // UI/Form States
    const [userFormOpen, setUserFormOpen] = React.useState(false);
    const [editUser, setEditUser] = React.useState(null);
    const [userForm, setUserForm] = React.useState({ name: '', username: '', password: '', role: 'kasir', isActive: true });

    // Price Pagination States
    const [fcPage, setFcPage] = React.useState(1);
    const [printPage, setPrintPage] = React.useState(1);
    const [bindPage, setBindPage] = React.useState(1);
    const pageSize = 10;

    const [logPage, setLogPage] = React.useState(1);
    const [logPageSize] = React.useState(15);
    const [allLogs, setAllLogs] = React.useState([]);
    const activityLog = React.useMemo(() => {
        const start = (logPage - 1) * logPageSize;
        return allLogs.slice(start, start + logPageSize);
    }, [allLogs, logPage, logPageSize]);
    const totalLogPages = Math.ceil(allLogs.length / logPageSize);

    // Effects
    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle Deep Linking / Navigation State
    React.useEffect(() => {
        if (pageState?.tab) {
            setActiveTab(pageState.tab);
        }
        if (pageState?.action === 'change-password' && user) {
            setEditUser(user);
            setUserForm({
                name: user.name || '',
                username: user.username || '',
                password: '',
                role: user.role || 'kasir',
                isActive: true
            });
            setUserFormOpen(true);
        }
    }, [pageState, user]);

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
            setStoreEmail(sMap.store_email || '');
            setStoreMapsUrl(sMap.store_maps_url || '');
            setStoreLogo(sMap.store_logo || '');
            setLandingLogo(sMap.landing_logo || '');
            setLandingFavicon(sMap.landing_favicon || '');
            setReceiptFooter(sMap.receipt_footer || '');
            setPrinterSize(sMap.printer_size || '80mm');
            setPrinterName(sMap.printer_name || '');
            setPaperSize(sMap.paper_size || 'A4');
            setMidtransKey(sMap.midtrans_key || '');
            setMidtransIsProduction(sMap.midtrans_is_production === 'true');
            setDanaNumber(sMap.dana_number || '');
            setDanaName(sMap.dana_name || '');
            setBankName(sMap.bank_name || '');
            setBankAccount(sMap.bank_account || '');
            setBankAccountName(sMap.bank_account_name || '');
            setTarifDesainPerJam(parseInt(sMap.tarif_desain_per_jam || '50000'));
            setTaxEnabled(sMap.tax_enabled === 'true');
            setTaxPercentage(parseInt(sMap.tax_percentage || '11'));
            setFingerprintIp(sMap.fingerprint_ip || '192.168.1.201');
            setFingerprintPort(parseInt(sMap.fingerprint_port || '4370'));
            setAutoPrint(sMap.auto_print !== 'false');

            // Telegram
            setTelegramBotToken(sMap.telegram_bot_token || '');
            setTelegramChatId(sMap.telegram_chat_id || '');
            setTelegramEnabled(sMap.telegram_enabled === 'true');
            setTelegramStokKritis(sMap.telegram_stok_kritis !== 'false');
            setTelegramLaporanKasir(sMap.telegram_laporan_kasir !== 'false');
            setTelegramSecurityAlert(sMap.telegram_security_alert === 'true');
            setTelegramErrorMonitoring(sMap.telegram_error_monitoring === 'true');

            // WhatsApp
            setWaGatewayUrl(sMap.wa_gateway_url || '');
            setWaApiKey(sMap.wa_api_key || '');
            setWaSessionName(sMap.wa_session_name || 'default');
            setWaSenderNumber(sMap.wa_sender_number || '');
            setWaTemplateInv(sMap.wa_template_inv || 'Halo *{{name}}*, pesanan Anda *#{{invoice}}* sebesar *{{total}}* sedang kami proses. Terima kasih!');
            setWaTemplateProcess(sMap.wa_template_process || 'Halo *{{name}}*, pesanan *#{{invoice}}* sedang dalam proses produksi/pengerjaan.');
            setWaTemplateDone(sMap.wa_template_done || 'Halo *{{name}}*, pesanan *#{{invoice}}* sudah selesai dan siap diambil. Silakan datang ke toko.');
            setWaTemplateKasir(sMap.wa_template_kasir || 'LAPORAN KASIR: Transaksi baru *#{{invoice}}* senilai *{{total}}* oleh *{{user}}*.');

            // CDN & Cloud Storage
            setCdnAccountId(sMap.cdn_account_id || '');
            setCdnBucketName(sMap.cdn_bucket_name || '');
            setCdnAccessKey(sMap.cdn_access_key || '');
            setCdnSecretKey(sMap.cdn_secret_key || '');
            setCdnCustomDomain(sMap.cdn_custom_domain || '');

        } catch (error) {
            console.error(error);
            showToast('Gagal memuat data dari server', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadLicenseStatus = async () => {
        try {
            const res = await api.get('/settings/license');
            setLicenseInfo(res.data);
        } catch (error) {
            console.error('Failed to load license status:', error);
        }
    };

    const handleResetLicense = async () => {
        const result = await Swal.fire({
            title: 'Reset Lisensi?',
            text: 'Ini akan menghapus aktivasi di perangkat ini. Anda perlu memasukkan key baru untuk mengaktifkan kembali.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Reset!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                await api.delete('/settings/license');
                showToast('Lisensi berhasil direset', 'success');
                loadLicenseStatus();
            } catch (error) {
                showToast('Gagal mereset lisensi', 'error');
            }
        }
    };

    React.useEffect(() => {
        loadSettings();
        loadLicenseStatus();
    }, []);

    React.useEffect(() => {
        if (printerSize === 'lx310') {
            const fetchQZ = async () => {
                const list = await listQZPrinters();
                setQZPrinters(list);
            };
            fetchQZ();
        }
    }, [printerSize]);

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
                { key: 'store_email', value: storeEmail },
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
                { key: 'binding_prices', value: JSON.stringify(bindPrices) },
                { key: 'tarif_desain_per_jam', value: tarifDesainPerJam.toString() },
                { key: 'tax_enabled', value: taxEnabled ? 'true' : 'false' },
                { key: 'tax_percentage', value: taxPercentage.toString() },
                { key: 'fingerprint_ip', value: fingerprintIp },
                { key: 'fingerprint_port', value: fingerprintPort.toString() },
                { key: 'telegram_bot_token', value: telegramBotToken },
                { key: 'telegram_chat_id', value: telegramChatId },
                { key: 'telegram_enabled', value: telegramEnabled ? 'true' : 'false' },
                { key: 'telegram_stok_kritis', value: telegramStokKritis ? 'true' : 'false' },
                { key: 'telegram_laporan_kasir', value: telegramLaporanKasir ? 'true' : 'false' },
                { key: 'telegram_security_alert', value: telegramSecurityAlert ? 'true' : 'false' },
                { key: 'telegram_error_monitoring', value: telegramErrorMonitoring ? 'true' : 'false' },
                { key: 'wa_gateway_url', value: waGatewayUrl },
                { key: 'wa_api_key', value: waApiKey },
                { key: 'wa_session_name', value: waSessionName },
                { key: 'wa_sender_number', value: waSenderNumber },
                { key: 'wa_template_inv', value: waTemplateInv },
                { key: 'wa_template_process', value: waTemplateProcess },
                { key: 'wa_template_done', value: waTemplateDone },
                { key: 'wa_template_kasir', value: waTemplateKasir },
                { key: 'cdn_account_id', value: cdnAccountId },
                { key: 'cdn_bucket_name', value: cdnBucketName },
                { key: 'cdn_access_key', value: cdnAccessKey },
                { key: 'cdn_secret_key', value: cdnSecretKey },
                { key: 'cdn_custom_domain', value: cdnCustomDomain }
            ];
            await api.post('/settings', payload);
            showToast('Pengaturan berhasil disimpan!', 'success');
            loadSettings();
            // Dispatch event to sync branding globally
            window.dispatchEvent(new CustomEvent('sync-branding'));
        } catch (error) {
            console.error(error);
            showToast('Gagal menyimpan pengaturan', 'error');
        }
    };

    // Helpers moved to utils.js or specialized components

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
            setEditUser(null);
            setUserFormOpen(false);
            refreshUsers();
            loadSettings();

            // Refresh global user state if current user was updated
            if (editUser && editUser.id === user.id) {
                updateUser({ name: userForm.name });
            }
            showToast(editUser ? 'User diupdate!' : 'User baru ditambahkan!', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal menyimpan user', 'error');
        }
    };

    const handleBackup = async () => {
        try {
            showToast('Menyiapkan backup data...', 'info');
            const res = await api.get('/settings/backup', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `pos_backup_${new Date().toISOString().slice(0, 10)}.backup`);
            document.body.appendChild(link);
            link.click();
            showToast('Backup berhasil diunduh!', 'success');

        } catch (error) {
            showToast('Gagal melakukan backup', 'error');
        }
    };

    const handleRestore = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const result = await Swal.fire({
            title: 'PERINGATAN!',
            text: 'Memulihkan data akan menimpa data saat ini. Lanjutkan?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'YA, PULIHKAN',
            cancelButtonText: 'BATAL',
            confirmButtonColor: '#ef4444',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)'
        });
        if (!result.isConfirmed) return;

        const formData = new FormData();
        formData.append('backup', file);

        try {
            showToast('Memulihkan data...', 'info');
            await api.post('/settings/restore', formData);
            showToast('Data berhasil dipulihkan! Halaman akan direfresh.', 'success');
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            showToast('Gagal memulihkan data', 'error');
        }
    };

    const resetData = () => {
        if (confirm('PERINGATAN: Fitur reset manual via endpoint dinonaktifkan di mode MySQL. Hubungi administrator database.')) {
            showToast('Proses dibatalkan', 'info');
        }
    };

    const TABS = [
        { id: 'general', icon: <FiSettings />, text: 'Umum', adminOnly: true },
        { id: 'fotocopy', icon: <FiFile />, text: 'Layanan & Harga', adminOnly: true },
        { id: 'landing', icon: <FiImage />, text: 'Landing Page', adminOnly: true },
        { id: 'users', icon: <FiUsers />, text: isAdmin ? 'Users' : 'Profil Saya' },
        { id: 'printer', icon: <FiPrinter />, text: 'Printer & Nota', adminOnly: true },
        { id: 'log', icon: <FiEdit />, text: 'Log Aktivitas', adminOnly: true },
        { id: 'payment', icon: <FiDollarSign />, text: 'Pembayaran & QRIS', adminOnly: true },
        { id: 'hardware', icon: <FiCpu />, text: 'Perangkat Keras', adminOnly: true },
        { id: 'backup', icon: <FiSave />, text: 'Backup & Restore', adminOnly: true },
        { id: 'whatsapp', icon: <FiMessageCircle />, text: 'WhatsApp Gateway', adminOnly: true },
        { id: 'telegram', icon: <FiSend />, text: 'Telegram Integration', adminOnly: true },
        { id: 'cdn', icon: <FiDatabase />, text: 'CDN & Cloud Storage', adminOnly: true },
        { id: 'license', icon: <FiShield />, text: 'Lisensi', adminOnly: true },
    ].filter(t => !t.adminOnly || isAdmin);

    return (
        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100 font-display transition-colors pb-10">
            {/* Header */}
            <header className="px-6 py-6 md:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
                        <FiSettings size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{isAdmin ? 'Pengaturan Sistem' : 'Profil & Keamanan'}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {isAdmin ? 'Kelola harga layanan, identitas toko, dan perangkat keras' : 'Kelola informasi profil dan kata sandi Anda'}
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">

                {activeTab === 'hub' ? (
                    <div className="max-w-7xl mx-auto">
                        {/* Header Hub */}
                        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
                                    {isAdmin ? 'Pengaturan' : 'Profil'} <span className="text-blue-600">{isAdmin ? 'Sistem' : 'Saya'}</span>
                                </h1>
                                <p className="text-slate-500 mt-2 font-medium uppercase">{isAdmin ? 'KONFIGURASI PARAMETER OPERASIONAL POS ABADI JAYA' : 'Pusat Keamanan & Informasi Akun'}</p>
                            </div>
                        </div>

                        {/* Hub Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                { id: 'general', title: 'PENGATURAN UMUM', desc: 'Identitas toko, alamat, dan pengaturan pajak.', icon: <FiHome />, color: 'blue', adminOnly: true },
                                { id: 'fotocopy', title: 'TARIF & BIAYA', desc: 'Harga fotocopy, cetak, desain, dan jilid.', icon: <FiDollarSign />, color: 'indigo', adminOnly: true },
                                { id: 'printer', title: 'PRINTER & NOTA', desc: 'Setting printer, ukuran struk, dan logo nota.', icon: <FiPrinter />, color: 'emerald', adminOnly: true },
                                { id: 'users', title: isAdmin ? 'MANAJEMEN PENGGUNA' : 'PROFIL SAYA', desc: isAdmin ? 'Kelola akun staf, kasir, dan admin.' : 'Lihat dan ubah informasi akun Anda.', icon: <FiUsers />, color: 'orange' },
                                { id: 'landing', title: 'TAMPILAN & LANDING', desc: 'Logo website, favicon, dan galeri depan.', icon: <FiImage />, color: 'rose', adminOnly: true },
                                { id: 'payment', title: 'PEMBAYARAN & QRIS', desc: 'Midtrans, Bank, dan Dana (QRIS Dinamis).', icon: <FiZap />, color: 'cyan', adminOnly: true },
                                { id: 'log', title: 'AUDIT LOG SYSTEM', desc: 'Riwayat aktivitas staf dan sistem.', icon: <FiActivity />, color: 'slate', adminOnly: true },
                                { id: 'hardware', title: 'PERANGKAT KERAS', desc: 'Setting IP Fingerprint dan perangkat.', icon: <FiCpu />, color: 'purple', adminOnly: true },
                                { id: 'whatsapp', title: 'WHATSAPP GATEWAY', desc: 'Konfigurasi API WA & Template Pesan.', icon: <FiMessageCircle />, color: 'emerald', adminOnly: true },
                                { id: 'telegram', title: 'TELEGRAM INTEGRATION', desc: 'Robot Notifikasi & Monitoring Sistem.', icon: <FiSend />, color: 'sky', adminOnly: true },
                                { id: 'cdn', title: 'CDN & CLOUD STORAGE', desc: 'Konfigurasi Cloudflare R2 dan custom domain CDN.', icon: <FiDatabase />, color: 'blue', adminOnly: true },
                                { id: 'backup', title: 'BACKUP & RESTORE', desc: 'Cadangkan dan pulihkan database sistem.', icon: <FiSave />, color: 'teal', adminOnly: true },
                                { id: 'license', title: 'LISENSI & KEAMANAN', desc: 'Status aktivasi dan lisensi aplikasi.', icon: <FiShield />, color: 'red', adminOnly: true },
                                { id: 'system', title: 'SYSTEM UPDATE', desc: 'Cek pembaruan sistem dan versi aplikasi.', icon: <FiRefreshCw />, color: 'blue', protected: true, adminOnly: true },
                            ].filter(cat => (!cat.protected || (cat.protected && licenseInfo.activated)) && (!cat.adminOnly || isAdmin)).map((cat, idx) => (
                                <motion.div
                                    key={cat.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setActiveTab(cat.id)}
                                    className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 border border-slate-100 dark:border-slate-800 cursor-pointer transition-all duration-300 relative overflow-hidden"
                                >
                                    <div className={`absolute top-0 right-0 w-24 h-24 bg-${cat.color}-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
                                    <div className="relative z-10">
                                        <div className={`w-16 h-16 rounded-2xl bg-${cat.color}-100 dark:bg-${cat.color}-900/30 text-${cat.color}-600 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
                                            {React.cloneElement(cat.icon, { size: 32 })}
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">{cat.title}</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed font-medium">{cat.desc}</p>
                                        <div className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            BUKA PENGATURAN <FiChevronRight />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Toolbar Sub-Page */}
                        <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 sticky top-24 z-30 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-3xl flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setActiveTab('hub')}
                                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                >
                                    <FiChevronDown className="rotate-90" size={20} />
                                </button>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                        {activeTab.replace('-', ' ')}
                                    </h2>
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Modul Konfigurasi</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-all text-xs uppercase tracking-widest">
                                    <FiSave size={18} /> Simpan
                                </button>
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
                                {activeTab === 'general' && (
                                    <GeneralSettings
                                        storeName={storeName} setStoreName={setStoreName}
                                        storeAddress={storeAddress} setStoreAddress={setStoreAddress}
                                        storePhone={storePhone} setStorePhone={setStorePhone}
                                        storeEmail={storeEmail} setStoreEmail={setStoreEmail}
                                        storeLogo={storeLogo} setStoreLogo={setStoreLogo}
                                        handleLogoUpload={handleLogoUpload}
                                        taxEnabled={taxEnabled}
                                        setTaxEnabled={setTaxEnabled}
                                        taxPercentage={taxPercentage}
                                        setTaxPercentage={setTaxPercentage}
                                        saveSettings={saveSettings}
                                    />
                                )}


                                {/* Landing Page Settings */}
                                {activeTab === 'landing' && (
                                    <LandingSettings
                                        storeMapsUrl={storeMapsUrl} setStoreMapsUrl={setStoreMapsUrl}
                                        landingLogo={landingLogo} setLandingLogo={setLandingLogo}
                                        landingFavicon={landingFavicon} setLandingFavicon={setLandingFavicon}
                                        galleryImages={galleryImages}
                                        handleGalleryUpload={handleGalleryUpload}
                                        removeGalleryImage={removeGalleryImage}
                                        saveSettings={saveSettings}
                                        showToast={showToast}
                                    />
                                )}

                                {/* Pricing Settings */}
                                {activeTab === 'fotocopy' && (
                                    <PricingSettings
                                        tarifDesainPerJam={tarifDesainPerJam} setTarifDesainPerJam={setTarifDesainPerJam}
                                        fotocopyPrices={fotocopyPrices} setFotocopyPrices={setFotocopyPrices}
                                        fcPage={fcPage} setFcPage={setFcPage}
                                        printPrices={printPrices} setPrintPrices={setPrintPrices}
                                        printPage={printPage} setPrintPage={setPrintPage}
                                        bindPrices={bindPrices} setBindPrices={setBindPrices}
                                        bindPage={bindPage} setBindPage={setBindPage}
                                        fcDiscounts={fcDiscounts} setFcDiscounts={setFcDiscounts}
                                        saveSettings={saveSettings}
                                        pageSize={pageSize}
                                    />
                                )}


                                {/* Users Management */}
                                {activeTab === 'users' && (
                                    <UserManagement
                                        users={users}
                                        setEditUser={setEditUser}
                                        setUserForm={setUserForm}
                                        setUserFormOpen={setUserFormOpen}
                                        isAdmin={isAdmin}
                                        currentUser={user}
                                    />
                                )}


                                {/* Printer & Nota */}
                                {activeTab === 'printer' && (
                                    <PrinterSettings
                                        printerSize={printerSize} setPrinterSize={setPrinterSize}
                                        paperSize={paperSize} setPaperSize={setPaperSize}
                                        autoPrint={autoPrint} setAutoPrint={setAutoPrint}
                                        printerName={printerName} setPrinterName={setPrinterName}
                                        systemPrinters={systemPrinters} qzPrinters={qzPrinters}
                                        storeName={storeName} setStoreName={setStoreName}
                                        storeAddress={storeAddress} setStoreAddress={setStoreAddress}
                                        storePhone={storePhone} setStorePhone={setStorePhone}
                                        receiptFooter={receiptFooter} setReceiptFooter={setReceiptFooter}
                                        storeLogo={storeLogo} handleLogoUpload={handleLogoUpload}
                                        saveSettings={saveSettings} showToast={showToast}
                                    />
                                )}


                                {/* Activity Log */}
                                {activeTab === 'log' && (
                                    <LogSettings
                                        activityLog={activityLog}
                                        logPage={logPage}
                                        setLogPage={setLogPage}
                                        totalLogPages={totalLogPages}
                                    />
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
                                                    <div className="relative">
                                                        <input
                                                            type={showMidtransKey ? "text" : "password"}
                                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono pr-12"
                                                            placeholder="SB-Mid-server-..."
                                                            value={midtransKey}
                                                            onChange={e => setMidtransKey(e.target.value)}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowMidtransKey(!showMidtransKey)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                                        >
                                                            {showMidtransKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                                        </button>
                                                    </div>
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
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center md:text-left">
                                            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-6 shadow-sm border border-blue-50 dark:border-blue-800/50 mx-auto md:mx-0">
                                                <FiSave size={28} />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Pencadangan Data</h3>
                                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">Ekspor seluruh data POS (Harga, Log, Member, Transaksi) ke file SQL yang aman.</p>
                                            <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-200 dark:shadow-none group" onClick={handleBackup}>
                                                <FiDownload className="group-hover:-translate-y-1 transition-transform" /> Mulai Backup Sekarang
                                            </button>
                                        </div>

                                        {user?.username === 'admin' && (
                                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center md:text-left">
                                                <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 mb-6 shadow-sm border border-purple-50 dark:border-purple-800/50 mx-auto md:mx-0">
                                                    <FiZap size={28} />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Developer Sync</h3>
                                                <p className="text-slate-500 text-sm mb-8 leading-relaxed">Fitur khusus SUPRIYANTO untuk update data.</p>
                                                <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-200 dark:shadow-none group" onClick={async () => {
                                                    const { value: password } = await Swal.fire({
                                                        title: 'Konfirmasi Developer',
                                                        input: 'password',
                                                        inputLabel: 'Masukkan password admin untuk ekspor',
                                                        inputPlaceholder: 'Password...',
                                                        showCancelButton: true,
                                                        background: 'var(--bg-card)',
                                                        color: 'var(--text-primary)'
                                                    });
                                                    if (!password) return;

                                                    try {
                                                        showToast('Sedang mengekspor data...', 'info');
                                                        const res = await api.post('/settings/export-project', { password });
                                                        showToast(res.data.message, 'success');
                                                    } catch (e) {
                                                        const msg = e.response?.data?.message || 'Gagal ekspor database';
                                                        showToast(msg, 'error');
                                                    }
                                                }}>
                                                    <FiSave className="group-hover:scale-110 transition-transform" /> Ekspor ke server
                                                </button>
                                            </div>
                                        )}

                                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center md:text-left">
                                            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 mb-6 shadow-sm border border-orange-50 dark:border-orange-800/50 mx-auto md:mx-0">
                                                <FiUpload size={28} />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Pemulihan Data</h3>
                                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">Impor data dari file backup SQL sebelumnya. <span className="font-bold text-orange-600">Peringatan:</span> Data saat ini akan ditimpa!</p>
                                            <label className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl cursor-pointer transition-all border border-slate-200 dark:border-slate-700">
                                                <FiFolder /> Pilih File Backup
                                                <input type="file" accept=".sql,.json,.backup" onChange={handleRestore} className="hidden" />
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

                                {/* License Settings */}
                                {activeTab === 'license' && (
                                    <div className="max-w-4xl mx-auto space-y-6 pb-12">
                                        <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

                                            <div className="p-10 flex flex-col md:flex-row items-center gap-10">
                                                <div className={`w-32 h-32 rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl ${licenseInfo.activated ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 shadow-slate-500/10'}`}>
                                                    {licenseInfo.activated ? <FiCheckCircle size={64} /> : <FiShield size={64} />}
                                                </div>

                                                <div className="flex-1 text-center md:text-left">
                                                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                                                        <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-tight">Status Lisensi</h3>
                                                        {licenseInfo.activated ? (
                                                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-sm font-bold rounded-full w-fit mx-auto md:mx-0">
                                                                <FiCheck size={16} /> AKTIF
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-bold rounded-full w-fit mx-auto md:mx-0 font-mono">
                                                                BELUM AKTIVASI
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl mb-4 text-xs font-mono text-slate-400 flex items-center gap-2 w-fit mx-auto md:mx-0 border border-slate-100 dark:border-slate-700">
                                                        <FiShield size={12} /> HWID: {licenseInfo.hardwareId || 'Mencari...'}
                                                    </div>

                                                    {licenseInfo.activated ? (
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dilisensikan Kepada</p>
                                                                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{licenseInfo.clientName}</p>
                                                                </div>
                                                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Masa Berlaku Hingga</p>
                                                                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                                                                        {licenseInfo.expiryDate
                                                                            ? new Date(licenseInfo.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                                                            : (licenseInfo.activated ? 'Selamanya / Berlangganan' : 'N/A')
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap gap-4 items-center">
                                                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                                    <FiInfo className="text-indigo-500" />
                                                                    {licenseInfo.isSaaS
                                                                        ? 'Aplikasi dikelola di Cloud. Langganan aktif.'
                                                                        : 'Terima kasih telah menggunakan software orisinil.'}
                                                                </p>
                                                                {!licenseInfo.isSaaS && (
                                                                    <button
                                                                        onClick={handleResetLicense}
                                                                        className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 underline underline-offset-4 transition-colors"
                                                                    >
                                                                        Reset Lisensi (Ganti PC)
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6">
                                                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto md:mx-0">
                                                                Aplikasi Anda saat ini berjalan dalam mode terbatas. Aktivasi diperlukan untuk memastikan dukungan penuh dan pembaruan sistem di masa mendatang.
                                                            </p>
                                                            <button
                                                                onClick={() => setIsActivationModalOpen(true)}
                                                                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-lg rounded-2xl transition-all shadow-xl shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-3 group mx-auto md:mx-0"
                                                            >
                                                                <FiKey className="group-hover:rotate-12 transition-transform" />
                                                                Aktivasi Sekarang
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {licenseInfo.activated && (
                                                <div className="px-10 py-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <FiShield size={14} className="text-emerald-500" />
                                                        Data Lisensi terenkripsi secara aman di server lokal.
                                                    </div>
                                                    <button
                                                        onClick={() => setIsActivationModalOpen(true)}
                                                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                                    >
                                                        <FiRefreshCw size={12} /> Perbarui Kode Lisensi
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-8 bg-blue-50/30 dark:bg-blue-900/10 rounded-3xl border border-blue-100/50 dark:border-blue-900/20 flex items-start gap-4">
                                            <FiAlertCircle className="text-blue-500 shrink-0 mt-1" size={20} />
                                            <div>
                                                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">Informasi Hak Cipta</h4>
                                                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 leading-relaxed">
                                                    Lisensi ini hanya berlaku untuk 1 instance server. Memindahkan database ke server lain mungkin memerlukan kode aktivasi baru tergantung pada konfigurasi hardware ID. Hubungi dukungan jika Anda melakukan migrasi server.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Hardware Settings */}
                                {/* Hardware Settings */}
                                {activeTab === 'hardware' && (
                                    <HardwareSettings
                                        fingerprintIp={fingerprintIp} setFingerprintIp={setFingerprintIp}
                                        fingerprintPort={fingerprintPort} setFingerprintPort={setFingerprintPort}
                                        saveSettings={saveSettings}
                                    />
                                )}

                                {activeTab === 'whatsapp' && (
                                    <WhatsAppSettings
                                        waGatewayUrl={waGatewayUrl} setWaGatewayUrl={setWaGatewayUrl}
                                        waApiKey={waApiKey} setWaApiKey={setWaApiKey}
                                        waSessionName={waSessionName} setWaSessionName={setWaSessionName}
                                        waSenderNumber={waSenderNumber} setWaSenderNumber={setWaSenderNumber}
                                        waTemplateInv={waTemplateInv} setWaTemplateInv={setWaTemplateInv}
                                        waTemplateProcess={waTemplateProcess} setWaTemplateProcess={setWaTemplateProcess}
                                        waTemplateDone={waTemplateDone} setWaTemplateDone={setWaTemplateDone}
                                        waTemplateKasir={waTemplateKasir} setWaTemplateKasir={setWaTemplateKasir}
                                        saveSettings={saveSettings}
                                    />
                                )}

                                {activeTab === 'telegram' && (
                                    <TelegramSettings
                                        telegramBotToken={telegramBotToken} setTelegramBotToken={setTelegramBotToken}
                                        telegramChatId={telegramChatId} setTelegramChatId={setTelegramChatId}
                                        telegramEnabled={telegramEnabled} setTelegramEnabled={setTelegramEnabled}
                                        telegramStokKritis={telegramStokKritis} setTelegramStokKritis={setTelegramStokKritis}
                                        telegramLaporanKasir={telegramLaporanKasir} setTelegramLaporanKasir={setTelegramLaporanKasir}
                                        telegramSecurityAlert={telegramSecurityAlert} setTelegramSecurityAlert={setTelegramSecurityAlert}
                                        telegramErrorMonitoring={telegramErrorMonitoring} setTelegramErrorMonitoring={setTelegramErrorMonitoring}
                                        saveSettings={saveSettings}
                                    />
                                )}


                                {activeTab === 'cdn' && (
                                    <CDNSettings
                                        cdnAccountId={cdnAccountId} setCdnAccountId={setCdnAccountId}
                                        cdnBucketName={cdnBucketName} setCdnBucketName={setCdnBucketName}
                                        cdnAccessKey={cdnAccessKey} setCdnAccessKey={setCdnAccessKey}
                                        cdnSecretKey={cdnSecretKey} setCdnSecretKey={setCdnSecretKey}
                                        cdnCustomDomain={cdnCustomDomain} setCdnCustomDomain={setCdnCustomDomain}
                                        saveSettings={saveSettings}
                                    />
                                )}

                                {activeTab === 'system' && (
                                    <SystemSettings />
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
                                                    <option value="desainer">Desain</option>
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

                                <ActivationModal
                                    isOpen={isActivationModalOpen}
                                    onClose={() => setIsActivationModalOpen(false)}
                                    onActivated={(info) => setLicenseInfo({ activated: true, ...info })}
                                    hardwareId={licenseInfo.hardwareId}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div >
    );
}
