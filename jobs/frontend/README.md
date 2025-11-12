# Frontend Setup

This is a minimal frontend for the Jobs Portal application.

## Features

- Display jobs fetched from the backend API
- Google OAuth login integration
- Apply button disabled when not logged in
- User profile display when logged in

## Setup Instructions

### Option 1: Using Python HTTP Server (Recommended)

1. Navigate to the frontend directory:
   ```bash
   cd jobs/frontend
   ```

2. Start a simple HTTP server:
   ```bash
   # Python 3
   python -m http.server 3000
   
   # Or Python 2
   python -m SimpleHTTPServer 3000
   ```

3. Open your browser and go to: `http://localhost:3000`

### Option 2: Using Node.js http-server

1. Install http-server globally (if not already installed):
   ```bash
   npm install -g http-server
   ```

2. Navigate to the frontend directory:
   ```bash
   cd jobs/frontend
   ```

3. Start the server:
   ```bash
   http-server -p 3000
   ```

4. Open your browser and go to: `http://localhost:3000`

### Option 3: Using VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html` and select "Open with Live Server"

## Backend Requirements

Make sure the Spring Boot backend is running on `http://localhost:8080` before using the frontend.

## Configuration

If your backend runs on a different port, update the `API_BASE` constant in `app.js`:

```javascript
const API_BASE = 'http://localhost:8080/api';
```

## Usage

1. Start the backend server (port 8080)
2. Start the frontend server (port 3000)
3. Open `http://localhost:3000` in your browser
4. Click "Sign in with Google" to login
5. Browse jobs and apply (login required)

