# Referensi Alur Bisnis POS Abadi Jaya

Dokumen ini menjadikan alur bisnis aplikasi AERPrint pada screenshot yang diberikan pengguna sebagai **referensi proses bisnis**, bukan referensi tampilan/UI.

## 1. Prinsip utama

POS Percetakan Abadi Jaya menggunakan konsep **Order → Kasir → Produksi → QC → Selesai → Pelunasan → Serah Terima**.

Kasir menjadi **gerbang finansial untuk pelepasan pekerjaan ke produksi** pada Digital Printing dan Offset.

Pesanan boleh dibuat oleh operator/admin, tetapi pekerjaan cetak fisik tidak boleh muncul sebagai pekerjaan siap produksi sebelum ada pembayaran/DP yang tercatat.

## 2. Master data

Master harus menjadi sumber perhitungan transaksi:

- Mesin/printer
- Jenis pekerjaan
- Bahan/material
- Ukuran
- Harga pokok
- Harga jual
- Harga bertingkat berdasarkan quantity
- Finishing
- Routing/tahapan produksi
- Customer
- Supplier
- Chart of Account

Perubahan harga master tidak boleh mengubah histori transaksi yang sudah tersimpan.

## 3. Digital Printing

### Input order

Operator/admin mengisi:

- Customer
- File/nama pekerjaan
- Mesin/printer
- Bahan
- Ukuran
- Quantity
- Finishing
- Desain
- Deadline
- Catatan produksi

Sistem menghitung total dari data master dan detail order.

Status awal:

**MENUNGGU PEMBAYARAN**

Jika membutuhkan desain, proses desain dapat berjalan terpisah sebelum cetak fisik, tetapi status pekerjaan cetak tetap menunggu pembayaran.

### Masuk Kasir

Pesanan otomatis masuk:

**Kasir → Pesanan Cetak Menunggu Pembayaran**

Kasir dapat mencari:

- Nomor order/invoice
- Nama pelanggan
- Jenis cetakan
- Bahan
- Nomor task/SPK

Kasir melihat:

- Total
- DP sebelumnya
- Pembayaran sekarang
- Total terbayar
- Sisa
- Deadline
- Catatan

### Pembayaran

Kasir dapat memilih:

- Tunai
- Transfer
- QRIS
- Metode pembayaran lain yang diaktifkan

Server menghitung ulang sisa tagihan dan menolak pembayaran melebihi sisa.

Setelah pembayaran valid:

1. Cash flow dibuat.
2. DP/order payment diperbarui.
3. Customer ledger diperbarui.
4. Audit log dibuat.
5. Task Digital Printing dilepas ke produksi.
6. Tidak boleh membuat task produksi kedua.

Status menjadi:

**PRODUKSI**

## 4. Offset Printing

### Input order

Operator/admin membuat SPK Offset dengan:

- Customer
- Produk
- Quantity
- Material
- Spesifikasi
- Finishing
- Desain
- Biaya cetak
- Biaya material
- Biaya finishing
- Biaya desain
- Biaya lainnya
- Deadline

Status awal:

**MENUNGGU PEMBAYARAN / MENUNGGU ANTRIAN**

### Kasir

SPK Offset otomatis masuk ke:

**Kasir → Pesanan Cetak Menunggu Pembayaran**

Kasir mencari customer atau jenis pekerjaan, kemudian memproses DP/pembayaran.

Setelah pembayaran:

- spk_payments tercatat
- DP/sisa diperbarui
- cash flow tercatat
- customer ledger diperbarui
- SPK berubah menjadi status antrean produksi
- Production Queue dapat menampilkannya

## 5. Production Queue

Production Queue hanya menerima pekerjaan yang sudah memenuhi gate pembayaran.

Alur Digital Printing:

**Produksi → Cetak → Finishing → QC → Selesai**

Alur Offset:

**Persiapan/Prepress → Cetak Offset → Finishing → QC → Selesai**

Setiap perpindahan status harus tercatat dengan user dan waktu.

## 6. Pelunasan

Setelah pekerjaan selesai:

**Selesai → Siap Diambil**

Jika masih ada sisa tagihan:

**Kasir → Pelunasan**

Setelah lunas:

**Lunas → Siap Diambil**

Pembayaran pelunasan harus:

- Tidak melebihi sisa.
- Masuk cash flow.
- Menambah ledger customer.
- Memperbarui status transaksi/SPK/task.
- Mencatat activity log.

## 7. Serah terima

Customer mengambil pesanan setelah status:

**SIAP DIAMBIL**

Sistem mencatat:

- Waktu pengambilan
- Petugas
- Customer
- Nomor order/SPK
- Nominal sisa saat serah terima

Setelah serah terima:

**DIAMBIL**

## 8. Pembatalan

Pembatalan bukan menghapus histori.

Sistem harus:

- Mengubah status menjadi BATAL.
- Mengembalikan material/stok yang memang sebelumnya dikurangi.
- Membuat reversal cash flow jika ada pembayaran.
- Mengurangi ledger customer sesuai reversal.
- Menghentikan assignment produksi/desain yang masih aktif.
- Mencatat user, waktu, dan alasan pembatalan.

## 9. Aturan penting

### Tidak boleh

- Order produksi dibuat dua kali karena satu transaksi.
- Pembayaran melebihi sisa.
- Pekerjaan belum bayar muncul sebagai pekerjaan cetak siap produksi.
- Cash flow hilang ketika transaksi dibatalkan.
- Stok berubah tanpa stock movement.
- Histori transaksi dihapus secara permanen.

### Harus

- Server menjadi sumber kebenaran nominal pembayaran.
- Setiap pembayaran menggunakan transaksi database.
- Satu order mempunyai satu identitas sumber yang dapat ditelusuri dari order → pembayaran → produksi.
- Digital Printing menggunakan task yang sama ketika masuk kasir dan produksi.
- Offset menggunakan SPK yang sama dari kasir sampai produksi.
- Semua perubahan penting masuk activity log.

## 10. Identitas hubungan data

### Digital Printing

`dp_tasks.id`
→ `transaction_details.note`
→ `transactions.id`
→ `cash_flow.reference_id`
→ Production Queue

### Offset

`spk.id`
→ `spk_payments.spk_id`
→ `cash_flow.reference_id`
→ Production Queue
→ Handover

## 11. Acceptance test utama

### Digital Printing

1. Buat order Rp500.000.
2. Order muncul di Kasir.
3. Production Queue belum menampilkan order.
4. Bayar DP Rp200.000.
5. Cash flow bertambah Rp200.000.
6. DP menjadi Rp200.000.
7. Sisa menjadi Rp300.000.
8. Order muncul di Production Queue.
9. Bayar lagi Rp300.000.
10. Total terbayar Rp500.000 dan status Lunas.
11. Tidak ada cash flow ganda.
12. Tidak ada task produksi ganda.

### Offset

1. Buat SPK Rp1.000.000.
2. SPK muncul di Kasir.
3. Production Queue belum menampilkan SPK.
4. Bayar DP Rp300.000.
5. SPK masuk antrean produksi.
6. Sisa menjadi Rp700.000.
7. Selesaikan produksi.
8. Bayar Rp700.000.
9. Status menjadi siap diambil.
10. Serah terima mengubah status menjadi diambil.

## 12. Target penyempurnaan POS

Implementasi berikutnya harus memprioritaskan:

1. **Satu alur Order → Kasir → Produksi**
2. **Status order yang konsisten**
3. **Pembayaran dan cash flow satu sumber**
4. **Stok/material mengikuti status transaksi**
5. **Pelunasan dan serah terima**
6. **Pembatalan dengan reversal**
7. **Audit trail**
8. **Notifikasi customer**
9. **Dashboard antrean per bagian**
10. **Rekonsiliasi keuangan dan stok**

Screenshot AERPrint digunakan sebagai referensi proses bisnis lama; UI modern POS Abadi Jaya tetap dipertahankan.
