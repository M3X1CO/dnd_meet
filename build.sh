#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "🔧 Installing dependencies..."
npm ci

echo "🗄️  Running database migrations..."
npm run db:push

echo "🏗️  Building application..."
npm run build

echo "✅ Build complete!"
