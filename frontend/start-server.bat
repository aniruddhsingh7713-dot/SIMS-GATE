@echo off
title AIRA Frontend Server
cd /d "%~dp0"
echo ==============================================
echo   AIRA Frontend Server is running!
echo   Open in your browser: http://localhost:3000
echo ==============================================
python -m http.server 3000
pause
