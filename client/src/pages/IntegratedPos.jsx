import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';
import { formatRupiah, generateInvoice, generateRawReceipt, printViaBluetooth, initQZ, printViaQZ } from '../utils';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import Modal from '../components/Modal';
import { FiCheckCircle, FiPrinter, FiSearch, FiUserPlus, FiChevronRight, FiList, FiPlus, FiArrowLeft, FiCommand, FiMessageCircle, FiUserCheck } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import Swal from 'sweetalert2';
import ReceiptProMax from '../components/ReceiptProMax';
import PosHeader from '../components/pos/PosHeader';

export default function IntegratedPos({ onNavigate, pageState, onFullscreenChange, storeSettings }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { themeMode: theme, setTheme: toggleTheme } = useTheme();

    // Basic States
    const [activeServiceTab, setActiveServiceTab] = useState('fotocopy'); // 'fotocopy' | 'jilid' | 'cetak'
    const [products, setProducts] = useState([]);
    const [fotocopyPrices, setFotocopyPrices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem('pos_cart');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load cart:', e);
            return [];
        }
    });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Persist cart to localStorage
    useEffect(() => {
        localStorage.setItem('pos_cart', JSON.stringify(cart));
    }, [cart]);
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
    const [customerWa, setCustomerWa] = useState(''); // State untuk WhatsApp
    const [taxEnabled, setTaxEnabled] = useState(false);
    const [taxPercentage, setTaxPercentage] = useState(11);

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

                setTaxEnabled(sMap.tax_enabled === 'true' || sMap.tax_enabled === true);
                setTaxPercentage(parseFloat(sMap.tax_percentage) || 11);
            } catch (error) {
                console.error('Failed to load initial data:', error);
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings/public');
                const sMap = {};
                data.forEach(s => { sMap[s.key] = s.value; });
                setPrinterSettings(prev => ({
                    ...prev,
                    storeName: sMap.store_name || prev.storeName,
                    storeAddress: sMap.store_address || prev.storeAddress,
                    storePhone: sMap.store_phone || prev.storePhone,
                    receiptFooter: sMap.store_footer || prev.receiptFooter
                }));
            } catch (e) {
                console.error('Failed to fetch printer settings:', e);
            }
        };
        fetchSettings();
    }, []);

    // Sync customerWa when customer selected
    useEffect(() => {
        if (selectedCustomerId && selectedCustomerId !== 'manual') {
            const customer = customers.find(c => String(c.id) === String(selectedCustomerId));
            if (customer && customer.phone) {
                setCustomerWa(customer.phone);
            }
        }
    }, [selectedCustomerId, customers]);

    // Unified customer name resolver
    const getSelectedCustomerName = () => {
        if (selectedCustomerId === 'manual') return manualCustomerName || 'Pelanggan Baru';
        if (!selectedCustomerId || selectedCustomerId === '') return 'Umum';
        const customer = customers.find(c => String(c.id) === String(selectedCustomerId));
        return customer?.name || 'Umum';
    };

    // Helper: find price for fotocopy based on selection
    const getFcUnitPrice = (paper, color, side) => {
        const priceObj = fotocopyPrices.find(p => p.paper === paper && p.color === color && p.side === side);
        return priceObj ? priceObj.price : 0;
    };
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.sellPrice * item.quantity), 0), [cart]);
    const taxAmount = useMemo(() => taxEnabled ? Math.round((subtotal - globalDiscount) * (taxPercentage / 100)) : 0, [subtotal, globalDiscount, taxEnabled, taxPercentage]);
    const total = useMemo(() => subtotal - globalDiscount + taxAmount, [subtotal, globalDiscount, taxAmount]);

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

    const removeAll = async () => {
        if (cart.length === 0) return;
        const { isConfirmed } = await Swal.fire({
            title: 'Batalkan Transaksi?',
            text: 'Semua item di keranjang akan dihapus.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Batalkan',
            cancelButtonText: 'Lanjut Transaksi',
            customClass: {
                confirmButton: 'bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-xl ml-3',
                cancelButton: 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl',
                popup: 'rounded-[1.5rem] dark:bg-slate-800 dark:text-white',
                title: 'text-slate-800 dark:text-white font-black',
                htmlContainer: 'text-slate-600 dark:text-slate-300'
            },
            buttonsStyling: false
        });

        if (isConfirmed) {
            setCart([]);
            setGlobalDiscount(0);
            setManualDiscount(0);
            setCustomerName('');
            setCustomerPhone('');
            setOrderId('');
        }
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
            setAmountPaid('');
            setSelectedCustomerId(null);
            setManualCustomerName('');
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
            }, effectivePrinterSize, isMobile, printerSettings.paperSize);

            if (isMobile) {
                printViaBluetooth(receiptText);
            } else if (effectivePrinterSize === 'lx310') {
                // Double print for LX-310 as requested by user
                await printViaQZ({ data: receiptText, paperSize: printerSettings.paperSize }, printerSettings.printerName || 'LX-310');
                if (printerSettings.printerSize === 'lx310') {
                    // Slight delay to ensure printer buffer handles both
                    setTimeout(async () => {
                        await printViaQZ({ data: receiptText, paperSize: printerSettings.paperSize }, printerSettings.printerName || 'LX-310');
                    }, 1000);
                }
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

        const finalTotal = total; // Already includes tax from useMemo
        const paid = paymentMethod === 'tunai' ? (parseFloat(amountPaid) || 0) : paymentMethod === 'pending' ? 0 : finalTotal;
        const customerName = getSelectedCustomerName();

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
            taxAmount,
            discount: globalDiscount,
            total: finalTotal,
            paymentType: paymentMethod,
            paid: paid,
            changeAmount: Math.max(0, paid - finalTotal),
            status: paymentMethod === 'pending' ? 'pending' : (paid < finalTotal ? 'pending' : 'paid'),
            customerWa: customerWa // Kirim WA ke backend
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

        const customerName = getSelectedCustomerName();

        const total = subtotal - globalDiscount;

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
            paymentType: 'pending',
            paid: 0,
            changeAmount: 0,
            status: 'pending',
            customerWa: customerWa
        };

        try {
            await api.post('/transactions', transaction);
            showToast('Transaksi disimpan sebagai Pending.', 'success');

            // Update local stock for display (physical products only)
            setProducts(prev => prev.map(p => {
                const cartItem = cart.find(ci => ci.id === p.id);
                if (cartItem && p.type !== 'fotocopy' && p.type !== 'service') {
                    return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
                }
                return p;
            }));

            // Clear cart
            setCart([]);
            setGlobalDiscount(0);

            // Cleanup states
            try { setManualDiscount(0); } catch (e) { }
            try { setCustomerName(''); } catch (e) { }
            try { setCustomerPhone(''); } catch (e) { }
            try { setOrderId(''); } catch (e) { }
            setSelectedCustomerId('');
        } catch (error) {
            console.error('Save Pending Trx Error:', error.response?.data || error.message);
            showToast('Gagal menyimpan transaksi pending.', 'error');
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
                }).then(({ isConfirmed }) => {
                    if (isConfirmed) {
                        setCart([]);
                        setGlobalDiscount(0);
                        setManualDiscount(0);
                        setCustomerName('');
                        setCustomerPhone('');
                        setOrderId('');
                    }
                });
            }
        },
    });

    return (
        <div className="bg-[#f0f2f5] dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100 flex min-h-screen w-full flex-col overflow-x-hidden selection:bg-primary/20">
            {/* Header */}
            <PosHeader
                user={user}
                currentTime={currentTime}
                onNavigate={onNavigate}
                isCartOpen={isCartOpen}
                setIsCartOpen={setIsCartOpen}
                cartCount={cart.length}
                onOpenDrawer={openCashDrawer}
                onToggleFullscreen={toggleFullScreen}
                storeSettings={storeSettings}
            />

            <main className="flex flex-1 overflow-hidden h-[calc(100vh-72px-28px)] flex-col lg:flex-row relative">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
                </div>

                {/* Left Content (Services & Products) */}
                <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 gap-6 relative z-10 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    {/* Services Tabs */}
                    <section className="glass-panel rounded-[2.5rem] pro-max-shadow overflow-hidden flex-1 flex flex-col border-white/40 dark:border-slate-800/50">
                        <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-100 dark:border-slate-800/50 overflow-x-auto no-scrollbar mb-4 sm:mb-6 px-4 py-2 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md">
                            <button onClick={() => setActiveServiceTab('fotocopy')} className={`min-w-max px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-center gap-3 border-b-4 font-black transition-all duration-300 group ${activeServiceTab === 'fotocopy' ? 'border-primary text-primary bg-primary/10 rounded-t-2xl shadow-[inset_0_-4px_0_rgba(var(--primary-rgb),0.2)]' : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                                <span className={`hidden sm:inline-block px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest ${activeServiceTab === 'fotocopy' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200'} transition-all`}>F1</span>
                                <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">content_copy</span> <span className="text-[0.75rem] sm:text-[0.8rem] font-black uppercase tracking-widest italic">FOTOCOPY</span>
                            </button>
                            <button onClick={() => setActiveServiceTab('jilid')} className={`min-w-max px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-center gap-3 border-b-4 font-black transition-all duration-300 group ${activeServiceTab === 'jilid' ? 'border-primary text-primary bg-primary/10 rounded-t-2xl shadow-[inset_0_-4px_0_rgba(var(--primary-rgb),0.2)]' : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                                <span className={`hidden sm:inline-block px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest ${activeServiceTab === 'jilid' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200'} transition-all`}>F2</span>
                                <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">book</span> <span className="text-[0.75rem] sm:text-[0.8rem] font-black uppercase tracking-widest italic">JILID</span>
                            </button>
                            <button onClick={() => setActiveServiceTab('print')} className={`min-w-max px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-center gap-3 border-b-4 font-black transition-all duration-300 group ${activeServiceTab === 'print' ? 'border-primary text-primary bg-primary/10 rounded-t-2xl shadow-[inset_0_-4px_0_rgba(var(--primary-rgb),0.2)]' : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                                <span className={`hidden sm:inline-block px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest ${activeServiceTab === 'print' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200'} transition-all`}>F3</span>
                                <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">print</span> <span className="text-[0.75rem] sm:text-[0.8rem] font-black uppercase tracking-widest italic">PRINT</span>
                            </button>
                            <button onClick={() => setActiveServiceTab('digital')} className={`min-w-max px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-center gap-3 border-b-4 font-black transition-all duration-300 group ${activeServiceTab === 'digital' ? 'border-secondary text-secondary bg-secondary/10 rounded-t-2xl shadow-[inset_0_-4px_0_rgba(var(--secondary-rgb),0.2)]' : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                                <span className={`hidden sm:inline-block px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest ${activeServiceTab === 'digital' ? 'bg-secondary text-white shadow-lg shadow-secondary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200'} transition-all`}>F4</span>
                                <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">wallpaper</span> <span className="text-[0.75rem] sm:text-[0.8rem] font-black uppercase tracking-widest italic">DIGITAL</span>
                            </button>
                            <button onClick={() => setActiveServiceTab('service')} className={`min-w-max px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-center gap-3 border-b-4 font-black transition-all duration-300 group ${activeServiceTab === 'service' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10 rounded-t-2xl shadow-[inset_0_-4px_0_rgba(16,185,129,0.2)]' : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                                <span className={`hidden sm:inline-block px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest ${activeServiceTab === 'service' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200'} transition-all`}>F6</span>
                                <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">build</span> <span className="text-[0.75rem] sm:text-[0.8rem] font-black uppercase tracking-widest italic">SERVICE</span>
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col p-4 sm:p-8 pt-0">
                            {activeServiceTab === 'fotocopy' && (
                                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Options Left Side */}
                                    <div className="flex-1 space-y-8">
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                                                Jenis Kertas
                                            </h3>
                                            <div className="flex flex-wrap gap-3">
                                                {['HVS A4', 'HVS F4', 'HVS A3'].map(p => (
                                                    <button key={p} onClick={() => setFcPaper(p)} className={`flex-1 min-w-[100px] py-4 rounded-[1.25rem] text-xs font-black transition-all duration-300 border-2 ${fcPaper === p ? 'bg-primary/10 text-primary border-primary pro-max-shadow' : 'bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-primary/30'} uppercase tracking-widest`}>
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                    <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                                                    Pilihan Warna
                                                </h3>
                                                <div className="flex gap-3">
                                                    {[{ v: 'bw', l: 'Hitam Putih' }, { v: 'color', l: 'Full Warna' }].map(c => (
                                                        <button key={c.v} onClick={() => setFcColor(c.v)} className={`flex-1 py-4 rounded-[1.25rem] text-xs font-black transition-all duration-300 border-2 ${fcColor === c.v ? 'bg-primary/10 text-primary border-primary pro-max-shadow' : 'bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-primary/30'} uppercase tracking-widest`}>
                                                            {c.l}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                    <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                                                    Sisi Cetak
                                                </h3>
                                                <div className="flex gap-3">
                                                    {[{ v: '1', l: '1 Sisi' }, { v: '2', l: 'Bolak Balik' }].map(s => (
                                                        <button key={s.v} onClick={() => setFcSide(s.v)} className={`flex-1 py-4 rounded-[1.25rem] text-xs font-black transition-all duration-300 border-2 ${fcSide === s.v ? 'bg-primary/10 text-primary border-primary pro-max-shadow' : 'bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-primary/30'} uppercase tracking-widest`}>
                                                            {s.l}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                                                Kuantitas (Lembar)
                                            </h3>
                                            <div className="flex items-center gap-4 w-full sm:w-2/3">
                                                <button onClick={() => setFcQty(Math.max(0, fcQty - 1))} className="size-14 shrink-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center font-black text-2xl transition-all active:scale-90">
                                                    <span className="material-symbols-outlined">remove</span>
                                                </button>
                                                <input type="number" value={fcQty || ''} onChange={(e) => setFcQty(parseInt(e.target.value) || 0)} className="flex-1 h-14 text-center text-2xl font-black border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary dark:bg-slate-900 transition-all pro-max-shadow" placeholder="0" />
                                                <button onClick={() => setFcQty(fcQty + 1)} className="size-14 shrink-0 bg-primary hover:brightness-110 text-white rounded-2xl flex items-center justify-center font-black text-2xl transition-all active:scale-90 shadow-lg shadow-primary/30">
                                                    <span className="material-symbols-outlined">add</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing Right Side */}
                                    <div className="lg:w-80 xl:w-96 shrink-0 bg-primary/[0.03] dark:bg-primary/[0.02] rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-center text-center relative border border-primary/10 pro-max-shadow">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                            <span className="material-symbols-outlined text-8xl">payments</span>
                                        </div>
                                        <div className="mb-8">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Harga Satuan</h4>
                                            <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                                                {formatRupiah(getFcUnitPrice(fcPaper, fcColor, fcSide))}
                                            </div>
                                        </div>
                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mb-8"></div>
                                        <div className="mb-10">
                                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3">Subtotal Layanan</h4>
                                            <div className="text-5xl sm:text-6xl font-black text-primary tracking-tighter drop-shadow-sm">
                                                {formatRupiah(getFcUnitPrice(fcPaper, fcColor, fcSide) * fcQty)}
                                            </div>
                                        </div>
                                        <button onClick={() => addFotocopyToCart(fcPaper, fcColor, fcSide, fcQty)} className="w-full bg-primary hover:brightness-110 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/40 flex items-center justify-center gap-3 transition-all active:scale-[0.97] group">
                                            <span className="material-symbols-outlined text-[24px] group-hover:rotate-12 transition-transform">add_shopping_cart</span>
                                            Tambah Ke Keranjang
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeServiceTab === 'jilid' && (
                                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex-1 space-y-8">
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                                                Spesifikasi Jilid
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {bindingPrices.map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setJilidType(item)}
                                                        className={`p-5 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 border-2 transition-all duration-300 pro-max-shadow ${jilidType?.id === item.id ? 'bg-primary/10 text-primary border-primary' : 'bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-primary/30'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-3xl">auto_stories</span>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-center leading-tight">{item.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                                                Jumlah (Buku)
                                            </h3>
                                            <div className="flex items-center gap-4 w-full sm:w-2/3">
                                                <button onClick={() => setJilidQty(Math.max(0, jilidQty - 1))} className="size-14 shrink-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center font-black text-2xl transition-all active:scale-90"><span className="material-symbols-outlined">remove</span></button>
                                                <input type="number" value={jilidQty || ''} onChange={(e) => setJilidQty(parseInt(e.target.value) || 0)} className="flex-1 h-14 text-center text-2xl font-black border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary dark:bg-slate-900 transition-all pro-max-shadow" placeholder="0" />
                                                <button onClick={() => setJilidQty(jilidQty + 1)} className="size-14 shrink-0 bg-primary hover:brightness-110 text-white rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center font-black text-2xl transition-all active:scale-90"><span className="material-symbols-outlined">add</span></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:w-80 xl:w-96 shrink-0 bg-primary/[0.03] dark:bg-primary/[0.02] rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-center text-center relative border border-primary/10 pro-max-shadow">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                            <span className="material-symbols-outlined text-8xl">book_2</span>
                                        </div>
                                        <div className="mb-8">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Harga Satuan</h4>
                                            <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{formatRupiah(jilidType?.price || 0)}</div>
                                        </div>
                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mb-8"></div>
                                        <div className="mb-10">
                                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3">Subtotal Layanan</h4>
                                            <div className="text-5xl sm:text-6xl font-black text-primary tracking-tighter drop-shadow-sm">{formatRupiah((jilidType?.price || 0) * jilidQty)}</div>
                                        </div>
                                        <button onClick={() => addJilidToCart(jilidType, jilidQty)} className="w-full bg-primary hover:brightness-110 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-2xl shadow-primary/40 group">
                                            <span className="material-symbols-outlined text-[24px] group-hover:rotate-12 transition-transform">add_shopping_cart</span> Tambah Ke Keranjang
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeServiceTab === 'print' && (
                                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex-1 space-y-8">
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                                                Spesifikasi Cetak
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {printPrices.map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setPrintType(item)}
                                                        className={`p-5 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 border-2 transition-all duration-300 pro-max-shadow ${printType?.id === item.id ? 'bg-primary/10 text-primary border-primary' : 'bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-primary/30'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-3xl">print</span>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-center leading-tight">{item.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                                                Jumlah (Lembar)
                                            </h3>
                                            <div className="flex items-center gap-4 w-full sm:w-2/3">
                                                <button onClick={() => setPrintQty(Math.max(0, printQty - 1))} className="size-14 shrink-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center font-black text-2xl transition-all active:scale-90"><span className="material-symbols-outlined">remove</span></button>
                                                <input type="number" value={printQty || ''} onChange={(e) => setPrintQty(parseInt(e.target.value) || 0)} className="flex-1 h-14 text-center text-2xl font-black border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary dark:bg-slate-900 transition-all pro-max-shadow" placeholder="0" />
                                                <button onClick={() => setPrintQty(printQty + 1)} className="size-14 shrink-0 bg-primary hover:brightness-110 text-white rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center font-black text-2xl transition-all active:scale-90"><span className="material-symbols-outlined">add</span></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:w-80 xl:w-96 shrink-0 bg-primary/[0.03] dark:bg-primary/[0.02] rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-center text-center relative border border-primary/10 pro-max-shadow">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                            <span className="material-symbols-outlined text-8xl">print_connect</span>
                                        </div>
                                        <div className="mb-8">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Harga Satuan</h4>
                                            <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{formatRupiah(printType?.price || 0)}</div>
                                        </div>
                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mb-8"></div>
                                        <div className="mb-10">
                                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3">Subtotal Layanan</h4>
                                            <div className="text-5xl sm:text-6xl font-black text-primary tracking-tighter drop-shadow-sm">{formatRupiah((printType?.price || 0) * printQty)}</div>
                                        </div>
                                        <button onClick={() => addPrintToCart(printType, printQty)} className="w-full bg-primary hover:brightness-110 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-2xl shadow-primary/40 group">
                                            <span className="material-symbols-outlined text-[24px] group-hover:rotate-12 transition-transform">add_shopping_cart</span> Tambah Ke Keranjang
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeServiceTab === 'digital' && (
                                <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex-1 space-y-8">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                    <span className="size-1.5 rounded-full bg-secondary animate-pulse"></span>
                                                    Parameter Cetak
                                                </h3>
                                                <div className="space-y-4">
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Bahan / Material</label>
                                                        <select value={digitalMatId} onChange={(e) => setDigitalMatId(e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 px-4 font-black text-sm transition-all focus:ring-4 focus:ring-secondary/20 focus:border-secondary outline-none pro-max-shadow">
                                                            <option value="">-- Pilih Bahan --</option>
                                                            {materials.map(m => (
                                                                <option key={m.id} value={m.id}>{m.nama_bahan?.toUpperCase()} ({formatRupiah(m.harga_jual)}/m2)</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="flex flex-col gap-2">
                                                            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Panjang (M)</label>
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={digitalWidth}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(',', '.');
                                                                    if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                                                                        setDigitalWidth(val);
                                                                    }
                                                                }}
                                                                className="w-full bg-white/50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-3 px-4 font-black text-lg transition-all focus:ring-4 focus:ring-secondary/20 focus:border-secondary outline-none pro-max-shadow"
                                                                placeholder="0.0"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Lebar (M)</label>
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={digitalHeight}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(',', '.');
                                                                    if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                                                                        setDigitalHeight(val);
                                                                    }
                                                                }}
                                                                className="w-full bg-white/50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-3 px-4 font-black text-lg transition-all focus:ring-4 focus:ring-secondary/20 focus:border-secondary outline-none pro-max-shadow"
                                                                placeholder="0.0"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                    <span className="size-1.5 rounded-full bg-secondary animate-pulse"></span>
                                                    Detail Opsional
                                                </h3>
                                                <div className="space-y-4">
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Jumlah (Qty)</label>
                                                        <input type="number" value={digitalQty} onChange={(e) => setDigitalQty(parseInt(e.target.value) || 1)} className="w-full bg-white/50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-3 px-4 font-black text-lg transition-all focus:ring-4 focus:ring-secondary/20 focus:border-secondary outline-none pro-max-shadow" />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Catatan / Finishing</label>
                                                        <textarea value={digitalNotes} onChange={(e) => setDigitalNotes(e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-3 px-4 font-bold text-sm h-20 resize-none transition-all focus:ring-4 focus:ring-secondary/20 focus:border-secondary outline-none pro-max-shadow" placeholder="Contoh: Mata ayam pojok-pojok..."></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:w-80 shrink-0 bg-secondary/[0.03] dark:bg-secondary/[0.02] rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-center text-center relative border border-secondary/10 pro-max-shadow">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                            <span className="material-symbols-outlined text-8xl">wallpaper</span>
                                        </div>
                                        <div className="mb-6">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Estimasi Luas</h4>
                                            <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{(parseFloat(digitalWidth) || 0) * (parseFloat(digitalHeight) || 0)} <span className="text-sm">m2</span></div>
                                        </div>
                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mb-6"></div>
                                        <div className="mb-8">
                                            <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-2">Total Biaya</h4>
                                            <div className="text-4xl font-black text-secondary tracking-tighter drop-shadow-sm">
                                                {formatRupiah(((parseFloat(digitalWidth) || 0) * (parseFloat(digitalHeight) || 0) * (materials.find(m => m.id === digitalMatId)?.harga_jual || 0) * digitalQty) + (parseFloat(digitalDesignFee) || 0))}
                                            </div>
                                        </div>
                                        <button onClick={() => addDigitalToCart(digitalMatId, digitalWidth, digitalHeight, digitalQty, digitalNotes, digitalDesignFee)} className="w-full bg-secondary hover:brightness-110 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-secondary/40 flex items-center justify-center gap-3 transition-all active:scale-[0.97] group">
                                            <span className="material-symbols-outlined text-[24px] group-hover:rotate-12 transition-transform">wallpaper</span> Tambah Ke Keranjang
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeServiceTab === 'service' && (
                                <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex-1 space-y-8">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div className="flex flex-col gap-6">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    Informasi Unit
                                                </h3>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Nama Unit / Model</label>
                                                    <input type="text" value={serviceDevice} onChange={(e) => setServiceDevice(e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 px-4 font-black text-base transition-all focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none pro-max-shadow" placeholder="Contoh: Epson L3110..." />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Keluhan / Problem</label>
                                                    <textarea value={serviceIssue} onChange={(e) => setServiceIssue(e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 px-4 font-bold text-sm h-28 resize-none transition-all focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none pro-max-shadow" placeholder="Jelaskan kerusakan mesin..."></textarea>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-6">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    Biaya & Estimasi
                                                </h3>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Estimasi Biaya (Rp)</label>
                                                    <input type="number" value={serviceCost} onChange={(e) => setServiceCost(e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 px-4 font-black text-2xl text-emerald-500 transition-all focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none pro-max-shadow" placeholder="0" />
                                                </div>
                                                <div className="p-5 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] rounded-2xl border border-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold leading-relaxed italic pro-max-shadow">
                                                    Biaya ini adalah estimasi awal. Biaya final akan diupdate oleh teknisi setelah pengecekan mendalam.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:w-80 shrink-0 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-center text-center relative border border-emerald-500/10 pro-max-shadow">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                            <span className="material-symbols-outlined text-8xl">construction</span>
                                        </div>
                                        <div className="mb-10">
                                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-3">Penerimaan Unit</h4>
                                            <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{formatRupiah(serviceCost || 0)}</div>
                                        </div>
                                        <button onClick={() => addServiceToCart(serviceDevice, serviceIssue, serviceCost)} className="w-full bg-emerald-500 hover:brightness-110 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-emerald-500/40 flex items-center justify-center gap-3 transition-all active:scale-[0.97] group">
                                            <span className="material-symbols-outlined text-[24px] group-hover:rotate-12 transition-transform">construction</span> Buat Order Service
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Retail Products */}
                    <div className="flex flex-col gap-6 mt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-black uppercase tracking-widest italic flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                                    Produk Retail ATK
                                </h2>
                                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-[0.2em] pro-max-shadow">F5 - Cari ATK</span>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                <span className="material-symbols-outlined text-2xl">search</span>
                            </div>
                            <input
                                ref={searchInputRef}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-16 pr-6 py-5 rounded-[1.5rem] border-2 border-white dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md focus:ring-4 focus:ring-primary/20 focus:border-primary text-lg font-black transition-all pro-max-shadow placeholder:text-slate-400 placeholder:font-medium outline-none"
                                placeholder="Scan Barcode atau ketik nama produk..."
                                type="text"
                            />
                            <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
                                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Ready to scan</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                            {filteredProducts.map(p => (
                                <div key={p.id} onClick={() => addToCart(p)} className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-[2rem] border-2 border-white dark:border-slate-800 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all cursor-pointer flex flex-col gap-4 group pro-max-shadow">
                                    <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center overflow-hidden relative">
                                        {p.image ? (
                                            <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <span className="material-symbols-outlined text-5xl text-slate-300 group-hover:scale-110 transition-transform duration-500">inventory_2</span>
                                        )}
                                        {p.stock <= 5 && (
                                            <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-full pro-max-shadow animate-pulse">Sisa {p.stock}</div>
                                        )}
                                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300"></div>
                                    </div>
                                    <div className="px-1">
                                        <h4 className="font-black text-[13px] truncate uppercase tracking-tighter text-slate-800 dark:text-slate-200" title={p.name}>{p.name}</h4>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-primary font-black text-sm tracking-tight">{formatRupiah(p.sellPrice)}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{p.stock} {p.unit}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div >
                </div >

                {/* Right Sidebar: Cart */}
                <aside className={`fixed inset-y-0 right-0 z-[110] lg:z-auto lg:relative w-[85vw] sm:w-[380px] bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border-l-2 border-white dark:border-slate-800/50 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.1)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-out ${isMobile && !isCartOpen ? 'translate-x-full' : 'translate-x-0'}`}>
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0 bg-white/40 dark:bg-slate-900/40">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xl leading-none font-black flex flex-col gap-1 italic uppercase tracking-tighter">
                                <div className="flex items-center gap-2">
                                    {isMobile && (
                                        <button onClick={() => setIsCartOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-800 transition-colors"><span className="material-symbols-outlined text-xl">close</span></button>
                                    )}
                                    <span className="text-primary">RINGKASAN</span> ORDER
                                </div>
                                <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block whitespace-nowrap tracking-[0.2em] border border-slate-200 dark:border-slate-700 mt-1 not-italic">
                                    {transactionComplete ? transactionComplete.invoiceNo : draftInvoiceId}
                                </span>
                            </h2>
                            <button onClick={removeAll} className="size-10 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all pro-max-shadow flex items-center justify-center group" title="Kosongkan Keranjang">
                                <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">delete_sweep</span>
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            <button
                                onClick={() => setCustomerModalOpen(true)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-primary/50 hover:bg-primary/[0.02] transition-all text-left group pro-max-shadow"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 pro-max-shadow group-hover:scale-110 transition-transform">
                                        <FiUserPlus size={16} />
                                    </div>
                                    <div className="flex flex-col truncate">
                                        <span className="text-xs font-black text-slate-800 dark:text-white truncate uppercase tracking-tighter">
                                            {getSelectedCustomerName()}
                                        </span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                            {selectedCustomerId ? 'Ganti Pelanggan' : 'Pilih Pelanggan'}
                                        </span>
                                    </div>
                                </div>
                                <FiChevronRight size={16} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                            </button>
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/30">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 opacity-50 space-y-3">
                                <div className="size-20 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center pro-max-shadow">
                                    <span className="material-symbols-outlined text-4xl">shopping_cart_off</span>
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em]">Keranjang Kosong</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.id} className="group relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-3 rounded-xl border-2 border-white dark:border-slate-800 pro-max-shadow hover:border-primary/30 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 mr-2 min-w-0">
                                                <h4 className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-tighter leading-tight truncate">{item.name}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5 italic">{formatRupiah(item.sellPrice)}</p>
                                            </div>
                                            <button onClick={() => updateQty(item.id, -item.quantity)} className="size-6 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-500 hover:text-white">
                                                <span className="material-symbols-outlined text-xs">close</span>
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 pro-max-shadow">
                                                <button onClick={() => updateQty(item.id, -1)} className="size-6 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-all flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-base">remove</span>
                                                </button>
                                                <span className="w-8 text-center font-black text-xs text-slate-800 dark:text-slate-200">{item.quantity}</span>
                                                <button onClick={() => updateQty(item.id, 1)} className="size-6 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-all flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-base">add</span>
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-primary font-black text-sm tracking-tighter">{formatRupiah(item.sellPrice * item.quantity)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Summary & Checkout */}
                    <div className="p-4 space-y-3 border-t-2 border-white dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shrink-0">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Subtotal</span>
                                <span className="font-black text-xs text-slate-600 dark:text-slate-300 tracking-tight">{formatRupiah(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center group cursor-pointer px-1" onClick={toggleDiscountModal}>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Diskon</span>
                                    <span className="material-symbols-outlined text-[12px] text-primary group-hover:rotate-12 transition-transform">edit</span>
                                </div>
                                <span className="font-black text-xs text-red-500 tracking-tight">-{formatRupiah(globalDiscount)}</span>
                            </div>
                            {taxEnabled && (
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Pajak ({taxPercentage}%)</span>
                                    <span className="font-black text-xs text-emerald-600 tracking-tight">+{formatRupiah(taxAmount)}</span>
                                </div>
                            )}
                            <div className="h-px bg-slate-100 dark:bg-slate-800/50 mx-1"></div>
                            <div className="flex justify-between items-center px-1 py-1">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-primary uppercase tracking-[0.4em]">Total Akhir</span>
                                    <span className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">
                                        {formatRupiah(total)}
                                    </span>
                                </div>
                                <div className="size-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pb-2">
                            <button
                                onClick={saveQueue}
                                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200 transition-all pro-max-shadow group"
                            >
                                <span className="material-symbols-outlined text-amber-500 text-lg group-hover:-translate-y-0.5 transition-transform">hourglass_empty</span>
                                <span className="text-[7px] font-black uppercase tracking-[0.1em] text-slate-500 group-hover:text-amber-600">Simpan Antrean</span>
                            </button>
                            <button
                                onClick={openPayment}
                                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-primary hover:brightness-110 text-white pro-max-shadow group transition-all active:scale-[0.97]"
                                disabled={cart.length === 0}
                            >
                                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">payments</span>
                                <span className="text-[7px] font-black uppercase tracking-[0.1em]">Bayar Sekarang</span>
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
            <footer className="hidden lg:flex h-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border-t-2 border-white dark:border-slate-800/50 text-slate-400 text-[10px] font-black items-center justify-between px-8 shrink-0 z-40 relative pro-max-shadow">
                <div className="flex items-center gap-8 min-w-max">
                    <div className="flex items-center gap-3 text-primary uppercase tracking-[0.3em] italic">
                        <FiCommand className="animate-pulse text-sm" />
                        <span>Quick Shortcuts</span>
                    </div>

                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

                    <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar py-1">
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
                            <div key={i} className="flex items-center gap-2.5 group cursor-help transition-all duration-300 hover:translate-y-[-1px]">
                                <span className="px-2 py-0.5 rounded-lg border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] font-black text-primary pro-max-shadow group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    {item.k}
                                </span>
                                <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors uppercase tracking-[0.2em] text-[9px]">
                                    {item.l}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-8 pl-8 font-black text-[9px] text-slate-400 uppercase tracking-[0.3em] italic opacity-60">
                    <div className="flex items-center gap-3">
                        <span className="text-slate-200 dark:text-slate-800">/</span>
                        <span>Terminal 01</span>
                    </div>
                    <div className="flex items-center gap-3 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 text-emerald-500">
                        <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                        <span>{printerSettings.printerName || 'EPSON L3110'}</span>
                    </div>
                </div>
            </footer>

            {/* Modals from before */}
            <Modal isOpen={isDiscountModalOpen} onClose={toggleDiscountModal} title="Input Diskon / Potongan">
                <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal Diskon (Rp)</label>
                        <input
                            type="number"
                            value={globalDiscount}
                            onChange={e => setGlobalDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-white/50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-5 text-4xl font-black text-primary focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none pro-max-shadow"
                            placeholder="0"
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {[500, 1000, 5000, 10000].map(v => (
                            <button key={v} onClick={() => setGlobalDiscount(v)} className="py-3 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all pro-max-shadow">
                                +{formatRupiah(v).replace('Rp ', '')}
                            </button>
                        ))}
                    </div>
                    <button onClick={toggleDiscountModal} className="w-full py-5 bg-primary hover:brightness-110 text-white rounded-2xl font-black text-base mt-6 shadow-2xl shadow-primary/30 transition-all active:scale-[0.97] flex items-center justify-center gap-3">
                        <span className="material-symbols-outlined">check_circle</span> Terapkan Diskon
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isPaymentModalOpen} onClose={closePaymentModal} title={transactionComplete ? 'TRANSAKSI BERHASIL' : 'PROSES PEMBAYARAN'}>
                {transactionComplete ? (
                    <div className="flex flex-col items-center bg-slate-900/5 rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-full bg-emerald-500/10 p-10 flex flex-col items-center border-b border-emerald-500/10">
                            <div className="size-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-6 animate-bounce">
                                <FiCheckCircle size={48} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Berhasil!</h3>
                            <p className="text-emerald-500 font-black text-xs tracking-[0.3em] mt-2 uppercase">Pembayaran Diterima</p>
                        </div>

                        <div className="w-full p-8 max-h-[50vh] overflow-y-auto custom-scrollbar bg-white/50 dark:bg-slate-950/30">
                            <ReceiptProMax
                                receiptData={transactionComplete}
                                printSettings={printerSettings}
                                formatCurrency={formatRupiah}
                                printerWidthClass={printerSettings.printerSize === '80mm' ? 'w-full max-w-[340px]' : 'w-full max-w-[300px]'}
                            />
                        </div>

                        <div className="w-full p-8 bg-slate-50/80 dark:bg-slate-900/80 border-t border-white dark:border-slate-800 flex gap-4">
                            <button
                                onClick={() => handleDirectPrint(transactionComplete)}
                                className="flex-1 py-5 bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-white border-2 border-white dark:border-slate-700 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-white transition-all active:scale-[0.97] pro-max-shadow"
                            >
                                <FiPrinter size={18} /> Cetak Nota
                            </button>
                            <button
                                onClick={closePaymentModal}
                                className="flex-1 py-5 bg-primary text-white border-none rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:brightness-110 transition-all active:scale-[0.97]"
                            >
                                <FiPlus size={18} /> Transaksi Baru
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-primary/[0.03] dark:bg-primary/[0.02] p-8 rounded-[2.5rem] border-2 border-primary/10 flex flex-col items-center text-center pro-max-shadow">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3">Total Tagihan {taxEnabled ? '(Inc. Pajak)' : ''}</span>
                            <span className="text-5xl font-black text-primary tracking-tighter">{formatRupiah(total)}</span>
                        </div>

                        <div className="bg-blue-500/[0.03] dark:bg-blue-500/[0.02] p-6 rounded-[2rem] border-2 border-blue-500/10 pro-max-shadow">
                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] block mb-4 ml-1">Kirim Nota via WhatsApp (Opsional)</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 text-xl flex items-center group-focus-within:scale-110 transition-transform">
                                    <FiMessageCircle size={22} />
                                </span>
                                <input
                                    type="text"
                                    value={customerWa}
                                    onChange={e => setCustomerWa(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="Contoh: 08123456789"
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-white dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-black transition-all outline-none pro-max-shadow"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-3 italic font-bold ml-1 flex items-center gap-2">
                                <span className="size-1 bg-blue-400 rounded-full animate-pulse"></span>
                                Nota akan dikirim otomatis setelah transaksi selesai
                            </p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Pilih Metode Pembayaran</label>
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { id: 'tunai', icon: 'payments', label: 'Tunai' },
                                    { id: 'transfer', icon: 'account_balance', label: 'Transfer' },
                                    { id: 'qris', icon: 'qr_code_scanner', label: 'QRIS' },
                                    { id: 'pending', icon: 'schedule', label: 'Tunda' }
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setPaymentMethod(m.id)}
                                        className={`py-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all pro-max-shadow ${paymentMethod === m.id ? (m.id === 'pending' ? 'bg-amber-500 text-white border-amber-500 shadow-xl shadow-amber-500/30' : 'bg-primary text-white border-primary shadow-xl shadow-primary/30') : 'bg-white/50 dark:bg-slate-900/50 border-white dark:border-slate-800 text-slate-500 hover:border-slate-300'}`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">{m.icon}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentMethod === 'pending' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-amber-500/[0.05] border-2 border-amber-500/20 rounded-[2rem] p-6 flex gap-4 items-start pro-max-shadow">
                                <span className="material-symbols-outlined text-amber-500 text-3xl">info</span>
                                <div>
                                    <p className="text-sm font-black text-amber-600 uppercase tracking-tight">Transaksi Ditunda / Piutang</p>
                                    <p className="text-[11px] text-amber-600/70 font-bold mt-1 leading-relaxed">Transaksi akan disimpan dengan status <b className="text-amber-700">Pending</b>. Pelanggan dapat melunasi nanti melalui riwayat transaksi.</p>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'tunai' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Uang Diterima (Rp)</label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        value={amountPaid}
                                        onChange={e => setAmountPaid(e.target.value)}
                                        className="w-full px-6 py-6 rounded-[2rem] border-2 border-white dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-4 focus:ring-primary/20 focus:border-primary text-4xl font-black text-slate-800 dark:text-white transition-all outline-none pro-max-shadow"
                                        placeholder="0"
                                        autoFocus
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black italic text-xl uppercase tracking-widest pointer-events-none opacity-20">Cash Amount</div>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    {[50000, 100000, 150000, total].map((v, i) => (
                                        <button key={i} onClick={() => setAmountPaid(v)} className="py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-[11px] font-black text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-all pro-max-shadow">
                                            {formatRupiah(v).replace('Rp ', '')}
                                        </button>
                                    ))}
                                </div>
                                {Number(amountPaid) >= total && (
                                    <div className="mt-6 p-6 rounded-[2rem] bg-emerald-500/[0.05] border-2 border-emerald-500/20 flex justify-between items-center pro-max-shadow">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Kembalian</span>
                                            <span className="text-3xl font-black text-emerald-600 tracking-tighter">{formatRupiah(Number(amountPaid) - total)}</span>
                                        </div>
                                        <div className="size-14 rounded-full bg-emerald-500 text-white flex items-center justify-center pro-max-shadow">
                                            <span className="material-symbols-outlined text-3xl">change_circle</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleConfirmPayment}
                            disabled={isProcessingPayment || (paymentMethod === 'tunai' && Number(amountPaid) < total)}
                            className="w-full py-6 bg-primary disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/30 hover:brightness-110 transition-all flex items-center justify-center gap-4 active:scale-[0.97]"
                        >
                            {isProcessingPayment ? (
                                <>
                                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">task_alt</span> Proses Selesai
                                </>
                            )}
                        </button>
                    </div>
                )}
            </Modal>

            {/* Customer Selection Modal */}
            <Modal isOpen={isCustomerModalOpen} onClose={() => setCustomerModalOpen(false)} title="Pilih Data Pelanggan">
                <div className="flex flex-col h-[65vh] md:h-[550px] animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="px-1 py-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="relative group">
                            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari nama atau telepon pelanggan..."
                                value={customerSearch}
                                onChange={e => setCustomerSearch(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none text-sm font-black transition-all pro-max-shadow"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-1 space-y-3 py-6 custom-scrollbar">
                        {/* Option: Default / Umum */}
                        <div
                            onClick={() => { setSelectedCustomerId(''); setCustomerModalOpen(false); }}
                            className={`p-5 rounded-[1.8rem] border-2 cursor-pointer transition-all flex items-center gap-5 pro-max-shadow ${selectedCustomerId === '' ? 'border-primary bg-primary/[0.03]' : 'border-white dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-primary/30'}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${selectedCustomerId === '' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                <FiUserCheck size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">Umum / Tanpa Nama</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transaksi anonim (default)</p>
                            </div>
                            {selectedCustomerId === '' && <FiCheckCircle size={24} className="text-primary" />}
                        </div>

                        {/* Customer List */}
                        {customers
                            .filter(c => (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone || '').includes(customerSearch))
                            .map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => { setSelectedCustomerId(c.id); setCustomerModalOpen(false); }}
                                    className={`p-5 rounded-[1.8rem] border-2 cursor-pointer transition-all flex items-center gap-5 pro-max-shadow ${selectedCustomerId === c.id ? 'border-primary bg-primary/[0.03]' : 'border-white dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-primary/30'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg transition-all ${selectedCustomerId === c.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-primary/10 text-primary'}`}>
                                        {c.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">{c.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{c.phone || c.email || 'Tanpa Kontak'}</p>
                                    </div>
                                    {selectedCustomerId === c.id && <FiCheckCircle size={24} className="text-primary shrink-0" />}
                                </div>
                            ))
                        }
                    </div>

                    {/* Manual Override Action */}
                    <div className="border-t-2 border-white dark:border-slate-800/50 pt-6 shrink-0 px-1 mt-2">
                        <div className="p-5 bg-slate-500/[0.03] dark:bg-slate-500/[0.02] rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 pro-max-shadow">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 block ml-1">Input Nama Cepat (Sekali Pakai)</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Ketik nama pelanggan baru..."
                                    value={manualCustomerName}
                                    onChange={e => setManualCustomerName(e.target.value)}
                                    className="flex-1 px-5 py-3 rounded-xl border-2 border-white dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-primary font-black text-sm transition-all pro-max-shadow"
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
                                                    confirmButton: 'bg-primary hover:bg-primary-dark text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-primary/30 transition-all active:scale-95',
                                                    popup: 'dark:bg-slate-900 dark:text-white rounded-[2.5rem] border-2 border-white dark:border-slate-800 pro-max-shadow p-8',
                                                    title: 'dark:text-white font-black uppercase tracking-tighter text-2xl'
                                                },
                                                buttonsStyling: false
                                            });
                                        }
                                    }}
                                    className="px-6 py-3 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.97] pro-max-shadow"
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
