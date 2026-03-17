import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';
import db from '../db';
import seedData from '../seed';
import { formatRupiah, generateInvoice, generateRawReceipt, printViaRawBT } from '../utils';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import Modal from '../components/Modal';
import { FiCheckCircle, FiPrinter } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';

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
        seedData();
        setProducts(db.getAll('products'));
        setBindingPrices(db.getAll('binding_prices'));
        setPrintPrices(db.getAll('print_prices'));
        setCustomers(db.getAll('customers'));
        api.get('/transactions/fotocopy-prices')
            .then(res => setFotocopyPrices(res.data))
            .catch(() => setFotocopyPrices(db.getAll('fotocopy_prices')));

        const allSettings = db.getAll('settings');
        const sMap = {};
        allSettings.forEach(s => { sMap[s.key] = s.value; });
        setPrinterSettings({
            autoPrint: sMap.auto_print === 'true',
            printerName: sMap.printer_name || '',
            printerSize: sMap.printer_size || '80mm',
            paperSize: sMap.paper_size || 'A4'
        });
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
        if (window.confirm("Kosongkan keranjang?")) {
            setCart([]);
            setGlobalDiscount(0);
        }
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
        const existingItem = cart.find(c => c.name === item.name && c.type === 'service');
        if (existingItem) {
            updateQty(existingItem.id, 1);
            return;
        }
        const newItem = {
            id: `jilid-${Date.now()}-${Math.random()}`,
            name: `${item.name}`,
            sellPrice: item.price,
            quantity: 1,
            type: 'service'
        };
        setCart(prev => [...prev, newItem]);
        showToast('Ditambahkan ke keranjang!', 'success')
    };

    const addPrintToCart = (item) => {
        const existingItem = cart.find(c => c.name === item.name && c.type === 'service');
        if (existingItem) {
            updateQty(existingItem.id, 1);
            return;
        }
        const newItem = {
            id: `print-${Date.now()}-${Math.random()}`,
            name: item.name,
            sellPrice: item.price,
            quantity: 1,
            type: 'service'
        };
        setCart(prev => [...prev, newItem]);
        showToast('Ditambahkan ke keranjang!', 'success')
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
            showToast('Gagal mencetak struk', 'error');
        }
    };

    const openCashDrawer = async () => {
        if (!printerSettings.printerName) return;
        try {
            await api.post('/print/open-drawer', { printerName: printerSettings.printerName });
        } catch (err) { }
    };

    const handleConfirmPayment = () => {
        const total = subtotal - globalDiscount;
        const paid = paymentMethod === 'tunai' ? parseFloat(amountPaid) : total;

        const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
        const customerName = selectedCustomerId === 'manual' ? (manualCustomerName || 'Pelanggan Baru') : (selectedCustomer?.name || 'Umum');

        const transaction = {
            id: `TRX-${Date.now()}`,
            invoiceNo: generateInvoice(),
            date: new Date().toISOString(),
            customerId: selectedCustomerId === 'manual' ? null : selectedCustomerId,
            customerName: customerName,
            items: cart,
            subtotal,
            discount: globalDiscount,
            total,
            paymentMethod,
            amountPaid: paid,
            change: paid - total,
            status: 'completed'
        };

        db.insert('transactions', transaction);

        cart.forEach(item => {
            if (item.type !== 'fotocopy' && item.type !== 'service') {
                const p = db.getById('products', item.id);
                if (p) db.update('products', item.id, { ...p, stock: p.stock - item.quantity });
            }
        });

        setTransactionComplete(transaction);

        if (printerSettings.autoPrint && !isMobile) {
            handleDirectPrint(transaction);
        }
        if (paymentMethod === 'tunai') {
            openCashDrawer();
        }
    };

    const saveQueue = () => {
        if (cart.length === 0) return;

        const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
        const customerName = selectedCustomerId === 'manual' ? (manualCustomerName || 'Pelanggan Baru') : (selectedCustomer?.name || 'Umum');

        const queueItem = {
            id: `Q-${Date.now()}`,
            customerId: selectedCustomerId === 'manual' ? null : selectedCustomerId,
            customerName: customerName,
            title: cart.map(i => i.name).join(', ').substring(0, 50) + (cart.length > 1 ? '...' : ''),
            items: cart,
            status: 'produksi',
            type: 'digital',
            createdAt: new Date().toISOString()
        };
        db.insert('dp_tasks', queueItem);
        showToast('Antrean disimpan.', 'success');
        setCart([]);
        setGlobalDiscount(0);
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
            else if (cart.length > 0 && window.confirm("Batal transaksi?")) {
                setCart([]);
                setGlobalDiscount(0);
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
                        <button onClick={toggleTheme} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:text-primary hover:shadow-sm transition-all" title="Ganti Tema">
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
                                        <div key={item.id} onClick={() => addJilidToCart(item)} className="group cursor-pointer p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary hover:bg-primary/5 transition-all text-center flex flex-col items-center justify-center">
                                            <span className="material-symbols-outlined text-primary mb-2 text-3xl">auto_stories</span>
                                            <h3 className="font-bold text-sm">{item.name}</h3>
                                            <p className="text-xs mt-1 font-bold text-primary">{formatRupiah(item.price)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeServiceTab === 'print' && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {printPrices.map(item => (
                                        <div key={item.id} onClick={() => addPrintToCart(item)} className="group cursor-pointer p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary hover:bg-primary/5 transition-all text-center flex flex-col items-center justify-center">
                                            <span className="material-symbols-outlined text-primary mb-2 text-3xl">print</span>
                                            <h3 className="font-bold text-sm">{item.name}</h3>
                                            <p className="text-xs mt-1 font-bold text-primary">{formatRupiah(item.price)}</p>
                                        </div>
                                    ))}
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
                        {/* Customer Dropdown */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Pelanggan</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <span className="material-symbols-outlined text-lg">person</span>
                                </div>
                                <select
                                    value={selectedCustomerId || ''}
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 appearance-none outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer"
                                >
                                    <option value="">Umum / Tanpa Nama</option>
                                    <option value="manual">+ Input Manual Baru</option>
                                    {customers.length > 0 && <optgroup label="Daftar Pelanggan" />}
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                                    <span className="material-symbols-outlined text-lg">keyboard_arrow_down</span>
                                </div>
                            </div>
                            {selectedCustomerId === 'manual' && (
                                <input
                                    type="text"
                                    placeholder="Ketik nama pelanggan..."
                                    value={manualCustomerName}
                                    onChange={(e) => setManualCustomerName(e.target.value)}
                                    className="mt-2 w-full px-4 py-2 rounded-xl border-2 border-primary/50 bg-primary/5 text-sm font-semibold outline-none focus:border-primary placeholder:font-normal"
                                    autoFocus
                                />
                            )}
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
                            <div className="grid grid-cols-1 gap-3 mb-3">
                                <button onClick={saveQueue} className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors bg-white shadow-sm text-slate-700">
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 rounded text-[10px]">F12</span>
                                    <span className="material-symbols-outlined text-lg">save</span> Simpan Antrean
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
                            <button onClick={closePaymentModal} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                                Selesai Berbelanja
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 pt-2">
                        <div className="bg-primary/5 p-6 rounded-2xl text-center border border-primary/20">
                            <p className="text-sm font-bold text-slate-500 uppercase mb-2">Total Tagihan</p>
                            <p className="text-4xl lg:text-5xl font-black text-primary drop-shadow-sm">{formatRupiah(subtotal - globalDiscount)}</p>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Metode Pembayaran</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['tunai', 'qris', 'transfer', 'piutang'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setPaymentMethod(m)}
                                        className={`py-3 rounded-xl border-2 font-bold uppercase text-sm transition-all ${paymentMethod === m ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentMethod === 'tunai' && (
                            <div>
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Uang Diterima (Rp)</label>
                                <input
                                    type="text"
                                    value={amountPaid ? 'Rp ' + Number(amountPaid).toLocaleString('id-ID') : ''}
                                    onChange={e => setAmountPaid(e.target.value.replace(/[^0-9]/g, ''))}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            if ((parseFloat(amountPaid) || 0) >= (subtotal - globalDiscount)) handleConfirmPayment();
                                        }
                                    }}
                                    placeholder="Rp 0"
                                    className="w-full p-4 border-2 border-slate-200 focus:border-primary rounded-xl text-3xl font-black text-center text-slate-800 outline-none"
                                    autoFocus
                                />
                                {amountPaid && (
                                    <div className="flex justify-between items-center mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-sm font-bold text-slate-500">Kembalian:</span>
                                        <span className={`text-xl font-black ${parseFloat(amountPaid) - (subtotal - globalDiscount) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {formatRupiah(parseFloat(amountPaid) - (subtotal - globalDiscount))}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            disabled={paymentMethod === 'tunai' && (parseFloat(amountPaid) || 0) < (subtotal - globalDiscount)}
                            onClick={handleConfirmPayment}
                            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${(paymentMethod !== 'tunai' || (parseFloat(amountPaid) || 0) >= (subtotal - globalDiscount))
                                ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            <span className="material-symbols-outlined">payments</span>
                            Proses Pembayaran
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
