# Aplikasi POS - FOTOCOPY ABADI JAYA

## Phase 1: Core Foundation & POS
- [ ] Project setup (file structure, design system, CSS variables)
- [ ] Login & Authentication (role-based: Admin, Kasir, Operator, Teknisi)
- [ ] Dashboard with summary cards & notifications
- [ ] Navigation / Sidebar system
- [ ] Master Produk & Kategori (CRUD)
- [ ] Transaksi Penjualan ATK (POS Kasir)
- [ ] Transaksi Fotocopy (calculator, volume discount)
- [x] Cetak struk / receipt (Thermal & Dot-Matrix)

## Phase 2: Order Management
- [ ] Order Percetakan + Status Tracking (Kanban) + Biaya Ongkir
- [ ] Order Service Mesin + Status Tracking
- [ ] Manajemen DP & Pelunasan
- [ ] Database Pelanggan (CRUD + riwayat)

## Phase 3: Keuangan & Laporan
- [ ] Kas Masuk & Keluar
- [ ] Piutang tracking
- [ ] Laporan Penjualan (harian/mingguan/bulanan)
- [x] Fix Theme Inconsistency
  - [x] Update `index.css` global table-to-card selector
  - [x] Audit `Layout.jsx` for theme-aware classes
- [x] Fix Bluetooth Printing Support
  - [x] Update `utils.js` error message with secure context explanation
  - [x] Add fallback/instruction for mobile dev testing (HTTPS)
  - [x] Reconstruct ESC/POS encoder with raw-byte padding for stable centering
  - [x] Synchronize thermal layout with ProMax PDF design
- [x] Fix Data Master Loading
  - [x] Reconcile materials table schema (local & docker)
- [x] Fix UI Interaction
  - [x] Restore SweetAlert cancel button visibility via Tailwind classes
- [x] Final Verification
  - [x] Verify Light/Dark mode consistency on mobile
  - [x] Verify Bluetooth error messaging on mobile
  - [x] Verify ProMax printer layout on physical hardware
- [ ] Build for production 
- [ ] Laporan Stok & Inventory
- [ ] Dashboard Analytics (charts)
- [ ] Export PDF
- [ ] Stok Opname
- [ ] Supplier Management
- [ ] Settings & User Management
- [ ] Log Aktivitas (riwayat aksi user)

## Phase 4: Enhancement
- [x] Integrasi QZ Tray (LX-310 Dot-Matrix)
- [x] Pengaturan Printer (thermal 58mm/80mm)
- [x] Template Nota/Struk/Invoice (ProMax PDF & Raw)
- [x] WhatsApp Gateway (Bagikan via wa.me)
- [ ] Backup & Restore data
- [ ] Theme toggle (Light/Dark/System)
