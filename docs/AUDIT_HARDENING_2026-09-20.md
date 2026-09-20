# Audit & Hardening — POS Percetakan Abadi Jaya

Tanggal audit: 2026-09-20

## Ringkasan

Audit mencakup backend API, transaksi POS, order percetakan, DP/pelunasan, cash flow, inventory, authentication/authorization, license guard, multi-tenant configuration, Electron/deployment, database migration, backup, dan testing.

Prioritas terbesar yang ditemukan adalah **integritas transaksi**: total, pembayaran, DP, cash flow, stok, customer spending, dan reversal harus tetap konsisten ketika transaksi diedit, dilunasi, atau dibatalkan.

## Perbaikan yang sudah dipush

- Validasi DP order tidak boleh negatif atau melebihi total order.
- Pelunasan order mengambil saldo dari database dan menolak overpayment.
- Pelunasan DP task menghitung total dari database, bukan mempercayai total dari frontend.
- Pelunasan transaksi POS menolak nominal <= 0 dan overpayment.
- Pembatalan settlement membuat reversal cash-flow dan mengurangi paid/customer spending.
- Void transaksi POS dipertahankan sebagai histori dan menggunakan reversal cash-flow; stok dikembalikan.
- Edit transaksi memvalidasi paid terhadap total database.
- Mode standalone/SaaS pada auth, login, dan tenant manager disatukan ke konfigurasi database.
- License guard sekarang fail-closed ketika pemeriksaan lisensi mengalami error.
- Password user baru tidak lagi mempunyai fallback `123456`; password wajib minimal 8 karakter.
- Admin tidak dapat menghapus dirinya sendiri atau admin aktif terakhir.
- Production server menolak JWT secret kosong/lemah.
- Docker Compose tidak lagi mempunyai fallback password database/JWT secret production.
- Deployment script tidak lagi menampilkan kredensial login default.
- Audit ini dicatat di repository agar temuan dan hardening dapat ditindaklanjuti.

## Temuan yang masih perlu dikerjakan

### P0
1. Buat payment ledger/jurnal pembayaran tunggal agar semua modul POS, order, DP, dan printing menggunakan pola yang sama.
2. Tambahkan test otomatis untuk checkout, DP, pelunasan, overpayment, void, refund, edit, dan concurrency.
3. Audit seluruh endpoint untuk memastikan setiap perubahan uang/stok menggunakan transaksi database dan row locking yang tepat.
4. Verifikasi schema status transaksi agar nilai `void/unpaid/debt/paid` konsisten di seluruh laporan.

### P1
1. Rekonsiliasi inventory ketika edit transaksi: restore detail lama lalu apply detail baru secara atomik.
2. Standarisasi cash-flow reference/type/category dan jangan menjadikan delete sebagai mekanisme koreksi.
3. Review semua order cancellation agar material, DP, cash-flow, dan customer spending mempunyai reversal yang jelas.
4. Uji tenant isolation dengan akun/shop berbeda.
5. Rapikan migration menjadi urutan migration versioned; hindari ALTER TABLE dari route runtime.
6. Satukan satu schema SQL resmi; `db_pos_abadi.sql` yang kosong harus dihapus/diganti sumber schema yang benar.
7. Uji backup lalu restore pada database baru, bukan hanya memastikan file backup terbentuk.

### P2
1. Tambahkan rate limiting login/register.
2. Centralize JWT parsing agar auth dan license guard tidak menduplikasi validasi token.
3. Tambahkan graceful shutdown untuk uncaught exception/unhandled rejection.
4. Bersihkan alias route legacy `/api/dp-tasks` dan `/api/dp_tasks` setelah client dipastikan memakai satu endpoint.
5. Tambahkan CI lint/build/test sebelum merge.

## Catatan

Audit ini dilakukan terhadap source repository. Validasi runtime produksi, restore backup nyata, penetration test, dan pengujian perangkat printer tetap harus dilakukan di environment staging sebelum release production.
