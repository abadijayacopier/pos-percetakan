import React, { useState, useEffect, useMemo } from 'react';
import db from '../db';
import seedData from '../seed';
import { formatRupiah, generateInvoice } from '../utils';
import Modal from '../components/Modal';
import { FiCheckCircle, FiPackage } from 'react-icons/fi';

export default function PosPage({ onNavigate, onFullscreenChange }) {
    // Running Text State
    const [runningText] = useState('SELAMAT DATANG DI FOTOCOPY ABADI JAYA - PELAYANAN TERBAIK ANDA ADALAH PRIORITAS KAMI ');

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
    const [fcQty, setFcQty] = useState(1);

    // Payment Modal States
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('tunai');
    const [amountPaid, setAmountPaid] = useState('');
    const [transactionComplete, setTransactionComplete] = useState(null);

    // Load initial data
    useEffect(() => {
        seedData();
        const allProducts = db.getAll('products');
        const prices = db.getAll('fotocopy_prices');
        setProducts(allProducts);
        setFilteredProducts(allProducts);
        setFotocopyPrices(prices);
    }, []);

    // Filter products based on search
    useEffect(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(lowerCaseQuery) ||
            p.code.toLowerCase().includes(lowerCaseQuery)
        );
        setFilteredProducts(filtered);
    }, [searchQuery, products]);

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
            if (amount > 0 && itemToUpdate.quantity + amount > productInDb.stock) {
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

    const handleConfirmPayment = () => {
        // 1. Construct transaction object
        const transaction = {
            invoiceNo: generateInvoice(),
            date: new Date().toISOString(),
            userId: 'u2', // Hardcoded for now
            userName: 'Kasir 1', // Hardcoded for now
            items: cart,
            subtotal: cartTotal,
            discount: 0, // Placeholder
            tax: 0, // Placeholder
            total: cartTotal,
            paymentType: paymentMethod,
            paid: paymentMethod === 'tunai' ? parseFloat(amountPaid) : cartTotal,
            change: paymentMethod === 'tunai' ? parseFloat(amountPaid) - cartTotal : 0,
            status: 'paid',
        };

        // 2. Save transaction to DB
        db.insert('transactions', transaction);

        // 3. Update stock for each product
        cart.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                db.update('products', item.id, { stock: product.stock - item.quantity });
            }
        });

        // 4. Update local product state to reflect new stock
        const updatedProducts = products.map(p => {
            const cartItem = cart.find(ci => ci.id === p.id);
            return cartItem ? { ...p, stock: p.stock - cartItem.quantity } : p;
        });
        setProducts(updatedProducts);

        // 5. Show success screen
        setTransactionComplete(transaction);
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
    const fcPrice = useMemo(() => {
        const priceObj = fotocopyPrices.find(p => 
            p.paper === fcPaper && p.color === fcColor && p.side === fcSide
        );
        return priceObj ? priceObj.price : 0;
    }, [fotocopyPrices, fcPaper, fcColor, fcSide]);

    const fcTotal = fcPrice * fcQty;

    const addFotocopyToCart = () => {
        if (fcQty < 1) {
            alert('Jumlah lembar minimal 1');
            return;
        }
        
        const label = `${fcPaper} - ${fcColor === 'bw' ? 'B/W' : 'Warna'} - ${fcSide === '1' ? '1 Sisi' : 'Bolak-balik'}`;
        const fotocopyItem = {
            id: `fc_${Date.now()}`,
            name: `Fotocopy ${label}`,
            sellPrice: fcPrice,
            quantity: parseInt(fcQty),
            type: 'fotocopy',
            specs: { paper: fcPaper, color: fcColor, side: fcSide }
        };
        
        setCart(prevCart => [...prevCart, fotocopyItem]);
        // Reset form
        setFcQty(1);
    };


    const renderPaymentModalContent = () => {
        if (transactionComplete) {
            return (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <FiCheckCircle size={64} color="#10b981" />
                    <h3 style={{ fontSize: '1.5rem', marginTop: '16px' }}>Transaksi Berhasil!</h3>
                    <p style={{ color: '#6b7280' }}>No. Invoice: {transactionComplete.invoiceNo}</p>
                    <button onClick={closeAndResetModal} style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '16px', fontSize: '1.1rem', fontWeight: 600, marginTop: '24px', cursor: 'pointer' }}>
                        Transaksi Baru
                    </button>
                </div>
            );
        }

        return (
            <div>
                <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center', marginBottom: '16px' }}>
                    <p style={{ color: '#6b7280' }}>Total Tagihan</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981', margin: '8px 0' }}>{formatRupiah(cartTotal)}</p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Metode Pembayaran</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['tunai', 'qris', 'kartu'].map(method => (
                            <button key={method} onClick={() => setPaymentMethod(method)} style={{
                                flex: 1, padding: '12px', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase',
                                border: paymentMethod === method ? '2px solid #10b981' : '2px solid #d1d5db',
                                backgroundColor: paymentMethod === method ? '#d1fae5' : 'white',
                                color: paymentMethod === method ? '#065f46' : '#374151',
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
                            type="number"
                            value={amountPaid}
                            onChange={e => setAmountPaid(e.target.value)}
                            placeholder="e.g. 100000"
                            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1.25rem' }}
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
        <>
            {/* Running Text / Marquee */}
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .running-text {
                    animation: marquee 80s linear infinite;
                    white-space: nowrap;
                    font-family: 'Segoe UI', 'Arial Black', sans-serif;
                }
            `}</style>
            
            <div style={{ 
                background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 50%, #1e3a8a 100%)',
                color: 'white',
                padding: '14px 0',
                overflow: 'hidden',
                borderRadius: '8px',
                marginBottom: '12px',
                width: '100%',
                maxWidth: '100%'
            }}>
                <div className="running-text" style={{ 
                    display: 'inline-block',
                    paddingLeft: '100%',
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    letterSpacing: '2px'
                }}>
                    {runningText.repeat(10)}
                </div>
            </div>

            <div style={{ display: 'flex', height: 'calc(100vh - 180px)', padding: '12px', gap: '12px', backgroundColor: '#f3f4f6' }}>
            {/* Product Area */}
            <div style={{ flex: 2, backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '12px' }}>
                    <button
                        onClick={() => setActiveTab('products')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            backgroundColor: activeTab === 'products' ? '#3b82f6' : '#f3f4f6',
                            color: activeTab === 'products' ? 'white' : '#6b7280',
                        }}
                    >
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
                            backgroundColor: activeTab === 'fotocopy' ? '#3b82f6' : '#f3f4f6',
                            color: activeTab === 'fotocopy' ? 'white' : '#6b7280',
                        }}
                    >
                        FOTOCOPY
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'products' ? (
                    <>
                        <h2 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', marginBottom: '16px' }}>Pilih Produk</h2>
                        <input
                            type="text"
                            placeholder="Cari produk (nama/kode)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem', marginBottom: '16px' }}
                        />
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                                {filteredProducts.map(product => (
                                    <div key={product.id} onClick={() => addToCart(product)} style={{
                                        border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                                        opacity: product.stock > 0 ? 1 : 0.5, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'
                                    }}>
                                        {product.stock === 0 && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)', color: 'red', fontWeight: 'bold', fontSize: '1.2rem', background: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: '4px' }}>HABIS</div>}
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }} />
                                        ) : (
                                            <FiPackage size={64} color="#9ca3af" />
                                        )}
                                        <div style={{ fontWeight: 600, marginTop: '8px', minHeight: '40px', textAlign: 'center' }}>{product.name}</div>
                                        <div style={{ color: '#6b7280', textAlign: 'center' }}>Stok: {product.stock}</div>
                                        <div style={{ color: '#10b981', fontWeight: 700, marginTop: '4px', textAlign: 'center' }}>{formatRupiah(product.sellPrice)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', marginBottom: '16px' }}>Layanan Fotocopy</h2>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
                                {/* Paper Type Selection */}
                                <div>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Jenis Kertas</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {['HVS A4', 'HVS F4', 'HVS A3'].map(paper => (
                                            <button
                                                key={paper}
                                                onClick={() => setFcPaper(paper)}
                                                style={{
                                                    flex: 1,
                                                    padding: '12px',
                                                    borderRadius: '6px',
                                                    border: fcPaper === paper ? '2px solid #3b82f6' : '2px solid #d1d5db',
                                                    backgroundColor: fcPaper === paper ? '#eff6ff' : 'white',
                                                    color: fcPaper === paper ? '#1d4ed8' : '#374151',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {paper}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Selection */}
                                <div>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Warna</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => setFcColor('bw')}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: '6px',
                                                border: fcColor === 'bw' ? '2px solid #3b82f6' : '2px solid #d1d5db',
                                                backgroundColor: fcColor === 'bw' ? '#eff6ff' : 'white',
                                                color: fcColor === 'bw' ? '#1d4ed8' : '#374151',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            B/W (Hitam Putih)
                                        </button>
                                        <button
                                            onClick={() => setFcColor('color')}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: '6px',
                                                border: fcColor === 'color' ? '2px solid #3b82f6' : '2px solid #d1d5db',
                                                backgroundColor: fcColor === 'color' ? '#eff6ff' : 'white',
                                                color: fcColor === 'color' ? '#1d4ed8' : '#374151',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Warna
                                        </button>
                                    </div>
                                </div>

                                {/* Side Selection */}
                                <div>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Sisi</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => setFcSide('1')}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: '6px',
                                                border: fcSide === '1' ? '2px solid #3b82f6' : '2px solid #d1d5db',
                                                backgroundColor: fcSide === '1' ? '#eff6ff' : 'white',
                                                color: fcSide === '1' ? '#1d4ed8' : '#374151',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            1 Sisi
                                        </button>
                                        <button
                                            onClick={() => setFcSide('2')}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: '6px',
                                                border: fcSide === '2' ? '2px solid #3b82f6' : '2px solid #d1d5db',
                                                backgroundColor: fcSide === '2' ? '#eff6ff' : 'white',
                                                color: fcSide === '2' ? '#1d4ed8' : '#374151',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Bolak-balik
                                        </button>
                                    </div>
                                </div>

                                {/* Quantity Input */}
                                <div>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Jumlah Lembar</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <button
                                            onClick={() => setFcQty(Math.max(1, fcQty - 1))}
                                            style={{ width: '40px', height: '40px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontSize: '1.25rem', fontWeight: 600 }}
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={fcQty}
                                            onChange={(e) => setFcQty(Math.max(1, parseInt(e.target.value) || 1))}
                                            min="1"
                                            style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1.25rem', textAlign: 'center', fontWeight: 600 }}
                                        />
                                        <button
                                            onClick={() => setFcQty(fcQty + 1)}
                                            style={{ width: '40px', height: '40px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontSize: '1.25rem', fontWeight: 600 }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Price Display */}
                                <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ color: '#6b7280', marginBottom: '4px' }}>Harga per lembar</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{formatRupiah(fcPrice)}</div>
                                    <div style={{ color: '#6b7280', marginTop: '8px' }}>Total</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{formatRupiah(fcTotal)}</div>
                                </div>

                                {/* Add to Cart Button */}
                                <button
                                    onClick={addFotocopyToCart}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Tambah ke Keranjang
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Cart Area */}
            <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827' }}>Keranjang</h2>
                    {cart.length > 0 && <button onClick={clearCart} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Bersihkan</button>}
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {cart.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexDirection: 'column', gap: '8px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#d1d5db' }}><path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .49.598l-1 5a.5.5 0 0 1-.49.402H3.21l.94 4.705A.5.5 0 0 0 4.646 14h7.708a.5.5 0 0 1 0 1H4.646a1.5 1.5 0 0 1-1.48-1.765L2.1 2.528A1.5 1.5 0 0 1 3.5 1H14.5a1.5 1.5 0 0 1 1.48 1.408l-1 5A1.5 1.5 0 0 1 13.5 9H3.414l-.94-4.705A.5.5 0 0 0 2 3.5H.5a.5.5 0 0 1-.5-.5zM3.14 4l.79 3.973h8.61l.79-3.973H3.14zM5 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>
                            <p>Pilih produk untuk memulai.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                                    <div style={{ color: '#6b7280' }}>{formatRupiah(item.sellPrice)} x {item.quantity}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button onClick={() => updateQuantity(item.id, -1)} style={{ width: 28, height: 28, border: '1px solid #d1d5db', borderRadius: '4px', background: '#f9fafb', cursor: 'pointer' }}>-</button>
                                    <button onClick={() => updateQuantity(item.id, 1)} style={{ width: 28, height: 28, border: '1px solid #d1d5db', borderRadius: '4px', background: '#f9fafb', cursor: 'pointer' }}>+</button>
                                </div>
                                <div style={{ width: '90px', textAlign: 'right', fontWeight: 600, marginLeft: '16px' }}>{formatRupiah(item.sellPrice * item.quantity)}</div>
                            </div>
                        ))
                    )}
                </div>
                {cart.length > 0 && (
                    <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Subtotal</span><span style={{ fontWeight: 600 }}>{formatRupiah(cartTotal)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#6b7280' }}><span>Pajak & Diskon</span><span>{formatRupiah(0)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}><span>Grand Total</span><span>{formatRupiah(cartTotal)}</span></div>
                        <button onClick={openPaymentModal} style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '16px', fontSize: '1.1rem', fontWeight: 600, marginTop: '16px', cursor: 'pointer' }}>Bayar</button>
                    </div>
                )}
            </div>
            
            {/* Payment Modal */}
            <Modal isOpen={isPaymentModalOpen} onClose={closeAndResetModal} title={transactionComplete ? 'Sukses' : 'Proses Pembayaran'} footer={!transactionComplete && (
                <button onClick={handleConfirmPayment} disabled={!isPaymentValid} style={{
                    width: '100%', background: isPaymentValid ? '#10b981' : '#d1d5db', color: 'white', border: 'none', borderRadius: '6px', padding: '16px', fontSize: '1.1rem', fontWeight: 600, cursor: isPaymentValid ? 'pointer' : 'not-allowed'
                }}>Konfirmasi Pembayaran</button>
            )}>
                {renderPaymentModalContent()}
            </Modal>
            </div>
        </>
    );
}
