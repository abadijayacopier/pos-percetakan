@echo off
chcp 65001 >nul 2>&1
echo ╔════════════════════════════════════════════════╗
echo ║   POS Abadi Jaya — Electron Build Pipeline    ║
echo ║                  v1.2.0                       ║
echo ╚════════════════════════════════════════════════╝
echo.

:: ──── STEP 1: Install Root Dependencies ────
echo [1/4] Menginstal root dependencies...
cd /d "d:\WEB\pos"
call npm install --production=false
if %errorlevel% neq 0 (
    echo ❌ GAGAL: npm install root
    pause
    exit /b 1
)
echo ✅ Root dependencies OK
echo.

:: ──── STEP 2: Build Electron Main (esbuild) ────
echo [2/4] Build electron-main.js → dist-main.js...
call npm run build:main
if %errorlevel% neq 0 (
    echo ❌ GAGAL: esbuild electron-main.js
    pause
    exit /b 1
)
echo ✅ esbuild bundle OK
echo.

:: ──── STEP 3: Build Client (Vite) ────
echo [3/4] Build client React app...
cd /d "d:\WEB\pos\client"
call npm run build
if %errorlevel% neq 0 (
    echo ❌ GAGAL: Vite build client
    cd /d "d:\WEB\pos"
    pause
    exit /b 1
)
cd /d "d:\WEB\pos"
echo ✅ Client build OK
echo.

:: ──── STEP 4: Package with electron-builder ────
echo [4/4] Packaging .exe dengan electron-builder...
call npx electron-builder --win
if %errorlevel% neq 0 (
    echo ❌ GAGAL: electron-builder
    pause
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════════╗
echo ║        ✅ BUILD BERHASIL!                     ║
echo ║   Output: dist-installer\                     ║
echo ╚════════════════════════════════════════════════╝
echo.
pause
