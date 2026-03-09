// ============================================
// SEED DATA — POS FOTOCOPY ABADI JAYA
// ============================================
import db from './db';

const seedData = () => {
    // Don't re-seed if data already exists
    if (db.count('products') > 0) return;

    // ---- Users ----
    db.setAll('users', [
        { id: 'u1', name: 'Admin', username: 'admin', password: 'admin123', role: 'admin', isActive: true },
        { id: 'u2', name: 'Kasir 1', username: 'kasir', password: 'kasir123', role: 'kasir', isActive: true },
        { id: 'u3', name: 'Operator Cetak', username: 'operator', password: 'operator123', role: 'operator', isActive: true },
        { id: 'u4', name: 'Teknisi Andi', username: 'teknisi', password: 'teknisi123', role: 'teknisi', isActive: true },
    ]);

    // ---- Categories ----
    db.setAll('categories', [
        { id: 'c1', name: 'Pulpen & Pensil', type: 'atk', emoji: '🖊️' },
        { id: 'c2', name: 'Buku & Kertas', type: 'atk', emoji: '📓' },
        { id: 'c3', name: 'Map & Amplop', type: 'atk', emoji: '📁' },
        { id: 'c4', name: 'Stapler & Perlengkapan', type: 'atk', emoji: '📎' },
        { id: 'c5', name: 'Lem & Selotip', type: 'atk', emoji: '🧴' },
        { id: 'c6', name: 'Kertas Fotocopy', type: 'fotocopy_supply', emoji: '📄' },
        { id: 'c7', name: 'Toner & Tinta', type: 'fotocopy_supply', emoji: '🖨️' },
        { id: 'c8', name: 'Supplies Percetakan', type: 'percetakan_supply', emoji: '🎨' },
        { id: 'c9', name: 'Sparepart Mesin', type: 'sparepart', emoji: '🔧' },
    ]);

    // ---- Products (ATK) ----
    db.setAll('products', [
        { id: 'p1', code: 'ATK-001', name: 'Pulpen Pilot BP-1RT', categoryId: 'c1', buyPrice: 3500, sellPrice: 5000, stock: 50, minStock: 10, unit: 'pcs', emoji: '🖊️', image: '' },
        { id: 'p2', code: 'ATK-002', name: 'Pulpen Snowman V5', categoryId: 'c1', buyPrice: 6000, sellPrice: 8500, stock: 35, minStock: 10, unit: 'pcs', emoji: '🖊️', image: '' },
        { id: 'p3', code: 'ATK-003', name: 'Pensil 2B Faber Castell', categoryId: 'c1', buyPrice: 2500, sellPrice: 4000, stock: 40, minStock: 10, unit: 'pcs', emoji: '✏️', image: '' },
        { id: 'p4', code: 'ATK-004', name: 'Buku Tulis 58 lembar', categoryId: 'c2', buyPrice: 3000, sellPrice: 4500, stock: 30, minStock: 10, unit: 'pcs', emoji: '📓', image: '' },
        { id: 'p5', code: 'ATK-005', name: 'Buku Gambar A3', categoryId: 'c2', buyPrice: 5000, sellPrice: 7500, stock: 20, minStock: 5, unit: 'pcs', emoji: '🎨', image: '' },
        { id: 'p6', code: 'ATK-006', name: 'Kertas HVS A4 70gsm (Rim)', categoryId: 'c6', buyPrice: 38000, sellPrice: 55000, stock: 15, minStock: 5, unit: 'rim', emoji: '📄', image: '' },
        { id: 'p7', code: 'ATK-007', name: 'Kertas HVS F4 70gsm (Rim)', categoryId: 'c6', buyPrice: 42000, sellPrice: 60000, stock: 12, minStock: 5, unit: 'rim', emoji: '📄', image: '' },
        { id: 'p8', code: 'ATK-008', name: 'Kertas HVS A3 (Rim)', categoryId: 'c6', buyPrice: 75000, sellPrice: 95000, stock: 8, minStock: 3, unit: 'rim', emoji: '📄', image: '' },
        { id: 'p9', code: 'ATK-009', name: 'Map Plastik Kancing F4', categoryId: 'c3', buyPrice: 2000, sellPrice: 3500, stock: 60, minStock: 15, unit: 'pcs', emoji: '📁', image: '' },
        { id: 'p10', code: 'ATK-010', name: 'Amplop Coklat Besar', categoryId: 'c3', buyPrice: 500, sellPrice: 1000, stock: 200, minStock: 50, unit: 'pcs', emoji: '✉️', image: '' },
        { id: 'p11', code: 'ATK-011', name: 'Amplop Putih Kecil', categoryId: 'c3', buyPrice: 300, sellPrice: 500, stock: 150, minStock: 50, unit: 'pcs', emoji: '✉️', image: '' },
        { id: 'p12', code: 'ATK-012', name: 'Stapler HD-10', categoryId: 'c4', buyPrice: 15000, sellPrice: 22000, stock: 8, minStock: 3, unit: 'pcs', emoji: '📎', image: '' },
        { id: 'p13', code: 'ATK-013', name: 'Isi Staples No. 10', categoryId: 'c4', buyPrice: 3000, sellPrice: 5000, stock: 25, minStock: 10, unit: 'box', emoji: '📎', image: '' },
        { id: 'p14', code: 'ATK-014', name: 'Lem Kertas UHU 8g', categoryId: 'c5', buyPrice: 4000, sellPrice: 6500, stock: 18, minStock: 5, unit: 'pcs', emoji: '🧴', image: '' },
        { id: 'p15', code: 'ATK-015', name: 'Selotip Bening 1/2 inch', categoryId: 'c5', buyPrice: 3000, sellPrice: 5000, stock: 20, minStock: 5, unit: 'roll', emoji: '📦', image: '' },
        { id: 'p16', code: 'ATK-016', name: 'Penggaris 30cm', categoryId: 'c4', buyPrice: 2000, sellPrice: 3500, stock: 15, minStock: 5, unit: 'pcs', emoji: '📏', image: '' },
        { id: 'p17', code: 'ATK-017', name: 'Penghapus Faber Castell', categoryId: 'c4', buyPrice: 2000, sellPrice: 3500, stock: 25, minStock: 10, unit: 'pcs', emoji: '🧽', image: '' },
        { id: 'p18', code: 'ATK-018', name: 'Spidol Snowman Board Marker', categoryId: 'c1', buyPrice: 6000, sellPrice: 9000, stock: 12, minStock: 5, unit: 'pcs', emoji: '🖍️', image: '' },
        { id: 'p19', code: 'ATK-019', name: 'Tip-ex Correction Tape', categoryId: 'c4', buyPrice: 5000, sellPrice: 7500, stock: 14, minStock: 5, unit: 'pcs', emoji: '📝', image: '' },
        { id: 'p20', code: 'ATK-020', name: 'Toner Canon NPG-68', categoryId: 'c7', buyPrice: 85000, sellPrice: 120000, stock: 6, minStock: 2, unit: 'pcs', emoji: '🖨️', image: '' },
    ]);

    // ---- Fotocopy Prices ----
    db.setAll('fotocopy_prices', [
        { id: 'fc1', paper: 'HVS A4', color: 'bw', side: '1', price: 200, label: 'HVS A4 - B/W - 1 Sisi' },
        { id: 'fc2', paper: 'HVS A4', color: 'bw', side: '2', price: 350, label: 'HVS A4 - B/W - Bolak-balik' },
        { id: 'fc3', paper: 'HVS F4', color: 'bw', side: '1', price: 250, label: 'HVS F4 - B/W - 1 Sisi' },
        { id: 'fc4', paper: 'HVS F4', color: 'bw', side: '2', price: 400, label: 'HVS F4 - B/W - Bolak-balik' },
        { id: 'fc5', paper: 'HVS A3', color: 'bw', side: '1', price: 500, label: 'HVS A3 - B/W - 1 Sisi' },
        { id: 'fc6', paper: 'HVS A3', color: 'bw', side: '2', price: 800, label: 'HVS A3 - B/W - Bolak-balik' },
        { id: 'fc7', paper: 'HVS A4', color: 'color', side: '1', price: 1500, label: 'HVS A4 - Warna - 1 Sisi' },
        { id: 'fc8', paper: 'HVS A4', color: 'color', side: '2', price: 2500, label: 'HVS A4 - Warna - Bolak-balik' },
        { id: 'fc9', paper: 'HVS F4', color: 'color', side: '1', price: 2000, label: 'HVS F4 - Warna - 1 Sisi' },
        { id: 'fc10', paper: 'HVS A3', color: 'color', side: '1', price: 3000, label: 'HVS A3 - Warna - 1 Sisi' },
    ]);

    // ---- Customers ----
    db.setAll('customers', [
        { id: 'cust1', name: 'Pak Ahmad', phone: '081234567890', address: 'Jl. Merdeka No. 5', type: 'corporate', company: 'Kantor Kecamatan', totalTrx: 45, totalSpend: 15500000, createdAt: '2024-01-01' },
        { id: 'cust2', name: 'Bu Sari', phone: '082345678901', address: 'Jl. Pahlawan No. 12', type: 'vip', company: '', totalTrx: 32, totalSpend: 8200000, createdAt: '2024-02-15' },
        { id: 'cust3', name: 'CV Maju Bersama', phone: '083456789012', address: 'Jl. Sudirman No. 20', type: 'corporate', company: 'CV Maju Bersama', totalTrx: 28, totalSpend: 12000000, createdAt: '2024-03-01' },
        { id: 'cust4', name: 'Pak Budi', phone: '084567890123', address: 'Jl. Diponegoro No. 8', type: 'walkin', company: '', totalTrx: 15, totalSpend: 3500000, createdAt: '2024-06-01' },
        { id: 'cust5', name: 'Bu Siti', phone: '085678901234', address: 'Jl. Kartini No. 3', type: 'service', company: '', totalTrx: 5, totalSpend: 5000000, createdAt: '2024-07-01' },
        { id: 'cust6', name: 'Dinas Pendidikan', phone: '086789012345', address: 'Jl. Pemerintahan No. 1', type: 'corporate', company: 'Dinas Pendidikan Kab.', totalTrx: 20, totalSpend: 25000000, createdAt: '2024-01-15' },
    ]);

    // ---- Sample Print Orders ----
    db.setAll('print_orders', [
        { id: 'po1', orderNo: 'ORD-2025-0001', customerId: 'cust1', customerName: 'Pak Ahmad', type: 'Undangan Pernikahan', description: 'Undangan lipat 3 warna merah maroon', specs: 'A5, Art Paper 260gsm, Laminasi Doff', qty: 500, unit: 'lembar', totalPrice: 1500000, dpAmount: 750000, remaining: 750000, shippingCost: 0, deadline: '2025-01-20', status: 'desain', notes: 'Warna dominan merah maroon', createdAt: '2025-01-15T08:00:00' },
        { id: 'po2', orderNo: 'ORD-2025-0002', customerId: 'cust2', customerName: 'Bu Sari', type: 'Spanduk', description: 'Spanduk promosi toko', specs: '3m x 1m, Flexi 280gsm', qty: 2, unit: 'pcs', totalPrice: 300000, dpAmount: 200000, remaining: 100000, shippingCost: 25000, deadline: '2025-01-18', status: 'cetak', notes: '', createdAt: '2025-01-14T10:00:00' },
        { id: 'po3', orderNo: 'ORD-2025-0003', customerId: 'cust3', customerName: 'CV Maju Bersama', type: 'Brosur', description: 'Brosur produk A5 2 sisi', specs: 'A5, Art Paper 150gsm, 2 Sisi', qty: 1000, unit: 'lembar', totalPrice: 800000, dpAmount: 800000, remaining: 0, shippingCost: 0, deadline: '2025-01-22', status: 'selesai', notes: '', createdAt: '2025-01-10T09:00:00' },
        { id: 'po4', orderNo: 'ORD-2025-0004', customerId: 'cust4', customerName: 'Pak Budi', type: 'Kartu Nama', description: 'Kartu nama 2 sisi', specs: '9x5.5cm, Art Carton 310gsm, Laminasi Glossy', qty: 200, unit: 'box', totalPrice: 150000, dpAmount: 0, remaining: 150000, shippingCost: 15000, deadline: '2025-01-17', status: 'pending', notes: 'Belum bayar DP', createdAt: '2025-01-16T14:00:00' },
    ]);

    // ---- Sample Service Orders ----
    db.setAll('service_orders', [
        { id: 'so1', serviceNo: 'SRV-2025-0001', customerId: 'cust5', customerName: 'Bu Siti', phone: '085678901234', machineInfo: 'Canon IR 2520', serialNo: 'XYZ123456', complaint: 'Paper jam, hasil bergaris', condition: 'Cukup baik, ada goresan', diagnosis: 'Roller aus, drum scratch', spareparts: [{ name: 'Roller Feed', qty: 2, price: 150000 }, { name: 'Drum Unit', qty: 1, price: 500000 }, { name: 'Toner Refill', qty: 1, price: 100000 }], laborCost: 250000, totalCost: 1000000, status: 'pengerjaan', technicianId: 'u4', warrantyEnd: '2025-04-15', createdAt: '2025-01-12T10:00:00' },
        { id: 'so2', serviceNo: 'SRV-2025-0002', customerId: 'cust6', customerName: 'Dinas Pendidikan', phone: '086789012345', machineInfo: 'Kyocera M2040dn', serialNo: 'ABC789012', complaint: 'Tidak bisa print, error kode C6000', condition: 'Baik', diagnosis: 'Board rusak', spareparts: [{ name: 'PCB Main Board', qty: 1, price: 800000 }], laborCost: 300000, totalCost: 1100000, status: 'approval', technicianId: 'u4', warrantyEnd: '', createdAt: '2025-01-14T11:00:00' },
    ]);

    // ---- Sample Transactions ----
    db.setAll('transactions', [
        { id: 't1', invoiceNo: 'TRX-202501-0001', date: '2025-01-15T09:30:00', customerId: 'cust1', customerName: 'Pak Ahmad', userId: 'u2', userName: 'Kasir 1', type: 'sale', subtotal: 92500, discount: 0, total: 92500, paid: 100000, change: 7500, paymentType: 'tunai', status: 'paid', items: [{ productId: 'p1', name: 'Pulpen Pilot BP-1RT', qty: 3, price: 5000, subtotal: 15000 }, { productId: 'p4', name: 'Buku Tulis 58 lembar', qty: 5, price: 4500, subtotal: 22500 }, { productId: 'p6', name: 'Kertas HVS A4 70gsm (Rim)', qty: 1, price: 55000, subtotal: 55000 }] },
        { id: 't2', invoiceNo: 'TRX-202501-0002', date: '2025-01-15T10:15:00', customerId: null, customerName: 'Umum', userId: 'u2', userName: 'Kasir 1', type: 'fotocopy', subtotal: 50000, discount: 12500, total: 37500, paid: 50000, change: 12500, paymentType: 'tunai', status: 'paid', items: [{ name: 'Fotocopy HVS A4 B/W 1 Sisi', qty: 250, price: 200, subtotal: 50000, discount: 12500 }] },
    ]);

    // ---- Initial Cash Flow ----
    db.setAll('cash_flow', [
        { id: 'cf1', date: '2025-01-15', type: 'in', category: 'Modal Awal', amount: 500000, description: 'Kas awal buka toko', referenceId: null, createdAt: '2025-01-15T07:00:00' },
        { id: 'cf2', date: '2025-01-15', type: 'in', category: 'Penjualan ATK', amount: 92500, description: 'TRX-202501-0001', referenceId: 't1', createdAt: '2025-01-15T09:30:00' },
        { id: 'cf3', date: '2025-01-15', type: 'in', category: 'Fotocopy', amount: 37500, description: 'TRX-202501-0002', referenceId: 't2', createdAt: '2025-01-15T10:15:00' },
        { id: 'cf4', date: '2025-01-15', type: 'out', category: 'Operasional', amount: 50000, description: 'Makan siang karyawan', referenceId: null, createdAt: '2025-01-15T12:00:00' },
    ]);

    // ---- Activity Log ----
    db.setAll('activity_log', []);

    // ---- Settings ----
    db.setAll('settings', [
        { id: 's1', key: 'store_name', value: 'FOTOCOPY ABADI JAYA' },
        { id: 's2', key: 'store_address', value: 'Jl. Contoh No. 123, Kota' },
        { id: 's3', key: 'store_phone', value: '021-12345678' },
        { id: 's4', key: 'receipt_footer', value: 'Terima kasih telah berbelanja!' },
        { id: 's5', key: 'printer_size', value: '80mm' },
        { id: 's6', key: 'theme', value: 'dark' },
    ]);

    console.log('✅ Seed data loaded successfully!');
};

export default seedData;
