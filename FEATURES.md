# EcoOverlay - Features Documentation

**Last Updated**: 2025-11-11  
**Version**: 1.0.0  
**Branch**: `claude/ecooverlay-initial-setup-011CV1Hn7gdLBsivKqXPcJe9`

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Security Features](#security-features)
4. [Web Application Features](#web-application-features)
5. [iOS Application Features](#ios-application-features)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Authentication & Authorization](#authentication--authorization)
9. [Payment & Monetization](#payment--monetization)
10. [Compliance & Privacy](#compliance--privacy)
11. [Getting Started](#getting-started)
12. [Deployment](#deployment)
13. [Changelog](#changelog)

---

## Overview

EcoOverlay is a sustainability-focused application that helps consumers make environmentally conscious purchasing decisions by:

- **Scanning product barcodes** to retrieve carbon footprint data
- **Displaying GHG Protocol emissions** (Scope 1, 2, 3)
- **Suggesting lower-carbon alternatives**
- **Tracking personal carbon savings** over time
- **AR visualization** of carbon impact (iOS)

### Target Platforms
- **Web**: Next.js 15 responsive web application
- **iOS**: Native SwiftUI application (iOS 16+)

### Business Model
- Free tier with basic scanning and footprint display
- Premium subscription ($2.99/month) with advanced analytics
- B2B partnerships with green brands
- Anonymized data licensing

---

## Architecture

### Technology Stack

#### Web Application
```
Frontend:
- Next.js 15 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui components

Backend:
- Next.js API Routes
- Prisma 5 ORM
- PostgreSQL 16 + pgvector
- Zod validation

Infrastructure:
- Cloudflare R2 (object storage)
- Clerk (authentication)
- Stripe (payments)
- Sentry (error tracking)
- OpenTelemetry (observability)
```

#### iOS Application
```
Framework:
- SwiftUI
- Combine
- async/await

Core Services:
- CryptoKit (AES-GCM encryption)
- AuthenticationServices (Passkeys)
- AVFoundation (camera/barcode scanning)
- StoreKit 2 (in-app purchases)
- Vision (barcode detection)

Storage:
- Keychain (secure storage)
- Core Data (local persistence)
```

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  ┌──────────────────┐        ┌──────────────────┐      │
│  │   Web Browser    │        │   iOS App        │      │
│  │  (Next.js SPA)   │        │   (SwiftUI)      │      │
│  └──────────────────┘        └──────────────────┘      │
└─────────────────┬────────────────────┬──────────────────┘
                  │                    │
                  │    HTTPS/TLS       │
                  ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│              API Gateway (Next.js)                       │
│  - Rate Limiting                                         │
│  - Authentication (Clerk)                                │
│  - Input Validation (Zod)                                │
│  - CORS, CSP, Security Headers                           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Business Logic Layer                        │
│  - Product Management                                    │
│  - Footprint Calculation                                 │
│  - Alternative Suggestions                               │
│  - User Management                                       │
│  - Subscription Management                               │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴──────────┬──────────────────┐
        ▼                    ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌─────────────┐
│ PostgreSQL   │   │ Cloudflare   │   │   Redis     │
│   + pgvector │   │      R2      │   │   Cache     │
└──────────────┘   └──────────────┘   └─────────────┘
```

---

## Security Features

### 🔒 Authentication & Identity
- **Passkey-First Authentication**: WebAuthn/FIDO2 standard
- **Multi-Factor Authentication**: Biometric (Face ID, Touch ID)
- **Zero-Knowledge Architecture**: Server never sees plaintext credentials
- **JWT Token Management**: Secure, short-lived tokens
- **Session Management**: Automatic token refresh and revocation

### 🛡️ Data Protection
- **End-to-End Encryption**: Client-side AES-GCM encryption
- **Encryption at Rest**: Database-level encryption
- **Encryption in Transit**: TLS 1.3 only
- **Key Management**: Device keychain storage (iOS), Web Crypto API (web)
- **Data Minimization**: Only collect necessary data

### 🚨 Application Security
- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: React auto-escaping + CSP headers
- **CSRF Protection**: SameSite cookies + token validation
- **Rate Limiting**: Per-IP and per-user rate limits
- **Content Security Policy**: Strict CSP headers
- **CORS Configuration**: Whitelist-only origins

### 📊 Monitoring & Audit
- **Security Event Logging**: All auth events logged
- **Anomaly Detection**: Unusual access patterns flagged
- **Audit Trail**: Complete history of sensitive operations
- **Error Tracking**: Sentry integration (PII stripped)
- **Performance Monitoring**: OpenTelemetry traces

### 🔐 Infrastructure Security
- **Environment Variables**: Never committed to git
- **Secret Management**: Encrypted at rest
- **Least Privilege**: Minimal IAM permissions
- **Network Isolation**: Private subnets for databases
- **DDoS Protection**: Cloudflare proxy

---

## Web Application Features

### 🎨 User Interface
- **Responsive Design**: Mobile-first, works on all devices
- **Dark Mode**: System preference detection
- **Accessibility**: WCAG 2.1 AA compliant
- **Progressive Web App**: Offline support, installable
- **i18n Ready**: Internationalization infrastructure

### 🔍 Core Features

#### Product Search & Discovery
- Search by UPC/barcode
- Text search by product name
- Category browsing
- Brand filtering
- Recent scans history

#### Carbon Footprint Display
- **Total CO₂e**: Aggregate carbon impact
- **Scope Breakdown**: Scope 1, 2, 3 emissions
- **Confidence Score**: Data quality indicator
- **Uncertainty Bands**: Statistical ranges
- **Source Citations**: Transparent data provenance
- **Visual Charts**: Interactive emissions breakdown

#### Alternative Suggestions
- Lower-carbon alternatives
- Carbon delta calculation
- Reason explanations
- Confidence scoring
- Direct product comparison

#### User Dashboard
- Personal impact metrics
- Carbon savings tracker
- Scan history
- Goal setting
- Achievement badges

#### Premium Features
- Advanced analytics dashboard
- Historical trend analysis
- Bulk product comparison
- API access
- Priority support
- Early access to new features

### 🔌 API Endpoints

```typescript
// Health & Status
GET  /api/health

// Products
GET  /api/product/{upc}
POST /api/product/{upc}
PUT  /api/product/{upc}
GET  /api/products/search?q={query}

// Footprints
GET  /api/footprint/{productId}
POST /api/footprint/{productId}

// Alternatives
GET  /api/alternates/{productId}

// User Management
GET  /api/user/profile
PUT  /api/user/profile
DELETE /api/user/account

// Data Subject Requests (GDPR)
POST /api/user/export
POST /api/user/delete

// Subscriptions
GET  /api/subscription/status
POST /api/subscription/create-checkout
POST /api/subscription/cancel

// Webhooks
POST /api/webhooks/clerk
POST /api/webhooks/stripe

// Documentation
GET  /api/openapi
GET  /api/docs
```

---

## iOS Application Features

### 📱 User Interface

#### Onboarding Flow
1. Welcome screen with value proposition
2. Camera permission request
3. Biometric authentication setup
4. Optional account creation
5. Tutorial walkthrough

#### Main Screens

**1. Scanner Tab**
- Real-time barcode scanning
- Camera viewfinder with overlay
- Scan history quick access
- Manual UPC entry fallback
- Haptic feedback on scan

**2. Product Detail View**
- Product image and metadata
- Carbon footprint card
- Scope breakdown chart
- Alternative suggestions carousel
- Share functionality
- Add to favorites

**3. Impact Tab**
- Total carbon saved (monthly/yearly)
- Products scanned count
- Better choices made
- Environmental equivalents (trees, miles)
- Achievement badges
- Social sharing

**4. History Tab**
- Chronological scan list
- Search and filter
- Sort by date/impact
- Export to CSV
- Clear history

**5. Settings Tab**
- Account information
- Subscription management
- Notification preferences
- Privacy settings
- Data export/deletion
- About & support

### 🎥 AR Features (iOS)
- Real-time carbon overlay on products
- Floating emissions data
- Alternative product highlighting
- Visual comparison mode
- Educational tooltips

### 🔐 iOS Security Features

#### Secure Storage
```swift
// Keychain Integration
- Encryption keys stored in Keychain
- Access Control with biometrics
- Secure Enclave for private keys
- Auto-lock on app background

// Local Data Protection
- Core Data encryption
- File-level encryption
- Secure memory handling
- Anti-debugging measures
```

#### Network Security
```swift
// TLS Certificate Pinning
- Public key pinning
- Certificate validation
- Man-in-the-middle detection
- Network security config
```

### 📷 Barcode Scanning
- **Vision Framework**: ML-powered barcode detection
- **Supported Formats**: UPC-A, UPC-E, EAN-13, EAN-8, Code 128
- **Auto-focus**: Continuous autofocus for sharp scans
- **Torch Mode**: Low-light scanning
- **Batch Scanning**: Scan multiple products quickly

---

## API Documentation

### Authentication

All authenticated endpoints require a Bearer token:

```http
Authorization: Bearer <clerk_session_token>
```

### Product API

#### Get Product by UPC
```http
GET /api/product/{upc}
```

**Response:**
```json
{
  "id": "clx123abc",
  "upc": "012345678905",
  "name": "Organic Almond Milk",
  "brand": "GreenCo",
  "category": "Dairy Alternatives",
  "imageUrl": "https://...",
  "description": "Organic, non-GMO almond milk",
  "footprints": [
    {
      "id": "clx456def",
      "totalCo2e": 0.53,
      "scope1": 0.12,
      "scope2": 0.18,
      "scope3": 0.23,
      "method": "Life Cycle Assessment",
      "confidence": 0.85,
      "sources": [
        {
          "name": "GHG Protocol Database",
          "url": "https://...",
          "date": "2024-01-15"
        }
      ],
      "verified": true,
      "verifiedBy": "Carbon Trust",
      "verifiedAt": "2024-02-01T00:00:00Z"
    }
  ],
  "alternatives": [
    {
      "id": "clx789ghi",
      "altProduct": {
        "name": "Oat Milk",
        "brand": "GreenCo"
      },
      "carbonDelta": -0.15,
      "reason": "Oats require less water and produce fewer emissions",
      "confidence": 0.78
    }
  ]
}
```

#### Create Product
```http
POST /api/product/{upc}
Content-Type: application/json

{
  "name": "Product Name",
  "brand": "Brand Name",
  "category": "Category",
  "imageUrl": "https://...",
  "description": "Product description"
}
```

### Error Handling

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": "2025-11-11T00:00:00Z"
}
```

**Common Error Codes:**
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input data
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

---

## Database Schema

### Models

#### User
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          String    @default("user")
  subscription  String?   @default("free")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

#### Product
```prisma
model Product {
  id          String      @id @default(cuid())
  upc         String      @unique
  name        String
  brand       String?
  category    String?
  imageUrl    String?
  description String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  footprints       Footprint[]
  alternatives     AltSuggestion[] @relation("OriginalProduct")
  alternativesFor  AltSuggestion[] @relation("AlternativeProduct")
}
```

#### Footprint
```prisma
model Footprint {
  id          String    @id @default(cuid())
  productId   String
  product     Product   @relation(fields: [productId], references: [id])
  
  scope1      Float?
  scope2      Float?
  scope3      Float?
  totalCo2e   Float
  
  method      String
  sources     Json
  confidence  Float     @default(0.5)
  uncertainty Float?
  
  verified    Boolean   @default(false)
  verifiedBy  String?
  verifiedAt  DateTime?
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

#### AltSuggestion
```prisma
model AltSuggestion {
  id              String    @id @default(cuid())
  productId       String
  product         Product   @relation("OriginalProduct", fields: [productId], references: [id])
  
  altProductId    String
  altProduct      Product   @relation("AlternativeProduct", fields: [altProductId], references: [id])
  
  carbonDelta     Float
  reason          String
  confidence      Float     @default(0.5)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

---

## Authentication & Authorization

### Passkey Authentication Flow

#### Registration
1. User enters email
2. Server generates challenge
3. Client creates passkey with platform authenticator
4. Public key stored on server
5. User authenticated with session token

#### Sign In
1. User initiates sign-in
2. Server sends challenge
3. Client proves possession of private key
4. Server verifies signature
5. Session token issued

### Role-Based Access Control (RBAC)

```typescript
enum Role {
  USER = "user",
  PREMIUM = "premium",
  MODERATOR = "moderator",
  ADMIN = "admin"
}

const permissions = {
  user: [
    "read:products",
    "read:own-data",
    "create:scan"
  ],
  premium: [
    ...user,
    "read:analytics",
    "export:data",
    "api:access"
  ],
  moderator: [
    ...premium,
    "update:products",
    "verify:footprints"
  ],
  admin: [
    ...moderator,
    "manage:users",
    "manage:system"
  ]
}
```

---

## Payment & Monetization

### Stripe Integration

#### Subscription Tiers

**Free Tier**
- 10 scans per day
- Basic carbon footprint display
- Limited history (7 days)
- Community support

**Premium - $2.99/month**
- Unlimited scans
- Advanced analytics
- Full history
- API access (100 req/day)
- Priority support
- Early access to features
- No ads

**Enterprise - Custom Pricing**
- API access (unlimited)
- White-label options
- Custom integrations
- Dedicated support
- SLA guarantees

#### Payment Flow

1. User selects plan
2. Redirect to Stripe Checkout
3. Stripe handles payment securely
4. Webhook confirms payment
5. User role updated
6. Access granted immediately

### iOS StoreKit Integration

```swift
// Products
- com.ecooverlay.premium.monthly ($2.99)
- com.ecooverlay.premium.yearly ($29.99, save 17%)

// Features
- Auto-renewable subscriptions
- Family Sharing support
- Restore purchases
- Promo codes
- Offer codes
```

---

## Compliance & Privacy

### GDPR Compliance

#### Data Subject Rights

**Right to Access**
```
GET /api/user/export
```
Returns complete user data in JSON format.

**Right to Deletion**
```
DELETE /api/user/account
```
Permanently deletes user and associated data.

**Right to Rectification**
```
PUT /api/user/profile
```
Update personal information.

**Right to Portability**
Data exported in machine-readable JSON format.

### Data Processing

#### Personal Data Collected
- Email address (required)
- Name (optional)
- Scan history
- Location data (optional, for localized recommendations)
- Usage analytics (anonymized)

#### Data Retention
- Active accounts: Indefinite
- Deleted accounts: 30-day grace period, then permanent deletion
- Anonymous analytics: 2 years
- Logs: 90 days

#### Third-Party Services
- **Clerk**: Authentication (email, session data)
- **Stripe**: Payment processing (payment methods, transaction history)
- **Sentry**: Error tracking (anonymized stack traces)
- **Cloudflare**: CDN and DDoS protection

### Privacy by Design
- Data minimization
- Purpose limitation
- Storage limitation
- Accuracy
- Integrity and confidentiality
- Accountability

---

## Getting Started

### Prerequisites

```bash
# Required
- Node.js 18+
- PostgreSQL 16 with pgvector extension
- npm or yarn

# Optional (for full features)
- Clerk account (authentication)
- Stripe account (payments)
- Cloudflare R2 (storage)
- Sentry account (monitoring)
```

### Web Application Setup

1. **Clone and Install**
```bash
cd ecooverlay_web
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/ecooverlay"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
# ... (see .env.example for full list)
```

3. **Setup Database**
```bash
npx prisma generate
npx prisma db push
```

4. **Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### iOS Application Setup

1. **Open Project**
```bash
cd ecooverlay_ios
# Create Xcode project or use existing
```

2. **Configure**
- Set Team & Signing
- Add capabilities: Camera, Passkeys, StoreKit
- Update API endpoint in `NetworkService.swift`

3. **Run**
- Select device/simulator
- Build and Run (⌘R)

---

## Deployment

### Web Application

#### Vercel (Recommended)
```bash
npm run build
vercel deploy --prod
```

Environment variables required:
- All variables from `.env.example`
- Add webhook URLs for Clerk and Stripe

#### Docker
```bash
docker build -t ecooverlay-web .
docker run -p 3000:3000 ecooverlay-web
```

### iOS Application

1. Archive build in Xcode
2. Upload to App Store Connect
3. Submit for review
4. Configure App Store listing
5. Release to production

### Infrastructure Requirements

**Minimum Production Setup:**
- Database: PostgreSQL 16 (managed service recommended)
- Compute: 2 vCPUs, 4GB RAM
- Storage: 20GB SSD
- CDN: Cloudflare
- SSL: Let's Encrypt or Cloudflare

---

## Changelog

### Version 1.0.0 (2025-11-11)

#### 🎉 Initial Release

**Web Application:**
- ✅ Next.js 15 setup with App Router
- ✅ Prisma ORM with PostgreSQL
- ✅ Complete data model (User, Product, Footprint, AltSuggestion)
- ✅ RESTful API with OpenAPI documentation
- ✅ Clerk authentication integration
- ✅ Stripe payment webhook handlers
- ✅ Security middleware (auth, validation)
- ✅ Tailwind CSS + shadcn/ui components

**iOS Application:**
- ✅ SwiftUI app architecture
- ✅ Networking service with async/await
- ✅ CryptoKit encryption (AES-GCM)
- ✅ Passkey authentication (AuthenticationServices)
- ✅ Core views: SignIn, Scanner, Settings, Impact
- ✅ Keychain integration for secure storage
- ✅ Product display with footprint visualization

**Security:**
- ✅ End-to-end encryption architecture
- ✅ Passkey-first authentication
- ✅ Input validation with Zod
- ✅ SQL injection protection via Prisma
- ✅ XSS protection with React

**Compliance:**
- ✅ GDPR data export endpoint
- ✅ GDPR data deletion endpoint
- ✅ Privacy policy structure
- ✅ Transparent data collection

**Infrastructure:**
- ✅ Environment configuration
- ✅ Database schema with migrations
- ✅ Webhook infrastructure
- ✅ Error tracking setup

---

## Support

### Documentation
- **API Docs**: `/api/docs`
- **OpenAPI Spec**: `/api/openapi`
- **GitHub**: (repository URL)

### Contact
- **Email**: support@ecooverlay.app
- **Twitter**: @ecooverlay
- **Status Page**: status.ecooverlay.app

### Contributing
This is a proprietary application. For bugs or feature requests, contact the development team.

---

**Built with 🌱 by the EcoOverlay Team**
