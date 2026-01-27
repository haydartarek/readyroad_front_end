# 🧪 Test Backend JWT Fix
# This script tests if JWT authentication is working correctly

Write-Host "🧪 Testing Backend JWT Authentication..." -ForegroundColor Cyan
Write-Host ""

# Test login first
Write-Host "1️⃣ Testing Login..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8890/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"username":"test","password":"test123"}' `
    -ErrorAction Stop

$token = $loginResponse.token
Write-Host "✅ Login successful! Token received" -ForegroundColor Green
Write-Host "Token (first 50 chars): $($token.Substring(0, [Math]::Min(50, $token.Length)))..." -ForegroundColor Gray
Write-Host ""

# Test /api/users/me
Write-Host "2️⃣ Testing /api/users/me with JWT token..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Accept" = "application/json"
    }
    
    $userResponse = Invoke-RestMethod -Uri "http://localhost:8890/api/users/me" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✅ Success! User data retrieved:" -ForegroundColor Green
    Write-Host ""
    Write-Host "👤 User Information:" -ForegroundColor Cyan
    Write-Host "   ID: $($userResponse.id)"
    Write-Host "   Username: $($userResponse.username)"
    Write-Host "   Email: $($userResponse.email)"
    Write-Host "   First Name: $($userResponse.firstName)"
    Write-Host "   Last Name: $($userResponse.lastName)"
    Write-Host ""
    Write-Host "🎉 JWT Authentication is working correctly!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Failed! Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Please check:" -ForegroundColor Yellow
    Write-Host "   1. Backend is running on http://localhost:8890"
    Write-Host "   2. JwtAuthenticationFilter.java is updated with the fix"
    Write-Host "   3. Spring Boot application has been restarted"
    Write-Host "   4. Check backend logs for errors"
    Write-Host ""
    Write-Host "📝 Expected backend logs after fix:" -ForegroundColor Cyan
    Write-Host "   ✅ Username extracted from JWT: test"
    Write-Host "   ✅ UserDetails loaded successfully"
    Write-Host "   ✅ Authentication set in SecurityContext for user: test"
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Gray
