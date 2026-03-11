<?php
// =====================================================
// Trident Studios - User Sync API
// Syncs localStorage users to server for password reset
// =====================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/db.php';

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
    $pdo = trident_get_db();
    if ($pdo) {
        $stmt = $pdo->prepare(
            'INSERT INTO site_users (
                id, username, email, password, role, roles_json, avatar_url, bio, discord_tag, provider, created_at, last_login
            ) VALUES (
                :id, :username, :email, :password, :role, :roles_json, :avatar_url, :bio, :discord_tag, :provider, :created_at, :last_login
            ) ON DUPLICATE KEY UPDATE
                username = VALUES(username),
                password = VALUES(password),
                role = VALUES(role),
                roles_json = VALUES(roles_json),
                avatar_url = VALUES(avatar_url),
                bio = VALUES(bio),
                discord_tag = VALUES(discord_tag),
                provider = VALUES(provider),
                created_at = VALUES(created_at),
                last_login = VALUES(last_login),
                updated_at = CURRENT_TIMESTAMP'
        );

        foreach ($users as $user) {
            $stmt->execute([
                ':id' => (string)($user['id'] ?? uniqid('u_', true)),
                ':username' => $user['username'] ?? null,
                ':email' => strtolower((string)($user['email'] ?? '')),
                ':password' => (string)($user['password'] ?? ''),
                ':role' => (string)($user['role'] ?? 'viewer'),
                ':roles_json' => isset($user['roles']) ? json_encode($user['roles']) : null,
                ':avatar_url' => $user['avatarUrl'] ?? null,
                ':bio' => $user['bio'] ?? null,
                ':discord_tag' => $user['discordTag'] ?? null,
                ':provider' => $user['provider'] ?? null,
                ':created_at' => $user['createdAt'] ?? null,
                ':last_login' => $user['lastLogin'] ?? null,
            ]);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Users synced successfully',
            'count' => count($users),
            'storage' => 'database'
        ]);
        exit();
    }

    file_put_contents($USERS_FILE, json_encode($users, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'message' => 'Users synced successfully',
        'count' => count($users),
        'storage' => 'file'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to sync users']);
}
?>
