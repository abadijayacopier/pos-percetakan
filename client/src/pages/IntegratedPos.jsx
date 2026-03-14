import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';
import db from '../db';
import seedData from '../seed';
import { formatRupiah, generateInvoice, generateRawReceipt, printViaRawBT } from '../utils';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import Modal from '../components/Modal';
import ThemeToggle from '../components/ThemeToggle';
import { FiCheckCircle, FiTrash2, FiPlus, FiMinus, FiSearch, FiBell, FiUser, FiPrinter, FiSave, FiChevronRight, FiTag, FiShoppingCart, FiFile, FiBook, FiPrinter as FiPrinterIcon, FiZap } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntegratedPos({ onNavigate, pageState, onFullscreenChange }) {
    const { user } = useAuth();
    const { showToast } = useToast();
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

    // Update isMobile on resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Service Form States
    const [fcPaper, setFcPaper] = useState('HVS A4');
    const [fcColor, setFcColor] = useState('bw');
    const [fcSide, setFcSide] = useState('1');
    const [fcQty, setFcQty] = useState(0);
    const [jilidType, setJilidType] = useState('Spiral');

    // Payment & Modal States
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('tunai');
    const [amountPaid, setAmountPaid] = useState('');
    const [transactionComplete, setTransactionComplete] = useState(null);
    const [isDiscountModalOpen, setDiscountModalOpen] = useState(false);
    const [globalDiscount, setGlobalDiscount] = useState(0);

    // Printer Settings
    const [printerSettings, setPrinterSettings] = useState({
        autoPrint: false,
        printerName: '',
        printerSize: '80mm',
        paperSize: 'A4'
    });

    // Search Input Ref for F5 focus
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

        // Load Printer Settings
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

    // Service Calc Logic (Ported from PosPage)
    const fcDiscountInfo = useMemo(() => {
        try {
            const settings = db.getAll('settings');
            const diskonStr = settings.find(s => s.key === 'fc_discounts')?.value;
            const diskonRules = diskonStr ? JSON.parse(diskonStr) : [];
            return diskonRules
                .filter(r => parseInt(fcQty) >= parseInt(r.minQty))
                .sort((a, b) => parseInt(b.minQty) - parseInt(a.minQty))[0] || null;
        } catch (e) {
            console.error("Error parsing fc_discounts", e);
            return null;
        }
    }, [fcQty]);

    const fcUnitPrice = useMemo(() => {
        const priceObj = fotocopyPrices.find(p => p.paper === fcPaper && p.color === fcColor && p.side === fcSide);
        return priceObj ? priceObj.price : 0;
    }, [fotocopyPrices, fcPaper, fcColor, fcSide]);

    const fcPrice = useMemo(() => {
        const discount = fcDiscountInfo ? parseInt(fcDiscountInfo.discountPerSheet) : 0;
        return Math.max(0, fcUnitPrice - discount);
    }, [fcUnitPrice, fcDiscountInfo]);

    const fcTotal = useMemo(() => fcPrice * fcQty, [fcPrice, fcQty]);

    // Barcode & Global Shortcut Listener
    useEffect(() => {
        const handleKeyPress = (e) => {
            // F8 (Drawer) and F11 (Fullscreen) should work even inside inputs in some cases, 
            // but usually we prevent them if an input is focused to avoid accidental triggers.
            // However, F11 is a system key.
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

            // Ignore barcode logic if in input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const now = Date.now();
            if (now - lastKeyTime.current > 100) {
                barcodeBuffer.current = '';
            }
            lastKeyTime.current = now;

            if (e.key === 'Enter') {
                if (barcodeBuffer.current.length > 3) {
                    const code = barcodeBuffer.current;
                    const product = products.find(p => p.code === code);
                    if (product) {
                        addToCart(product);
                        showToast(`Ditambahkan: ${product.name}`, 'success');
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
    }, [products, printerSettings]); // Added printerSettings to ensure openCashDrawer has latest state

    // Full Screen Toggle Function
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.log(err));
        } else {
            document.exitFullscreen().catch(err => console.log(err));
        }
    };

    // Full Screen Change Listener
    useEffect(() => {
        const handleFsChange = () => {
            if (onFullscreenChange) onFullscreenChange(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, [onFullscreenChange]);

    // Handle incoming items from other pages (e.g. Design Finalization)
    useEffect(() => {
        if (pageState?.autoAddToCart && !cart.find(c => c.id === pageState.autoAddToCart.id)) {
            setCart(prev => [...prev, pageState.autoAddToCart]);
            if (pageState.onItemAdded) pageState.onItemAdded();
        }
    }, [pageState, cart]);

    // Filtered Retail Products
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
                // Simple stock check for retail
                if (delta > 0 && item.stock && newQty > item.stock) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const removeAll = () => {
        setCart([]);
        setSelectedCustomerId(null);
        setManualCustomerName('');
    };

    // Modal Handlers
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

    // Service Action Handlers
    const addFotocopyToCart = () => {
        if (fcQty <= 0) return alert('Jumlah harus lebih dari 0');
        const newItem = {
            id: `fc-${Date.now()}`,
            name: `Fotocopy ${fcPaper} (${fcColor === 'bw' ? 'B/W' : 'Warna'}, ${fcSide === '1' ? '1 Sisi' : 'Bolak-balik'})`,
            sellPrice: fcPrice,
            quantity: fcQty,
            type: 'fotocopy',
            meta: { paper: fcPaper, color: fcColor, side: fcSide, unitPrice: fcUnitPrice, discount: fcDiscountInfo?.discountPerSheet || 0 }
        };
        setCart(prev => [...prev, newItem]);
        setFcQty(0);
    };

    const addJilidToCart = (item) => {
        const newItem = {
            id: `jilid-${Date.now()}`,
            name: `${item.name}`,
            sellPrice: item.price,
            quantity: 1,
            type: 'service'
        };
        setCart(prev => [...prev, newItem]);
    };

    const addPrintToCart = (item) => {
        const newItem = {
            id: `print-${Date.now()}`,
            name: item.name,
            sellPrice: item.price,
            quantity: 1,
            type: 'service'
        };
        setCart(prev => [...prev, newItem]);
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
                showToast('Struk berhasil dikirim ke printer', 'success');
            }
        } catch (err) {
            console.error('Print error:', err);
            showToast('Gagal mencetak struk ke hardware', 'error');
        }
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

        // Persist to DB
        db.insert('transactions', transaction);

        // Update stock for retail items
        cart.forEach(item => {
            if (item.type !== 'fotocopy' && item.type !== 'service') {
                const p = db.getById('products', item.id);
                if (p) db.update('products', item.id, { ...p, stock: p.stock - item.quantity });
            }
        });

        setTransactionComplete(transaction);

        // Auto Print if enabled and desktop
        if (printerSettings.autoPrint && !isMobile) {
            handleDirectPrint(transaction);
        }

        // Open Cash Drawer on Cash Payment
        if (paymentMethod === 'tunai') {
            openCashDrawer();
        }
    };

    const openCashDrawer = async () => {
        if (!printerSettings.printerName) {
            showToast('Printer belum diatur di Pengaturan', 'warning');
            return;
        }
        try {
            await api.post('/print/open-drawer', { printerName: printerSettings.printerName });
            showToast('Laci uang dibuka', 'success');
        } catch (err) {
            console.error('Drawer error:', err);
            // Non-critical error, just log
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
        showToast('Tugas disimpan ke antrean produksi.', 'success');
        setCart([]);
    };

    // Cart Calculation
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.sellPrice * item.quantity), 0), [cart]);

    // Keyboard Shortcuts (F1-F12 as per design)
    const shortcuts = useMemo(() => ({
        'F1': () => setActiveServiceTab('fotocopy'),
        'F2': () => setActiveServiceTab('jilid'),
        'F3': () => setActiveServiceTab('print'),
        // F8 & F11 are now handled in the global window listener for better reliability
        'F5': () => searchInputRef.current?.focus(),
        'F9': () => toggleDiscountModal(),
        'F10': () => openPayment(),
        'F12': () => saveQueue(),
        'Escape': () => {
            if (isPaymentModalOpen) closePaymentModal();
            else if (isDiscountModalOpen) toggleDiscountModal();
            else removeAll();
        },
    }), [cart, subtotal, globalDiscount, isPaymentModalOpen, isDiscountModalOpen]);

    useKeyboardShortcuts(shortcuts);

    return (
        <div className="flex h-screen w-full flex-col bg-slate-950 font-display text-slate-100 overflow-hidden relative">
            {/* Animated Background Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="relative z-50 flex h-20 items-center justify-between px-8 bg-slate-900/40 backdrop-blur-3xl border-b border-slate-800/50">
                <div className="flex items-center gap-6">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onNavigate('dashboard')}
                        className="flex items-center justify-center size-12 bg-slate-800/50 hover:bg-slate-800 rounded-2xl text-slate-300 transition-colors border border-slate-700/50 group"
                    >
                        <FiChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={24} />
                    </motion.button>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center size-10 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                                <FiZap className="text-xl" />
                            </div>
                            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                                Abadi Jaya <span className="text-blue-500">Terminal</span>
                            </h1>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic ml-13">Express Transaction Hub v4.0</p>
                    </div>
                </div>

                <nav className="hidden xl:flex items-center gap-4 px-6 py-2 bg-slate-950/50 rounded-[2rem] border border-slate-800/50 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="w-px h-4 bg-slate-800"></div>
                    <div className="flex items-center gap-2 text-blue-400">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span className="text-lg font-black tracking-tighter italic leading-none">
                            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                </nav>

                <div className="flex items-center gap-4">
                    {/* Cart Trigger (Mobile) */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCartOpen(!isCartOpen)}
                        className="lg:hidden relative flex items-center justify-center rounded-2xl h-12 w-12 bg-blue-600/10 text-blue-500 border border-blue-500/20"
                    >
                        <FiShoppingCart size={22} />
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white border-2 border-slate-950 shadow-lg">
                                {cart.length}
                            </span>
                        )}
                    </motion.button>

                    <div className="flex items-center gap-2">
                        <ThemeToggle className="hidden sm:flex" />
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={openCashDrawer}
                            title="Open Drawer (F8)"
                            className="hidden sm:flex items-center justify-center size-11 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-slate-400 hover:text-blue-500 transition-all"
                        >
                            <span className="material-symbols-outlined">inbox</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                            whileTap={{ scale: 0.95 }}
                            className="hidden sm:flex items-center justify-center size-11 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-slate-400 hover:text-blue-500 transition-all"
                        >
                            <FiBell size={18} />
                        </motion.button>
                    </div>

                    <div className="w-px h-8 bg-slate-800 mx-2"></div>

                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-black italic uppercase tracking-widest text-white leading-none mb-1">{user?.name || 'Administrator'}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none italic">Active Terminal 01</p>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="size-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-[2px] shadow-lg shadow-blue-500/20"
                        >
                            <div className="size-full rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden">
                                {user?.name ? (
                                    <span className="text-sm font-black italic">{user.name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
                                ) : (
                                    <FiUser className="text-blue-400" size={18} />
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* Overlay for mobile cart */}
            {isMobile && isCartOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsCartOpen(false)}
                />
            )}

            <main className="flex flex-1 overflow-hidden relative z-10">
                {/* Left Side: Services and Products */}
                <div className="flex-1 flex flex-col overflow-y-auto p-8 gap-8 hide-scrollbar">
                    {/* Service Sections (Tabbed) */}
                    <section className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-slate-800/50 p-2 shadow-2xl">
                        <div className="flex p-2 gap-2 overflow-x-auto hide-scrollbar">
                            {[
                                { id: 'fotocopy', label: 'Fotocopy', icon: 'content_copy', kbd: 'F1' },
                                { id: 'jilid', label: 'Jilid', icon: 'book', kbd: 'F2' },
                                { id: 'print', label: 'PRINT', icon: 'print', kbd: 'F3' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveServiceTab(tab.id)}
                                    className={`flex-1 min-w-[140px] py-4 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all duration-500 relative overflow-hidden group ${activeServiceTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                                        : 'bg-slate-950/30 text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 relative z-10">
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black italic uppercase ${activeServiceTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-600'
                                            }`}>{tab.kbd}</span>
                                        <span className="material-symbols-outlined text-2xl">{tab.icon}</span>
                                    </div>
                                    <span className="text-sm font-black italic uppercase tracking-widest relative z-10">{tab.label}</span>

                                    {activeServiceTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTabGlow"
                                            className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-transparent pointer-events-none"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="p-8">
                            <AnimatePresence mode="wait">
                                {activeServiceTab === 'fotocopy' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex flex-col gap-8 max-w-5xl mx-auto"
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            <div className="space-y-8">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block ml-1 italic leading-none">Paper Selection</label>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {['HVS A4', 'HVS F4', 'HVS A3'].map(p => (
                                                            <button
                                                                key={p}
                                                                onClick={() => setFcPaper(p)}
                                                                className={`py-4 rounded-[1.5rem] font-black italic uppercase text-xs border-2 transition-all duration-300 ${fcPaper === p ? 'border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10' : 'border-slate-800 bg-slate-950/30 text-slate-500 hover:border-slate-700'}`}
                                                            >
                                                                {p}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block ml-1 italic leading-none">Color Mode</label>
                                                        <div className="flex gap-3">
                                                            {[{ v: 'bw', l: 'B/W' }, { v: 'color', l: 'COLOR' }].map(c => (
                                                                <button key={c.v} onClick={() => setFcColor(c.v)} className={`flex-1 py-4 rounded-[1.5rem] font-black italic uppercase text-xs border-2 transition-all duration-300 ${fcColor === c.v ? 'border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10' : 'border-slate-800 bg-slate-950/30 text-slate-500 hover:border-slate-700'}`}>{c.l}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block ml-1 italic leading-none">Print Side</label>
                                                        <div className="flex gap-3">
                                                            {[{ v: '1', l: '1 SISI' }, { v: '2', l: 'BOLAK' }].map(s => (
                                                                <button key={s.v} onClick={() => setFcSide(s.v)} className={`flex-1 py-4 rounded-[1.5rem] font-black italic uppercase text-xs border-2 transition-all duration-300 ${fcSide === s.v ? 'border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10' : 'border-slate-800 bg-slate-950/30 text-slate-500 hover:border-slate-700'}`}>{s.l}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block ml-1 italic leading-none">Unit Quantity</label>
                                                    <div className="flex items-center gap-5">
                                                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setFcQty(Math.max(0, fcQty - 1))} className="size-14 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-2xl font-black italic hover:bg-slate-700 transition-colors shadow-lg">−</motion.button>
                                                        <input type="number" value={fcQty} onChange={e => setFcQty(Math.max(0, parseInt(e.target.value) || 0))} className="flex-1 h-14 bg-slate-950/50 border-2 border-slate-800 rounded-[1.5rem] text-center font-black italic text-2xl text-white focus:border-blue-500 outline-none transition-all shadow-inner" />
                                                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setFcQty(fcQty + 1)} className="size-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black italic hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20">+</motion.button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-950/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-slate-800/50 flex flex-col justify-between gap-8 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10" />

                                                <div className="text-center relative z-10">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 italic leading-none">Unit Pricing Structure</p>
                                                    <div className="flex flex-col items-center gap-1">
                                                        {fcDiscountInfo && (
                                                            <span className="text-sm text-rose-500 line-through opacity-50 font-black italic italic">{formatRupiah(fcUnitPrice)}</span>
                                                        )}
                                                        <span className="text-4xl font-black italic tracking-tighter text-white drop-shadow-md">{formatRupiah(fcPrice)}</span>
                                                    </div>
                                                    {fcDiscountInfo && (
                                                        <div className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest italic border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                                                            <FiTag size={12} className="animate-pulse" /> Efficiency Save: {formatRupiah(fcDiscountInfo.discountPerSheet)}/sheet
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="h-px bg-slate-800 relative z-10" />

                                                <div className="text-center relative z-10">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 italic leading-none">Calculated Sub-Total</p>
                                                    <p className="text-6xl font-black italic tracking-tighter text-blue-500 drop-shadow-2xl">{formatRupiah(fcTotal)}</p>
                                                </div>

                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={addFotocopyToCart}
                                                    className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black italic uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-4 hover:bg-blue-500 transition-all group relative z-10"
                                                >
                                                    <FiShoppingCart className="group-hover:rotate-12 transition-transform" size={20} /> Deploy to Terminal
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                {activeServiceTab === 'jilid' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
                                    >
                                        {bindingPrices.map(type => (
                                            <motion.div
                                                key={type.id}
                                                whileHover={{ y: -5, scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => addJilidToCart(type)}
                                                className="group cursor-pointer p-6 rounded-[2rem] border-2 border-slate-800 bg-slate-950/30 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-center flex flex-col items-center gap-4 shadow-xl"
                                            >
                                                <div className="size-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-blue-500/5">
                                                    <FiBook size={32} />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="font-black italic uppercase text-xs tracking-widest text-slate-300 group-hover:text-white transition-colors">{type.name}</h3>
                                                    <p className="text-lg font-black italic tracking-tighter text-blue-500 mt-2">{formatRupiah(type.price)}</p>
                                                </div>
                                                <div className="w-8 h-1 bg-slate-800 rounded-full group-hover:w-16 group-hover:bg-blue-600 transition-all duration-500" />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}

                                {activeServiceTab === 'print' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
                                    >
                                        {printPrices.map(type => (
                                            <motion.div
                                                key={type.id}
                                                whileHover={{ y: -5, scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => addPrintToCart(type)}
                                                className="group cursor-pointer p-6 rounded-[2rem] border-2 border-slate-800 bg-slate-950/30 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-center flex flex-col items-center gap-4 shadow-xl"
                                            >
                                                <div className="size-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-blue-500/5">
                                                    <FiPrinterIcon size={32} />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="font-black italic uppercase text-xs tracking-widest text-slate-300 group-hover:text-white transition-colors">{type.name}</h3>
                                                    <p className="text-lg font-black italic tracking-tighter text-blue-500 mt-2">{formatRupiah(type.price)}</p>
                                                </div>
                                                <div className="w-8 h-1 bg-slate-800 rounded-full group-hover:w-16 group-hover:bg-blue-600 transition-all duration-500" />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* Retail Products Section */}
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-2 bg-blue-600 rounded-full" />
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Retail Inventory <span className="text-slate-500 opacity-50 font-normal">/ ATK</span></h2>
                                <span className="hidden md:block px-3 py-1 rounded-[1rem] bg-slate-900 border border-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Terminal Ready</span>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative group max-w-2xl">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                                <FiSearch size={22} />
                            </div>
                            <input
                                ref={searchInputRef}
                                className="w-full pl-16 pr-8 py-6 rounded-[2.5rem] border-2 border-slate-800 bg-slate-900/40 backdrop-blur-xl focus:ring-8 focus:ring-blue-500/10 focus:border-blue-500 text-lg font-black italic uppercase transition-all outline-none shadow-2xl placeholder:text-slate-700"
                                placeholder="Scan Barcode or Manual Search..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-6 flex items-center gap-2 pointer-events-none">
                                <span className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-black text-slate-500 italic uppercase">F5 Focus</span>
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                            <AnimatePresence>
                                {filteredProducts.map((p, idx) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ y: -8, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => addToCart(p)}
                                        className="bg-slate-900/40 backdrop-blur-xl p-4 rounded-[2rem] border-2 border-slate-800/50 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all cursor-pointer flex flex-col gap-4 group relative overflow-hidden"
                                    >
                                        <div className="aspect-square bg-slate-950/50 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 overflow-hidden relative border border-slate-800/30">
                                            {p.image ? (
                                                <img src={p.image} alt={p.name} className="size-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                            ) : (
                                                <FiFile size={32} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                                            )}
                                            <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors" />

                                            {p.stock <= 5 && (
                                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-rose-500 text-[8px] font-black italic uppercase text-white rounded-lg shadow-lg">Low Stock</div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <h4 className="font-black italic uppercase text-[11px] tracking-widest truncate text-slate-300 leading-tight group-hover:text-white transition-colors">{p.name}</h4>
                                            <p className="text-lg font-black italic tracking-tighter text-blue-500 leading-none">{formatRupiah(p.sellPrice)}</p>
                                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-800/50">
                                                <span className={`text-[9px] font-black italic uppercase tracking-widest ${p.stock > 10 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    UNIT: {p.stock}
                                                </span>
                                                <span className="text-[9px] text-slate-600 font-black italic uppercase tracking-widest">{p.unit}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Right Side: Cart Summary - Modern Glasshouse Side Panel */}
                <aside className={`fixed lg:relative top-0 right-0 h-full w-[85vw] max-w-[420px] lg:w-[440px] bg-slate-950/60 backdrop-blur-3xl border-l border-slate-800/50 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-50 transition-transform duration-500 cubic-bezier(0.4,0,0.2,1) transform ${isMobile && !isCartOpen ? 'translate-x-full' : 'translate-x-0'}`}>
                    <div className="p-8 border-b border-slate-800/50 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />

                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Registry <span className="text-blue-500">Hub</span></h2>
                                <p className="text-[10px] font-black italic uppercase tracking-[0.3em] text-slate-500 mt-1">Terminal Batch #8821</p>
                            </div>
                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(244, 63, 94, 0.1)' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={removeAll}
                                    className="size-11 flex items-center justify-center text-slate-500 hover:text-rose-500 border border-slate-800 rounded-2xl transition-all"
                                >
                                    <FiTrash2 size={18} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsCartOpen(false)}
                                    className="lg:hidden size-11 flex items-center justify-center text-slate-500 hover:text-blue-500 bg-slate-800/50 rounded-2xl"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </motion.button>
                            </div>
                        </div>

                        {/* Customer Selection - Modern Dropdown */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1 italic">Client Profile</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                                    <FiUser size={18} />
                                </div>
                                <select
                                    value={selectedCustomerId || ''}
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    className="w-full pl-12 pr-10 py-4 rounded-2xl border-2 border-slate-800 bg-slate-900/50 focus:border-blue-500 text-sm font-black italic uppercase tracking-widest text-slate-300 appearance-none outline-none transition-all cursor-pointer hover:bg-slate-900"
                                >
                                    <option value="">General Citizen</option>
                                    <option value="manual">+ Secure New Entry</option>
                                    <optgroup label="VERIFIED DATABASE">
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </optgroup>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
                                    <span className="material-symbols-outlined text-xl">expand_more</span>
                                </div>
                            </div>

                            {selectedCustomerId === 'manual' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="overflow-hidden"
                                >
                                    <input
                                        type="text"
                                        placeholder="Enter secure entity name..."
                                        value={manualCustomerName}
                                        onChange={(e) => setManualCustomerName(e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl border-2 border-blue-500/50 bg-blue-500/5 focus:border-blue-500 text-sm font-black italic uppercase text-white outline-none transition-all placeholder:text-blue-500/30"
                                        autoFocus
                                    />
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 hide-scrollbar">
                        <AnimatePresence>
                            {cart.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.3 }}
                                    className="h-full flex flex-col items-center justify-center text-slate-500 gap-8"
                                >
                                    <div className="size-32 bg-slate-900/50 rounded-full flex items-center justify-center border-4 border-slate-800 border-dashed animate-spin-slow">
                                        <span className="material-symbols-outlined text-6xl">inventory_2</span>
                                    </div>
                                    <p className="font-black text-[10px] uppercase tracking-[0.4em] italic text-center leading-loose">Waiting for<br />Terminal Input</p>
                                </motion.div>
                            ) : (
                                cart.map((item, idx) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        layout
                                        className="flex gap-5 group relative p-4 rounded-3xl hover:bg-slate-900/40 transition-colors border border-transparent hover:border-slate-800/50"
                                    >
                                        <div className="size-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-blue-500/5">
                                            <span className="material-symbols-outlined text-3xl">
                                                {item.type === 'fotocopy' ? 'content_copy' : item.type === 'service' ? 'book' : 'inventory_2'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <h5 className="text-[11px] font-black italic uppercase tracking-widest truncate text-slate-100 mb-1 leading-none">{item.name}</h5>
                                                <button onClick={() => updateQty(item.id, -item.quantity)} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:scale-110 transition-all">
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between mt-3">
                                                <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800 border-blue-500/30">
                                                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQty(item.id, -1)} className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                                                        <FiMinus size={14} />
                                                    </motion.button>
                                                    <span className="text-xs font-black italic w-8 text-center text-white">{item.quantity}</span>
                                                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQty(item.id, 1)} className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                                                        <FiPlus size={14} />
                                                    </motion.button>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] font-black italic uppercase text-slate-500 mb-1">Total Unit Value</span>
                                                    <div className="text-sm font-black italic tracking-tighter text-blue-500">{formatRupiah(item.sellPrice * item.quantity)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="p-8 bg-slate-950/80 backdrop-blur-3xl border-t border-slate-800/50 space-y-8 relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-slate-500">Gross Terminal Value</span>
                                <span className="text-sm font-black italic text-slate-300">{formatRupiah(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-slate-500">Hub Credits / Discon</span>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleDiscountModal}
                                    className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-widest italic border-2 px-5 py-2.5 rounded-[1.5rem] transition-all ${globalDiscount > 0 ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-500/20' : 'text-blue-500 border-blue-500/20 bg-blue-500/5 hover:border-blue-500/50'}`}
                                >
                                    {globalDiscount > 0 ? (
                                        <><FiTag size={12} className="animate-pulse" /> -{formatRupiah(globalDiscount)}</>
                                    ) : (
                                        <><FiPlus size={12} /> Inject Credit</>
                                    )}
                                </motion.button>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-800/50 relative z-10">
                            <div className="flex flex-col gap-2 mb-8">
                                <span className="font-black text-slate-500 uppercase text-[10px] tracking-[0.4em] italic text-center">Final Settlement Amount</span>
                                <span className="text-6xl font-black italic tracking-tighter text-blue-500 drop-shadow-[0_10px_20px_rgba(59,130,246,0.3)] text-center">{formatRupiah(subtotal - globalDiscount)}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={saveQueue}
                                    className="flex items-center justify-center gap-4 py-5 rounded-[1.8rem] border-2 border-slate-800 bg-slate-900 group hover:border-slate-700 transition-all font-black text-[11px] italic uppercase tracking-[0.3em] text-slate-400"
                                >
                                    <FiSave className="group-hover:-translate-y-1 transition-transform" size={18} /> Cache Transaction
                                </motion.button>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: '#2563eb' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={openPayment}
                                className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-lg italic uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 flex items-center justify-center gap-4 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <span className="relative z-10">Authorize Payment</span>
                                <FiChevronRight className="group-hover:translate-x-2 transition-transform relative z-10" size={24} />
                            </motion.button>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Modals */}
            <Modal isOpen={isDiscountModalOpen} onClose={toggleDiscountModal} title="Registry Credit Injection">
                <div className="space-y-6 pt-4">
                    <div className="bg-slate-900/50 p-6 rounded-[2rem] border-2 border-slate-800 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl -mr-10 -mt-10" />
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 block italic leading-none">Credit Amount (IDR)</label>
                        <input
                            type="number"
                            value={globalDiscount}
                            onChange={e => setGlobalDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-transparent border-none text-4xl font-black italic tracking-tighter text-center text-blue-500 outline-none focus:ring-0 placeholder:text-slate-800"
                            placeholder="0"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[500, 1000, 2000, 5000].map(v => (
                            <motion.button
                                key={v}
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(30, 41, 59, 1)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setGlobalDiscount(v)}
                                className="py-5 rounded-[1.5rem] bg-slate-900 border border-slate-800 text-sm font-black italic uppercase tracking-widest text-slate-400 hover:text-white transition-all shadow-lg"
                            >
                                +{formatRupiah(v)}
                            </motion.button>
                        ))}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={toggleDiscountModal}
                        className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black italic uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 mt-4"
                    >
                        Apply Settlement Credit
                    </motion.button>
                </div>
            </Modal>

            <Modal isOpen={isPaymentModalOpen} onClose={closePaymentModal} title={transactionComplete ? 'SETTLEMENT SUCCESS' : 'AUTHORIZING PAYMENT'}>
                {transactionComplete ? (
                    <div className="text-center py-10 flex flex-col items-center gap-8">
                        <motion.div
                            initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            className="size-32 bg-emerald-500/10 text-emerald-500 rounded-[3rem] flex items-center justify-center border-4 border-emerald-500/20 shadow-2xl shadow-emerald-500/10"
                        >
                            <FiCheckCircle size={64} className="drop-shadow-lg" />
                        </motion.div>

                        <div className="space-y-2">
                            <h3 className="text-4xl font-black italic tracking-tighter uppercase text-white">Transmission <span className="text-emerald-500">Synced</span></h3>
                            <p className="text-[10px] font-black italic uppercase tracking-[0.3em] text-slate-500">ID: {transactionComplete.invoiceNo}</p>
                        </div>

                        <div className="w-full space-y-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleDirectPrint(transactionComplete)}
                                className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black italic text-lg uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/30 hover:bg-blue-500 transition-all"
                            >
                                <FiPrinter size={24} /> Print Transmission
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={closePaymentModal}
                                className="w-full py-6 bg-slate-900 text-slate-400 border border-slate-800 rounded-[2rem] font-black italic uppercase tracking-[0.2em] hover:text-white transition-all"
                            >
                                Close Terminal
                            </motion.button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-10 pt-4">
                        <div className="bg-slate-950 p-10 rounded-[3rem] text-center border-2 border-slate-900 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl -mr-24 -mt-24" />
                            <p className="text-[10px] font-black italic text-slate-500 uppercase tracking-[0.4em] mb-4 leading-none">Net Transaction total</p>
                            <p className="text-6xl font-black italic tracking-tighter text-blue-500 drop-shadow-[0_10px_30px_rgba(59,130,246,0.3)]">{formatRupiah(subtotal - globalDiscount)}</p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-[0.3em] pl-2">Channel Protocol</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['tunai', 'qris', 'transfer', 'piutang'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setPaymentMethod(m)}
                                        className={`py-5 rounded-[1.8rem] font-black italic uppercase text-xs tracking-[0.2em] border-2 transition-all duration-500 ${paymentMethod === m ? 'border-blue-500 bg-blue-500/10 text-white shadow-xl shadow-blue-500/5' : 'border-slate-900 bg-slate-950/50 text-slate-600 hover:border-slate-800'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentMethod === 'tunai' && (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-[0.3em] pl-2">CASH INPUT (IDR)</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={amountPaid ? 'Rp ' + Number(amountPaid).toLocaleString('id-ID') : ''}
                                        onChange={e => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setAmountPaid(val);
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                const totalDue = subtotal - globalDiscount;
                                                if ((parseFloat(amountPaid) || 0) >= totalDue) {
                                                    handleConfirmPayment();
                                                }
                                            }
                                        }}
                                        placeholder="Rp 0"
                                        className="w-full p-6 bg-slate-950 border-2 border-slate-900 rounded-[2rem] text-4xl font-black italic tracking-tighter text-center text-white focus:border-blue-500 transition-all shadow-inner outline-none"
                                        autoFocus
                                    />
                                    {amountPaid && (
                                        <div className="flex justify-between items-center px-6 mt-4 pt-4 border-t border-slate-900">
                                            <span className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest">Calculated Change</span>
                                            <span className={`text-2xl font-black italic tracking-tighter ${parseFloat(amountPaid) - (subtotal - globalDiscount) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {formatRupiah(parseFloat(amountPaid) - (subtotal - globalDiscount))}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={paymentMethod === 'tunai' && (parseFloat(amountPaid) || 0) < (subtotal - globalDiscount)}
                            onClick={handleConfirmPayment}
                            className={`w-full py-6 rounded-[2rem] font-black italic uppercase tracking-[0.2em] shadow-2xl transition-all duration-500 ${(paymentMethod !== 'tunai' || (parseFloat(amountPaid) || 0) >= (subtotal - globalDiscount))
                                ? 'bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-500'
                                : 'bg-slate-900 text-slate-700 opacity-50 cursor-not-allowed border border-slate-800'
                                }`}
                        >
                            Commit Settlement
                        </motion.button>
                    </div>
                )}
            </Modal>

            {/* Shortcut Help Bar */}
            <div className="bg-slate-950/80 backdrop-blur-xl py-3 px-8 flex items-center gap-8 overflow-x-auto hide-scrollbar border-t border-slate-900 z-50">
                <div className="flex items-center gap-3 shrink-0">
                    <div className="size-2 bg-blue-600 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black italic text-slate-500 uppercase tracking-[0.4em]">Protocol Shortcuts</span>
                </div>
                <div className="flex gap-4">
                    {[
                        { k: 'F1', l: 'PHOTOCOPY' },
                        { k: 'F2', l: 'BINDING' },
                        { k: 'F3', l: 'PRINT' },
                        { k: 'F5', l: 'INVENTORY' },
                        { k: 'F8', l: 'DRAWER' },
                        { k: 'F9', l: 'CREDITS' },
                        { k: 'F10', l: 'PROCESS' },
                        { k: 'F11', l: 'FULLSCREEN' },
                        { k: 'F12', l: 'CACHE' },
                        { k: 'ESC', l: 'ABORT' }
                    ].map(s => (
                        <div key={s.k} className="flex items-center gap-2 group">
                            <span className="text-[10px] font-black italic text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-all">{s.k}</span>
                            <span className="text-[9px] font-black italic text-slate-500 uppercase tracking-widest leading-none">{s.l}</span>
                        </div>
                    ))}
                </div>
            </div>

            <footer className="h-12 bg-slate-950 text-slate-600 flex items-center justify-between px-8 text-[9px] font-black italic uppercase tracking-[0.3em] border-t border-slate-900">
                <div className="flex gap-8">
                    <span className="hover:text-slate-300 transition-colors">TERMINAL_VERSION: 4.0.ALPHA</span>
                    <span className="flex items-center gap-2"><div className="size-1.5 bg-emerald-500 rounded-full" /> SYSTEM_ONLINE</span>
                </div>
                <div className="flex gap-8">
                    <span className="flex items-center gap-2 hover:text-slate-300 transition-colors"><FiPrinter /> PRINTER_LINKED: {printerSettings.printerName || 'NULL'}</span>
                    <span className="hover:text-slate-300 transition-colors">OP: {user?.username?.toUpperCase() || 'ROOT'}</span>
                </div>
            </footer>
        </div>
    );
}
