<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

require_once __DIR__ . '/db.php';

$pdo = trident_get_db();
if (!$pdo) {
    echo json_encode([
        'success' => true,
        'dbConnected' => false,
        'message' => 'Database not connected, file fallback is active'
    ]);
    exit();
}

echo json_encode([
    'success' => true,
    'dbConnected' => true,
    'message' => 'Database connected successfully'
]);
