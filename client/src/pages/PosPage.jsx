import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import db from '../db';
import seedData from '../seed';
import { formatRupiah, generateInvoice, generateRawReceipt, printViaRawBT } from '../utils';
import Modal from '../components/Modal';
import { FiCheckCircle, FiPackage, FiArrowLeft, FiShoppingCart, FiBox, FiCopy, FiTag, FiPrinter, FiFile, FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';

export default function PosPage({ onNavigate, pageState, onFullscreenChange }) {
    // Running Text State
    const [runningText] = useState('SELAMAT DATANG DI FOTOCOPY ABADI JAYA - PELAYANAN TERBAIK ANDA ADALAH PRIORITAS KAMI \u00A0 \u00A0 \u00A0 \u00A0 \u2022 \u00A0 \u00A0 \u00A0 \u00A0 ');

    // Full Screen Handler with F11
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F11') {
                e.preventDefault();
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.log('Error attempting to enable fullscreen:', err);
                    });
                } else {
                    document.exitFullscreen().catch(err => {
                        console.log('Error attempting to exit fullscreen:', err);
                    });
                }
            }
        };

        // Listen for fullscreen changes
        const handleFullscreenChange = () => {
            const isFullscreen = !!document.fullscreenElement;
            if (onFullscreenChange) {
                onFullscreenChange(isFullscreen);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [onFullscreenChange]);

    // Component States
    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'fotocopy'
    const [products, setProducts] = useState([]);
    const [fotocopyPrices, setFotocopyPrices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [cart, setCart] = useState([]);

    // Fotocopy Form States
    const [fcPaper, setFcPaper] = useState('HVS A4');
    const [fcColor, setFcColor] = useState('bw');
    const [fcSide, setFcSide] = useState('1');
    const [fcQty, setFcQty] = useState(0);

    // Mobile Responsiveness State
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            // If switching to desktop and activeTab was 'cart', switch to 'products'
            if (!mobile && activeTab === 'cart') {
                setActiveTab('products');
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeTab]);

    // Payment Modal States
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('tunai');
    const [amountPaid, setAmountPaid] = useState('');
    const [transactionComplete, setTransactionComplete] = useState(null);
    const [printSettings, setPrintSettings] = useState({
        storeName: 'FOTOCOPY ABADI JAYA',
        storeAddress: '',
        storePhone: '',
        receiptFooter: '',
        printerSize: '80mm',
        printerName: '',
        autoPrint: false
    });

    // Load initial data
    useEffect(() => {
        seedData();
        const allProducts = db.getAll('products');
        setProducts(allProducts);
        setFilteredProducts(allProducts);

        // Fetch prices from API
        api.get('/transactions/fotocopy-prices')
            .then(res => setFotocopyPrices(res.data))
            .catch(err => {
                console.error('Failed to fetch fotocopy prices:', err);
                const localPrices = db.getAll('fotocopy_prices');
                setFotocopyPrices(localPrices);
            });

        // Load print settings
        const settings = db.getAll('settings').reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});

        setPrintSettings({
            storeName: settings.store_name || 'FOTOCOPY ABADI JAYA',
            storeAddress: settings.store_address || '',
            storePhone: settings.store_phone || '',
            receiptFooter: settings.receipt_footer || '',
            printerSize: settings.printer_size || '80mm',
            printerName: settings.printer_name || '',
            autoPrint: settings.auto_print === 'true'
        });
    }, []);

    // Filter products based on search
    useEffect(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const filtered = products.filter(p =>
            (p.name || '').toLowerCase().includes(lowerCaseQuery) ||
            (p.code || '').toLowerCase().includes(lowerCaseQuery)
        );
        setFilteredProducts(filtered);
    }, [searchQuery, products]);

    // Handle incoming items from other pages (e.g. Design Finalization)
    useEffect(() => {
        if (pageState?.autoAddToCart && !cart.find(c => c.id === pageState.autoAddToCart.id)) {
            setCart(prev => [...prev, pageState.autoAddToCart]);
            setActiveTab('cart');

            // Clear the autoAddToCart object to prevent duplicate additions
            if (pageState.onItemAdded) {
                pageState.onItemAdded();
            }
        }
    }, [pageState, cart]);

    // Cart Handlers
    const addToCart = (product) => {
        if (product.stock <= 0) {
            alert(`Stok ${product.name} habis.`);
            return;
        }
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                if (existingItem.quantity >= product.stock) {
                    alert(`Stok ${product.name} tidak mencukupi.`);
                    return prevCart;
                }
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId, amount) => {
        setCart(prevCart => {
            const itemToUpdate = prevCart.find(item => item.id === productId);
            const productInDb = products.find(p => p.id === productId);

            // For items not in DB (like services or fotocopy), skip stock check
            if (amount > 0 && productInDb && itemToUpdate.quantity + amount > productInDb.stock) {
                alert(`Stok ${productInDb.name} tidak mencukupi.`);
                return prevCart;
            }
            const updatedCart = prevCart.map(item =>
                item.id === productId ? { ...item, quantity: item.quantity + amount } : item
            );
            return updatedCart.filter(item => item.quantity > 0);
        });
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const clearCart = () => setCart([]);

    // Payment Handlers
    const openPaymentModal = () => {
        if (cart.length === 0) return;
        setPaymentMethod('tunai');
        setAmountPaid('');
        setTransactionComplete(null);
        setPaymentModalOpen(true);
    };

    const handlePrintReceipt = async (transaction) => {
        if (!transaction) return;

        try {
            const storeInfo = {
                name: printSettings.storeName,
                address: printSettings.storeAddress,
                phone: printSettings.storePhone,
                footer: printSettings.receiptFooter
            };

            const receiptText = generateRawReceipt(transaction, storeInfo, printSettings.printerSize);

            if (isMobile) {
                printViaRawBT(receiptText);
                console.log('Receipt sent to RawBT');
                return;
            }

            const payload = {
                text: receiptText,
                printerName: printSettings.printerName
            };

            if (printSettings.printerSize === 'lx310') payload.raw = true;

            await api.post('/print/receipt', payload);
            console.log('Receipt printed successfully via API');
        } catch (err) {
            console.error('Failed to print receipt:', err);
            alert('Gagal mencetak nota: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleConfirmPayment = () => {
        // 1. Construct transaction object
        const transaction = {
            invoiceNo: generateInvoice(),
            date: new Date().toISOString(),
            userId: 'u2', // Hardcoded for now
            userName: 'Kasir 1', // Hardcoded for now
            items: cart,
            subtotal: cartTotal,
            discount: cart.reduce((acc, item) => acc + (item.discount || 0), 0),
            tax: 0, // Placeholder
            total: cartTotal,
            paymentType: paymentMethod,
            paid: paymentMethod === 'tunai' ? parseFloat(amountPaid) : cartTotal,
            change: paymentMethod === 'tunai' ? parseFloat(amountPaid) - cartTotal : 0,
            status: 'paid',
        };

        // 2. Save transaction to DB
        db.insert('transactions', transaction);

        // 3. Update stock for each product (only for physical items)
        cart.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product && product.type !== 'service' && product.type !== 'fotocopy') {
                db.update('products', item.id, { stock: Math.max(0, product.stock - item.quantity) });
            }
        });

        // 4. Update local product state to reflect new stock
        const updatedProducts = products.map(p => {
            const cartItem = cart.find(ci => ci.id === p.id);
            return (cartItem && p.type !== 'service' && p.type !== 'fotocopy')
                ? { ...p, stock: Math.max(0, p.stock - cartItem.quantity) }
                : p;
        });
        setProducts(updatedProducts);

        // 5. Show success screen
        setTransactionComplete(transaction);

        // 6. Auto print if enabled
        if (printSettings.autoPrint) {
            handlePrintReceipt(transaction);
        }

        clearCart();
    };

    const closeAndResetModal = () => {
        setPaymentModalOpen(false);
        setTransactionComplete(null);
    };

    // Cart Calculations
    const cartTotal = useMemo(() => cart.reduce((total, item) => total + (item.sellPrice * item.quantity), 0), [cart]);
    const changeAmount = useMemo(() => {
        const paid = parseFloat(amountPaid);
        if (paymentMethod !== 'tunai' || isNaN(paid)) return 0;
        return paid - cartTotal;
    }, [amountPaid, cartTotal, paymentMethod]);

    const isPaymentValid = useMemo(() => {
        if (paymentMethod === 'tunai') {
            return changeAmount >= 0 && amountPaid !== '';
        }
        return true; // For other methods, always valid for now
    }, [paymentMethod, changeAmount, amountPaid]);

    // Fotocopy price calculation
    const fcDiscountInfo = useMemo(() => {
        const settings = db.getAll('settings');
        const diskonStr = settings.find(s => s.key === 'fc_discounts')?.value;
        const diskonRules = diskonStr ? JSON.parse(diskonStr) : [];

        // Find applicable discount: rule with max minQty <= fcQty
        const applicableRule = diskonRules
            .filter(r => parseInt(fcQty) >= parseInt(r.minQty))
            .sort((a, b) => parseInt(b.minQty) - parseInt(a.minQty))[0];

        return applicableRule || null;
    }, [fcQty]);

    const fcUnitPrice = useMemo(() => {
        const priceObj = fotocopyPrices.find(p =>
            p.paper === fcPaper && p.color === fcColor && p.side === fcSide
        );
        return priceObj ? priceObj.price : 0;
    }, [fotocopyPrices, fcPaper, fcColor, fcSide]);

    const fcPrice = useMemo(() => {
        const discount = fcDiscountInfo ? parseInt(fcDiscountInfo.discountPerSheet) : 0;
        return Math.max(0, fcUnitPrice - discount);
    }, [fcUnitPrice, fcDiscountInfo]);

    const fcTotal = useMemo(() => fcPrice * fcQty, [fcPrice, fcQty]);

    const addFotocopyToCart = () => {
        if (fcQty < 1) {
            alert('Jumlah lembar minimal 1');
            return;
        }

        const label = `${fcPaper} - ${fcColor === 'bw' ? 'B/W' : 'Warna'} - ${fcSide === '1' ? '1 Sisi' : 'Bolak-balik'}`;
        const discountAmount = fcDiscountInfo ? parseInt(fcDiscountInfo.discountPerSheet) : 0;

        const fotocopyItem = {
            id: `fc_${Date.now()}`,
            name: `Fotocopy ${label}`,
            sellPrice: fcPrice,
            originalPrice: fcUnitPrice,
            discount: discountAmount * fcQty,
            quantity: parseInt(fcQty),
            type: 'fotocopy',
            specs: { paper: fcPaper, color: fcColor, side: fcSide }
        };

        setCart(prevCart => [...prevCart, fotocopyItem]);
        // Reset form
        setFcQty(0);
    };


    const renderPaymentModalContent = () => {
        if (transactionComplete) {
            return (
                <div className="text-center p-8">
                    <FiCheckCircle size={64} className="text-emerald-500 mx-auto" />
                    <h3 className="text-2xl mt-4 font-bold text-slate-100">Transaksi Berhasil!</h3>
                    <p className="text-slate-400 mt-2 text-[0.9rem]">No. Invoice: {transactionComplete.invoiceNo}</p>

                    <div className="my-6 p-4 bg-white/3 rounded-xl border border-white/5">
                        <div className="flex justify-between mb-2">
                            <span className="text-slate-400">Total Tagihan</span>
                            <span className="font-bold">{formatRupiah(transactionComplete.total)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-slate-400">Jumlah Bayar</span>
                            <span className="font-bold">{formatRupiah(transactionComplete.paid)}</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-white/10 pt-2 mt-2">
                            <span className="text-slate-400">Kembalian</span>
                            <span className="font-extrabold text-blue-500 text-lg">{formatRupiah(transactionComplete.change)}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            onClick={() => handlePrintReceipt(transactionComplete)}
                            className="flex-1 p-4 bg-white/5 text-slate-100 border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all duration-200"
                        >
                            <FiPrinter /> Cetak Nota
                        </button>
                        <button
                            onClick={closeAndResetModal}
                            className="flex-1 p-4 bg-blue-600 text-white border-none rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:brightness-110 transition-all duration-200"
                        >
                            <FiPlus /> Transaksi Baru
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="p-1">
                <div className="p-6 bg-white/3 border border-white/5 rounded-2xl text-center mb-5">
                    <p className="text-slate-400 text-[0.9rem] mb-1">Total Tagihan</p>
                    <p className="text-4xl font-extrabold text-emerald-500">{formatRupiah(cartTotal)}</p>
                </div>

                <div className="mb-5">
                    <label className="font-semibold block mb-3 text-[0.9rem] text-slate-400 uppercase tracking-tight">Metode Pembayaran</label>
                    <div className="grid grid-cols-3 gap-2.5">
                        {['tunai', 'qris', 'kartu'].map(method => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`p-3 rounded-xl cursor-pointer font-bold text-[0.85rem] uppercase transition-all duration-200 border-2 ${paymentMethod === method ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-transparent bg-white/5 text-slate-400 hover:bg-white/10'}`}
                            >
                                {method}
                            </button>
                        ))}
                    </div>
                </div>

                {paymentMethod === 'tunai' && (
                    <div className="mb-5">
                        <label htmlFor="amountPaid" className="font-semibold block mb-3 text-[0.9rem] text-slate-400 uppercase tracking-tight">Jumlah Bayar (Tunai)</label>
                        <input
                            id="amountPaid"
                            type="text"
                            value={amountPaid ? 'Rp ' + Number(amountPaid).toLocaleString('id-ID') : ''}
                            onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setAmountPaid(val);
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && isPaymentValid) {
                                    handleConfirmPayment();
                                }
                            }}
                            placeholder="Rp 0"
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold text-center transition-all duration-200 focus:outline-none focus:border-blue-500 focus:bg-white/8"
                        />
                    </div>
                )}

                {paymentMethod !== 'tunai' && (
                    <div className="p-6 text-center text-slate-400 bg-white/2 rounded-xl border border-dashed border-white/10 mb-5">
                        <p>Pembayaran via {paymentMethod.toUpperCase()} akan segera hadir.</p>
                        <p className="text-[0.85rem] mt-1">Klik "Konfirmasi" untuk melanjutkan.</p>
                    </div>
                )}

                {changeAmount > 0 && paymentMethod === 'tunai' && (
                    <div className="p-4 bg-blue-500/10 rounded-xl flex justify-between items-center border border-blue-500/20">
                        <span className="text-blue-300 font-semibold text-[0.9rem]">Kembalian</span>
                        <span className="text-2xl font-extrabold text-blue-500">{formatRupiah(changeAmount)}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
            {isMobile && (
                <div className="p-3 px-4 flex items-center bg-slate-900 border-b border-white/5">
                    <button onClick={() => onNavigate('dashboard')} className="bg-transparent border-none flex items-center gap-2 text-[0.95rem] font-semibold text-slate-100 cursor-pointer p-0">
                        <FiArrowLeft size={20} />
                        Beranda
                    </button>
                </div>
            )}

            {/* Running Text */}
            <div className="bg-gradient-to-r from-slate-800 via-slate-950 to-slate-800 border-b border-blue-500/20 py-2.5 overflow-hidden relative">
                <div className="inline-block whitespace-nowrap animate-marquee font-bold text-lg text-blue-400 tracking-wider uppercase">
                    {runningText.repeat(5)}
                </div>
            </div>

            <div className="flex flex-1 gap-4 overflow-hidden lg:flex-row flex-col p-3 lg:p-4">
                {/* Product/Service Area */}
                {(!isMobile || activeTab !== 'cart') && (
                    <div className="flex-[2] bg-slate-800/50 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col min-w-0">
                        {/* Tab Navigation */}
                        <div className="flex gap-3 mb-5 pb-4 border-b border-white/5">
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`px-5 py-2.5 rounded-xl border-none cursor-pointer font-bold text-[0.9rem] flex items-center gap-2 transition-all duration-200 ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-100'}`}
                            >
                                <FiBox size={18} />
                                Produk
                            </button>
                            <button
                                onClick={() => setActiveTab('fotocopy')}
                                className={`px-5 py-2.5 rounded-xl border-none cursor-pointer font-bold text-[0.9rem] flex items-center gap-2 transition-all duration-200 ${activeTab === 'fotocopy' ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-100'}`}
                            >
                                <FiCopy size={18} />
                                Fotocopy
                            </button>
                            {isMobile && (
                                <button
                                    onClick={() => setActiveTab('cart')}
                                    className={`px-5 py-2.5 rounded-xl border-none cursor-pointer font-bold text-[0.9rem] flex items-center gap-2 transition-all duration-200 ml-auto relative ${activeTab === 'cart' ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-100'}`}
                                >
                                    <FiShoppingCart size={20} />
                                    {cart.length > 0 && (
                                        <span className="absolute -top-1.25 -right-1.25 bg-red-500 text-white rounded-full w-4.5 h-4.5 text-[0.7rem] flex items-center justify-center">
                                            {cart.length}
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'products' && (
                            <>
                                <h2 className="font-bold text-xl mb-4">Pilih Produk</h2>
                                <div className="mb-5">
                                    <input
                                        type="text"
                                        placeholder="Cari produk (nama/kode)..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[0.95rem] transition-all duration-200 focus:outline-none focus:border-blue-500 focus:bg-white/8 focus:ring-4 focus:ring-blue-500/10"
                                    />
                                </div>
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3 overflow-y-auto pr-1 hide-scrollbar">
                                    {filteredProducts.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            className={`bg-white/3 border border-white/5 rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 select-none flex flex-col items-center gap-2 hover:bg-white/8 hover:border-white/10 hover:-translate-y-0.5 active:translate-y-0 relative ${product.stock <= 0 ? 'opacity-50' : 'opacity-100'}`}
                                        >
                                            {product.stock === 0 && (
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-15 text-red-500 font-bold text-lg bg-white/70 px-2 py-0.5 rounded z-10">
                                                    HABIS
                                                </div>
                                            )}
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-xl" />
                                            ) : (
                                                <div className="text-[40px] text-slate-500"><FiPackage /></div>
                                            )}
                                            <div className="font-semibold text-[0.85rem] text-slate-200 leading-snug h-8 line-clamp-2">
                                                {product.name}
                                            </div>
                                            <div className="text-slate-400 text-[0.75rem]">Stok: {product.stock}</div>
                                            <div className="font-extrabold text-base text-emerald-400">
                                                {formatRupiah(product.sellPrice)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeTab === 'fotocopy' && (
                            <>
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="bg-blue-600 w-9 h-9 rounded-lg flex items-center justify-center text-white"><FiFile /></div>
                                    <h2 className="font-bold text-xl m-0 text-slate-100">Layanan Fotocopy</h2>
                                </div>
                                <div className="flex-1 overflow-y-auto pb-5 hide-scrollbar">
                                    <div className="flex flex-col gap-5 max-w-6xl xl:max-w-7xl mx-auto">
                                        {/* Paper Type */}
                                        <div>
                                            <label className="font-semibold block mb-2.5 text-[0.85rem] text-slate-400 uppercase tracking-tight">Jenis Kertas</label>
                                            <div className="flex gap-2">
                                                {['HVS A4', 'HVS F4', 'HVS A3'].map(paper => (
                                                    <button
                                                        key={paper}
                                                        onClick={() => setFcPaper(paper)}
                                                        className={`flex-1 px-2 py-3 rounded-xl border-none cursor-pointer font-bold text-[0.9rem] flex items-center justify-center gap-2 transition-all duration-200 ${fcPaper === paper ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-100'}`}
                                                    >
                                                        {paper}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Color & Side */}
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="flex-1">
                                                <label className="font-semibold block mb-2.5 text-[0.85rem] text-slate-400 uppercase tracking-tight">Warna</label>
                                                <div className="flex gap-1.5">
                                                    {[{ val: 'bw', label: 'B/W' }, { val: 'color', label: 'Warna' }].map(c => (
                                                        <button key={c.val} onClick={() => setFcColor(c.val)}
                                                            className={`flex-1 px-1.5 py-2.5 rounded-xl border-none cursor-pointer font-bold text-[0.8rem] sm:text-[0.9rem] flex items-center justify-center gap-2 transition-all duration-200 ${fcColor === c.val ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-100'}`}
                                                        >{c.label}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <label className="font-semibold block mb-2.5 text-[0.85rem] text-slate-400 uppercase tracking-tight">Sisi</label>
                                                <div className="flex gap-1.5">
                                                    {[{ val: '1', label: '1 Sisi' }, { val: '2', label: 'Bolak' }].map(s => (
                                                        <button key={s.val} onClick={() => setFcSide(s.val)}
                                                            className={`flex-1 px-1.5 py-2.5 rounded-xl border-none cursor-pointer font-bold text-[0.8rem] sm:text-[0.9rem] flex items-center justify-center gap-2 transition-all duration-200 ${fcSide === s.val ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-100'}`}
                                                        >{s.label}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quantity */}
                                        <div>
                                            <label className="font-semibold block mb-2.5 text-[0.85rem] text-slate-400 uppercase tracking-tight">Jumlah Lembar</label>
                                            <div className="flex items-center gap-1.5 sm:gap-2.5">
                                                <button onClick={() => setFcQty(Math.max(0, fcQty - 1))} className="w-10 h-10 flex-shrink-0 sm:w-12 sm:h-12 flex items-center justify-center bg-white/5 border-none rounded-lg text-white cursor-pointer text-lg hover:bg-white/10">-</button>
                                                <input
                                                    type="number"
                                                    value={fcQty}
                                                    onChange={(e) => setFcQty(Math.max(0, parseInt(e.target.value) || 0))}
                                                    className="flex-1 min-w-0 px-2 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg sm:text-xl font-bold transition-all duration-200 focus:outline-none focus:border-blue-500 focus:bg-white/8 text-center"
                                                />
                                                <button onClick={() => setFcQty(fcQty + 1)} className="w-10 h-10 flex-shrink-0 sm:w-12 sm:h-12 flex items-center justify-center bg-blue-600 border-none rounded-lg text-white cursor-pointer text-lg shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:brightness-110">+</button>
                                            </div>
                                        </div>

                                        {/* Price Card */}
                                        <div className="p-6 px-5 bg-white/3 rounded-2xl text-center border border-white/5">
                                            <div className="text-[0.75rem] text-slate-400 mb-1 font-medium uppercase tracking-tight">Harga per lembar</div>
                                            <div className="text-[1.4rem] font-bold">
                                                {fcDiscountInfo && (
                                                    <span className="text-[0.85rem] text-red-500 line-through mr-2 opacity-70">
                                                        {formatRupiah(fcUnitPrice)}
                                                    </span>
                                                )}
                                                {formatRupiah(fcPrice)}
                                            </div>

                                            {fcDiscountInfo && (
                                                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[0.7rem] font-bold mt-2">
                                                    <FiTag size={11} /> Diskon {formatRupiah(fcDiscountInfo.discountPerSheet)}/lbr
                                                </div>
                                            )}

                                            <div className="w-10 h-px bg-white/10 my-3.5 mx-auto mb-2.5" />

                                            <div className="text-[0.75rem] text-slate-400 mb-1 font-medium uppercase tracking-tight">Total</div>
                                            <div className="text-3xl font-extrabold text-emerald-500">{formatRupiah(fcTotal)}</div>
                                        </div>

                                        <button onClick={addFotocopyToCart} className="w-full p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none rounded-xl text-lg font-bold cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                                            <FiShoppingCart size={18} /> Tambah ke Keranjang
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Cart Area */}
                {(!isMobile || activeTab === 'cart') && (
                    <div className="lg:w-96 xl:w-[420px] 2xl:w-[480px] w-full bg-slate-900 lg:bg-slate-800/80 lg:backdrop-blur-3xl lg:border-l border-white/5 flex flex-col h-full min-h-0 absolute lg:relative inset-0 z-30">
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
                            <div className="flex items-center gap-2.5 font-bold text-[1.1rem]">
                                {isMobile && (
                                    <button
                                        onClick={() => setActiveTab('products')}
                                        className="bg-transparent border-none flex items-center gap-2 text-slate-400 cursor-pointer p-0 mr-2"
                                    >
                                        <FiArrowLeft size={20} />
                                    </button>
                                )}
                                <FiShoppingCart className="text-blue-400" />
                                <span>Keranjang</span>
                            </div>
                            {cart.length > 0 && (
                                <button onClick={clearCart} className="text-red-500 bg-transparent border-none text-[0.85rem] font-bold cursor-pointer opacity-80 hover:opacity-100 transition-opacity flex items-center gap-1.5">
                                    <FiTrash2 size={14} /> Kosongkan
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 hide-scrollbar min-height-0">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center gap-5 p-10 text-center opacity-60">
                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                                        <FiShoppingCart size={40} />
                                    </div>
                                    <p className="text-base font-semibold text-slate-400">Keranjang masih kosong</p>
                                    <p className="text-[0.85rem] -mt-3 text-slate-500">Pilih produk untuk ditambahkan</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex gap-3 p-3 bg-white/2 rounded-xl mb-2 border border-white/3">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[0.9rem] font-semibold mb-1 line-clamp-2 text-slate-100 leading-tight">{item.name}</div>
                                            <div className="text-[0.85rem] text-emerald-400 font-bold">{formatRupiah(item.sellPrice)}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white/5 border-none rounded-lg text-white cursor-pointer hover:bg-white/10"><FiMinus size={14} /></button>
                                            <span className="font-bold text-[0.9rem] min-w-[24px] text-center text-blue-400">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-white/5 border-none rounded-lg text-white cursor-pointer hover:bg-white/10"><FiPlus size={14} /></button>
                                        </div>
                                        <div className="min-w-[90px] text-right font-bold text-[0.95rem] text-slate-100 self-center">
                                            {formatRupiah(item.sellPrice * item.quantity)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-5 bg-slate-950/80 border-t border-white/5">
                                <div className="flex justify-between mb-2">
                                    <span className="text-slate-400 text-[0.9rem]">Subtotal</span>
                                    <span className="font-semibold text-slate-100">{formatRupiah(cartTotal)}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-slate-400 text-[0.9rem]">Pajak (0%)</span>
                                    <span className="font-semibold text-slate-100">{formatRupiah(0)}</span>
                                </div>
                                <div className="flex justify-between mt-3 mb-5 pt-3 border-t border-dashed border-white/10">
                                    <span className="text-lg font-bold">Total</span>
                                    <span className="text-2xl font-extrabold text-emerald-500">{formatRupiah(cartTotal)}</span>
                                </div>
                                <button onClick={openPaymentModal} className="w-full p-4 bg-primary text-white border-none rounded-xl text-lg font-bold cursor-pointer flex items-center justify-center gap-2.5 shadow-lg shadow-primary/30 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                                    Bayar Keranjang
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Payment Modal */}
                <Modal
                    isOpen={isPaymentModalOpen}
                    onClose={closeAndResetModal}
                    title={transactionComplete ? 'Status Transaksi' : 'Total Pembayaran'}
                    overlayClassName="modal-overlay"
                    footer={!transactionComplete && (
                        <button
                            onClick={handleConfirmPayment}
                            disabled={!isPaymentValid}
                            className="pay-btn"
                        >
                            Konfirmasi Pembayaran
                        </button>
                    )}
                >
                    {renderPaymentModalContent()}
                </Modal>
            </div>
        </div>
    );
}
