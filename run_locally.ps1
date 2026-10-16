# ==============================================================================
# Flashscore AI Football Intelligence v2.4 / v3.2 — PowerShell Local Launcher
# Direct execution script for Windows environments
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "   FLASHSCORE DEEP LIVE TRACKER & AI FOOTBALL INTELLIGENCE v2.4 / v3.2  " -ForegroundColor Green
Write-Host "   Real-Time Clock • Live Radar • Daily Top 5 • Global Match Analyzer   " -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Node.js Installation
Write-Host "[1/4] Checking Node.js runtime..." -ForegroundColor Header
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Node.js (v18+) from https://nodejs.org/" -ForegroundColor Yellow
    Exit 1
}
$nodeVersion = & node -v
Write-Host "      -> Node.js detected: $nodeVersion" -ForegroundColor Green

# 2. Check Python Installation
Write-Host "[2/4] Checking Python environment..." -ForegroundColor Header
$pythonCmd = $null
if (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonCmd = "python3"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py -3"
}

if (-not $pythonCmd) {
    Write-Host "[WARNING] Python is not installed or not found in PATH." -ForegroundColor Yellow
    Write-Host "          Live Python Bridge features require Python 3.9+." -ForegroundColor DarkYellow
} else {
    $pyVersion = & Invoke-Expression "$pythonCmd --version"
    Write-Host "      -> Python detected: $pyVersion" -ForegroundColor Green
}

# 3. Check and Install Node Dependencies if needed
Write-Host "[3/4] Verifying node_modules..." -ForegroundColor Header
if (-not (Test-Path "node_modules")) {
    Write-Host "      -> Installing npm dependencies (first run)..." -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] npm install failed!" -ForegroundColor Red
        Exit 1
    }
} else {
    Write-Host "      -> node_modules folder verified." -ForegroundColor Green
}

# 4. Set Environment Variables & Start Server
Write-Host "[4/4] Starting Flashscore AI Football Intelligence server..." -ForegroundColor Header
$env:PORT = "3000"
$env:NODE_ENV = "development"

Write-Host ""
Write-Host "------------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host " Server starting at: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor BrightGreen
Write-Host " Press Ctrl+C in this terminal window to stop the server." -ForegroundColor Gray
Write-Host "------------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""

# Try opening default browser after 3 seconds in background
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:3000"
} | Out-Null

# Execute server
& npm run dev
