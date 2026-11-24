# ==============================================================================
# SIMS GATE - AUTOMATED REQUIREMENTS INSTALLER & SETUP SCRIPT
# Run this inside the project root: C:\Users\aniru\Desktop\SIMS GATE
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   SIMS GATE - AUTOMATED REQUIREMENTS INSTALLER & SETUP   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ProjectRoot = Get-Location
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

# Step 1: Check System Tools
Write-Host "`n[1/6] Checking System Prerequisites..." -ForegroundColor Yellow

# Check Python
try {
    $pyVer = & python --version 2>&1
    Write-Host "  [OK] Python Detected: $pyVer" -ForegroundColor Green
} catch {
    Write-Error "Python is not installed or not in PATH! Please install Python 3.11+."
    exit 1
}

# Check Node.js
try {
    $nodeVer = & node --version 2>&1
    Write-Host "  [OK] Node.js Detected: $nodeVer" -ForegroundColor Green
} catch {
    Write-Error "Node.js is not installed or not in PATH! Please install Node.js 20+."
    exit 1
}

# Check PostgreSQL
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlCmd) { $psqlPath = $psqlCmd.Source }
}

if (Test-Path $psqlPath) {
    $pgVer = & $psqlPath --version 2>&1
    Write-Host "  [OK] PostgreSQL Detected: $pgVer" -ForegroundColor Green
} else {
    Write-Host "  [!] PostgreSQL psql utility not found in standard path. Please ensure PostgreSQL service is running." -ForegroundColor Yellow
}

# Step 2: Setup Backend Python Virtual Environment
Write-Host "`n[2/6] Setting up Python Virtual Environment (backend/.venv)..." -ForegroundColor Yellow
Set-Location $BackendDir

if (-not (Test-Path ".venv")) {
    Write-Host "  Creating virtual environment in .venv..." -ForegroundColor Gray
    python -m venv .venv
} else {
    Write-Host "  Virtual environment (.venv) already exists." -ForegroundColor Gray
}

$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"
$VenvPip = Join-Path $BackendDir ".venv\Scripts\pip.exe"

# Step 3: Install Backend Requirements
Write-Host "`n[3/6] Installing Backend Dependencies (pip install -r requirements.txt)..." -ForegroundColor Yellow
& $VenvPython -m pip install --upgrade pip --quiet
& $VenvPip install -r requirements.txt --quiet
Write-Host "  [OK] Backend Python packages installed successfully!" -ForegroundColor Green

# Step 4: Setup Backend .env file
Write-Host "`n[4/6] Verifying Backend Environment Configuration (.env)..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "  Created backend/.env from .env.example. Please review database credentials!" -ForegroundColor Magenta
    }
} else {
    Write-Host "  [OK] backend/.env file found." -ForegroundColor Green
}

# Step 5: Install Frontend Dependencies
Write-Host "`n[5/6] Installing Frontend Dependencies (npm install in frontend)..." -ForegroundColor Yellow
Set-Location $FrontendDir
npm install --silent
Write-Host "  [OK] Frontend npm packages installed successfully!" -ForegroundColor Green

# Step 6: Database Setup & Migrations
Write-Host "`n[6/6] Applying PostgreSQL Database Migrations..." -ForegroundColor Yellow
Set-Location $BackendDir

try {
    & $VenvPython manage.py migrate
    Write-Host "  [OK] Database migrations applied successfully!" -ForegroundColor Green
} catch {
    Write-Host "  [!] Migration warning: Ensure PostgreSQL service is active and database exists." -ForegroundColor Yellow
}

# Return to root directory
Set-Location $ProjectRoot

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ALL REQUIREMENTS INSTALLED & SETUP COMPLETED!           " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "To launch all services at once, run: .\start-all.bat" -ForegroundColor White
Write-Host "  - Django Backend:  http://127.0.0.1:8000" -ForegroundColor Gray
Write-Host "  - Next.js Portal:  http://localhost:3001" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan
