# Railway Deployment Guide

This guide will help you deploy your Suna application to Railway with minimal configuration changes.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: Install the Railway CLI
3. **Existing Supabase Project**: Your current Supabase setup will work perfectly

## Quick Start

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### 2. Initialize Railway Project

```bash
# In your project root
railway init
```

### 3. Deploy Services

Railway will automatically detect your services from the `railway.toml` configuration.

```bash
# Deploy all services
railway up
```

## Manual Service Setup (Alternative)

If you prefer manual setup, create services individually:

### Backend Service
```bash
railway create backend
cd backend
railway up
```

### Worker Service
```bash
railway create worker
cd backend
railway up --service worker
```

### Frontend Service
```bash
railway create frontend
cd frontend
railway up
```

### Add Database Services
```bash
railway add redis
railway add postgresql  # Optional: if you want Railway-managed DB instead of Supabase
```

## Environment Variables Configuration

### Backend Service Variables

Copy these to Railway Dashboard > Backend Service > Variables:

```bash
# Required - Database
SUPABASE_URL=https://xvhreblsabiwgfkykvvn.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2aHJlYmxzYWJpd2dma3lrdnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MjA1NTAsImV4cCI6MjA2NTA5NjU1MH0.HXMfRWdqczPmLjKarGCPs8wSoG3lqf-JfG5sAtlcEMw
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Required - LLM Provider (at least one)
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key

# Auto-configured by Railway
REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
REDIS_PORT=${{Redis.RAILWAY_PRIVATE_PORT}}
RABBITMQ_HOST=${{RabbitMQ.RAILWAY_PRIVATE_DOMAIN}}
RABBITMQ_PORT=${{RabbitMQ.RAILWAY_PRIVATE_PORT}}

# Environment
ENV_MODE=production
```

### Frontend Service Variables

Copy these to Railway Dashboard > Frontend Service > Variables:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xvhreblsabiwgfkykvvn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2aHJlYmxzYWJpd2dma3lrdnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MjA1NTAsImV4cCI6MjA2NTA5NjU1MH0.HXMfRWdqczPmLjKarGCPs8wSoG3lqf-JfG5sAtlcEMw

# Auto-configured by Railway (replace with actual URLs after deployment)
NEXT_PUBLIC_BACKEND_URL=https://your-backend-service.railway.app/api
NEXT_PUBLIC_URL=https://your-frontend-service.railway.app

# Environment
NEXT_PUBLIC_ENV_MODE=production
```

### Worker Service Variables

Same as Backend Service (they share the same codebase).

## Deployment Steps

### Step 1: Push Code to Railway

```bash
# Make sure you're on the railway deployment branch
git checkout feature/railway-deployment

# Deploy backend
railway up --service backend

# Deploy worker
railway up --service worker

# Deploy frontend
railway up --service frontend
```

### Step 2: Configure Services

1. **Add Redis**: `railway add redis`
2. **Add RabbitMQ**: `railway add rabbitmq` (or use CloudAMQP plugin)
3. **Set Environment Variables**: Use Railway dashboard to configure variables

### Step 3: Update URLs

After deployment, update these variables with actual Railway URLs:

- `NEXT_PUBLIC_BACKEND_URL`: Replace with your backend service URL
- `NEXT_PUBLIC_URL`: Replace with your frontend service URL

## Service Architecture on Railway

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │     Worker      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (Dramatiq)    │
│   Port: 3000    │    │   Port: 8000    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │     Redis       │    │   RabbitMQ      │
         │              │   (Caching)     │    │  (Message Queue)│
         │              └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│    Supabase     │
│   (Database)    │
│  (External)     │
└─────────────────┘
```

## Cost Estimation

### Railway Pricing
- **Hobby Plan**: $5/month per service (first service free)
- **Pro Plan**: $20/month per service with more resources

### Estimated Monthly Cost
- Frontend: $0 (first service free)
- Backend: $5
- Worker: $5
- Redis: $5
- RabbitMQ: $5
- **Total**: ~$20/month

### Your Existing Services (No Additional Cost)
- Supabase: Keep your existing plan
- API Keys: No change in usage costs

## Monitoring & Logs

### View Logs
```bash
# Backend logs
railway logs --service backend

# Frontend logs  
railway logs --service frontend

# Worker logs
railway logs --service worker
```

### Service Health
- Railway provides built-in monitoring
- Health checks are configured in Dockerfiles
- Automatic restarts on failures

## Troubleshooting

### Common Issues

1. **Build Failures**: Check Dockerfile and dependencies
2. **Environment Variables**: Ensure all required variables are set
3. **Service Communication**: Verify internal Railway URLs
4. **Database Connection**: Confirm Supabase credentials

### Debug Commands
```bash
# Check service status
railway status

# View environment variables
railway variables

# Connect to service shell
railway shell --service backend
```

## Production Checklist

- [ ] All environment variables configured
- [ ] Supabase service role key added
- [ ] LLM API keys configured
- [ ] Frontend/Backend URLs updated
- [ ] Redis and RabbitMQ services running
- [ ] Health checks passing
- [ ] Logs showing successful startup

## Security Notes

- Environment variables are encrypted in Railway
- Use Railway's secret management for sensitive data
- Enable Railway's built-in DDoS protection
- Configure proper CORS settings for production

## Next Steps

1. Deploy to Railway using this guide
2. Test all functionality in production
3. Set up monitoring and alerts
4. Configure custom domain (optional)
5. Set up CI/CD pipeline (optional)

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Suna Issues: [GitHub Issues](https://github.com/donghaozhang/suna/issues) 