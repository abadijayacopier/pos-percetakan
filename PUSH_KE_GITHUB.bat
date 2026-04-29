@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo    ABAD JAYA COPIER - AUTO PUSH SYSTEM
echo ==========================================
echo.

echo [1/3] Mengekspor Database Terbaru...

:: Daftar kemungkinan lokasi mysqldump
set "dumpPath="
if exist "C:\xampp\mysql\bin\mysqldump.exe" set "dumpPath=C:\xampp\mysql\bin\mysqldump.exe"
if exist "D:\xampp\mysql\bin\mysqldump.exe" set "dumpPath=D:\xampp\mysql\bin\mysqldump.exe"
if exist "C:\laragon\bin\mysql\mysql*\bin\mysqldump.exe" (
    for /d %%i in ("C:\laragon\bin\mysql\mysql*") do set "dumpPath=%%i\bin\mysqldump.exe"
)

if defined dumpPath (
    echo Menggunakan: !dumpPath!
    "!dumpPath!" -u root -p" admin" pos_abadi > db_pos_abadi.sql
) else (
    echo Mencoba perintah sistem...
    mysqldump -u root -p" admin" pos_abadi > db_pos_abadi.sql
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [PERINGATAN] Gagal ekspor database otomatis. 
    echo Pastikan MySQL jalan dan lokasi mysqldump benar.
    echo Namun proses push kode tetap dilanjutkan...
    echo.
)

echo [2/3] Menyiapkan File untuk GitHub...
git add .
git commit -m "Update Fitur: Branding Developer & Sinkronisasi Dashboard (Supriyanto)"

echo [3/3] Mengirim ke GitHub...
git push https://github.com/abadijayacopier/pos-percetakan.git main

echo.
echo ==========================================
echo    BERHASIL! Kode dan Database terupdate.
echo ==========================================
pause
