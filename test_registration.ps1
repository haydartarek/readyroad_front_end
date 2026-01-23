# Test Registration Script for ReadyRoad
# Usage: .\test_registration.ps1

Write-Host "`n🧪 Testing ReadyRoad Registration API" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Configuration
$apiUrl = "http://localhost:8890/api/auth/register"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Test user data
$testUser = @{
    username = "testuser_$timestamp"
    email = "test_${timestamp}@example.com"
    password = "SecurePass123!"
    fullName = "Test User $timestamp"
} | ConvertTo-Json

Write-Host "`n📋 Test Data:" -ForegroundColor Yellow
Write-Host $testUser -ForegroundColor White

Write-Host "`n🌐 Endpoint: $apiUrl" -ForegroundColor Yellow

# Check if backend is running
Write-Host "`n🔍 Checking if backend is running..." -ForegroundColor Cyan
$backendRunning = Test-NetConnection -ComputerName localhost -Port 8890 -WarningAction SilentlyContinue -InformationLevel Quiet

if (-not $backendRunning) {
    Write-Host "❌ Backend is NOT running on port 8890!" -ForegroundColor Red
    Write-Host "   Please start backend first:" -ForegroundColor Yellow
    Write-Host "   cd C:\Users\fqsdg\Desktop\end_project\readyroad" -ForegroundColor White
    Write-Host "   .\mvnw.cmd spring-boot:run`n" -ForegroundColor White
    exit 1
}

Write-Host "✅ Backend is running on port 8890" -ForegroundColor Green

# Send registration request
Write-Host "`n📤 Sending registration request..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $apiUrl `
                                  -Method POST `
                                  -Body $testUser `
                                  -ContentType "application/json" `
                                  -ErrorAction Stop
    
    Write-Host "`n✅ Registration Successful!" -ForegroundColor Green
    Write-Host "=" * 60 -ForegroundColor Gray
    
    Write-Host "`n📊 Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor White
    
    if ($response.token) {
        Write-Host "`n🔑 JWT Token Received:" -ForegroundColor Green
        Write-Host $response.token.Substring(0, 50) + "..." -ForegroundColor Gray
    }
    
    if ($response.user) {
        Write-Host "`n👤 User Details:" -ForegroundColor Green
        Write-Host "   ID: $($response.user.id)" -ForegroundColor White
        Write-Host "   Username: $($response.user.username)" -ForegroundColor White
        Write-Host "   Email: $($response.user.email)" -ForegroundColor White
        Write-Host "   Full Name: $($response.user.fullName)" -ForegroundColor White
    }
    
    Write-Host "`n✅ Test PASSED!" -ForegroundColor Green
    Write-Host "=" * 60 -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "`n❌ Registration Failed!" -ForegroundColor Red
    Write-Host "=" * 60 -ForegroundColor Gray
    
    Write-Host "`n📊 Error Details:" -ForegroundColor Yellow
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Response Body:" -ForegroundColor Yellow
            Write-Host "   $responseBody" -ForegroundColor White
        } catch {
            Write-Host "   Could not read response body" -ForegroundColor Gray
        }
    }
    
    Write-Host "`n   Error Message:" -ForegroundColor Yellow
    Write-Host "   $($_.Exception.Message)" -ForegroundColor White
    
    Write-Host "`n🔍 Troubleshooting:" -ForegroundColor Cyan
    Write-Host "   1. Check backend console logs" -ForegroundColor White
    Write-Host "   2. Verify database is running" -ForegroundColor White
    Write-Host "   3. Check JWT configuration" -ForegroundColor White
    Write-Host "   4. Verify CORS settings" -ForegroundColor White
    
    Write-Host "`n❌ Test FAILED!" -ForegroundColor Red
    Write-Host "=" * 60 -ForegroundColor Gray
    Write-Host ""
    
    exit 1
}

# Additional test: Try to login with the registered user
Write-Host "`n🧪 Testing Login with Registered User..." -ForegroundColor Cyan

$loginData = @{
    username = ($testUser | ConvertFrom-Json).username
    password = ($testUser | ConvertFrom-Json).password
} | ConvertTo-Json

$loginUrl = "http://localhost:8890/api/auth/login"

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl `
                                       -Method POST `
                                       -Body $loginData `
                                       -ContentType "application/json" `
                                       -ErrorAction Stop
    
    Write-Host "✅ Login Successful!" -ForegroundColor Green
    Write-Host "   Token received and user can authenticate" -ForegroundColor White
    
} catch {
    Write-Host "⚠️ Login Test Failed (but registration worked)" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host "`n🎯 Test Complete!" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""
