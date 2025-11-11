# EcoOverlay - Production Deployment Guide

Complete guide for deploying EcoOverlay to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Web Application Deployment](#web-application-deployment)
5. [iOS Application Deployment](#ios-application-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Security Checklist](#security-checklist)

---

## Prerequisites

### Required Services

- **PostgreSQL 16** with pgvector extension
- **Redis** (Upstash recommended for serverless)
- **Clerk** account for authentication
- **Stripe** account for payments
- **Cloudflare R2** or AWS S3 for storage
- **Sentry** for error tracking (optional but recommended)

### Required Tools

- Node.js 18+
- Docker & Docker Compose
- Git

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/ecooverlay.git
cd ecooverlay
```

### 2. Configure Environment Variables

```bash
cd ecooverlay_web
cp .env.example .env
```

Edit `.env` with production values:

```env
# Database - Use managed PostgreSQL (AWS RDS, Supabase, etc.)
DATABASE_URL="postgresql://user:pass@host:5432/ecooverlay?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Stripe Payments
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PREMIUM_PRICE_ID="price_..."

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="ecooverlay-prod"
R2_PUBLIC_URL="https://..."

# Security
ALLOWED_ORIGINS="https://ecooverlay.app,https://www.ecooverlay.app"
API_SECRET_KEY="..." # Generate with: openssl rand -hex 32

# Sentry
NEXT_PUBLIC_SENTRY_DSN="https://..."
SENTRY_AUTH_TOKEN="..."

# Application
NEXT_PUBLIC_APP_URL="https://ecooverlay.app"
NODE_ENV="production"
```

---

## Database Setup

### Option 1: Managed PostgreSQL (Recommended)

**Supabase** (Easiest):
1. Create project at https://supabase.com
2. Copy connection string
3. Enable pgvector extension in SQL Editor:
```sql
CREATE EXTENSION vector;
```

**AWS RDS**:
1. Create PostgreSQL 16 instance
2. Configure security groups
3. Install pgvector extension

### Option 2: Self-Hosted

```bash
# Using Docker
docker run -d \
  --name ecooverlay-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=ecooverlay \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

### Run Migrations

```bash
cd ecooverlay_web
npx prisma generate
npx prisma db push
```

---

## Web Application Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
cd ecooverlay_web
vercel --prod
```

3. **Configure Environment Variables** in Vercel Dashboard

4. **Set up Webhooks**:
   - Clerk: https://ecooverlay.app/api/webhooks/clerk
   - Stripe: https://ecooverlay.app/api/webhooks/stripe

### Option 2: Docker + Any Cloud Provider

1. **Build Docker Image**:
```bash
cd ecooverlay_web
docker build -t ecooverlay-web:latest .
```

2. **Run Container**:
```bash
docker run -d \
  --name ecooverlay-web \
  -p 3000:3000 \
  --env-file .env \
  ecooverlay-web:latest
```

3. **Deploy to Cloud**:

**AWS ECS**:
```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_REGISTRY
docker tag ecooverlay-web:latest YOUR_ECR_REGISTRY/ecooverlay-web:latest
docker push YOUR_ECR_REGISTRY/ecooverlay-web:latest

# Create ECS task definition and service
```

**Google Cloud Run**:
```bash
gcloud run deploy ecooverlay \
  --image ecooverlay-web:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**DigitalOcean App Platform**:
- Connect GitHub repository
- Configure environment variables
- Deploy

### Option 3: Docker Compose (Development/Staging)

```bash
docker-compose up -d
```

---

## iOS Application Deployment

### 1. Configure Xcode Project

1. Open `ecooverlay_ios` in Xcode
2. Set Team and Bundle Identifier
3. Configure capabilities:
   - Camera
   - Passkeys (Associated Domains)
   - StoreKit
   - Keychain Sharing

4. Update API endpoint in `NetworkService.swift`:
```swift
init(baseURL: String = "https://api.ecooverlay.app")
```

### 2. Configure StoreKit Products

1. Create products in App Store Connect:
   - `com.ecooverlay.premium.monthly` - $2.99/month
   - `com.ecooverlay.premium.yearly` - $29.99/year

2. Set up subscription groups
3. Configure pricing for regions

### 3. Build and Archive

1. Select "Any iOS Device (arm64)" target
2. Product > Archive
3. Distribute App > App Store Connect
4. Upload

### 4. Submit for Review

1. Complete App Store listing
2. Add screenshots
3. Configure subscription information
4. Submit for review

---

## Monitoring & Maintenance

### Health Checks

Monitor these endpoints:

```bash
# API Health
curl https://ecooverlay.app/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-11T00:00:00Z",
  "services": {
    "database": "connected",
    "api": "operational"
  }
}
```

### Logs

**Vercel**:
```bash
vercel logs
```

**Docker**:
```bash
docker logs -f ecooverlay-web
```

### Database Backups

**Automated backups** (recommended):
- Enable daily automated backups in your database provider
- Retain at least 30 days

**Manual backup**:
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Performance Monitoring

1. **Sentry** for error tracking
2. **Vercel Analytics** for web metrics
3. **Prisma Studio** for database inspection:
```bash
npx prisma studio
```

---

## Security Checklist

### Before Going Live

- [ ] All environment variables set
- [ ] HTTPS enabled (TLS 1.3)
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] CSP headers active
- [ ] Database backups automated
- [ ] Webhook signatures verified
- [ ] Error messages sanitized
- [ ] Audit logging enabled
- [ ] Secrets rotated from defaults
- [ ] 2FA enabled on all admin accounts

### Clerk Configuration

- [ ] Production environment created
- [ ] Passkeys enabled
- [ ] Email verification enabled
- [ ] Webhook URL configured
- [ ] Development keys removed

### Stripe Configuration

- [ ] Live mode activated
- [ ] Products created
- [ ] Webhook endpoint configured
- [ ] Test mode keys removed
- [ ] Tax settings configured

### Database

- [ ] Connection pooling enabled
- [ ] SSL/TLS required
- [ ] Row-level security configured (if applicable)
- [ ] Backup strategy tested
- [ ] Monitoring alerts set up

---

## Scaling Considerations

### Web Application

**Horizontal Scaling**:
- Use load balancer (AWS ALB, CloudFlare, etc.)
- Deploy multiple instances
- Use Redis for session storage

**Database**:
- Enable connection pooling (PgBouncer)
- Read replicas for heavy reads
- Partition large tables

**Caching**:
- Redis/Upstash for API responses
- CDN for static assets
- Edge caching with Vercel/CloudFlare

### Cost Optimization

**Free Tier Usage**:
- Vercel: 100GB bandwidth/month
- Supabase: 500MB database, 2GB bandwidth
- Upstash: 10,000 requests/day
- Clerk: 10,000 MAU

**Estimated Monthly Costs** (1000 active users):
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Upstash: $10/month
- Cloudflare R2: $5/month
- **Total: ~$60/month**

---

## Troubleshooting

### Common Issues

**Database Connection Failed**:
```bash
# Check connection string
psql $DATABASE_URL

# Verify pgvector extension
psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

**Webhook Not Receiving Events**:
- Verify URL is publicly accessible
- Check webhook signature validation
- Review webhook logs in Clerk/Stripe dashboard

**Rate Limiting Not Working**:
- Verify Redis connection
- Check UPSTASH_REDIS_REST_URL is set
- Review middleware logs

---

## Support

- **Documentation**: https://docs.ecooverlay.app
- **Email**: support@ecooverlay.app
- **Status Page**: https://status.ecooverlay.app

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0
