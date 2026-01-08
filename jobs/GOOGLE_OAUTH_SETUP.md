# Google OAuth Configuration Guide

## Fix Port 8080 Issue - Update Redirect URI

### Step 1: Access Google Cloud Console
1. Go to: https://console.cloud.google.com
2. Sign in with your Google account
3. Select your project (or create one if needed)

### Step 2: Navigate to Credentials
1. Click on the hamburger menu (☰) in the top left
2. Go to **APIs & Services** → **Credentials**
3. Or navigate directly to: https://console.cloud.google.com/apis/credentials

### Step 3: Find Your OAuth 2.0 Client ID
Look for the OAuth 2.0 Client ID with:
- **Client ID**: `349041304919-lt0of7r5fklf6pvd5epj9n1dnh4d1ovt.apps.googleusercontent.com`

### Step 4: Edit the OAuth Client
1. Click on the OAuth 2.0 Client ID name (or click the pencil/edit icon)
2. This will open the editing page

### Step 5: Update Authorized Redirect URIs
In the **Authorized redirect URIs** section:

#### Remove (if present):
- `http://localhost:8080/login/oauth2/code/google`
- Any other entries with port 8080

#### Add:
- `http://localhost:2003/login/oauth2/code/google`

**Important Notes:**
- Use port **2003** (your frontend port), NOT 2000 (backend port)
- The URI must be exactly: `http://localhost:2003/login/oauth2/code/google`
- Case-sensitive and must match exactly

### Step 6: Save Changes
1. Click **SAVE** at the bottom of the page
2. Wait for confirmation that changes were saved

### Step 7: Clear Browser Cache
After updating the configuration:

#### Chrome/Edge:
- Press `Ctrl + Shift + Delete`
- Select "Cached images and files"
- Time range: "All time"
- Click "Clear data"

Or do a hard refresh:
- Press `Ctrl + Shift + R` or `Ctrl + F5`

#### Firefox:
- Press `Ctrl + Shift + Delete`
- Select "Cache"
- Time range: "Everything"
- Click "Clear Now"

### Step 8: Test the Login
1. Navigate to: http://localhost:2003
2. Click "Login with Google"
3. You should now be redirected correctly without seeing port 8080

## Verification Checklist

✅ Redirect URI in Google Console: `http://localhost:2003/login/oauth2/code/google`
✅ Backend running on port 2000
✅ Frontend running on port 2003
✅ Browser cache cleared
✅ Application accessible at http://localhost:2003

## Troubleshooting

**If you still see port 8080:**
1. Double-check the redirect URI in Google Console is exactly `http://localhost:2003/login/oauth2/code/google`
2. Clear browser cache again
3. Try an incognito/private window
4. Restart your Docker containers: `docker-compose restart` (from the `jobs/jobs` directory)

**If redirect fails:**
1. Verify your backend is running: `docker-compose ps`
2. Check backend logs: `docker-compose logs backend`
3. Ensure nginx is proxying correctly (check `frontend/nginx.conf`)

## Current Configuration (Already Correct in Code)

- **Backend Port**: 2000
- **Frontend Port**: 2003
- **MongoDB Port**: 2002
- **OAuth Redirect URI in code**: `http://localhost:2003/login/oauth2/code/{registrationId}`

The only thing that needs updating is the Google Cloud Console configuration.

