<?php
// =====================================================
// Trident Studios - User Sync API
// Syncs localStorage users to server for password reset
// =====================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// ── Configuration ──────────────────────────────────────────
$BASE_DIR = dirname(__DIR__);
$DATA_DIR = $BASE_DIR . '/data';
$USERS_FILE = $DATA_DIR . '/users.json';

// Create data directory if it doesn't exist
if (!is_dir($DATA_DIR)) {
    mkdir($DATA_DIR, 0755, true);
}

// ── Get Request Data ───────────────────────────────────────
$input = json_decode(file_get_contents('php://input'), true);
$users = $input['users'] ?? [];

if (!is_array($users)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid users data']);
    exit();
}

// ── Save Users ─────────────────────────────────────────────
try {
    file_put_contents($USERS_FILE, json_encode($users, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'message' => 'Users synced successfully',
        'count' => count($users)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to sync users']);
}
?>
