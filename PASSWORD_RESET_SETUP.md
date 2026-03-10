# Password Reset Email System - Setup Guide

## Overview
The password reset system allows users to securely reset their passwords via email. When a user requests a password reset, they receive an email with a unique token link that expires in 1 hour.

## How It Works

1. **User Requests Reset**: User enters their email on the forgot password form
2. **Token Generated**: System creates a secure random token and stores it with expiration
3. **Email Sent**: Reset link with token is emailed to the user
4. **User Resets**: User clicks link, enters new password, token is validated and invalidated
5. **Password Updated**: New password is saved to both backend storage and localStorage

## Files Created

- `/api/reset-password.php` - Backend API for password reset (request, verify, reset)
- `/api/sync-users.php` - Syncs localStorage users to server for backend access
- `/reset-password.html` - Password reset page users see when clicking email link
- `auth.js` - Updated to call backend API instead of showing fake notification

## Email Configuration

### Option 1: Simple PHP mail() (Easiest, May Not Work on All Hosts)

The system uses PHP's `mail()` function by default. This requires:
- Your web host must have mail server configured
- May end up in spam folders
- **No configuration needed** - works out of the box if host supports it

### Option 2: SMTP (Recommended for Production)

For reliable email delivery, configure SMTP settings in `/api/reset-password.php`:

```php
// Email configuration (lines 24-29)
$SMTP_HOST = 'smtp.gmail.com'; // Your SMTP server
$SMTP_PORT = 587; // Usually 587 for TLS or 465 for SSL
$SMTP_USER = 'your-email@gmail.com'; // Your email address
$SMTP_PASS = 'your-app-password'; // App password (not regular password!)
$FROM_EMAIL = 'noreply@tridentstudios.store'; // From address
$FROM_NAME = 'Trident Studios'; // Display name
```

#### Gmail Setup (Most Common):

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account → Security → 2-Step Verification
   - Scroll to "App passwords"
   - Select "Mail" and generate password
   - Use this 16-character password as `$SMTP_PASS`
3. **Update Settings**:
   ```php
   $SMTP_HOST = 'smtp.gmail.com';
   $SMTP_PORT = 587;
   $SMTP_USER = 'bakes4409@gmail.com';
   $SMTP_PASS = 'rqzs ydvi uyxi pfqa'; // 16-char app password
   $FROM_EMAIL = 'bakes4409@gmail.com';
   $FROM_NAME = 'Trident Studios';
   ```

#### Other Email Providers:

**Outlook/Hotmail:**
```php
$SMTP_HOST = 'smtp.office365.com';
$SMTP_PORT = 587;
```

**Yahoo:**
```php
$SMTP_HOST = 'smtp.mail.yahoo.com';
$SMTP_PORT = 587;
```

**SendGrid (Recommended for High Volume):**
```php
$SMTP_HOST = 'smtp.sendgrid.net';
$SMTP_PORT = 587;
$SMTP_USER = 'apikey';
$SMTP_PASS = 'YOUR_SENDGRID_API_KEY';
```

**Mailgun:**
```php
$SMTP_HOST = 'smtp.mailgun.org';
$SMTP_PORT = 587;
$SMTP_USER = 'postmaster@yourdomain.mailgun.org';
$SMTP_PASS = 'YOUR_MAILGUN_PASSWORD';
```

### Option 3: PHPMailer (Most Reliable, Requires Installation)

For best results, install PHPMailer:

```bash
composer require phpmailer/phpmailer
```

Then uncomment and use the PHPMailer code block in `/api/reset-password.php` (lines 285+).

## Testing

### Test Password Reset Flow:

1. **Request Reset:**
   ```bash
   curl -X POST http://localhost/api/reset-password.php \
     -H "Content-Type: application/json" \
     -d '{"action":"request","email":"bakes4409@gmail.com"}'
   ```

2. **Check `/data/reset-tokens.json`** for generated token

3. **Verify Token:**
   ```bash
   curl -X POST http://localhost/api/reset-password.php \
     -H "Content-Type: application/json" \
     -d '{"action":"verify","token":"YOUR_TOKEN_HERE"}'
   ```

4. **Reset Password:**
   ```bash
   curl -X POST http://localhost/api/reset-password.php \
     -H "Content-Type: application/json" \
     -d '{"action":"reset","token":"YOUR_TOKEN_HERE","password":"newpass123"}'
   ```

### Manual Testing:

1. Go to `https://tridentstudios.store/login.html`
2. Click "Forgot password?"
3. Enter a registered email address
4. Check email for reset link (may be in spam folder initially)
5. Click link and enter new password
6. Login with new password

## Security Features

- ✅ **Secure Random Tokens**: 64-character hex tokens (256-bit entropy)
- ✅ **Token Expiration**: Links expire after 1 hour
- ✅ **One-Time Use**: Tokens are invalidated after successful reset
- ✅ **No Email Enumeration**: Always shows success message (doesn't reveal if email exists)
- ✅ **Automatic Cleanup**: Expired tokens are removed when new tokens are generated
- ✅ **Rate Limiting**: Consider adding IP-based rate limiting in production

## File Permissions

Ensure proper permissions for data storage:

```bash
chmod 755 /home/container/www/data
chmod 644 /home/container/www/data/*.json
chmod 755 /home/container/www/api
chmod 644 /home/container/www/api/*.php
```

## Troubleshooting

### Emails Not Sending:

1. **Check PHP mail() capability:**
   ```php
   <?php
   var_dump(mail('test@example.com', 'Test', 'Test message'));
   ?>
   ```

2. **Check server error logs:**
   ```bash
   tail -f /home/container/logs/php-fpm.log
   tail -f /home/container/logs/nerror.log
   ```

3. **Enable error logging in reset-password.php:**
   ```php
   error_reporting(E_ALL);
   ini_set('display_errors', 1);
   ```

4. **Check spam folder** - initial emails often go to spam

5. **Verify SMTP credentials** if using SMTP method

### Token Not Found:

- Check `/data/reset-tokens.json` exists and is writable
- Verify token hasn't expired (1 hour limit)
- Ensure `/data` directory has write permissions (755)

### Password Not Updating:

- Check `/data/users.json` exists and is writable
- Verify user email matches exactly (case-insensitive comparison)
- Check browser console and network tab for API errors

## Production Recommendations

1. **Use SMTP**: Configure proper SMTP server (not PHP mail())
2. **Add Rate Limiting**: Prevent abuse by limiting requests per IP
3. **Hash Passwords**: Implement password hashing (bcrypt/Argon2)
4. **Use HTTPS**: Ensure all requests use HTTPS in production
5. **Database Storage**: Move from JSON files to proper database
6. **Email Service**: Use SendGrid, Mailgun, or AWS SES for reliability
7. **Monitoring**: Set up logging and monitoring for failed emails
8. **reCAPTCHA**: Add reCAPTCHA to forgot password form to prevent bots

## Email Template Customization

Edit the HTML email template in `/api/reset-password.php` (lines 233-282) to match your branding. The current template includes:

- Trident Studios branding
- Responsive design
- Security warnings
- 1-hour expiration notice
- Accessible button and plain text link

## Support

For issues or questions:
- Check server error logs first
- Verify email configuration is correct
- Test with curl commands above
- Ensure all file permissions are correct
- Check that users exist in `/data/users.json`
