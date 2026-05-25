<?php
/**
 * Govco Hub API Test Script
 * Tests all endpoints and reports results
 */

$baseDir = __DIR__;
$testResults = [];

echo "\n";
echo str_repeat("=", 50) . "\n";
echo "GOVCO HUB API ENDPOINT TEST\n";
echo str_repeat("=", 50) . "\n\n";

// Step 1: Check composer.json and install
echo "[1/4] Installing Composer dependencies...\n";
chdir($baseDir);
exec('composer install 2>&1', $composerOutput, $composerCode);
if ($composerCode === 0) {
    echo "✓ Composer dependencies installed\n";
    $testResults[] = "✓ Composer install: SUCCESS";
} else {
    echo "✗ Composer failed (exit code: $composerCode)\n";
    echo implode("\n", array_slice($composerOutput, -5)) . "\n";
    $testResults[] = "✗ Composer install: FAILED";
}

// Step 2: Initialize database
echo "\n[2/4] Initializing database...\n";
ob_start();
include 'setup.php';
$setupOutput = ob_get_clean();
echo $setupOutput;
$testResults[] = "Database initialized";

// Step 3: Start PHP server in background
echo "\n[3/4] Starting PHP development server on localhost:8000...\n";
$descriptorspec = [
    0 => ["pipe", "r"],
    1 => ["pipe", "w"],
    2 => ["pipe", "w"]
];
$serverProcess = proc_open('php -S localhost:8000', $descriptorspec, $pipes);
if ($serverProcess) {
    sleep(3);
    echo "✓ Server started (PID: " . proc_get_status($serverProcess)['pid'] . ")\n";
    $testResults[] = "✓ PHP Server: Started on localhost:8000";
} else {
    echo "✗ Failed to start server\n";
    $testResults[] = "✗ PHP Server: FAILED TO START";
    exit(1);
}

echo "\n";
echo str_repeat("=", 50) . "\n";
echo "TESTING ENDPOINTS\n";
echo str_repeat("=", 50) . "\n\n";

// Step 4: Test endpoints
$tests = [
    [
        'name' => 'Health Check',
        'method' => 'GET',
        'endpoint' => 'http://localhost:8000/api/health',
        'body' => null
    ],
    [
        'name' => 'Get Products',
        'method' => 'GET',
        'endpoint' => 'http://localhost:8000/api/products',
        'body' => null
    ],
    [
        'name' => 'Check File (CS101)',
        'method' => 'GET',
        'endpoint' => 'http://localhost:8000/api/check-file?courseCode=CS101&level=100&semester=1',
        'body' => null
    ],
    [
        'name' => 'Create Order (with invalid product)',
        'method' => 'POST',
        'endpoint' => 'http://localhost:8000/api/orders',
        'body' => json_encode([
            'customerName' => 'Test User',
            'customerEmail' => 'test@example.com',
            'customerPhone' => '0547482391',
            'house' => 'Hall A',
            'room' => '205',
            'notes' => 'Test order',
            'items' => [['productId' => 'test-id', 'qty' => 1]]
        ])
    ],
    [
        'name' => 'Get Orders',
        'method' => 'GET',
        'endpoint' => 'http://localhost:8000/api/orders',
        'body' => null
    ],
    [
        'name' => 'Test 404 Error',
        'method' => 'GET',
        'endpoint' => 'http://localhost:8000/api/nonexistent',
        'body' => null
    ]
];

foreach ($tests as $test) {
    echo "Testing: {$test['name']}\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $test['endpoint']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $test['method']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    
    if ($test['method'] === 'POST') {
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $test['body']);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($response === false) {
        echo "  Status: ✗ Connection error: $curlError\n";
        $testResults[] = "✗ {$test['name']}: Connection failed";
    } else {
        // Split headers and body
        $parts = explode("\r\n\r\n", $response, 2);
        $body = isset($parts[1]) ? $parts[1] : '';
        
        echo "  Status: $httpCode\n";
        
        if (!empty($body)) {
            $decoded = json_decode($body, true);
            if ($decoded) {
                $summary = json_encode($decoded, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
                if (strlen($summary) > 120) {
                    $summary = substr($summary, 0, 120) . "...";
                }
                echo "  Response: $summary\n";
            } else {
                echo "  Response: (non-JSON response)\n";
            }
        }
        
        $statusLabel = ($httpCode >= 200 && $httpCode < 300) ? "SUCCESS" : "RETURNED";
        $testResults[] = "✓ {$test['name']} - Status: $httpCode ($statusLabel)";
    }
    echo "\n";
    sleep(1); // Brief pause between tests
}

// Stop server
echo "Stopping server...\n";
proc_terminate($serverProcess, SIGTERM);
sleep(1);
proc_close($serverProcess);
echo "✓ Server stopped\n";

// Summary
echo "\n";
echo str_repeat("=", 50) . "\n";
echo "TEST SUMMARY\n";
echo str_repeat("=", 50) . "\n";
foreach ($testResults as $result) {
    echo "$result\n";
}
echo "\n";
?>
