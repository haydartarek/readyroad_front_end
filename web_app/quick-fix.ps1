# ═══════════════════════════════════════════════════════
# Quick Fix Script (One-liner)
# Purpose: Fast cleanup and restart
# Usage: .\quick-fix.ps1
# ═══════════════════════════════════════════════════════

Write-Host "🚀 Quick Fix Starting..." -ForegroundColor Cyan

# Kill port 3000
$port3000 = netstat -ano | Select-String ":3000" | Select-String "LISTENING"
if ($port3000) { 
    $pid = ($port3000 -split '\s+')[-1]
    Write-Host "   Killing PID $pid..." -ForegroundColor Yellow
    taskkill /F /PID $pid 2>$null 
}

# Remove lock file
$lockFile = "$PSScriptRoot\.next\dev\lock"
if (Test-Path $lockFile) {
    Write-Host "   Removing lock file..." -ForegroundColor Yellow
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}

# Remove all locks in .next
if (Test-Path "$PSScriptRoot\.next") {
    Get-ChildItem "$PSScriptRoot\.next" -Filter "lock" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
}

Write-Host "   Waiting..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "✅ Fixed! Starting server..." -ForegroundColor Green
Write-Host ""

# Start dev server
npm run dev
