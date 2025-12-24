# Railway Environment Variables Setup Guide

## Step-by-Step Instructions for Railway Dashboard

### How to Set Environment Variables in Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Select your backend project
3. Click on the **backend service** (not the database)
4. Go to **Variables** tab
5. Click **RAW Editor** (or add individually)

### Copy and Paste These Variables

```
NODE_ENV=production
PORT=5002
FRONTEND_URL=https://techfront-topaz.vercel.app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-session-secret-key-change-this-in-production
MONGODB_URI=mongodb+srv://username:password@mongodb-production-5dd4.mongodb.net/techg?retryWrites=true&w=majority
LOG_LEVEL=info
SOCKET_IO_PATH=/socket.io/
SOCKET_IO_PING_TIMEOUT=60000
SOCKET_IO_PING_INTERVAL=25000
```

### Important: Modify These Values

Replace the following with YOUR actual values:

1. **MONGODB_URI** - Get from MongoDB Atlas dashboard
   - Go to MongoDB Atlas → Your Cluster
   - Click "Connect" → "Drivers"
   - Copy connection string
   - Replace `<password>` with your database password

2. **JWT_SECRET** - Generate a secure random string
   ```bash
   # Option 1: Use this command
   openssl rand -hex 32
   
   # Option 2: Use Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **SESSION_SECRET** - Generate another secure random string (same way as above)

### Example of Properly Filled Variables

```
NODE_ENV=production
PORT=5002
FRONTEND_URL=https://techfront-topaz.vercel.app
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
SESSION_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0
MONGODB_URI=mongodb+srv://myuser:myPassword123@mongodb-production-5dd4.mongodb.net/techg?retryWrites=true&w=majority
LOG_LEVEL=info
SOCKET_IO_PATH=/socket.io/
SOCKET_IO_PING_TIMEOUT=60000
SOCKET_IO_PING_INTERVAL=25000
```

---

## Step-by-Step Instructions for Vercel Dashboard

### How to Set Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your frontend project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New** for each variable

### Add These Variables

| Key | Value |
|-----|-------|
| `REACT_APP_API_BASE_URL` | `https://techback-production.up.railway.app/api` |
| `REACT_APP_SOCKET_URL` | `https://techback-production.up.railway.app` |
| `REACT_APP_ENV` | `production` |

### After Adding Variables

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **Redeploy** (three dots menu)
4. Confirm "Redeploy with current Environment Variables"

---

## Verification Steps

### Test Backend Connection
```bash
curl https://techback-production.up.railway.app/health
```

Expected: `{"status":"healthy","database":{"status":"connected"}}`

### Test Database Connection
```bash
curl https://techback-production.up.railway.app/api/test-atlas
```

Expected: `{"success":true,"message":"✅ MongoDB Atlas connection successful!"}`

### Test Frontend Connection
1. Open https://techfront-topaz.vercel.app
2. Open DevTools (F12) → Network tab
3. Try to login
4. Check API calls go to `https://techback-production.up.railway.app/api/...`

---

## MongoDB Atlas Network Configuration

### Allow Railway to Connect

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Select your cluster
3. Go to **Network Access** → **IP Whitelist**
4. Click **Add IP Address**
5. Enter: `0.0.0.0/0` (allows all IPs - for production, consider restricting)
6. Click **Confirm**

**Note**: In production, you might want to whitelist only Railway's IP. Contact Railway support for their static IP if needed.

---

## Troubleshooting

### Issue: "MONGODB_URI is not set"
**Solution**: Add MONGODB_URI in Railway Variables

### Issue: CORS Error
**Solution**: Ensure FRONTEND_URL is set correctly in Railway

### Issue: Database Connection Failed
**Solution**: 
1. Check MONGODB_URI is correct
2. Verify password is correct (no special characters need escaping in URL)
3. Check MongoDB Atlas IP whitelist includes Railway's IP

### Issue: Frontend Can't Connect to Backend
**Solution**:
1. Check REACT_APP_API_BASE_URL in Vercel env vars
2. Redeploy frontend after changing env vars
3. Clear browser cache (DevTools → Application → Cache)

---

## Useful Links

- **Railway Dashboard**: https://railway.app/dashboard
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Backend Health Check**: https://techback-production.up.railway.app/health
- **API Test**: https://techback-production.up.railway.app/api/test-atlas

---

## Next Steps After Configuration

1. ✅ Set Railway environment variables
2. ✅ Set Vercel environment variables
3. ✅ Configure MongoDB Atlas connection and IP whitelist
4. ✅ Verify all health checks pass
5. ✅ Test login and API calls
6. ✅ Monitor logs for any errors

**Last Updated**: December 24, 2025
