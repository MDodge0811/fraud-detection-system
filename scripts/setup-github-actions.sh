#!/bin/bash

# 🚀 GitHub Actions Setup Script for Fraud Detection System
# This script helps you set up GitHub Actions for automated CI/CD

set -e

echo "🚀 Setting up GitHub Actions for Fraud Detection System"
echo "========================================================"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please run this from your project root."
    exit 1
fi

# Check if we're connected to GitHub
if ! git remote get-url origin | grep -q "github.com"; then
    echo "❌ Repository is not connected to GitHub. Please push to GitHub first."
    exit 1
fi

echo ""
echo "📋 GitHub Actions Workflows Available:"
echo "======================================"
echo "✅ ci.yml - Continuous Integration (Testing & Quality)"
echo "✅ deploy.yml - Production & Staging Deployments"
echo "✅ preview.yml - Preview Deployments for Pull Requests"
echo "✅ database.yml - Database Management"

echo ""
echo "🔐 Required GitHub Secrets:"
echo "==========================="
echo "VERCEL_TOKEN=your_vercel_token"
echo "VERCEL_ORG_ID=your_org_id"
echo "VERCEL_PROJECT_ID_FRONTEND=your_frontend_project_id"
echo "VERCEL_PROJECT_ID_BACKEND=your_backend_project_id"
echo "DATABASE_URL=your_database_url"

echo ""
echo "📝 Optional Secrets:"
echo "==================="
echo "SLACK_WEBHOOK_URL=your_slack_webhook_url"
echo "SONAR_TOKEN=your_sonarcloud_token"

echo ""
echo "🔧 Setup Steps:"
echo "==============="
echo "1. Go to your GitHub repository"
echo "2. Navigate to Settings > Secrets and variables > Actions"
echo "3. Add the required secrets listed above"
echo "4. Push to main branch to trigger first deployment"
echo "5. Check the Actions tab to monitor workflows"

echo ""
echo "🚀 Workflow Triggers:"
echo "===================="
echo "• Push to main → Production deployment"
echo "• Push to develop → Staging deployment"
echo "• Pull Request → Preview deployment"
echo "• Manual → Database operations"

echo ""
echo "📊 Monitoring:"
echo "============="
echo "• GitHub Actions tab: View all workflow runs"
echo "• Vercel Dashboard: Monitor deployments"
echo "• PR Comments: Preview URLs and testing checklists"

echo ""
echo "📚 Documentation:"
echo "================"
echo "• GITHUB_ACTIONS.md - Complete CI/CD documentation"
echo "• DEPLOYMENT.md - Vercel deployment guide"

echo ""
echo "✅ Setup script completed!"
echo "📖 Read GITHUB_ACTIONS.md for complete setup instructions"
echo ""
echo "🎉 Your Fraud Detection System is ready for automated CI/CD!" 