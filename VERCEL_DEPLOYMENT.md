# Production Deployment Guide

## Vercel Deployment - Frontend

### Prerequisites
- Vercel account (free at vercel.com)
- GitHub repository with this code
- Backend API deployed and accessible

### Step 1: Connect GitHub Repository
```bash
# Push code to GitHub
git add .
git commit -m "Add vercel.json for production SPA routing"
git push origin main
```

### Step 2: Deploy on Vercel
1. Visit https://vercel.com
2. Click "New Project"
3. Select your GitHub repository
4. Configuration:
   - **Framework Preset**: React
   - **Root Directory**: frontend (or leave blank if frontend is root)
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `build`

### Step 3: Add Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
```
REACT_APP_BACKEND_URL=https://your-backend-api.com
REACT_APP_NETWORK=testnet
```

### Step 4: Deploy
- Click "Deploy"
- Wait for build to complete
- Frontend will be live at `https://your-project.vercel.app`

---

## Backend Deployment - Heroku/Railway/AWS

### Option 1: Heroku (Easiest)
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create invoice-financing-api

# Add buildpack
heroku buildpacks:add --index 1 heroku/nodejs

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set ALGOD_SERVER=https://testnet-api.algonode.cloud
heroku config:set ALGOD_PORT=443
heroku config:set ALGOD_TOKEN=your_token_here

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Option 2: Railway.app
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Option 3: AWS EC2
```bash
# SSH into instance
ssh -i key.pem ec2-user@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <repo-url>
cd infinova-hackathon/backend
npm install

# Start with PM2
npm install -g pm2
pm2 start server.js --name "invoice-api"
pm2 save
pm2 startup

# Configure Nginx reverse proxy
sudo apt install nginx
# Edit /etc/nginx/sites-available/default
# Add proxy_pass http://localhost:3001;
```

---

## AI Service Deployment

### Using Docker on AWS ECS / Google Cloud Run

```bash
# Build Docker image
cd ai-service
docker build -t invoice-ai:latest .

# Push to Docker Hub
docker tag invoice-ai:latest your-username/invoice-ai:latest
docker push your-username/invoice-ai:latest

# Deploy on Google Cloud Run
gcloud run deploy invoice-ai \
  --image your-username/invoice-ai:latest \
  --memory 1Gi \
  --cpu 1 \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Post-Deployment Checklist

### Frontend (Vercel)
- [ ] Site loads without 404 errors
- [ ] All routes work (about, analytics, etc.)
- [ ] Environment variables configured
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Cache headers set correctly

### Backend API
- [ ] Health check endpoint responds: `GET /api/health`
- [ ] CORS enabled for frontend domain
- [ ] Environment variables loaded correctly
- [ ] Database connections working
- [ ] Rate limiting configured

### AI Service
- [ ] Health check endpoint responds: `GET /api/health`
- [ ] Risk scoring endpoint works: `POST /api/score`
- [ ] Proper error handling in place
- [ ] Logs aggregating properly

### Security
- [ ] No hardcoded secrets in code
- [ ] All credentials in environment variables
- [ ] HTTPS/TLS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation in place

### Monitoring
- [ ] Error tracking enabled (Sentry)
- [ ] Uptime monitoring configured (UptimeRobot)
- [ ] Logs centralized (CloudWatch, Datadog)
- [ ] Performance metrics available

---

## Troubleshooting Vercel 404 Error

### Problem: Page not found on Vercel
**Solution**: Ensure `vercel.json` has proper rewrites:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Problem: Environment variables not loaded
**Solution**: Add to Vercel dashboard under Project Settings → Environment Variables

### Problem: Build fails
**Check**:
1. Build command: `npm install && npm run build`
2. Output directory: `build/`
3. Node version: 18+ recommended
4. All dependencies installed locally first

### Problem: Backend API not responding
**Solution**: Add to frontend env vars:
```
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

---

## Domain Configuration

### Add Custom Domain to Vercel
1. Go to Vercel Dashboard → Project Settings
2. Domains section → Add your domain
3. Update DNS records:
   - CNAME: your-project.vercel.app
   - Or use Vercel nameservers

### Add Custom Domain to Backend
- Update CORS settings with new domain
- Update frontend env vars with new API URL
- Redeploy frontend

---

## Continuous Deployment

### GitHub Actions for Auto-Deploy
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## Production URLs Template

After deployment, update these URLs everywhere:

```
Frontend: https://your-app.vercel.app
Backend:  https://your-api.herokuapp.com (or your domain)
AI Service: https://your-ai-service.run.app

Update in:
- frontend/.env (REACT_APP_BACKEND_URL)
- backend/.env (allowed CORS origins)
- Documentation
- README.md
```

---

## Support & Next Steps

1. **Test the full flow**: Create invoice → Finance → Settle
2. **Monitor logs** for any errors
3. **Set up uptime monitoring** for critical endpoints
4. **Enable backups** for any databases
5. **Plan scaling** as usage grows

For detailed info: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
