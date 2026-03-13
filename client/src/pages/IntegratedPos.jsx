import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';
import db from '../db';
import seedData from '../seed';
import { formatRupiah, generateInvoice, generateRawReceipt, printViaRawBT } from '../utils';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import Modal from '../components/Modal';
import { FiCheckCircle, FiTrash2, FiPlus, FiMinus, FiSearch, FiBell, FiUser, FiPrinter, FiSave, FiChevronRight, FiTag, FiShoppingCart, FiFile, FiBook, FiPrinter as FiPrinterIcon } from 'react-icons/fi';

export default function IntegratedPos({ onNavigate, pageState, onFullscreenChange }) {
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

    // Search Input Ref for F5 focus
    const searchInputRef = useRef(null);

    // Initial Data Loading
    useEffect(() => {
        seedData();
        setProducts(db.getAll('products'));
        setBindingPrices(db.getAll('binding_prices'));
        setPrintPrices(db.getAll('print_prices'));
        api.get('/transactions/fotocopy-prices')
            .then(res => setFotocopyPrices(res.data))
            .catch(() => setFotocopyPrices(db.getAll('fotocopy_prices')));
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

    // Full Screen Handler with F11 (Ported from PosPage)
    useEffect(() => {
        const handleF11 = (e) => {
            if (e.key === 'F11') {
                e.preventDefault();
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => console.log(err));
                } else {
                    document.exitFullscreen().catch(err => console.log(err));
                }
            }
        };
        const handleFsChange = () => {
            if (onFullscreenChange) onFullscreenChange(!!document.fullscreenElement);
        };
        document.addEventListener('keydown', handleF11);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => {
            document.removeEventListener('keydown', handleF11);
            document.removeEventListener('fullscreenchange', handleFsChange);
        };
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

    const removeAll = () => setCart([]);

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

    const handleConfirmPayment = () => {
        const total = subtotal - globalDiscount;
        const paid = paymentMethod === 'tunai' ? parseFloat(amountPaid) : total;

        const transaction = {
            id: `TRX-${Date.now()}`,
            invoiceNo: generateInvoice(),
            date: new Date().toISOString(),
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
    };

    const saveQueue = () => {
        if (cart.length === 0) return;
        const queueItem = {
            id: `Q-${Date.now()}`,
            items: cart,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        db.insert('production_queue', queueItem);
        alert('Tugas disimpan ke antrean produksi.');
        setCart([]);
    };

    // Cart Calculation
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.sellPrice * item.quantity), 0), [cart]);

    // Keyboard Shortcuts (F1-F12 as per design)
    const shortcuts = useMemo(() => ({
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
            else removeAll();
        },
    }), [cart, subtotal, globalDiscount, isPaymentModalOpen, isDiscountModalOpen]);

    useKeyboardShortcuts(shortcuts);

    return (
        <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* Header */}
            <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="md:hidden flex items-center justify-center size-12 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined text-2xl font-bold">arrow_back</span>
                    </button>
                    <div className="flex items-center justify-center size-10 md:size-12 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-2xl md:text-3xl">point_of_sale</span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-black leading-tight tracking-tight whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-200 dark:to-slate-400">Kasir Terpadu</h1>
                </div>

                <nav className="hidden md:flex flex-1 justify-center gap-12">
                    <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-primary font-semibold border-b-2 border-primary pb-1">
                        <span className="material-symbols-outlined">home</span> Beranda
                    </button>
                    <button className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">analytics</span> Laporan
                    </button>
                    <button className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">settings</span> Pengaturan
                    </button>
                </nav>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCartOpen(!isCartOpen)}
                        className="lg:hidden relative flex items-center justify-center rounded-xl h-12 w-12 bg-primary/10 text-primary hover:bg-primary/20 transition-colors shadow-sm"
                    >
                        <FiShoppingCart size={24} />
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[11px] font-black text-white border-2 border-white dark:border-slate-900 shadow-sm animate-bounce">
                                {cart.length}
                            </span>
                        )}
                    </button>
                    <div className="flex gap-2">
                        <button className="hidden sm:flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">
                            <FiBell />
                        </button>
                        <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">
                            <FiUser />
                        </button>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold">Admin Kasir</p>
                            <p className="text-xs text-slate-500">Shift Pagi</p>
                        </div>
                        <div className="bg-primary/10 rounded-full p-0.5 border-2 border-primary">
                            <div className="size-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                                <FiUser size={20} />
                            </div>
                        </div>
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

            <main className="flex flex-1 overflow-hidden relative">
                {/* Left Side: Services and Products */}
                <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 gap-6">
                    {/* Service Sections (Tabbed) */}
                    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1">
                        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto hide-scrollbar">
                            {[
                                { id: 'fotocopy', label: 'Fotocopy', icon: 'content_copy', kbd: 'F1' },
                                { id: 'jilid', label: 'Jilid', icon: 'book', kbd: 'F2' },
                                { id: 'print', label: 'PRINT', icon: 'print', kbd: 'F3' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveServiceTab(tab.id)}
                                    className={`flex-1 min-w-[130px] py-5 px-4 md:px-6 flex items-center justify-center gap-3 border-b-4 transition-all ${activeServiceTab === tab.id
                                        ? 'border-primary text-primary font-black scale-105 mb-[1px]'
                                        : 'border-transparent text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    <span className={`hidden md:inline-block px-2 py-1 rounded-md text-[11px] font-black ${activeServiceTab === tab.id ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                        }`}>{tab.kbd}</span>
                                    <span className="material-symbols-outlined text-2xl md:text-3xl">{tab.icon}</span>
                                    <span className="text-base md:text-lg tracking-tight">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="p-4 md:p-6">
                            {activeServiceTab === 'fotocopy' && (
                                <div className="flex flex-col gap-6 max-w-4xl mx-auto">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Jenis Kertas</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['HVS A4', 'HVS F4', 'HVS A3'].map(p => (
                                                        <button key={p} onClick={() => setFcPaper(p)} className={`py-3 rounded-lg font-bold text-[11px] md:text-sm border-2 transition-all ${fcPaper === p ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300'}`}>{p}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Warna</label>
                                                    <div className="flex gap-2">
                                                        {[{ v: 'bw', l: 'B/W' }, { v: 'color', l: 'Warna' }].map(c => (
                                                            <button key={c.v} onClick={() => setFcColor(c.v)} className={`flex-1 py-3 rounded-lg font-bold text-xs border-2 transition-all ${fcColor === c.v ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300'}`}>{c.l}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Sisi</label>
                                                    <div className="flex gap-2">
                                                        {[{ v: '1', l: '1 Sisi' }, { v: '2', l: 'Bolak' }].map(s => (
                                                            <button key={s.v} onClick={() => setFcSide(s.v)} className={`flex-1 py-3 rounded-lg font-bold text-xs border-2 transition-all ${fcSide === s.v ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300'}`}>{s.l}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Jumlah Lembar</label>
                                                <div className="flex items-center gap-4">
                                                    <button onClick={() => setFcQty(Math.max(0, fcQty - 1))} className="size-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold hover:bg-slate-200 transition-colors">−</button>
                                                    <input type="number" value={fcQty} onChange={e => setFcQty(Math.max(0, parseInt(e.target.value) || 0))} className="flex-1 h-12 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-center font-bold text-xl bg-white dark:bg-slate-900 focus:border-primary outline-none transition-all" />
                                                    <button onClick={() => setFcQty(fcQty + 1)} className="size-12 rounded-xl bg-primary text-white flex items-center justify-center text-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">+</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 flex flex-col justify-between gap-6">
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Harga Satuan</p>
                                                <div className="flex items-center justify-center gap-3">
                                                    {fcDiscountInfo && <span className="text-sm text-red-500 line-through opacity-50 font-bold">{formatRupiah(fcUnitPrice)}</span>}
                                                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatRupiah(fcPrice)}</span>
                                                </div>
                                                {fcDiscountInfo && (
                                                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                        <FiTag size={12} /> Hemat {formatRupiah(fcDiscountInfo.discountPerSheet)}/lbr
                                                    </div>
                                                )}
                                            </div>
                                            <div className="h-px bg-slate-200 dark:bg-slate-700/50" />
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Subtotal Layanan</p>
                                                <p className="text-4xl font-black text-primary drop-shadow-sm">{formatRupiah(fcTotal)}</p>
                                            </div>
                                            <button onClick={addFotocopyToCart} className="w-full bg-primary text-white py-4 rounded-xl font-black shadow-xl shadow-primary/30 flex items-center justify-center gap-3 hover:bg-primary/90 transition-all active:scale-95 group">
                                                <FiShoppingCart className="group-hover:rotate-12 transition-transform" /> Tambah ke Keranjang
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeServiceTab === 'jilid' && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {bindingPrices.map(type => (
                                        <div
                                            key={type.id}
                                            onClick={() => addJilidToCart(type)}
                                            className="group cursor-pointer p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary hover:bg-primary/5 transition-all text-center flex flex-col items-center gap-2"
                                        >
                                            <div className="size-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                                                <FiBook size={28} />
                                            </div>
                                            <h3 className="font-black text-sm mt-2">{type.name}</h3>
                                            <p className="text-sm font-black text-primary mt-auto">{formatRupiah(type.price)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeServiceTab === 'print' && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {printPrices.map(type => (
                                        <div
                                            key={type.id}
                                            onClick={() => addPrintToCart(type)}
                                            className="group cursor-pointer p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary hover:bg-primary/5 transition-all text-center flex flex-col items-center gap-2"
                                        >
                                            <div className="size-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                                                <FiPrinterIcon size={28} />
                                            </div>
                                            <h3 className="font-black text-sm mt-2">{type.name}</h3>
                                            <p className="text-sm font-black text-primary mt-auto">{formatRupiah(type.price)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Retail Products Section */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">Produk Retail ATK</h2>
                                <span className="hidden md:block px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 uppercase tracking-tighter">F5 - Cari</span>
                            </div>

                            {/* Mobile Search - Integrated into current flow */}
                        </div>

                        {/* Search Bar */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                <FiSearch size={22} />
                            </div>
                            <input
                                ref={searchInputRef}
                                className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary text-base md:text-lg font-medium transition-all outline-none shadow-sm"
                                placeholder="Cari pena, buku, kertas..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
                            {filteredProducts.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer flex flex-col gap-3 group relative overflow-hidden"
                                >
                                    <div className="aspect-square bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 duration-500 overflow-hidden">
                                        {p.image ? (
                                            <img src={p.image} alt={p.name} className="size-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                        ) : (
                                            <span className="material-symbols-outlined text-4xl text-slate-300 group-hover:text-primary transition-colors">shopping_bag</span>
                                        )}
                                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h4 className="font-black text-[13px] md:text-sm truncate text-slate-800 dark:text-slate-100">{p.name}</h4>
                                        <p className="text-primary font-black text-sm md:text-base">{formatRupiah(p.sellPrice)}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${p.stock > 10 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                Stok: {p.stock}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold">{p.unit}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Cart Summary */}
                <aside className={`fixed lg:relative top-0 right-0 h-full lg:h-auto w-[85vw] max-w-[400px] lg:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl z-50 transition-transform duration-300 transform ${isMobile && !isCartOpen ? 'translate-x-full' : 'translate-x-0'}`}>
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">Ringkasan</h2>
                            <div className="text-xs text-slate-500">Order ID: #INV-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001</div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={removeAll} className="size-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                <FiTrash2 size={20} />
                            </button>
                            <button onClick={() => setIsCartOpen(false)} className="lg:hidden size-10 flex items-center justify-center text-slate-400 hover:text-primary bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6 opacity-30">
                                <span className="material-symbols-outlined text-8xl">shopping_cart</span>
                                <p className="font-black text-xs uppercase tracking-widest">Keranjang Kosong</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex gap-4 group animate-in fade-in slide-in-from-right-4">
                                    <div className="size-12 bg-primary/5 dark:bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 border border-primary/10">
                                        <span className="material-symbols-outlined text-2xl">
                                            {item.type === 'fotocopy' ? 'content_copy' : item.type === 'service' ? 'book' : 'edit'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-sm font-black truncate text-slate-800 dark:text-slate-100">{item.name}</h5>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <button onClick={() => updateQty(item.id, -1)} className="size-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all">
                                                    <FiMinus size={14} />
                                                </button>
                                                <span className="text-xs font-black w-8 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQty(item.id, 1)} className="size-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all">
                                                    <FiPlus size={14} />
                                                </button>
                                            </div>
                                            <div className="text-sm font-black text-primary">{formatRupiah(item.sellPrice * item.quantity)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span className="text-sm text-slate-800 dark:text-slate-200">{formatRupiah(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center transition-all">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Diskon</span>
                                <button onClick={toggleDiscountModal} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-2 px-3 py-1.5 rounded-full transition-all ${globalDiscount > 0 ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20' : 'text-primary border-primary/20 bg-white dark:bg-slate-900 hover:bg-primary/5 hover:border-primary/40'}`}>
                                    <span>{globalDiscount > 0 ? `-${formatRupiah(globalDiscount)}` : 'Tambah Diskon'}</span>
                                </button>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-end mb-8">
                                <span className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Total Transaksi</span>
                                <span className="text-4xl font-black text-primary drop-shadow-sm">{formatRupiah(subtotal - globalDiscount)}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-3 mb-4">
                                <button onClick={saveQueue} className="flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-black text-xs uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 transition-all bg-transparent group">
                                    <FiSave className="group-hover:-translate-y-0.5 transition-transform" /> Simpan Antrean
                                </button>
                            </div>

                            <button onClick={openPayment} className="w-full bg-primary hover:bg-primary/90 text-white py-5 rounded-2xl font-black text-base uppercase tracking-widest shadow-2xl shadow-primary/40 flex items-center justify-center gap-4 transition-all active:scale-95 group">
                                <span>Proses Bayar</span>
                                <FiChevronRight className="group-hover:translate-x-1.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Modals */}
            <Modal isOpen={isDiscountModalOpen} onClose={toggleDiscountModal} title="Atur Diskon Transaksi">
                <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-500">Jumlah Diskon (Rp)</label>
                    <input
                        type="number"
                        value={globalDiscount}
                        onChange={e => setGlobalDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full p-4 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-2xl font-black text-center"
                        autoFocus
                    />
                    <div className="grid grid-cols-2 gap-3">
                        {[500, 1000, 2000, 5000].map(v => (
                            <button key={v} onClick={() => setGlobalDiscount(v)} className="py-3 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold hover:bg-primary hover:text-white transition-colors">+{formatRupiah(v)}</button>
                        ))}
                    </div>
                    <button onClick={toggleDiscountModal} className="w-full py-4 bg-primary text-white rounded-xl font-bold mt-4">Terapkan Diskon</button>
                </div>
            </Modal>

            <Modal isOpen={isPaymentModalOpen} onClose={closePaymentModal} title={transactionComplete ? 'Transaksi Berhasil' : 'Proses Pembayaran'}>
                {transactionComplete ? (
                    <div className="text-center py-6">
                        <div className="size-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiCheckCircle size={48} />
                        </div>
                        <h3 className="text-2xl font-black mb-2">Terima Kasih!</h3>
                        <p className="text-slate-500 mb-6">Transaksi {transactionComplete.invoiceNo} telah berhasil diproses.</p>
                        <div className="space-y-4">
                            <button
                                onClick={() => {
                                    if (isMobile) {
                                        const receiptHtml = generateRawReceipt(transactionComplete, db.getAll('settings').reduce((obj, s) => ({ ...obj, [s.key]: s.value }), {}), '58mm');
                                        printViaRawBT(receiptHtml);
                                    } else {
                                        // Desktop LX310 context
                                        const settings = db.getAll('settings').reduce((obj, s) => ({ ...obj, [s.key]: s.value }), {});
                                        const receiptText = generateRawReceipt(transactionComplete, {
                                            name: settings.store_name || 'Abadi Jaya',
                                            address: settings.store_address || '',
                                            phone: settings.store_phone || '',
                                            footer: settings.receipt_footer || ''
                                        }, 'lx310');

                                        const printWindow = window.open('', '_blank');
                                        printWindow.document.write(`<html><head><title>Print Receipt</title><style>
                                            pre { font-family: 'Courier New', Courier, monospace; font-size: 14px; white-space: pre-wrap; margin: 0; }
                                            @page { margin: 0; }
                                            body { margin: 10px; }
                                        </style></head><body><pre>${receiptText}</pre></body></html>`);
                                        printWindow.document.close();
                                        printWindow.focus();
                                        setTimeout(() => {
                                            printWindow.print();
                                            printWindow.close();
                                        }, 250);
                                    }
                                }}
                                className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95"
                            >
                                <FiPrinter size={24} /> {isMobile ? 'Cetak Bluetooth' : 'Cetak LX310'}
                            </button>
                            <button onClick={closePaymentModal} className="w-full py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors">Selesai</button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/10">
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Total yang harus dibayar</p>
                            <p className="text-3xl font-black text-primary">{formatRupiah(subtotal - globalDiscount)}</p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Metode Pembayaran</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['tunai', 'qris', 'transfer', 'piutang'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setPaymentMethod(m)}
                                        className={`py-4 rounded-xl font-bold border-2 transition-all capitalize ${paymentMethod === m ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-500'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentMethod === 'tunai' && (
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Jumlah Tunai (Bayar)</label>
                                <input
                                    type="number"
                                    value={amountPaid}
                                    onChange={e => setAmountPaid(e.target.value)}
                                    placeholder="0"
                                    className="w-full p-4 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-2xl font-black text-center bg-white dark:bg-slate-900 focus:border-primary outline-none transition-all"
                                    autoFocus
                                />
                                {amountPaid && (
                                    <div className="flex justify-between items-center px-2">
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
                            className={`w-full py-5 rounded-xl font-bold shadow-lg transition-all ${(paymentMethod !== 'tunai' || (parseFloat(amountPaid) || 0) >= (subtotal - globalDiscount))
                                ? 'bg-green-500 text-white shadow-green-500/20 hover:bg-green-600'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            Konfirmasi & Selesaikan
                        </button>
                    </div>
                )}
            </Modal>

            {/* Shortcut Help Bar */}
            <div className="bg-slate-800 text-slate-300 py-1.5 px-6 flex items-center gap-6 overflow-x-auto whitespace-nowrap border-t border-slate-700 z-50">
                <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">keyboard</span> BANTUAN TOMBOL:
                </span>
                <div className="flex gap-4">
                    {[
                        { k: 'F1', l: 'Fotocopy' },
                        { k: 'F2', l: 'Jilid' },
                        { k: 'F3', l: 'PRINT' },
                        { k: 'F5', l: 'Cari ATK' },
                        { k: 'F9', l: 'Diskon' },
                        { k: 'F10', l: 'Bayar' },
                        { k: 'F12', l: 'Simpan Antrean' },
                        { k: 'ESC', l: 'Batal' }
                    ].map(s => (
                        <span key={s.k} className="text-[10px] font-medium">
                            <span className="text-white font-bold bg-slate-700 px-1 rounded mr-1">{s.k}</span> {s.l}
                        </span>
                    ))}
                </div>
            </div>

            <footer className="h-10 bg-slate-900 text-white flex items-center justify-between px-6 text-[10px] uppercase tracking-widest font-bold border-t border-slate-800">
                <div className="flex gap-6">
                    <span>Versi 2.4.0</span>
                    <span>Server: Local Connected</span>
                </div>
                <div className="flex gap-6">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Printer: Ready</span>
                    <span>ID Kasir: 001-ABADI</span>
                </div>
            </footer>
        </div>
    );
}
