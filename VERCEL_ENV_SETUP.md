# Vercel Environment Variables Configuration

## Issue Fixed ✅
Removed invalid secret references from `vercel.json`. Environment variables must be configured in the Vercel Dashboard, not in the config file.

---

## How to Configure Environment Variables in Vercel

### Step 1: Go to Vercel Project Settings
1. Visit: https://vercel.com/dashboard
2. Click your project: `infinova-hackathon`
3. Go to **Settings** tab

### Step 2: Add Environment Variables
In the left sidebar, click **Environment Variables**

### Step 3: Add These Variables

For **Production** deployment:

| Variable | Value | Example |
|----------|-------|---------|
| `REACT_APP_BACKEND_URL` | Your backend API URL | `https://invoice-api.herokuapp.com` |
| `REACT_APP_NETWORK` | Algorand network | `testnet` or `mainnet` |

Click "Add" for each variable, select environment (Production), and save.

---

## Getting Your Backend URL

You need to deploy your backend first. Choose one option:

### Option A: Heroku (Free/Easiest)
```bash
npm install -g heroku
heroku login
heroku create invoice-financing-api
heroku config:set NODE_ENV=production
heroku config:set ALGOD_SERVER=https://testnet-api.algonode.cloud
heroku config:set ALGOD_PORT=443
git push heroku main
```

Your backend URL will be: `https://invoice-financing-api.herokuapp.com`

### Option B: Railway.app
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Your backend URL will be shown in the Railway dashboard.

### Option C: AWS/GCP/DigitalOcean
Deploy your backend and note the URL.

---

## Step 4: Redeploy on Vercel

Once environment variables are set:

1. Go to Vercel Dashboard → **Deployments**
2. Click on the latest failed deployment
3. Click **Redeploy** button
4. Wait for build to complete

Or simply push code to GitHub:
```bash
git add .
git commit -m "Fix vercel config and set env vars"
git push origin main
```

---

## Verify Deployment

Once deployment is successful:
1. Visit: https://infinova-hackathon.vercel.app
2. Open browser Developer Tools (F12)
3. Check Console for any errors
4. Try creating an invoice

---

## Environment Variables by Environment

### Development (Local)
**frontend/.env.local**
```
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_NETWORK=testnet
```

### Production (Vercel)
**Vercel Dashboard → Environment Variables**
```
REACT_APP_BACKEND_URL=https://your-backend-api.com
REACT_APP_NETWORK=testnet
```

---

## Troubleshooting

### Build still failing?
- [ ] All environment variables added in Vercel dashboard
- [ ] No typos in variable names (case-sensitive!)
- [ ] Variable values don't have quotes or extra spaces
- [ ] Both `REACT_APP_BACKEND_URL` and `REACT_APP_NETWORK` are set

### App loads but API calls fail?
- [ ] Backend is deployed and running
- [ ] CORS enabled on backend for your Vercel domain
- [ ] `REACT_APP_BACKEND_URL` points to correct backend
- [ ] Backend API health check works: `GET /api/health`

### Frontend still shows 404 on routes?
- [ ] `vercel.json` has correct rewrites section
- [ ] Delete `.vercel/` folder and redeploy
- [ ] Check that `frontend/vercel.json` is also configured

---

## Quick Command to Deploy Everything

```bash
# 1. Deploy backend first
cd backend
npm install
heroku create invoice-api
git push heroku main
# Note the URL: https://invoice-api.herokuapp.com

# 2. Update Vercel env vars with backend URL
# Visit: https://vercel.com/dashboard → Settings → Environment Variables
# Add: REACT_APP_BACKEND_URL=https://invoice-api.herokuapp.com

# 3. Redeploy frontend
# Either:
# - Click Redeploy on Vercel dashboard
# OR
# - Push to GitHub:
git add .
git commit -m "Deploy with backend URL"
git push origin main
```

---

## Support
- Vercel Docs: https://vercel.com/docs
- Build issues: Check Vercel Deployments tab for logs
- Contact: deepthishreyak@gmail.com
