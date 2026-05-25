<?php
/**
 * Orders API Endpoints
 * Handle order creation, retrieval, and email notifications
 */

require_once __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function createOrder($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    $required = ['customerName', 'customerEmail', 'customerPhone', 'house', 'room', 'items'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            respondError("Missing required field: {$field}", 400);
        }
    }

    $items = $data['items'];
    if (!is_array($items) || empty($items)) {
        respondError('Items must be a non-empty array', 400);
    }

    try {
        $pdo->beginTransaction();

        $calculatedTotal = 0;
        $orderItems = [];

        // Fetch each product and validate
        foreach ($items as $item) {
            if (!isset($item['productId']) || !isset($item['qty'])) {
                throw new Exception('Each item must have productId and qty');
            }

            $stmt = $pdo->prepare('SELECT id, name, price FROM products WHERE id = ?');
            $stmt->execute([$item['productId']]);
            $product = $stmt->fetch();

            if (!$product) {
                throw new Exception("Product with ID {$item['productId']} not found");
            }

            $qty = intval($item['qty']) ?: 1;
            $calculatedTotal += $product['price'] * $qty;

            $orderItems[] = [
                'productId' => $item['productId'],
                'productName' => $product['name'],
                'qty' => $qty,
                'unitPrice' => $product['price']
            ];
        }

        // Create order
        $orderId = generateUUID();
        $stmt = $pdo->prepare('
            INSERT INTO orders (id, customer_name, customer_email, customer_phone, house, room, notes, total, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $orderId,
            $data['customerName'],
            $data['customerEmail'],
            $data['customerPhone'],
            $data['house'],
            $data['room'],
            $data['notes'] ?? '',
            $calculatedTotal,
            'pending'
        ]);

        // Add order items
        $itemStmt = $pdo->prepare('
            INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price)
            VALUES (?, ?, ?, ?, ?, ?)
        ');

        foreach ($orderItems as $orderItem) {
            $itemStmt->execute([
                generateUUID(),
                $orderId,
                $orderItem['productId'],
                $orderItem['productName'],
                $orderItem['qty'],
                $orderItem['unitPrice']
            ]);
        }

        $pdo->commit();

        // Send confirmation email
        sendOrderConfirmationEmail(
            $data['customerName'],
            $data['customerEmail'],
            $orderId,
            $orderItems,
            $calculatedTotal,
            $data['house'],
            $data['room'],
            $data['customerPhone'],
            $data['notes'] ?? ''
        );

        respondSuccess([
            'ok' => true,
            'orderId' => $orderId,
            'total' => $calculatedTotal
        ], 201);

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log('Order creation error: ' . $e->getMessage());
        respondError('Failed to create order: ' . $e->getMessage(), 500);
    }
}

function getOrders($pdo) {
    try {
        $stmt = $pdo->prepare('
            SELECT id, customer_name, customer_email, total, status, created_at
            FROM orders
            ORDER BY created_at DESC
            LIMIT 100
        ');
        $stmt->execute();
        $orders = $stmt->fetchAll();
        respondSuccess(['orders' => $orders]);
    } catch (Exception $e) {
        error_log('Orders fetch error: ' . $e->getMessage());
        respondError('Failed to fetch orders', 500);
    }
}

function getOrder($pdo, $orderId) {
    try {
        $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();

        if (!$order) {
            respondError('Order not found', 404);
        }

        // Fetch order items
        $stmt = $pdo->prepare('SELECT product_name, quantity, unit_price FROM order_items WHERE order_id = ?');
        $stmt->execute([$orderId]);
        $order['items'] = $stmt->fetchAll();

        respondSuccess(['order' => $order]);
    } catch (Exception $e) {
        error_log('Order fetch error: ' . $e->getMessage());
        respondError('Failed to fetch order', 500);
    }
}

function sendOrderConfirmationEmail($customerName, $customerEmail, $orderId, $orderItems, $total, $house, $room, $phone, $notes) {
    if (!MAIL_USER || !MAIL_PASS) {
        error_log('Email not configured (GMAIL_EMAIL/GMAIL_PASSWORD not set)');
        return;
    }

    try {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = MAIL_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = MAIL_USER;
        $mail->Password = MAIL_PASS;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = MAIL_PORT;

        $mail->setFrom(MAIL_USER, MAIL_FROM_NAME);
        $mail->addAddress($customerEmail, $customerName);
        $mail->addCC(MAIL_USER);

        $mail->isHTML(false);
        $mail->Subject = "GOVCO Hub Order Confirmation - #{$orderId}";

        $itemsText = implode("\n", array_map(function ($item) {
            return "- {$item['productName']} x {$item['qty']} (GHS " . number_format($item['unitPrice'], 2) . " each)";
        }, $orderItems));

        $mail->Body = <<<EOT
Hello {$customerName},

Thank you for your order! We will deliver it to your room shortly.

Order Details:
Order ID: {$orderId}
Delivery Address: House: {$house}, Room: {$room}
Phone: {$phone}
Notes: {$notes}

Items Ordered:
{$itemsText}

Total: GHS {$total}

If you have any questions, please contact us at 0547482391 or francisboamah338@gmail.com.

Best regards,
GOVCO Hub Team
EOT;

        $mail->send();
    } catch (Exception $e) {
        error_log('Email send error: ' . $e->getMessage());
    }
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
