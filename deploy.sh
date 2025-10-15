#!/bin/bash

set -e

echo "🚀 Starting Ventauri Merch Production Deployment..."

wait_for_container_health() {
  local container_name="$1"
  local label="$2"
  local max_seconds="${3:-240}"

  echo "⏳ Waiting for ${label} to be healthy (timeout: ${max_seconds}s)..."
  local elapsed=0
  while [ "$elapsed" -lt "$max_seconds" ]; do
    # Capture health status; default to "starting" if inspect fails
    status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_name" 2>/dev/null || echo "unknown")
    if [ "$status" = "healthy" ]; then
      echo "✅ ${label} is healthy."
      return 0
    fi
    printf "   - ${label} status: %s\n" "$status"
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

# Start services (nginx first for certbot)
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build nginx

echo "⏳ Waiting for nginx to be ready..."
sleep 10

# Generate SSL certificates
echo "🔒 Generating SSL certificates..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod run --rm certbot

# Restart nginx to switch from HTTP-only to HTTPS config
echo "🔁 Restarting nginx to enable HTTPS..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod restart nginx

# Start all services
echo "🌟 Starting all services..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Ensure DB and backend reach healthy before finishing
wait_for_container_health ventauri-merch-db-prod "MariaDB" 300 || exit 1
wait_for_container_health ventauri-merch-backend-prod "Backend" 300 || exit 1

# Start auto-renewal
echo "🔄 Starting certificate auto-renewal..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d certbot-renew

echo "✅ Deployment complete!"
echo "🌐 Your site should be available at: https://$(grep DOMAIN .env.prod | cut -d'=' -f2)"
echo "📊 Check status with: docker-compose -f docker-compose.prod.yml ps"
echo "📋 View logs with: docker-compose -f docker-compose.prod.yml logs -f"