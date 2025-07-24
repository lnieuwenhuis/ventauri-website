@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting Ventauri Merch Production Deployment...

:: Check if .env.prod exists
if not exist ".env.prod" (
    echo ❌ Error: .env.prod file not found!
    echo Please create .env.prod with required environment variables.
    exit /b 1
)

:: Create SSL directory if it doesn't exist
if not exist "ssl\www" mkdir ssl\www

echo 📦 Building and starting services...

:: Stop existing services
docker compose -f docker-compose.prod.yml down

:: Start services (nginx first for certbot)
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build nginx

echo ⏳ Waiting for nginx to be ready...
timeout /t 10 /nobreak >nul

:: Generate SSL certificates
echo 🔒 Generating SSL certificates...
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm certbot

:: Start all services
echo 🌟 Starting all services...
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

:: Start auto-renewal
echo 🔄 Starting certificate auto-renewal...
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d certbot-renew

echo ✅ Deployment complete!
echo 🌐 Your site should be available at: https://your-domain.com
echo 📊 Check status with: docker compose -f docker-compose.prod.yml ps
echo 📋 View logs with: docker compose -f docker-compose.prod.yml logs -f

pause