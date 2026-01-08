# Start Frontend Development Server
# This script starts the React frontend on http://localhost:2003

Write-Host "=== Starting Saarthix Jobs Frontend ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".\frontend\package.json")) {
    Write-Host "✗ Error: frontend folder not found!" -ForegroundColor Red
    Write-Host "  Make sure you're in the jobs directory" -ForegroundColor Yellow
    exit 1
}

# Navigate to frontend directory
Set-Location frontend

# Check if node_modules exists
if (-not (Test-Path ".\node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Check if backend is running
Write-Host "Checking backend connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:2000/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Backend is running on http://localhost:2000" -ForegroundColor Green
} catch {
    Write-Host "⚠ Backend not responding on http://localhost:2000" -ForegroundColor Yellow
    Write-Host "  Make sure the backend is running before using the frontend" -ForegroundColor Gray
}
Write-Host ""

# Start the development server
Write-Host "Starting frontend development server..." -ForegroundColor Yellow
Write-Host "  Frontend will be available at: http://localhost:2003" -ForegroundColor Gray
Write-Host "  Backend API: http://localhost:2000" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev


