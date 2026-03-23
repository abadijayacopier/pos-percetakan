import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';
import { formatRupiah, generateInvoice, generateRawReceipt, printViaRawBT } from '../utils';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import Modal from '../components/Modal';
import { FiCheckCircle, FiPrinter, FiSearch, FiUserPlus, FiChevronRight, FiList } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import Swal from 'sweetalert2';

export default function IntegratedPos({ onNavigate, pageState, onFullscreenChange }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { themeMode: theme, setTheme: toggleTheme } = useTheme();

    // Basic States
    const [activeServiceTab, setActiveServiceTab] = useState('fotocopy'); // 'fotocopy' | 'jilid' | 'cetak'
    const [products, setProducts] = useState([]);
    const [fotocopyPrices, setFotocopyPrices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [bindingPrices, setBindingPrices] = useState([]);
    const [printPrices, setPrintPrices] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Customer States
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [manualCustomerName, setManualCustomerName] = useState('');
    const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');

    // Clock Effect
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fullscreen Event Listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (onFullscreenChange) {
                onFullscreenChange(!!document.fullscreenElement);
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [onFullscreenChange]);

    // Update isMobile on resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fotocopy States
    const [fcPaper, setFcPaper] = useState('HVS A4');
    const [fcColor, setFcColor] = useState('bw');
    const [fcSide, setFcSide] = useState('1');
    const [fcQty, setFcQty] = useState(0);

    // Jilid & Print States
    const [jilidType, setJilidType] = useState(null);
    const [jilidQty, setJilidQty] = useState(0);
    const [printType, setPrintType] = useState(null);
    const [printQty, setPrintQty] = useState(0);

    // Payment & Modal States
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('tunai');
    const [amountPaid, setAmountPaid] = useState('');
    const [transactionComplete, setTransactionComplete] = useState(null);
    const [isDiscountModalOpen, setDiscountModalOpen] = useState(false);
    const [globalDiscount, setGlobalDiscount] = useState(0);

    // Mencegah ID invoice terus berubah akibat re-render dari timer
    const draftInvoiceId = useMemo(() => {
        return 'Order ID: #INV-' + Date.now().toString().slice(-8);
    }, [cart.length === 0, transactionComplete]);

    // Printer Settings
    const [printerSettings, setPrinterSettings] = useState({
        autoPrint: false,
        printerName: '',
        printerSize: '80mm',
        paperSize: 'A4'
    });

    const searchInputRef = useRef(null);
    const barcodeBuffer = useRef('');
    const lastKeyTime = useRef(Date.now());

    // Initial Data Loading
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [productsRes, bindingRes, printRes, customersRes, fcRes, settingsRes] = await Promise.all([
                    api.get('/products').catch(() => ({ data: [] })),
                    api.get('/pricing/binding').catch(() => ({ data: [] })),
                    api.get('/pricing/print').catch(() => ({ data: [] })),
                    api.get('/customers').catch(() => ({ data: [] })),
                    api.get('/transactions/fotocopy-prices').catch(() => ({ data: [] })),
                    api.get('/settings').catch(() => ({ data: [] }))
                ]);

                // Filter or set states directly
                setProducts(productsRes.data || []);
                const bData = bindingRes.data || [];
                setBindingPrices(bData);
                if (bData.length > 0) setJilidType(bData[0]);

                const pData = printRes.data || [];
                setPrintPrices(pData);
                if (pData.length > 0) setPrintType(pData[0]);

                setCustomers(customersRes.data || []);
                setFotocopyPrices(fcRes.data || []);

                // Load Settings
                const allSettings = settingsRes.data || [];
                const sMap = {};
                allSettings.forEach(s => { sMap[s.key] = s.value; });

                setPrinterSettings({
                    autoPrint: sMap.auto_print === 'true',
                    printerName: sMap.printer_name || '',
                    printerSize: sMap.printer_size || '80mm',
                    paperSize: sMap.paper_size || 'A4'
                });

                if (sMap.fc_discounts) {
                    try { setFcDiscounts(JSON.parse(sMap.fc_discounts)); } catch (e) { }
                }
            } catch (error) {
                console.error('Failed to load initial data:', error);
            }
        };

        loadInitialData();
    }, []);

    // Helper: find price for fotocopy based on selection
    const getFcUnitPrice = (paper, color, side) => {
        const priceObj = fotocopyPrices.find(p => p.paper === paper && p.color === color && p.side === side);
        return priceObj ? priceObj.price : 0;
    };

    // Calculate subtotal
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.sellPrice * item.quantity), 0), [cart]);

    // Barcode Listener
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'F8') {
                e.preventDefault();
                openCashDrawer();
                return;
            }
            if (e.key === 'F11') {
                e.preventDefault();
                toggleFullScreen();
                return;
            }
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const now = Date.now();
            if (now - lastKeyTime.current > 100) barcodeBuffer.current = '';
            lastKeyTime.current = now;

            if (e.key === 'Enter') {
                if (barcodeBuffer.current.length > 3) {
                    const code = barcodeBuffer.current;
                    const product = products.find(p => p.code === code);
                    if (product) {
                        addToCart(product);
                        showToast(`Ditambahkan otomatis: ${product.name}`, 'success');
                    } else {
                        showToast(`Produk dengan kode ${code} tidak ditemukan`, 'warning');
                    }
                    barcodeBuffer.current = '';
                }
            } else if (e.key.length === 1) {
                barcodeBuffer.current += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [products, printerSettings]);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.log(err));
        } else {
            document.exitFullscreen().catch(err => console.log(err));
        }
    };

    const filteredProducts = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return products.filter(p =>
            p.type !== 'service' &&
            p.type !== 'fotocopy' &&
            ((p.name || '').toLowerCase().includes(query) || (p.code || '').toLowerCase().includes(query))
        );
    }, [products, searchQuery]);

    // Cart Handlers
    const addToCart = (product) => {
        if (product.stock <= 0) return alert('Stok habis!');
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) return prev;
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, item.quantity + delta);
                if (delta > 0 && item.stock && newQty > item.stock) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const removeAll = () => {
        if (cart.length === 0) return;
        Swal.fire({
            title: 'Kosongkan Keranjang?',
            text: 'Semua item akan dihapus dari daftar.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Kosongkan',
            cancelButtonText: 'Batal',
            customClass: {
                confirmButton: 'bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-xl ml-3',
                cancelButton: 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl',
                popup: 'dark:bg-slate-800 dark:text-white rounded-3xl',
                title: 'dark:text-white'
            },
            buttonsStyling: false
        }).then((result) => {
            if (result.isConfirmed) {
                setCart([]);
                setGlobalDiscount(0);
            }
        });
    };

    // Services Add logic
    const addFotocopyToCart = (paper, color, side, qty) => {
        if (qty <= 0) {
            showToast('Jumlah lembar harus lebih dari 0', 'warning');
            return;
        }
        const unitPrice = getFcUnitPrice(paper, color, side);
        const name = `Fotocopy ${paper} (${color === 'bw' ? 'B/W' : 'Warna'}, ${side === '1' ? '1 Sisi' : 'Bolak-balik'})`;
        const existingItem = cart.find(c => c.type === 'fotocopy' && c.name === name);
        if (existingItem) {
            updateQty(existingItem.id, qty);
            showToast('Keranjang diperbarui!', 'success');
            setFcQty(0);
            return;
        }

        const newItem = {
            id: `fc-${Date.now()}-${Math.random()}`,
            name,
            sellPrice: unitPrice,
            quantity: qty,
            type: 'fotocopy',
            meta: { paper, color, side, unitPrice }
        };
        setCart(prev => [...prev, newItem]);
        showToast('Ditambahkan ke keranjang!', 'success');
        setFcQty(0);
    };

    const addJilidToCart = (item) => {
        if (!item) return;
        const existingItem = cart.find(c => c.name === item.name && c.type === 'service');
        if (existingItem) {
            updateQty(existingItem.id, existingItem.quantity + 1);
            showToast('Keranjang diperbarui!', 'success');
        } else {
            const newItem = {
                id: `jilid-${Date.now()}-${Math.random()}`,
                name: `${item.name}`,
                sellPrice: item.price,
                quantity: 1,
                type: 'service'
            };
            setCart(prev => [...prev, newItem]);
            showToast('Jilid ditambahkan ke keranjang!', 'success');
        }
    };

    const addPrintToCart = (item, qty) => {
        if (!item || qty <= 0) {
            showToast('Pilih jenis cetakan dan masukkan jumlah lembar yang benar.', 'warning');
            return;
        }
        const existingItem = cart.find(c => c.name === item.name && c.type === 'service');
        if (existingItem) {
            updateQty(existingItem.id, existingItem.quantity + qty);
            showToast('Keranjang diperbarui!', 'success');
        } else {
            const newItem = {
                id: `print-${Date.now()}-${Math.random()}`,
                name: item.name,
                sellPrice: item.price,
                quantity: qty,
                type: 'service'
            };
            setCart(prev => [...prev, newItem]);
            showToast('Print ditambahkan ke keranjang!', 'success');
        }
        setPrintQty(0);
    };

    // Modals
    const toggleDiscountModal = () => setDiscountModalOpen(!isDiscountModalOpen);
    const openPayment = () => { if (cart.length > 0) setPaymentModalOpen(true); };
    const closePaymentModal = () => {
        setPaymentModalOpen(false);
        if (transactionComplete) {
            setCart([]);
            setGlobalDiscount(0);
            setTransactionComplete(null);
            setAmountPaid('');
        }
    };

    const handleDirectPrint = async (transaction) => {
        if (!printerSettings.printerName && !isMobile) {
            showToast('Printer belum dikonfigurasi di Pengaturan', 'warning');
            return;
        }

        try {
            const settings = db.getAll('settings').reduce((obj, s) => ({ ...obj, [s.key]: s.value }), {});
            const receiptText = generateRawReceipt(transaction, {
                name: settings.store_name || 'Abadi Jaya',
                address: settings.store_address || '',
                phone: settings.store_phone || '',
                footer: settings.receipt_footer || '',
                userName: user?.name || 'Kasir'
            }, printerSettings.printerSize);

            if (isMobile) {
                printViaRawBT(receiptText);
            } else {
                await api.post('/print/receipt', {
                    text: receiptText,
                    printerName: printerSettings.printerName,
                    raw: printerSettings.printerSize === 'lx310',
                    mode: printerSettings.printerSize === 'inkjet' ? 'inkjet' : 'normal',
                    paperSize: printerSettings.paperSize
                });
                showToast('Struk berhasil dicetak', 'success');
            }
        } catch (err) {
            console.error('Print error:', err);
            const backendMsg = err.response?.data?.message || err.message;
            showToast(`Gagal mencetak struk: ${backendMsg}`, 'error');
        }
    };

    const openCashDrawer = async () => {
        if (!printerSettings.printerName) return;
        try {
            await api.post('/print/open-drawer', { printerName: printerSettings.printerName });
        } catch (err) { }
    };

    const handleConfirmPayment = async () => {
        const total = subtotal - globalDiscount;
        const paid = paymentMethod === 'tunai' ? parseFloat(amountPaid) : total;

        const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
        const customerName = selectedCustomerId === 'manual' ? (manualCustomerName || 'Pelanggan Baru') : (selectedCustomer?.name || 'Umum');

        const transaction = {
            invoiceNo: generateInvoice(),
            date: new Date().toISOString(),
            customerId: selectedCustomerId === 'manual' ? null : selectedCustomerId,
            customerName: customerName,
            type: cart.some(c => c.type === 'fotocopy' || c.type === 'service') ? 'service' : 'sale',
            items: cart.map(item => ({
                id: item.type === 'atk' ? item.id : null,
                name: item.name,
                qty: item.quantity,
                price: item.sellPrice,
                subtotal: item.sellPrice * item.quantity,
                discount: item.discount || 0,
                source: item.type === 'atk' ? 'atk' : 'fc' // Treat service as fc logic
            })),
            subtotal,
            discount: globalDiscount,
            total,
            paymentType: paymentMethod,
            paid: paid,
            changeAmount: paid - total,
            status: 'completed'
        };

        try {
            const res = await api.post('/transactions', transaction);
            transaction.id = res.data.id;

            // Update local stock for display (physical products only)
            setProducts(prev => prev.map(p => {
                const cartItem = cart.find(ci => ci.id === p.id);
                if (cartItem && p.type !== 'fotocopy' && p.type !== 'service') {
                    return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
                }
                return p;
            }));

            setTransactionComplete(transaction);

            if (isMobile || printerSettings.autoPrint) {
                handleDirectPrint(transaction);
            }
            if (paymentMethod === 'tunai') {
                openCashDrawer();
            }

            // Re-fetch transactions or just clear
            setCart([]);
            setGlobalDiscount(0);
        } catch (error) {
            showToast('Gagal memproses transaksi: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    const saveQueue = async () => {
        if (cart.length === 0) return;

        const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
        const customerName = selectedCustomerId === 'manual' ? (manualCustomerName || 'Pelanggan Baru') : (selectedCustomer?.name || 'Umum');

        const queueItem = {
            customerId: selectedCustomerId === 'manual' ? null : selectedCustomerId,
            customerName: customerName,
            title: cart.map(i => i.name).join(', ').substring(0, 50) + (cart.length > 1 ? '...' : ''),
            items: cart,
            status: 'produksi',
            type: 'digital',
            createdAt: new Date().toISOString()
        };

        try {
            await api.post('/print-orders', queueItem).catch(() => api.post('/spk', queueItem));
            showToast('Antrean disimpan.', 'success');
            setCart([]);
            setGlobalDiscount(0);
        } catch (error) {
            showToast('Gagal menyimpan antrean: Pastikan endpoint exists.', 'error');
        }
    };

    // Keyboard Shortcuts
    useKeyboardShortcuts({
        'F1': () => setActiveServiceTab('fotocopy'),
        'F2': () => setActiveServiceTab('jilid'),
        'F3': () => setActiveServiceTab('print'),
        'F5': () => searchInputRef.current?.focus(),
        'F9': () => toggleDiscountModal(),
        'F10': () => openPayment(),
        'F12': () => saveQueue(),
        'Escape': () => {
            if (isPaymentModalOpen) closePaymentModal();
            else if (isDiscountModalOpen) toggleDiscountModal();
            else if (isCustomerModalOpen) setCustomerModalOpen(false);
            else if (cart.length > 0) {
                Swal.fire({
                    title: 'Batal Transaksi?',
                    text: 'Semua barang di keranjang akan dihapus.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Ya, Batalkan!',
                    cancelButtonText: 'Kembali',
                    customClass: {
                        confirmButton: 'bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-xl ml-3',
                        cancelButton: 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl',
                        popup: 'dark:bg-slate-800 dark:text-white rounded-3xl',
                        title: 'dark:text-white'
                    },
                    buttonsStyling: false
                }).then((result) => {
                    if (result.isConfirmed) {
                        setCart([]);
                        setGlobalDiscount(0);
                    }
                });
            }
        },
    });

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 flex min-h-screen w-full flex-col overflow-x-hidden">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-2.5 sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => {
                        window.dispatchEvent(new Event('toggleSidebar'));
                    }} className="lg:hidden flex items-center justify-center p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-xl">menu</span>
                    </button>
                    {!isMobile && (
                        <div className="flex items-center justify-center size-10 bg-primary rounded-lg text-white font-bold shadow-md shadow-primary/20">
                            <span className="material-symbols-outlined text-2xl">point_of_sale</span>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold leading-none tracking-tight">Kasir <span className="text-primary font-bold">Terpadu</span></h1>
                    </div>
                </div>

                <nav className="flex-1 justify-center gap-4 xl:gap-8 hidden md:flex items-center">
                    <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-primary font-bold border-b-2 border-primary py-2 px-2 transition-colors hover:text-primary-dark">
                        <span className="material-symbols-outlined text-xl">home_app_logo</span> Beranda
                    </button>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <span className="material-symbols-outlined text-lg">calendar_today</span>
                            <span className="text-xs font-bold uppercase tracking-widest">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                        <div className="flex items-center gap-1.5 text-primary font-bold">
                            <span className="material-symbols-outlined text-lg">schedule</span>
                            <span className="text-xs font-bold tracking-widest">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                    </div>
                </nav>

                {/* Right: Actions & User (Desktop) */}
                <div className="hidden md:flex items-center gap-6 justify-end shrink-0">
                    {/* Action Pills */}
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-full border border-slate-100 dark:border-slate-700">
                        <button onClick={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:text-primary hover:shadow-sm transition-all" title="Ganti Tema">
                            <span className="material-symbols-outlined text-[18px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                        </button>
                        <button onClick={toggleFullScreen} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:text-primary hover:shadow-sm transition-all" title="Layar Penuh (F11)">
                            <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                        </button>
                        <button onClick={openCashDrawer} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:text-primary hover:shadow-sm transition-all" title="Buka Laci Kasir (F8)">
                            <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
                        </button>
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-700">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold ring-2 ring-white dark:ring-slate-900 shadow-sm">
                            {user?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="hidden lg:block text-sm">
                            <div className="font-bold text-slate-800 dark:text-white capitalize leading-tight">{user?.name || 'Admin'}</div>
                            <div className="text-[11px] font-medium text-slate-500 mt-0.5 capitalize">{user?.role || 'Kasir'}</div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden h-[calc(100vh-64px-28px)] flex-col lg:flex-row">
                {/* Left Content (Services & Products) */}
                <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 gap-6 relative">
                    {/* Services Tabs */}
                    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 sm:p-6 shadow-sm flex-1 flex flex-col">
                        <div className="flex border-b text-sm border-slate-200 dark:border-slate-800 overflow-x-auto hide-scrollbar mb-6">
                            <button onClick={() => setActiveServiceTab('fotocopy')} className={`flex-1 min-w-[140px] pb-3 flex items-center justify-center gap-2 border-b-2 font-bold transition-all ${activeServiceTab === 'fotocopy' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeServiceTab === 'fotocopy' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>F1</span>
                                <span className="material-symbols-outlined text-[20px]">content_copy</span> Fotocopy
                            </button>
                            <button onClick={() => setActiveServiceTab('jilid')} className={`flex-1 min-w-[140px] pb-3 flex items-center justify-center gap-2 border-b-2 font-bold transition-all ${activeServiceTab === 'jilid' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeServiceTab === 'jilid' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>F2</span>
                                <span className="material-symbols-outlined text-[20px]">book</span> Jilid
                            </button>
                            <button onClick={() => setActiveServiceTab('print')} className={`flex-1 min-w-[140px] pb-3 flex items-center justify-center gap-2 border-b-2 font-bold transition-all ${activeServiceTab === 'print' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeServiceTab === 'print' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>F3</span>
                                <span className="material-symbols-outlined text-[20px]">print</span> PRINT
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col">
                            {activeServiceTab === 'fotocopy' && (
                                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                                    {/* Options Left Side */}
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Jenis Kertas</h3>
                                            <div className="flex flex-wrap gap-2 sm:gap-4">
                                                {['HVS A4', 'HVS F4', 'HVS A3'].map(p => (
                                                    <button key={p} onClick={() => setFcPaper(p)} className={`flex-1 min-w-[100px] sm:min-w-0 py-3 rounded-xl text-sm font-bold transition-all border-2 ${fcPaper === p ? 'bg-primary/5 text-primary border-primary' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:border-primary/30'} shadow-sm`}>
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-4 sm:gap-8 flex-col sm:flex-row">
                                            <div className="flex-1">
                                                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Warna</h3>
                                                <div className="flex gap-2 sm:gap-4">
                                                    {[{ v: 'bw', l: 'B/W' }, { v: 'color', l: 'Warna' }].map(c => (
                                                        <button key={c.v} onClick={() => setFcColor(c.v)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border-2 ${fcColor === c.v ? 'bg-primary/5 text-primary border-primary' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:border-primary/30'} shadow-sm`}>
                                                            {c.l}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Sisi</h3>
                                                <div className="flex gap-2 sm:gap-4">
                                                    {[{ v: '1', l: '1 Sisi' }, { v: '2', l: 'Bolak' }].map(s => (
                                                        <button key={s.v} onClick={() => setFcSide(s.v)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border-2 ${fcSide === s.v ? 'bg-primary/5 text-primary border-primary' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:border-primary/30'} shadow-sm`}>
                                                            {s.l}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Jumlah Lembar</h3>
                                            <div className="flex items-center gap-3 w-full sm:w-2/3">
                                                <button onClick={() => setFcQty(Math.max(0, fcQty - 1))} className="size-10 sm:size-12 shrink-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-center font-bold text-xl transition-colors">
                                                    <span className="material-symbols-outlined">remove</span>
                                                </button>
                                                <input type="number" value={fcQty || ''} onChange={(e) => setFcQty(parseInt(e.target.value) || 0)} className="flex-1 h-10 sm:h-12 text-center text-xl font-bold border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:ring-0 focus:border-primary dark:bg-slate-900 uppercase" placeholder="0" />
                                                <button onClick={() => setFcQty(fcQty + 1)} className="size-10 sm:size-12 shrink-0 bg-primary hover:bg-primary/90 text-white rounded-xl flex items-center justify-center font-bold text-xl transition-colors shadow-sm shadow-primary/30">
                                                    <span className="material-symbols-outlined">add</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing Right Side */}
                                    <div className="lg:w-80 xl:w-96 shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-[28px] p-6 sm:p-8 flex flex-col justify-center text-center relative border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <div className="mb-6">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Harga Satuan</h4>
                                            <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
                                                {formatRupiah(getFcUnitPrice(fcPaper, fcColor, fcSide))}
                                            </div>
                                        </div>
                                        <div className="w-full h-px bg-slate-200 dark:bg-slate-700 mb-6"></div>
                                        <div className="mb-8">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Subtotal Layanan</h4>
                                            <div className="text-3xl sm:text-4xl font-black text-primary">
                                                {formatRupiah(getFcUnitPrice(fcPaper, fcColor, fcSide) * fcQty)}
                                            </div>
                                        </div>
                                        <button onClick={() => addFotocopyToCart(fcPaper, fcColor, fcSide, fcQty)} className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                                            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                                            Tambah ke Keranjang
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeServiceTab === 'jilid' && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {bindingPrices.map(item => (
                                        <div key={item.id} onClick={() => addJilidToCart(item)} className="group cursor-pointer p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary hover:bg-primary/5 transition-all text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 shadow-sm">
                                            <span className="material-symbols-outlined text-primary mb-2 text-3xl">auto_stories</span>
                                            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">{item.name}</h3>
                                            <p className="text-xs mt-1 font-bold text-primary">{formatRupiah(item.price)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeServiceTab === 'print' && (
                                <div className="bg-slate-950/30 backdrop-blur-sm rounded-[28px] border border-slate-800/50 p-6 sm:p-8 flex flex-col lg:flex-row gap-8 shadow-xl">
                                    <div className="flex-1 space-y-8">
                                        <div>
                                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Pilih Spesifikasi Cetak</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {printPrices.map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setPrintType(item)}
                                                        className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${printType?.id === item.id ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-2xl">print</span>
                                                        <span className="text-xs font-bold font-display uppercase tracking-widest text-center leading-tight">{item.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Jumlah Lembar</h3>
                                            <div className="flex items-center gap-3 w-full sm:w-2/3">
                                                <button onClick={() => setPrintQty(Math.max(0, printQty - 1))} className="size-10 sm:size-12 shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex items-center justify-center font-bold text-xl transition-colors"><span className="material-symbols-outlined">remove</span></button>
                                                <input type="number" value={printQty || ''} onChange={(e) => setPrintQty(parseInt(e.target.value) || 0)} className="flex-1 h-10 sm:h-12 text-center text-xl font-bold bg-slate-900 border-2 border-slate-800 rounded-xl focus:border-primary text-white" placeholder="0" />
                                                <button onClick={() => setPrintQty(printQty + 1)} className="size-10 sm:size-12 shrink-0 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center font-bold text-xl transition-colors"><span className="material-symbols-outlined">add</span></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:w-80 xl:w-96 shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-[28px] p-6 sm:p-8 flex flex-col justify-center text-center border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <div className="mb-6">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Harga Satuan</h4>
                                            <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">{formatRupiah(printType?.price || 0)}</div>
                                        </div>
                                        <div className="w-full h-px bg-slate-200 dark:bg-slate-700 mb-6"></div>
                                        <div className="mb-8">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Subtotal Layanan</h4>
                                            <div className="text-3xl sm:text-4xl font-black text-primary">{formatRupiah((printType?.price || 0) * printQty)}</div>
                                        </div>
                                        <button onClick={() => addPrintToCart(printType, printQty)} className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-primary/25">
                                            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span> Tambah ke Keranjang
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Retail Products */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold">Produk Retail ATK</h2>
                                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 uppercase tracking-tighter">F5 - Cari ATK</span>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                ref={searchInputRef}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-primary text-base transition-all shadow-sm"
                                placeholder="Scan Barcode atau ketik nama produk..."
                                type="text"
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredProducts.map(p => (
                                <div key={p.id} onClick={() => addToCart(p)} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-primary transition-all cursor-pointer flex flex-col gap-2">
                                    <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden relative">
                                        {p.image ? (
                                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-4xl text-slate-400">inventory_2</span>
                                        )}
                                        {p.stock <= 5 && (
                                            <div className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Sisa {p.stock}</div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm truncate" title={p.name}>{p.name}</h4>
                                        <p className="text-primary font-bold text-sm">{formatRupiah(p.sellPrice)}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Stok: {p.stock} {p.unit}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Cart */}
                <aside className={`fixed inset-y-0 right-0 z-50 lg:z-auto lg:relative w-[85vw] sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl transition-transform duration-300 ${isMobile && !isCartOpen ? 'translate-x-full' : 'translate-x-0'}`}>
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl leading-none font-bold flex flex-col xl:flex-row xl:items-center gap-1 xl:gap-3">
                                <div className="flex items-center gap-2">
                                    {isMobile && (
                                        <button onClick={() => setIsCartOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-800"><span className="material-symbols-outlined mt-1">close</span></button>
                                    )}
                                    Ringkasan
                                </div>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block whitespace-nowrap">
                                    {transactionComplete ? transactionComplete.invoiceNo : draftInvoiceId}
                                </span>
                            </h2>
                            <button onClick={removeAll} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Kosongkan Keranjang">
                                <span className="material-symbols-outlined">delete_sweep</span>
                            </button>
                        </div>
                        <div className="text-[10px] font-bold tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 dark:border-emerald-900/50 dark:bg-emerald-900/20 px-2 py-0.5 rounded ml-8 lg:ml-0 inline-flex items-center gap-1">
                            <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            TERMINAL ACTIVE
                        </div>
                        {/* Customer Button Modern */}
                        <div className="mt-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Pelanggan</label>
                            <button
                                onClick={() => setCustomerModalOpen(true)}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all text-left shadow-sm group"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <FiUserPlus size={16} />
                                    </div>
                                    <div className="flex flex-col truncate">
                                        <span className="text-sm font-bold text-slate-800 dark:text-white truncate">
                                            {selectedCustomerId === 'manual' ? (manualCustomerName || 'Pelanggan Baru (Manual)') :
                                                (customers.find(c => c.id === selectedCustomerId)?.name || 'Umum / Tanpa Nama')}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-500">
                                            {selectedCustomerId ? 'Klik untuk mengubah pelanggan' : 'Pilih data pelanggan'}
                                        </span>
                                    </div>
                                </div>
                                <FiChevronRight className="text-slate-400 group-hover:text-primary transition-colors shrink-0" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                                <span className="material-symbols-outlined text-6xl">shopping_basket</span>
                                <p className="font-semibold text-sm">Keranjang Masih Kosong</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm p-3 rounded-xl hover:border-slate-300 transition-colors">
                                    <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                                        <span className="material-symbols-outlined">
                                            {item.type === 'fotocopy' ? 'content_copy' : item.type === 'service' ? 'book' : 'inventory_2'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-sm font-bold truncate pr-4 relative">
                                            {item.name}
                                            <button onClick={() => updateQty(item.id, -item.quantity)} className="absolute right-0 top-0 text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-sm">close</span></button>
                                        </h5>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                                <button onClick={() => updateQty(item.id, -1)} className="size-6 flex items-center justify-center bg-white dark:bg-slate-700 shadow-sm rounded text-slate-600 hover:text-red-500 transition-colors">-</button>
                                                <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQty(item.id, 1)} className="size-6 flex items-center justify-center bg-white dark:bg-slate-700 shadow-sm rounded text-slate-600 hover:text-primary transition-colors">+</button>
                                            </div>
                                            <div className="text-sm font-bold text-slate-800 dark:text-white">
                                                {formatRupiah(item.sellPrice * item.quantity)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 space-y-4 shrink-0">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Subtotal</span>
                                <span className="font-semibold">{formatRupiah(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-slate-500 text-sm font-medium">Diskon</span>
                                <button onClick={toggleDiscountModal} className="flex items-center gap-1.5 text-xs text-primary font-bold border border-primary/30 px-2 py-1 rounded bg-white hover:bg-primary/5 transition-colors">
                                    <span className="bg-primary/10 text-primary px-1 rounded text-[10px]">F9</span>
                                    <span>{globalDiscount > 0 ? `-${formatRupiah(globalDiscount)}` : 'Tambah Diskon'}</span>
                                </button>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-end mb-4">
                                <span className="font-bold text-slate-600 dark:text-slate-400">Total Tagihan</span>
                                <span className="text-[1.7rem] md:text-3xl leading-none font-black text-primary drop-shadow-sm">{formatRupiah(subtotal - globalDiscount)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <button onClick={saveQueue} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-[11px] lg:text-sm hover:bg-slate-100 transition-colors bg-white shadow-sm text-slate-700">
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 rounded text-[10px]">F12</span>
                                    <span className="material-symbols-outlined text-base">save</span> <span className="hidden xl:inline">Simpan</span> Antrean
                                </button>
                                <button onClick={() => onNavigate('spk-list')} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/20 font-bold text-[11px] lg:text-sm hover:bg-primary/5 transition-colors bg-white dark:bg-slate-800 shadow-sm text-primary">
                                    <FiList className="text-base" /> <span className="hidden xl:inline">Daftar</span> Antrean
                                </button>
                            </div>
                            <button onClick={openPayment} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3 transition-transform active:scale-95">
                                <span className="bg-white/20 px-1.5 rounded text-xs leading-none">F10</span>
                                <span>Bayar Keranjang</span>
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Overlay for mobile cart */}
            {isMobile && isCartOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsCartOpen(false)}
                />
            )}

            {/* Float trigger for mobile cart inside `<main>` overlap or sticky at bottom if needed, currently placed in header */}
            {isMobile && cart.length > 0 && !isCartOpen && (
                <button onClick={() => { setIsCartOpen(true); }} className="fixed bottom-16 right-6 z-40 size-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center text-2xl animate-bounce">
                    <span className="material-symbols-outlined">shopping_cart_checkout</span>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full size-6 flex items-center justify-center border-2 border-white">{cart.length}</span>
                </button>
            )}

            {/* Footer / Hotkeys Banner */}
            <footer className="h-7 bg-slate-900 border-t border-slate-800 text-slate-300 text-[10px] font-medium flex items-center justify-between px-4 shrink-0 overflow-x-auto hide-scrollbar z-45 relative">
                <div className="flex items-center gap-5 min-w-max">
                    <div className="flex items-center gap-1.5 text-primary-light font-bold">
                        <span className="material-symbols-outlined text-[14px]">keyboard</span>
                        BANTUAN TOMBOL:
                    </div>
                    {['F1', 'Fotocopy', 'F2', 'Jilid', 'F3', 'Cetak', 'F5', 'Cari ATK / Barcode Auto', 'F8', 'Laci Uang', 'F9', 'Diskon', 'F10', 'Bayar', 'F11', 'Layar Penuh', 'F12', 'Simpan List', 'ESC', 'Batal'].map((key, i) => (
                        <div key={i} className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap">
                            {i % 2 === 0 ? (
                                <span className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-[9px] font-bold text-slate-400 capitalize">
                                    {key}
                                </span>
                            ) : (
                                <span>{key}</span>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-6 pl-4 font-mono text-[9px] text-slate-500 font-bold whitespace-nowrap min-w-max">
                    <span>KASIR TERPADU V2.4</span>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        PRN: EPSON LX-310
                    </div>
                </div>
            </footer>

            <footer className="h-8 bg-slate-900 text-slate-400 flex items-center justify-between px-6 text-[10px] uppercase tracking-widest font-bold font-mono">
                <div className="flex gap-6 shrink-0">
                    <span>Kasir Terpadu v2.4</span>
                </div>
                <div className="flex gap-6 shrink-0 text-right">
                    <span className="flex items-center gap-1 justify-end"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> {printerSettings.printerName ? `PRN: ${printerSettings.printerName}` : 'Ready'}</span>
                </div>
            </footer>

            {/* Modals from before */}
            <Modal isOpen={isDiscountModalOpen} onClose={toggleDiscountModal} title="Input Diskon / Potongan">
                <div className="space-y-4 pt-4">
                    <label className="text-sm font-bold text-slate-700">Nominal Diskon (Rp)</label>
                    <input
                        type="number"
                        value={globalDiscount}
                        onChange={e => setGlobalDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 text-2xl font-bold text-primary focus:border-primary outline-none"
                        placeholder="0"
                        autoFocus
                    />
                    <div className="grid grid-cols-4 gap-2">
                        {[500, 1000, 5000, 10000].map(v => (
                            <button key={v} onClick={() => setGlobalDiscount(v)} className="py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold hover:bg-slate-100 hover:text-primary transition-colors">+{formatRupiah(v).replace('Rp ', '')}</button>
                        ))}
                    </div>
                    <button onClick={toggleDiscountModal} className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg mt-4 hover:bg-primary/90">
                        Terapkan Diskon
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isPaymentModalOpen} onClose={closePaymentModal} title={transactionComplete ? 'TRANSAKSI BERHASIL' : 'PROSES PEMBAYARAN'}>
                {transactionComplete ? (
                    <div className="text-center py-6 flex flex-col items-center gap-4">
                        <div className="size-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
                            <FiCheckCircle size={48} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">Pembayaran Selesai</h3>
                            <p className="text-sm text-slate-500 mt-1 font-medium">{transactionComplete.invoiceNo}</p>
                        </div>
                        <div className="w-full space-y-3 mt-4">
                            <button onClick={() => handleDirectPrint(transactionComplete)} className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:bg-primary/90">
                                <FiPrinter size={20} /> Cetak Struk
                            </button>
                            <button onClick={closePaymentModal} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                Transaksi Baru
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 pt-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-500">Total Tagihan</span>
                                <span className="text-3xl font-black text-primary">{formatRupiah(subtotal - globalDiscount)}</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-3">Metode Pembayaran</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[{ id: 'tunai', icon: 'payments', label: 'Tunai' }, { id: 'transfer', icon: 'account_balance', label: 'Transfer' }, { id: 'qris', icon: 'qr_code_scanner', label: 'QRIS' }].map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setPaymentMethod(m.id)}
                                        className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === m.id ? 'bg-primary/5 border-primary text-primary' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-500'}`}
                                    >
                                        <span className="material-symbols-outlined">{m.icon}</span>
                                        <span className="text-xs font-bold">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentMethod === 'tunai' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-3">Uang Diterima</label>
                                <input
                                    type="number"
                                    value={amountPaid}
                                    onChange={e => setAmountPaid(e.target.value)}
                                    className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary text-2xl font-bold outline-none"
                                    placeholder="0"
                                    autoFocus
                                />
                                <div className="grid grid-cols-4 gap-2 mt-3">
                                    {[50000, 100000, 150000, (subtotal - globalDiscount)].map((v, i) => (
                                        <button key={i} onClick={() => setAmountPaid(v)} className="py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 text-slate-600 dark:text-slate-300">
                                            {formatRupiah(v).replace('Rp ', '')}
                                        </button>
                                    ))}
                                </div>
                                {Number(amountPaid) >= (subtotal - globalDiscount) && (
                                    <div className="mt-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 text-orange-700 dark:text-orange-400 flex justify-between items-center">
                                        <span className="text-sm font-bold uppercase tracking-widest">Kembalian</span>
                                        <span className="text-2xl font-black">{formatRupiah(Number(amountPaid) - (subtotal - globalDiscount))}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleConfirmPayment}
                            disabled={paymentMethod === 'tunai' && Number(amountPaid) < (subtotal - globalDiscount)}
                            className="w-full py-4 bg-primary disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                            Proses Transaksi Selesai
                        </button>
                    </div>
                )}
            </Modal>

            {/* Customer Selection Modal */}
            <Modal isOpen={isCustomerModalOpen} onClose={() => setCustomerModalOpen(false)} title="Pilih Data Pelanggan">
                <div className="flex flex-col h-[65vh] md:h-[500px]">
                    <div className="px-1 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="relative">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari nama atau telepon pelanggan..."
                                value={customerSearch}
                                onChange={e => setCustomerSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary outline-none text-sm dark:bg-slate-900"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-1 space-y-2 py-4 hide-scrollbar">
                        {/* Option: Default / Umum */}
                        <div
                            onClick={() => { setSelectedCustomerId(''); setCustomerModalOpen(false); }}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedCustomerId === '' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                <FiCheckCircle size={20} className={selectedCustomerId === '' ? 'text-primary' : 'opacity-0'} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 dark:text-white">Umum / Tanpa Nama</h4>
                                <p className="text-xs text-slate-500 mt-0.5">Transaksi anonim (default)</p>
                            </div>
                        </div>

                        {/* Customer List */}
                        {customers
                            .filter(c => (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone || '').includes(customerSearch))
                            .map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => { setSelectedCustomerId(c.id); setCustomerModalOpen(false); }}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedCustomerId === c.id ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {c.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800 dark:text-white">{c.name}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">{c.phone || c.email || 'Tanpa Kontak'}</p>
                                    </div>
                                    {selectedCustomerId === c.id && <FiCheckCircle size={20} className="text-primary shrink-0" />}
                                </div>
                            ))
                        }
                    </div>

                    {/* Manual Override Action */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 shrink-0 px-1 mt-2">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Input Nama Cepat (Sekali Transaksi)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Ketik nama pelanggan baru..."
                                    value={manualCustomerName}
                                    onChange={e => setManualCustomerName(e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:border-primary dark:bg-slate-900"
                                />
                                <button
                                    onClick={() => {
                                        if (manualCustomerName.trim().length > 0) {
                                            setSelectedCustomerId('manual');
                                            setCustomerModalOpen(false);
                                        } else {
                                            Swal.fire({
                                                icon: 'warning',
                                                title: 'Nama Kosong',
                                                text: 'Ketik nama terlebih dahulu',
                                                customClass: {
                                                    confirmButton: 'bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl',
                                                    popup: 'dark:bg-slate-800 dark:text-white rounded-3xl',
                                                    title: 'dark:text-white'
                                                },
                                                buttonsStyling: false
                                            });
                                        }
                                    }}
                                    className="px-4 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                                >
                                    Pilih
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
