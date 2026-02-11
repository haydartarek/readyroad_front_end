# ═══════════════════════════════════════════════════════
# ReadyRoad Web Frontend - Startup Script
# ═══════════════════════════════════════════════════════

Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎨 ReadyRoad Web Frontend - Setup & Start" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Navigate to web_app directory
$webAppPath = "C:\Users\heyde\Desktop\end_project\readyroad_front_end\web_app"
Set-Location $webAppPath

# 1. Check project files
Write-Host "📋 Checking Project Files..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "package.json") {
    Write-Host "   ✅ package.json found" -ForegroundColor Green
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "      Project: $($pkg.name)" -ForegroundColor Gray
    Write-Host "      Version: $($pkg.version)" -ForegroundColor Gray
    Write-Host "      Next.js: $($pkg.dependencies.next)" -ForegroundColor Gray
} else {
    Write-Host "   ❌ package.json not found!" -ForegroundColor Red
    exit 1
}

# 2. Check environment variables
Write-Host ""
Write-Host "🔧 Checking Environment Configuration..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path ".env.local") {
    Write-Host "   ✅ .env.local found" -ForegroundColor Green
    $envContent = Get-Content ".env.local"
    foreach ($line in $envContent) {
        if ($line -match "NEXT_PUBLIC_API_URL") {
            Write-Host "      $line" -ForegroundColor Gray
        }
        if ($line -match "NEXT_PUBLIC_APP_URL") {
            Write-Host "      $line" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "   ⚠️  .env.local not found, creating default..." -ForegroundColor Yellow
    $defaultEnv = @"
# ReadyRoad Next.js Development Environment Configuration
# Backend API URL (Spring Boot running locally)
NEXT_PUBLIC_API_URL=http://localhost:8890

# Frontend Application URL (Next.js dev server)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT Secret for development (DO NOT use this in production)
JWT_SECRET=dev-secret-readyroad-2026-change-in-production
"@
    Set-Content ".env.local" $defaultEnv -Encoding UTF8
    Write-Host "   ✅ Created .env.local with default values" -ForegroundColor Green
}

# 3. Check node_modules
Write-Host ""
Write-Host "📦 Checking Dependencies..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules folder exists" -ForegroundColor Green
    Write-Host "      Dependencies already installed" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  node_modules not found" -ForegroundColor Yellow
    Write-Host "   📦 Installing dependencies (this may take 2-3 minutes)..." -ForegroundColor Yellow
    npm install
    Write-Host "   ✅ Dependencies installed successfully" -ForegroundColor Green
}

# 4. Check if backend is running
Write-Host ""
Write-Host "🔌 Checking Backend Connection..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8890/actuator/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "   ✅ Backend is running on http://localhost:8890" -ForegroundColor Green
    Write-Host "      Health Status: UP" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠️  Backend is NOT running on http://localhost:8890" -ForegroundColor Yellow
    Write-Host "      Please start the backend first:" -ForegroundColor Gray
    Write-Host "      cd C:\Users\heyde\Desktop\end_project\readyroad" -ForegroundColor Gray
    Write-Host "      .\QUICK-RUN.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Frontend will still start, but API calls will fail." -ForegroundColor Yellow
    Write-Host ""
}

# 5. Display project structure
Write-Host ""
Write-Host "📂 Project Structure:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Routes available:" -ForegroundColor Gray
Write-Host "   ├─ / (Homepage)" -ForegroundColor Cyan
Write-Host "   ├─ /login (Authentication)" -ForegroundColor Cyan
Write-Host "   ├─ /register (Registration)" -ForegroundColor Cyan
Write-Host "   ├─ /dashboard (Protected)" -ForegroundColor Green
Write-Host "   ├─ /exam (Protected)" -ForegroundColor Green
Write-Host "   ├─ /practice (Protected)" -ForegroundColor Green
Write-Host "   ├─ /progress (Protected)" -ForegroundColor Green
Write-Host "   ├─ /analytics (Protected)" -ForegroundColor Green
Write-Host "   ├─ /profile (Protected)" -ForegroundColor Green
Write-Host "   ├─ /lessons (Public)" -ForegroundColor Cyan
Write-Host "   ├─ /traffic-signs (Public)" -ForegroundColor Cyan
Write-Host "   └─ /admin (Admin Only)" -ForegroundColor Magenta

# 6. Display testing credentials
Write-Host ""
Write-Host "🔐 Testing Credentials:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Username: admin" -ForegroundColor Green
Write-Host "   Password: Admin2026Secure!" -ForegroundColor Green

# 7. Display URLs
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8890" -ForegroundColor Cyan
Write-Host "   Swagger:  http://localhost:8890/swagger-ui.html" -ForegroundColor Cyan

# 8. Start development server
Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 Starting Next.js Development Server..." -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Opening browser in 5 seconds..." -ForegroundColor Gray
Write-Host ""

# Start the dev server
npm run dev
