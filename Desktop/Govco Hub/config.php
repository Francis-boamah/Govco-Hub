<?php
/**
 * Govco Hub - Configuration
 * Database, email, and app settings
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'govco_hub');

// Email Configuration (Gmail SMTP)
define('MAIL_HOST', 'smtp.gmail.com');
define('MAIL_PORT', 587);
define('MAIL_USER', getenv('GMAIL_EMAIL') ?: '');
define('MAIL_PASS', getenv('GMAIL_PASSWORD') ?: '');
define('MAIL_FROM', 'noreply@govcohub.local');
define('MAIL_FROM_NAME', 'GOVCO Hub');

// App Settings
define('APP_NAME', 'GOVCO Hub');
define('APP_URL', getenv('APP_URL') ?: 'http://localhost');
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('PASTQUESTIONS_DIR', __DIR__ . '/Pastquestions/');

// API Response Format
define('CORS_ORIGIN', '*');
define('API_VERSION', '1.0');

// Database Connection
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}

// CORS Headers
header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Helper Functions
function respondJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function respondError($message, $statusCode = 400) {
    respondJSON(['error' => $message], $statusCode);
}

function respondSuccess($data = [], $statusCode = 200) {
    $response = array_merge(['ok' => true], $data);
    respondJSON($response, $statusCode);
}
