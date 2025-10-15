#!/bin/sh
set -e

# Ensure GNU wget is available for container healthcheck (BusyBox wget may lack flags)
if ! wget --version 2>/dev/null | grep -qi "gnu wget"; then
  echo "Ensuring GNU wget for healthcheck..."
  apk add --no-cache wget >/dev/null
fi

if [ -z "$DOMAIN" ]; then
  echo "DOMAIN env var is required" >&2
  exit 1
fi

TEMPLATE_DIR=/etc/nginx/templates
CONF_OUT=/etc/nginx/conf.d/default.conf
CERT_PATH=/etc/nginx/ssl/live/$DOMAIN/fullchain.pem

echo "Using domain: $DOMAIN"

if [ -f "$CERT_PATH" ]; then
  echo "Certificates found. Generating HTTPS config..."
  sed "s/\${DOMAIN}/$DOMAIN/g" "$TEMPLATE_DIR/default-https.conf.template" > "$CONF_OUT"
else
  echo "Certificates not found. Generating HTTP-only config for ACME challenge..."
  sed "s/\${DOMAIN}/$DOMAIN/g" "$TEMPLATE_DIR/default-http.conf.template" > "$CONF_OUT"
fi

echo "Starting nginx..."
exec nginx -g "daemon off;"