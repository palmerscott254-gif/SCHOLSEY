# SCHOLSEY - Smart Device Security & Tracking System

> 📐 **[View Complete Architecture Diagram](./ARCHITECTURE.md)** - System overview, data flows, and technical stack

# How to Run the Frontend (Desktop App)

## Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:3000`
- Redis running on port 6379

## Quick Start

### 1. Navigate to Desktop Directory
```bash
cd desktop
```

### 2. Install Dependencies
```bash
npm install
```

**Note:** If you encounter an npm installation error with `ENOTEMPTY`, clean and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### 3. Start the Desktop App
```bash
npm run dev
```

This will:
- Start Vite development server on `http://localhost:5173`
- Launch the Electron desktop application window

## Troubleshooting

### Electron Installation Error

If you see: `Error: Electron failed to install correctly`

**Solution:**
```bash
rm -rf node_modules/electron
npm install electron
npm run dev
```

### Port Already in Use

If port 5173 is already in use:
```bash
# Kill the process using port 5173
lsof -ti :5173 | xargs kill -9
npm run dev
```

### Backend Connection Issues

Make sure the backend is running:
```bash
# In the backend directory
cd ../backend
npm run start:dev
```

The desktop app expects the API at `http://localhost:3000`

## Authentication

The login page supports:

### Email/Password Authentication
- Create a new account with email and password
- Password must be at least 8 characters
- Password visibility toggle for convenience
- Secure password confirmation on registration

### Google OAuth (Coming Soon)
- Quick sign-in with Google account
- No password needed
- Automatic account creation on first login

The app connects to the backend API at:
- **Login**: `POST http://localhost:3000/v1/auth/login`
- **Register**: `POST http://localhost:3000/v1/auth/register`
- **Google OAuth**: Integration in progress

### Redis Not Running

If you see Redis connection errors, start Redis:
```bash
# Using Podman (if Docker is not available)
podman run -d -p 6379:6379 docker.io/library/redis:latest

# Or using Docker
docker run -d -p 6379:6379 redis
```

## Available Scripts

- `npm run dev` - Start development mode (Electron + Vite)
- `npm run build` - Build the application for production
- `npm run start` - Start the built application

## Features

The desktop app provides:
- Real-time device monitoring
- Interactive map with device locations
- Security alerts timeline
- Remote device actions (lock, alarm, locate)
- AI image analysis interface
- Charts and analytics
- 2FA setup and management
- **User registration and login**
- **Google OAuth authentication** (integration in progress)
- Password visibility toggle
- Form validation
- **Guest mode** - Access dashboard without authentication
- **Quick login from dashboard** - Login menu in top navigation bar

## Tech Stack

- **Framework:** Electron 28+
- **UI Library:** React 18+
- **UI Components:** Material-UI v5
- **Maps:** Mapbox GL
- **Charts:** Recharts
- **State Management:** Redux Toolkit
- **Build Tool:** Vite

## First Time Setup

The app can be used in two modes:

### Guest Mode (No Login Required)
- Access all dashboard features without authentication
- Click "Continue as Guest" on the login page
- Or click the account icon in the top-right corner to access login anytime

### Authenticated User
1. **Create an account** 
   - Click "Create one" on the login page
   - Fill in your first name, last name, email, and password
   - Or use "Continue with Google" for OAuth login
2. **Sign in** with your credentials
3. **Enable 2FA** (optional but recommended)
4. **Pair a device** using QR code or pairing code
5. Start monitoring your devices!

**Note:** Guest mode allows you to explore the app, but authentication is required for full device management and security features.

## Development Mode

The app runs in two processes:
- **Main Process** - Electron backend (Node.js)
- **Renderer Process** - React frontend (Vite dev server)

Hot reload is enabled for both processes during development.

## 📚 Documentation

- **[Architecture Diagram](./ARCHITECTURE.md)** - Complete system architecture, data flows, API endpoints
- **[Device Linking Guide](./docs/DEVICE_LINKING.md)** - 2-step pairing implementation details
- **[Implementation Summary](./docs/DEVICE_LINKING_IMPLEMENTATION.md)** - Device pairing technical overview
- **[Audit Report](./AUDIT_REPORT.md)** - Security audit findings
- **[Executive Summary](./EXECUTIVE_SUMMARY.md)** - Project overview

## Need Help?

- Check backend logs in `backend/` terminal
- Check frontend logs in Electron DevTools (View → Toggle Developer Tools)
- Verify all services are running with `podman ps` or `docker ps`
