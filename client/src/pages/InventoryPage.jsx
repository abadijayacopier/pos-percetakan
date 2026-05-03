import { useState, useMemo, useEffect, useRef } from 'react';
import api from '../services/api';
import { formatRupiah } from '../utils';
import Modal from '../components/Modal';
import {
    FiPackage,
    FiPlus,
    FiEdit,
    FiTrash2,
    FiSearch,
    FiAlertTriangle,
    FiSave,
    FiX,
    FiBox,
    FiLayers,
    FiDollarSign,
    FiPenTool,
    FiBookOpen,
    FiFolder,
    FiPaperclip,
    FiDroplet,
    FiFileText,
    FiPrinter,
    FiImage,
    FiCpu,
    FiChevronLeft,
    FiChevronRight,
    FiTag,
    FiAlertCircle,
    FiInfo,
    FiRefreshCw,
    FiClock,
    FiBarChart2,
    FiCheck,
    FiUpload,
    FiDownload,
    FiSend
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import StockOpnameModal from '../components/StockOpnameModal';

const emptyForm = { code: '', name: '', categoryId: '', buyPrice: '', sellPrice: '', stock: '', minStock: '', unit: 'pcs', emoji: '📦', image: '' };

const CAT_ICONS = {
    c1: <FiPenTool size={18} />,
    c2: <FiBookOpen size={18} />,
    c3: <FiFolder size={18} />,
    c4: <FiPaperclip size={18} />,
    c5: <FiDroplet size={18} />,
    c6: <FiFileText size={18} />,
    c7: <FiPrinter size={18} />,
    c8: <FiImage size={18} />,
    c9: <FiCpu size={18} />,
};

const CAT_ICON_SMALL = {
    c1: <FiPenTool size={12} />,
    c2: <FiBookOpen size={12} />,
    c3: <FiFolder size={12} />,
    c4: <FiPaperclip size={12} />,
    c5: <FiDroplet size={12} />,
    c6: <FiFileText size={12} />,
    c7: <FiPrinter size={12} />,
    c8: <FiImage size={12} />,
    c9: <FiCpu size={12} />,
};

export default function InventoryPage({ onNavigate, storeSettings }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [opnameTarget, setOpnameTarget] = useState(null);
    const [unitOptions, setUnitOptions] = useState(() => {
        const saved = localStorage.getItem('custom_units');
        const parsed = saved ? JSON.parse(saved) : [];
        return parsed.length > 0 ? parsed : ['pcs', 'box', 'rim', 'roll', 'lembar', 'kg', 'liter', 'set'];
    });
    const [promptModal, setPromptModal] = useState({ isOpen: false, type: '', title: '', value: '' });
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [page, setPage] = useState(1);
    const [selectedItems, setSelectedItems] = useState([]); // Array of IDs
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [salesName, setSalesName] = useState('Sales Admin');
    const [selectedQuantities, setSelectedQuantities] = useState({}); // { productId: qty }
    const [showLabelModal, setShowLabelModal] = useState(false);
    const [selectedLabelItem, setSelectedLabelItem] = useState(null);
    const [labelQty, setLabelQty] = useState(1);
    const [useCutLines, setUseCutLines] = useState(true);
    const [labelPaperSize, setLabelPaperSize] = useState('thermal'); // 'thermal' or 'a4'
    const [labelType, setLabelType] = useState('barcode'); // 'barcode' or 'qrcode'
    const printRef = useRef();
    const labelPrintRef = useRef();
    const PER_PAGE = 10;

    const reload = async () => {
        try {
            const [prodRes, catRes] = await Promise.all([
                api.get('/products'),
                api.get('/products/categories')
            ]);
            setProducts(prodRes.data || []);
            setCategories(catRes.data || []);
        } catch (e) {
            console.error('Failed to load inventory', e);
        }
    };

    useEffect(() => {
        const initReload = async () => {
            await reload();
        };
        initReload();
    }, []);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return products.filter(p => {
            const matchSearch = !q || (p.name || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q);
            const matchCat = filterCat === 'all' || p.categoryId === filterCat;
            return matchSearch && matchCat;
        });
    }, [products, search, filterCat]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const handleSearch = (v) => { setSearch(v); setPage(1); };
    const handleFilter = (v) => { setFilterCat(v); setPage(1); };

    const lowStockCount = products.filter(p => p.stock <= (p.minStock || 0) && (p.minStock || 0) > 0).length;
    const totalValue = products.reduce((s, p) => s + (p.sellPrice || 0) * (p.stock || 0), 0);
    const catCount = [...new Set(products.map(p => p.categoryId))].length;

    const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (p) => { setEditItem(p); setForm({ ...p, buyPrice: p.buyPrice || '', sellPrice: p.sellPrice || '', stock: p.stock || '', minStock: p.minStock || '' }); setShowModal(true); };

    const handleSave = async () => {
        if (!form.name.trim()) {
            Swal.fire({ icon: 'warning', title: 'Data Tidak Lengkap', text: 'Nama barang wajib diisi!', confirmButtonColor: '#3b82f6' });
            return;
        }

        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('code', form.code || ('PRD-' + Date.now().toString(36).toUpperCase()));
        formData.append('categoryId', form.categoryId || '');
        formData.append('buyPrice', Number(form.buyPrice) || 0);
        formData.append('sellPrice', Number(form.sellPrice) || 0);
        formData.append('stock', Number(form.stock) || 0);
        formData.append('minStock', Number(form.minStock) || 0);
        formData.append('unit', form.unit || 'pcs');
        formData.append('emoji', form.emoji || '📦');

        if (form.image instanceof File) {
            formData.append('image', form.image);
        }

        try {
            if (editItem) {
                await api.put(`/products/${editItem.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            setShowModal(false);
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: `Barang ATK telah ${editItem ? 'diperbarui' : 'ditambahkan'}.`,
                timer: 1500,
                showConfirmButton: false
            });
            reload();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Gagal Menyimpan', text: e.response?.data?.message || e.message, confirmButtonColor: '#ef4444' });
        }
    };

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Ensure XLSX is loaded
            if (!window.XLSX) {
                Swal.fire({ title: 'Menyiapkan modul...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                const script = document.createElement('script');
                script.src = 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js';
                document.head.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
                Swal.close();
            }

            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target.result;
                    const wb = window.XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = window.XLSX.utils.sheet_to_json(ws);

                    if (data.length === 0) return Swal.fire('Gagal', 'File Excel kosong atau format tidak sesuai', 'error');

                    // Map Excel columns to our fields
                    const items = data.map(row => ({
                        code: row.Kode || row.kode || row.Code || row.code || '',
                        name: row.Nama || row.nama || row.Name || row.name || '',
                        category: row.Kategori || row.kategori || row.Category || row.category || '',
                        buyPrice: row['Harga Beli'] || row.harga_beli || row.buyPrice || 0,
                        sellPrice: row['Harga Jual'] || row.harga_jual || row.sellPrice || 0,
                        stock: row.Stok || row.stok || row.Stock || row.stock || 0,
                        minStock: row['Stok Minimum'] || row.min_stock || row.minStock || 0,
                        unit: row.Satuan || row.satuan || row.Unit || row.unit || 'pcs'
                    })).filter(item => item.name);

                    if (items.length === 0) return Swal.fire('Gagal', 'Tidak ada data produk yang valid (Nama wajib diisi)', 'error');

                    const result = await Swal.fire({
                        title: 'Konfirmasi Import',
                        html: `Ditemukan <b>${items.length}</b> produk dalam file.<br/><small class="text-slate-500">Produk dengan kode yang sama akan diperbarui.</small>`,
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Ya, Impor Sekarang',
                        cancelButtonText: 'Batal'
                    });

                    if (result.isConfirmed) {
                        Swal.fire({ title: 'Mengimpor Data...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                        await api.post('/products/import', { items });
                        Swal.fire({ icon: 'success', title: 'Berhasil!', text: `${items.length} produk telah berhasil diimpor.`, timer: 2000 });
                        reload();
                    }
                } catch (err) {
                    Swal.fire('Gagal', 'Gagal memproses file: ' + err.message, 'error');
                }
            };
            reader.readAsBinaryString(file);
        } catch (err) {
            Swal.fire('Gagal', 'Gagal memuat sistem impor: ' + err.message, 'error');
        }
        e.target.value = ''; // Reset input
    };

    const handleCancel = () => {
        const isDirty = form.name.trim() !== '' || String(form.buyPrice) !== '' || String(form.sellPrice) !== '';
        if (isDirty) {
            Swal.fire({
                title: 'Batalkan Pengisian?',
                text: 'Data yang sudah Anda ketik akan hilang.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ya, Batalkan',
                cancelButtonText: 'Lanjut Isi',
                customClass: {
                    confirmButton: 'bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl ml-3',
                    cancelButton: 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl',
                    popup: 'dark:bg-slate-800 dark:text-white rounded-3xl',
                    title: 'text-slate-800 dark:text-white font-black',
                    htmlContainer: 'text-slate-600 dark:text-slate-300'
                },
                buttonsStyling: false,
                background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b'
            }).then((result) => {
                if (result.isConfirmed) setShowModal(false);
            });
        } else {
            setShowModal(false);
        }
    };

    const handleToggleSelect = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedItems(paginated.map(p => p.id));
        } else {
            setSelectedItems([]);
        }
    };

    const handlePrintLabel = (item) => {
        setSelectedLabelItem(item);
        setLabelQty(1); // Reset to 1 every time modal opens
        setShowLabelModal(true);
    };

    const doPrintLabel = () => {
        if (selectedItems.length === 0 && !selectedLabelItem) return;
        
        const itemsToPrint = selectedLabelItem 
            ? [{ ...selectedLabelItem, qty: labelQty }] 
            : products.filter(p => selectedItems.includes(p.id)).map(p => ({ ...p, qty: parseInt(selectedQuantities[p.id]) || 1 }));

        if (itemsToPrint.length === 0) return;

        const windowPrint = window.open('', '', 'width=900,height=1100');
        let labelsHtml = '';

        itemsToPrint.forEach(item => {
            const qty = parseInt(item.qty) || 1;
            for (let i = 0; i < qty; i++) {
                // Barcode 39 validation: Only A-Z, 0-9, and - . $ / + % SPACE
                let codeData = (item.sku || item.code || item.id?.toString().slice(-6) || '').toUpperCase();
                // Replace invalid characters with dash
                codeData = codeData.replace(/[^A-Z0-9\-\.\$\/\+\%\s]/g, '-');
                
                const codeDisplay = labelType === 'barcode' ? `*${codeData}*` : '';
                const qrUrl = labelType === 'qrcode' ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(codeData)}` : '';

                labelsHtml += `
                    <div class="label-card">
                        <div class="store-name">${storeSettings?.name || 'ABADI JAYA'}</div>
                        <div class="product-name">${item.name}</div>
                        <div class="price">${formatRupiah(item.sellPrice)}</div>
                        ${labelType === 'barcode' 
                            ? `<div class="barcode">${codeDisplay}</div>` 
                            : `<div class="qrcode"><img src="${qrUrl}" /></div>`
                        }
                        <div class="sku">${codeData}</div>
                    </div>
                `;
            }
        });

        windowPrint.document.write(`
            <html>
                <head>
                    <title>Cetak Label Produk - ${storeSettings?.name || 'POS'}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39&family=Inter:wght@400;700;900&display=swap');
                        
                        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; background: white; -webkit-print-color-adjust: exact; }
                        
                        .print-container { 
                            display: ${labelPaperSize === 'a4' ? 'grid' : 'flex'};
                            ${labelPaperSize === 'a4' ? 'grid-template-columns: repeat(4, 1fr);' : 'flex-direction: column;'}
                            width: ${labelPaperSize === 'a4' ? '210mm' : '50mm'};
                            margin: 0 auto;
                        }

                        .label-card { 
                            width: 50mm; 
                            height: 30mm; 
                            border: ${useCutLines ? '0.1mm dashed #ccc' : 'none'}; 
                            padding: 2mm;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            text-align: center;
                            page-break-inside: avoid;
                            box-sizing: border-box;
                            overflow: hidden;
                            background: white;
                        }

                        .store-name { font-size: 7px; font-weight: 900; color: #475569; margin-bottom: 2px; text-transform: uppercase; white-space: nowrap; }
                        .product-name { font-size: 9px; font-weight: 800; margin-bottom: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.1; color: #000; }
                        .price { font-size: 11px; font-weight: 900; color: #000; margin-bottom: 3px; }
                        
                        .barcode { 
                            font-family: 'Libre Barcode 39', cursive; 
                            font-size: 38px; 
                            margin: 0; 
                            line-height: 1; 
                            color: black;
                            margin-top: -2px;
                        }
                        .qrcode { width: 14mm; height: 14mm; margin: 1px 0; }
                        .qrcode img { width: 100%; height: 100%; }
                        
                        .sku { font-size: 7px; font-weight: bold; color: #64748b; margin-top: 1px; letter-spacing: 0.5px; }

                        @media print {
                            @page { 
                                size: ${labelPaperSize === 'a4' ? 'A4' : '50mm 30mm'}; 
                                margin: 0; 
                            }
                            body { margin: 0; }
                            .print-container { width: auto; margin: 0; }
                            .label-card { border: ${useCutLines ? '0.05mm solid #eee' : 'none'}; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        ${labelsHtml}
                    </div>
                    <script>
                        window.onload = () => {
                            // Wait for fonts to load
                            setTimeout(() => {
                                window.focus();
                                window.print();
                                // Close window after print dialog is closed
                                window.onafterprint = () => window.close();
                                // Fallback for browsers that don't support onafterprint
                                setTimeout(() => { if (!window.closed) window.close(); }, 3000);
                            }, 800);
                        };
                    </script>
                </body>
            </html>
        `);
        windowPrint.document.close();
    };

    const handlePrintDeliveryNote = () => {
        if (selectedItems.length === 0) return Swal.fire('Perhatian', 'Pilih minimal satu barang untuk dicetak', 'warning');
        
        Swal.fire({
            title: 'Nama Sales / Penerima',
            input: 'text',
            inputPlaceholder: 'Masukkan nama sales yang membawa barang...',
            showCancelButton: true,
            confirmButtonText: 'Lanjut Cetak',
            cancelButtonText: 'Batal',
            customClass: {
                confirmButton: 'bg-blue-600 text-white font-bold py-3 px-6 rounded-xl',
                cancelButton: 'bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl ml-3'
            },
            buttonsStyling: false
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                setSalesName(result.value);
                setShowPrintModal(true);
            } else if (result.isConfirmed && !result.value) {
                Swal.fire('Error', 'Nama sales wajib diisi', 'error');
            }
        });
    };


    const doPrint = () => {
        const content = printRef.current;
        const win = window.open('', '', 'width=900,height=1100');
        win.document.write('<html><head><title>Surat Jalan Inventaris</title>');
        win.document.write('<style>');
        win.document.write(`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
            .meta { font-size: 12px; font-weight: 600; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; font-weight: 900; }
            td { border: 1px solid #e2e8f0; padding: 12px; font-size: 12px; font-weight: 600; }
            .footer { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-top: 60px; }
            .sign-box { border-top: 1px solid #000; padding-top: 10px; text-align: center; font-size: 12px; font-weight: 700; height: 80px; display: flex; flex-direction: column; justify-content: space-between; }
            .brand { font-size: 18px; font-weight: 900; color: #2563eb; }
        `);
        win.document.write('</style></head><body>');
        win.document.write(content.innerHTML);
        win.document.write('</body></html>');
        win.document.close();
        setTimeout(() => {
            win.focus();
            win.print();
            win.close();
        }, 500);
    };

    const handleDelete = async (p) => {
        const result = await Swal.fire({
            title: 'Hapus Barang ATK?',
            html: `Anda yakin ingin menghapus <b>${p.name}</b>?<br/>Data tidak dapat dikembalikan.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
            customClass: {
                confirmButton: 'bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl ml-3',
                cancelButton: 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl',
                popup: 'dark:bg-slate-800 dark:text-white rounded-3xl',
                title: 'text-slate-800 dark:text-white font-black',
                htmlContainer: 'text-slate-600 dark:text-slate-300'
            },
            buttonsStyling: false,
            background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/products/${p.id}`);
                Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Barang berhasil dihapus.', timer: 1500, showConfirmButton: false });
                reload();
            } catch {
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus produk.' });
            }
        }
    };

    const getCatName = (catId) => { const c = categories.find(c => c.id === catId); return c ? c.name : '-'; };
    const getCatIcon = (catId) => CAT_ICONS[catId] || <FiBox size={18} />;
    const getCatIconSmall = (catId) => CAT_ICON_SMALL[catId] || <FiBox size={12} />;

    return (
        <div className="p-4 sm:p-8 space-y-8 font-display bg-slate-50/30 dark:bg-transparent min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100 dark:shadow-none"><FiPackage /></span>
                        Data Barang ATK
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-1 italic opacity-75">Retail Stationery & Products Management</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={handlePrintDeliveryNote}
                        disabled={selectedItems.length === 0}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiPrinter /> Cetak Surat Jalan
                    </button>
                    <input
                        type="file"
                        id="excel-import-input"
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleImportExcel}
                    />
                    <button
                        onClick={() => document.getElementById('excel-import-input').click()}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm active:scale-95"
                    >
                        <FiUpload /> Impor Excel
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                const res = await api.post('/settings/telegram-report', { type: 'stock' });
                                if (res.data.success) {
                                    Swal.fire({ icon: 'success', title: 'Terkirim!', text: 'Laporan Stok Rendah berhasil dikirim ke Telegram.', timer: 1500, showConfirmButton: false });
                                }
                            } catch (err) {
                                Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || err.message });
                            }
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-sky-500/20 active:scale-95 group"
                    >
                        <FiSend className="group-hover:translate-x-0.5 transition-transform" /> Telegram Stok
                    </button>
                    <button
                        onClick={openAdd}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        <FiPlus /> Tambah ATK
                    </button>
                </div>
            </div>


            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Produk', value: products.length, icon: <FiBox />, color: 'blue', sub: 'Active Inventory' },
                    { label: 'Kategori', value: catCount, icon: <FiLayers />, color: 'indigo', sub: 'Product Groups' },
                    { label: 'Stok Menipis', value: lowStockCount, icon: <FiAlertTriangle />, color: lowStockCount > 0 ? 'rose' : 'slate', sub: 'Need Restock' },
                    { label: 'Total Nilai Produk', value: formatRupiah(totalValue), icon: <FiDollarSign />, color: 'emerald', sub: 'Total Asset Value' },
                ].map((s, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${s.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                                s.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' :
                                    s.color === 'rose' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' :
                                        s.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                                            'bg-slate-50 dark:bg-slate-800 text-slate-400'
                                }`}>
                                {s.icon}
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.sub}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-75">{s.label}</p>
                        <h4 className={`text-2xl font-black tracking-tighter italic ${s.color === 'rose' ? 'text-rose-600' : 'text-slate-900 dark:text-white'
                            }`}>
                            {typeof s.value === 'number' ? String(s.value).padStart(2, '0') : s.value}
                        </h4>
                    </div>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Filter Bar */}
                <div className="p-4 sm:p-5 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 overflow-x-auto hide-scrollbar">
                    {/* Search Field */}
                    <div className="relative shrink-0 group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                            <FiSearch size={18} />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                            className={`bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none ${search ? 'w-48 sm:w-64' : 'w-[46px] focus:w-48 sm:focus:w-64 cursor-pointer focus:cursor-text placeholder:text-transparent focus:placeholder:text-slate-400'}`}
                            placeholder="Cari..."
                        />
                    </div>

                    <button
                        className={`shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center ${filterCat === 'all' ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:border-slate-300 hover:text-slate-700'}`}
                        onClick={() => handleFilter('all')}
                    >
                        Semua
                    </button>
                    {categories.map(c => (
                        <button
                            key={c.id}
                            className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterCat === c.id ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:border-slate-300 hover:text-slate-700'}`}
                            onClick={() => handleFilter(c.id)}
                        >
                            <span className={filterCat === c.id ? 'text-white' : 'text-slate-400'}>{getCatIconSmall(c.id)}</span>
                            {c.name}
                        </button>
                    ))}
                </div>

                {/* Table Area */}
                <div className="overflow-auto">
                    {filtered.length === 0 ? (
                        <div className="py-24 text-center">
                            <FiBox size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-800" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">{search ? 'Hasil pencarian tidak ditemukan' : 'Belum ada barang ATK'}</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="text-left bg-slate-50/50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 w-12">
                                        <input 
                                            type="checkbox" 
                                            onChange={handleSelectAll}
                                            checked={selectedItems.length === paginated.length && paginated.length > 0}
                                            className="accent-blue-600 size-4 rounded-md"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produk & Unit</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kode</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Harga Beli</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Harga Jual</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stok</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {paginated.map(p => {
                                    const isLow = p.stock <= (p.minStock || 0) && (p.minStock || 0) > 0;
                                    return (
                                        <tr key={p.id} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors ${selectedItems.includes(p.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedItems.includes(p.id)}
                                                    onChange={() => handleToggleSelect(p.id)}
                                                    className="accent-blue-600 size-4 rounded-md cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    {(p.image || storeSettings?.logo) ? (
                                                        <div className="size-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 bg-white">
                                                            <img
                                                                src={`http://${window.location.hostname}:5001${p.image || storeSettings.logo}`}
                                                                alt={p.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = '/logo-fallback.png'; 
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all shadow-sm shrink-0">
                                                            {getCatIcon(p.categoryId)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{p.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-75">{p.unit}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                                                    {p.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                    {getCatName(p.categoryId)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-bold text-slate-500 italic">
                                                {formatRupiah(p.buyPrice)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-xs font-black text-slate-900 dark:text-white italic tracking-tighter">
                                                    {formatRupiah(p.sellPrice)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`text-[11px] font-black uppercase tracking-tight flex items-center gap-1.5 ${isLow ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                                                        {isLow && <FiAlertTriangle className="animate-pulse" />}
                                                        {p.stock} <span className="text-[9px] font-bold text-slate-400">{p.unit}</span>
                                                    </span>
                                                    {p.minStock > 0 && <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Min: {p.minStock}</p>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1.5 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => onNavigate('stock-history', { product: p })}
                                                        title="History Stok"
                                                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all shadow-sm"
                                                    >
                                                        <FiClock size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handlePrintLabel(p)}
                                                        className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all shadow-sm"
                                                        title="Cetak Label Barcode"
                                                    >
                                                        <FiTag size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleReportDamaged(p)}
                                                        className="p-2.5 text-slate-400 hover:text-orange-600 hover:bg-white dark:hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all shadow-sm"
                                                        title="Laporkan Rusak"
                                                    >
                                                        <FiAlertTriangle size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setOpnameTarget(p)}
                                                        title="Stock Opname"
                                                        className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all shadow-sm"
                                                    >
                                                        <FiRefreshCw size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEdit(p)}
                                                        title="Edit Barang"
                                                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all shadow-sm"
                                                    >
                                                        <FiEdit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p)}
                                                        title="Hapus Barang"
                                                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all shadow-sm"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {filtered.length > PER_PAGE && (
                    <div className="p-6 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Displaying {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} products
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
                            >
                                <FiChevronLeft size={18} />
                            </button>
                            <span className="text-xs font-black min-w-[3rem] text-center dark:text-white">
                                {page} <span className="text-slate-400">/</span> {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
                            >
                                <FiChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCancel}
                title={editItem ? 'Koreksi Data Barang' : 'Barang ATK Baru'}
                icon={editItem ? <FiEdit className="text-blue-600" /> : <FiPlus className="text-emerald-600" />}
                footer={
                    <div className="flex gap-4 w-full">
                        <button className="flex-1 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300 active:scale-95 shadow-sm" onClick={handleCancel}>
                            <FiX className="inline mr-2" /> Batal
                        </button>
                        <button className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center" onClick={handleSave}>
                            <FiSave className="mr-2" /> Simpan Barang ATK
                        </button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex gap-4 items-center">
                        <div className="size-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                            <FiInfo />
                        </div>
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase leading-relaxed tracking-wide">Lengkapi data produk dengan benar untuk akurasi laporan stok dan keuangan.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Produk *</label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400/50"
                                placeholder="Contoh: Kertas HVS A4 80gr"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kode Produk</label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400/50 font-mono"
                                placeholder="Otomatis"
                                value={form.code}
                                onChange={e => set('code', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Satuan Unit</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                value={form.unit}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'NEW') {
                                        setPromptModal({ isOpen: true, type: 'unit', title: 'Tambah Satuan Unit Baru', value: '' });
                                        set('unit', '');
                                    } else {
                                        set('unit', val);
                                    }
                                }}
                            >
                                {unitOptions.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                                <option value="NEW" className="font-bold text-blue-600">+ Tambah Baru</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                value={form.categoryId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'NEW') {
                                        setPromptModal({ isOpen: true, type: 'categoryId', title: 'Tambah Kategori Baru', value: '' });
                                        set('categoryId', '');
                                    } else {
                                        set('categoryId', val);
                                    }
                                }}
                            >
                                <option value="">-- PILIH KATEGORI --</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                                <option value="NEW" className="font-bold text-blue-600">+ Tambah Baru</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stok Awal</label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                type="number"
                                value={form.stock}
                                onChange={e => set('stock', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga Beli</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 italic">Rp</span>
                                <input
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 pl-10 pr-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    type="number"
                                    value={form.buyPrice}
                                    onChange={e => set('buyPrice', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga Jual</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 italic">Rp</span>
                                <input
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 pl-10 pr-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    type="number"
                                    value={form.sellPrice}
                                    onChange={e => set('sellPrice', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Batas Stok Minimum</label>
                            <input
                                className="w-full bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/50 rounded-2xl py-3.5 px-4 text-xs font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-indigo-600 placeholder:text-indigo-400/50"
                                type="number"
                                value={form.minStock}
                                onChange={e => set('minStock', e.target.value)}
                                placeholder="Alert stock level..."
                            />
                        </div>

                        <div className="md:col-span-2 space-y-1.5 mt-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto Produk (Opsional)</label>
                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4">
                                {form.image && (typeof form.image === 'string' || form.image instanceof File) ? (
                                    <div className="size-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center">
                                        <img
                                            src={form.image instanceof File ? URL.createObjectURL(form.image) : `http://${window.location.hostname}:5001${form.image}`}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.className = 'hidden'; }}
                                        />
                                    </div>
                                ) : (
                                    <div className="size-16 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex flex-col items-center justify-center shrink-0 border border-dashed border-slate-300 dark:border-slate-700">
                                        <FiImage size={24} />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="atk-image-upload"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                set('image', e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="atk-image-upload"
                                        className="inline-flex cursor-pointer px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
                                    >
                                        Pilih Gambar
                                    </label>
                                    <p className="text-[9px] text-slate-400 font-medium mt-1.5 ml-1">Format: JPG, PNG. Maksimal 5MB.</p>
                                </div>
                                {form.image && (
                                    <button
                                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                        onClick={() => set('image', '')}
                                        title="Hapus gambar"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>



            {/* Prompt Modal */}
            <Modal
                isOpen={promptModal.isOpen}
                onClose={() => setPromptModal({ ...promptModal, isOpen: false })}
                title={promptModal.title}
                footer={
                    <div className="flex justify-end gap-3 w-full border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-2">
                        <button className="px-5 py-3 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95" onClick={() => setPromptModal({ ...promptModal, isOpen: false })}>Batal</button>
                        <button id="save-prompt-btn-inv" className="px-6 py-3 rounded-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2" onClick={async () => {
                            const clean = promptModal.value.trim();
                            if (clean) {
                                if (promptModal.type === 'unit') {
                                    if (!unitOptions.includes(clean)) {
                                        const newUnits = [...unitOptions, clean];
                                        setUnitOptions(newUnits);
                                        localStorage.setItem('custom_units', JSON.stringify(newUnits));
                                    }
                                    set('unit', clean);
                                } else if (promptModal.type === 'categoryId') {
                                    try {
                                        const res = await api.post('/products/categories', { name: clean });
                                        const newRecord = { id: res.data.id, name: clean };
                                        setCategories([...categories, newRecord]);
                                        set('categoryId', newRecord.id);
                                    } catch { Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menambah kategori', timer: 3000 }); }
                                }
                            }
                            setPromptModal({ ...promptModal, isOpen: false });
                        }}>
                            <FiCheck size={18} /> Simpan Data
                        </button>
                    </div>
                }
            >
                <div className="p-5 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/60 mb-2 mt-2">
                    <div className="w-16 h-16 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white dark:ring-slate-800 relative z-10">
                        {promptModal.type === 'unit' ? <FiTag size={28} /> : <FiLayers size={28} />}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-center mb-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama {promptModal.type === 'unit' ? 'Satuan' : 'Kategori'}</label>
                        </div>
                        <div className="relative group flex items-center">
                            <div className="absolute left-4 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                                {promptModal.type === 'unit' ? <FiTag size={18} /> : <FiLayers size={18} />}
                            </div>
                            <input
                                type="text"
                                className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold dark:text-white transition-all text-center sm:text-left shadow-sm"
                                placeholder={`Ketik ${promptModal.type === 'unit' ? 'satuan' : 'kategori'} baru...`}
                                value={promptModal.value}
                                onChange={e => setPromptModal({ ...promptModal, value: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') { document.getElementById('save-prompt-btn-inv')?.click(); } }}
                                autoFocus
                            />
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400 text-center mt-3 pt-2 flex items-center justify-center gap-1.5 opacity-80">
                            <FiAlertCircle size={12} /> Tekan <kbd className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-600 dark:text-slate-300">Enter</kbd> untuk menyimpan
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Stock Opname Modal */}
            <StockOpnameModal
                isOpen={!!opnameTarget}
                onClose={() => setOpnameTarget(null)}
                product={opnameTarget}
                onSuccess={reload}
            />
            {/* Floating Action Bar for Selections */}
            <AnimatePresence>
                {selectedItems.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-10 border border-white/10 backdrop-blur-xl"
                    >
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terpilih</span>
                            <span className="text-xl font-black">{selectedItems.length} <span className="text-sm font-bold opacity-60 text-slate-400">Item</span></span>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setSelectedItems([])}
                                className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors font-bold text-xs"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={() => {
                                    const initialQtys = {};
                                    selectedItems.forEach(id => { initialQtys[id] = 1; });
                                    setSelectedQuantities(initialQtys);
                                    setSelectedLabelItem(null); // Clear single item mode
                                    setShowLabelModal(true);
                                }}
                                className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 flex items-center gap-2"
                            >
                                <FiTag size={16} /> Cetak Label Barcode
                            </button>
                            <button 
                                onClick={handlePrintDeliveryNote}
                                className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-2"
                            >
                                <FiPrinter size={16} /> Cetak Surat Jalan Sales
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden Print Content */}
            <div style={{ display: 'none' }}>
                <div ref={printRef}>
                    <div className="header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {storeSettings?.logo && (
                                <img 
                                    src={`http://${window.location.hostname}:5001${storeSettings.logo}`} 
                                    style={{ height: '50px', width: '50px', objectFit: 'contain' }}
                                    alt="Logo"
                                />
                            )}
                            <div>
                                <div className="brand" style={{ color: '#2563eb' }}>{storeSettings?.name || 'ABAD JAYA COPIER'}</div>
                                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontWeight: 'bold', maxWidth: '250px' }}>
                                    {storeSettings?.address || 'PUSAT PERCETAKAN & ATK'}<br/>
                                    WA: {storeSettings?.phone || '-'}
                                </div>
                            </div>
                        </div>
                        <div className="title">Surat Jalan<br/>Inventaris</div>
                        <div className="meta">
                            <div>NO: SJ-{new Date().getTime().toString().slice(-6)}</div>
                            <div>TGL: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px', fontSize: '12px' }}>
                        Telah diserahkan barang inventaris berikut kepada: <strong>{salesName}</strong> (Sales) untuk keperluan distribusi/penjualan.
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>No</th>
                                <th>Nama Barang</th>
                                <th style={{ width: '100px' }}>Jumlah</th>
                                <th style={{ width: '100px' }}>Satuan</th>
                                <th>Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.filter(p => selectedItems.includes(p.id)).map((p, i) => (
                                <tr key={p.id}>
                                    <td>{i + 1}</td>
                                    <td>{p.name}</td>
                                    <td style={{ fontWeight: '900', fontSize: '14px' }}>{selectedQuantities[p.id] || 0}</td>
                                    <td>{p.unit}</td>
                                    <td></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="footer">
                        <div className="sign-box">
                            <div>Diserahkan Oleh,</div>
                            <div>( .................................. )</div>
                        </div>
                        <div className="sign-box">
                            <div>Diterima Oleh (Sales),</div>
                            <div>( <strong>{salesName}</strong> )</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '40px', fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                        * Barang yang sudah diterima menjadi tanggung jawab sales sepenuhnya. Harap lapor jika ada ketidaksesuaian stok.
                    </div>
                </div>
            </div>

            {/* Hidden Label Content */}
            <div style={{ display: 'none' }}>
                <div ref={labelPrintRef}>
                    <div className="store-name">{storeSettings?.name}</div>
                    <div className="product-name">{selectedLabelItem?.name}</div>
                    <div className="price">{formatRupiah(selectedLabelItem?.sellPrice)}</div>
                    <div className="barcode">*{selectedLabelItem?.sku || selectedLabelItem?.id?.toString().slice(-6)}*</div>
                    <div className="sku">{selectedLabelItem?.sku || selectedLabelItem?.id?.toString().slice(-6)}</div>
                </div>
            </div>

            {/* Label Print Modal */}
            <AnimatePresence>
                {showLabelModal && (
                    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter italic">Konfigurasi Label Produk</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pengaturan layout & jumlah cetak</p>
                                </div>
                                <button onClick={() => setShowLabelModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                    <FiX size={20} className="text-slate-400" />
                                </button>
                            </div>
                            
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Side: Configuration */}
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipe Kertas</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => setLabelPaperSize('thermal')}
                                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${labelPaperSize === 'thermal' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                                            >
                                                <FiPrinter size={20} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Thermal Stiker</span>
                                            </button>
                                            <button 
                                                onClick={() => setLabelPaperSize('a4')}
                                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${labelPaperSize === 'a4' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                                            >
                                                <FiFileText size={20} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Kertas A4</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipe Kode</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => setLabelType('barcode')}
                                                className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${labelType === 'barcode' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest">Barcode</span>
                                            </button>
                                            <button 
                                                onClick={() => setLabelType('qrcode')}
                                                className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${labelType === 'qrcode' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest">QR Code</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-700/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${useCutLines ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'} transition-colors`}>
                                                <FiEdit size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Garis Potong</span>
                                                <span className="text-[9px] font-bold text-slate-500">Tampilkan batas stiker</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setUseCutLines(!useCutLines)}
                                            className={`w-10 h-5 rounded-full relative transition-all ${useCutLines ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${useCutLines ? 'left-5.5' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Right Side: Item List & Qty */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daftar Barang & Jumlah</label>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
                                        <div className="max-h-[250px] overflow-auto p-4 space-y-3 custom-scrollbar">
                                            {selectedLabelItem ? (
                                                <div className="flex items-center justify-between gap-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-black text-slate-900 dark:text-white truncate uppercase">{selectedLabelItem.name}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold">{selectedLabelItem.code || 'NO CODE'}</p>
                                                    </div>
                                                    <input 
                                                        type="number"
                                                        value={labelQty}
                                                        onChange={(e) => setLabelQty(Math.max(1, parseInt(e.target.value) || 1))}
                                                        className="w-14 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-center font-black text-xs py-2"
                                                    />
                                                </div>
                                            ) : (
                                                products.filter(p => selectedItems.includes(p.id)).map(p => (
                                                    <div key={p.id} className="flex items-center justify-between gap-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-black text-slate-900 dark:text-white truncate uppercase">{p.name}</p>
                                                            <p className="text-[9px] text-slate-400 font-bold">{p.code || 'NO CODE'}</p>
                                                        </div>
                                                        <input 
                                                            type="number"
                                                            value={selectedQuantities[p.id] || 1}
                                                            onChange={(e) => setSelectedQuantities(prev => ({ ...prev, [p.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                                                            className="w-14 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-center font-black text-xs py-2"
                                                        />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800/50 flex gap-3 items-start">
                                        <FiInfo className="text-amber-600 mt-0.5 shrink-0" size={14} />
                                        <p className="text-[9px] text-amber-700 dark:text-amber-400 font-bold leading-relaxed uppercase italic">
                                            {labelPaperSize === 'thermal' 
                                                ? 'Pastikan printer thermal sudah terpasang kertas stiker ukuran 50x30mm.' 
                                                : 'Gunakan kertas stiker A4. Layout akan disusun otomatis dalam 4 kolom.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                                <button 
                                    onClick={() => setShowLabelModal(false)}
                                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={doPrintLabel}
                                    className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    <FiPrinter size={16} className="inline mr-2" /> Mulai Cetak Label
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Print Modal for Confirmation */}
            <AnimatePresence>
                {showPrintModal && (
                    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-xl font-black dark:text-white">Siap Cetak Surat Jalan?</h3>
                                <p className="text-sm text-slate-500 mt-1">Daftar barang akan diserahkan kepada <strong>{salesName}</strong>.</p>
                            </div>
                            <div className="p-8">
                                <div className="space-y-3 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
                                    {products.filter(p => selectedItems.includes(p.id)).map(p => (
                                        <div key={p.id} className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black dark:text-slate-200 uppercase tracking-tight">{p.name}</span>
                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md uppercase">{p.unit}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jumlah Dibawa:</span>
                                                <input 
                                                    type="number"
                                                    value={selectedQuantities[p.id] || ''}
                                                    onChange={(e) => setSelectedQuantities(prev => ({ ...prev, [p.id]: e.target.value }))}
                                                    placeholder="0"
                                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                                <button 
                                    onClick={() => setShowPrintModal(false)}
                                    className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={() => {
                                        doPrint();
                                        setShowPrintModal(false);
                                    }}
                                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20"
                                >
                                    Konfirmasi & Cetak
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
