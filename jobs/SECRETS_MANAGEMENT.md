# Secrets Management Guide

## ⚠️ IMPORTANT: Never commit secrets to Git!

This project uses environment variables for sensitive configuration. Follow these guidelines:

## Required Environment Variables

### For Docker Compose

1. Create a `.env` file in the project root (same directory as `docker-compose.yml`)
2. Copy `.env.example` to `.env`
3. Fill in your actual values:

```bash
OPENAI_API_KEY=your-actual-openai-api-key
```

### For Local Development (without Docker)

Set environment variables in your system or IDE:
- `OPENAI_API_KEY`: Your OpenAI API key (if using AI features)

Or create a local `application.properties` file that's not tracked by git.

## Git History Cleanup

If you've already committed secrets to git history, you need to:

1. **Revoke the exposed secrets immediately:**
   - OpenAI API Key: Go to https://platform.openai.com/api-keys and revoke the exposed key
   - Generate a new key

2. **Remove secrets from git history** (if this is your own repository):
   ```bash
   # Use git filter-repo (recommended) or BFG Repo-Cleaner
   # This will rewrite git history - coordinate with your team!
   ```

3. **Or create a new commit** that removes the secrets (secrets will still be in history but at least they're not active)

## Current Secrets in Code

The following are now using environment variables:
- ✅ OpenAI API Key: `${OPENAI_API_KEY}`

## Files to Never Commit

- `.env` (local environment variables)
- `application.properties` with real secrets
- Any file containing API keys, passwords, or tokens

## Verification

Before pushing to git:
```bash
# Check for common secret patterns
grep -r "sk-proj-" .  # OpenAI keys
grep -r "password" application*.properties
```

