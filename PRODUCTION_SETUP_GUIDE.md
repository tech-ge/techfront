# Production Deployment & Configuration Guide

## Overview
This document guides you through connecting your frontend (Vercel), backend (Railway), and database (MongoDB Atlas) for production.

---

## Current Production URLs
- **Frontend**: https://techfront-topaz.vercel.app
- **Backend**: https://techback-production.up.railway.app
- **Database**: MongoDB Atlas (https://mongodb-production-5dd4.up.railway.app/)

---

## STEP 1: Backend Configuration (Railway)

### 1.1 Set Environment Variables in Railway Dashboard

Go to [Railway Dashboard](https://railway.app) and set these environment variables for your backend service:

```env
NODE_ENV=production
PORT=5002
MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/techg?retryWrites=true&w=majority
FRONTEND_URL=https://techfront-topaz.vercel.app
JWT_SECRET=<generate-a-secure-random-string>
SESSION_SECRET=<generate-a-secure-random-string>
```

### 1.2 Get Your MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Select your project and cluster
3. Click "Connect" → "Drivers"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Format: `mongodb+srv://username:password@cluster-name.mongodb.net/techg?retryWrites=true&w=majority`

### 1.3 Verify Backend is Running

Test your backend:
```bash
curl https://techback-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "atlas": "MongoDB Atlas"
  }
}
```

---

## STEP 2: Frontend Configuration (Vercel)

### 2.1 Environment Variables in Vercel Dashboard

Go to your Vercel project settings and add:

**Environment Variables** → Add these:
```
REACT_APP_API_BASE_URL=https://techback-production.up.railway.app/api
REACT_APP_SOCKET_URL=https://techback-production.up.railway.app
REACT_APP_ENV=production
```

### 2.2 Build Configuration

Your `package.json` already has the correct build script:
```json
{
  "scripts": {
    "build": "react-scripts build"
  }
}
```

### 2.3 Verify Frontend Configuration

The frontend API configuration in [src/utils/api.js](src/utils/api.js) is already set to:
```javascript
const API_BASE_URL = 'https://techback-production.up.railway.app/api';
```

---

## STEP 3: Database Connection Verification

### 3.1 Test Backend-Database Connection

Go to: `https://techback-production.up.railway.app/api/test-atlas`

Expected response:
```json
{
  "success": true,
  "message": "✅ MongoDB Atlas connection successful!",
  "ping": "ok",
  "availableDatabases": ["admin", "config", "techg", "local"]
}
```

### 3.2 MongoDB Atlas Network Access

Make sure in MongoDB Atlas:
1. Go to **Network Access** → **IP Whitelist**
2. Add **0.0.0.0/0** (Allow access from anywhere) for Railway
3. Or add Railway's IP if available

### 3.3 Database Collections

Ensure these collections exist in your MongoDB `techg` database:
- `users`
- `blogs`
- `messages`
- `notifications`
- `chatreports`

---

## STEP 4: CORS Configuration

### Backend (Already Configured)

The backend in [server.js](server.js) has dynamic CORS:

```javascript
const allowedOrigins = isProduction
  ? [
      process.env.FRONTEND_URL || 'https://techfront-topaz.vercel.app',
      'https://techfront-topaz.vercel.app'
    ]
  : ['http://localhost:3000'];
```

This allows:
- Your frontend domain
- Socket.io connections
- Credentials (cookies/auth tokens)

---

## STEP 5: Deployment Checklist

### Backend (Railway)
- [ ] Environment variables set in Railway dashboard
- [ ] MONGODB_URI is correct
- [ ] FRONTEND_URL matches your Vercel domain
- [ ] Health check passes: `/health`
- [ ] Database test passes: `/api/test-atlas`
- [ ] Server starts successfully (check Railway logs)

### Frontend (Vercel)
- [ ] Environment variables set in Vercel dashboard
- [ ] REACT_APP_API_BASE_URL points to your Railway backend
- [ ] Build completes successfully
- [ ] Can login and access protected routes
- [ ] Socket.io connections work (chat, notifications)

### Database (MongoDB Atlas)
- [ ] Connection string is correct
- [ ] Network access allows Railway IP
- [ ] Database `techg` exists
- [ ] Collections are created with proper schemas
- [ ] Indexes are set up

---

## STEP 6: Testing Connections

### Test 1: Backend Health
```bash
curl https://techback-production.up.railway.app/health
```

### Test 2: Database Connection
```bash
curl https://techback-production.up.railway.app/api/test-atlas
```

### Test 3: Frontend API Calls
1. Open your frontend in browser
2. Open DevTools → Network tab
3. Try to login
4. Check API requests are going to correct URL
5. Verify authentication works

### Test 4: Socket.io Connection
1. Open frontend
2. Open DevTools → Console
3. Check for socket connection messages
4. Try chat/notification features

---

## STEP 7: Troubleshooting

### Database Connection Issues
**Error**: `MONGODB_URI not set`
- Solution: Add MONGODB_URI in Railway environment variables

**Error**: `Connection refused`
- Solution: Check MongoDB Atlas IP whitelist includes 0.0.0.0/0

**Error**: `Authentication failed`
- Solution: Verify username/password in connection string

### Frontend Not Connecting to Backend
**Error**: `CORS error`
- Solution: Ensure FRONTEND_URL env var is set correctly in Railway

**Error**: `404 Not Found`
- Solution: Check REACT_APP_API_BASE_URL includes `/api` at the end

### Socket.io Connection Issues
**Error**: `WebSocket connection failed`
- Solution: Check that socket.io path is correct: `/socket.io/`

---

## STEP 8: Local Development (Optional)

To test locally before production:

### Backend
```bash
cd techback-main
npm install
# Create .env file with:
NODE_ENV=development
MONGODB_URI=your_local_or_atlas_uri
```

### Frontend
```bash
cd techfront-main
npm install
# .env.local file:
REACT_APP_API_BASE_URL=http://localhost:5002/api
REACT_APP_SOCKET_URL=http://localhost:5002
```

---

## Important Security Notes

⚠️ **DO NOT commit `.env` files to GitHub!**
- They contain sensitive credentials
- Use `.env.example` as a template
- Set variables in platform dashboards instead:
  - Railway Dashboard for backend
  - Vercel Dashboard for frontend

### Generate Secure Secrets
```bash
# Linux/Mac
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## API Endpoints Reference

All API endpoints use: `https://techback-production.up.railway.app/api/`

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user

### Users
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update user profile
- `GET /users` - List all users

### Blogs
- `GET /blog` - Get all blogs
- `POST /blog` - Create blog post
- `GET /blog/:id` - Get single blog
- `PUT /blog/:id` - Update blog
- `DELETE /blog/:id` - Delete blog

### Messages & Chat
- `POST /messages` - Send message
- `GET /messages` - Get messages
- `POST /chat` - Chat operations

### Notifications
- `GET /notifications` - Get notifications
- `POST /notifications` - Create notification

---

## Health Monitoring

Check your services status:

1. **Backend Health**: `https://techback-production.up.railway.app/health`
2. **Frontend**: `https://techfront-topaz.vercel.app`
3. **Database**: Test via `/api/test-atlas`

---

## Next Steps

1. ✅ Set all environment variables in Railway and Vercel dashboards
2. ✅ Verify database connection works
3. ✅ Test frontend login and API calls
4. ✅ Test socket.io features (chat, notifications)
5. ✅ Monitor logs for any errors
6. ✅ Set up monitoring/alerts for production

---

**Last Updated**: December 24, 2025
