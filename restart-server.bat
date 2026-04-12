@echo off
echo ==========================================
echo    RESTART SERVER POS ABADI JAYA
echo ==========================================
echo.
echo Sedang mematikan server lama...
taskkill /F /IM node.exe /T >nul 2>&1
echo Port 5001 telah dibersihkan.
echo.
echo Sedang menjalankan server baru...
cd server
npm start
pause
