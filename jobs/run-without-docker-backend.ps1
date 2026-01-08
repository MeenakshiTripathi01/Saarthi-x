# Run Backend Locally (Without Docker Backend Container)
# This script starts MongoDB in Docker, then runs the backend locally
# Useful when Docker Hub images cannot be pulled

Write-Host "=== Running Backend Locally (Docker for DB only) ===" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB image is available
Write-Host "Checking for MongoDB image..." -ForegroundColor Yellow
$mongoImage = docker images mongo:7 -q

if (-not $mongoImage) {
    Write-Host "   ⚠ MongoDB image not found. Trying to start anyway..." -ForegroundColor Yellow
}

# Start MongoDB
Write-Host ""
Write-Host "Starting MongoDB container..." -ForegroundColor Yellow
& docker-compose -f docker-compose.local.yml up mongo -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ✗ Failed to start MongoDB container" -ForegroundColor Red
    Write-Host "   You may need to install MongoDB locally" -ForegroundColor Yellow
    exit 1
}

Write-Host "   ✓ MongoDB started" -ForegroundColor Green
Write-Host "   Waiting for MongoDB to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Build JAR if not exists
if (-not (Test-Path ".\build\libs\*.jar")) {
    Write-Host ""
    Write-Host "Building JAR file..." -ForegroundColor Yellow
    & .\gradlew.bat bootJar
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ✗ Failed to build JAR" -ForegroundColor Red
        exit 1
    }
}

# Run the backend
Write-Host ""
Write-Host "Starting backend application..." -ForegroundColor Yellow
Write-Host "   Backend will run on: http://localhost:2000" -ForegroundColor Gray
Write-Host "   MongoDB: localhost:2002" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

& .\gradlew.bat bootRun


