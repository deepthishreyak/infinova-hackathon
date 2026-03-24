# Deployment Troubleshooting Guide

## Current Build Status

**Issue**: Vercel deployment failing with exit code 1

**Recent Changes**:
- ✅ Fixed package.json corruption
- ✅ Fixed Analytics.js syntax error  
- ✅ Simplified vercel.json config
- ⏳ Waiting for next build to complete

---

## Immediate Next Steps

### Option 1: Check Vercel Logs (Recommended)
Run this command locally using Vercel CLI:
```bash
npm install -g vercel
vercel login
npx vercel inspect dpl_2aX1oVA1WhiveezXfpRC7ZHVUKep --logs
```

This will show the exact error from the failed build.

### Option 2: Fresh Deploy with Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from project root
cd c:\Users\deept\OneDrive\Desktop\infinova-hackathon
vercel --prod
```

### Option 3: Manual Build Test
Test if the build works locally:
```powershell
# Set execution policy
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Build frontend
cd frontend
npm install
npm run build

# Check if build/ directory was created
Get-ChildItem build/
```

---

## Common Vercel Build Issues & Solutions

### Issue: "Command exited with 1"
**Causes**: Compilation errors, missing deps, syntax errors
**Solution**: Check build logs with `vercel inspect --logs`

### Issue: "React Scripts not found"
**Solution**: Ensure `react-scripts` in package.json dependencies
```json
"dependencies": {
  "react-scripts": "5.0.1"
}
```

### Issue: ".env variables not found"
**Solution**: Add to Vercel Dashboard → Settings → Environment Variables:
```
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_NETWORK=testnet
```

### Issue: "Output directory not found"
**Solution**: Ensure `outputDirectory` in vercel.json matches actual build output:
```json
{
  "outputDirectory": "frontend/build"
}
```

---

## Path Configuration Check

**Current Setup**:
- Root: `infinova-hackathon/`
- Frontend: `infinova-hackathon/frontend/`
- Build Output: `infinova-hackathon/frontend/build/`

**vercel.json**:
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/build"
}
```

**Alternative: Using Vercel Dashboard**

If vercel.json doesn't work, configure in Vercel Dashboard:
1. Project Settings → General
2. **Root Directory**: `frontend`
3. **Build Command**: `npm install && npm run build`
4. **Output Directory**: `build`
5. Click Save

---

## Debugging Locally

### Step 1: Install Dependencies
```powershell
cd frontend
npm install
```

### Step 2: Build Locally
```powershell
npm run build
```

### Step 3: Check Build Output
```powershell
Get-ChildItem build/
# Should see: index.html, static/, favicon.ico, etc.
```

### Step 4: Serve Locally
```powershell
# Install static server
npm install -g serve

# Serve the build
serve -s build -p 3000
```

Then visit: http://localhost:3000

---

## When All Else Fails

### Option A: Rebuild from Scratch
1. Delete node_modules and package-lock.json
2. Commit and push clean code
3. Redeploy on Vercel

```bash
cd frontend
rm -r node_modules package-lock.json
git add .
git commit -m "Clean: Remove node_modules for fresh install"
git push
```

### Option B: Use Different Vercel Configuration
Create `frontend/vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Then in Vercel Dashboard:
- Root Directory: `frontend`
- Remove root-level `vercel.json`

---

## Pre-Flight Checklist

Before redeploying, verify:
- [ ] No syntax errors in components
- [ ] All imports are correct
- [ ] package.json is valid JSON
- [ ] No circular dependencies
- [ ] All required dependencies listed
- [ ] .env files (if any) not committed
- [ ] vercel.json paths are correct

---

## Next Deployment Timeline

1. **Now**: Check build logs with `vercel inspect --logs`
2. **If errors found**: Fix and `git push origin main`
3. **Vercel rebuilds**: Auto-triggers on GitHub push
4. **Deployment**: Should complete in 1-2 minutes
5. **Live**: Check https://infinova-hackathon.vercel.app

---

## Contact & Support

If still failing after these steps:
1. Run `vercel inspect --logs` to get exact error
2. Check Vercel Dashboard → Deployments → click failed deployment
3. Look for specific npm/build error messages
4. Google the specific error message

Vercel Docs: https://vercel.com/docs
