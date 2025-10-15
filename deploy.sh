#!/bin/bash

set -e

echo "🚀 Starting Ventauri Merch Production Deployment..."

## Compose handles ordering via depends_on with service_healthy; no script polling needed.

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

echo "🌟 Starting core services (DB, Backend, Frontend, Nginx)..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build mariadb backend frontend nginx

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

# Start auto-renewal
echo "🔄 Starting certificate auto-renewal..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d certbot-renew

echo "✅ Deployment complete!"
echo "🌐 Your site should be available at: https://$(grep DOMAIN .env.prod | cut -d'=' -f2)"
echo "📊 Check status with: docker-compose -f docker-compose.prod.yml ps"
echo "📋 View logs with: docker-compose -f docker-compose.prod.yml logs -f"