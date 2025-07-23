#!/bin/bash

set -e

echo "🚀 Starting Ventauri Merch Production Deployment..."

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

# Start all services
echo "🌟 Starting all services..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Start auto-renewal
echo "🔄 Starting certificate auto-renewal..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d certbot-renew

echo "✅ Deployment complete!"
echo "🌐 Your site should be available at: https://$(grep DOMAIN .env.prod | cut -d'=' -f2)"
echo "📊 Check status with: docker-compose -f docker-compose.prod.yml ps"
echo "📋 View logs with: docker-compose -f docker-compose.prod.yml logs -f"