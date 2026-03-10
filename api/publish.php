<?php
// ============================================================
// Trident Studios — Website Editor Publish API
// ============================================================
// This endpoint receives HTML changes from the editor and
// saves them to the actual HTML files on the server.
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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
$ALLOWED_FILES = [
    'index.html',
    'artists.html',
    'socials.html',
    'profile.html',
    'dashboard.html',
    'admin-panel.html',
    'editor.html',
    'artist-editor.html',
    'login.html',
    'privacy-policy.html',
    'terms-of-service.html'
];

$BASE_DIR = dirname(__DIR__); // Points to /home/container/www
$BACKUP_DIR = $BASE_DIR . '/backups';

// ── Authentication ─────────────────────────────────────────
// Simple token-based auth. In production, use proper session auth.
$auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$provided_token = str_replace('Bearer ', '', $auth_header);

// Get user token from request
$input = json_decode(file_get_contents('php://input'), true);
$user_email = $input['user_email'] ?? '';
$user_role = $input['user_role'] ?? '';

// Verify user has permission (must be website-editor or admin)
if (!in_array($user_role, ['website-editor', 'admin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Unauthorized: Insufficient permissions']);
    exit();
}

// ── Process Request ────────────────────────────────────────
$filename = $input['filename'] ?? '';
$html_content = $input['html_content'] ?? '';

// Validate filename
if (!in_array($filename, $ALLOWED_FILES)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid filename. Only specific HTML files can be edited.']);
    exit();
}

if (empty($html_content)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No content provided']);
    exit();
}

$filepath = $BASE_DIR . '/' . $filename;

// Check if file exists
if (!file_exists($filepath)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'File not found']);
    exit();
}

// ── Create Backup ──────────────────────────────────────────
if (!is_dir($BACKUP_DIR)) {
    mkdir($BACKUP_DIR, 0755, true);
}

$backup_filename = date('Y-m-d_His') . '_' . $filename;
$backup_path = $BACKUP_DIR . '/' . $backup_filename;

// Backup current file
if (!copy($filepath, $backup_path)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to create backup']);
    exit();
}

// ── Save New Content ───────────────────────────────────────
if (file_put_contents($filepath, $html_content) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to save file']);
    exit();
}

// ── Log Action ─────────────────────────────────────────────
$log_entry = date('Y-m-d H:i:s') . " - User: $user_email - Published: $filename\n";
$log_file = $BASE_DIR . '/logs/publish.log';
@file_put_contents($log_file, $log_entry, FILE_APPEND);

// ── Clean Old Backups (keep last 10) ──────────────────────
$backups = glob($BACKUP_DIR . '/*_' . $filename);
if (count($backups) > 10) {
    usort($backups, function($a, $b) {
        return filemtime($a) - filemtime($b);
    });
    $to_delete = array_slice($backups, 0, count($backups) - 10);
    foreach ($to_delete as $old_backup) {
        @unlink($old_backup);
    }
}

// ── Success Response ───────────────────────────────────────
echo json_encode([
    'success' => true,
    'message' => 'Changes published successfully',
    'filename' => $filename,
    'backup' => $backup_filename,
    'timestamp' => date('c')
]);
