import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import db from '../db';
import seedData from '../seed';
import { formatRupiah, generateInvoice, generateRawReceipt, printViaRawBT } from '../utils';
import Modal from '../components/Modal';
import { FiCheckCircle, FiPackage, FiArrowLeft, FiShoppingCart, FiBox, FiCopy, FiTag, FiPrinter, FiFile } from 'react-icons/fi';

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
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <FiCheckCircle size={64} color="#10b981" />
                    <h3 style={{ fontSize: '1.5rem', marginTop: '16px' }}>Transaksi Berhasil!</h3>
                    <p style={{ color: '#6b7280' }}>No. Invoice: {transactionComplete.invoiceNo}</p>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button
                            onClick={() => handlePrintReceipt(transactionComplete)}
                            style={{
                                flex: 1, background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)',
                                borderRadius: '6px', padding: '16px', fontSize: '1.05rem', fontWeight: 600,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <FiPrinter /> Cetak Nota
                        </button>
                        <button
                            onClick={closeAndResetModal}
                            style={{
                                flex: 1, background: '#3b82f6', color: 'white', border: 'none',
                                borderRadius: '6px', padding: '16px', fontSize: '1.05rem', fontWeight: 600,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <FiCheckCircle /> Transaksi Baru
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-input)', borderRadius: '8px', textAlign: 'center', marginBottom: '16px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Total Tagihan</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)', margin: '8px 0' }}>{formatRupiah(cartTotal)}</p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Metode Pembayaran</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['tunai', 'qris', 'kartu'].map(method => (
                            <button key={method} onClick={() => setPaymentMethod(method)} style={{
                                flex: 1, padding: '12px', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase',
                                border: paymentMethod === method ? '2px solid var(--success)' : '2px solid var(--border)',
                                backgroundColor: paymentMethod === method ? 'var(--bg-glass)' : 'var(--bg-secondary)',
                                color: paymentMethod === method ? 'var(--success)' : 'var(--text-primary)',
                                fontWeight: 600
                            }}>{method}</button>
                        ))}
                    </div>
                </div>

                {paymentMethod === 'tunai' && (
                    <div style={{ marginBottom: '16px' }}>
                        <label htmlFor="amountPaid" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Jumlah Bayar (Tunai)</label>
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
                            style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '1.25rem', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        />
                    </div>
                )}

                {paymentMethod !== 'tunai' && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <p>Pembayaran dengan {paymentMethod.toUpperCase()} belum diimplementasikan sepenuhnya.</p>
                        <p>Klik "Konfirmasi" untuk menyelesaikan transaksi.</p>
                    </div>
                )}

                {changeAmount > 0 && paymentMethod === 'tunai' && (
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, textAlign: 'right', color: '#3b82f6' }}>
                        Kembalian: {formatRupiah(changeAmount)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {isMobile && (
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                    <button onClick={() => onNavigate('dashboard')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', padding: 0 }}>
                        <FiArrowLeft size={20} />
                        Kembali ke Dashboard
                    </button>
                </div>
            )}
            {/* Running Text / Marquee */}
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .running-text {
                    animation: marquee 150s linear infinite;
                    white-space: nowrap;
                    font-family: 'DS-Digital', 'Digital-7', 'Segment7', 'Courier New', monospace;
                }
            `}</style>

            <div style={{
                backgroundColor: '#000000',
                color: '#ffffff',
                padding: '14px 0',
                overflow: 'hidden',
                borderRadius: '8px',
                marginBottom: '12px',
                width: '100%',
                maxWidth: '100%',
                fontFamily: 'Arial, Helvetica, sans-serif'
            }}>
                <div className="running-text" style={{
                    display: 'inline-block',
                    paddingLeft: '100%',
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    letterSpacing: '3px'
                }}>
                    {runningText.repeat(10)}
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, padding: '12px', gap: '12px', backgroundColor: 'var(--bg-primary)', minHeight: 0 }}>
                {/* Product/Service Area */}
                {(!isMobile || activeTab !== 'cart') && (
                    <div style={{ flex: 2, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
                        {/* Tab Navigation */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid var(--border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setActiveTab('products')}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    backgroundColor: activeTab === 'products' ? '#3b82f6' : 'var(--bg-input)',
                                    color: activeTab === 'products' ? 'white' : 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <FiBox size={18} />
                                PRODUK
                            </button>
                            <button
                                onClick={() => setActiveTab('fotocopy')}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    backgroundColor: activeTab === 'fotocopy' ? '#3b82f6' : 'var(--bg-input)',
                                    color: activeTab === 'fotocopy' ? 'white' : 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <FiCopy size={18} />
                                FOTOCOPY
                            </button>
                            {isMobile && (
                                <button
                                    onClick={() => setActiveTab('cart')}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        backgroundColor: activeTab === 'cart' ? '#10b981' : 'var(--bg-input)',
                                        color: activeTab === 'cart' ? 'white' : 'var(--text-secondary)',
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <FiShoppingCart size={20} />
                                    {cart.length > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '-5px',
                                            right: '-5px',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {cart.length}
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'products' && (
                            <>
                                <h2 style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '16px' }}>Pilih Produk</h2>
                                <input
                                    type="text"
                                    placeholder="Cari produk (nama/kode)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '1rem', marginBottom: '16px', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                />
                                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                                        {filteredProducts.map(product => (
                                            <div key={product.id} onClick={() => addToCart(product)} style={{
                                                border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: 'var(--bg-card)',
                                                opacity: product.stock > 0 ? 1 : 0.5, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'
                                            }}>
                                                {product.stock === 0 && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)', color: 'red', fontWeight: 'bold', fontSize: '1.2rem', background: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: '4px', zIndex: 1 }}>HABIS</div>}
                                                {product.image ? (
                                                    <img src={product.image} alt={product.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }} />
                                                ) : (
                                                    <FiPackage size={48} color="#9ca3af" />
                                                )}
                                                <div style={{ fontWeight: 600, marginTop: '8px', minHeight: '40px', textAlign: 'center', fontSize: '0.9rem' }}>{product.name}</div>
                                                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.8rem' }}>Stok: {product.stock}</div>
                                                <div style={{ color: '#10b981', fontWeight: 700, marginTop: '4px', textAlign: 'center' }}>{formatRupiah(product.sellPrice)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'fotocopy' && (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.1rem' }}><FiFile /></div>
                                    <h2 style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary, #111827)', margin: 0 }}>Layanan Fotocopy</h2>
                                </div>
                                <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px', paddingRight: '4px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px', margin: '0 auto' }}>
                                        {/* Paper Type Selection */}
                                        <div>
                                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '10px', fontSize: '0.85rem', color: 'var(--text-secondary, #6b7280)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Jenis Kertas</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {['HVS A4', 'HVS F4', 'HVS A3'].map(paper => (
                                                    <button
                                                        key={paper}
                                                        onClick={() => setFcPaper(paper)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '12px 8px',
                                                            borderRadius: '12px',
                                                            border: fcPaper === paper ? '2px solid #6366f1' : '2px solid transparent',
                                                            backgroundColor: fcPaper === paper ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card, #f8fafc)',
                                                            color: fcPaper === paper ? '#6366f1' : 'var(--text-primary, #374151)',
                                                            fontWeight: 700,
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            wordBreak: 'break-word',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: fcPaper === paper ? '0 2px 12px rgba(99, 102, 241, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)'
                                                        }}
                                                    >
                                                        {paper}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Color & Side Selection — compact row */}
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '10px', fontSize: '0.85rem', color: 'var(--text-secondary, #6b7280)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Warna</label>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    {[{ val: 'bw', label: 'B/W' }, { val: 'color', label: 'Warna' }].map(c => (
                                                        <button key={c.val} onClick={() => setFcColor(c.val)}
                                                            style={{
                                                                flex: 1, padding: '10px 6px', borderRadius: '10px',
                                                                border: fcColor === c.val ? '2px solid #6366f1' : '2px solid transparent',
                                                                backgroundColor: fcColor === c.val ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card, #f8fafc)',
                                                                color: fcColor === c.val ? '#6366f1' : 'var(--text-primary, #374151)',
                                                                fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                                                                transition: 'all 0.2s ease',
                                                                boxShadow: fcColor === c.val ? '0 2px 12px rgba(99, 102, 241, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)'
                                                            }}
                                                        >{c.label}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '10px', fontSize: '0.85rem', color: 'var(--text-secondary, #6b7280)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Sisi</label>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    {[{ val: '1', label: '1 Sisi' }, { val: '2', label: 'Bolak' }].map(s => (
                                                        <button key={s.val} onClick={() => setFcSide(s.val)}
                                                            style={{
                                                                flex: 1, padding: '10px 6px', borderRadius: '10px',
                                                                border: fcSide === s.val ? '2px solid #6366f1' : '2px solid transparent',
                                                                backgroundColor: fcSide === s.val ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card, #f8fafc)',
                                                                color: fcSide === s.val ? '#6366f1' : 'var(--text-primary, #374151)',
                                                                fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                                                                transition: 'all 0.2s ease',
                                                                boxShadow: fcSide === s.val ? '0 2px 12px rgba(99, 102, 241, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)'
                                                            }}
                                                        >{s.label}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quantity Input */}
                                        <div>
                                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '10px', fontSize: '0.85rem', color: 'var(--text-secondary, #6b7280)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Jumlah Lembar</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <button
                                                    onClick={() => setFcQty(Math.max(0, fcQty - 1))}
                                                    style={{ width: '48px', height: '48px', borderRadius: '14px', border: 'none', background: 'var(--bg-card, #f1f5f9)', cursor: 'pointer', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary, #374151)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                                                >
                                                    −
                                                </button>
                                                <input
                                                    type="number"
                                                    value={fcQty}
                                                    onChange={(e) => setFcQty(Math.max(0, parseInt(e.target.value) || 0))}
                                                    min="0"
                                                    style={{ flex: 1, padding: '14px', border: '2px solid var(--border, #e2e8f0)', borderRadius: '14px', fontSize: '1.3rem', textAlign: 'center', fontWeight: 700, background: 'var(--bg-card, #fff)', color: 'var(--text-primary, #111827)', transition: 'border-color 0.2s ease', outline: 'none' }}
                                                />
                                                <button
                                                    onClick={() => setFcQty(fcQty + 1)}
                                                    style={{ width: '48px', height: '48px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', cursor: 'pointer', fontSize: '1.4rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)' }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {/* Price Display — glassmorphism card */}
                                        <div style={{
                                            padding: '24px 20px',
                                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.04), rgba(139, 92, 246, 0.06))',
                                            borderRadius: '16px',
                                            textAlign: 'center',
                                            border: '1px solid rgba(99, 102, 241, 0.1)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.06)' }} />
                                            <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.05)' }} />

                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Harga per lembar</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary, #111827)', position: 'relative' }}>
                                                {fcDiscountInfo && (
                                                    <span style={{ fontSize: '0.85rem', color: '#ef4444', textDecoration: 'line-through', marginRight: '8px', opacity: 0.7 }}>
                                                        {formatRupiah(fcUnitPrice)}
                                                    </span>
                                                )}
                                                {formatRupiah(fcPrice)}
                                            </div>

                                            {fcDiscountInfo && (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#059669', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, marginTop: '8px' }}>
                                                    <FiTag size={11} /> Diskon {formatRupiah(fcDiscountInfo.discountPerSheet)}/lbr
                                                </div>
                                            )}

                                            <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)', margin: '14px auto 10px', borderRadius: '1px' }} />

                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                                            <div style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', position: 'relative' }}>{formatRupiah(fcTotal)}</div>
                                        </div>

                                        {/* Add to Cart Button */}
                                        <button
                                            onClick={addFotocopyToCart}
                                            style={{
                                                width: '100%',
                                                padding: '16px',
                                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '14px',
                                                fontSize: '1rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                letterSpacing: '0.02em'
                                            }}
                                        >
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
                    <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', minWidth: isMobile ? '100%' : '350px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isMobile && (
                                    <button
                                        onClick={() => setActiveTab('products')}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                                    >
                                        <FiArrowLeft size={24} color="var(--text-primary)" />
                                    </button>
                                )}
                                <FiShoppingCart size={24} color="var(--text-primary)" />
                                <h2 style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Keranjang</h2>
                            </div>
                            {cart.length > 0 && <button onClick={clearCart} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Bersihkan</button>}
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {cart.length === 0 ? (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '8px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16" style={{ color: 'var(--text-muted)' }}><path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .49.598l-1 5a.5.5 0 0 1-.49.402H3.21l.94 4.705A.5.5 0 0 0 4.646 14h7.708a.5.5 0 0 1 0 1H4.646a1.5 1.5 0 0 1-1.48-1.765L2.1 2.528A1.5 1.5 0 0 1 3.5 1H14.5a1.5 1.5 0 0 1 1.48 1.408l-1 5A1.5 1.5 0 0 1 13.5 9H3.414l-.94-4.705A.5.5 0 0 0 2 3.5H.5a.5.5 0 0 1-.5-.5zM3.14 4l.79 3.973h8.61l.79-3.973H3.14zM5 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" /></svg>
                                    <p>Pilih produk untuk memulai.</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                                            <div style={{ color: 'var(--text-secondary)' }}>{formatRupiah(item.sellPrice)} x {item.quantity}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button onClick={() => updateQuantity(item.id, -1)} style={{ width: 28, height: 28, border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-input)', cursor: 'pointer', color: 'var(--text-primary)' }}>-</button>
                                            <button onClick={() => updateQuantity(item.id, 1)} style={{ width: 28, height: 28, border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-input)', cursor: 'pointer', color: 'var(--text-primary)' }}>+</button>
                                        </div>
                                        <div style={{ width: '90px', textAlign: 'right', fontWeight: 600, marginLeft: '16px' }}>{formatRupiah(item.sellPrice * item.quantity)}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        {cart.length > 0 && (
                            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Subtotal</span><span style={{ fontWeight: 600 }}>{formatRupiah(cartTotal)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--text-secondary)' }}><span>Pajak & Diskon</span><span>{formatRupiah(0)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}><span>Grand Total</span><span>{formatRupiah(cartTotal)}</span></div>
                                <button onClick={openPaymentModal} style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '16px', fontSize: '1.1rem', fontWeight: 600, marginTop: '16px', cursor: 'pointer' }}>Bayar</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Payment Modal */}
                <Modal isOpen={isPaymentModalOpen} onClose={closeAndResetModal} title={transactionComplete ? 'Sukses' : 'Proses Pembayaran'} footer={!transactionComplete && (
                    <button onClick={handleConfirmPayment} disabled={!isPaymentValid} style={{
                        width: '100%', background: isPaymentValid ? '#10b981' : '#d1d5db', color: 'white', border: 'none', borderRadius: '6px', padding: '16px', fontSize: '1.1rem', fontWeight: 600, cursor: isPaymentValid ? 'pointer' : 'not-allowed'
                    }}>Konfirmasi Pembayaran</button>
                )}>
                    {renderPaymentModalContent()}
                </Modal>
            </div>
        </div>
    );
}
