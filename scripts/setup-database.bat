@echo off
set ENGINE_PATH=%1
set INSTALL_DIR=%~dp0
set SQL_FILE=%INSTALL_DIR%..\database\pos_abadi.sql

echo [INFO] Menyiapkan Database POS...

if "%ENGINE_PATH%"=="ALREADY_INSTALLED" (
    echo [INFO] MySQL sudah terpasang. Mencoba mengimpor database...
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS pos_abadi;"
    mysql -u root pos_abadi < "%SQL_FILE%"
    goto :eof
)

echo [INFO] Menginstal MariaDB Portable dari: %ENGINE_PATH%

cd /d "%ENGINE_PATH%"

:: 1. Instal Service MySQL (Jika belum ada)
bin\mysqld --install mysql
if %errorlevel% neq 0 (
    echo [WARN] Gagal menginstal service (mungkin sudah ada atau butuh admin).
)

:: 2. Jalankan Service
net start mysql

:: 3. Inisialisasi Database & Import SQL
echo [INFO] Mengimpor struktur database...
bin\mysql -u root -e "CREATE DATABASE IF NOT EXISTS pos_abadi;"
bin\mysql -u root pos_abadi < "%SQL_FILE%"

echo [SUCCESS] Database berhasil disiapkan!
