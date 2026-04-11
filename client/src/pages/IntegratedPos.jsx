import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';
import { formatRupiah, generateInvoice, generateRawReceipt, printViaBluetooth, initQZ, printViaQZ } from '../utils';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import Modal from '../components/Modal';
import { FiCheckCircle, FiPrinter, FiSearch, FiUserPlus, FiChevronRight, FiList, FiPlus, FiArrowLeft, FiCommand } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import Swal from 'sweetalert2';
import ReceiptProMax from '../components/ReceiptProMax';

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
    const [materials, setMaterials] = useState([]); // Opsi B

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
    const [fcQty, setFcQty] = useState(1);

    // Jilid & Print States
    const [jilidQty, setJilidQty] = useState(1);
    const [printType, setPrintType] = useState(null);
    const [jilidType, setJilidType] = useState(null);
    const [fcDiscounts, setFcDiscounts] = useState([]);
    const [printQty, setPrintQty] = useState(1);

    // Digital & Service Order States (Opsi B)
    const [digitalMatId, setDigitalMatId] = useState('');
    const [digitalWidth, setDigitalWidth] = useState('');
    const [digitalHeight, setDigitalHeight] = useState('');
    const [digitalQty, setDigitalQty] = useState(1);
    const [digitalNotes, setDigitalNotes] = useState('');
    const [digitalDesignFee, setDigitalDesignFee] = useState(0);
    const [serviceDevice, setServiceDevice] = useState('');
    const [serviceIssue, setServiceIssue] = useState('');
    const [serviceCost, setServiceCost] = useState('');

    // Payment & Modal States
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('tunai');
    const [amountPaid, setAmountPaid] = useState('');
    const [transactionComplete, setTransactionComplete] = useState(null);
    const [isDiscountModalOpen, setDiscountModalOpen] = useState(false);
    const [globalDiscount, setGlobalDiscount] = useState(0);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Mencegah ID invoice terus berubah akibat re-render dari timer
    const draftInvoiceId = useMemo(() => {
        return 'ID Pesanan: #INV-' + Date.now().toString().slice(-8);
    }, [cart.length === 0, transactionComplete]);

    // Printer Settings
    const [printerSettings, setPrinterSettings] = useState({
        autoPrint: false,
        printerName: '',
        printerSize: '80mm',
        paperSize: 'A4',
        storeName: 'FOTOCOPY ABADI JAYA',
        storeAddress: '',
        storePhone: '',
        receiptFooter: ''
    });

    const searchInputRef = useRef(null);
    const barcodeBuffer = useRef('');
    const lastKeyTime = useRef(Date.now());

    // Initial Data Loading
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [productsRes, customersRes, fcRes, settingsRes, materialsRes] = await Promise.all([
                    api.get('/products').catch(() => ({ data: [] })),
                    api.get('/customers').catch(() => ({ data: [] })),
                    api.get('/transactions/fotocopy-prices').catch(() => ({ data: [] })),
                    api.get('/settings').catch(() => ({ data: [] })),
                    api.get('/materials').catch(() => ({ data: [] }))
                ]);

                // Filter or set states directly
                setProducts(productsRes.data || []);
                setCustomers(customersRes.data || []);
                setFotocopyPrices(fcRes.data || []);
                setMaterials((materialsRes.data || []).filter(m => m.is_active && m.kategori === 'digital'));

                // Load Settings
                const allSettings = settingsRes.data || [];
                const sMap = {};
                allSettings.forEach(s => { sMap[s.key] = s.value; });

                let bData = [];
                try { bData = sMap.binding_prices ? JSON.parse(sMap.binding_prices) : []; } catch (e) { }
                setBindingPrices(bData);
                if (bData.length > 0) setJilidType(bData[0]);

                let pDataRaw = [];
                try { pDataRaw = sMap.print_prices ? JSON.parse(sMap.print_prices) : []; } catch (e) { }
                const pData = pDataRaw.map(p => ({
                    ...p,
                    name: p.name || `Print ${p.paper} (${p.color === 'bw' ? 'B/W' : 'Warna'})`
                }));
                setPrintPrices(pData);
                if (pData.length > 0) setPrintType(pData[0]);

                setPrinterSettings({
                    autoPrint: sMap.auto_print === 'true',
                    printerName: sMap.printer_name || '',
                    printerSize: sMap.printer_size || '80mm',
                    paperSize: sMap.paper_size || 'A4',
                    storeName: sMap.store_name || 'FOTOCOPY ABADI JAYA',
                    storeAddress: sMap.store_address || '',
                    storePhone: sMap.store_phone || '',
                    receiptFooter: sMap.receipt_footer || ''
                });

                if (sMap.fc_discounts) {
                    try { setFcDiscounts(JSON.parse(sMap.fc_discounts)); } catch (e) { }
                }
            } catch (error) {
                console.error('Failed to load initial data:', error);
            }
        };

        loadInitialData();
        initQZ(); // Start QZ connection on POS load
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
            ((p.name || '').toLowerCase().includes(query) ||
                p.code?.toLowerCase().includes(query))
        );
    }, [products, searchQuery]);

    // Cart Handlers
    const addToCart = (product) => {
        if (product.stock <= 0) { Swal.fire({ icon: 'warning', title: 'Stok Habis', text: 'Stok barang habis!', timer: 2500 }); return; }
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
            showToast('Jumlah lembar Fotocopy harus lebih dari 0', 'warning');
            return;
        }
        const unitPrice = getFcUnitPrice(paper, color, side);
        const name = `Fotocopy ${paper} (${color === 'bw' ? 'B/W' : 'Warna'}, ${side === '1' ? '1 Sisi' : 'Bolak-balik'})`;
        const existingItem = cart.find(c => c.type === 'fotocopy' && c.name === name);
        if (existingItem) {
            updateQty(existingItem.id, qty);
            showToast('Keranjang diperbarui!', 'success');
            setFcQty(1);
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
        setFcQty(1);
    };

    const addJilidToCart = (item, qty) => {
        if (!item) {
            showToast('Pilih jenis Spesifikasi Jilid terlebih dahulu.', 'warning');
            return;
        }
        if (qty <= 0) {
            showToast('Masukkan jumlah Qty Jilid.', 'warning');
            return;
        }
        const existingItem = cart.find(c => c.name === item.name && c.type === 'service');
        if (existingItem) {
            updateQty(existingItem.id, existingItem.quantity + qty);
            showToast('Keranjang diperbarui!', 'success');
        } else {
            const newItem = {
                id: `jilid-${Date.now()}-${Math.random()}`,
                name: `${item.name}`,
                sellPrice: item.price,
                quantity: qty,
                type: 'service'
            };
            setCart(prev => [...prev, newItem]);
            showToast('Jilid ditambahkan ke keranjang!', 'success');
        }
        setJilidQty(1);
    };

    const addPrintToCart = (item, qty) => {
        if (!item) {
            showToast('Pilih Spesifikasi Cetak terlebih dahulu.', 'warning');
            return;
        }
        if (qty <= 0) {
            showToast('Masukkan Jumlah Lembar untuk Print.', 'warning');
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
        setPrintQty(1);
    };

    const addDigitalToCart = (matId, w, h, qty, notes) => {
        const mat = materials.find(m => m.id === matId);
        if (!mat) { showToast('Pilih bahan terlebih dahulu', 'warning'); return; }
        if (!w || !h) { showToast('Masukkan ukuran panjang & lebar', 'warning'); return; }

        const luas = parseFloat(w) * parseFloat(h);
        const unitPrice = parseFloat(mat.harga_jual) || 0;
        const designFee = parseFloat(digitalDesignFee) || 0;
        const subtotalCalc = (luas * unitPrice * qty) + designFee;

        const newItem = {
            id: `dig-${Date.now()}-${Math.random()}`,
            name: `Banner: ${mat.nama_bahan} (${w}x${h}m)${designFee > 0 ? ' + Desain' : ''}`,
            sellPrice: (unitPrice * luas) + (designFee / (qty || 1)), // Price per unit distributed
            quantity: qty,
            type: 'digital',
            meta: { materialId: matId, width: w, height: h, notes, designFee }
        };
        setCart(prev => [...prev, newItem]);
        showToast('Order Digital ditambahkan!', 'success');
        setDigitalWidth(''); setDigitalHeight(''); setDigitalNotes('');
        setDigitalDesignFee(0);
    };

    const addServiceToCart = (device, issue, cost) => {
        if (!device || !issue) { showToast('Lengkapi info service', 'warning'); return; }
        const newItem = {
            id: `srv-${Date.now()}-${Math.random()}`,
            name: `Service: ${device} (${issue})`,
            sellPrice: parseInt(cost) || 0,
            quantity: 1,
            type: 'service_order',
            meta: { device, issue }
        };
        setCart(prev => [...prev, newItem]);
        showToast('Order Service ditambahkan!', 'success');
        setServiceDevice(''); setServiceIssue(''); setServiceCost('');
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
            // Dynamic Printer Auto-Switching: Mobile -> 58mm Bluetooth, Desktop -> User Preferred (LX-310/80mm)
            const effectivePrinterSize = isMobile ? '58mm' : printerSettings.printerSize;

            const receiptText = generateRawReceipt(transaction, {
                name: printerSettings.storeName || 'FOTOCOPY ABADI JAYA',
                address: printerSettings.storeAddress || '',
                phone: printerSettings.storePhone || '',
                footer: printerSettings.receiptFooter || '',
                userName: user?.name || 'Kasir'
            }, effectivePrinterSize, isMobile);

            if (isMobile) {
                printViaBluetooth(receiptText);
            } else if (effectivePrinterSize === 'lx310') {
                await printViaQZ(receiptText, printerSettings.printerName || 'LX-310');
            } else {
                await api.post('/print/receipt', {
                    text: receiptText,
                    printerName: printerSettings.printerName,
                    raw: effectivePrinterSize === 'lx310',
                    mode: effectivePrinterSize === 'inkjet' ? 'inkjet' : 'normal',
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
        if (isProcessingPayment) return;
        setIsProcessingPayment(true);

        const total = subtotal - globalDiscount;
        const paid = paymentMethod === 'tunai' ? parseFloat(amountPaid) : paymentMethod === 'pending' ? 0 : total;

        const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
        const customerName = selectedCustomerId === 'manual' ? (manualCustomerName || 'Pelanggan Baru') : (selectedCustomer?.name || 'Umum');

        const transaction = {
            invoiceNo: generateInvoice(),
            date: new Date().toISOString(),
            customerId: selectedCustomerId === 'manual' ? null : selectedCustomerId,
            customerName: customerName,
            type: (() => {
                const types = cart.map(c => (c.type || '').toLowerCase());
                const uniqueTypes = [...new Set(types)];

                if (uniqueTypes.length === 1) {
                    const t = uniqueTypes[0];
                    if (t === 'atk') return 'Kasir';
                    if (t === 'fotocopy' || t === 'service') return 'Cetak';
                    if (t === 'digital') return 'Digital Printing';
                    if (t === 'service_order') return 'Service Mesin';
                    return t.charAt(0).toUpperCase() + t.slice(1);
                }

                // Mixed cart: find dominant type by priority
                const hasDigital = types.includes('digital');
                const hasServiceOrder = types.includes('service_order');
                const hasService = types.includes('service') || types.includes('fotocopy');
                const hasAtk = types.includes('atk');

                if (hasDigital) return 'Digital Printing';
                if (hasServiceOrder) return 'Service Mesin';
                if (hasService && hasAtk) return 'Kasir + Cetak';
                if (hasService) return 'Cetak';
                if (hasAtk) return 'Kasir';
                return 'Campuran';
            })(),
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                qty: item.quantity,
                price: item.sellPrice,
                subtotal: item.sellPrice * item.quantity,
                discount: item.discount || 0,
                source: item.type === 'atk' ? 'atk' : 'fc',
                type: item.type,
                meta: item.meta
            })),
            subtotal,
            discount: globalDiscount,
            total,
            paymentType: paymentMethod,
            paid: paid,
            changeAmount: Math.max(0, paid - total),
            status: paymentMethod === 'pending' ? 'pending' : (paid < total ? 'pending' : 'completed')
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
        } finally {
            setIsProcessingPayment(false);
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
        'F4': () => setActiveServiceTab('digital'), // Opsi B
        'F6': () => setActiveServiceTab('service'), // Opsi B
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
                        <div className="flex items-center gap-1 sm:gap-2 border-b text-sm border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar mb-4 sm:mb-6 px-1 py-1">
                            <button onClick={() => setActiveServiceTab('fotocopy')} className={`min-w-max px-3 sm:px-6 py-2 sm:py-3 pb-3 sm:pb-4 flex items-center justify-center gap-2 sm:gap-3 border-b-2 font-black transition-all ${activeServiceTab === 'fotocopy' ? 'border-primary text-primary bg-primary/5 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                                <span className={`hidden sm:inline-block px-2 py-0.5 rounded-md text-[9px] font-black tracking-tighter ${activeServiceTab === 'fotocopy' ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>F1</span>
                                <span className="material-symbols-outlined text-[18px]">content_copy</span> <span className="text-[0.7rem] sm:text-xs tracking-tight uppercase">FOTOCOPY</span>
                            </button>
                            <button onClick={() => setActiveServiceTab('jilid')} className={`min-w-max px-3 sm:px-6 py-2 sm:py-3 pb-3 sm:pb-4 flex items-center justify-center gap-2 sm:gap-3 border-b-2 font-black transition-all ${activeServiceTab === 'jilid' ? 'border-primary text-primary bg-primary/5 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                                <span className={`hidden sm:inline-block px-2 py-0.5 rounded-md text-[9px] font-black tracking-tighter ${activeServiceTab === 'jilid' ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>F2</span>
                                <span className="material-symbols-outlined text-[18px]">book</span> <span className="text-[0.7rem] sm:text-xs tracking-tight uppercase">JILID</span>
                            </button>
                            <button onClick={() => setActiveServiceTab('print')} className={`min-w-max px-3 sm:px-6 py-2 sm:py-3 pb-3 sm:pb-4 flex items-center justify-center gap-2 sm:gap-3 border-b-2 font-black transition-all ${activeServiceTab === 'print' ? 'border-primary text-primary bg-primary/5 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                                <span className={`hidden sm:inline-block px-2 py-0.5 rounded-md text-[9px] font-black tracking-tighter ${activeServiceTab === 'print' ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>F3</span>
                                <span className="material-symbols-outlined text-[18px]">print</span> <span className="text-[0.7rem] sm:text-xs tracking-tight uppercase">PRINT</span>
                            </button>
                            <button onClick={() => setActiveServiceTab('digital')} className={`min-w-max px-3 sm:px-6 py-2 sm:py-3 pb-3 sm:pb-4 flex items-center justify-center gap-2 sm:gap-3 border-b-2 font-black transition-all ${activeServiceTab === 'digital' ? 'border-secondary text-secondary bg-secondary/5 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                                <span className={`hidden sm:inline-block px-2 py-0.5 rounded-md text-[9px] font-black tracking-tighter ${activeServiceTab === 'digital' ? 'bg-secondary text-white shadow-sm shadow-secondary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>F4</span>
                                <span className="material-symbols-outlined text-[18px]">wallpaper</span> <span className="text-[0.7rem] sm:text-xs tracking-tight uppercase">DIGITAL</span>
                            </button>
                            <button onClick={() => setActiveServiceTab('service')} className={`min-w-max px-3 sm:px-6 py-2 sm:py-3 pb-3 sm:pb-4 flex items-center justify-center gap-2 sm:gap-3 border-b-2 font-black transition-all ${activeServiceTab === 'service' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                                <span className={`hidden sm:inline-block px-2 py-0.5 rounded-md text-[9px] font-black tracking-tighter ${activeServiceTab === 'service' ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>F6</span>
                                <span className="material-symbols-outlined text-[18px]">build</span> <span className="text-[0.7rem] sm:text-xs tracking-tight uppercase">SERVICE</span>
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
                                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Pilih Spesifikasi Jilid</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {bindingPrices.map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setJilidType(item)}
                                                        className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 border-2 transition-all shadow-sm ${jilidType?.id === item.id ? 'bg-primary/5 text-primary border-primary' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:border-primary/30'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-2xl">auto_stories</span>
                                                        <span className="text-xs font-bold uppercase tracking-widest text-center leading-tight">{item.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Qty Jilid</h3>
                                            <div className="flex items-center gap-3 w-full sm:w-2/3">
                                                <button onClick={() => setJilidQty(Math.max(0, jilidQty - 1))} className="size-10 sm:size-12 shrink-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-center font-bold text-xl transition-colors"><span className="material-symbols-outlined">remove</span></button>
                                                <input type="number" value={jilidQty || ''} onChange={(e) => setJilidQty(parseInt(e.target.value) || 0)} className="flex-1 h-10 sm:h-12 text-center text-xl font-bold border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:ring-0 focus:border-primary dark:bg-slate-900 uppercase" placeholder="0" />
                                                <button onClick={() => setJilidQty(jilidQty + 1)} className="size-10 sm:size-12 shrink-0 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm shadow-primary/30 flex items-center justify-center font-bold text-xl transition-colors"><span className="material-symbols-outlined">add</span></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:w-80 xl:w-96 shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-[28px] p-6 sm:p-8 flex flex-col justify-center text-center relative border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <div className="mb-6">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Harga Satuan</h4>
                                            <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">{formatRupiah(jilidType?.price || 0)}</div>
                                        </div>
                                        <div className="w-full h-px bg-slate-200 dark:bg-slate-700 mb-6"></div>
                                        <div className="mb-8">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Subtotal Layanan</h4>
                                            <div className="text-3xl sm:text-4xl font-black text-primary">{formatRupiah((jilidType?.price || 0) * jilidQty)}</div>
                                        </div>
                                        <button onClick={() => addJilidToCart(jilidType, jilidQty)} className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-primary/25">
                                            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span> Tambah ke Keranjang
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeServiceTab === 'print' && (
                                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Pilih Spesifikasi Cetak</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {printPrices.map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setPrintType(item)}
                                                        className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 border-2 transition-all shadow-sm ${printType?.id === item.id ? 'bg-primary/5 text-primary border-primary' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:border-primary/30'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-2xl">print</span>
                                                        <span className="text-xs font-bold uppercase tracking-widest text-center leading-tight">{item.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Jumlah Lembar</h3>
                                            <div className="flex items-center gap-3 w-full sm:w-2/3">
                                                <button onClick={() => setPrintQty(Math.max(0, printQty - 1))} className="size-10 sm:size-12 shrink-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-center font-bold text-xl transition-colors"><span className="material-symbols-outlined">remove</span></button>
                                                <input type="number" value={printQty || ''} onChange={(e) => setPrintQty(parseInt(e.target.value) || 0)} className="flex-1 h-10 sm:h-12 text-center text-xl font-bold border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:ring-0 focus:border-primary dark:bg-slate-900 uppercase" placeholder="0" />
                                                <button onClick={() => setPrintQty(printQty + 1)} className="size-10 sm:size-12 shrink-0 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm shadow-primary/30 flex items-center justify-center font-bold text-xl transition-colors"><span className="material-symbols-outlined">add</span></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:w-80 xl:w-96 shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-[28px] p-6 sm:p-8 flex flex-col justify-center text-center relative border border-slate-100 dark:border-slate-800 shadow-sm">
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

                            {activeServiceTab === 'digital' && (
                                <div className="flex flex-col lg:flex-row gap-8">
                                    <div className="flex-1 space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Parameter Cetak</h3>
                                                <div className="space-y-3">
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[9px] font-black text-slate-400 ml-1">BAHAN / MATERIAL</label>
                                                        <select value={digitalMatId} onChange={(e) => setDigitalMatId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm">
                                                            <option value="">-- Pilih Bahan --</option>
                                                            {materials.map(m => (
                                                                <option key={m.id} value={m.id}>{m.nama_bahan?.toUpperCase()} ({formatRupiah(m.harga_jual)}/m2)</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-[9px] font-black text-slate-400 ml-1">PANJANG (M)</label>
                                                            <input type="number" step="0.1" value={digitalWidth} onChange={(e) => setDigitalWidth(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-2.5 px-4 font-bold text-base" placeholder="0.0" />
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-[9px] font-black text-slate-400 ml-1">LEBAR (M)</label>
                                                            <input type="number" step="0.1" value={digitalHeight} onChange={(e) => setDigitalHeight(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-2.5 px-4 font-bold text-base" placeholder="0.0" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Detail Opsional</h3>
                                                <div className="space-y-3">
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[9px] font-black text-slate-400 ml-1">JUMLAH (QTY)</label>
                                                        <input type="number" value={digitalQty} onChange={(e) => setDigitalQty(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-2.5 px-4 font-bold text-base" />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[9px] font-black text-slate-400 ml-1">CATATAN / FINISHING</label>
                                                        <textarea value={digitalNotes} onChange={(e) => setDigitalNotes(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-2 px-4 font-bold text-sm h-16 resize-none" placeholder="Contoh: Mata ayam pojok-pojok..."></textarea>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[9px] font-black text-slate-400 ml-1">BIAYA DESAIN (RP)</label>
                                                        <div className="relative group/fee">
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 group-focus-within/fee:text-primary transition-colors">Rp</div>
                                                            <input type="number" value={digitalDesignFee} onChange={(e) => setDigitalDesignFee(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 font-black text-base text-primary" placeholder="0" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:w-80 shrink-0 bg-indigo-500/5 rounded-3xl p-8 border-2 border-indigo-500/20 flex flex-col justify-center text-center">
                                        <div className="mb-6">
                                            <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Estimasi Luas</h4>
                                            <div className="text-2xl font-black text-slate-800 dark:text-white">{(parseFloat(digitalWidth) || 0) * (parseFloat(digitalHeight) || 0)} m2</div>
                                        </div>
                                        <div className="mb-8">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Biaya</h4>
                                            <div className="text-3xl font-black text-primary">
                                                {formatRupiah(((parseFloat(digitalWidth) || 0) * (parseFloat(digitalHeight) || 0) * (materials.find(m => m.id === digitalMatId)?.harga_jual || 0) * digitalQty) + (parseFloat(digitalDesignFee) || 0))}
                                            </div>
                                        </div>
                                        <button onClick={() => addDigitalToCart(digitalMatId, digitalWidth, digitalHeight, digitalQty, digitalNotes, digitalDesignFee)} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95">
                                            <span className="material-symbols-outlined">wallpaper</span> Tambah ke Keranjang
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeServiceTab === 'service' && (
                                <div className="flex flex-col lg:flex-row gap-8">
                                    <div className="flex-1 space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="flex flex-col gap-4">
                                                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Informasi Unit</h3>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 ml-1">NAMA UNIT / MODEL</label>
                                                    <input type="text" value={serviceDevice} onChange={(e) => setServiceDevice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-base" placeholder="Contoh: Epson L3110..." />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 ml-1">KELUHAN / PROBLEM</label>
                                                    <textarea value={serviceIssue} onChange={(e) => setServiceIssue(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm h-24 resize-none" placeholder="Jelaskan kerusakan mesin..."></textarea>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Biaya & Estimasi</h3>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 ml-1">ESTIMASI BIAYA (RP)</label>
                                                    <input type="number" value={serviceCost} onChange={(e) => setServiceCost(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-xl text-emerald-500" placeholder="0" />
                                                </div>
                                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800 text-[11px] text-emerald-600 font-medium">
                                                    Biaya ini adalah estimasi awal. Biaya final akan diupdate oleh teknisi setelah pengecekan mendalam.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:w-80 shrink-0 bg-emerald-500/5 rounded-3xl p-8 border-2 border-emerald-500/20 flex flex-col justify-center text-center">
                                        <div className="mb-8">
                                            <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Penerimaan Unit</h4>
                                            <div className="text-3xl font-black text-slate-800 dark:text-white">{formatRupiah(serviceCost || 0)}</div>
                                        </div>
                                        <button onClick={() => addServiceToCart(serviceDevice, serviceIssue, serviceCost)} className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95">
                                            <span className="material-symbols-outlined">construction</span> Buat Order Service
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
                    </div >
                </div >

                {/* Right Sidebar: Cart */}
                <aside className={`fixed inset-y-0 right-0 z-[110] lg:z-auto lg:relative w-[85vw] sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl transition-transform duration-300 ${isMobile && !isCartOpen ? 'translate-x-full' : 'translate-x-0'}`}>
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
                            TERMINAL AKTIF
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
                                            {item.type === 'fotocopy' ? 'content_copy' : item.type === 'digital' ? 'wallpaper' : item.type === 'service_order' ? 'build' : item.type === 'service' ? 'book' : 'inventory_2'}
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
            {
                isMobile && isCartOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
                        onClick={() => setIsCartOpen(false)}
                    />
                )
            }

            {/* Float trigger for mobile cart inside `<main>` overlap or sticky at bottom if needed, currently placed in header */}
            {
                isMobile && cart.length > 0 && !isCartOpen && (
                    <button onClick={() => { setIsCartOpen(true); }} className="fixed bottom-16 right-6 z-40 size-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center text-2xl animate-bounce">
                        <span className="material-symbols-outlined">shopping_cart_checkout</span>
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full size-6 flex items-center justify-center border-2 border-white">{cart.length}</span>
                    </button>
                )
            }

            {/* Premium Footer / Hotkeys Banner */}
            <footer className="hidden lg:flex h-10 bg-[#0b1120]/95 backdrop-blur-2xl border-t border-cyan-500/10 text-slate-400 text-[10px] font-bold items-center justify-between px-6 shrink-0 z-40 relative shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
                <div className="flex items-center gap-6 min-w-max">
                    <div className="flex items-center gap-2 text-cyan-500 uppercase tracking-[0.2em] italic">
                        <FiCommand className="animate-pulse" />
                        <span className="opacity-80">Bantuan Tombol</span>
                    </div>

                    <div className="h-4 w-px bg-white/5 mx-2" />

                    <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar">
                        {[
                            { k: 'F1', l: 'Fotocopy' },
                            { k: 'F2', l: 'Jilid' },
                            { k: 'F3', l: 'Cetak' },
                            { k: 'F4', l: 'Logistik' },
                            { k: 'F6', l: 'Service' },
                            { k: 'F5', l: 'Cari ATK' },
                            { k: 'F8', l: 'Laci' },
                            { k: 'F9', l: 'Diskon' },
                            { k: 'F10', l: 'Bayar' },
                            { k: 'F11', l: 'Full' },
                            { k: 'F12', l: 'Simpan' },
                            { k: 'ESC', l: 'Batal' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 group cursor-help transition-all duration-300 hover:scale-105">
                                <span className="px-1.5 py-0.5 rounded-md border border-white/10 bg-white/5 text-[9px] font-black text-cyan-400 font-mono shadow-[0_0_10px_rgba(34,211,238,0.1)] group-hover:bg-cyan-500 group-hover:text-white group-hover:border-cyan-400 transition-all">
                                    {item.k}
                                </span>
                                <span className="text-slate-500 group-hover:text-slate-300 transition-colors uppercase tracking-widest text-[9px]">
                                    {item.l}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-8 pl-6 font-display text-[9px] text-slate-500 font-black whitespace-nowrap min-w-max tracking-widest italic opacity-60">
                    <div className="flex items-center gap-2">
                        <span className="text-white/20">/</span>
                        KASIR TERPADU V2.4
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">
                        <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                        <span className="text-emerald-500">PRN: {printerSettings.printerName || 'EPSON LX-310'}</span>
                    </div>
                </div>
            </footer>

            <footer className="h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 opacity-50 shrink-0"></footer>

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
                    <div className="flex flex-col items-center bg-slate-900/50 rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-full bg-emerald-500/10 p-6 flex flex-col items-center border-b border-white/5">
                            <div className="size-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 animate-bounce">
                                <FiCheckCircle size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-white">Transaksi Berhasil!</h3>
                            <p className="text-emerald-500/70 font-bold text-sm tracking-widest mt-1 uppercase">Pembayaran Diterima</p>
                        </div>

                        <div className="w-full p-6 sm:p-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-950/30">
                            <ReceiptProMax
                                receiptData={transactionComplete}
                                printSettings={printerSettings}
                                formatCurrency={formatRupiah}
                                printerWidthClass={printerSettings.printerSize === '80mm' ? 'w-full max-w-[340px]' : 'w-full max-w-[300px]'}
                            />
                        </div>

                        <div className="w-full p-6 bg-slate-900/80 border-t border-white/5 flex gap-3">
                            <button
                                onClick={() => handleDirectPrint(transactionComplete)}
                                className="flex-1 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-95"
                            >
                                <FiPrinter /> Cetak Nota
                            </button>
                            <button
                                onClick={closePaymentModal}
                                className="flex-1 py-4 bg-primary text-white border-none rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95"
                            >
                                <FiPlus /> Transaksi Baru
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
                            <div className="grid grid-cols-4 gap-2">
                                {[{ id: 'tunai', icon: 'payments', label: 'Tunai' }, { id: 'transfer', icon: 'account_balance', label: 'Transfer' }, { id: 'qris', icon: 'qr_code_scanner', label: 'QRIS' }, { id: 'pending', icon: 'schedule', label: 'Tunda' }].map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setPaymentMethod(m.id)}
                                        className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === m.id ? (m.id === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-amber-600' : 'bg-primary/5 border-primary text-primary') : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-500'}`}
                                    >
                                        <span className="material-symbols-outlined text-xl">{m.icon}</span>
                                        <span className="text-xs font-bold">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentMethod === 'pending' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 flex gap-3 items-start">
                                <span className="material-symbols-outlined text-amber-500 shrink-0 mt-0.5">info</span>
                                <div>
                                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Transaksi Ditunda / Hutang</p>
                                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Transaksi akan disimpan dengan status <b>Pending</b>. Pelanggan belum membayar. Dapat dilunasi nanti melalui halaman Riwayat Transaksi.</p>
                                </div>
                            </div>
                        )}

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
                            disabled={isProcessingPayment || (paymentMethod === 'tunai' && Number(amountPaid) < (subtotal - globalDiscount))}
                            className="w-full py-4 bg-primary disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                            {isProcessingPayment ? 'Memproses...' : 'Proses Transaksi Selesai'}
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
