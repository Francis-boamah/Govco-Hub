<?php
/**
 * Govco Hub - Setup Script
 * Initialize database and create tables
 * 
 * Usage: php setup.php
 */

// Database configuration for setup
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'govco_hub');

echo "=== Govco Hub Database Setup ===\n\n";

// Step 1: Create database if it doesn't exist
try {
    $adminPdo = new PDO(
        "mysql:host=" . DB_HOST . ";charset=utf8mb4",
        DB_USER,
        DB_PASS
    );
    
    $adminPdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
    echo "[✓] Database created or already exists\n";
    
} catch (PDOException $e) {
    die("[✗] Failed to create database: " . $e->getMessage() . "\n");
}

// Step 2: Connect to the database
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "[✓] Connected to database\n\n";
} catch (PDOException $e) {
    die("[✗] Failed to connect to database: " . $e->getMessage() . "\n");
}

// Step 3: Read and execute SQL schema
$schemaFile = __DIR__ . '/database.sql';
if (!file_exists($schemaFile)) {
    die("[✗] database.sql not found in " . __DIR__ . "\n");
}

$sql = file_get_contents($schemaFile);
$statements = array_filter(array_map('trim', explode(';', $sql)), function($s) {
    return !empty($s) && !str_starts_with(trim($s), '--');
});

$count = 0;
foreach ($statements as $statement) {
    try {
        $pdo->exec($statement . ';');
        $count++;
    } catch (PDOException $e) {
        echo "[✗] Error executing statement: " . $e->getMessage() . "\n";
        echo "Statement: " . substr($statement, 0, 100) . "...\n";
    }
}

echo "[✓] Created " . $count . " tables\n\n";

// Step 4: Insert sample data (optional)
try {
    $pdo->exec("INSERT IGNORE INTO products (id, name, description, price, quantity_available) VALUES
        (UUID(), 'Water', '500ml bottled water', 1.50, 100),
        (UUID(), 'Coffee', 'Hot brewed coffee', 2.00, 50),
        (UUID(), 'Snacks Pack', 'Mixed snacks (chips, biscuits)', 5.00, 75),
        (UUID(), 'Energy Drink', '330ml energy drink', 3.00, 60)
    ");
    echo "[✓] Inserted sample products\n";
} catch (PDOException $e) {
    // Products might already exist
    echo "[ℹ] Products may already exist (or error: " . $e->getMessage() . ")\n";
}

echo "\n=== Setup Complete ===\n";
echo "Database: " . DB_NAME . "\n";
echo "Host: " . DB_HOST . "\n\n";
echo "Next steps:\n";
echo "1. Edit config.php to match your database credentials\n";
echo "2. Install PHPMailer: composer require phpmailer/phpmailer\n";
echo "3. Set GMAIL_EMAIL and GMAIL_PASSWORD environment variables\n";
echo "4. Test API: php -S localhost:8000\n";
