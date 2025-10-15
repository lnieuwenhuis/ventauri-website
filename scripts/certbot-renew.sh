#!/bin/sh
set -eu

WEBROOT=/var/www/certbot

echo "certbot-renew: starting renew loop (webroot: ${WEBROOT})"
while true; do
  date -u
  certbot renew --webroot --webroot-path="${WEBROOT}" || true
  sleep 12h
done