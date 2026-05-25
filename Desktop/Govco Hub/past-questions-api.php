<?php
/**
 * Past Questions API Endpoints
 * Handles file checking and downloading
 */

function checkFileExists($pdo) {
    $courseCode = $_GET['courseCode'] ?? null;
    $level = $_GET['level'] ?? null;
    $semester = $_GET['semester'] ?? null;
    $category = $_GET['category'] ?? null;

    if (!$courseCode || !$level || !$semester) {
        respondError('Missing required parameters: courseCode, level, semester', 400);
    }

    $filePath = buildPastQuestionPath($courseCode, $level, $semester, $category);

    $exists = file_exists($filePath);
    respondSuccess([
        'exists' => $exists,
        'courseCode' => $courseCode,
        'level' => $level,
        'semester' => $semester
    ]);
}

function downloadFile($pdo) {
    $courseCode = $_GET['courseCode'] ?? null;
    $level = $_GET['level'] ?? null;
    $semester = $_GET['semester'] ?? null;
    $category = $_GET['category'] ?? null;

    if (!$courseCode || !$level || !$semester) {
        respondError('Missing required parameters: courseCode, level, semester', 400);
    }

    $filePath = buildPastQuestionPath($courseCode, $level, $semester, $category);

    // Security check: ensure file is within pastquestions directory
    $realPath = realpath($filePath);
    $realBase = realpath(PASTQUESTIONS_DIR);

    if ($realPath === false || strpos($realBase, $realBase) !== 0) {
        respondError('File not found', 404);
    }

    if (!file_exists($realPath)) {
        respondError('File not found', 404);
    }

    // Set headers for download
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . basename($realPath) . '"');
    header('Content-Length: ' . filesize($realPath));

    readfile($realPath);
    exit();
}

function buildPastQuestionPath($courseCode, $level, $semester, $category = null) {
    $baseDir = PASTQUESTIONS_DIR;
    $courseCode = preg_replace('/[^A-Za-z0-9_-]/', '', $courseCode); // Sanitize
    $level = intval($level);
    $semester = intval($semester);

    if ($level === 100) {
        return $baseDir . "level {$level}/semester {$semester}/{$courseCode}.PDF";
    } else {
        $category = $category ? preg_replace('/[^A-Za-z0-9_-]/', '', $category) : '';
        return $baseDir . "level {$level}/semester {$semester}/{$category}/{$courseCode}.PDF";
    }
}
