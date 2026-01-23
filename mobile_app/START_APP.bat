@echo off
echo ============================================
echo ReadyRoad - Starting Application
echo ============================================
echo.

REM Check if Backend is running
echo [1/3] Checking Backend...
powershell -Command "Test-NetConnection -ComputerName localhost -Port 8888 -InformationLevel Quiet" > nul 2>&1
if %errorlevel% neq 0 (
    echo Backend NOT running!
    echo Starting Backend...
    start "ReadyRoad Backend" cmd /k "cd /d %~dp0..\ && mvnw.cmd spring-boot:run"
    echo Waiting 20 seconds for Backend to start...
    timeout /t 20 /nobreak
) else (
    echo Backend is RUNNING on Port 8888
)

echo.
echo [2/3] Opening Application...
start "" "%~dp0build\web\index.html"

echo.
echo [3/3] Opening Launcher Page...
start "" "%~dp0LAUNCHER.html"

echo.
echo ============================================
echo Done! Application is now running!
echo ============================================
echo.
echo Backend: http://localhost:8888
echo Frontend: Check your browser
echo.
echo Press any key to exit...
pause > nul

