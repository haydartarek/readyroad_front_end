# ═══════════════════════════════════════════════════════
# Fix Next.js Startup Issues
# Purpose: Kill port 3000 process and remove Next.js lock file
# Usage: .\fix-frontend-startup.ps1
# ═══════════════════════════════════════════════════════

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🛑 Fixing Frontend Startup Issues        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════
# Step 1: Kill process on port 3000
# ═══════════════════════════════════════════════════════
Write-Host "1️⃣  Killing process on port 3000..." -ForegroundColor Yellow
$port3000 = netstat -ano | Select-String ":3000" | Select-String "LISTENING"

if ($port3000) {
    $pid = ($port3000 -split '\s+')[-1]
    Write-Host "   Found process PID: $pid" -ForegroundColor Gray
    taskkill /F /PID $pid 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Process killed successfully" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Failed to kill process (might need admin rights)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️  No process on port 3000" -ForegroundColor Gray
}
Write-Host ""

# ═══════════════════════════════════════════════════════
# Step 2: Remove Next.js lock file
# ═══════════════════════════════════════════════════════
Write-Host "2️⃣  Removing Next.js lock file..." -ForegroundColor Yellow
$lockFile = "$PSScriptRoot\.next\dev\lock"

if (Test-Path $lockFile) {
    try {
        Remove-Item $lockFile -Force -ErrorAction Stop
        Write-Host "   ✅ Lock file removed: $lockFile" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Failed to remove lock file: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️  No lock file found" -ForegroundColor Gray
}
Write-Host ""

# ═══════════════════════════════════════════════════════
# Step 3: Check for other lock files
# ═══════════════════════════════════════════════════════
Write-Host "3️⃣  Checking for other lock files..." -ForegroundColor Yellow
$otherLocks = Get-ChildItem "$PSScriptRoot\.next" -Filter "lock" -Recurse -ErrorAction SilentlyContinue

if ($otherLocks) {
    Write-Host "   Found additional lock files:" -ForegroundColor Gray
    foreach ($lock in $otherLocks) {
        Write-Host "   - $($lock.FullName)" -ForegroundColor Gray
        try {
            Remove-Item $lock.FullName -Force
            Write-Host "     ✅ Removed" -ForegroundColor Green
        } catch {
            Write-Host "     ⚠️  Failed to remove" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ℹ️  No additional lock files" -ForegroundColor Gray
}
Write-Host ""

# ═══════════════════════════════════════════════════════
# Step 4: Wait for cleanup
# ═══════════════════════════════════════════════════════
Write-Host "4️⃣  Waiting for cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host "   ✅ Ready" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════
# Step 5: Summary
# ═══════════════════════════════════════════════════════
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Cleanup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now start the frontend with:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Or use the start script:" -ForegroundColor Yellow
Write-Host "   .\start-frontend.ps1" -ForegroundColor White
Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
