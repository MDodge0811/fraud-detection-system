#!/bin/bash

# Railway Startup Script for Fraud Detection Backend
# This script runs on every deployment to ensure database is properly configured
# SAFE MODE: Checks existing state before making changes

set -e

echo "🚂 Railway deployment starting (safe mode)..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until npx prisma db pull > /dev/null 2>&1; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "✅ Database connection established"

# Run migrations (safe operation)
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "⚡ Generating Prisma client..."
npx prisma generate

echo "✅ Railway deployment setup completed (safe mode)!"

# Start the application
echo "🚀 Starting application..."
exec node dist/index.js 