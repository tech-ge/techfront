# MongoDB Atlas Setup for Production

## Step-by-Step MongoDB Atlas Configuration

### 1. Get Your Connection String

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Sign in** with your account
3. **Select your cluster** (e.g., `mongodb-production-5dd4`)
4. Click **Connect** button
5. Choose **Drivers** (not Compass)
6. Select **Node.js** driver
7. Copy the connection string

### 2. Connection String Format

You'll see something like this:
```
mongodb+srv://<username>:<password>@mongodb-production-5dd4.mongodb.net/?retryWrites=true&w=majority
```

### 3. Customize for Your Database

Replace the placeholders:

**Original**:
```
mongodb+srv://<username>:<password>@mongodb-production-5dd4.mongodb.net/?retryWrites=true&w=majority
```

**Modified** (add database name and parameters):
```
mongodb+srv://your_username:your_password@mongodb-production-5dd4.mongodb.net/techg?retryWrites=true&w=majority
```

### 4. What to Replace

- `<username>`: Your MongoDB database user (NOT your account email)
- `<password>`: Your MongoDB database user password
- Add `/techg` before `?` to specify database name
- Keep `?retryWrites=true&w=majority` at the end

### Example Connection String

```
mongodb+srv://techg_user:SecurePassword123@mongodb-production-5dd4.mongodb.net/techg?retryWrites=true&w=majority
```

---

## Configure Network Access

### Allow Railway Backend to Connect

1. **In MongoDB Atlas**, go to **Network Access**
2. Click **Add IP Address**
3. **Option A** (Quick, less secure): Enter `0.0.0.0/0`
   - Allows connections from anywhere
   - Good for testing/development
4. **Option B** (More secure): Get Railway's IP
   - Contact Railway support or check their docs
   - Enter Railway's specific IP address

### Steps for Network Access

1. MongoDB Atlas → Your Project → Network Access
2. Click **ADD IP ADDRESS** button
3. Enter your IP or `0.0.0.0/0`
4. Add optional comment: "Railway Backend"
5. Click **Confirm**

---

## Create Database User (if not exists)

### 1. In MongoDB Atlas, go to **Database Access**

2. Click **ADD NEW DATABASE USER**

3. **Username**: `techg_user` (or your preferred name)

4. **Password**: Generate a strong password
   ```bash
   openssl rand -hex 16
   ```

5. **Authentication Method**: Select "Password"

6. **Database User Privileges**: Select "Atlas Admin"

7. Click **Add User**

### Example Credentials

```
Username: techg_user
Password: a1b2c3d4e5f6g7h8
```

---

## Create Database and Collections

### 1. Create Database

1. Go to **Browse Collections** in your cluster
2. Click **Create Database**
3. Database name: `techg`
4. Collection name: `users`
5. Click **Create**

### 2. Create Additional Collections

Click **Create Collection** for each:
- `blogs`
- `messages`
- `notifications`
- `chatreports` or `reports`
- `chats`

---

## Sample Connection String with All Parameters

```
mongodb+srv://techg_user:YourPassword123@mongodb-production-5dd4.mongodb.net/techg?retryWrites=true&w=majority&maxPoolSize=50&serverSelectionTimeoutMS=30000
```

### Parameters Explained

| Parameter | Purpose |
|-----------|---------|
| `mongodb+srv://` | DNS-based connection |
| `techg_user` | Database username |
| `YourPassword123` | Database password |
| `mongodb-production-5dd4.mongodb.net` | Your cluster name |
| `techg` | Database name |
| `retryWrites=true` | Automatic retry on transient failures |
| `w=majority` | Write concern level |
| `maxPoolSize=50` | Max connections in pool |
| `serverSelectionTimeoutMS=30000` | 30 second timeout |

---

## Add to Railway

### Steps

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your backend service**
3. **Go to Variables tab**
4. **Add this variable**:
   ```
   MONGODB_URI=mongodb+srv://techg_user:YourPassword123@mongodb-production-5dd4.mongodb.net/techg?retryWrites=true&w=majority
   ```

---

## Test Connection

### Option 1: Using Backend API

After setting the MONGODB_URI, test with:

```bash
curl https://techback-production.up.railway.app/api/test-atlas
```

### Expected Response

```json
{
  "success": true,
  "message": "✅ MongoDB Atlas connection successful!",
  "ping": "ok",
  "availableDatabases": ["admin", "config", "techg", "local"],
  "timestamp": "2025-12-24T10:30:45.123Z"
}
```

### Option 2: Using MongoDB Atlas Compass

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Open Compass
3. Click "New Connection"
4. Paste your connection string
5. Click "Connect"

---

## Important Security Notes

⚠️ **Never commit MONGODB_URI to GitHub!**

Instead:
1. Store it in Railway environment variables (not in code)
2. Use `.env.example` for template (without real credentials)
3. Only actual credentials go in Railway/Vercel dashboards

---

## Common Issues & Solutions

### Issue: "Connection refused"
```
MongoServerSelectionError: connect ECONNREFUSED
```
**Solution**: Check MongoDB Atlas IP whitelist includes your IP

### Issue: "Authentication failed"
```
MongoServerError: Username or password is incorrect
```
**Solution**: Verify username and password in connection string

### Issue: "Database not found"
**Solution**: 
1. Database name in connection string must match
2. Check if database was created in MongoDB Atlas
3. Verify `/techg` is in the connection string

### Issue: "Connection timeout"
```
MongoServerSelectionError: connect ETIMEDOUT
```
**Solution**: 
1. Check internet connection
2. Verify IP is whitelisted
3. Check firewall isn't blocking MongoDB port 27017

---

## Useful MongoDB Atlas Links

- **Atlas Dashboard**: https://cloud.mongodb.com
- **Connection String Docs**: https://docs.mongodb.com/manual/reference/connection-string/
- **Network Access**: https://cloud.mongodb.com/v2/{projectId}#security/network/access
- **Database Access**: https://cloud.mongodb.com/v2/{projectId}#security/database/users

---

## Checklist

- [ ] MongoDB Atlas account created
- [ ] Cluster created (mongodb-production-5dd4)
- [ ] Database user created with strong password
- [ ] Database `techg` created
- [ ] Collections created (users, blogs, messages, etc.)
- [ ] IP whitelist configured (0.0.0.0/0 or specific IP)
- [ ] Connection string copied and verified
- [ ] Connection string added to Railway
- [ ] Test endpoint returns success
- [ ] Backend logs show "✅ MongoDB Atlas connected"

---

**Last Updated**: December 24, 2025
