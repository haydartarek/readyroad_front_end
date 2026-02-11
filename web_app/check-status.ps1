# ═══════════════════════════════════════════════════════
# Check System Status
# Purpose: Verify backend and frontend are running
# Usage: .\check-status.ps1
# ═══════════════════════════════════════════════════════

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ✅ System Status Check                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════
# Check Backend (Spring Boot)
# ═══════════════════════════════════════════════════════
Write-Host "Backend (Spring Boot - port 8890):" -ForegroundColor Yellow
try {
    $backend = Invoke-WebRequest "http://localhost:8890/actuator/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    $status = ($backend.Content | ConvertFrom-Json).status
    Write-Host "   ✅ Running - Status: $status" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Not running or not responding" -ForegroundColor Red
    Write-Host "   Tip: Start backend with: cd readyroad && .\start-backend.bat" -ForegroundColor Gray
}
Write-Host ""

# ═══════════════════════════════════════════════════════
# Check Frontend (Next.js)
# ═══════════════════════════════════════════════════════
Write-Host "Frontend (Next.js - port 3000):" -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest "http://localhost:3000" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "   ✅ Running - Status: $($frontend.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Not running or not responding" -ForegroundColor Red
    Write-Host "   Tip: Start frontend with: .\start-frontend.ps1" -ForegroundColor Gray
}
Write-Host ""

# ═══════════════════════════════════════════════════════
# Check Active Ports
# ═══════════════════════════════════════════════════════
Write-Host "Active Ports:" -ForegroundColor Yellow
$ports = netstat -ano | Select-String ":3000|:8890|:3306" | Select-String "LISTENING"
if ($ports) {
    foreach ($portLine in $ports) {
        $parts = $portLine -split '\s+'
        $localAddress = $parts[2]
        $pid = $parts[-1]
        
        if ($localAddress -match ":3000") {
            Write-Host "   ✅ Port 3000 (Frontend) - PID: $pid" -ForegroundColor Green
        } elseif ($localAddress -match ":8890") {
            Write-Host "   ✅ Port 8890 (Backend) - PID: $pid" -ForegroundColor Green
        } elseif ($localAddress -match ":3306") {
            Write-Host "   ✅ Port 3306 (MySQL) - PID: $pid" -ForegroundColor Green
        }
    }
} else {
    Write-Host "   ⚠️  No services detected on ports 3000, 8890, or 3306" -ForegroundColor Yellow
}
Write-Host ""

# ═══════════════════════════════════════════════════════
# Check Database Connection
# ═══════════════════════════════════════════════════════
Write-Host "Database (MySQL - port 3306):" -ForegroundColor Yellow
$mysqlPort = netstat -ano | Select-String ":3306" | Select-String "LISTENING"
if ($mysqlPort) {
    Write-Host "   ✅ MySQL is listening" -ForegroundColor Green
} else {
    Write-Host "   ❌ MySQL not detected" -ForegroundColor Red
    Write-Host "   Tip: Make sure MySQL is running" -ForegroundColor Gray
}
Write-Host ""

# ═══════════════════════════════════════════════════════
# Node.js Processes
# ═══════════════════════════════════════════════════════
Write-Host "Node.js Processes:" -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        Write-Host "   - PID: $($proc.Id) | Started: $($proc.StartTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "   ℹ️  No Node.js processes running" -ForegroundColor Gray
}
Write-Host ""

# ═══════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Quick Links:" -ForegroundColor Yellow
Write-Host "   Backend API:     http://localhost:8890/api" -ForegroundColor Cyan
Write-Host "   Frontend:        http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Test Services:   http://localhost:3000/test-services" -ForegroundColor Cyan
Write-Host "   Dashboard:       http://localhost:3000/dashboard" -ForegroundColor Cyan
Write-Host "   Weak Areas:      http://localhost:3000/analytics/weak-areas" -ForegroundColor Cyan
Write-Host "   API Health:      http://localhost:8890/actuator/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
