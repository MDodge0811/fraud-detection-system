#!/bin/bash

# 🚀 Vercel Setup Script for Fraud Detection System
# This script helps you set up Vercel deployment

set -e

echo "🚀 Setting up Vercel deployment for Fraud Detection System"
echo "=========================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

echo ""
echo "📋 Getting Vercel configuration..."
echo "=================================="

# Get organization ID
echo "🏢 Organization ID:"
vercel orgs ls

echo ""
echo "📁 Project IDs:"
vercel projects ls

echo ""
echo "🔑 To get your Vercel token:"
echo "1. Go to https://vercel.com/account/tokens"
echo "2. Create a new token"
echo "3. Copy the token value"

echo ""
echo "📝 Next steps:"
echo "1. Create two Vercel projects (frontend and backend)"
echo "2. Set up environment variables in Vercel dashboard"
echo "3. Add GitHub secrets for automated deployment"
echo "4. See DEPLOYMENT.md for detailed instructions"

echo ""
echo "✅ Setup script completed!"
echo "📖 Read DEPLOYMENT.md for complete setup instructions" 