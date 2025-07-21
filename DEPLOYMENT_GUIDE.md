# 🚀 Deployment Guide

## 🏠 Local Development

### Quick Start (Recommended)
```bash
# Clone and setup
git clone <repository-url>
cd fraud-detection-system

# Start all services
docker compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
# Database: localhost:5433
```

### Manual Setup (Alternative)
```bash
# Backend setup
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

## 🌐 Production Deployment

### Backend (Railway)

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

#### 2. Login and Deploy
```bash
railway login
railway up
```

#### 3. Database Setup
```bash
# Apply migrations
railway run npx prisma migrate deploy

# Seed database
railway run npm run seed
```

#### 4. Environment Variables
Set in Railway dashboard:
```bash
DATABASE_URL=your_railway_postgres_url
NODE_ENV=production
```

### Frontend (Vercel)

#### 1. Connect Repository
- Fork this repository to your GitHub account
- Connect to Vercel
- Import the frontend directory

#### 2. Environment Variables
Set in Vercel dashboard:
```bash
VITE_API_URL=https://your-railway-backend.railway.app/api
VITE_WS_URL=https://your-railway-backend.railway.app
```

#### 3. Deploy
- Vercel will automatically deploy on push to main
- Preview deployments for pull requests

## 🔧 Troubleshooting

### Common Issues

#### WebSocket Not Working
```bash
# Check backend logs
docker compose logs backend | grep "WebSocket"

# Verify frontend connection
# Check browser console for errors
```

#### Database Connection Issues
```bash
# Check database status
docker compose logs postgres

# Reset local database
docker compose down
docker volume rm fraud-detection-system_postgres_data
docker compose up -d
```

#### Frontend Not Updating
```bash
# Rebuild frontend
docker compose restart frontend

# Check volume mounts
docker compose exec frontend ls -la
```

#### Migration Issues
```bash
# Local reset
docker compose down
docker volume rm fraud-detection-system_postgres_data
docker compose up -d
cd backend
npx prisma migrate deploy
npm run seed

# Production reset
railway run npx prisma db push --force-reset
railway run npm run seed
```

### Performance Issues

#### Slow Queries
- Verify database views are created
- Check database indexes
- Monitor query performance

#### Memory Usage
- Monitor container resources
- Optimize Docker configurations
- Scale resources as needed

#### WebSocket Lag
- Check connection status
- Monitor event emission
- Verify client subscriptions

## 📊 Monitoring

### Health Checks
- **Backend**: `https://your-backend.railway.app/api/health`
- **Frontend**: Vercel dashboard
- **Database**: Railway PostgreSQL dashboard

### Logs
```bash
# Local logs
docker compose logs backend
docker compose logs frontend

# Production logs
railway logs
```

### Metrics
- **Railway Dashboard**: Backend performance
- **Vercel Dashboard**: Frontend performance
- **Database**: Railway PostgreSQL metrics

## 🔄 CI/CD

### Automated Workflows
- **Frontend**: Automatic Vercel deployment
- **Backend**: Manual Railway deployment
- **Testing**: Automated test runs
- **Migrations**: Automated database migrations

### Manual Deployment
```bash
# Backend
railway up

# Frontend (automatic via Vercel)
git push origin main
```

## 📋 Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates valid
- [ ] Domain configured

### Post-Deployment
- [ ] Health checks passing
- [ ] WebSocket connections working
- [ ] Database views created
- [ ] Real-time updates functioning
- [ ] Performance metrics acceptable

---

**Last Updated**: July 2024 