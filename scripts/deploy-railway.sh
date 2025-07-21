#!/bin/bash

# Railway Deployment Script
# This script helps deploy the fraud detection system to Railway

set -e

echo "🚂 Railway Deployment Script"
echo "=============================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway..."
    railway login
fi

# Check if project is linked
if ! railway status &> /dev/null; then
    echo "🔗 Linking to Railway project..."
    railway link
fi

echo "📊 Current Railway status:"
railway status

echo ""
echo "🚀 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Check deployment logs: railway logs"
echo "2. Test your application: railway status (for URL)"
echo "3. Monitor health: curl https://your-app.railway.app/health"
echo ""
echo "🎉 Your fraud detection system is now live on Railway!" 