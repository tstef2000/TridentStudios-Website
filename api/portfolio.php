<?php
// Portfolio showcase API
// GET: list portfolio items
// POST: overwrite portfolio items

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/db.php';

$BASE_DIR = dirname(__DIR__);
$DATA_FILE = $BASE_DIR . '/data/portfolio-showcase.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($DATA_FILE)) {
        echo file_get_contents($DATA_FILE);
        exit();
    }
    echo json_encode(['items' => []]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $items = $input['items'] ?? null;

    if (!is_array($items)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid items payload']);
        exit();
    }

    $payload = json_encode(['items' => array_values($items)], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if (file_put_contents($DATA_FILE, $payload) === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save portfolio file']);
        exit();
    }
    echo json_encode([
        'success' => true,
        'message' => 'Portfolio saved',
        'count' => count($items),
        'storage' => 'file'
    ]);
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
