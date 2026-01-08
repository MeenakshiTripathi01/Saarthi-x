# Docker Setup Guide - Network Issues Workaround

Since you're experiencing network connectivity issues with Docker Hub, use this local build approach.

## Quick Start (Recommended)

Run the automated script:
```powershell
.\build-and-run.ps1
```

This will:
1. Build the JAR file locally (no Docker needed)
2. Build Docker image using the pre-built JAR (only needs runtime image)
3. Start all containers

## Manual Steps

### Step 1: Build JAR Locally
```powershell
.\gradlew.bat bootJar
```

### Step 2: Build and Run with Docker
```powershell
docker-compose -f docker-compose.local.yml up --build
```

## If Runtime Image is Also Not Available

If `eclipse-temurin:17-jre` cannot be pulled, you have these options:

### Option A: Run Without Docker (Backend Only)
```powershell
# Start MongoDB in Docker (if available)
docker-compose -f docker-compose.local.yml up mongo -d

# Run backend locally
.\gradlew.bat bootRun
```

### Option B: Pre-pull Images When Network is Available
When you have network access, pull the required image:
```powershell
docker pull eclipse-temurin:17-jre
```

Then use the local build approach.

## Troubleshooting

1. **Check if images are cached:**
   ```powershell
   docker images | findstr "eclipse-temurin mongo"
   ```

2. **Check Docker network:**
   ```powershell
   docker network ls
   ```

3. **View logs:**
   ```powershell
   docker-compose -f docker-compose.local.yml logs
   ```


