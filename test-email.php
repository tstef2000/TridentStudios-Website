<?php
// Test if PHP mail() function works on your server

$to = 'bakes4409@gmail.com'; // ← Change this to your email
$subject = 'Test Email from Trident Studios';
$message = 'If you receive this, PHP mail() is working!';
$headers = "From: noreply@tridentstudios.store\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";

echo "<h2>Testing PHP mail() function...</h2>";

if (mail($to, $subject, $message, $headers)) {
    echo "<p style='color:green;'>✅ Email sent successfully!</p>";
    echo "<p>Check your inbox (and spam folder) at: <strong>$to</strong></p>";
} else {
    echo "<p style='color:red;'>❌ Failed to send email</p>";
    echo "<p>Your server may not support PHP mail() function.</p>";
    echo "<p>Solutions:</p>";
    echo "<ul>";
    echo "<li>Contact your hosting provider to enable mail()</li>";
    echo "<li>Or use SMTP method instead (see PASSWORD_RESET_SETUP.md)</li>";
    echo "</ul>";
}

echo "<h3>Server Info:</h3>";
echo "<pre>";
echo "PHP Version: " . phpversion() . "\n";
echo "Operating System: " . PHP_OS . "\n";
echo "</pre>";
?>
