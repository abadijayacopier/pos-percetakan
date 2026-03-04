import { useState, useMemo, useCallback, useEffect } from 'react';
import api from '../services/api';
import db from '../db';
import { formatRupiah, generateInvoice, today, generateRawReceipt } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import {
    FiShoppingCart, FiFile, FiPrinter, FiBook, FiCamera, FiClock,
    FiSearch, FiPlus, FiTrash2, FiX, FiTag, FiUser, FiCreditCard,
    FiPackage, FiEdit, FiAlertCircle, FiShoppingBag,
    FiDelete, FiSquare, FiArrowDown, FiMinus, FiCheck, FiRefreshCw, FiMessageCircle, FiInfo
} from 'react-icons/fi';
// Volume discount for fotocopy (dikalkulasi secara dinamis saat addFotocopy)
const getVolumeDiscountDynamic = (qty, basePrice, fcDiscountsList) => {
    // Pastikan rule di sort dari minQty tertinggi ke terendah
    const sortedRules = [...(fcDiscountsList || [])].sort((a, b) => b.minQty - a.minQty);
    for (const rule of sortedRules) {
        if (qty >= rule.minQty && rule.discountPerSheet > 0) {
            return basePrice - rule.discountPerSheet;
        }
    }
    return basePrice;
};

export default function PosPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('atk');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [discount, setDiscount] = useState(0);

    // Payment modal
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [payMethod, setPayMethod] = useState('tunai');
    const [cashReceived, setCashReceived] = useState('');

    // Fotocopy state
    const [fcPaper, setFcPaper] = useState('HVS A4');
    const [fcColor, setFcColor] = useState('bw');
    const [fcSide, setFcSide] = useState('1');
    const [fcQty, setFcQty] = useState('');

    // Print state
    const [printPaper, setPrintPaper] = useState('HVS A4');
    const [printColor, setPrintColor] = useState('bw');
    const [printQty, setPrintQty] = useState('');

    // Banner state
    const [bannerMaterial, setBannerMaterial] = useState('Flexy 280gr');
    const [bannerLength, setBannerLength] = useState('');
    const [bannerWidth, setBannerWidth] = useState('');
    const [bannerQty, setBannerQty] = useState('1');
    const [bannerDesignFee, setBannerDesignFee] = useState('0');

    // Jilid state
    const [bindType, setBindType] = useState('');
    const [bindQty, setBindQty] = useState('');

    // Foto state
    const [photoSize, setPhotoSize] = useState('4x6');
    const [photoCustomP, setPhotoCustomP] = useState('');
    const [photoCustomL, setPhotoCustomL] = useState('');
    const [photoPrice, setPhotoPrice] = useState('2000');
    const [photoQty, setPhotoQty] = useState('');

    const [receiptOpen, setReceiptOpen] = useState(false);
    const [lastReceipt, setLastReceipt] = useState(null);

    // History Modal
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyData, setHistoryData] = useState([]);

    const [printerType, setPrinterType] = useState('58mm');
    const [storeInfo, setStoreInfo] = useState({ name: 'FOTOCOPY ABADI JAYA', address: '', phone: '', footer: 'Terima Kasih!' });
    const [isMobile, setIsMobile] = useState(false);

    // Deteksi perangkat mobile/desktop
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768 || navigator.maxTouchPoints > 1;
            setIsMobile(mobile);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [fotocopyPrices, setFotocopyPrices] = useState([]);
    const [fcDiscounts, setFcDiscounts] = useState([]);
    const [printPrices, setPrintPrices] = useState([]);
    const [bindPrices, setBindPrices] = useState([]);
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [prodRes, catRes, custRes, fcRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/products/categories'),
                    api.get('/customers').catch(() => ({ data: [] })), // Will add this route soon
                    api.get('/transactions/fotocopy-prices')
                ]);
                setProducts(prodRes.data);
                setCategories(catRes.data.filter(c => c.type === 'atk' || c.type === 'fotocopy_supply'));
                setCustomers(custRes.data);
                setFotocopyPrices(fcRes.data);

                // Load Settings for Printer & Store Info
                const settingsList = db.getAll('settings');
                const getSet = (k) => settingsList.find(s => s.key === k)?.value || '';

                const pp = getSet('print_prices');
                if (pp) {
                    setPrintPrices(JSON.parse(pp));
                } else {
                    setPrintPrices([
                        { id: '1', paper: 'HVS A4', color: 'bw', price: 500 },
                        { id: '2', paper: 'HVS A4', color: 'color', price: 1000 },
                        { id: '3', paper: 'HVS F4', color: 'bw', price: 600 },
                        { id: '4', paper: 'HVS F4', color: 'color', price: 1200 },
                        { id: '5', paper: 'Art Paper', color: 'color', price: 5000 },
                        { id: '5b', paper: 'Art Paper', color: 'bw', price: 4000 },
                        { id: '6', paper: 'Sticker Cromo', color: 'color', price: 6000 },
                        { id: '6b', paper: 'Sticker Cromo', color: 'bw', price: 5000 },
                        { id: '7', paper: 'Sticker Vinyl', color: 'color', price: 8000 },
                        { id: '7b', paper: 'Sticker Vinyl', color: 'bw', price: 7000 }
                    ]);
                }

                const fp = getSet('fc_discounts');
                if (fp) setFcDiscounts(JSON.parse(fp));
                else setFcDiscounts([
                    { id: '1', minQty: 100, discountPerSheet: 50 },
                    { id: '2', minQty: 500, discountPerSheet: 75 },
                    { id: '3', minQty: 1000, discountPerSheet: 100 }
                ]);

                const bp = getSet('bind_prices');
                if (bp) {
                    const parsedBp = JSON.parse(bp);
                    setBindPrices(parsedBp);
                    if (parsedBp.length > 0) setBindType(parsedBp[0].type);
                }
                else {
                    const defBp = [
                        { id: '1', type: 'Jilid Lakban (Biasa)', price: 3000 },
                        { id: '2', type: 'Jilid Mika', price: 5000 },
                        { id: '3', type: 'Jilid Spiral Kawat', price: 15000 },
                        { id: '4', type: 'Jilid Spiral Plastik', price: 10000 },
                        { id: '5', type: 'Jilid Soft Cover', price: 25000 },
                        { id: '6', type: 'Jilid Hard Cover', price: 40000 }
                    ];
                    setBindPrices(defBp);
                    setBindType('Jilid Lakban (Biasa)');
                }

                setPrinterType(getSet('printer_size') || '58mm');
                setStoreInfo({
                    name: getSet('store_name') || 'FOTOCOPY ABADI JAYA',
                    address: getSet('store_address') || '',
                    phone: getSet('store_phone') || '',
                    logo: getSet('store_logo') || '',
                    footer: getSet('receipt_footer') || 'Terima kasih telah berbelanja!',
                    paperSize: getSet('paper_size') || 'A4'
                });

            } catch (err) {
                console.error("Gagal load data POS", err);
            }
        };
        loadInitialData();
    }, []);

    const filteredProducts = useMemo(() => {
        let items = products;
        if (selectedCategory !== 'all') items = items.filter(p => p.categoryId === selectedCategory);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
        }
        return items;
    }, [products, selectedCategory, searchQuery]);

    const addToCart = useCallback((product) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                if (existing.qty >= product.stock) { showToast(`Stok ${product.name} tidak cukup!`, 'warning'); return prev; }
                return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.price } : i);
            }
            if (product.stock <= 0) { showToast(`${product.name} habis!`, 'error'); return prev; }
            return [...prev, { id: product.id, productId: product.id, name: product.name, price: product.sellPrice, qty: 1, subtotal: product.sellPrice, type: 'product' }];
        });
    }, [showToast]);

    const updateCartQty = (id, delta) => {
        setCart(prev => prev.map(i => {
            if (i.id !== id) return i;
            const newQty = i.qty + delta;
            if (newQty <= 0) return null;
            return { ...i, qty: newQty, subtotal: newQty * i.price };
        }).filter(Boolean));
    };

    const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

    // Fotocopy add
    const addFotocopy = () => {
        const qty = parseInt(fcQty);
        if (!qty || qty <= 0) { showToast('Masukkan jumlah lembar!', 'warning'); return; }
        const priceEntry = fotocopyPrices.find(p => String(p.paper) === String(fcPaper) && String(p.color) === String(fcColor) && String(p.side) === String(fcSide));
        if (!priceEntry) { showToast(`Harga untuk ${fcPaper} ${fcColor === 'bw' ? 'H/P' : 'Warna'} Sisi ${fcSide} belum diatur!`, 'error'); return; }
        const perSheet = getVolumeDiscountDynamic(qty, priceEntry.price, fcDiscounts);
        const subtotal = qty * perSheet;
        const discountAmt = qty * (priceEntry.price - perSheet);

        const itemId = `fc-${Date.now()}`;
        setCart(prev => [...prev, {
            id: itemId, name: priceEntry.label, price: perSheet, originalPrice: priceEntry.price, qty, subtotal, discount: discountAmt, type: 'fotocopy'
        }]);
        setFcQty('');
        showToast(`${qty} lembar ditambahkan ke keranjang`, 'success');
    };

    // Print add
    const addJasaPrint = () => {
        const qty = parseInt(printQty);
        if (!qty || qty <= 0) { showToast('Masukkan jumlah lembar print!', 'warning'); return; }

        const priceEntry = printPrices.find(p => String(p.paper) === String(printPaper) && String(p.color) === String(printColor));
        if (!priceEntry) { showToast(`Harga Print untuk ${printPaper} ${printColor === 'bw' ? 'B/W' : 'Warna'} tidak ditemukan!`, 'error'); return; }

        let price = parseInt(priceEntry.price) || 0;
        let label = `Print ${printPaper} (${printColor === 'bw' ? 'B&W' : 'Warna'})`;

        const subtotal = qty * price;
        const itemId = `pr-${Date.now()}`;
        setCart(prev => [...prev, {
            id: itemId, name: label, price, originalPrice: price, qty, subtotal, discount: 0, type: 'print'
        }]);
        setPrintQty('');
        showToast(`Jasa Print ditambahkan`, 'success');
    };

    // Jilid add
    const addJilid = () => {
        const qty = parseInt(bindQty);
        if (!qty || qty <= 0) { showToast('Masukkan jumlah buku yang dijilid!', 'warning'); return; }

        const priceEntry = bindPrices.find(p => p.type === bindType);
        if (!priceEntry) { showToast('Harga jilid tidak ditemukan di pengaturan!', 'error'); return; }

        let price = parseInt(priceEntry.price) || 0;
        let label = `${bindType}`;

        const subtotal = qty * price;
        const itemId = `jl-${Date.now()}`;
        setCart(prev => [...prev, {
            id: itemId, name: label, price, originalPrice: price, qty, subtotal, discount: 0, type: 'jilid'
        }]);
        setBindQty('');
        showToast(`Jasa Jilid ditambahkan`, 'success');
    };

    // Cetak Foto add
    const addFoto = () => {
        const qty = parseInt(photoQty);
        if (!qty || qty <= 0) { showToast('Masukkan jumlah lembar foto!', 'warning'); return; }

        const pricePerSheet = parseInt(photoPrice);
        if (!pricePerSheet || pricePerSheet <= 0) { showToast('Input Harga per Lembar tidak valid!', 'warning'); return; }

        let sizeLabel = photoSize;
        if (photoSize === 'Custom') {
            const p = parseFloat(photoCustomP);
            const l = parseFloat(photoCustomL);
            if (!p || !l) { showToast('Ukuran Custom (PxL) foto tidak lengkap!', 'warning'); return; }
            sizeLabel = `${p} x ${l} cm`;
        }

        let label = `Cetak Foto ${sizeLabel}`;
        const subtotal = qty * pricePerSheet;
        const itemId = `ft-${Date.now()}`;
        setCart(prev => [...prev, {
            id: itemId, name: label, price: pricePerSheet, originalPrice: pricePerSheet, qty, subtotal, discount: 0, type: 'foto'
        }]);
        setPhotoQty('');
        showToast(`Cetak Foto ditambahkan`, 'success');
    };

    const numpadClick = (val) => {
        if (activeTab === 'fotocopy') {
            if (val === 'C') { setFcQty(''); return; }
            if (val === 'DEL') { setFcQty(prev => prev.slice(0, -1)); return; }
            setFcQty(prev => prev + val);
        } else if (activeTab === 'print') {
            if (val === 'C') { setPrintQty(''); return; }
            if (val === 'DEL') { setPrintQty(prev => prev.slice(0, -1)); return; }
            setPrintQty(prev => prev + val);
        } else if (activeTab === 'jilid') {
            if (val === 'C') { setBindQty(''); return; }
            if (val === 'DEL') { setBindQty(prev => prev.slice(0, -1)); return; }
            setBindQty(prev => prev + val);
        } else if (activeTab === 'foto') {
            if (val === 'C') { setPhotoQty(''); return; }
            if (val === 'DEL') { setPhotoQty(prev => prev.slice(0, -1)); return; }
            setPhotoQty(prev => prev + val);
        }
    };

    // Totals
    const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
    const totalDiscount = discount + cart.reduce((s, i) => s + (i.discount || 0), 0);
    const total = subtotal - discount;
    const cashNum = parseInt(cashReceived) || 0;
    const change = cashNum - total;

    // Process payment
    const processPayment = async () => {
        if (payMethod === 'tunai' && cashNum < total) { showToast('Uang tidak cukup!', 'error'); return; }

        const invoiceNo = generateInvoice('TRX');
        const trxData = {
            invoiceNo, date: new Date().toISOString(),
            customerId: selectedCustomer?.id || null,
            customerName: selectedCustomer?.name || 'Umum',
            type: cart.some(i => i.type === 'fotocopy') ? 'fotocopy' : 'sale',
            subtotal, discount: totalDiscount, total,
            paid: payMethod === 'tunai' ? cashNum : total,
            changeAmount: payMethod === 'tunai' ? Math.max(0, change) : 0,
            paymentType: payMethod, status: payMethod === 'hutang' ? 'unpaid' : 'paid',
            items: cart.map(i => ({ id: i.productId || null, name: i.name, qty: i.qty, price: i.price, subtotal: i.subtotal, discount: i.discount || 0, source: i.type === 'product' ? 'atk' : 'fc' }))
        };

        try {
            await api.post('/transactions', trxData);

            // Format receipt data
            const receipt = {
                ...trxData,
                userName: user.name,
                change: trxData.changeAmount,
                customerPhone: selectedCustomer?.phone || ''
            };

            setLastReceipt(receipt);
            setPaymentOpen(false);
            setReceiptOpen(true);
            setCart([]);
            setDiscount(0);
            setCashReceived('');
            setSelectedCustomer(null);
            showToast(`Transaksi ${invoiceNo} berhasil!`, 'success');
            db.logActivity(user.name, 'Transaksi Baru', `${invoiceNo} - ${formatRupiah(total)} (${payMethod})`);

            // Optionally refresh products explicitly if stock matters:
            const prodRes = await api.get('/products');
            setProducts(prodRes.data);

        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || 'Gagal menyimpan transaksi!', 'error');
        }
    };

    // History Functions
    const loadHistory = async () => {
        try {
            const res = await api.get('/transactions');
            setHistoryData(res.data);
            setHistoryOpen(true);
        } catch (error) {
            showToast('Gagal memuat riwayat transaksi', 'error');
        }
    };

    const previewTransaction = async (id) => {
        try {
            const res = await api.get(`/transactions/${id}`);
            setLastReceipt({ ...res.data, change: res.data.changeAmount });
            setHistoryOpen(false);
            setReceiptOpen(true);
        } catch (error) {
            showToast('Gagal memuat detail transaksi', 'error');
        }
    };

    const voidTransaction = async (id, invoiceNo) => {
        if (!window.confirm(`Yakin ingin VOID / Hapus transaksi ${invoiceNo}? Stok akan dikembalikan dan kas dibatalkan.`)) return;
        try {
            await api.delete(`/transactions/${id}`);
            showToast(`Transaksi ${invoiceNo} berhasil di-void!`, 'success');
            db.logActivity(user.name, 'Void Transaksi', `${invoiceNo} di-void`);
            const res = await api.get('/transactions'); // reload
            setHistoryData(res.data);
            // Refresh stock
            const prodRes = await api.get('/products');
            setProducts(prodRes.data);
        } catch (error) {
            showToast('Gagal menghapus transaksi', 'error');
        }
    };

    const editTransaction = async (id, invoiceNo) => {
        if (!window.confirm(`Edit transaksi ${invoiceNo}? Transaksi saat ini akan di-void dan data dikembalikan ke keranjang.`)) return;
        try {
            const detailRes = await api.get(`/transactions/${id}`);
            const trx = detailRes.data;

            // 1. Masukkan ke keranjang
            setCart(trx.items.map((i, idx) => ({
                id: i.productId || `fc-edit-${Date.now()}-${idx}`,
                productId: i.productId,
                name: i.name,
                price: i.price,
                qty: i.qty,
                subtotal: i.subtotal,
                discount: i.discount,
                type: i.source === 'atk' ? 'product' : 'fotocopy',
                originalPrice: i.price
            })));
            setDiscount(trx.discount);

            if (trx.customerId) {
                const c = customers.find(x => x.id === trx.customerId);
                setSelectedCustomer(c || { id: trx.customerId, name: trx.customerName });
            } else {
                setSelectedCustomer(null);
            }

            // 2. Void dari database
            await api.delete(`/transactions/${id}`);

            // 3. Tutup Modal & Refresh
            setHistoryOpen(false);
            showToast('Data diload ke keranjang! Silakan edit dan bayar kembali.', 'info');
            const prodRes = await api.get('/products');
            setProducts(prodRes.data);

        } catch (error) {
            showToast('Gagal memproses edit transaksi', 'error');
        }
    };

    // ----- WHATSAPP SENDER -----
    const sendWaReceipt = () => {
        if (!lastReceipt) return;
        let p = lastReceipt.customerPhone;
        if (!p) {
            p = prompt("Masukkan nomor WhatsApp pelanggan (misal: 0812... dsb):");
            if (!p) return;
        }

        // Format No HP (Mulai dengan 62)
        if (p.startsWith('0')) p = '62' + p.substring(1);
        else if (p.startsWith('+62')) p = p.substring(1);

        // Buat Template Teks
        let text = `*${storeInfo.name}*\n`;
        text += `${storeInfo.address}\n\n`;
        text += `No Invoice: ${lastReceipt.invoiceNo}\n`;
        text += `Tanggal: ${new Date(lastReceipt.date).toLocaleString('id-ID')}\n`;
        text += `--------------------------------\n`;
        lastReceipt.items.forEach(i => {
            text += `${i.name}\n${i.qty} x ${formatRupiah(i.price)} = ${formatRupiah(i.subtotal)}\n`;
        });
        text += `--------------------------------\n`;
        text += `Total: *${formatRupiah(lastReceipt.total)}*\n`;
        text += `Bayar (${lastReceipt.paymentType.toUpperCase()}): ${formatRupiah(lastReceipt.paid || lastReceipt.total)}\n`;
        if (lastReceipt.change > 0) text += `Kembali: ${formatRupiah(lastReceipt.change)}\n`;
        text += `\n${storeInfo.footer}\n`;

        window.open(`https://wa.me/${p}?text=${encodeURIComponent(text)}`, '_blank');
    };

    // ----- DIRECT PRINT SENDER -----
    const handlePrint = async () => {
        if (isMobile) {
            // Mobile: gunakan window.print() → dialog browser → pilih Bluetooth printer
            window.print();
        } else {
            // Desktop: kirim ke backend
            const printerName = db.getAll('settings').find(s => s.key === 'printer_name')?.value;
            if (printerName) {
                try {
                    const text = generateRawReceipt(lastReceipt, storeInfo, printerType);
                    const payload = { text, printerName };
                    if (printerType === 'lx310') {
                        payload.raw = true; // Dot matrix: font bawaan printer
                    } else if (printerType === 'inkjet') {
                        payload.mode = 'inkjet'; // Inkjet/Laser: Courier New + paper size
                        payload.paperSize = storeInfo.paperSize || 'A4';
                    }
                    await api.post('/print/receipt', payload);
                    showToast(`Struk dicetak ke ${printerName}!`, 'success');
                } catch (err) {
                    console.error(err);
                    showToast(err.response?.data?.message || 'Gagal mengirim instruksi cetak ke Hardware', 'error');
                }
            } else {
                showToast('Nama printer belum diatur di Pengaturan!', 'error');
            }
        }
    };

    return (
        <div className="pos-layout premium-pos-wrapper">


            {/* Left: Catalog */}
            <div className="pos-catalog">
                <div className="pos-catalog-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <div className="tabs" style={{ flex: 1, minWidth: 0 }}>
                            <button className={`tab-btn ${activeTab === 'atk' ? 'active' : ''}`} onClick={() => setActiveTab('atk')}><FiShoppingCart /> ATK</button>
                            <button className={`tab-btn ${activeTab === 'fotocopy' ? 'active' : ''}`} onClick={() => setActiveTab('fotocopy')}><FiFile /> Fotocopy</button>
                            <button className={`tab-btn ${activeTab === 'print' ? 'active' : ''}`} onClick={() => setActiveTab('print')}><FiPrinter /> Percetakan</button>
                            <button className={`tab-btn ${activeTab === 'jilid' ? 'active' : ''}`} onClick={() => setActiveTab('jilid')}><FiBook /> Service & Jilid</button>
                            <button className={`tab-btn ${activeTab === 'foto' ? 'active' : ''}`} onClick={() => setActiveTab('foto')}><FiCamera /> Foto</button>
                            <button className="tab-btn" onClick={loadHistory} style={{ borderLeft: '1px solid var(--border-c)', marginLeft: '4px', paddingLeft: '20px' }}><FiClock /> Riwayat</button>
                        </div>
                    </div>
                    {activeTab === 'atk' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                            <input className="form-input" placeholder="Cari Produk atau Jasa..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', paddingLeft: '32px' }} />
                            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sec)' }} />
                            <div className="pos-categories" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
                                <button className={`cat-btn ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>Semua Kategori</button>
                                {categories.map(c => (
                                    <button key={c.id} className={`cat-btn ${selectedCategory === c.id ? 'active' : ''}`} onClick={() => setSelectedCategory(c.id)}>
                                        {c.emoji} {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {activeTab === 'atk' && (
                    <div className="pos-products">
                        {filteredProducts.map(p => (
                            <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
                                <div className="product-emoji">
                                    {p.emoji || <FiPackage />}
                                </div>
                                <div className="product-name" title={p.name}>{p.name}</div>
                                <div className="product-price">{formatRupiah(p.sellPrice)}</div>
                                <div className="product-stock">Stok: {p.stock} {p.unit}</div>
                            </div>
                        ))}
                        {filteredProducts.length === 0 && (
                            <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-sec)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '16px' }}><FiSearch /></div>
                                <h3 style={{ color: 'var(--text-main)' }}>Tidak ada produk</h3>
                                <p>Coba ubah filter atau kata kunci pencarian</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'fotocopy' && (
                    <div className="fotocopy-form">
                        <div className="form-group">
                            <label className="form-label">Jenis Kertas</label>
                            <div className="fotocopy-options">
                                {['HVS A4', 'HVS F4', 'HVS A3'].map(p => (
                                    <button key={p} className={`opt-btn ${fcPaper === p ? 'active' : ''}`} onClick={() => setFcPaper(p)}>{p}</button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Jenis Copy</label>
                            <div className="fotocopy-options">
                                <button className={`opt-btn ${fcColor === 'bw' ? 'active' : ''}`} onClick={() => setFcColor('bw')}><FiSquare /> Hitam Putih</button>
                                <button className={`opt-btn ${fcColor === 'color' ? 'active' : ''}`} onClick={() => setFcColor('color')}><FiPrinter /> Berwarna</button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Sisi</label>
                            <div className="fotocopy-options">
                                <button className={`opt-btn ${fcSide === '1' ? 'active' : ''}`} onClick={() => setFcSide('1')}>1 Sisi</button>
                                <button className={`opt-btn ${fcSide === '2' ? 'active' : ''}`} onClick={() => setFcSide('2')}>Bolak-balik</button>
                            </div>
                        </div>

                        <div className="pos-split-grid">
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="form-label">Jumlah Lembar</label>
                                <input className="form-input" value={fcQty} readOnly placeholder="0" style={{ fontSize: '1.5rem', textAlign: 'center', fontWeight: '800', marginBottom: '8px' }} />
                                <div className="numpad">
                                    {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', 'DEL'].map(v => (
                                        <button key={v} onClick={() => numpadClick(v)}>{v === 'DEL' ? <FiDelete /> : v}</button>
                                    ))}
                                </div>
                                <button className="btn btn-primary btn-block" style={{ marginTop: 'auto', paddingTop: '12px', paddingBottom: '12px' }} onClick={addFotocopy}><FiPlus /> Tambah ke Keranjang</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="form-label">Daftar Harga</label>
                                <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '0.75rem', flex: 1, overflowY: 'auto' }}>
                                    {fotocopyPrices.filter(p => p.paper === fcPaper).map(p => (
                                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                                            <span>{p.label}</span>
                                            <strong>{formatRupiah(p.price)}</strong>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: '12px', padding: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                                        <strong>Diskon Volume:</strong>
                                        {[...fcDiscounts].sort((a, b) => a.minQty - b.minQty).map((d) => (
                                            <div key={d.id}>{'>='} {d.minQty} lbr: -Rp {d.discountPerSheet}/lbr</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'print' && (
                    <div className="fotocopy-form">
                        <div className="form-group">
                            <label className="form-label">Jenis Kertas</label>
                            <div className="fotocopy-options">
                                {['HVS A4', 'HVS F4', 'Art Paper', 'Sticker Cromo', 'Sticker Vinyl'].map(p => (
                                    <button key={p} className={`opt-btn ${printPaper === p ? 'active' : ''}`} onClick={() => setPrintPaper(p)}>{p}</button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Warna Tinta</label>
                            <div className="fotocopy-options">
                                <button className={`opt-btn ${printColor === 'bw' ? 'active' : ''}`} onClick={() => setPrintColor('bw')}><FiSquare /> Hitam Putih</button>
                                <button className={`opt-btn ${printColor === 'color' ? 'active' : ''}`} onClick={() => setPrintColor('color')}><FiPrinter /> Berwarna</button>
                            </div>
                        </div>
                        <div className="pos-split-grid">
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="form-label">Jumlah Lembar (Print)</label>
                                <input className="form-input" value={printQty} readOnly placeholder="0" style={{ fontSize: '1.5rem', textAlign: 'center', fontWeight: '800', marginBottom: '8px' }} />
                                <div className="numpad">
                                    {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', 'DEL'].map(v => (
                                        <button key={v} onClick={() => numpadClick(v)}>{v === 'DEL' ? <FiDelete /> : v}</button>
                                    ))}
                                </div>
                                <button className="btn btn-primary btn-block" style={{ marginTop: 'auto', paddingTop: '12px', paddingBottom: '12px' }} onClick={addJasaPrint}><FiPlus /> Tambah ke Keranjang</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '16px', fontSize: '0.85rem', flex: 1, border: '1px dashed var(--border)' }}>
                                    <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><FiInfo /> Info Jasa Print</h4>
                                    <p>Gunakan tab ini untuk melayani pencetakan dokumen / foto pelanggan.</p>
                                    <ul style={{ margin: '12px 0', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                                        <li>Pastikan printer memadai untuk jenis kertas.</li>
                                        <li>Cek kualitas art paper sebelum mencetak kuantitas banyak.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'jilid' && (
                    <div className="fotocopy-form">
                        <div className="form-group">
                            <label className="form-label">Jenis Penjilidan</label>
                            <div className="fotocopy-options">
                                {bindPrices.map(p => (
                                    <button key={p.id} className={`opt-btn ${bindType === p.type ? 'active' : ''}`} onClick={() => setBindType(p.type)} style={{ padding: '12px', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{p.type}</span>
                                        <strong>{formatRupiah(p.price)}</strong>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="pos-split-grid">
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="form-label">Jumlah Buku / Rangkap</label>
                                <input className="form-input" value={bindQty} readOnly placeholder="0" style={{ fontSize: '1.5rem', textAlign: 'center', fontWeight: '800', marginBottom: '8px' }} />
                                <div className="numpad">
                                    {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', 'DEL'].map(v => (
                                        <button key={v} onClick={() => numpadClick(v)}>{v === 'DEL' ? <FiDelete /> : v}</button>
                                    ))}
                                </div>
                                <button className="btn btn-primary btn-block" style={{ marginTop: 'auto', paddingTop: '12px', paddingBottom: '12px' }} onClick={addJilid}><FiPlus /> Tambah ke Keranjang</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '16px', fontSize: '0.85rem', flex: 1, border: '1px dashed var(--border)' }}>
                                    <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><FiInfo /> Info Jasa Jilid</h4>
                                    <p>Harga yang tertera adalah per buku / rangkap.</p>
                                    <p>Bisa dikombinasikan dengan transaksi Fotocopy dan ATK dalam satu struk pembayaran.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'foto' && (
                    <div className="fotocopy-form">
                        <div className="form-group">
                            <label className="form-label">Ukuran Foto</label>
                            <div className="fotocopy-options">
                                {['2x3', '3x4', '4x6', 'Custom'].map(sz => (
                                    <button key={sz} className={`opt-btn ${photoSize === sz ? 'active' : ''}`} onClick={() => setPhotoSize(sz)} style={{ padding: '12px', textAlign: 'center' }}>
                                        {sz}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {photoSize === 'Custom' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Panjang (cm)</label>
                                    <input type="number" step="0.5" className="form-input" placeholder="Misal 10" value={photoCustomP} onChange={e => setPhotoCustomP(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Lebar (cm)</label>
                                    <input type="number" step="0.5" className="form-input" placeholder="Misal 15" value={photoCustomL} onChange={e => setPhotoCustomL(e.target.value)} />
                                </div>
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Harga per Lembar (Rp)</label>
                            <input type="number" className="form-input" value={photoPrice} onChange={e => setPhotoPrice(e.target.value)} placeholder="Misal 2000" style={{ maxWidth: '200px' }} />
                        </div>

                        <div className="pos-split-grid" style={{ marginTop: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="form-label">Jumlah Lembar (Foto)</label>
                                <input className="form-input" value={photoQty} readOnly placeholder="0" style={{ fontSize: '1.5rem', textAlign: 'center', fontWeight: '800', marginBottom: '8px' }} />
                                <div className="numpad">
                                    {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', 'DEL'].map(v => (
                                        <button key={v} onClick={() => numpadClick(v)}>{v === 'DEL' ? <FiDelete /> : v}</button>
                                    ))}
                                </div>
                                <button className="btn btn-primary btn-block" style={{ marginTop: 'auto', paddingTop: '12px', paddingBottom: '12px' }} onClick={addFoto}><FiPlus /> Tambah ke Keranjang</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '16px', fontSize: '0.85rem', flex: 1, border: '1px dashed var(--border)' }}>
                                    <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><FiInfo /> Info Cetak Foto</h4>
                                    <p>Tentukan sendiri harga per lembarnya sesuai tarif pasaran saat ini. Gunakan opsi *Custom* bila pelanggan meminta cetak dalam ukuran bingkai spesifik selain standar pas foto (2x3, 3x4, 4x6).</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Cart Button (Mobile) */}
            <button className="floating-cart-btn" onClick={() => setCartOpen(true)} style={{ background: 'var(--btn-primary)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', gap: '12px', alignItems: 'center', boxShadow: '0 4px 12px rgba(19, 236, 91, 0.4)', cursor: 'pointer', position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
                <span><FiShoppingCart /> {cart.length} barang</span>
                <span style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>{formatRupiah(total)}</span>
            </button>

            {/* Cart Overlay (Mobile) */}
            <div className={`cart-overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)}></div>

            {/* Right: Cart */}
            <div className={`pos-cart ${cartOpen ? 'open' : ''}`}>
                <div className="cart-header" onClick={() => { if (isMobile) setCartOpen(false); }} style={{ cursor: isMobile ? 'pointer' : 'default', padding: '24px 24px 16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isMobile && <button className="btn-icon" style={{ background: 'var(--bg-hover)', border: 'none', fontSize: '1.2rem', padding: '0 8px', borderRadius: '8px', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setCartOpen(false); }}><FiArrowDown /></button>}
                            <h3 style={{ fontSize: '1.25rem' }}>Detail Pesanan</h3>
                        </div>
                        <button onClick={() => { if (window.confirm('Kosongkan keranjang?')) setCart(prev => []) }} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}>
                            <FiTrash2 /> Kosongkan
                        </button>
                    </div>
                </div>

                <div style={{ padding: '0 24px 16px', borderBottom: '1px solid var(--border-c)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-sec)' }}>
                    <span><FiFile /></span> INV-{new Date().getTime().toString().slice(-6)}
                </div>

                {cart.length === 0 ? (
                    <div className="cart-empty" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sec)' }}>
                        <div className="empty-icon" style={{ fontSize: '4rem', opacity: 0.2, marginBottom: '16px' }}><FiShoppingCart /></div>
                        <p style={{ fontWeight: 600 }}>Keranjang masih kosong</p>
                        <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Pilih produk atau jasa dari katalog</p>
                    </div>
                ) : (
                    <div className="cart-items">
                        {cart.map(item => (
                            <div key={item.id} className="cart-item">
                                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                                    {item.type === 'product' ? <FiPackage /> : item.type === 'fotocopy' ? <FiFile /> : item.type === 'print' ? <FiPrinter /> : <FiBook />}
                                </div>
                                <div className="item-info">
                                    <div className="item-header">
                                        <div className="item-name">{item.name}</div>
                                        <div className="item-price">{formatRupiah(item.price)}</div>
                                    </div>
                                    <div className="item-controls">
                                        {item.type === 'product' ? (
                                            <div className="item-qty">
                                                <button onClick={() => updateCartQty(item.id, -1)}><FiMinus /></button>
                                                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.qty}</span>
                                                <button onClick={() => updateCartQty(item.id, 1)}>+</button>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-sec)' }}>{item.qty} qty</span>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span className="item-subtotal">Subtotal: {formatRupiah(item.subtotal)}</span>
                                            <button className="item-remove" style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => removeFromCart(item.id)}><FiX /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="cart-summary" style={{ background: 'var(--bg-input)' }}>
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{formatRupiah(subtotal)}</span>
                    </div>
                    {totalDiscount > 0 && (
                        <div className="summary-row" style={{ color: '#10b981' }}>
                            <span>Diskon</span>
                            <span style={{ fontWeight: 600 }}>-{formatRupiah(totalDiscount)}</span>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', marginBottom: '16px' }}>
                        <button style={{ padding: '10px', borderRadius: '8px', background: 'rgba(19, 236, 91, 0.1)', border: '1px solid rgba(19, 236, 91, 0.3)', color: 'var(--btn-primary-hover)', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => {
                            const disc = prompt('Masukkan nominal diskon (Rp):', discount);
                            if (disc !== null) setDiscount(parseInt(disc) || 0);
                        }}>
                            <FiTag /> Set Diskon
                        </button>

                        <div style={{ position: 'relative' }}>
                            <select className="form-select" style={{ width: '100%', height: '100%', padding: '10px', fontSize: '0.85rem', borderRadius: '8px', background: 'rgba(19, 236, 91, 0.1)', border: '1px solid rgba(19, 236, 91, 0.3)', color: 'var(--btn-primary-hover)', fontWeight: 'bold', cursor: 'pointer', appearance: 'none' }} value={selectedCustomer?.id || ''} onChange={e => {
                                const c = customers.find(c => c.id === e.target.value);
                                setSelectedCustomer(c || null);
                            }}>
                                <option value="">Member</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="summary-row total" style={{ borderTopColor: 'var(--border-c)', marginTop: 0 }}>
                        <span style={{ color: 'var(--btn-primary)' }}>Total Harga</span>
                        <span style={{ color: 'var(--btn-primary)', textDecoration: 'underline', textDecorationThickness: '2px', textUnderlineOffset: '4px' }}>{formatRupiah(total)}</span>
                    </div>
                </div>

                <div className="cart-actions" style={{ background: 'var(--bg-input)' }}>
                    <button className="btn-pay" disabled={cart.length === 0} onClick={() => { setPaymentOpen(true); setCashReceived(''); }}>
                        <FiCreditCard /> PROSES PEMBAYARAN
                    </button>
                </div>
            </div>

            {/* Payment Modal */}
            <Modal isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} title={<><FiCreditCard /> Pembayaran</>}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Tagihan</div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>{formatRupiah(total)}</div>
                </div>

                <label className="form-label">Metode Pembayaran</label>
                <div className="payment-methods">
                    {[
                        { id: 'tunai', icon: <FiCreditCard />, label: 'Tunai' },
                        { id: 'transfer', icon: <FiCreditCard />, label: 'Transfer' },
                        { id: 'qris', icon: <FiCreditCard />, label: 'QRIS' },
                        { id: 'hutang', icon: <FiFile />, label: 'Hutang' },
                    ].map(m => (
                        <button key={m.id} className={`payment-method-btn ${payMethod === m.id ? 'active' : ''}`} onClick={() => setPayMethod(m.id)}>
                            <span className="method-icon">{m.icon}</span>
                            {m.label}
                        </button>
                    ))}
                </div>

                {payMethod === 'tunai' && (
                    <>
                        <div className="form-group">
                            <label className="form-label">Uang Diterima</label>
                            <input className="form-input" type="number" value={cashReceived} onChange={e => setCashReceived(e.target.value)} placeholder="0" style={{ fontSize: '1.3rem', fontWeight: '700', textAlign: 'center' }} autoFocus />
                        </div>
                        <div className="quick-cash">
                            {[10000, 20000, 50000, 100000, total].map((v, i) => (
                                <button key={i} onClick={() => setCashReceived(String(v))}>
                                    {i === 4 ? <><FiCheck /> Pas</> : formatRupiah(v)}
                                </button>
                            ))}
                        </div>
                        <div className="change-display">
                            <div className="change-label">Kembalian</div>
                            <div className="change-amount" style={{ color: change < 0 ? 'var(--danger)' : 'var(--primary)' }}>
                                {change < 0 ? `Kurang ${formatRupiah(Math.abs(change))}` : formatRupiah(change)}
                            </div>
                        </div>
                    </>
                )}

                {payMethod === 'hutang' && !selectedCustomer && (
                    <div className="login-error" style={{ marginTop: '12px' }}><FiAlertCircle /> Pilih customer terlebih dahulu untuk pembayaran hutang!</div>
                )}

                <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: '16px' }} onClick={processPayment}
                    disabled={(payMethod === 'tunai' && cashNum < total) || (payMethod === 'hutang' && !selectedCustomer)}>
                    <FiCheck /> Proses Pembayaran
                </button>
            </Modal>

            {/* Receipt Modal */}
            <Modal isOpen={receiptOpen} onClose={() => setReceiptOpen(false)} title={<><FiFile /> Struk</>}>
                {lastReceipt && (
                    <div className={`receipt-preview print-${printerType}`}>
                        <div className="receipt-header">
                            {storeInfo.logo && <img src={storeInfo.logo} alt="Logo Toko" style={{ maxHeight: '60px', width: 'auto', marginBottom: '8px', objectFit: 'contain' }} />}
                            <h4>{storeInfo.name}</h4>
                            <p>{storeInfo.address}</p>
                            <p>Telp: {storeInfo.phone}</p>
                            {(printerType === 'lx310' || printerType === 'inkjet') && <p style={{ marginTop: '8px', fontWeight: '700', fontSize: '1.1em', letterSpacing: '1px', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '4px 0' }}>NOTA PEMBAYARAN</p>}
                        </div>
                        <div style={{ padding: '6px 0', borderBottom: '1px dashed #000', fontSize: '0.75rem' }}>
                            <p>No      : {lastReceipt.invoiceNo}</p>
                            <p>Tanggal : {new Date(lastReceipt.date).toLocaleString('id-ID')}</p>
                            <p>Kasir   : {lastReceipt.userName}</p>
                            {lastReceipt.customerName && lastReceipt.customerName !== 'Pelanggan Biasa' && <p>Customer: {lastReceipt.customerName}</p>}
                        </div>
                        <div className="receipt-items">
                            {lastReceipt.items.map((item, i) => (
                                <div key={i}>
                                    <div>{item.name}</div>
                                    <div className="receipt-item-row">
                                        <span>{item.qty} x {formatRupiah(item.price)}</span>
                                        <span>{formatRupiah(item.subtotal)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="receipt-total">
                            <div className="receipt-item-row"><span>Total Sementara</span><span>{formatRupiah(lastReceipt.subtotal)}</span></div>
                            {lastReceipt.discount > 0 && <div className="receipt-item-row"><span>Diskon</span><span>-{formatRupiah(lastReceipt.discount)}</span></div>}
                            <div className="receipt-item-row" style={{ fontWeight: '700', fontSize: '1rem' }}><span>TOTAL HARGA</span><span>{formatRupiah(lastReceipt.total)}</span></div>
                            <div className="receipt-item-row"><span>{lastReceipt.paymentType.toUpperCase()}</span><span>{formatRupiah(lastReceipt.paid)}</span></div>
                            {lastReceipt.change > 0 && <div className="receipt-item-row"><span>Kembali</span><span>{formatRupiah(lastReceipt.change)}</span></div>}
                        </div>
                        <div className="receipt-footer">
                            <p>{storeInfo.footer}</p>
                            <p style={{ fontSize: '0.65rem', marginTop: '6px', color: '#666' }}>Dicetak: {new Date().toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }} className="no-print">
                    <button className="btn btn-secondary btn-block" style={{ background: '#25D366', color: 'white' }} onClick={sendWaReceipt}><FiMessageCircle /> Kirim WA</button>
                    <button className="btn btn-secondary btn-block" onClick={handlePrint}><FiPrinter /> {isMobile ? 'Cetak Bluetooth 58mm' : printerType === 'lx310' ? 'Cetak LX-310' : printerType === 'inkjet' ? `Cetak Inkjet [${storeInfo.paperSize || 'A4'}]` : 'Cetak'}</button>
                    <button className="btn btn-primary btn-block" onClick={() => setReceiptOpen(false)}><FiCheck /> Selesai</button>
                </div>
            </Modal>

            {/* History Modal */}
            <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title={<><FiClock /> Riwayat Transaksi Kasir</>} size="lg">
                <div style={{ overflow: 'auto', maxHeight: '60dvh' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Invoice</th>
                                <th>Tipe</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyData.map(trx => (
                                <tr key={trx.id}>
                                    <td>{new Date(trx.date).toLocaleString('id-ID')}</td>
                                    <td><strong>{trx.invoice_no || trx.invoiceNo}</strong></td>
                                    <td><span className="badge badge-info">{trx.type}</span></td>
                                    <td>{trx.customer_name || trx.customerName || '-'}</td>
                                    <td style={{ fontWeight: 700 }}>{formatRupiah(trx.total)}</td>
                                    <td>
                                        <span className={`badge ${trx.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                            {trx.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                            <button className="btn btn-ghost btn-sm" title="Preview Struk" onClick={() => previewTransaction(trx.id)}><FiPrinter /></button>
                                            <button className="btn btn-ghost btn-sm" title="Edit Transaksi (Void & Re-Checkout)" style={{ color: 'var(--primary)' }} onClick={() => editTransaction(trx.id, trx.invoice_no || trx.invoiceNo)}><FiEdit /></button>
                                            <button className="btn btn-ghost btn-sm" title="Hapus / VOID Transaksi" style={{ color: 'var(--danger)' }} onClick={() => voidTransaction(trx.id, trx.invoice_no || trx.invoiceNo)}><FiTrash2 /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {historyData.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>Belum ada histori transaksi</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </div>
    );
}
