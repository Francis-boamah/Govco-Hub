@echo off
REM Govco Hub API Test Script
REM Tests all PHP API endpoints

setlocal enabledelayedexpansion
cd /d "c:\Users\oakye\Desktop\Govco Hub"

echo.
echo ======================================================
echo GOVCO HUB API ENDPOINT TEST
echo ======================================================
echo.

REM Step 1: Install composer dependencies
echo [1/4] Installing Composer dependencies...
call composer install 2>nul
if %errorlevel% equ 0 (
    echo ✓ Composer dependencies installed
) else (
    echo ✗ Composer failed to install (may already be installed)
)

REM Step 2: Initialize database
echo.
echo [2/4] Initializing database...
php setup.php

REM Step 3: Start PHP server in background
echo.
echo [3/4] Starting PHP development server on localhost:8000...
start /B php -S localhost:8000 > nul 2>&1
timeout /t 3 /nobreak > nul
echo ✓ Server started on localhost:8000

echo.
echo ======================================================
echo TESTING ENDPOINTS
echo ======================================================
echo.

REM Test 1: Health check
echo Test 1: Health Check (/api/health)
curl -s http://localhost:8000/api/health
echo.
echo.

REM Test 2: Get products
echo Test 2: Get Products (/api/products)
curl -s http://localhost:8000/api/products
echo.
echo.

REM Test 3: Check file exists
echo Test 3: Check File Exists (/api/check-file)
curl -s "http://localhost:8000/api/check-file?courseCode=CS101&level=100&semester=1"
echo.
echo.

REM Test 4: Create order (expected to fail - product doesn't exist)
echo Test 4: Create Order (/api/orders - POST)
curl -s -X POST http://localhost:8000/api/orders ^
  -H "Content-Type: application/json" ^
  -d "{\"customerName\":\"Test User\",\"customerEmail\":\"test@example.com\",\"customerPhone\":\"0547482391\",\"house\":\"Hall A\",\"room\":\"205\",\"notes\":\"Test order\",\"items\":[{\"productId\":\"test-id\",\"qty\":1}]}"
echo.
echo.

REM Test 5: Get orders
echo Test 5: Get Orders (/api/orders - GET)
curl -s http://localhost:8000/api/orders
echo.
echo.

REM Test 6: 404 error handling
echo Test 6: 404 Error Handling (/api/nonexistent)
curl -s http://localhost:8000/api/nonexistent
echo.
echo.

REM Stop server - find and kill php process
echo Stopping server...
taskkill /FI "IMAGENAME eq php.exe" /F 2>nul
timeout /t 1 /nobreak > nul
echo ✓ Server stopped

echo.
echo ======================================================
echo TEST COMPLETE
echo ======================================================
echo.

endlocal
