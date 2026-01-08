# Docker Setup Fix Guide

## Issues Fixed

1. ✅ **Root endpoint added** - Now when you visit `http://localhost:2000`, you'll see API status and available endpoints
2. ✅ **Frontend container added** - Frontend is now included in docker-compose and will run on port 2003
3. ✅ **Security configuration updated** - Root paths are now accessible without authentication
4. ✅ **API endpoints documented** - Root endpoint shows all available API endpoints

## How to Use

### Option 1: Full Docker Setup (Recommended)

This will start backend, frontend, and MongoDB:

```powershell
cd jobs
docker-compose up --build
```

**Access Points:**
- **Frontend**: http://localhost:2003
- **Backend API**: http://localhost:2000
- **API Status**: http://localhost:2000/ (shows API info)
- **MongoDB**: localhost:2002

### Option 2: Backend Only (Current Setup)

If you only want to run the backend in Docker:

```powershell
cd jobs
docker-compose up --build backend mongo redis
```

Then run the frontend separately:

```powershell
cd jobs/frontend
npm install
npm run dev
```

Frontend will run on http://localhost:2003 and connect to backend on http://localhost:2000

## Testing the Backend

After starting Docker, test these endpoints:

1. **Root endpoint** (shows API status):
   ```
   http://localhost:2000/
   ```

2. **API root**:
   ```
   http://localhost:2000/api
   ```

3. **Get all jobs**:
   ```
   http://localhost:2000/api/jobs
   ```

4. **Health check**:
   ```
   http://localhost:2000/api/test/health
   ```

5. **Database test**:
   ```
   http://localhost:2000/api/test/database
   ```

## Troubleshooting

### If containers don't start:

1. **Stop all containers**:
   ```powershell
   docker-compose down
   ```

2. **Remove old containers and images** (if needed):
   ```powershell
   docker-compose down -v
   docker system prune -a
   ```

3. **Rebuild from scratch**:
   ```powershell
   docker-compose up --build --force-recreate
   ```

### If backend shows "server never started":

1. **Check container logs**:
   ```powershell
   docker logs saarthix-backend
   ```

2. **Check if MongoDB is healthy**:
   ```powershell
   docker logs saarthix-mongo
   ```

3. **Verify ports are not in use**:
   ```powershell
   netstat -ano | findstr :2000
   netstat -ano | findstr :2002
   ```

### If frontend doesn't load:

1. **Check frontend container logs**:
   ```powershell
   docker logs saarthix-frontend
   ```

2. **Verify frontend build**:
   ```powershell
   cd jobs/frontend
   npm run build
   ```

## Container Status

Check running containers:
```powershell
docker ps
```

Check all containers (including stopped):
```powershell
docker ps -a
```

## What Changed

1. **RootController.java** - New controller that shows API status at root path
2. **SecurityConfig.java** - Updated to allow access to root and /api paths
3. **docker-compose.yml** - Added frontend service
4. **frontend/Dockerfile** - New Dockerfile for frontend container
5. **frontend/nginx.conf** - Nginx configuration for serving React app

## Notes

- Frontend container uses Nginx to serve the built React app
- Backend runs on port 2000 (mapped from container port 2000)
- Frontend runs on port 2003 (mapped from container port 80)

