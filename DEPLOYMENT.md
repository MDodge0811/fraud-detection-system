# 🚀 Vercel Deployment Guide

This guide will help you set up fully automated deployments for the Fraud Detection System using Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Database**: Set up a PostgreSQL database (Neon, Supabase, or Railway recommended)
4. **Vercel CLI**: Install globally with `npm i -g vercel`

## 🏗️ Project Structure

```
fraud-detection-system/
├── frontend/           # React + Vite app
│   ├── vercel.json    # Frontend Vercel config
│   └── src/
├── backend/           # Node.js + Express API
│   ├── vercel.json    # Backend Vercel config
│   └── index.ts
├── .github/workflows/ # GitHub Actions
│   └── deploy.yml
└── vercel.json        # Root config
```

## 🔧 Step-by-Step Setup

### 1. Database Setup

#### Option A: Neon (Recommended)
```bash
# 1. Go to https://neon.tech
# 2. Create a new project
# 3. Copy the connection string
# 4. Add to Vercel environment variables
```

#### Option B: Supabase
```bash
# 1. Go to https://supabase.com
# 2. Create a new project
# 3. Get the connection string from Settings > Database
# 4. Add to Vercel environment variables
```

### 2. Vercel Project Setup

#### Frontend Project
```bash
# 1. Go to Vercel Dashboard
# 2. Click "New Project"
# 3. Import your GitHub repository
# 4. Set root directory to "frontend"
# 5. Configure build settings:
#    - Build Command: npm run build
#    - Output Directory: dist
#    - Install Command: npm install
```

#### Backend Project
```bash
# 1. Create another project in Vercel
# 2. Import the same GitHub repository
# 3. Set root directory to "backend"
# 4. Configure build settings:
#    - Build Command: npm run build
#    - Output Directory: .
#    - Install Command: npm install
```

### 3. Environment Variables

#### Frontend Environment Variables
In Vercel Dashboard > Settings > Environment Variables:

```bash
VITE_API_URL=https://your-backend-url.vercel.app/api
VITE_WS_URL=https://your-backend-url.vercel.app
```

#### Backend Environment Variables
```bash
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
```

### 4. GitHub Secrets Setup

Go to your GitHub repository > Settings > Secrets and variables > Actions:

```bash
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID_FRONTEND=your_frontend_project_id
VERCEL_PROJECT_ID_BACKEND=your_backend_project_id
```

#### How to get these values:

1. **VERCEL_TOKEN**:
   ```bash
   # Run this locally
   vercel login
   vercel whoami
   # Go to https://vercel.com/account/tokens
   # Create a new token
   ```

2. **VERCEL_ORG_ID**:
   ```bash
   # Run this locally
   vercel orgs ls
   # Copy the org ID
   ```

3. **Project IDs**:
   ```bash
   # Run this locally
   vercel projects ls
   # Copy the project IDs for frontend and backend
   ```

### 5. Database Migration

Before deploying, run database migrations:

```bash
# Locally or in Vercel function
cd backend
npx prisma db push
npx prisma generate
```

## 🔄 Deployment Workflow

### Automatic Deployments

1. **Main Branch**: Deploys to production
2. **Develop Branch**: Deploys to staging
3. **Pull Requests**: Creates preview deployments

### Manual Deployment

```bash
# Frontend
cd frontend
vercel --prod

# Backend
cd backend
vercel --prod
```

## 🌐 Custom Domains

### Frontend Domain
1. Go to Vercel Dashboard > Your Frontend Project
2. Settings > Domains
3. Add your custom domain (e.g., `app.yourdomain.com`)

### Backend Domain
1. Go to Vercel Dashboard > Your Backend Project
2. Settings > Domains
3. Add your custom domain (e.g., `api.yourdomain.com`)

## 🔒 Security Configuration

### CORS Setup
Update your backend CORS configuration:

```typescript
// backend/index.ts
app.use(cors({
  origin: [
    'https://your-frontend-domain.vercel.app',
    'https://your-custom-domain.com',
    'http://localhost:5173' // for development
  ],
  credentials: true
}));
```

### Environment Variables
- Never commit sensitive data to Git
- Use Vercel's environment variable system
- Rotate secrets regularly

## 📊 Monitoring & Analytics

### Vercel Analytics
1. Enable Vercel Analytics in your project settings
2. Monitor performance and user behavior

### Error Tracking
Consider adding error tracking:
- Sentry
- LogRocket
- Bugsnag

## 🧪 Testing Deployment

### Health Checks
```bash
# Test your deployed API
curl https://your-backend-url.vercel.app/health

# Test your frontend
curl https://your-frontend-url.vercel.app
```

### WebSocket Connection
Test WebSocket connectivity:
```javascript
// In browser console
const socket = io('https://your-backend-url.vercel.app');
socket.on('connect', () => console.log('Connected!'));
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Database Connection Issues**:
   - Verify DATABASE_URL is correct
   - Check if database is accessible from Vercel
   - Ensure Prisma client is generated

3. **CORS Errors**:
   - Update CORS configuration with correct origins
   - Check if frontend and backend URLs match

4. **WebSocket Issues**:
   - Verify WebSocket URL in frontend environment variables
   - Check if WebSocket is enabled in Vercel

### Debug Commands
```bash
# Check Vercel deployment logs
vercel logs

# Check build logs
vercel build

# Test locally with production environment
vercel dev
```

## 📈 Performance Optimization

### Frontend
- Enable Vercel's Edge Network
- Use image optimization
- Enable compression

### Backend
- Use Vercel's serverless functions efficiently
- Implement caching strategies
- Monitor function execution times

## 🔄 Continuous Integration

The GitHub Actions workflow will:
1. Run tests on every push
2. Deploy to staging on develop branch
3. Deploy to production on main branch
4. Create preview deployments for PRs

## 📞 Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **GitHub Actions**: [docs.github.com/en/actions](https://docs.github.com/en/actions)
- **Prisma Documentation**: [prisma.io/docs](https://prisma.io/docs)

---

🎉 **Congratulations!** Your Fraud Detection System is now set up for fully automated deployments with Vercel! 