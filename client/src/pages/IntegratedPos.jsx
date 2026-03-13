import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';
import db from '../db';
import seedData from '../seed';
import { formatRupiah, generateInvoice, generateRawReceipt, printViaRawBT } from '../utils';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { FiCheckCircle, FiTrash2, FiPlus, FiMinus, FiSearch, FiBell, FiUser, FiPrinter, FiSave, FiChevronRight } from 'react-icons/fi';

export default function IntegratedPos({ onNavigate }) {
    // Basic States
    const [activeServiceTab, setActiveServiceTab] = useState('fotocopy'); // 'fotocopy' | 'jilid' | 'cetak'
    const [products, setProducts] = useState([]);
    const [fotocopyPrices, setFotocopyPrices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [isMobile] = useState(window.innerWidth < 1024);

    // Search Input Ref for F5 focus
    const searchInputRef = useRef(null);

    // Initial Data Loading
    useEffect(() => {
        seedData();
        setProducts(db.getAll('products'));
        api.get('/transactions/fotocopy-prices')
            .then(res => setFotocopyPrices(res.data))
            .catch(() => setFotocopyPrices(db.getAll('fotocopy_prices')));
    }, []);

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

    // Keyboard Shortcuts (F1-F12 as per design)
    const shortcuts = useMemo(() => ({
        'F1': () => setActiveServiceTab('fotocopy'),
        'F2': () => setActiveServiceTab('jilid'),
        'F3': () => setActiveServiceTab('cetak'),
        'F5': () => searchInputRef.current?.focus(),
        'F10': () => openPayment(),
        'F12': () => saveQueue(),
        'Escape': () => removeAll(),
    }), []);

    useKeyboardShortcuts(shortcuts);

    const openPayment = () => { if (cart.length > 0) alert('Proceeding to payment...'); };
    const saveQueue = () => { if (cart.length > 0) alert('Order saved to queue.'); };

    // Cart Calculation
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.sellPrice * item.quantity), 0), [cart]);

    return (
        <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* Header */}
            <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-10 bg-primary rounded-lg text-white">
                        <span className="material-symbols-outlined text-2xl">point_of_sale</span>
                    </div>
                    <h1 className="text-xl font-bold leading-tight tracking-tight">Kasir Terpadu</h1>
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

                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">
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

            {/* Main Content */}
            <main className="flex flex-1 overflow-hidden">
                {/* Left Side: Services and Products */}
                <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
                    {/* Service Sections (Tabbed) */}
                    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1">
                        <div className="flex border-b border-slate-100 dark:border-slate-800">
                            {[
                                { id: 'fotocopy', label: 'Fotocopy', icon: 'content_copy', kbd: 'F1' },
                                { id: 'jilid', label: 'Jilid', icon: 'book', kbd: 'F2' },
                                { id: 'cetak', label: 'Cetak', icon: 'print', kbd: 'F3' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveServiceTab(tab.id)}
                                    className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 border-b-2 transition-all ${activeServiceTab === tab.id
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeServiceTab === tab.id ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                        }`}>{tab.kbd}</span>
                                    <span className="material-symbols-outlined">{tab.icon}</span> {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="p-6">
                            {/* Service Content Placeholder */}
                            <div className="flex flex-wrap gap-3 mb-6">
                                {['A4', 'F4', 'Warna', 'Hitam Putih', 'Bolak-balik'].map(opt => (
                                    <button key={opt} className="px-5 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-primary hover:text-white transition-all">
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {activeServiceTab === 'jilid' ? (
                                    <>
                                        {['Spiral', 'Mika', 'Hardcover', 'Lakban'].map(type => (
                                            <div key={type} className="group cursor-pointer p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary hover:bg-primary/5 transition-all">
                                                <span className="material-symbols-outlined text-primary mb-2 text-3xl">book</span>
                                                <h3 className="font-bold">{type}</h3>
                                                <p className="text-xs text-slate-500">Jilid Dokumen</p>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="col-span-4 py-8 text-center text-slate-500 italic">
                                        Konfigurasi layanan {activeServiceTab} akan muncul di sini...
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Retail Products Section */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold">Produk Retail ATK</h2>
                                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 uppercase tracking-tighter">F5 - Cari ATK</span>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary">
                                <FiSearch />
                            </div>
                            <input
                                ref={searchInputRef}
                                className="w-full pl-12 pr-4 py-4 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-primary text-base transition-all outline-none"
                                placeholder="Cari produk ATK (Pena, Buku, Kertas...)"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                            {filteredProducts.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-2 group"
                                >
                                    <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center transition-colors group-hover:bg-primary/10">
                                        {p.image ? (
                                            <img src={p.image} alt={p.name} className="size-full object-cover rounded-lg" />
                                        ) : (
                                            <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary transition-colors">edit</span>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm truncate">{p.name}</h4>
                                        <p className="text-primary font-bold text-sm">{formatRupiah(p.sellPrice)}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Stok: {p.stock} {p.unit}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Cart Summary */}
                <aside className="w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl relative z-10">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold">Ringkasan</h2>
                            <button onClick={removeAll} className="text-slate-400 hover:text-red-500 transition-colors">
                                <FiTrash2 size={20} />
                            </button>
                        </div>
                        <div className="text-xs text-slate-500">Order ID: #INV-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001</div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                                <span className="material-symbols-outlined text-6xl">shopping_cart</span>
                                <p className="font-medium text-sm">Keranjang Kosong</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex gap-3 group animate-in fade-in slide-in-from-right-2">
                                    <div className="size-10 bg-primary/10 rounded flex items-center justify-center text-primary shrink-0">
                                        <span className="material-symbols-outlined text-xl">
                                            {item.type === 'fotocopy' ? 'content_copy' : 'edit'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="text-sm font-bold truncate">{item.name}</h5>
                                        <div className="flex items-center justify-between mt-1">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => updateQty(item.id, -1)} className="size-6 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors">
                                                    <FiMinus size={12} />
                                                </button>
                                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQty(item.id, 1)} className="size-6 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors">
                                                    <FiPlus size={12} />
                                                </button>
                                            </div>
                                            <div className="text-sm font-bold text-primary">{formatRupiah(item.sellPrice * item.quantity)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Subtotal</span>
                                <span className="font-semibold">{formatRupiah(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-slate-500 text-sm">Diskon</span>
                                <button className="flex items-center gap-1.5 text-xs text-primary font-bold border border-primary/30 px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-primary/5 transition-colors">
                                    <span className="bg-primary/10 text-primary px-1 rounded text-[10px]">F9</span>
                                    <span>Tambah Diskon</span>
                                </button>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-end mb-6">
                                <span className="font-bold text-slate-600 dark:text-slate-400">Total Tagihan</span>
                                <span className="text-3xl font-black text-primary">{formatRupiah(subtotal)}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 mb-4">
                                <button onClick={saveQueue} className="flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900">
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 rounded text-[10px]">F12</span>
                                    <FiSave /> Simpan Antrean
                                </button>
                            </div>
                            <button onClick={openPayment} className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 flex items-center justify-center gap-3 transition-transform active:scale-95 group">
                                <span className="bg-white/20 px-1.5 rounded text-xs">F10</span>
                                <span>Bayar Sekarang</span>
                                <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Shortcut Help Bar */}
            <div className="bg-slate-800 text-slate-300 py-1.5 px-6 flex items-center gap-6 overflow-x-auto whitespace-nowrap border-t border-slate-700 z-50">
                <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">keyboard</span> BANTUAN TOMBOL:
                </span>
                <div className="flex gap-4">
                    {[
                        { k: 'F1', l: 'Fotocopy' },
                        { k: 'F2', l: 'Jilid' },
                        { k: 'F3', l: 'Cetak' },
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
