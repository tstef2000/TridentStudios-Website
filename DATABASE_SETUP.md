# Database Setup

The API now supports database-backed storage for:
- artist cards
- users
- portfolio showcase
- publish logs

If DB variables are not set, APIs fall back to file storage in `data/`.

## Environment Variables

Set these before starting the PHP server:

```bash
export TRIDENT_DB_HOST="us-west-1.itzkrynn.com"
export TRIDENT_DB_PORT="3306"
export TRIDENT_DB_NAME="s31_WebsiteDB"
export TRIDENT_DB_USER="<your-username>"
export TRIDENT_DB_PASS="<your-password>"
```

Optional DSN override:

```bash
export TRIDENT_DB_DSN="mysql:host=us-west-1.itzkrynn.com;port=3306;dbname=s31_WebsiteDB;charset=utf8mb4"
```

## Start Server With DB Enabled

```bash
php -S 0.0.0.0:8080
```

## Notes

- Table creation is automatic on first DB connection.
- If the DB is unreachable, APIs continue using JSON files.
- Video upload optimization endpoint: `POST /api/upload-video.php` with form field `video`.
- DB status endpoint: `GET /api/db-status.php`.
- Website editor shows a `DB: Connected` / `DB: File Fallback` badge in the header.
