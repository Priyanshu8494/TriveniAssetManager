@echo off
title Triveni Asset Manager - Updater
color 0a
cls
echo ========================================================
echo        TRIVENI ASSET MANAGER - UPDATE & DEPLOY
echo ========================================================
echo.
echo [INFO] This will upload your latest changes to GitHub.
echo [INFO] If connected to Vercel, your live site will update automatically.
echo.
set /p msg="Enter a short message for this update (e.g. 'Added new column'): "

if "%msg%"=="" set msg="Update"

echo.
echo [EXEC] git add .
git add .
echo [EXEC] git commit -m "%msg%"
git commit -m "%msg%"
echo [EXEC] git push
git push

echo.
echo ========================================================
echo [SUCCESS] Changes pushed! Vercel will update in ~1 min.
echo ========================================================
pause
