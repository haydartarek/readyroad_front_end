# ═══════════════════════════════════════════════════════
# Kill All Node.js Processes (Emergency)
# Purpose: Force kill all Node.js processes
# Usage: .\kill-all-node.ps1
# WARNING: This will kill ALL Node.js processes!
# ═══════════════════════════════════════════════════════

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║   ⚠️  WARNING: Kill All Node.js Processes  ║" -ForegroundColor Red
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""

$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue

if (-not $nodeProcesses) {
    Write-Host "ℹ️  No Node.js processes found" -ForegroundColor Gray
    exit
}

Write-Host "Found Node.js processes:" -ForegroundColor Yellow
foreach ($proc in $nodeProcesses) {
    Write-Host "   - PID: $($proc.Id) | CPU: $($proc.CPU) | Memory: $([math]::Round($proc.WorkingSet64 / 1MB, 2)) MB" -ForegroundColor Gray
}
Write-Host ""

$confirmation = Read-Host "Kill ALL Node.js processes? (yes/no)"

if ($confirmation -eq "yes") {
    Write-Host ""
    Write-Host "Killing all Node.js processes..." -ForegroundColor Yellow
    
    foreach ($proc in $nodeProcesses) {
        try {
            Stop-Process -Id $proc.Id -Force
            Write-Host "   ✅ Killed PID: $($proc.Id)" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Failed to kill PID: $($proc.Id)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "✅ All Node.js processes killed" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now start fresh with:" -ForegroundColor Yellow
    Write-Host "   .\start-frontend.ps1" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Operation cancelled" -ForegroundColor Red
}
