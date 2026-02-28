#!/usr/bin/env bash
set -euo pipefail

BLUE='\033[0;34m'; BOLD_BLUE='\033[1;34m'
GREEN='\033[0;32m'; YELLOW='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'

info()    { echo -e "${BOLD_BLUE}[nginx]${NC} $*"; }
success() { echo -e "${GREEN}[nginx]${NC} $*"; }
warn()    { echo -e "${YELLOW}[nginx]${NC} $*"; }
error()   { echo -e "${RED}[nginx]${NC} $*"; }

CERTBOT_DOMAIN="${CERTBOT_DOMAIN:-}"
NGINX_PORT="${NGINX_PORT:-8080}"
NGINX_SSL_PORT="${NGINX_SSL_PORT:-8443}"
CONTAINER_DIR="/home/container"
WWW_DIR="${CONTAINER_DIR}/www"
LOG_DIR="${CONTAINER_DIR}/logs"
TMP_DIR="${CONTAINER_DIR}/tmp"
LETSENCRYPT_DIR="/letsencrypt/config"
NGINX_CONF="/etc/nginx/conf.d/default.conf"

mkdir -p "${LOG_DIR}" "${TMP_DIR}"

# -------------------------------------------------------
# Generate an HTTP-only nginx config (used when there is
# no domain / before certificates are obtained)
# -------------------------------------------------------
write_http_config() {
    local port="${1:-$NGINX_PORT}"
    cat > "${NGINX_CONF}" <<EOF
server {
    listen ${port};
    server_name _;

    root ${WWW_DIR};
    index index.html index.htm index.php;
    charset utf-8;

    access_log ${LOG_DIR}/naccess.log;
    error_log  ${LOG_DIR}/nerror.log error;

    client_max_body_size 100m;
    client_body_timeout 120s;
    sendfile off;

    real_ip_header CF-Connecting-IP;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Content-Security-Policy "frame-ancestors 'self'" always;
    add_header Referrer-Policy "same-origin" always;

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    location ^~ /.well-known/acme-challenge/ {
        root ${WWW_DIR};
        allow all;
    }

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:${TMP_DIR}/php-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param PHP_VALUE "upload_max_filesize = 100M \n post_max_size=100M";
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        fastcgi_param HTTP_PROXY "";
        fastcgi_intercept_errors off;
        fastcgi_buffer_size 16k;
        fastcgi_buffers 4 16k;
        fastcgi_connect_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_read_timeout 300;
    }

    location ~ /\.git { deny all; }
    location ~ /\.ht  { deny all; }
}
EOF
}

# -------------------------------------------------------
# Generate an HTTPS nginx config after certificates have
# been obtained by certbot
# -------------------------------------------------------
write_ssl_config() {
    local domain="$1"
    local ssl_port="${2:-$NGINX_SSL_PORT}"
    local cert_dir="${LETSENCRYPT_DIR}/live/${domain}"
    cat > "${NGINX_CONF}" <<EOF
server {
    listen ${ssl_port} ssl;
    http2 on;
    server_name ${domain} www.${domain};

    root ${WWW_DIR};
    index index.html index.htm index.php;
    charset utf-8;

    access_log ${LOG_DIR}/naccess.log;
    error_log  ${LOG_DIR}/nerror.log error;

    client_max_body_size 100m;
    client_body_timeout 120s;
    sendfile off;

    ssl_certificate     ${cert_dir}/fullchain.pem;
    ssl_certificate_key ${cert_dir}/privkey.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    real_ip_header CF-Connecting-IP;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Content-Security-Policy "frame-ancestors 'self'" always;
    add_header Referrer-Policy "same-origin" always;

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    location ^~ /.well-known/acme-challenge/ {
        root ${WWW_DIR};
        allow all;
    }

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:${TMP_DIR}/php-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param PHP_VALUE "upload_max_filesize = 100M \n post_max_size=100M";
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        fastcgi_param HTTP_PROXY "";
        fastcgi_intercept_errors off;
        fastcgi_buffer_size 16k;
        fastcgi_buffers 4 16k;
        fastcgi_connect_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_read_timeout 300;
    }

    location ~ /\.git { deny all; }
    location ~ /\.ht  { deny all; }
}
EOF
}

# -------------------------------------------------------
# Main logic
# -------------------------------------------------------

if [[ -z "${CERTBOT_DOMAIN}" ]]; then
    # No domain configured – start HTTP only
    warn "CERTBOT_DOMAIN is not set. Starting nginx in HTTP-only mode on port ${NGINX_PORT}."
    write_http_config "${NGINX_PORT}"
else
    info "Domain configured: ${CERTBOT_DOMAIN}"
    CERT_DIR="${LETSENCRYPT_DIR}/live/${CERTBOT_DOMAIN}"

    if [[ -f "${CERT_DIR}/fullchain.pem" && -f "${CERT_DIR}/privkey.pem" ]]; then
        # Certificates already exist – use SSL config directly
        info "Existing SSL certificate found. Using HTTPS config on port ${NGINX_SSL_PORT}."
        write_ssl_config "${CERTBOT_DOMAIN}" "${NGINX_SSL_PORT}"
    else
        # Obtain certificate via certbot webroot challenge
        info "No certificate found. Attempting to obtain certificate for ${CERTBOT_DOMAIN}..."

        # Start nginx in the foreground (daemon off) in the background so certbot
        # can complete the ACME HTTP-01 challenge, and so we can wait on it later.
        write_http_config "${NGINX_PORT}"
        nginx -g "daemon off;" &
        NGINX_PID=$!

        if certbot certonly \
            --webroot \
            --webroot-path "${WWW_DIR}" \
            --non-interactive \
            --agree-tos \
            --email "admin@${CERTBOT_DOMAIN}" \
            --domains "${CERTBOT_DOMAIN}" \
            --config-dir "${LETSENCRYPT_DIR}" \
            --work-dir "/letsencrypt/work" \
            --logs-dir "/letsencrypt/logs"; then

            success "Certificate obtained successfully."
            # Swap to SSL config and reload nginx
            write_ssl_config "${CERTBOT_DOMAIN}" "${NGINX_SSL_PORT}"
            nginx -s reload
        else
            error "Failed to obtain certificate for ${CERTBOT_DOMAIN}."
            error "Falling back to HTTP-only mode on port ${NGINX_PORT}."
            # Keep the HTTP config nginx already loaded; nothing more to do
        fi

        # Wait on the nginx process we started above
        wait $NGINX_PID
        exit 0
    fi
fi

# Start nginx in the foreground (blocking)
info "Starting nginx..."
exec nginx -g "daemon off;"
