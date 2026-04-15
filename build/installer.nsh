!macro customInstall
    DetailPrint "Mengecek Service MySQL/MariaDB..."
    
    ; 1. Cek apakah service sudah berjalan
    nsExec::ExecToStack 'sc query mysql'
    Pop $0
    Pop $1

    ${If} $0 != 0
        DetailPrint "Service MySQL tidak ditemukan. Menginstal Database Engine..."
        
        ; 2. Jalankan script inisialisasi database
        ; $INSTDIR adalah folder instalasi aplikasi
        ; db-setup.bat harus ada di folder resources
        nsExec::ExecToLog '"$INSTDIR\resources\scripts\setup-database.bat" "$INSTDIR\resources\database-engine"'
    ${Else}
        DetailPrint "Service MySQL sudah ada. Melewati instalasi engine."
        ; Tetap impor database jika diperlukan (opsional, bisa berbahaya jika data sudah ada)
        ; nsExec::ExecToLog '"$INSTDIR\resources\scripts\setup-database.bat" "ALREADY_INSTALLED"'
    ${EndIf}
!macroend

!macro customUnInstall
    ; Optional: Uninstall service if needed
    ; nsExec::ExecToLog '"$INSTDIR\resources\scripts\uninstall-database.bat"'
!macroend
