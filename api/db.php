<?php
// Shared DB bootstrap for Trident Studios APIs.

function trident_get_db(): ?PDO {
    static $pdo = null;
    static $attempted = false;

    if ($attempted) {
        return $pdo;
    }
    $attempted = true;

    $dsn = getenv('TRIDENT_DB_DSN');
    $host = getenv('TRIDENT_DB_HOST');
    $port = getenv('TRIDENT_DB_PORT') ?: '3306';
    $name = getenv('TRIDENT_DB_NAME');
    $user = getenv('TRIDENT_DB_USER');
    $pass = getenv('TRIDENT_DB_PASS');

    if (!$dsn && $host && $name) {
        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
    }

    if (!$dsn || !$user) {
        return null;
    }

    try {
        $pdo = new PDO($dsn, $user, (string)$pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        trident_init_schema($pdo);
        return $pdo;
    } catch (Throwable $e) {
        error_log('DB connection failed: ' . $e->getMessage());
        return null;
    }
}

function trident_init_schema(PDO $pdo): void {
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS artist_cards (
            card_id VARCHAR(32) PRIMARY KEY,
            payload LONGTEXT NOT NULL,
            updated_by VARCHAR(255) DEFAULT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS site_users (
            id VARCHAR(64) PRIMARY KEY,
            username VARCHAR(255) DEFAULT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(64) DEFAULT "viewer",
            roles_json TEXT DEFAULT NULL,
            avatar_url TEXT DEFAULT NULL,
            bio TEXT DEFAULT NULL,
            discord_tag VARCHAR(100) DEFAULT NULL,
            provider VARCHAR(64) DEFAULT NULL,
            created_at VARCHAR(64) DEFAULT NULL,
            last_login VARCHAR(64) DEFAULT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS portfolio_items (
            id VARCHAR(32) PRIMARY KEY,
            payload LONGTEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS publish_logs (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) DEFAULT NULL,
            filename VARCHAR(255) NOT NULL,
            published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
}
