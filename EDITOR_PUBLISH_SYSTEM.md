# Website Editor - Publish System

## Overview
The Trident Studios website editor now saves changes permanently to the server when you click "Publish".

## How It Works

### 1. Editor Interface
- Located at `/editor.html`
- Edit content visually in the iframe preview
- Changes are tracked in real-time

### 2. Publishing Process
When you click **Publish**:
1. Editor serializes all changes from the iframe
2. Removes editor-specific elements (edit bar, selection classes)
3. Sends clean HTML to `/api/publish.php` via POST request
4. Server validates user permissions (must be website-editor or admin)
5. Creates automatic backup of current file
6. Saves new content to the live HTML file
7. Returns success/error response

### 3. Backups
- Automatic backups created before each publish
- Stored in `/backups/` directory (not web-accessible)
- Format: `YYYY-MM-DD_HHMMSS_filename.html`
- Only last 10 backups per file are kept
- Protected by `.htaccess`

### 4. Restore System
- Admins can restore from backups using `/api/backups.php`
- Lists all available backups with timestamps
- Creates pre-restore backup before reverting

## API Endpoints

### POST /api/publish.php
Publish changes to a live HTML file.

**Request Body:**
```json
{
  "filename": "index.html",
  "html_content": "<!DOCTYPE html>...",
  "user_email": "user@example.com",
  "user_role": "website-editor"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Changes published successfully",
  "filename": "index.html",
  "backup": "2026-02-27_123456_index.html",
  "timestamp": "2026-02-27T12:34:56+00:00"
}
```

### GET /api/backups.php
List all backups.

**Response:**
```json
{
  "success": true,
  "backups": [
    {
      "filename": "2026-02-27_123456_index.html",
      "size": 18432,
      "modified": "2026-02-27 12:34:56",
      "original": "index.html"
    }
  ]
}
```

### POST /api/backups.php
Restore a backup (admin only).

**Request Body:**
```json
{
  "backup_filename": "2026-02-27_123456_index.html",
  "user_role": "admin"
}
```

## Security

### Permissions
- **website-editor**: Can publish changes
- **admin**: Can publish and restore backups
- **viewer**: No access

### Protected Files
Only these files can be edited:
- index.html
- artists.html  
- socials.html
- profile.html
- dashboard.html
- admin-panel.html
- editor.html
- artist-editor.html
- login.html
- privacy-policy.html
- terms-of-service.html

### Backup Protection
- `/backups/` directory has `.htaccess` deny rule
- Not accessible via web browser
- Only accessible via API with proper authentication

## Logs
Publish actions are logged to `/logs/publish.log`:
```
2026-02-27 12:34:56 - User: editor@tridentstudios.store - Published: index.html
```

## Directory Structure
```
/home/container/www/
├── api/
│   ├── publish.php      # Publish endpoint
│   └── backups.php      # Backup management
├── backups/             # Automatic backups (protected)
│   ├── .htaccess
│   └── 2026-02-27_123456_index.html
├── logs/
│   └── publish.log      # Publishing activity log
├── index.html           # Your website files
├── editor.html
└── ...
```

## Future Enhancements
- Multi-page editing (select which page to edit)
- Visual backup browser in admin panel
- Diff viewer to compare changes
- Scheduled publishing
- Draft system (save without publishing)
