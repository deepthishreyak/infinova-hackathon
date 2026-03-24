# Deployment Guide

## Overview

This guide covers deploying the Invoice Financing platform to production environments.

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] .env files configured for target environment
- [ ] Database migrations run
- [ ] Smart contracts compiled and checked
- [ ] API rate limiting configured
- [ ] Authentication enabled
- [ ] Logging configured
- [ ] Monitoring alerts set up
- [ ] Backup strategy defined
- [ ] Disaster recovery plan tested

## Local Development Setup (First Time)

### 1. Install Dependencies

```bash
# Run automated setup script
bash scripts/setup.sh

# OR manual setup:
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install

# AI Service
cd ../ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Configuration

Create `.env` files for each service:

**backend/.env**
```
NODE_ENV=development
PORT=3001
ALGORAND_NETWORK=testnet
ALGOD_SERVER=http://localhost:4001
ALGOD_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
AI_SERVICE_URL=http://localhost:8000
```

**frontend/.env**
```
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_NETWORK=testnet
```

**ai-service/.env**
```
ENVIRONMENT=development
LOG_LEVEL=info
```

### 3. Start Services

**Option A: Sequential Startup**
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: AI Service
cd ai-service && python -m uvicorn main:app --reload

# Terminal 3: Frontend
cd frontend && npm start
```

**Option B: Docker Compose (Recommended)** 
```bash
docker-compose up -d
```

**Option C: Automated Script**
```bash
bash scripts/run-demo.sh
```

### 4. Verify Installation

```bash
# Check backend health
curl http://localhost:3001/api/health

# Check AI service
curl http://localhost:8000/api/health

# Open frontend
open http://localhost:3000
```

## TestNet Deployment

### Prerequisites

- Algorand TestNet access
- Node.js 16+ and Python 3.8+
- AlgoKit installed
- TestNet account with Algos

### Steps

#### 1. Compile Smart Contract

```bash
cd smart-contracts
python compile.py

# Outputs to compiled/ directory
ls compiled/
```

#### 2. Deploy Smart Contract

```bash
# Create deployment script if not exists
cat > smart-contracts/deploy.py << 'EOF'
from algosdk.v2client import algod
from algosdk import account
import base64

# TestNet configuration
client = algod.AlgodClient(
    token="aaaa...",
    address="http://testnet-algorand.api.purestake.io:443"
)

# Compile and deploy approval program
with open('compiled/invoice_approval.teal', 'r') as f:
    approval_program = f.read()

with open('compiled/invoice_clearstate.teal', 'r') as f:
    clear_program = f.read()

# Compile to binary
apps = client.compile(approval_program)
app_id = apps['result']

print(f"Deployed app ID: {app_id}")
EOF

python smart-contracts/deploy.py
```

#### 3. Update Backend Configuration

```bash
# Add to backend/.env
echo "INVOICE_APP_ID=<app_id_from_deployment>" >> backend/.env
echo "NETWORK=testnet" >> backend/.env
```

#### 4. Deploy Backend

```bash
cd backend

# Build
npm run build

# Deploy to cloud provider
# Option 1: Heroku
heroku create invoice-financing-api
git push heroku main

# Option 2: AWS Elastic Beanstalk
eb create invoice-financing-api
eb deploy

# Option 3: Railway
railway up
```

#### 5. Deploy Frontend

```bash
cd frontend

# Build
npm run build

# Deploy to cloud provider
# Option 1: Vercel
vercel deploy --prod

# Option 2: Netlify
netlify deploy --prod

# Option 3: AWS S3 + CloudFront
aws s3 sync build/ s3://invoice-financing-frontend/
```

#### 6. Deploy AI Service

```bash
cd ai-service

# Create Docker image
docker build -t invoice-ai:latest .

# Push to Docker Hub
docker tag invoice-ai:latest myuser/invoice-ai:latest
docker push myuser/invoice-ai:latest

# Deploy to cloud
# Option 1: AWS ECS
aws ecs create-service \
  --cluster invoice-financing \
  --service-name ai-service \
  --task-definition invoice-ai:1

# Option 2: Google Cloud Run
gcloud run deploy invoice-ai \
  --image myuser/invoice-ai:latest \
  --memory 1Gi --cpu 1
```

## Production Deployment

### Database Setup

#### MongoDB Atlas

```bash
# Create cluster
# Navigate to MongoDB Atlas → Create Database

# Get connection string
MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/invoice-financing"

# Update backend/.env
echo "MONGODB_URI=$MONGODB_URI" >> backend/.env
```

#### PostgreSQL

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier invoice-financing \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <secure-password>

# Update connection string
DB_URL="postgresql://admin:password@invoice-financing.xxx.rds.amazonaws.com:5432/invoices"
```

### Environment Configuration

**Production .env**

```env
# Backend
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000

# Algorand
ALGORAND_NETWORK=mainnet
ALGOD_SERVER=https://mainnet-algorand.api.purestake.io
ALGOD_TOKEN=<mainnet_token>
INVOICE_APP_ID=<production_app_id>

# Database
MONGODB_URI=<production_uri>
DATABASE_POOL_SIZE=20

# Services
AI_SERVICE_URL=https://invoice-ai.example.com
JWT_SECRET=<strong-secret-key>
CORS_ORIGIN=https://invoiceflow.io

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SLACK_WEBHOOK=https://hooks.slack.com/services/xxx
```

### Enable Authentication

**Add JWT middleware to backend:**

```javascript
// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authenticate;
```

### Enable Rate Limiting

```javascript
// backend/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW),
  max: parseInt(process.env.RATE_LIMIT_REQUESTS),
  message: 'Too many requests, please try again later'
});

module.exports = limiter;
```

### Configure Logging

```javascript
// backend/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### Setup Monitoring

**Sentry Error Tracking**

```bash
# Install
npm install @sentry/node

# Configure in backend/server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Prometheus Metrics**

```javascript
// backend/metrics.js
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['path', 'method', 'status_code']
});

module.exports = { httpRequestDuration };
```

## Docker Deployment

### Build Images

```bash
# Build all images
docker-compose build

# Or individually
docker build -t invoice-backend:latest backend/
docker build -t invoice-frontend:latest frontend/
docker build -t invoice-ai:latest ai-service/
```

### Push to Registry

```bash
# Docker Hub
docker tag invoice-backend:latest myuser/invoice-backend:latest
docker tag invoice-frontend:latest myuser/invoice-frontend:latest
docker tag invoice-ai:latest myuser/invoice-ai:latest

docker push myuser/invoice-backend:latest
docker push myuser/invoice-frontend:latest
docker push myuser/invoice-ai:latest

# Or AWS ECR
aws ecr get-login-password --region us-east-1 | docker login \
  --username AWS --password-stdin xxxx.dkr.ecr.us-east-1.amazonaws.com

docker tag invoice-backend:latest xxxx.dkr.ecr.us-east-1.amazonaws.com/invoice-backend:latest
docker push xxxx.dkr.ecr.us-east-1.amazonaws.com/invoice-backend:latest
```

### Deploy on Kubernetes

```bash
# Create namespace
kubectl create namespace invoice-financing

# Create deployment
kubectl apply -f k8s/backend-deployment.yaml -n invoice-financing
kubectl apply -f k8s/frontend-deployment.yaml -n invoice-financing
kubectl apply -f k8s/ai-service-deployment.yaml -n invoice-financing

# Create services
kubectl apply -f k8s/services.yaml -n invoice-financing

# Verify
kubectl get pods -n invoice-financing
kubectl get svc -n invoice-financing
```

## SSL/TLS Configuration

### Let's Encrypt (Free)

```bash
# Install Certbot
apt-get install certbot python3-certbot-nginx

# Generate certificate
certbot certonly --standalone -d invoiceflow.io -d www.invoiceflow.io

# Configure Nginx
# ssl_certificate /etc/letsencrypt/live/invoiceflow.io/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/invoiceflow.io/privkey.pem;
```

### Auto-renewal

```bash
# Add to crontab
0 3 * * * certbot renew --quiet
```

## DNS Configuration

### AWS Route 53

```bash
aws route53 create-hosted-zone \
  --name invoiceflow.io \
  --caller-reference $(date +%s)

# Add records
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://dns-changes.json
```

## Backup & Recovery

### Automated Backups

```bash
# MongoDB
mongodump --uri="mongodb+srv://..." --out=./backups/mongo_$(date +%Y%m%d)

# PostgreSQL
pg_dump -Fc postgresql://user:pass@host/db > backups/db_$(date +%Y%m%d).dump

# Schedule with cron
0 2 * * * /scripts/backup.sh
```

### Recovery Procedure

```bash
# Restore MongoDB
mongorestore --uri="mongodb+srv://..." ./backups/mongo_20240115

# Restore PostgreSQL
pg_restore -d invoice-financing < backups/db_20240115.dump
```

## Health Checks & Monitoring

### Uptime Monitoring

```bash
# Add monitoring service
# UptimeRobot, Pingdom, or custom

# Webhook alerts
curl -X POST https://hooks.slack.com/services/xxx \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Invoice API is down"
  }'
```

### Memory & CPU Monitoring

```bash
# Install monitoring agent
npm install pm2-monitoring

# Start with PM2
pm2 start backend/server.js --name api
pm2 save
pm2 startup

# Monitor
pm2 monit
```

## Scaling Considerations

### Horizontal Scaling

```yaml
# docker-compose.yml - add replicas
services:
  backend:
    deploy:
      replicas: 3
    environment:
      - INSTANCE_ID=backend-${NODE_RANK}
```

### Load Balancing

```nginx
# nginx.conf
upstream api_backend {
  server backend-1:3001;
  server backend-2:3001;
  server backend-3:3001;
}

server {
  location /api/ {
    proxy_pass http://api_backend;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

### Caching Strategy

```javascript
// Redis cache layer
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: 6379
});

// Cache invoice requests
app.get('/api/invoices/:id', async (req, res) => {
  const cached = await client.get(`invoice:${req.params.id}`);
  if (cached) return res.json(JSON.parse(cached));
  
  // Fetch from DB
  const invoice = invoices.get(req.params.id);
  
  // Cache for 300 seconds
  client.setex(`invoice:${req.params.id}`, 300, JSON.stringify(invoice));
  res.json(invoice);
});
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs backend
tail -f ~/.pm2/logs/api-error.log

# Check port conflicts
lsof -i :3001
kill -9 <PID>

# Increase memory
docker update --memory 2g <container_id>
```

### Database Connection Issues

```bash
# Test connection
mongosh "<connection_string>"
psql "<database_url>"

# Check firewall
telnet host 5432
```

### Smart Contract Issues

```bash
# Check app state
goal app read --app-id 12345

# Test transaction
goal clerk send --from address -t receiver --amount 1000000
```

## Post-Deployment Verification

- [ ] All services responding to health checks
- [ ] Frontend loads without errors
- [ ] Invoice creation works end-to-end
- [ ] Risk scoring returns valid scores
- [ ] Smart contract state updates correctly
- [ ] Monitoring alerts configured
- [ ] Backups running on schedule
- [ ] SSL certificate valid
- [ ] Performance metrics within targets
- [ ] Logs aggregating properly

## Rollback Procedure

```bash
# If critical bug found in production

# Backend
git checkout previous-tag
npm run build
docker build -t invoice-backend:rollback .
docker push invoice-backend:rollback
kubectl set image deployment/backend backend=invoice-backend:rollback

# Frontend
vercel rollback <deployment_id>

# Database (if schema changed)
# Run migration rollback scripts
npm run migrate:down
```

---

For more info: [Docker Deployment](https://docs.docker.com/), [Kubernetes Docs](https://kubernetes.io/docs/), [AWS Documentation](https://aws.amazon.com/documentation/)
