import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';
import { formatRupiah, generateInvoice, generateRawReceipt, printViaBluetooth, initQZ, printViaQZ } from '../utils';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import Swal from 'sweetalert2';
import ReceiptProMax from '../components/ReceiptProMax';
import PosHeader from '../components/pos/PosHeader';
import { 
    Search, RefreshCw, ShoppingCart, Save, CreditCard, 
    User, ChevronRight, X, Minus, Plus, Trash2, 
    Package, LayoutGrid, Clock, Settings, Maximize, 
    LogOut, UserPlus, Info, AlertCircle, CheckCircle2,
    Book, CheckCircle, Smartphone, MapPin, Mail, Phone
} from 'lucide-react';
import { FiPrinter, FiSearch, FiCheckCircle, FiUserPlus, FiChevronRight, FiList, FiPlus, FiArrowLeft, FiMessageCircle, FiUserCheck } from 'react-icons/fi';

export default function IntegratedPos({ onNavigate, pageState, onFullscreenChange, storeSettings }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { themeMode: theme, setTheme: toggleTheme } = useTheme();
    const isElectron = navigator.userAgent.toLowerCase().includes('electron');
    const API_HOST = isElectron ? 'http://localhost:5001' : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : window.location.origin);

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
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(false);

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

    // Fotocopy Config State
    const [fcConfig, setFcConfig] = useState({
        paper: 'HVS A4',
        color: 'bw',
        side: '1',
        quantity: 1
    });

    // Jilid & Print States
    const [printType, setPrintType] = useState(null);
    const [jilidType, setJilidType] = useState(null);
    const [fcDiscounts, setFcDiscounts] = useState([]);

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
                    name: p.name || `Print ${p.paper} (${p.color === 'bw' ? 'B/W' : 'Warna'}) ${p.side === '2' ? 'Bolak-balik' : '1 Sisi'}`
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
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (Number(item.sellPrice || 0) * item.quantity), 0), [cart]);
    const taxAmount = useMemo(() => taxEnabled ? Math.round((subtotal - globalDiscount) * (taxPercentage / 100)) : 0, [subtotal, globalDiscount, taxEnabled, taxPercentage]);
    const total = useMemo(() => subtotal - globalDiscount + taxAmount, [subtotal, globalDiscount, taxAmount]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = !searchQuery || 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedCategory === 'all' || (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
            const isRetail = !p.type || (p.type.toLowerCase() !== 'service' && p.type.toLowerCase() !== 'fotocopy');
            return matchesSearch && matchesCategory && isRetail;
        });
    }, [products, searchQuery, selectedCategory]);

    // Barcode Listener
    useEffect(() => {
        const handleKeyPress = (e) => {

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


    // Cart Handlers
    const addToCart = (product) => {
        if (product.stock <= 0) { Swal.fire({ icon: 'warning', title: 'Stok Habis', text: 'Stok barang habis!', timer: 2500 }); return; }
        const price = product.sellPrice || product.price || 0;
        const productWithPrice = { ...product, sellPrice: price };
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) return prev;
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...productWithPrice, quantity: 1 }];
        });
    };

    const updateQty = (id, delta, isAbsolute = false) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = isAbsolute ? delta : Math.max(0, item.quantity + delta);
                if (!isAbsolute && delta > 0 && item.stock && newQty > item.stock) return item;
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
            setSelectedCustomerId(null);
            setManualCustomerName('');
        }
    };

    const removeFromCart = (index) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const categories = useMemo(() => {
        const uniqueCats = [...new Set(products.map(p => p.category).filter(Boolean))];
        return uniqueCats.map((cat, index) => ({ id: cat, name: cat }));
    }, [products]);

    const fetchInitialData = async () => {
        setIsLoading(true);
        // We already have loadInitialData in useEffect, so let's just use it or copy logic
        // For now, let's just trigger a re-fetch of products
        try {
            const res = await api.get('/products');
            setProducts(res.data || []);
            showToast('Data produk berhasil diperbarui', 'success');
        } catch (e) {
            showToast('Gagal memuat ulang data', 'error');
        } finally {
            setIsLoading(false);
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
            setFcConfig(prev => ({ ...prev, quantity: 1 }));
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
        setFcConfig(prev => ({ ...prev, quantity: 1 }));
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
            updateQty(existingItem.id, 1); // Always increment by 1 sequentially
            showToast('Keranjang diperbarui!', 'success');
        } else {
            const newItem = {
                id: `jilid-${Date.now()}-${Math.random()}`,
                name: `${item.name}`,
                sellPrice: item.price,
                quantity: 1, // Start with 1
                type: 'service'
            };
            setCart(prev => [...prev, newItem]);
            showToast('Jilid ditambahkan ke keranjang!', 'success');
        }
    };

    const addPrintToCart = (item, qty) => {
        if (!item) { showToast('Pilih Spesifikasi Cetak terlebih dahulu.', 'warning'); return; }
        if (qty <= 0) { showToast('Masukkan Jumlah Lembar untuk Print.', 'warning'); return; }
        const name = `Print ${item.paper} ${item.color.toUpperCase()} ${item.side === '2' ? '(Bolak-balik)' : '(1 Sisi)'}`;
        const existingItem = cart.find(c => c.name === name && c.type === 'service');
        if (existingItem) {
            updateQty(existingItem.id, 1); // Always increment by 1 sequentially
            showToast('Keranjang diperbarui!', 'success');
        } else {
            const newItem = {
                id: `print-${Date.now()}-${Math.random()}`,
                name,
                sellPrice: item.price,
                quantity: 1, // Start with 1
                type: 'service'
            };
            setCart(prev => [...prev, newItem]);
            showToast('Print ditambahkan ke keranjang!', 'success');
        }
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
        if (!printerSettings.printerName) {
            showToast('Printer belum dikonfigurasi di Pengaturan', 'warning');
            return;
        }
        try {
            await api.post('/print/open-drawer', { printerName: printerSettings.printerName });
            showToast('Membuka laci kasir...', 'success');
        } catch (err) {
            showToast('Gagal membuka laci kasir', 'error');
        }
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
            setManualCustomerName('');
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
        'F3': () => setActiveServiceTab('print'),
        'F5': () => searchInputRef.current?.focus(),
        'F8': () => openCashDrawer(),
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
                        setSelectedCustomerId(null);
                        setManualCustomerName('');
                    }
                });
            }
        },
    });

    return (
        <div className="flex h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 relative">
                {/* Unified Tab Navigation */}
                <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm z-30 shrink-0">
                    <div className="flex items-center gap-2 p-3 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'retail', label: 'Retail ATK', icon: 'shopping_bag', key: 'F5', count: filteredProducts.length },
                            { id: 'fotocopy', label: 'Fotocopy', icon: 'content_copy', key: 'F1', count: fotocopyPrices.length },
                            { id: 'jilid', label: 'Jilid', icon: 'book', key: 'F2', count: bindingPrices.length },
                            { id: 'print', label: 'Print', icon: 'print', key: 'F3', count: printPrices.length }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveServiceTab(tab.id)}
                                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black transition-all duration-300 whitespace-nowrap active:scale-95 ${activeServiceTab === tab.id
                                    ? `bg-blue-600 text-white shadow-lg shadow-blue-500/30`
                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-800 shadow-sm'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] uppercase tracking-widest">{tab.label}</span>
                                    <span className="text-[9px] font-black opacity-50 mt-1">{tab.count} Items</span>
                                </div>
                                <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded uppercase font-black opacity-50 ml-2">{tab.key}</span>
                            </button>
                        ))}
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 ml-auto pr-2">
                            <button
                                onClick={() => openCashDrawer()}
                                className="flex items-center gap-3 px-6 py-4 rounded-2xl font-black transition-all duration-300 whitespace-nowrap active:scale-95 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30"
                                title="Buka Laci Kasir (F8)"
                            >
                                <span className="material-symbols-outlined text-[20px]">inbox</span>
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] uppercase tracking-widest">Buka Laci</span>
                                    <span className="text-[9px] font-black opacity-70 mt-1">Cash Drawer</span>
                                </div>
                                <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded uppercase font-black opacity-70 ml-2">F8</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Section - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar scroll-smooth">
                    {/* Retail ATK Tab */}
                    {activeServiceTab === 'retail' && (
                        <div className="space-y-6">
                            {/* Search & Filter Bar */}
                            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Cari produk retail (Nama / SKU)..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 text-slate-800 dark:text-white font-bold transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="py-3 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs uppercase tracking-widest cursor-pointer outline-none focus:border-blue-500"
                                    >
                                        <option value="all">SEMUA KATEGORI</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                    <button onClick={() => fetchInitialData()} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-500 transition-all">
                                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="group bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[2.5rem] p-5 text-left transition-all hover:border-blue-500 hover:shadow-2xl hover:-translate-y-2 active:scale-[0.98] flex flex-col relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-10 transition-opacity">
                                            <Package size={80} />
                                        </div>
                                        
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors overflow-hidden">
                                                {product.image ? (
                                                    <img 
                                                        src={product.image.startsWith('http') ? product.image : (product.image.startsWith('/') ? `${API_HOST}${product.image}` : `${API_HOST}/${product.image}`)} 
                                                        alt={product.name} 
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = '';
                                                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-300"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.27 6.96 8.73 5.04 8.73-5.04"></path><path d="M12 22.08V12"></path></svg></div>';
                                                        }}
                                                    />
                                                ) : (
                                                    <Package size={24} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-600 transition-colors">
                                                    {product.category || 'RETAIL'}
                                                </div>
                                                <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black text-slate-500 dark:text-slate-400">
                                                    {product.sku || product.code || 'NO-SKU'}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="relative z-10 flex-1 flex flex-col">
                                            <h3 
                                                title={product.name}
                                                className="text-base font-black text-slate-900 dark:text-white mb-4 line-clamp-4 uppercase tracking-tight leading-tight min-h-[4rem]"
                                            >
                                                {product.name}
                                            </h3>
                                            
                                            <div className="mt-auto flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Price</span>
                                                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                                                        {formatRupiah(product.sellPrice || product.price)}
                                                    </span>
                                                </div>
                                                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                                    <Plus size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Fotocopy Tab */}
                    {activeServiceTab === 'fotocopy' && (
                        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none">
                                <div className="flex flex-col lg:flex-row">
                                    <div className="flex-1 p-8 md:p-12 space-y-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
                                                <RefreshCw size={32} />
                                            </div>
                                            <div>
                                                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                                                    KONFIGURASI <span className="text-blue-600 block sm:inline">FOTOCOPY</span>
                                                </h2>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Pilih spesifikasi layanan Anda</p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ukuran Kertas</label>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {['HVS A4', 'HVS F4', 'HVS A3'].map(size => (
                                                        <button
                                                            key={size}
                                                            onClick={() => setFcConfig({...fcConfig, paper: size})}
                                                            className={`px-6 py-4 text-sm font-black transition-all border-2 rounded-2xl flex items-center justify-between group ${fcConfig.paper === size ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-500'}`}
                                                        >
                                                            {size}
                                                            <Package size={16} className={`${fcConfig.paper === size ? 'text-white' : 'text-slate-300 group-hover:text-blue-500'}`} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-6 bg-slate-900 dark:bg-white rounded-full"></span>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Warna & Sisi</label>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                                        {['bw', 'color'].map(c => (
                                                            <button
                                                                key={c}
                                                                onClick={() => setFcConfig({...fcConfig, color: c})}
                                                                className={`flex-1 py-3 text-[10px] font-black transition-all rounded-xl uppercase tracking-widest ${fcConfig.color === c ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                                            >
                                                                {c === 'bw' ? 'B/W' : 'Warna'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['1', '2'].map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => setFcConfig({...fcConfig, side: s})}
                                                                className={`py-3.5 text-[10px] font-black transition-all border-2 rounded-2xl uppercase tracking-widest ${fcConfig.side === s ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600'}`}
                                                            >
                                                                {s === '1' ? '1 Sisi' : '2 Sisi'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kuantitas (Lembar)</label>
                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">MASUKKAN ANGKA</span>
                                            </div>
                                            <input
                                                type="number"
                                                value={fcConfig.quantity}
                                                onChange={(e) => setFcConfig({...fcConfig, quantity: parseInt(e.target.value) || 1})}
                                                className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] text-4xl font-black text-center focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white placeholder:text-slate-300"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="w-full lg:w-[400px] bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                                        
                                        <div className="relative space-y-2">
                                            <div className="text-[11px] font-black text-blue-100 uppercase tracking-[0.4em] opacity-80">Estimasi Harga</div>
                                            <div className="text-7xl font-black text-white tracking-tighter">
                                                {formatRupiah(getFcUnitPrice(fcConfig.paper, fcConfig.color, fcConfig.side) * fcConfig.quantity)}
                                            </div>
                                            <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest mt-4">
                                                {formatRupiah(getFcUnitPrice(fcConfig.paper, fcConfig.color, fcConfig.side))} / LEMBAR
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => addFotocopyToCart(fcConfig.paper, fcConfig.color, fcConfig.side, fcConfig.quantity)}
                                            className="w-full py-6 bg-white hover:bg-slate-50 text-blue-600 font-black text-xl tracking-widest uppercase transition-all shadow-2xl shadow-black/20 active:scale-95 rounded-3xl flex items-center justify-center gap-3 group"
                                        >
                                            <ShoppingCart size={24} className="group-hover:rotate-12 transition-transform" />
                                            TAMBAH
                                        </button>
                                        
                                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-100/40 uppercase tracking-widest">
                                            <Info size={14} />
                                            Harga dapat berubah sesuai kebijakan
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Jilid Tab */}
                    {activeServiceTab === 'jilid' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase mb-8">
                                LAYANAN <span className="text-blue-600">PENJILIDAN</span>
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {bindingPrices.length > 0 ? bindingPrices.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => addJilidToCart(item, 1)}
                                        className="group bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 p-6 text-left transition-all hover:border-blue-500 hover:shadow-2xl hover:-translate-y-2 active:scale-[0.98] relative rounded-[2rem] overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Book size={64} />
                                        </div>
                                        <div className="flex flex-col h-full relative z-10">
                                            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                <Book size={28} />
                                            </div>
                                            <h3 
                                                title={item.name}
                                                className="text-lg font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tighter leading-tight line-clamp-3 min-h-[3rem]"
                                            >
                                                {item.name}
                                            </h3>
                                            <div className="mt-auto pt-4 flex items-center justify-between">
                                                <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                                                    {formatRupiah(item.price)}
                                                </div>
                                                <div className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                                    <Plus size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                )) : (
                                    <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
                                        Belum ada data harga jilid di pengaturan
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Print Tab */}
                    {activeServiceTab === 'print' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase mb-8">
                                JASA <span className="text-blue-600">PRINTING</span>
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {printPrices.length > 0 ? printPrices.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => addPrintToCart(item, 1)}
                                        className="group bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 p-6 text-left transition-all hover:border-emerald-500 hover:shadow-2xl hover:-translate-y-2 active:scale-[0.98] relative rounded-[2rem] overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <FiPrinter size={64} />
                                        </div>
                                        <div className="flex flex-col h-full relative z-10">
                                            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                <FiPrinter size={28} />
                                            </div>
                                            <h3 
                                                title={item.paper}
                                                className="text-xl font-black text-slate-800 dark:text-white mb-1 uppercase tracking-tighter leading-tight line-clamp-2"
                                            >
                                                {item.paper}
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.color === 'bw' ? 'HITAM PUTIH' : 'BERWARNA'}</p>
                                            <p className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest mb-4">{item.side === '2' ? 'BOLAK-BALIK' : '1 SISI'}</p>
                                            <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50 dark:border-slate-800">
                                                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                                    {formatRupiah(item.price)}
                                                </div>
                                                <div className="w-10 h-10 bg-emerald-600 text-white flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all shadow-lg shadow-emerald-500/20">
                                                    <Plus size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                )) : (
                                    <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
                                        Belum ada data harga print di pengaturan
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                </div>

                {/* Bottom Bar */}
                <footer className="h-14 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-30 shrink-0">
                    <div className="flex items-center gap-8 text-[9px] font-black text-slate-400 tracking-[0.2em]">
                        <div className="flex items-center gap-3">
                            <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            SERVER READY
                        </div>
                        <div className="flex items-center gap-6 opacity-60">
                            <span>F1 FOTOCOPY</span>
                            <span>F3 PRINT</span>
                            <span>F5 RETAIL</span>
                            <span>F10 BAYAR</span>
                        </div>
                    </div>
                    <div className="text-[9px] font-black text-blue-600 uppercase italic tracking-[0.3em] opacity-80">
                        Integrated POS v3.0
                    </div>
                </footer>
            </main>

            {/* Right Sidebar: Checkout */}
            <aside className={`${isMobile ? (isCartOpen ? 'fixed inset-y-0 right-0 z-50' : 'hidden') : 'relative'} w-[380px] shrink-0 bg-white dark:bg-slate-900 flex flex-col h-full shadow-[-20px_0_60px_rgba(0,0,0,0.04)] z-40`}>
                <div className="p-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white italic tracking-tighter mb-6">
                        RINGKASAN <span className="text-blue-600">ORDER</span>
                    </h2>
                    <button
                        onClick={() => setCustomerModalOpen(true)}
                        className="w-full flex items-center gap-5 p-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[2.2rem] hover:border-blue-500 transition-all group"
                    >
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <User size={28} />
                        </div>
                        <div className="text-left flex-1">
                            <div className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                {selectedCustomerId === 'manual' ? manualCustomerName : (getSelectedCustomerName() || 'UMUM / PELANGGAN')}
                            </div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Data Pelanggan</div>
                        </div>
                        <ChevronRight className="text-slate-300" size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-5 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 p-12 text-center opacity-40">
                            <ShoppingCart size={80} className="opacity-10 mb-6" />
                            <h3 className="font-black text-2xl uppercase italic">Keranjang Kosong</h3>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-[2.5rem] border border-transparent hover:border-blue-500/20 transition-all shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h4 
                                            title={item.name}
                                            className="font-black text-slate-800 dark:text-white text-sm uppercase leading-tight break-words"
                                        >
                                            {item.name}
                                        </h4>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1">{formatRupiah(item.sellPrice)} x {item.quantity}</p>
                                    </div>
                                    <button onClick={() => removeFromCart(idx)} className="text-slate-300 hover:text-red-500 transition-all">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">{formatRupiah(item.sellPrice * item.quantity)}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-40px_80px_rgba(0,0,0,0.06)] rounded-t-[3.5rem]">
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center text-slate-400 font-black uppercase tracking-[0.2em] text-[9px]">
                            <span>Subtotal</span>
                            <span>{formatRupiah(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-blue-600 font-black uppercase tracking-[0.2em] text-[9px]">
                            <button onClick={toggleDiscountModal}>Diskon (F9)</button>
                            <span>-{formatRupiah(globalDiscount)}</span>
                        </div>
                        <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-4">
                            <div className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">Total Akhir</div>
                            <div className="text-5xl font-black text-blue-600 tracking-tighter">{formatRupiah(subtotal - globalDiscount)}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <button onClick={saveQueue} className="p-6 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-[2rem] font-black active:scale-95 transition-all flex flex-col items-center gap-2">
                            <Save size={24} />
                            <span className="text-[8px] uppercase tracking-widest">Simpan (F12)</span>
                        </button>
                        <button onClick={openPayment} className="p-6 bg-blue-600 text-white rounded-[2rem] font-black active:scale-95 transition-all flex flex-col items-center gap-2 shadow-xl shadow-blue-500/20">
                            <CreditCard size={24} />
                            <span className="text-[8px] uppercase tracking-widest">Bayar (F10)</span>
                        </button>
                    </div>
                </div>
            </aside>

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



            {/* Modals from before */}
            <Modal isOpen={isDiscountModalOpen} onClose={toggleDiscountModal} title="Input Diskon / Potongan">
                <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal Diskon (Rp)</label>
                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-black text-3xl pointer-events-none group-focus-within:scale-110 transition-transform">Rp</div>
                            <input
                                type="text"
                                value={globalDiscount !== '' ? Number(globalDiscount).toLocaleString('id-ID') : ''}
                                onChange={e => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setGlobalDiscount(Math.max(0, parseInt(val) || 0));
                                }}
                                className="w-full bg-white/50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-5 pl-24 text-4xl font-black text-primary focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none pro-max-shadow"
                                placeholder="0"
                                autoFocus
                            />
                        </div>
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
                                    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-primary font-black text-3xl pointer-events-none group-focus-within:scale-110 transition-transform">Rp</div>
                                    <input
                                        type="text"
                                        value={amountPaid !== '' ? Number(amountPaid).toLocaleString('id-ID') : ''}
                                        onChange={e => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setAmountPaid(val);
                                        }}
                                        className="w-full pl-24 pr-6 py-6 rounded-[2rem] border-2 border-white dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-4 focus:ring-primary/20 focus:border-primary text-4xl font-black text-slate-800 dark:text-white transition-all outline-none pro-max-shadow"
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
