<?php
/**
 * Govco Hub - Main API Router
 * Handles all API requests
 */

require_once __DIR__ . '/config.php';

// Parse URL and route to appropriate handler
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove base path if needed
$basePath = '/api';
if (strpos($requestPath, $basePath) === 0) {
    $requestPath = substr($requestPath, strlen($basePath));
}

// Clean path
$requestPath = trim($requestPath, '/');
$pathParts = explode('/', $requestPath);

// Route dispatcher
try {
    if (empty($requestPath)) {
        respondJSON(['message' => 'Govco Hub API v' . API_VERSION, 'endpoints' => [
            '/api/check-file/:courseCode',
            '/api/download/:courseCode',
            '/api/products',
            '/api/orders (POST)',
        ]]);
    }

    // Past Questions Routes
    if ($pathParts[0] === 'check-file' && $requestMethod === 'GET') {
        require_once __DIR__ . '/past-questions-api.php';
        checkFileExists($pdo);
    } elseif ($pathParts[0] === 'download' && $requestMethod === 'GET') {
        require_once __DIR__ . '/past-questions-api.php';
        downloadFile($pdo);
    }

    // Products Routes
    elseif ($pathParts[0] === 'products' && count($pathParts) === 1 && $requestMethod === 'GET') {
        require_once __DIR__ . '/products-api.php';
        getProducts($pdo);
    } elseif ($pathParts[0] === 'products' && count($pathParts) === 2 && $requestMethod === 'GET') {
        require_once __DIR__ . '/products-api.php';
        getProduct($pdo, $pathParts[1]);
    } elseif ($pathParts[0] === 'products' && $requestMethod === 'POST') {
        require_once __DIR__ . '/products-api.php';
        createProduct($pdo);
    } elseif ($pathParts[0] === 'products' && count($pathParts) === 2 && $requestMethod === 'PUT') {
        require_once __DIR__ . '/products-api.php';
        updateProduct($pdo, $pathParts[1]);
    } elseif ($pathParts[0] === 'products' && count($pathParts) === 2 && $requestMethod === 'DELETE') {
        require_once __DIR__ . '/products-api.php';
        deleteProduct($pdo, $pathParts[1]);
    }

    // Orders Routes
    elseif ($pathParts[0] === 'orders' && $requestMethod === 'POST') {
        require_once __DIR__ . '/orders-api.php';
        createOrder($pdo);
    } elseif ($pathParts[0] === 'orders' && $requestMethod === 'GET') {
        require_once __DIR__ . '/orders-api.php';
        getOrders($pdo);
    } elseif ($pathParts[0] === 'orders' && count($pathParts) === 2 && $requestMethod === 'GET') {
        require_once __DIR__ . '/orders-api.php';
        getOrder($pdo, $pathParts[1]);
    }

    // Admin Routes
    elseif ($pathParts[0] === 'admin' && isset($pathParts[1]) && $pathParts[1] === 'courses' && $requestMethod === 'GET') {
        require_once __DIR__ . '/admin-api.php';
        getCourses($pdo);
    } elseif ($pathParts[0] === 'admin' && isset($pathParts[1]) && $pathParts[1] === 'courses' && $requestMethod === 'POST') {
        require_once __DIR__ . '/admin-api.php';
        createCourse($pdo);
    } elseif ($pathParts[0] === 'admin' && isset($pathParts[1]) && $pathParts[1] === 'courses' && count($pathParts) === 3 && $requestMethod === 'DELETE') {
        require_once __DIR__ . '/admin-api.php';
        deleteCourse($pdo, $pathParts[2]);
    } elseif ($pathParts[0] === 'admin' && isset($pathParts[1]) && $pathParts[1] === 'news' && $requestMethod === 'GET') {
        require_once __DIR__ . '/admin-api.php';
        getNews($pdo);
    } elseif ($pathParts[0] === 'admin' && isset($pathParts[1]) && $pathParts[1] === 'news' && $requestMethod === 'POST') {
        require_once __DIR__ . '/admin-api.php';
        createNews($pdo);
    } elseif ($pathParts[0] === 'admin' && isset($pathParts[1]) && $pathParts[1] === 'news' && count($pathParts) === 3 && $requestMethod === 'DELETE') {
        require_once __DIR__ . '/admin-api.php';
        deleteNews($pdo, $pathParts[2]);
    }

    // Health check
    elseif ($pathParts[0] === 'health' && $requestMethod === 'GET') {
        respondSuccess(['status' => 'OK', 'timestamp' => date('c')]);
    }

    // Not found
    else {
        respondError('Endpoint not found', 404);
    }

} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    respondError('Internal server error', 500);
}
