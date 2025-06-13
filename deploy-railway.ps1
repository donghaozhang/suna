# Railway Deployment Script for Suna (PowerShell)
# This script automates the deployment process to Railway

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Railway deployment for Suna..." -ForegroundColor Green

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    npm install -g @railway/cli
}

# Check if user is logged in
try {
    railway whoami | Out-Null
} catch {
    Write-Host "🔐 Please log in to Railway..." -ForegroundColor Yellow
    railway login
}

# Check if railway.json exists
if (-not (Test-Path "railway.json")) {
    Write-Host "❌ railway.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Initializing Railway project..." -ForegroundColor Blue
try {
    railway init --name suna-app
} catch {
    Write-Host "Project already initialized" -ForegroundColor Yellow
}

Write-Host "🏗️  Creating services..." -ForegroundColor Blue

# Create backend service
Write-Host "Creating backend service..." -ForegroundColor Cyan
try {
    railway service create backend
} catch {
    Write-Host "Backend service already exists" -ForegroundColor Yellow
}

# Create worker service  
Write-Host "Creating worker service..." -ForegroundColor Cyan
try {
    railway service create worker
} catch {
    Write-Host "Worker service already exists" -ForegroundColor Yellow
}

# Create frontend service
Write-Host "Creating frontend service..." -ForegroundColor Cyan
try {
    railway service create frontend
} catch {
    Write-Host "Frontend service already exists" -ForegroundColor Yellow
}

# Add Redis
Write-Host "Adding Redis service..." -ForegroundColor Cyan
try {
    railway add redis
} catch {
    Write-Host "Redis service already exists" -ForegroundColor Yellow
}

# Add RabbitMQ
Write-Host "Adding RabbitMQ service..." -ForegroundColor Cyan
try {
    railway add rabbitmq
} catch {
    Write-Host "RabbitMQ service already exists" -ForegroundColor Yellow
}

Write-Host "🚀 Deploying services..." -ForegroundColor Green

# Deploy backend
Write-Host "Deploying backend..." -ForegroundColor Cyan
Set-Location backend
railway up --service backend --detach
Set-Location ..

# Deploy worker (same codebase as backend)
Write-Host "Deploying worker..." -ForegroundColor Cyan
Set-Location backend  
railway up --service worker --detach
Set-Location ..

# Deploy frontend
Write-Host "Deploying frontend..." -ForegroundColor Cyan
Set-Location frontend
railway up --service frontend --detach
Set-Location ..

Write-Host "✅ Deployment initiated!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to Railway dashboard: https://railway.app/dashboard"
Write-Host "2. Configure environment variables for each service"
Write-Host "3. Use the templates in backend/.env.railway and frontend/.env.railway"
Write-Host "4. Update NEXT_PUBLIC_BACKEND_URL and NEXT_PUBLIC_URL with actual Railway URLs"
Write-Host ""
Write-Host "📖 For detailed instructions, see RAILWAY_DEPLOYMENT.md" -ForegroundColor Blue
Write-Host ""
Write-Host "🔍 Monitor deployment:" -ForegroundColor Magenta
Write-Host "  railway logs --service backend"
Write-Host "  railway logs --service frontend"
Write-Host "  railway logs --service worker"