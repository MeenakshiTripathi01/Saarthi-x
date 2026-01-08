# Script to seed 100 dummy users
Write-Host "Seeding 100 dummy users..." -ForegroundColor Green

try {
    $response = Invoke-RestMethod -Uri "http://localhost:2000/api/test/seed-users?count=100" -Method GET
    
    Write-Host "`nSeeding completed successfully!" -ForegroundColor Green
    Write-Host "Status: $($response.status)" -ForegroundColor Cyan
    Write-Host "Requested Count: $($response.requestedCount)" -ForegroundColor Cyan
    Write-Host "Seeded Count: $($response.seededCount)" -ForegroundColor Cyan
    Write-Host "Users Before: $($response.usersBefore)" -ForegroundColor Yellow
    Write-Host "Users After: $($response.usersAfter)" -ForegroundColor Yellow
    Write-Host "Total Users: $($response.totalUsers)" -ForegroundColor Green
    
} catch {
    Write-Host "`nError occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    
    Write-Host "`nMake sure:" -ForegroundColor Yellow
    Write-Host "1. Backend is running on http://localhost:2000" -ForegroundColor Yellow
    Write-Host "2. You have restarted the backend after the security config change" -ForegroundColor Yellow
}



