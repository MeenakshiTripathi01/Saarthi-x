# Build and Run Script for Docker
# This script builds the JAR locally first, then uses Docker only for runtime
# This avoids needing to pull build images from Docker Hub

Write-Host "=== Building and Running Saarthix Jobs Application ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build the JAR locally
Write-Host "Step 1: Building JAR file locally..." -ForegroundColor Yellow
if (Test-Path ".\gradlew.bat") {
    Write-Host "   Running: .\gradlew.bat bootJar" -ForegroundColor Gray
    & .\gradlew.bat bootJar
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ✗ Failed to build JAR file" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✓ JAR file built successfully" -ForegroundColor Green
} else {
    Write-Host "   ✗ gradlew.bat not found. Are you in the correct directory?" -ForegroundColor Red
    exit 1
}

# Step 2: Check if JAR exists
$jarFile = Get-ChildItem -Path ".\build\libs" -Filter "*.jar" -Exclude "*plain.jar" | Select-Object -First 1
if (-not $jarFile) {
    Write-Host "   ✗ JAR file not found in build/libs/" -ForegroundColor Red
    exit 1
}

Write-Host "   Found JAR: $($jarFile.Name)" -ForegroundColor Green
Write-Host ""

# Step 3: Check if runtime image is available
Write-Host "Step 2: Checking for Docker runtime image..." -ForegroundColor Yellow
$runtimeImage = docker images eclipse-temurin:17-jre -q
if ($runtimeImage) {
    Write-Host "   ✓ Runtime image (eclipse-temurin:17-jre) is cached" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Runtime image not found. Docker will try to pull it." -ForegroundColor Yellow
    Write-Host "   If pull fails, you may need network access or the image cached." -ForegroundColor Gray
}
Write-Host ""

# Step 4: Build Docker image using local Dockerfile
Write-Host "Step 3: Building Docker image (using pre-built JAR)..." -ForegroundColor Yellow
Write-Host "   This only needs the runtime image (eclipse-temurin:17-jre)" -ForegroundColor Gray
Write-Host ""

# Use docker-compose with the local Dockerfile
Write-Host "   Running: docker-compose -f docker-compose.local.yml up --build" -ForegroundColor Gray
& docker-compose -f docker-compose.local.yml up --build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "   ⚠ Docker build failed. Trying alternative approaches..." -ForegroundColor Yellow
    Write-Host ""
    
    # Try building image directly
    Write-Host "   Attempt 1: Building image directly..." -ForegroundColor Gray
    & docker build -f Dockerfile.local -t saarthix-backend:local .
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Image built successfully. Starting containers..." -ForegroundColor Green
        & docker-compose -f docker-compose.local.yml up
        exit 0
    }
    
    Write-Host ""
    Write-Host "   ✗ Docker image build failed (likely network issue)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   === Alternative Solution: Run Backend Locally ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Since Docker Hub is not accessible, you can run the backend locally:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   1. Start MongoDB in Docker (if available):" -ForegroundColor White
    Write-Host "      docker-compose -f docker-compose.local.yml up mongo -d" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Run the backend locally:" -ForegroundColor White
    Write-Host "      .\gradlew.bat bootRun" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Or install MongoDB locally and update application.properties" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

