<?php
// Video upload + high-quality compression endpoint

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

if (!isset($_FILES['video'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing video file']);
    exit();
}

$BASE_DIR = dirname(__DIR__);
$VIDEOS_DIR = $BASE_DIR . '/videos/uploads';
if (!is_dir($VIDEOS_DIR)) {
    mkdir($VIDEOS_DIR, 0755, true);
}

$file = $_FILES['video'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Upload failed']);
    exit();
}

$maxBytes = 1024 * 1024 * 500; // 500MB
if ((int)$file['size'] > $maxBytes) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'File too large (max 500MB)']);
    exit();
}

$tmp = $file['tmp_name'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed = ['mp4', 'mov', 'webm', 'm4v'];
if (!in_array($ext, $allowed, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Unsupported video format']);
    exit();
}

$baseName = 'portfolio_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3));
$inputPath = $VIDEOS_DIR . '/' . $baseName . '.' . $ext;
$outputPath = $VIDEOS_DIR . '/' . $baseName . '.mp4';

if (!move_uploaded_file($tmp, $inputPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to store uploaded file']);
    exit();
}

$ffmpeg = trim((string)shell_exec('command -v ffmpeg 2>/dev/null'));
if ($ffmpeg !== '') {
    // High quality compression profile with silent output and fast web playback.
    $cmd = sprintf(
        '%s -y -i %s -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart -vf "scale=min(1920,iw):-2" -an %s 2>&1',
        escapeshellcmd($ffmpeg),
        escapeshellarg($inputPath),
        escapeshellarg($outputPath)
    );

    exec($cmd, $out, $code);
    if ($code === 0 && file_exists($outputPath)) {
        @unlink($inputPath);
        echo json_encode([
            'success' => true,
            'message' => 'Video uploaded and optimized',
            'url' => 'videos/uploads/' . basename($outputPath),
            'storage' => 'optimized'
        ]);
        exit();
    }
}

// Fallback without compression if ffmpeg unavailable or encoding fails.
if ($inputPath !== $outputPath) {
    @rename($inputPath, $outputPath);
}

echo json_encode([
    'success' => true,
    'message' => 'Video uploaded (compression unavailable)',
    'url' => 'videos/uploads/' . basename($outputPath),
    'storage' => 'original'
]);
