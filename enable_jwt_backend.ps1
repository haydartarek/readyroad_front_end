# 🔧 Enable JWT Authentication in Backend
# This script changes the Spring profile from 'dev' to 'secure'

Write-Host "🔧 Enabling JWT Authentication in Backend..." -ForegroundColor Cyan
Write-Host ""

$applicationYml = "C:\Users\heyde\Desktop\end_project\readyroad\src\main\resources\application.yml"

# Check if file exists
if (-not (Test-Path $applicationYml)) {
    Write-Host "❌ Error: application.yml not found at: $applicationYml" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Reading application.yml..." -ForegroundColor Yellow
$content = Get-Content $applicationYml -Raw

# Check current profile
if ($content -match "active:\s*dev") {
    Write-Host "✅ Found profile: dev (needs change)" -ForegroundColor Yellow
    
    # Replace 'dev' with 'secure'
    $newContent = $content -replace "active:\s*dev", "active: secure"
    
    # Backup original file
    $backupFile = "$applicationYml.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $applicationYml $backupFile
    Write-Host "💾 Backup created: $backupFile" -ForegroundColor Gray
    
    # Write new content
    Set-Content $applicationYml $newContent -NoNewline
    Write-Host "✅ Changed profile from 'dev' to 'secure'" -ForegroundColor Green
    
} elseif ($content -match "active:\s*secure") {
    Write-Host "✅ Profile is already set to 'secure'" -ForegroundColor Green
    
} else {
    Write-Host "⚠️  Could not find 'active:' line in application.yml" -ForegroundColor Yellow
    Write-Host "Please manually edit the file and set: spring.profiles.active: secure" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Restart the backend application" -ForegroundColor White
Write-Host "   cd C:\Users\heyde\Desktop\end_project\readyroad" -ForegroundColor Gray
Write-Host "   mvn spring-boot:run" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test JWT authentication with:" -ForegroundColor White
Write-Host "   cd C:\Users\heyde\Desktop\end_project\readyroad_front_end" -ForegroundColor Gray
Write-Host "   .\test_backend_jwt.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ JWT Authentication will now be enabled!" -ForegroundColor Green
