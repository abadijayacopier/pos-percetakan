# POS Percetakan Abadi Jaya

Aplikasi Point of Sale (POS) dan Manajemen Alur Produksi berbasis Web, dirancang khusus untuk memenuhi kebutuhan operasional harian Toko Fotocopy dan Percetakan (Digital/Offset) **Abadi Jaya**.

Aplikasi ini mengintegrasikan seluruh proses inti bisnis, dari penerimaan pesanan di kasir, manajemen material (stok bahan), penugasan operator desain, pemantauan status produksi (Kanban Board), hingga serah terima pesanan ke pelanggan.

## Fitur Utama

### 1. Sistem Kasir (Point of Sale)
- **Kalkulator Kasir Cepat:** Melayani transaksi tunai & non-tunai (Transfer/QRIS) dengan cepat.
- **Support Jenis Pembayaran:** DP (Uang Muka) dan Pelunasan untuk pesanan yang butuh proses (seperti percetakan).
- **Cetak Struk/Nota:** Dukungan pencetakan struk termal (58mm/80mm) dan dot-matrix/inkjet via Web API atau Bluetooth (RawBT).
- **Berbagi Struk Digital:** Fitur *Share Receipt* via WhatsApp atau salin ke *clipboard*.

### 2. Manajemen Digital Printing (Pesanan Desain & Cetak)
- **Kalkulator Harga Dinamis:** Menghitung total estimasi harga secara otomatis berdasarkan kalkulasi per-meter atau per-pcs bahan cetak (Banner, Stiker, Kartu Nama, dl).
- **Penugasan Desainer Terpusat:** Admin dapat melihat status ketersediaan Desainer secara *real-time* ("Tersedia" atau "Sibuk") dan memberikan tugas secara proporsional.
- **Catatan & Instruksi Khusus:** Instruksi kasir tersambung langsung hingga ke layar desainer dan operator mesin.

### 3. Dashboard Khusus Operator Desain
- **Antarmuka Bebas Distraksi:** Didesain agar *User Role* Desainer hanya melihat tugas yang diberikan kepadanya.
- **Timer Pekerjaan (Live):** Saat Desainer memulai pekerjaan, timer akan berjalan sehingga Admin bisa memantau "*Time Spent*" per desain.
- **Sistem Serah Terima Berkas:** Desainer dapat dengan mudah menyematkan URL/Tautan Google Drive hasil desain yang telah disetujui untuk diakses oleh Operator Mesin.

### 4. Antrean & Monitoring Produksi (Kanban Board)
- **Sistem Drag & Drop:** Operator Mesin memantau seluruh antrean pesanan menggunakan antarmuka *Kanban* (Menunggu -> Proses Cetak -> Finishing -> QC -> Selesai).
- **Indikator Prioritas & Lampiran File:** Memungkinkan operator mengunduh langsung file desain dari kartu tugas tanpa perlu bertanya ke desainer.

### 5. Keamanan Serah Terima Barang
- **Sinkronisasi Kasir & Produksi:** Tombol "Serah Terima" pada pesanan cetak secara otomatis terkunci dengan badge `⚠️ Sedang Produksi` hingga kartu pesanan di Kanban Board benar-benar dipindahkan ke kolom "Selesai". Hal ini mencegah kasir secara tidak sengaja menyerahkan pesanan yang belum selesai ke pelanggan.

### 6. Kelola Data & Inventori (Master Data)
- Manajemen Pelanggan (Umum / Member).
- Kelola Stok Produk Jadi & ATK (Otomatis berkurang saat terjual).
- Kelola Bahan Baku Cetak (HPL, Banner, Stiker, dll) & perhitungan modal.
- Laporan Keuangan (Omzet, Arus Kas).

## Pembaruan Terbaru (Changelog v2.1)
- **Modul Servis Fotocopy Lengkap**: Alur servis dari penerimaan hingga penyerahan kembali dengan sistem invoice modern.
- **Integrasi Dashboard Riil**: Dasbor kini menampilkan data asli dari database (transaksi dan grafik).
- **Dark Mode 2.0 & ThemeToggle**: Rekonstruksi sistem tema untuk konsistensi di POS dan Service.
- **Aktivasi PWA**: Dukungan Progressive Web App resmi diaktifkan.
- **Fix NaN Calculation**: Perbaikan logika hitung total biaya pada modul servis.

## Teknologi yang Digunakan

Aplikasi ini dibangun menggunakan arsitektur modern Javascript:

*   **Frontend (Client):**
    *   [React.js](https://reactjs.org/) (Vite)
    *   Tailwind CSS (Styling & Modern UI/UX)
    *   React Router (SPA Navigation)
    *   React Icons
    *   *LocalStorage DB (sebagai penyimpanan sementara)*

*   **Backend (Server):**
    *   [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
    *   [MySQL](https://www.mysql.com/) (Database Data Utama)
    *   Bcrypt.js (Keamanan Password)

## Instalasi dan Menjalankan Proyek Secara Lokal

Agar dapat menjalankan aplikasi ini di komputer lokal, pastikan Anda telah menginstal **Node.js** dan **MySQL** (XAMPP/Laragon).

1. **Clone Repository**
   ```bash
   git clone https://github.com/abadijayacopier/pos-percetakan.git
   cd pos-percetakan
   ```

2. **Setup Backend (Server)**
   Buka terminal, dan masuk ke direktori server:
   ```bash
   cd server
   npm install
   ```
   *   Buat database MySQL baru dengan nama `pos_abadi`.
   *   Salin file `.env.example` (jika ada) ke `.env`, lalu masukkan konfigurasi database Anda.
   *   *(Opsional: Jalankan script migrasi/seeder jika dikonfigurasi).*
   *   Nyalakan server backend:
   ```bash
   npm start
   ```

3. **Setup Frontend (Client)**
   Buka tab terminal baru, navigasikan ke direktori client:
   ```bash
   cd client
   npm install
   ```
   *   Nyalakan development server:
   ```bash
   npm run dev
   ```

4. **Akses Aplikasi**
   Buka *browser* dan akses URL yang diberikan oleh Vite (biasanya `http://localhost:5173`).

---
*Dibuat untuk Percetakan Abadi Jaya.*
