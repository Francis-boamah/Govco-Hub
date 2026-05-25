#!/bin/bash

# Govco Hub API Test Script
# This script sets up and tests all PHP API endpoints

BASE_DIR="c:/Users/oakye/Desktop/Govco Hub"
cd "$BASE_DIR" || exit 1

echo "======================================================"
echo "GOVCO HUB API ENDPOINT TEST"
echo "======================================================"
echo ""

# Step 1: Install composer dependencies
echo "[1/4] Installing Composer dependencies..."
composer install > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Composer dependencies installed"
else
    echo "✗ Composer failed to install"
fi

# Step 2: Initialize database
echo ""
echo "[2/4] Initializing database..."
php setup.php

# Step 3: Start PHP server in background
echo ""
echo "[3/4] Starting PHP development server on localhost:8000..."
php -S localhost:8000 > /dev/null 2>&1 &
SERVER_PID=$!
sleep 3
echo "✓ Server started (PID: $SERVER_PID)"

echo ""
echo "======================================================"
echo "TESTING ENDPOINTS"
echo "======================================================"
echo ""

# Test 1: Health check
echo "Test 1: Health Check (/api/health)"
curl -s http://localhost:8000/api/health | jq . || curl -s http://localhost:8000/api/health
echo ""

# Test 2: Get products
echo "Test 2: Get Products (/api/products)"
curl -s http://localhost:8000/api/products | jq . || curl -s http://localhost:8000/api/products
echo ""

# Test 3: Check file exists
echo "Test 3: Check File Exists (/api/check-file)"
curl -s "http://localhost:8000/api/check-file?courseCode=CS101&level=100&semester=1" | jq . || curl -s "http://localhost:8000/api/check-file?courseCode=CS101&level=100&semester=1"
echo ""

# Test 4: Create order
echo "Test 4: Create Order (/api/orders - POST)"
curl -s -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName":"Test User",
    "customerEmail":"test@example.com",
    "customerPhone":"0547482391",
    "house":"Hall A",
    "room":"205",
    "notes":"Test order",
    "items":[{"productId":"test-id","qty":1}]
  }' | jq . || echo "Order test failed (expected - product doesn't exist)"
echo ""

# Test 5: Get orders
echo "Test 5: Get Orders (/api/orders - GET)"
curl -s http://localhost:8000/api/orders | jq . || curl -s http://localhost:8000/api/orders
echo ""

# Test 6: 404 error handling
echo "Test 6: 404 Error Handling (/api/nonexistent)"
curl -s http://localhost:8000/api/nonexistent | jq . || curl -s http://localhost:8000/api/nonexistent
echo ""

# Stop server
echo "Stopping server..."
kill $SERVER_PID 2>/dev/null
sleep 1
echo "✓ Server stopped"

echo ""
echo "======================================================"
echo "TEST COMPLETE"
echo "======================================================"
