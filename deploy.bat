@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting Ventauri Merch Production Deployment...

:: Compose handles ordering via depends_on with service_healthy; no script polling needed.

:: Check if .env.prod exists
if not exist ".env.prod" (
    echo ❌ Error: .env.prod file not found!
    echo Please create .env.prod with required environment variables.
    exit /b 1
)

:: Read DOMAIN from .env.prod for display
for /f "usebackq tokens=1,* delims==" %%A in (".env.prod") do (
    if /I "%%A"=="DOMAIN" set "DOMAIN=%%B"
)

:: Create SSL directory if it doesn't exist
if not exist "ssl\www" mkdir ssl\www

echo 📦 Building and starting services...

:: Stop existing services
docker compose -f docker-compose.prod.yml down

:: Start core services (DB, Backend, Frontend, Nginx)
echo 🌟 Starting core services (DB, Backend, Frontend, Nginx)...
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build mariadb backend frontend nginx

:: Give nginx a short moment
timeout /t 10 /nobreak >nul

:: Generate SSL certificates
echo 🔒 Generating SSL certificates...
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm certbot

:: Restart nginx to enable HTTPS
echo 🔁 Restarting nginx to enable HTTPS...
docker compose -f docker-compose.prod.yml --env-file .env.prod restart nginx

:: Ensure everything is up
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

:: Start auto-renewal
echo 🔄 Starting certificate auto-renewal...
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d certbot-renew

echo ✅ Deployment complete!
if defined DOMAIN (
  echo 🌐 Your site should be available at: https://%DOMAIN%
) else (
  echo 🌐 Your site should be available at your configured domain.
)
echo 📊 Check status with: docker compose -f docker-compose.prod.yml ps
echo 📋 View logs with: docker compose -f docker-compose.prod.yml logs -f

pause