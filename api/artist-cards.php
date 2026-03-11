<?php
// ============================================================
// Trident Studios — Artist Cards Data API
// ============================================================
// GET: Returns all artist card data
// POST: Saves artist card data for a specific card ID
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── Configuration ──────────────────────────────────────────
$BASE_DIR = dirname(__DIR__); // Points to parent directory
$DATA_FILE = $BASE_DIR . '/data/artist-cards.json';
$DATA_DIR = dirname($DATA_FILE);
$BACKUP_DIR = $BASE_DIR . '/backups';

// Ensure data directory exists
if (!is_dir($DATA_DIR)) {
    mkdir($DATA_DIR, 0755, true);
}

// Ensure backup directory exists
if (!is_dir($BACKUP_DIR)) {
    mkdir($BACKUP_DIR, 0755, true);
}

// ── GET: Retrieve all artist cards ────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $pdo = trident_get_db();
    if ($pdo) {
        $stmt = $pdo->query('SELECT card_id, payload FROM artist_cards ORDER BY CAST(card_id AS UNSIGNED), card_id');
        $rows = $stmt->fetchAll();
        $cards = [];
        foreach ($rows as $row) {
            $cards[$row['card_id']] = json_decode($row['payload'], true) ?: [];
        }
        echo json_encode($cards, JSON_UNESCAPED_SLASHES);
        exit();
    }

    if (file_exists($DATA_FILE)) {
        $data = file_get_contents($DATA_FILE);
        echo $data;
    } else {
        // Return default data with Card 1 (Rose)
        $defaultData = [
            '1' => [
                'name' => 'Rose',
                'roleTitle' => 'Logo Designer & Branding',
                'discordTag' => '@boringrose',
                'bio' => 'Specializing in custom logos and brand identities for gaming communities.',
                'avatarUrl' => 'https://i.postimg.cc/76jTH2cW/boringrose.png',
                'socials' => [
                    'discord' => 'https://discord.gg/dPj6S5Vc2A',
                    'youtube' => 'https://www.youtube.com/@boringrose123'
                ],
                'lastUpdated' => date('Y-m-d H:i:s'),
                'updatedBy' => 'system'
            ]
        ];
        echo json_encode($defaultData);
    }
    exit();
}

// ── POST: Save artist card data ───────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
        exit();
    }
    
    $cardId = $input['cardId'] ?? null;
    $cardData = $input['cardData'] ?? null;
    $userEmail = $input['userEmail'] ?? '';
    
    if (!$cardId || !$cardData) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing cardId or cardData']);
        exit();
    }
    
    $pdo = trident_get_db();
    if ($pdo) {
        $cardData['lastUpdated'] = date('Y-m-d H:i:s');
        $cardData['updatedBy'] = $userEmail;
        $payload = json_encode($cardData, JSON_UNESCAPED_SLASHES);

        $stmt = $pdo->prepare(
            'INSERT INTO artist_cards (card_id, payload, updated_by)
             VALUES (:card_id, :payload, :updated_by)
             ON DUPLICATE KEY UPDATE
                payload = VALUES(payload),
                updated_by = VALUES(updated_by),
                updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute([
            ':card_id' => (string)$cardId,
            ':payload' => $payload,
            ':updated_by' => $userEmail,
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Artist card saved successfully',
            'cardId' => $cardId,
            'storage' => 'database',
            'timestamp' => date('c')
        ]);
        exit();
    }

    // Create backup before modifying
    if (file_exists($DATA_FILE)) {
        $backupFilename = 'artist-cards_' . date('Y-m-d_His') . '.json';
        $backupPath = $BACKUP_DIR . '/' . $backupFilename;
        copy($DATA_FILE, $backupPath);
        
        // Keep only last 10 backups
        $backups = glob($BACKUP_DIR . '/artist-cards_*.json');
        if (count($backups) > 10) {
            usort($backups, function($a, $b) {
                return filemtime($a) - filemtime($b);
            });
            $to_delete = array_slice($backups, 0, count($backups) - 10);
            foreach ($to_delete as $old_backup) {
                @unlink($old_backup);
            }
        }
    }
    
    // Load existing cards
    $cards = [];
    if (file_exists($DATA_FILE)) {
        $existingData = file_get_contents($DATA_FILE);
        $cards = json_decode($existingData, true) ?: [];
    }
    
    // Update the specific card
    $cards[$cardId] = $cardData;
    
    // Add metadata
    $cards[$cardId]['lastUpdated'] = date('Y-m-d H:i:s');
    $cards[$cardId]['updatedBy'] = $userEmail;
    
    // Save back to file with proper formatting
    $success = file_put_contents($DATA_FILE, json_encode($cards, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    
    if ($success !== false) {
        // Log the action
        $logFile = $BASE_DIR . '/logs/artist-cards.log';
        $logDir = dirname($logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        $logEntry = date('Y-m-d H:i:s') . " - User: $userEmail - Updated Card: $cardId\n";
        @file_put_contents($logFile, $logEntry, FILE_APPEND);
        
        echo json_encode([
            'success' => true,
            'message' => 'Artist card saved successfully',
            'cardId' => $cardId,
            'storage' => 'file',
            'timestamp' => date('c')
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to write to file'
        ]);
    }
    exit();
}

// ── Other methods not allowed ──────────────────────────────
http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);

