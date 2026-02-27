<?php
// =====================================================
// Trident Studios - Password Reset API
// Handles password reset token generation and email sending
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
$TOKENS_FILE = $DATA_DIR . '/reset-tokens.json';

// Email configuration (Gmail SMTP)
$SMTP_HOST = getenv('TRIDENT_SMTP_HOST') ?: 'smtp.gmail.com';
$SMTP_PORT = (int)(getenv('TRIDENT_SMTP_PORT') ?: 465);
$SMTP_USER = getenv('TRIDENT_SMTP_USER') ?: 'bakes4409@gmail.com';
$SMTP_PASS = getenv('TRIDENT_SMTP_PASS') ?: 'rqzsydviuyxipfqa';
$FROM_EMAIL = getenv('TRIDENT_FROM_EMAIL') ?: 'noreply@tridentstudios.store';
$FROM_NAME = getenv('TRIDENT_FROM_NAME') ?: 'Trident Studios';
$REPLY_TO = getenv('TRIDENT_REPLY_TO') ?: 'bakes4409@gmail.com';

// Create data directory if it doesn't exist
if (!is_dir($DATA_DIR)) {
    mkdir($DATA_DIR, 0755, true);
}

// ── Get Request Data ───────────────────────────────────────
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

// ── ACTION: Request Reset ──────────────────────────────────
if ($action === 'request') {
    $email = strtolower(trim($input['email'] ?? ''));
    
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid email address']);
        exit();
    }
    
    // Load users from localStorage backup (in production, use database)
    $users_file = $DATA_DIR . '/users.json';
    $users = [];
    if (file_exists($users_file)) {
        $users = json_decode(file_get_contents($users_file), true) ?? [];
    }
    
    // Check if user exists
    $user_exists = false;
    foreach ($users as $user) {
        if (isset($user['email']) && strtolower($user['email']) === $email) {
            $user_exists = true;
            break;
        }
    }
    
    // Always show success message (security: don't reveal if email exists)
    // In production, only send email if user exists
    if ($user_exists) {
        // Generate secure reset token
        $token = bin2hex(random_bytes(32));
        $expires = time() + (60 * 60); // Token expires in 1 hour
        
        // Load existing tokens
        $tokens = [];
        if (file_exists($TOKENS_FILE)) {
            $tokens = json_decode(file_get_contents($TOKENS_FILE), true) ?? [];
        }
        
        // Clean expired tokens
        $tokens = array_filter($tokens, function($t) {
            return $t['expires'] > time();
        });
        
        // Add new token
        $tokens[] = [
            'email' => $email,
            'token' => $token,
            'expires' => $expires,
            'created' => time()
        ];
        
        // Save tokens
        file_put_contents($TOKENS_FILE, json_encode($tokens, JSON_PRETTY_PRINT));
        
        // Generate reset link
        $reset_link = (isset($_SERVER['HTTPS']) ? 'https://' : 'http://') 
                    . $_SERVER['HTTP_HOST'] 
                    . '/reset-password.html?token=' . $token;
        
        // Send email
        $sent = sendResetEmail($email, $reset_link, $SMTP_HOST, $SMTP_PORT, $SMTP_USER, $SMTP_PASS, $FROM_EMAIL, $FROM_NAME, $REPLY_TO);
        
        if (!$sent) {
            error_log("Failed to send reset email to: $email");
            // Still return success to user (for security)
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'If an account exists with that email, a password reset link has been sent.'
    ]);
    exit();
}

// ── ACTION: Verify Token ───────────────────────────────────
if ($action === 'verify') {
    $token = $input['token'] ?? '';
    
    if (empty($token)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Token required']);
        exit();
    }
    
    // Load tokens
    $tokens = [];
    if (file_exists($TOKENS_FILE)) {
        $tokens = json_decode(file_get_contents($TOKENS_FILE), true) ?? [];
    }
    
    // Find and validate token
    $valid_token = null;
    foreach ($tokens as $t) {
        if ($t['token'] === $token && $t['expires'] > time()) {
            $valid_token = $t;
            break;
        }
    }
    
    if (!$valid_token) {
        echo json_encode(['success' => false, 'error' => 'Invalid or expired token']);
        exit();
    }
    
    echo json_encode([
        'success' => true,
        'email' => $valid_token['email']
    ]);
    exit();
}

// ── ACTION: Reset Password ─────────────────────────────────
if ($action === 'reset') {
    $token = $input['token'] ?? '';
    $new_password = $input['password'] ?? '';
    
    if (empty($token) || empty($new_password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Token and password required']);
        exit();
    }
    
    if (strlen($new_password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters']);
        exit();
    }
    
    // Load tokens
    $tokens = [];
    if (file_exists($TOKENS_FILE)) {
        $tokens = json_decode(file_get_contents($TOKENS_FILE), true) ?? [];
    }
    
    // Find and validate token
    $valid_token = null;
    $token_index = null;
    foreach ($tokens as $i => $t) {
        if ($t['token'] === $token && $t['expires'] > time()) {
            $valid_token = $t;
            $token_index = $i;
            break;
        }
    }
    
    if (!$valid_token) {
        echo json_encode(['success' => false, 'error' => 'Invalid or expired token']);
        exit();
    }
    
    // Load users
    $users_file = $DATA_DIR . '/users.json';
    $users = [];
    if (file_exists($users_file)) {
        $users = json_decode(file_get_contents($users_file), true) ?? [];
    }
    
    // Update password
    $updated = false;
    foreach ($users as $i => $user) {
        if (isset($user['email']) && strtolower($user['email']) === $valid_token['email']) {
            $users[$i]['password'] = $new_password; // In production, hash this!
            $updated = true;
            break;
        }
    }
    
    if (!$updated) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit();
    }
    
    // Save updated users
    file_put_contents($users_file, json_encode($users, JSON_PRETTY_PRINT));
    
    // Invalidate token
    unset($tokens[$token_index]);
    $tokens = array_values($tokens);
    file_put_contents($TOKENS_FILE, json_encode($tokens, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'message' => 'Password reset successfully'
    ]);
    exit();
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Invalid action']);

// ── Email Sending Function ─────────────────────────────────
function sendResetEmail($to, $reset_link, $smtp_host, $smtp_port, $smtp_user, $smtp_pass, $from_email, $from_name, $reply_to = null) {
    // Email subject and body
    $subject = 'Password Reset - Trident Studios';
    
    // Use from_email as reply-to if not specified
    if (empty($reply_to)) {
        $reply_to = $from_email;
    }
    
    $html_body = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #031729, #0a2840); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: #2bb3ff; margin: 0; font-size: 28px; letter-spacing: 2px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 15px 30px; background: #2bb3ff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔱 TRIDENT STUDIOS</h1>
        </div>
        <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password for your Trident Studios account. Click the button below to create a new password:</p>
            <p style="text-align: center;">
                <a href="$reset_link" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2bb3ff;">$reset_link</p>
            <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                • This link expires in 1 hour<br>
                • If you didn't request this reset, please ignore this email<br>
                • Never share this link with anyone
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2026 Trident Studios. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>
HTML;

    $plain_body = <<<TEXT
TRIDENT STUDIOS - Password Reset

Hello,

We received a request to reset your password for your Trident Studios account.

Click the link below to create a new password:
$reset_link

This link expires in 1 hour.

If you didn't request this reset, please ignore this email.

---
© 2026 Trident Studios. All rights reserved.
This is an automated message, please do not reply.
TEXT;

    // Try Gmail SMTP first (recommended)
    if (!empty($smtp_user) && !empty($smtp_pass)) {
        if (smtpSendMail($smtp_host, $smtp_port, $smtp_user, $smtp_pass, $from_email, $from_name, $to, $subject, $html_body, $plain_body, $reply_to)) {
            return true;
        }
        error_log("SMTP send failed for reset email to: $to");
    }

    // Fallback to PHP mail()
    $headers = "From: $from_name <$from_email>\r\n";
    $headers .= "Reply-To: $reply_to\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

    if (mail($to, $subject, $html_body, $headers)) {
        return true;
    }

    error_log("Failed to send reset email to: $to using both SMTP and mail() fallback");
    return false;
}

function smtpSendMail($host, $port, $username, $password, $fromEmail, $fromName, $toEmail, $subject, $htmlBody, $plainBody, $replyTo = null) {
    $timeout = 20;
    $transport = ($port === 465) ? 'ssl://' : '';
    $socket = @stream_socket_client($transport . $host . ':' . $port, $errno, $errstr, $timeout);
    if (!$socket) {
        error_log("SMTP connection failed: $errstr ($errno)");
        return false;
    }
    
    // Use fromEmail as reply-to if not specified
    if (empty($replyTo)) {
        $replyTo = $fromEmail;
    }

    stream_set_timeout($socket, $timeout);

    $expect = function($codes) use ($socket) {
        $response = '';
        while (($line = fgets($socket, 515)) !== false) {
            $response .= $line;
            if (preg_match('/^\d{3} /', $line)) break;
        }
        if ($response === '') return [false, 'No SMTP response'];
        $code = (int)substr($response, 0, 3);
        return [in_array($code, (array)$codes, true), trim($response)];
    };

    $send = function($cmd) use ($socket) {
        fwrite($socket, $cmd . "\r\n");
    };

    [$ok, $res] = $expect(220);
    if (!$ok) { fclose($socket); error_log("SMTP greeting failed: $res"); return false; }

    $send('EHLO tridentstudios.store');
    [$ok, $res] = $expect(250);
    if (!$ok) { fclose($socket); error_log("SMTP EHLO failed: $res"); return false; }

    if ($port !== 465) {
        $send('STARTTLS');
        [$ok, $res] = $expect(220);
        if (!$ok) { fclose($socket); error_log("SMTP STARTTLS failed: $res"); return false; }
        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($socket);
            error_log('SMTP TLS negotiation failed');
            return false;
        }
        $send('EHLO tridentstudios.store');
        [$ok, $res] = $expect(250);
        if (!$ok) { fclose($socket); error_log("SMTP EHLO after TLS failed: $res"); return false; }
    }

    $send('AUTH LOGIN');
    [$ok, $res] = $expect(334);
    if (!$ok) { fclose($socket); error_log("SMTP AUTH start failed: $res"); return false; }

    $send(base64_encode($username));
    [$ok, $res] = $expect(334);
    if (!$ok) { fclose($socket); error_log("SMTP username rejected: $res"); return false; }

    $send(base64_encode($password));
    [$ok, $res] = $expect(235);
    if (!$ok) { fclose($socket); error_log("SMTP password rejected: $res"); return false; }

    $send('MAIL FROM:<' . $fromEmail . '>');
    [$ok, $res] = $expect(250);
    if (!$ok) { fclose($socket); error_log("SMTP MAIL FROM failed: $res"); return false; }

    $send('RCPT TO:<' . $toEmail . '>');
    [$ok, $res] = $expect([250, 251]);
    if (!$ok) { fclose($socket); error_log("SMTP RCPT TO failed: $res"); return false; }

    $send('DATA');
    [$ok, $res] = $expect(354);
    if (!$ok) { fclose($socket); error_log("SMTP DATA failed: $res"); return false; }

    $boundary = 'b1_' . bin2hex(random_bytes(8));
    $headers = [];
    $headers[] = 'From: ' . $fromName . ' <' . $fromEmail . '>';
    $headers[] = 'Reply-To: <' . $replyTo . '>';
    $headers[] = 'To: <' . $toEmail . '>';
    $headers[] = 'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';

    $message = implode("\r\n", $headers) . "\r\n\r\n";
    $message .= '--' . $boundary . "\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $message .= $plainBody . "\r\n\r\n";
    $message .= '--' . $boundary . "\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $message .= $htmlBody . "\r\n\r\n";
    $message .= '--' . $boundary . "--\r\n";

    // SMTP dot-stuffing
    $message = preg_replace('/(^|\r\n)\./', '$1..', $message);
    fwrite($socket, $message . "\r\n.\r\n");

    [$ok, $res] = $expect(250);
    if (!$ok) { fclose($socket); error_log("SMTP message rejected: $res"); return false; }

    $send('QUIT');
    fclose($socket);
    return true;
}
?>
