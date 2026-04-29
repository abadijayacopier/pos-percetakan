@echo off
echo ==========================================
echo    ABAD JAYA COPIER - AUTO PUSH SYSTEM
echo ==========================================
echo.

echo [1/3] Mengekspor Database Terbaru...
:: Mencoba lokasi standar XAMPP, jika gagal pakai perintah sistem
if exist "C:\xampp\mysql\bin\mysqldump.exe" (
    "C:\xampp\mysql\bin\mysqldump.exe" -u root -p" admin" pos_abadi > db_pos_abadi.sql
) else (
    mysqldump -u root -p" admin" pos_abadi > db_pos_abadi.sql
)

echo [2/3] Menyiapkan File untuk GitHub...
git add .
git commit -m "Update Fitur: Branding Developer & Sinkronisasi Dashboard (Supriyanto)"

echo [3/3] Mengirim ke GitHub...
git push https://github.com/abadijayacopier/pos-percetakan.git main

echo.
echo ==========================================
echo    BERHASIL! Kode & Database terupdate.
echo ==========================================
pause
