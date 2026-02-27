# Deployment Guide

## 🚀 Production Deployment

This guide covers deploying the Smart Device Security & Tracking Platform to production.

## Prerequisites

- Docker & Docker Compose
- Kubernetes cluster (optional, for large scale)
- Domain name with SSL certificates
- Cloud provider account (AWS/GCP/Azure)
- PostgreSQL database (managed or self-hosted)
- Redis cluster
- S3-compatible storage

## 🔧 Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourorg/device-tracker.git
cd device-tracker
```

### 2. Configure Environment Variables

#### Backend (.env)
```bash
# Production environment
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@db-host:5432/devicetracker

# Redis
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=15m

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=devicetracker-production

# AI Service
AI_SERVICE_URL=http://ai-service:8000

# Email/SMS
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

#### AI Service (.env)
```bash
MODEL_PATH=/app/models
REDIS_URL=redis://redis-host:6379
LOG_LEVEL=info
```

## 🐳 Docker Deployment

### Build Images

```bash
# Build backend
cd backend
docker build -t devicetracker-backend:latest .

# Build AI service
cd ../ai-service
docker build -t devicetracker-ai:latest .

# Build mobile app (for Android APK)
cd ../mobile
docker build -f Dockerfile.android -t devicetracker-mobile:latest .

# Build desktop app
cd ../desktop
docker build -t devicetracker-desktop:latest .
```

### Docker Compose (All-in-one)

```bash
# Use production docker-compose
cd infrastructure/docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## ☸️ Kubernetes Deployment

### 1. Setup Kubernetes Cluster

```bash
# Create cluster (example with GKE)
gcloud container clusters create devicetracker-cluster \
  --num-nodes=3 \
  --machine-type=n1-standard-4 \
  --region=us-central1

# Get credentials
gcloud container clusters get-credentials devicetracker-cluster --region=us-central1
```

### 2. Create Secrets

```bash
# Database credentials
kubectl create secret generic db-credentials \
  --from-literal=url='postgresql://user:pass@host:5432/db'

# JWT secret
kubectl create secret generic jwt-secret \
  --from-literal=secret='your-jwt-secret'

# AWS credentials
kubectl create secret generic aws-credentials \
  --from-literal=access-key='your-key' \
  --from-literal=secret-key='your-secret'
```

### 3. Deploy Services

```bash
cd infrastructure/kubernetes

# Deploy PostgreSQL (or use managed service)
kubectl apply -f postgres/

# Deploy Redis
kubectl apply -f redis/

# Deploy backend API
kubectl apply -f backend/

# Deploy AI service
kubectl apply -f ai-service/

# Deploy ingress
kubectl apply -f ingress/
```

### 4. Scale Services

```bash
# Scale backend
kubectl scale deployment backend --replicas=5

# Auto-scaling
kubectl autoscale deployment backend \
  --cpu-percent=70 \
  --min=3 \
  --max=10
```

## 🗄️ Database Setup

### PostgreSQL Migration

```bash
# Run migrations
cd backend
npm run prisma:deploy

# Seed initial data (optional)
npm run prisma:seed
```

### Database Backup

```bash
# Automated backup (cron job)
0 2 * * * pg_dump -h db-host -U user devicetracker | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz
```

## 🔐 SSL/TLS Setup

### Using Let's Encrypt

```bash
# Install cert-manager (Kubernetes)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create certificate issuer
kubectl apply -f infrastructure/kubernetes/certificates/issuer.yaml

# Request certificate
kubectl apply -f infrastructure/kubernetes/certificates/certificate.yaml
```

### Load Balancer Configuration

```yaml
# NGINX Ingress with SSL
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: devicetracker-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.devicetracker.com
    secretName: devicetracker-tls
  rules:
  - host: api.devicetracker.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 3000
```

## 📊 Monitoring Setup

### Prometheus + Grafana

```bash
# Install Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack

# Access Grafana
kubectl port-forward svc/prometheus-grafana 3000:80
```

### ELK Stack (Logging)

```bash
# Install Elasticsearch
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch

# Install Kibana
helm install kibana elastic/kibana

# Install Filebeat
helm install filebeat elastic/filebeat
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build & Push Backend
        run: |
          docker build -t gcr.io/project/backend:${{ github.sha }} backend/
          docker push gcr.io/project/backend:${{ github.sha }}
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/backend \
            backend=gcr.io/project/backend:${{ github.sha }}
          kubectl rollout status deployment/backend
```

## 🧪 Health Checks

### Backend Health Check

```bash
curl https://api.devicetracker.com/health
```

### AI Service Health Check

```bash
curl https://api.devicetracker.com/ai/health
```

## 📱 Mobile App Distribution

### iOS (App Store)

```bash
cd mobile
# Build for production
npx react-native build-ios --configuration Release

# Upload to App Store Connect
xcrun altool --upload-app \
  --type ios \
  --file build/DeviceTracker.ipa \
  --username your@email.com \
  --password app-specific-password
```

### Android (Play Store)

```bash
cd mobile/android
# Build release APK
./gradlew assembleRelease

# Sign APK
jarsigner -verbose -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore devicetracker.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  devicetracker

# Upload to Play Console (manual or automated)
```

## 🖥️ Desktop App Distribution

### Windows

```bash
cd desktop
npm run build
npm run package

# Output: dist/Device Tracker Setup.exe
```

### macOS

```bash
cd desktop
npm run build
npm run make

# Output: dist/Device Tracker.dmg
```

### Linux

```bash
cd desktop
npm run build
npm run make

# Output: dist/Device Tracker.AppImage
```

## 🔍 Troubleshooting

### Check Backend Logs

```bash
# Kubernetes
kubectl logs -f deployment/backend

# Docker
docker logs -f backend
```

### Database Connection Issues

```bash
# Test connection
psql postgresql://user:pass@host:5432/db

# Check pool status
kubectl exec -it backend-pod -- npm run db:pool-status
```

### Redis Connection Issues

```bash
# Test Redis
redis-cli -h redis-host -p 6379 -a password ping
```

## 📈 Performance Optimization

### Enable Caching

```nginx
# NGINX caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g;

location /v1/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_pass http://backend;
}
```

### Database Optimization

```sql
-- Enable query plan cache
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- Increase connection pool
ALTER SYSTEM SET max_connections = 200;

-- Optimize for SSD
ALTER SYSTEM SET random_page_cost = 1.1;
```

## 🔒 Security Hardening

### 1. Enable Rate Limiting

```typescript
// Already implemented in backend
// Adjust limits in backend/src/app.module.ts
```

### 2. Enable Web Application Firewall

```bash
# CloudFlare, AWS WAF, or ModSecurity
```

### 3. Regular Security Audits

```bash
# NPM audit
cd backend && npm audit

# Docker image scanning
docker scan devicetracker-backend:latest

# Dependency updates
npm update
```

## 📞 Support & Maintenance

### Backup Strategy

- Database: Daily full backup, hourly incremental
- S3 files: Versioning enabled, lifecycle policies
- Backups retained for 90 days

### Update Strategy

- Backend: Rolling updates with zero downtime
- Mobile: Gradual rollout (10% → 50% → 100%)
- Desktop: Auto-update on launch

### Monitoring Alerts

- CPU usage > 80%
- Memory usage > 85%
- API response time > 2s
- Error rate > 1%
- Database connection pool exhausted

---

**Need Help?** Contact: devops@devicetracker.com

**Documentation:** https://docs.devicetracker.com

**Status Page:** https://status.devicetracker.com
