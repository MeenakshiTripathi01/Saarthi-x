# Frontend Setup Guide

## Understanding the Architecture

This project has **two separate applications**:

1. **Backend (Spring Boot)** - REST API running on `http://localhost:2000`
2. **Frontend (React + Vite)** - UI application that should run on `http://localhost:2003`

The backend is **API-only** and does not serve the frontend HTML files.

## Quick Start

### Option 1: Run Frontend Separately (Recommended for Development)

1. **Start the backend** (already running on port 2000):
   ```powershell
   # Backend should already be running via Docker
   # Or run locally: .\gradlew.bat bootRun
   ```

2. **Start the frontend**:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

3. **Access the application**:
   - Frontend UI: `http://localhost:2003`
   - Backend API: `http://localhost:2000`

### Option 2: Build Frontend and Serve from Backend (Production)

If you want to serve the frontend from the backend:

1. **Build the frontend**:
   ```powershell
   cd frontend
   npm install
   npm run build
   ```

2. **Copy built files to Spring Boot static folder**:
   ```powershell
   # From the jobs directory
   xcopy /E /I frontend\dist\* src\main\resources\static\
   ```

3. **Restart the backend** - The frontend will now be served from `http://localhost:2000`

## Current Setup

- **Backend Port**: 2000 (host and container)
- **Frontend Port**: 2003 (when running `npm run dev`)
- **API Base URL**: `http://localhost:2000/api`
- **CORS**: Configured to allow `http://localhost:2003`

## Troubleshooting

### Error: "No static resource"

This happens when you access the backend root URL (`http://localhost:2000/`) directly. The backend is API-only.

**Solution**: 
- Access the frontend at `http://localhost:2003` (after running `npm run dev`)
- Or access API endpoints like `http://localhost:2000/api/jobs`

### Frontend can't connect to backend

1. Check backend is running: `http://localhost:2000/health`
2. Check CORS configuration in `SecurityConfig.java`
3. Verify frontend API URLs point to correct backend port

### Port conflicts

- Backend default: 2000
- Frontend default: 2003
- If ports are in use, update:
  - Backend: `application.properties` → `server.port`
  - Frontend: `vite.config.js` → `server.port`


