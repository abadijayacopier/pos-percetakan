# Rekayasa Ulang UI/UX Dasbor Berbasis Pro-Max

## 1. Analisis Kesenjangan UI Saat Ini (Gap Analysis)
Halaman Dasbor (`client/src/pages/DashboardPage.jsx`) saat ini menggunakan skema default bawaan template standar:
- **Warna Utama:** Masih menggunakan standar `blue-600` Tailwind.
- **Tipografi:** Mengandalkan *font* bawaan sistem (`Inter` / `sans-serif`) yang secara teknis kurang memberikan kesan presisi (*Data-Dense Dashboard*).
- **Indikator Keberhasilan:** Tersebar dengan palet warna pelangi (`emerald`, `amber`, `rose`, `blue`) tanpa kohesi korporat POS.
- Kontras gelap-terang sudah baik, tetapi belum mencapai level "Pro" sesuai standar Sistem Desain "Data-Dense POS".

## 2. Rencana Implementasi (Tahapan Edit)
Untuk merombak Dasbor Utama (*Dashboard Bisnis*) sesuai standar internasional yang baru kita _generate_ (Sistem Desain *Cyan + Fira*), perbaikan akan difokuskan pada dua file utama:

### Eksekusi Tahap 1: Injeksi Sistem Global (`client/src/index.css`)
- **[MODIFY]** Menambahkan `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400..700&family=Fira+Sans:wght@300..700&display=swap');`
- **[MODIFY]** Mengganti referensi variabel *font global* agar judul aplikasi dan angka-angka harga/stok menggunakan font presisi (`Fira Sans` untuk Body, `Fira Code` untuk angka/faktur/heading tabel).

### Eksekusi Tahap 2: Merombak Halaman Dasbor (`client/src/pages/DashboardPage.jsx`)
- **[MODIFY] Konversi Palet Warna:** Mengganti secara massal kelas `blue-600` menjadi asertif `cyan-600` (`#0891b2`) sebagai identitas utama aplikasi. Skema _Hover_ akan diperbarui menjadi `cyan-700` atau `cyan-500/10`.
- **[MODIFY] Typografi Area Chart:** Mengganti warna *Stroke* grafik area omset (Recharts) dari warna biru standar menjadi *Gradient Cyan* atau *Emerald* yang menyatu dengan tema.
- **[MODIFY] Kartu Tanda Bahaya & Aksi Sukses:** Menyelaraskan kartu peringatan "Stok Menipis" dengan pedoman UX untuk meningkatkan *Focus State* kasir/operator.
- Menjamin kelestarian fitur responsif (*Mobile First*) dan interaksi saat mengeklik riwayat transaksi.

## 3. Hasil Akhir (Expected Outcome)
- Tampilan depan Dasbor Bisnis akan langsung terasa seperti panel komando finansial & operasional kelas *Enterprise* berkat rasio kontras `Cyan` yang dingin dan profesional, serta angka-angka berfont *Fira Code* yang estetik.
- Seluruh kode tetap menggunakan *Tailwind classes* jadi tidak memperberat kerja peramban (browser).
