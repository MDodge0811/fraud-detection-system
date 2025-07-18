#!/bin/bash

# 🚀 Railway Setup Script for Fraud Detection System Backend
# This script helps you prepare for Railway deployment

set -e

echo "🚀 Setting up Railway deployment for Fraud Detection System Backend"
echo "=================================================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Installing..."
    npm install -g @railway/cli
fi

echo ""
echo "📋 Railway Deployment Steps:"
echo "============================"
echo ""
echo "1. 🚀 Create Railway Project:"
echo "   - Go to https://railway.app"
echo "   - Click 'New Project'"
echo "   - Select 'Deploy from GitHub repo'"
echo "   - Choose your fraud-detection-system repository"
echo "   - Select 'backend' directory as source"
echo ""
echo "2. 🗄️ Add PostgreSQL Database:"
echo "   - In your Railway project, click 'New Service'"
echo "   - Select 'Database' → 'PostgreSQL'"
echo "   - Railway will create a PostgreSQL database"
echo ""
echo "3. 🔧 Configure Environment Variables:"
echo "   - Go to your backend service settings"
echo "   - Add DATABASE_URL from PostgreSQL service"
echo "   - Add NODE_ENV=production"
echo ""
echo "4. 🔗 Update Frontend Environment Variables:"
echo "   - Get your Railway backend URL"
echo "   - Update Vercel frontend environment variables:"
echo "     VITE_API_URL=https://your-app.railway.app/api"
echo "     VITE_WS_URL=https://your-app.railway.app"
echo ""
echo "5. 🧪 Test the Deployment:"
echo "   - Visit: https://your-app.railway.app/api/health"
echo "   - Check WebSocket connection in frontend"
echo ""

echo "✅ Setup script completed!"
echo "📖 Read RAILWAY_DEPLOYMENT.md for detailed instructions"
echo ""
echo "🎉 Benefits of Railway deployment:"
echo "   ✅ Full WebSocket support"
echo "   ✅ PostgreSQL database included"
echo "   ✅ Auto-deployment from GitHub"
echo "   ✅ Real-time logs and monitoring" 