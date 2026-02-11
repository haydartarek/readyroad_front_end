# ReadyRoad Frontend - Direct Start Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ReadyRoad Frontend - Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set Node.js paths directly
$env:Path = "C:\Program Files\nodejs;$env:Path"

# Navigate to project
Set-Location "C:\Users\heyde\Desktop\end_project\readyroad_front_end\web_app"

# Check if node_modules exists
if (Test-Path "node_modules") {
    Write-Host "Dependencies already installed" -ForegroundColor Green
} else {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    & "C:\Program Files\nodejs\npm.cmd" install
    Write-Host "Dependencies installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Development Server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:8890" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000 (starting...)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Cyan
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: Admin2026Secure!" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start development server
& "C:\Program Files\nodejs\npm.cmd" run dev
