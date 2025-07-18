# 🚀 Railway Deployment Guide

This guide will help you deploy the Fraud Detection System backend to Railway with full WebSocket support.

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be on GitHub
3. **PostgreSQL Database**: We'll set this up on Railway

## 🚀 Step 1: Deploy Backend to Railway

### 1.1 Create New Project
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `fraud-detection-system` repository
5. Select the **`backend`** directory as the source

### 1.2 Configure Environment Variables
In your Railway project settings, add these environment variables:

```bash
# Database (we'll set this up next)
DATABASE_URL=your_railway_postgres_url

# Node Environment
NODE_ENV=production

# Port (Railway sets this automatically)
PORT=3000
```

## 🗄️ Step 2: Set Up PostgreSQL Database

### 2.1 Add PostgreSQL Service
1. In your Railway project, click **"New Service"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will create a PostgreSQL database

### 2.2 Connect Database to Backend
1. Go to your backend service settings
2. Add the PostgreSQL connection string as `DATABASE_URL`
3. The format will be: `postgresql://username:password@host:port/database`

### 2.3 Run Database Migrations
1. Go to your backend service
2. Click **"Deployments"** tab
3. The build process will automatically run Prisma migrations

## 🔧 Step 3: Update Frontend Configuration

### 3.1 Get Railway Backend URL
1. Go to your Railway backend service
2. Copy the **"Deploy URL"** (e.g., `https://your-app-name.railway.app`)

### 3.2 Update Vercel Frontend Environment Variables
1. Go to your Vercel frontend project settings
2. Add/update these environment variables:

```bash
# API URL (add /api for API calls)
VITE_API_URL=https://your-app-name.railway.app/api

# WebSocket URL (no /api for WebSocket)
VITE_WS_URL=https://your-app-name.railway.app
```

## 🧪 Step 4: Test the Deployment

### 4.1 Test API Endpoints
Visit these URLs to test your backend:
- **Health Check**: `https://your-app-name.railway.app/api/health`
- **Dashboard Stats**: `https://your-app-name.railway.app/api/dashboard/stats`
- **Transactions**: `https://your-app-name.railway.app/api/transactions`

### 4.2 Test WebSocket Connection
1. Open your frontend in the browser
2. Open Developer Tools → Console
3. You should see: `✅ WebSocket connected: [socket-id]`

## 🔄 Step 5: Update GitHub Actions (Optional)

If you want to keep using GitHub Actions for deployment:

### 5.1 Add Railway Token
1. Go to Railway → Account → Tokens
2. Create a new token
3. Add it to GitHub Secrets as `RAILWAY_TOKEN`

### 5.2 Update Workflow
Update `.github/workflows/deploy.yml` to deploy backend to Railway instead of Vercel.

## 🎉 Benefits of Railway Deployment

✅ **Full WebSocket Support** - No more polling fallback needed
✅ **PostgreSQL Database** - Managed database with automatic backups
✅ **Auto-Deployment** - Deploys on every push to main branch
✅ **Environment Variables** - Easy management through Railway dashboard
✅ **Health Checks** - Automatic monitoring and restart on failure
✅ **Logs** - Real-time logs and debugging

## 🚨 Troubleshooting

### Database Connection Issues
- Check that `DATABASE_URL` is correctly set
- Ensure the database service is running
- Check Railway logs for connection errors

### WebSocket Connection Issues
- Verify `VITE_WS_URL` points to Railway backend (no `/api`)
- Check that CORS is configured for your frontend domain
- Look at Railway logs for WebSocket errors

### Build Issues
- Check that all dependencies are in `package.json`
- Verify the build script runs successfully
- Check Railway build logs for TypeScript errors

## 📞 Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Project Issues**: Create an issue in this repository

---

**Next Steps**: After deployment, your frontend will have real-time WebSocket connections and your backend will be fully functional on Railway! 🎉 