@echo off
title SIMS GATE - Services Launcher
echo ========================================================
echo   Starting SIMS GATE Backend ^& Frontend Services...
echo ========================================================

:: 1. Start Django Backend on Port 8000
start "Django Backend (Port 8000)" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"

:: 2. Start AIRA Frontend on Port 3000
start "AIRA Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && python -m http.server 3000"

:: 3. Start Next.js App on Port 3001
start "Next.js Portal (Port 3001)" cmd /k "cd /d %~dp0frontend && npx next dev -p 3001"

echo.
echo All services have been launched in separate windows!
echo - Django Backend: http://127.0.0.1:8000
echo - AIRA Frontend:  http://localhost:3000
echo - Next.js Portal: http://localhost:3001
echo ========================================================
pause
