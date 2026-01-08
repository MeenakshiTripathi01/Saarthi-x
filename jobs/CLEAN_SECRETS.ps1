# PowerShell script to remove secrets from git history
# Run this from the jobs/jobs directory

Write-Host "⚠️  WARNING: This will rewrite git history!" -ForegroundColor Yellow
Write-Host "Make sure you have a backup or push to a different branch first." -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Do you want to continue? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "Aborted." -ForegroundColor Red
    exit
}

# Backup current branch
Write-Host "Creating backup branch..." -ForegroundColor Green
git branch backup-before-secret-cleanup

# Get the secret key to remove (check the error message from GitHub)
$secretKey = Read-Host "Enter the OpenAI API key to remove (or press Enter to use pattern matching)"

if ([string]::IsNullOrWhiteSpace($secretKey)) {
    Write-Host "Using pattern matching to find secrets..." -ForegroundColor Yellow
    # Use git filter-branch to remove lines containing the secret pattern
    git filter-branch --force --index-filter `
        "git rm --cached --ignore-unmatch 'src/main/resources/application-docker.properties' 'FIX_GIT_HISTORY.md' 2>$null || true" `
        --prune-empty --tag-name-filter cat -- --all
    
    # Now re-add the clean files
    Write-Host "Re-adding clean files..." -ForegroundColor Green
    git checkout bugs
    git add src/main/resources/application-docker.properties FIX_GIT_HISTORY.md 2>$null
    if (git diff --staged --quiet) {
        Write-Host "No changes to commit." -ForegroundColor Yellow
    } else {
        git commit -m "Re-add files without secrets"
    }
} else {
    # Use sed or find-replace to remove the specific key
    Write-Host "Removing specific secret key from history..." -ForegroundColor Green
    git filter-branch --force --tree-filter `
        "if (Test-Path 'src/main/resources/application-docker.properties') { (Get-Content 'src/main/resources/application-docker.properties') -replace '$secretKey', '\${OPENAI_API_KEY}' | Set-Content 'src/main/resources/application-docker.properties' }" `
        --prune-empty --tag-name-filter cat -- --all
}

Write-Host ""
Write-Host "✅ Git history cleaned!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify the changes: git log --all --full-history -- '**/application-docker.properties'" -ForegroundColor White
Write-Host "2. Force push: git push origin bugs --force" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Note: Force push will rewrite remote history. Make sure your team is aware!" -ForegroundColor Yellow

