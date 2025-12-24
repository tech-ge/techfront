# Production Configuration Quick Reference

## Environment Variables Needed

### Backend (Railway Dashboard)
```env
NODE_ENV=production
PORT=5002
MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/techg?retryWrites=true&w=majority
FRONTEND_URL=https://techfront-topaz.vercel.app
JWT_SECRET=<secure-random-string>
SESSION_SECRET=<secure-random-string>
```

### Frontend (Vercel Dashboard)
```env
REACT_APP_API_BASE_URL=https://techback-production.up.railway.app/api
REACT_APP_SOCKET_URL=https://techback-production.up.railway.app
REACT_APP_ENV=production
```

---

## Current Production Setup

| Component | URL | Status |
|-----------|-----|--------|
| Frontend | https://techfront-topaz.vercel.app | ✅ Deployed |
| Backend | https://techback-production.up.railway.app | ✅ Deployed |
| Database | MongoDB Atlas | ⚠️ Needs Configuration |

---

## Key Files Created

- `/techback-main/.env` - Backend environment variables
- `/techback-main/.env.example` - Template for backend env vars
- `/techfront-main/.env.production` - Frontend production variables
- `PRODUCTION_SETUP_GUIDE.md` - Detailed setup instructions

---

## Testing Commands

```bash
# Test backend health
curl https://techback-production.up.railway.app/health

# Test database connection
curl https://techback-production.up.railway.app/api/test-atlas

# Test API
curl https://techback-production.up.railway.app/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

---

## CORS Configuration

✅ Already configured in backend for:
- Frontend URL: `https://techfront-topaz.vercel.app`
- Socket.io enabled
- Credentials allowed

---

## Action Items

1. **MongoDB Atlas Setup**
   - [ ] Get connection string from MongoDB Atlas dashboard
   - [ ] Replace in MONGODB_URI env variable
   - [ ] Whitelist IP: 0.0.0.0/0 in Network Access

2. **Railway Configuration**
   - [ ] Set environment variables in Railway dashboard
   - [ ] Verify server.js runs with `node server.js`
   - [ ] Check /health endpoint responds

3. **Vercel Configuration**
   - [ ] Set environment variables in Vercel dashboard
   - [ ] Redeploy frontend after env vars are set
   - [ ] Verify API calls work

4. **Testing**
   - [ ] Test backend endpoints
   - [ ] Test login/auth flow
   - [ ] Test socket.io connections
   - [ ] Test file uploads
   - [ ] Monitor logs for errors

---

## Database Connection String Format

```
mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database>?retryWrites=true&w=majority
```

### Example (UPDATE WITH YOUR ACTUAL VALUES):
```
mongodb+srv://myuser:mypassword@mongodb-production-5dd4.mongodb.net/techg?retryWrites=true&w=majority
```

---

## Support URLs

- **Railway Dashboard**: https://railway.app/dashboard
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Backend Health**: https://techback-production.up.railway.app/health
- **API Test**: https://techback-production.up.railway.app/api/test-atlas

---

**Note**: Replace all placeholder values with your actual credentials and URLs.
