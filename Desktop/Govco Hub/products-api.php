<?php
/**
 * Products API Endpoints
 * Fetch products from database
 */

function getProducts($pdo) {
    try {
        $stmt = $pdo->prepare('SELECT id, name, description, price, image_url, quantity_available FROM products ORDER BY name');
        $stmt->execute();
        $products = $stmt->fetchAll();
        respondSuccess(['products' => $products]);
    } catch (Exception $e) {
        error_log('Products fetch error: ' . $e->getMessage());
        respondError('Failed to fetch products', 500);
    }
}

function getProduct($pdo, $productId) {
    try {
        $stmt = $pdo->prepare('SELECT id, name, description, price, image_url, quantity_available FROM products WHERE id = ?');
        $stmt->execute([$productId]);
        $product = $stmt->fetch();

        if (!$product) {
            respondError('Product not found', 404);
        }

        respondSuccess(['product' => $product]);
    } catch (Exception $e) {
        error_log('Product fetch error: ' . $e->getMessage());
        respondError('Failed to fetch product', 500);
    }
}

function createProduct($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['name']) || empty($data['price']) || empty($data['description'])) {
        respondError('Product name, price, and description are required', 400);
    }

    $imageUrl = null;
    if (!empty($data['imageBase64'])) {
        $imageUrl = saveBase64Image($data['imageBase64'], 'product');
    }

    try {
        $stmt = $pdo->prepare('INSERT INTO products (id, name, description, price, image_url, quantity_available) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            generateUUID(),
            $data['name'],
            $data['description'],
            floatval($data['price']),
            $imageUrl,
            intval($data['quantity_available'] ?? 0)
        ]);
        respondSuccess(['ok' => true], 201);
    } catch (Exception $e) {
        error_log('Product create error: ' . $e->getMessage());
        respondError('Failed to create product', 500);
    }
}

function updateProduct($pdo, $productId) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['name']) || empty($data['price']) || empty($data['description'])) {
        respondError('Product name, price, and description are required', 400);
    }

    $imageUrl = null;
    if (!empty($data['imageBase64'])) {
        $imageUrl = saveBase64Image($data['imageBase64'], 'product');
    }

    try {
        $fields = [
            'name' => $data['name'],
            'description' => $data['description'],
            'price' => floatval($data['price']),
            'quantity_available' => intval($data['quantity_available'] ?? 0)
        ];

        $sql = 'UPDATE products SET name = :name, description = :description, price = :price, quantity_available = :quantity_available';
        if ($imageUrl) {
            $sql .= ', image_url = :image_url';
            $fields['image_url'] = $imageUrl;
        }
        $sql .= ' WHERE id = :id';
        $fields['id'] = $productId;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($fields);

        respondSuccess(['ok' => true]);
    } catch (Exception $e) {
        error_log('Product update error: ' . $e->getMessage());
        respondError('Failed to update product', 500);
    }
}

function deleteProduct($pdo, $productId) {
    try {
        $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
        $stmt->execute([$productId]);
        respondSuccess(['ok' => true]);
    } catch (Exception $e) {
        error_log('Product delete error: ' . $e->getMessage());
        respondError('Failed to delete product', 500);
    }
}

function saveBase64Image($base64, $prefix = 'upload') {
    if (!preg_match('/^data:image\/([a-zA-Z]+);base64,/', $base64, $matches)) {
        throw new Exception('Invalid image data');
    }

    $imageType = strtolower($matches[1]);
    $data = substr($base64, strpos($base64, ',') + 1);
    $decoded = base64_decode($data);
    if ($decoded === false) {
        throw new Exception('Failed to decode image data');
    }

    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }

    $extension = $imageType === 'jpeg' ? 'jpg' : $imageType;
    $fileName = sprintf('%s_%s.%s', $prefix, bin2hex(random_bytes(8)), $extension);
    $filePath = UPLOAD_DIR . $fileName;
    file_put_contents($filePath, $decoded);

    return 'uploads/' . $fileName;
}

function generateUUID() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
