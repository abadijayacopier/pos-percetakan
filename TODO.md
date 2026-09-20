# TODO — POS Percetakan Abadi Jaya

> Status dokumen: **dirapikan & disinkronkan dengan kode yang sudah dicek**
>
> Fokus saat ini: **perbaikan responsive POS dan verifikasi akhir**.

## A. Responsive POS

### 1. CSS Global
- [x] Media query desktop / ultra-wide
- [x] Perbaikan spacing dan shadow product grid
- [x] Perbaikan skala font

### 2. PosPage.jsx
- [x] Product grid responsive
- [x] Cart panel fluid width
- [x] Form Fotocopy responsive

### 3. ProductExplorer.jsx
- [x] Grid responsive dasar: 2 / md:3 / lg:4 / xl:5 / 2xl:6
- [x] Card minimum height dan tinggi visual seragam
- [ ] Evaluasi tambahan kolom untuk desktop sangat lebar (7 kolom jika layout tetap nyaman)

### 4. CartPanel.jsx
- [x] Lebar panel hingga xl:max-w-[500px]
- [x] Area list menggunakan min-h-0 / overflow-y-auto
- [x] Truncation nama produk dan min-w-0 agar teks tidak meluber

### 5. CashierPaymentPage.jsx
- [x] Stats responsive
- [x] Tabel overflow-x-auto
- [x] Minimum width untuk tampilan desktop

### 6. PosHeader.jsx
- [ ] Evaluasi perubahan breakpoint navigasi dari xl:flex menjadi lg:flex
- [ ] Pastikan header tidak bertabrakan pada resolusi sekitar 1024px sebelum perubahan breakpoint

### 7. Testing Responsive
- [ ] Jalankan client dengan npm run dev
- [ ] Test desktop 1440px+
- [ ] Test desktop ultra-wide
- [ ] Test resize browser
- [ ] Test F12 / device emulation
- [ ] Verifikasi header, product grid, cart panel, dan payment page

---

## B. Fitur Aplikasi yang Masih Belum Selesai

### Phase 1 — Core Foundation & POS
- [ ] Project setup / design system final
- [ ] Login & Authentication berbasis role: Admin, Kasir, Operator, Teknisi
- [ ] Dashboard summary cards & notifications
- [ ] Navigation / Sidebar system
- [ ] Master Produk & Kategori CRUD
- [ ] Transaksi Penjualan ATK
- [ ] Transaksi Fotocopy dengan calculator & volume discount
- [x] Cetak struk Thermal & Dot-Matrix

### Phase 2 — Order Management
- [ ] Order Percetakan + status tracking / Kanban
- [ ] Biaya ongkir pada order percetakan
- [ ] Order Service Mesin + status tracking
- [ ] Manajemen DP & Pelunasan
- [ ] Database Pelanggan CRUD + riwayat

### Phase 3 — Keuangan, Inventory & Laporan
- [ ] Kas Masuk & Kas Keluar
- [ ] Piutang tracking
- [ ] Laporan Penjualan harian / mingguan / bulanan
- [ ] Build production
- [ ] Laporan Stok & Inventory
- [ ] Dashboard Analytics / charts
- [ ] Export PDF
- [ ] Stok Opname
- [ ] Supplier Management
- [ ] Settings & User Management
- [ ] Log Aktivitas / riwayat aksi user

### Phase 4 — Enhancement
- [x] Integrasi QZ Tray (LX-310 Dot-Matrix)
- [x] Pengaturan printer thermal 58mm / 80mm
- [x] Template Nota / Struk / Invoice ProMax
- [x] WhatsApp Gateway via wa.me
- [ ] Backup & Restore data
- [ ] Theme toggle Light / Dark / System

---

## C. Fitur / Perbaikan yang Sudah Selesai

- [x] Fix Theme Inconsistency
- [x] Fix Bluetooth Printing Support
- [x] Fix Data Master Loading
- [x] Fix UI Interaction
- [x] Final Verification untuk perbaikan sebelumnya
- [x] Integrasi QZ Tray
- [x] Pengaturan printer thermal
- [x] Template nota / invoice ProMax
- [x] WhatsApp Gateway

---

## Prioritas Berikutnya

1. **Selesaikan verifikasi responsive POS**
2. **Evaluasi PosHeader.jsx pada breakpoint lg**
3. **Rapikan / selesaikan ProductExplorer 7 kolom untuk desktop ultra-wide jika memang diperlukan**
4. **Order Percetakan + Kanban + ongkir**
5. **DP & Pelunasan**
6. **Customer CRUD + riwayat**
7. **Inventory, keuangan, laporan, dan fitur pendukung lainnya**
