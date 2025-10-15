#!/bin/bash

set -e

echo "🚀 Starting Ventauri Merch Production Deployment..."

wait_for_service_health() {
  local service_name="$1"
  local label="$2"
  local max_seconds="${3:-300}"

  echo "⏳ Waiting for ${label} (${service_name}) to be healthy (timeout: ${max_seconds}s)..."
  local elapsed=0
  while [ "$elapsed" -lt "$max_seconds" ]; do
    # Get container ID for service (robust to project name differences)
    cid=$(docker compose -f docker-compose.prod.yml ps -q "$service_name" 2>/dev/null)
    if [ -z "$cid" ]; then
      echo "   - ${label} container not found yet"
    else
      status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null || echo "unknown")
      if [ "$status" = "healthy" ]; then
        echo "✅ ${label} is healthy."
        return 0
      fi
      printf "   - ${label} status: %s\n" "$status"
    fi
    sleep 5
    elapsed=$((elapsed + 5))
  done
  echo "❌ ${label} did not become healthy in time (${max_seconds}s)."
  docker-compose -f docker-compose.prod.yml ps || true
  return 1
}

# Check if .env.prod exists
if [ ! -f ".env.prod" ]; then
    echo "❌ Error: .env.prod file not found!"
    echo "Please create .env.prod with required environment variables."
    exit 1
fi

# Create SSL directory if it doesn't exist
mkdir -p ssl/www
chmod 755 ssl

echo "📦 Building and starting services..."

# Stop existing services
docker-compose -f docker-compose.prod.yml down

# Start core services first (DB + Backend)
echo "🌟 Starting core services (DB + Backend)..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build mariadb backend

# Ensure DB and backend reach healthy before continuing
wait_for_service_health mariadb "MariaDB" 300 || exit 1
wait_for_service_health backend "Backend" 300 || exit 1

# Start frontend and nginx
echo "🌟 Starting frontend and nginx..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build frontend nginx

echo "⏳ Waiting briefly for nginx to be ready..."
sleep 10

# Generate SSL certificates
echo "🔒 Generating SSL certificates..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod run --rm certbot

# Restart nginx to switch from HTTP-only to HTTPS config
echo "🔁 Restarting nginx to enable HTTPS..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod restart nginx

# Ensure everything is up
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Final health check for DB and Backend
wait_for_service_health mariadb "MariaDB" 300 || exit 1
wait_for_service_health backend "Backend" 300 || exit 1

# Start auto-renewal
echo "🔄 Starting certificate auto-renewal..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d certbot-renew

echo "✅ Deployment complete!"
echo "🌐 Your site should be available at: https://$(grep DOMAIN .env.prod | cut -d'=' -f2)"
echo "📊 Check status with: docker-compose -f docker-compose.prod.yml ps"
echo "📋 View logs with: docker-compose -f docker-compose.prod.yml logs -f"