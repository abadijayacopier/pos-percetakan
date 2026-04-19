# 📕 Panduan Instalasi & Konfigurasi POS Abadi Jaya

Dokumen ini berisi langkah-langkah teknis untuk melakukan instalasi aplikasi POS Abadi Jaya, konfigurasi database MariaDB, serta pengaturan printer LX-310.

---

## 1. Instalasi Aplikasi Utama
1. Dapatkan file installer terbaru: `POS Abadi Jaya Setup 1.0.0.exe`.
2. Klik kanan pada file installer dan pilih **Run as Administrator**.
3. Ikuti petunjuk di layar hingga selesai. Aplikasi akan otomatis membuat shortcut di Desktop.

## 2. Persiapan Database (Setup Pertama Kali)
Saat pertama kali dijalankan, aplikasi akan mendeteksi status database. Ikuti langkah berikut pada jendela Setup:

> [!IMPORTANT]
> Pastikan komputer terhubung ke internet jika Anda perlu mengunduh MariaDB secara otomatis.

1. **Instalasi MariaDB**: Klik tombol **"Download & Install MariaDB"**. Sistem akan memasang MariaDB versi 10.11 secara otomatis sebagai service Windows.
2. **Import Struktur Data**: Setelah MariaDB terpasang, klik tombol **"Import Database"**. Sistem akan otomatis membuat database `pos_abadi` dan mengimpor seluruh tabel yang diperlukan.
3. **Konfigurasi Koneksi**: 
   - Host: `localhost` (untuk komputer utama) atau `Alamat IP Server`.
   - User: `root`.
   - Password: (sesuai yang di-set saat instalasi MariaDB).
4. Klik **Tes Koneksi** > **Simpan & Jalankan**.

## 3. Konfigurasi Printer Epson LX-310
Agar nota tercetak sempurna pada kertas *continuous form* ukuran 12cm x 14cm:

1. Pastikan printer Epson LX-310 sudah terhubung dan driver terinstall di Windows.
2. Jalankan aplikasi **QZ Tray** (wajib aktif di system tray).
3. Di aplikasi POS, buka menu **Pengaturan (Settings)**.
4. Pada bagian **Ukuran Printer**, Pilih opsi **`lx310`**.
5. Klik **Simpan**.

## 4. Troubleshooting & Tips
- **Gagal Print**: Pastikan aplikasi **QZ Tray** sudah berjalan (ikon hijau di pojok kanan bawah Windows).
- **Aplikasi Lambat**: Pastikan service MariaDB/MySQL sedang berjalan melalui aplikasi `Services.msc` di Windows.
- **Update Versi**: Jika ada update, cukup jalankan installer versi terbaru. Data transaksi di database tidak akan hilang.

---
*© 2026 Abadi Jaya Copier - Sistem Kasir & Percetakan*
