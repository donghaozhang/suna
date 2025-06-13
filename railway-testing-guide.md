# Railway Testing Workflow Guide

## 🚀 Railway Deployment & Testing Strategy

### **Step 1: Railway Project Setup**

1. **Connect Repository to Railway**
   ```bash
   # Install Railway CLI (if not already installed)
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Link your project
   railway link
   ```

2. **Configure Environment Variables**
   - Go to Railway Dashboard → Your Project → Variables
   - Add all required environment variables:
     ```env
     # Backend Variables
     SUPABASE_URL=your_supabase_url
     SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ANTHROPIC_API_KEY=your_anthropic_key
     OPENAI_API_KEY=your_openai_key
     
     # Frontend Variables
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     NEXT_PUBLIC_BACKEND_URL=https://your-backend-railway-url.railway.app/api
     NEXT_PUBLIC_URL=https://your-frontend-railway-url.railway.app
     ```

### **Step 2: Branch-Based Testing**

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes & Test Locally** (Optional)
   ```bash
   # Quick local test
   docker compose up
   ```

3. **Push to Railway**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

4. **Railway Auto-Deploy**
   - Railway detects the push
   - Automatically builds and deploys
   - Provides deployment URL

### **Step 3: Testing on Railway**

#### **A. Monitor Deployment**
```bash
# Watch deployment logs
railway logs

# Check deployment status
railway status
```

#### **B. Test API Endpoints**
1. **Open Railway Dashboard**
   - Go to your project
   - Click on backend service
   - Copy the deployment URL

2. **Test API Health**
   ```bash
   # Test backend health
   curl https://your-backend-url.railway.app/api/health
   
   # Should return: {"status":"ok","timestamp":"...","instance_id":"..."}
   ```

3. **Test Specific Endpoints**
   ```bash
   # Test billing endpoint (with auth token)
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        https://your-backend-url.railway.app/api/billing/subscription
   ```

#### **C. Frontend Testing**
1. **Open Frontend URL**
   - Go to your Railway frontend deployment URL
   - Open Browser DevTools (F12)

2. **Check Network Tab**
   - Look for API calls
   - Verify they use `/api/` prefix
   - Check for 404 errors

3. **Test User Flows**
   - Login/Authentication
   - Dashboard loading
   - Agent creation
   - Billing information

### **Step 4: Debugging Railway Issues**

#### **Common Issues & Solutions**

1. **404 API Errors**
   ```bash
   # Check if backend is running
   railway logs --service backend
   
   # Verify environment variables
   railway variables
   ```

2. **Build Failures**
   ```bash
   # Check build logs
   railway logs --deployment DEPLOYMENT_ID
   
   # Redeploy if needed
   railway redeploy
   ```

3. **Environment Variable Issues**
   - Verify all required vars are set in Railway dashboard
   - Check variable names match exactly
   - Ensure no trailing spaces or quotes

#### **Debugging Commands**
```bash
# View all services
railway ps

# Get service URLs
railway domain

# View recent deployments
railway deployments

# Connect to service shell (if needed)
railway shell
```

### **Step 5: Testing Checklist**

#### **Backend API Testing**
- [ ] Health endpoint: `/api/health`
- [ ] Authentication endpoints
- [ ] Billing endpoints: `/api/billing/*`
- [ ] Agent endpoints: `/api/agent/*`
- [ ] Thread endpoints: `/api/thread/*`

#### **Frontend Testing**
- [ ] Page loads without errors
- [ ] API calls use correct URLs
- [ ] Authentication works
- [ ] Dashboard displays data
- [ ] No 404 errors in console

#### **Integration Testing**
- [ ] Frontend → Backend communication
- [ ] Database connections
- [ ] External API integrations
- [ ] File uploads/downloads

### **Step 6: Production Deployment**

1. **Merge to Main Branch**
   ```bash
   git checkout main
   git merge feature/your-feature-name
   git push origin main
   ```

2. **Monitor Production Deploy**
   ```bash
   railway logs --environment production
   ```

## 🔧 **Railway CLI Quick Reference**

```bash
# Project Management
railway login                 # Login to Railway
railway link                  # Link local project
railway unlink               # Unlink project

# Deployment
railway up                   # Deploy current directory
railway deploy               # Deploy specific service
railway redeploy            # Redeploy last deployment

# Monitoring
railway logs                # View logs
railway logs --follow      # Follow logs in real-time
railway status             # Check service status
railway ps                 # List all services

# Environment
railway variables          # List environment variables
railway variables set KEY=value  # Set environment variable
railway shell             # Connect to service shell

# Domains
railway domain            # List domains
railway domain add        # Add custom domain
```

## 🎯 **Best Practices**

1. **Use Feature Branches**
   - Never push directly to main
   - Test on feature branches first

2. **Monitor Deployments**
   - Always check deployment logs
   - Verify health endpoints after deploy

3. **Environment Parity**
   - Keep Railway env vars in sync
   - Test with production-like data

4. **Rollback Strategy**
   - Keep previous working deployment
   - Know how to quickly rollback

5. **Testing Strategy**
   - Test API endpoints first
   - Then test frontend integration
   - Finally test user workflows 