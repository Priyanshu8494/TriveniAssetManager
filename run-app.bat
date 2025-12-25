@echo off
title Triveni Asset Manager Server
color 0b
cls
echo ========================================================
echo        TRIVENI ASSET MANAGER - STARTUP SCRIPT
echo ========================================================
echo.
echo [INFO] Starting the Local Web Server...
echo [INFO] Ensure your iPhone is on the same Wi-Fi.
echo.
cd /d "%~dp0"
echo [EXEC] npm run dev -- --host
cmd /c "npm run dev -- --host"
pause
