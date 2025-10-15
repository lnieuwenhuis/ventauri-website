@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting Ventauri Merch Production Deployment...

:: Function: wait for a service to be healthy (via Compose)
:wait_service_health
set "service=%~1"
set "label=%~2"
set "max=%~3"
if "%max%"=="" set "max=300"

echo Waiting for %label% (%service%) to be healthy (timeout: %max%s)...
set /a elapsed=0
:health_loop
set "cid="
for /f "delims=" %%i in ('docker compose -f docker-compose.prod.yml ps -q %service% 2^>nul') do set "cid=%%i"
if not defined cid (
    echo    - %label% container not found yet
    goto :wait_loop
)
set "status="
for /f "delims=" %%s in ('docker inspect -f "{{.State.Health.Status}}" !cid! 2^>nul') do set "status=%%s"
if /I "!status!"=="healthy" (
    echo %label% is healthy.
    goto :eof
)
if not defined status set "status=unknown"
echo    - %label% status: !status!
:wait_loop
timeout /t 5 /nobreak >nul
set /a elapsed+=5
if !elapsed! geq %max% (
    echo %label% did not become healthy in time (%max%s).
    docker compose -f docker-compose.prod.yml ps
    exit /b 1
)
goto health_loop

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

:: Start core services first (DB + Backend)
echo 🌟 Starting core services (DB + Backend)...
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build mariadb backend

:: Ensure DB and backend reach healthy before continuing
call :wait_service_health mariadb MariaDB 300
call :wait_service_health backend Backend 300

:: Start frontend and nginx
echo 🌟 Starting frontend and nginx...
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build frontend nginx

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

:: Final health check for DB and Backend
call :wait_service_health mariadb MariaDB 300
call :wait_service_health backend Backend 300

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