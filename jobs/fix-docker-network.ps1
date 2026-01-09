# Docker Network Fix Script
# This script helps diagnose and fix Docker network connectivity issues

Write-Host "=== Docker Network Diagnostic Script ===" -ForegroundColor Cyan
Write-Host ""

# Check Docker daemon status
Write-Host "1. Checking Docker daemon status..." -ForegroundColor Yellow
$dockerStatus = docker info 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Docker daemon is running" -ForegroundColor Green
} else {
    Write-Host "   ✗ Docker daemon is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Test DNS resolution
Write-Host "`n2. Testing DNS resolution..." -ForegroundColor Yellow
$dnsTest = Test-NetConnection -ComputerName registry-1.docker.io -Port 443 -WarningAction SilentlyContinue
if ($dnsTest.TcpTestSucceeded) {
    Write-Host "   ✓ Can reach Docker Hub registry" -ForegroundColor Green
} else {
    Write-Host "   ✗ Cannot reach Docker Hub registry" -ForegroundColor Red
    Write-Host "   Attempting to configure Docker DNS..." -ForegroundColor Yellow
    
    # Try to configure Docker Desktop DNS
    $dockerConfigPath = "$env:USERPROFILE\.docker\daemon.json"
    $dockerConfig = @{
        dns = @("8.8.8.8", "8.8.4.4", "1.1.1.1")
    } | ConvertTo-Json
    
    try {
        if (Test-Path $dockerConfigPath) {
            $existing = Get-Content $dockerConfigPath | ConvertFrom-Json
            if (-not $existing.dns) {
                $existing | Add-Member -MemberType NoteProperty -Name "dns" -Value @("8.8.8.8", "8.8.4.4", "1.1.1.1") -Force
                $existing | ConvertTo-Json -Depth 10 | Set-Content $dockerConfigPath
                Write-Host "   ✓ Updated Docker daemon.json with DNS settings" -ForegroundColor Green
                Write-Host "   ⚠ Please restart Docker Desktop for changes to take effect" -ForegroundColor Yellow
            } else {
                Write-Host "   ℹ DNS already configured in daemon.json" -ForegroundColor Cyan
            }
        } else {
            $dockerConfig | Set-Content $dockerConfigPath
            Write-Host "   ✓ Created Docker daemon.json with DNS settings" -ForegroundColor Green
            Write-Host "   ⚠ Please restart Docker Desktop for changes to take effect" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ✗ Could not update Docker configuration: $_" -ForegroundColor Red
    }
}

# Check for cached images
Write-Host "`n3. Checking for cached Docker images..." -ForegroundColor Yellow
$gradleImage = docker images gradle:8.9-jdk17-alpine -q
$temurinImage = docker images eclipse-temurin:17-jre-alpine -q

if ($gradleImage) {
    Write-Host "   ✓ gradle:8.9-jdk17-alpine is cached" -ForegroundColor Green
} else {
    Write-Host "   ✗ gradle:8.9-jdk17-alpine not found in cache" -ForegroundColor Red
}

if ($temurinImage) {
    Write-Host "   ✓ eclipse-temurin:17-jre-alpine is cached" -ForegroundColor Green
} else {
    Write-Host "   ✗ eclipse-temurin:17-jre-alpine not found in cache" -ForegroundColor Red
}

# Provide recommendations
Write-Host "`n=== Recommendations ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If network issues persist, try these options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Build JAR locally first, then use Dockerfile.local" -ForegroundColor White
Write-Host "   1. Run: .\gradlew.bat bootJar" -ForegroundColor Gray
Write-Host "   2. Update docker-compose.yml to use Dockerfile.local" -ForegroundColor Gray
Write-Host "   3. Run: docker-compose up --build" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Use pre-pulled images" -ForegroundColor White
Write-Host "   1. Try pulling images manually when network is available:" -ForegroundColor Gray
Write-Host "      docker pull gradle:8.9-jdk17-alpine" -ForegroundColor Gray
Write-Host "      docker pull eclipse-temurin:17-jre-alpine" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 3: Check proxy/firewall settings" -ForegroundColor White
Write-Host "   - Ensure Docker Desktop has network access" -ForegroundColor Gray
Write-Host "   - Check if you're behind a corporate proxy" -ForegroundColor Gray
Write-Host "   - Configure proxy in Docker Desktop settings if needed" -ForegroundColor Gray
Write-Host ""



