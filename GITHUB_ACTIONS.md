# 🚀 GitHub Actions CI/CD Setup

This document describes the comprehensive GitHub Actions setup for the Fraud Detection System, providing automated testing, quality checks, and deployments.

## 📋 Workflow Overview

### 🔄 Available Workflows

1. **`ci.yml`** - Continuous Integration (Testing & Quality)
2. **`deploy.yml`** - Production & Staging Deployments
3. **`preview.yml`** - Preview Deployments for Pull Requests
4. **`database.yml`** - Database Management

## 🔧 Workflow Details

### 1. CI - Test & Quality (`ci.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Jobs:**
- **Frontend Tests**: Linting, type checking, build
- **Backend Tests**: Linting, type checking, tests with PostgreSQL
- **Security Scan**: Vulnerability scanning with Trivy
- **Dependency Check**: npm audit for security issues
- **Code Quality**: SonarCloud analysis

**Features:**
- ✅ PostgreSQL service container for backend tests
- ✅ Build artifacts uploaded for later use
- ✅ Test results and coverage reports
- ✅ Security vulnerability scanning
- ✅ Code quality analysis

### 2. Deploy to Vercel (`deploy.yml`)

**Triggers:**
- Push to `main` (production)
- Push to `develop` (staging)
- Manual workflow dispatch

**Jobs:**
- **Deploy Frontend**: Build and deploy React app
- **Deploy Backend**: Build and deploy Node.js API
- **Notify Deployment**: Slack notifications and summaries

**Features:**
- ✅ Automatic production deployment on main branch
- ✅ Staging deployment on develop branch
- ✅ Manual deployment with environment selection
- ✅ Database migrations on production
- ✅ Deployment notifications
- ✅ PR comments with deployment URLs

### 3. Preview Deployment (`preview.yml`)

**Triggers:**
- Pull request opened/updated
- Pull request closed (cleanup)

**Jobs:**
- **Preview Frontend**: Deploy frontend changes
- **Preview Backend**: Deploy backend changes
- **Cleanup Preview**: Remove preview deployments

**Features:**
- ✅ Automatic preview deployments for PRs
- ✅ Detailed testing checklists in PR comments
- ✅ Automatic cleanup when PR is closed
- ✅ Separate preview URLs for frontend and backend

### 4. Database Management (`database.yml`)

**Triggers:**
- Manual workflow dispatch only

**Actions:**
- **Migrate**: Apply database schema changes
- **Seed**: Populate database with initial data
- **Reset**: Reset and reseed database
- **Backup**: Create database backup

**Features:**
- ✅ Safe database operations
- ✅ Environment-specific targeting
- ✅ Backup file artifacts
- ✅ Operation summaries

## 🔐 Required Secrets

### GitHub Repository Secrets

Add these in your repository settings under **Settings > Secrets and variables > Actions**:

```bash
# Vercel Configuration
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID_FRONTEND=your_frontend_project_id
VERCEL_PROJECT_ID_BACKEND=your_backend_project_id

# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Optional: Notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url
SONAR_TOKEN=your_sonarcloud_token
```

### How to Get Vercel Secrets

1. **VERCEL_TOKEN**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and get token
   vercel login
   # Go to https://vercel.com/account/tokens
   # Create a new token
   ```

2. **VERCEL_ORG_ID**:
   ```bash
   vercel orgs ls
   # Copy the org ID
   ```

3. **Project IDs**:
   ```bash
   vercel projects ls
   # Copy the project IDs for frontend and backend
   ```

## 🚀 Usage Examples

### Automatic Deployments

```bash
# Deploy to staging
git push origin develop

# Deploy to production
git push origin main
```

### Manual Deployments

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Vercel** workflow
3. Click **Run workflow**
4. Choose environment (staging/production)
5. Click **Run workflow**

### Database Operations

1. Go to **Actions** tab in GitHub
2. Select **Database Management** workflow
3. Click **Run workflow**
4. Choose action and environment
5. Click **Run workflow**

### Pull Request Workflow

1. Create a new branch
2. Make your changes
3. Create a pull request
4. Automatic preview deployments will be created
5. Review the preview URLs in PR comments
6. Merge when ready

## 📊 Monitoring & Notifications

### Deployment Notifications

- **Slack**: Automatic notifications for production deployments
- **GitHub Comments**: Detailed deployment summaries
- **PR Comments**: Preview URLs and testing checklists

### Build Status

- **GitHub Actions**: View all workflow runs and logs
- **Vercel Dashboard**: Monitor deployment status
- **Artifacts**: Download build artifacts and backups

## 🔧 Customization

### Environment-Specific Configurations

You can customize workflows for different environments:

```yaml
# Example: Different database URLs per environment
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL_STAGING }}
  # or
  DATABASE_URL: ${{ secrets.DATABASE_URL_PRODUCTION }}
```

### Adding New Workflows

To add a new workflow:

1. Create a new `.yml` file in `.github/workflows/`
2. Define triggers and jobs
3. Add required secrets
4. Test the workflow

### Workflow Dependencies

Workflows can depend on each other:

```yaml
# Example: Deploy only after CI passes
needs: [ci]
```

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Deployment Failures**:
   - Verify Vercel secrets are correct
   - Check Vercel project configuration
   - Ensure environment variables are set

3. **Database Issues**:
   - Verify DATABASE_URL is correct
   - Check database connectivity
   - Ensure Prisma client is generated

4. **Preview Deployment Issues**:
   - Check if Vercel project supports previews
   - Verify PR permissions
   - Check workflow logs for errors

### Debug Commands

```bash
# Check workflow logs
# Go to Actions tab and click on failed workflow

# Test locally
npm run lint
npm run build
npm run test

# Check Vercel deployment
vercel logs
vercel ls
```

## 📈 Performance Optimization

### Caching

- **npm cache**: Automatically cached between runs
- **Build artifacts**: Stored for 7-30 days
- **Dependencies**: Cached per package-lock.json

### Parallel Execution

- Frontend and backend jobs run in parallel
- Independent jobs can run simultaneously
- Optimized for faster feedback

### Resource Usage

- Uses Ubuntu latest runners
- PostgreSQL service containers for testing
- Efficient dependency installation

## 🔒 Security

### Secret Management

- All sensitive data stored in GitHub secrets
- No secrets in workflow files
- Environment-specific secret handling

### Security Scanning

- Trivy vulnerability scanning
- npm audit for dependency issues
- SonarCloud code quality analysis

### Access Control

- Workflow permissions controlled by repository settings
- PR workflows use limited permissions
- Production deployments require main branch

## 📚 Additional Resources

- **GitHub Actions Documentation**: [docs.github.com/en/actions](https://docs.github.com/en/actions)
- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Prisma Documentation**: [prisma.io/docs](https://prisma.io/docs)
- **SonarCloud**: [sonarcloud.io](https://sonarcloud.io)

---

🎉 **Your Fraud Detection System now has enterprise-grade CI/CD with GitHub Actions!** 