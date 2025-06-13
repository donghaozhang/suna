#!/bin/bash

# Railway Deployment Script for Suna
# This script automates the deployment process to Railway

set -e  # Exit on any error

echo "🚀 Starting Railway deployment for Suna..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please log in to Railway..."
    railway login
fi

# Initialize Railway project if not already done
if [ ! -f "railway.json" ]; then
    echo "❌ railway.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Initializing Railway project..."
railway init --name suna-app || echo "Project already initialized"

echo "🏗️  Creating services..."

# Create backend service
echo "Creating backend service..."
railway service create backend || echo "Backend service already exists"

# Create worker service  
echo "Creating worker service..."
railway service create worker || echo "Worker service already exists"

# Create frontend service
echo "Creating frontend service..."
railway service create frontend || echo "Frontend service already exists"

# Add Redis
echo "Adding Redis service..."
railway add redis || echo "Redis service already exists"

# Add RabbitMQ (using CloudAMQP plugin)
echo "Adding RabbitMQ service..."
railway add rabbitmq || echo "RabbitMQ service already exists"

echo "🚀 Deploying services..."

# Deploy backend
echo "Deploying backend..."
cd backend
railway up --service backend --detach
cd ..

# Deploy worker (same codebase as backend)
echo "Deploying worker..."
cd backend  
railway up --service worker --detach
cd ..

# Deploy frontend
echo "Deploying frontend..."
cd frontend
railway up --service frontend --detach
cd ..

echo "✅ Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Railway dashboard: https://railway.app/dashboard"
echo "2. Configure environment variables for each service"
echo "3. Use the templates in backend/.env.railway and frontend/.env.railway"
echo "4. Update NEXT_PUBLIC_BACKEND_URL and NEXT_PUBLIC_URL with actual Railway URLs"
echo ""
echo "📖 For detailed instructions, see RAILWAY_DEPLOYMENT.md"
echo ""
echo "🔍 Monitor deployment:"
echo "  railway logs --service backend"
echo "  railway logs --service frontend"
echo "  railway logs --service worker" 