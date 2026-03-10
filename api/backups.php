<?php
// ============================================================
// Trident Studios — Backup Management API
// ============================================================
// List and restore backups
// ============================================================

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // List all backups
    $BASE_DIR = dirname(__DIR__);
    $BACKUP_DIR = $BASE_DIR . '/backups';
    
    if (!is_dir($BACKUP_DIR)) {
        echo json_encode(['success' => true, 'backups' => []]);
        exit();
    }
    
    $backups = [];
    $files = glob($BACKUP_DIR . '/*.html');
    
    foreach ($files as $file) {
        $filename = basename($file);
        $backups[] = [
            'filename' => $filename,
            'size' => filesize($file),
            'modified' => date('Y-m-d H:i:s', filemtime($file)),
            'original' => preg_replace('/^\d{4}-\d{2}-\d{2}_\d{6}_/', '', $filename)
        ];
    }
    
    // Sort by modified time, newest first
    usort($backups, function($a, $b) {
        return strtotime($b['modified']) - strtotime($a['modified']);
    });
    
    echo json_encode(['success' => true, 'backups' => $backups]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Restore a backup
    $input = json_decode(file_get_contents('php://input'), true);
    $user_role = $input['user_role'] ?? '';
    $backup_filename = $input['backup_filename'] ?? '';
    
    // Only admins can restore
    if ($user_role !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Only admins can restore backups']);
        exit();
    }
    
    $BASE_DIR = dirname(__DIR__);
    $BACKUP_DIR = $BASE_DIR . '/backups';
    $backup_path = $BACKUP_DIR . '/' . basename($backup_filename);
    
    if (!file_exists($backup_path)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Backup file not found']);
        exit();
    }
    
    // Extract original filename
    $original_filename = preg_replace('/^\d{4}-\d{2}-\d{2}_\d{6}_/', '', basename($backup_filename));
    $restore_path = $BASE_DIR . '/' . $original_filename;
    
    // Create a backup of current file before restoring
    $current_backup = $BACKUP_DIR . '/pre-restore_' . date('Y-m-d_His') . '_' . $original_filename;
    if (file_exists($restore_path)) {
        copy($restore_path, $current_backup);
    }
    
    // Restore the backup
    if (copy($backup_path, $restore_path)) {
        echo json_encode([
            'success' => true,
            'message' => 'Backup restored successfully',
            'restored_file' => $original_filename
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to restore backup']);
    }
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
