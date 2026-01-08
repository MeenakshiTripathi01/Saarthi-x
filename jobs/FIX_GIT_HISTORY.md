# How to Fix Git History with Exposed Secrets

## Current Situation

GitHub detected an OpenAI API key in your git history and is blocking the push. We've removed the hardcoded secret from the current code, but it still exists in previous commits.

## ⚠️ IMMEDIATE ACTION REQUIRED

**Revoke your OpenAI API key NOW:**
1. Go to: https://platform.openai.com/api-keys
2. Find and delete the exposed API key (check your recent commits to see which one was exposed)
3. Generate a new key immediately
4. Set the new key as an environment variable (see SECRETS_MANAGEMENT.md)

## Solution Options

### Option 1: Remove Secret from Git History (Recommended)

This will rewrite git history to remove the secret:

```bash
# Install git-filter-repo (if not installed)
# Windows (with git-bash): pip install git-filter-repo

# Navigate to your repo
cd "C:\Users\Meenakshi Tripathi\Downloads\jobs\jobs"

# Backup your current branch first!
git branch backup-before-history-rewrite

# Remove the secret from all commits
git filter-repo --path jobs/src/main/resources/application-docker.properties \
  --invert-paths \
  --path jobs/src/main/resources/application.properties

# Then re-add the files with the clean version
git add jobs/src/main/resources/application-docker.properties
git commit -m "Re-add application-docker.properties without secrets"

# Force push (CAUTION: This rewrites history!)
git push origin bugs --force
```

**OR use BFG Repo-Cleaner** (easier):
```bash
# Download BFG from: https://rtyley.github.io/bfg-repo-cleaner/

# Create a passwords.txt file with:
# YOUR_EXPOSED_API_KEY==>${OPENAI_API_KEY}

# Replace the secret with placeholders
java -jar bfg.jar --replace-text passwords.txt jobs/src/main/resources/application-docker.properties jobs/FIX_GIT_HISTORY.md
```

### Option 2: Use GitHub's Secret Scanning Bypass (Not Recommended)

If you must push immediately and can't rewrite history:
1. Visit the URL from the error: https://github.com/MeenakshiTripathi01/Saarthi-x/security/secret-scanning/unblock-secret/37y8f3p49l884D0DOX1lQ47XLPM
2. Follow the instructions to allow the push
3. **BUT** - This still leaves the secret in your git history, which is a security risk!

### Option 3: Create a New Branch/Repository

If rewriting history is too complex:
1. Create a fresh branch from the current state (without secrets)
2. Delete the old branch
3. Push the new branch

## After Fixing

1. Set your new OpenAI API key as an environment variable:
   ```bash
   # Create .env file in jobs/ directory
   echo "OPENAI_API_KEY=your-new-key-here" > .env
   ```

2. Never commit secrets to git again!
   - Always use environment variables
   - Check files before committing: `git diff` before `git add`

## Prevention

- Use `.env` files for local development (already in .gitignore)
- Use GitHub Secrets for CI/CD
- Review code before committing
- Use pre-commit hooks to scan for secrets

