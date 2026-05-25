<?php
/**
 * GOVCO Hub - Admin API Endpoints
 * Supports course metadata and news content for the admin dashboard.
 */

function getCourses($pdo) {
    try {
        $stmt = $pdo->prepare('SELECT id, course_code, level, semester, category, file_path, file_name, uploaded_at FROM past_questions ORDER BY uploaded_at DESC');
        $stmt->execute();
        $courses = $stmt->fetchAll();
        respondSuccess(['courses' => $courses]);
    } catch (Exception $e) {
        error_log('Courses fetch error: ' . $e->getMessage());
        respondError('Failed to fetch courses', 500);
    }
}

function createCourse($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    $required = ['courseCode', 'level', 'semester', 'pdfUrl'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            respondError(sprintf('Missing required field: %s', $field), 400);
        }
    }

    try {
        $stmt = $pdo->prepare('INSERT INTO past_questions (id, course_code, level, semester, category, file_path, file_name) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            generateUUID(),
            strtoupper(trim($data['courseCode'])),
            intval($data['level']),
            intval($data['semester']),
            trim($data['category'] ?? ''),
            trim($data['pdfUrl']),
            basename(parse_url(trim($data['pdfUrl']), PHP_URL_PATH) ?: trim($data['courseCode']))
        ]);

        respondSuccess(['ok' => true], 201);
    } catch (Exception $e) {
        error_log('Course create error: ' . $e->getMessage());
        respondError('Failed to create course entry', 500);
    }
}

function deleteCourse($pdo, $courseId) {
    try {
        $stmt = $pdo->prepare('DELETE FROM past_questions WHERE id = ?');
        $stmt->execute([$courseId]);
        respondSuccess(['ok' => true]);
    } catch (Exception $e) {
        error_log('Course delete error: ' . $e->getMessage());
        respondError('Failed to delete course entry', 500);
    }
}

function getNews($pdo) {
    try {
        $stmt = $pdo->prepare('SELECT id, title, body, image_url, created_at FROM news ORDER BY created_at DESC');
        $stmt->execute();
        $news = $stmt->fetchAll();
        respondSuccess(['news' => $news]);
    } catch (Exception $e) {
        error_log('News fetch error: ' . $e->getMessage());
        respondError('Failed to fetch news', 500);
    }
}

function createNews($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['title']) || empty($data['body'])) {
        respondError('News title and body are required', 400);
    }

    $imageUrl = null;
    if (!empty($data['imageBase64'])) {
        $imageUrl = saveBase64Image($data['imageBase64'], 'news');
    }

    try {
        $stmt = $pdo->prepare('INSERT INTO news (id, title, body, image_url) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            generateUUID(),
            trim($data['title']),
            trim($data['body']),
            $imageUrl
        ]);

        respondSuccess(['ok' => true], 201);
    } catch (Exception $e) {
        error_log('News create error: ' . $e->getMessage());
        respondError('Failed to publish news', 500);
    }
}

function deleteNews($pdo, $newsId) {
    try {
        $stmt = $pdo->prepare('DELETE FROM news WHERE id = ?');
        $stmt->execute([$newsId]);
        respondSuccess(['ok' => true]);
    } catch (Exception $e) {
        error_log('News delete error: ' . $e->getMessage());
        respondError('Failed to delete news item', 500);
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
        throw new Exception('Could not decode image data.');
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
