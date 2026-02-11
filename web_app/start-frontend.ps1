# ═══════════════════════════════════════════════════════
# Start Frontend Development Server
# Purpose: Clean start of Next.js with all checks
# Usage: .\start-frontend.ps1
# ═══════════════════════════════════════════════════════

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 Starting Frontend Development Server  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════
# Pre-flight checks
# ═══════════════════════════════════════════════════════
Write-Host "Pre-flight checks:" -ForegroundColor Yellow

# Check if port 3000 is available
$port3000 = netstat -ano | Select-String ":3000" | Select-String "LISTENING"
if ($port3000) {
    Write-Host "   ⚠️  Port 3000 is busy!" -ForegroundColor Yellow
    Write-Host "   Running fix script..." -ForegroundColor Gray
    & "$PSScriptRoot\fix-frontend-startup.ps1"
    Write-Host ""
} else {
    Write-Host "   ✅ Port 3000 is available" -ForegroundColor Green
}

# Check if node_modules exists
if (Test-Path "$PSScriptRoot\node_modules") {
    Write-Host "   ✅ node_modules found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  node_modules not found" -ForegroundColor Yellow
    Write-Host "   Installing dependencies..." -ForegroundColor Gray
    npm install
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
}

# Check if .env.local exists
if (Test-Path "$PSScriptRoot\.env.local") {
    Write-Host "   ✅ .env.local found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .env.local not found" -ForegroundColor Yellow
    Write-Host "   Using default configuration" -ForegroundColor Gray
}

Write-Host ""

# ═══════════════════════════════════════════════════════
# Display configuration
# ═══════════════════════════════════════════════════════
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Backend:  http://localhost:8890" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Test:     http://localhost:3000/test-services" -ForegroundColor Cyan
Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════
# Start the server
# ═══════════════════════════════════════════════════════
Write-Host "Starting Next.js development server..." -ForegroundColor Yellow
Write-Host ""

# Navigate to the correct directory
Set-Location $PSScriptRoot

# Start npm dev
npm run dev
