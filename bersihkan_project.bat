@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   CLEANUP SCRIPT - POS ABADI JAYA
echo   Memindahkan file tidak terpakai ke _arsip_sampah
echo ===================================================

set BACKUP_DIR=_arsip_sampah
if not exist %BACKUP_DIR% (
    mkdir %BACKUP_DIR%
    mkdir %BACKUP_DIR%\server
    mkdir %BACKUP_DIR%\client_pages
)

echo [1/3] Memindahkan file sampah di Root...

move all_headers.txt %BACKUP_DIR%\ >nul 2>&1
move components_headers.txt %BACKUP_DIR%\ >nul 2>&1
move check_results.txt %BACKUP_DIR%\ >nul 2>&1
move seo_out.txt %BACKUP_DIR%\ >nul 2>&1
move seo_out2.txt %BACKUP_DIR%\ >nul 2>&1
move difflog.txt %BACKUP_DIR%\ >nul 2>&1
move server_crash.log %BACKUP_DIR%\ >nul 2>&1
move check_jsx.py %BACKUP_DIR%\ >nul 2>&1
move test-gen-simple.js %BACKUP_DIR%\ >nul 2>&1
move test-gen.js %BACKUP_DIR%\ >nul 2>&1
move test_purchases.js %BACKUP_DIR%\ >nul 2>&1
move get-hwid.js %BACKUP_DIR%\ >nul 2>&1
move components_headers.txt %BACKUP_DIR%\ >nul 2>&1

echo [2/3] Memindahkan file migrasi/test di Server...

move server\add-kategori.js %BACKUP_DIR%\server\ >nul 2>&1
move server\add_notes_to_transactions.js %BACKUP_DIR%\server\ >nul 2>&1
move server\alter_transactions.js %BACKUP_DIR%\server\ >nul 2>&1
move server\check-db.js %BACKUP_DIR%\server\ >nul 2>&1
move server\check-inventory.js %BACKUP_DIR%\server\ >nul 2>&1
move server\check-schema.js %BACKUP_DIR%\server\ >nul 2>&1
move server\check_db.js %BACKUP_DIR%\server\ >nul 2>&1
move server\check_schema.js %BACKUP_DIR%\server\ >nul 2>&1
move server\convert_logs.js %BACKUP_DIR%\server\ >nul 2>&1
move server\create_logs_table.js %BACKUP_DIR%\server\ >nul 2>&1
move server\create_tables.js %BACKUP_DIR%\server\ >nul 2>&1
move server\final_migrate_service.js %BACKUP_DIR%\server\ >nul 2>&1
move server\fix_activity_log.js %BACKUP_DIR%\server\ >nul 2>&1
move server\generate-license.js %BACKUP_DIR%\server\ >nul 2>&1
move server\migrate_dp.js %BACKUP_DIR%\server\ >nul 2>&1
move server\migrate_full.js %BACKUP_DIR%\server\ >nul 2>&1
move server\migrate_service_id.js %BACKUP_DIR%\server\ >nul 2>&1
move server\migrate_to_sqlite.js %BACKUP_DIR%\server\ >nul 2>&1
move server\test_db.js %BACKUP_DIR%\server\ >nul 2>&1
move server\test_del.js %BACKUP_DIR%\server\ >nul 2>&1
move server\test_insert.js %BACKUP_DIR%\server\ >nul 2>&1
move server\test_insert2.js %BACKUP_DIR%\server\ >nul 2>&1
move server\test_login_debug.js %BACKUP_DIR%\server\ >nul 2>&1
move server\test_query.js %BACKUP_DIR%\server\ >nul 2>&1
move server\test_wa_init.js %BACKUP_DIR%\server\ >nul 2>&1
move server\dual-mode.txt %BACKUP_DIR%\server\ >nul 2>&1
move server\error.txt %BACKUP_DIR%\server\ >nul 2>&1
move server\schema_output.txt %BACKUP_DIR%\server\ >nul 2>&1
move server\schema_output_utf8.txt %BACKUP_DIR%\server\ >nul 2>&1
move server\server_crash.log %BACKUP_DIR%\server\ >nul 2>&1
move server\server_error.log %BACKUP_DIR%\server\ >nul 2>&1
move server\wa_debug.log %BACKUP_DIR%\server\ >nul 2>&1

echo [3/3] Memindahkan halaman redundant di Client...

move client\src\pages\WASettingsPage.jsx %BACKUP_DIR%\client_pages\ >nul 2>&1
move client\src\pages\WhatsAppSettingsPage.jsx %BACKUP_DIR%\client_pages\ >nul 2>&1
move client\src\pages\PosPage.jsx %BACKUP_DIR%\client_pages\ >nul 2>&1
move client\src\pages\PrintingPage.jsx %BACKUP_DIR%\client_pages\ >nul 2>&1

echo ===================================================
echo   BERHASIL! Folder utama kini bersih.
echo   File lama ada di folder: %BACKUP_DIR%
echo ===================================================
pause
