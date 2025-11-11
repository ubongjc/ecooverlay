# EcoOverlay

**Scan. Compare. Choose Better.**

EcoOverlay helps consumers make more sustainable choices at the point of sale by displaying product carbon footprints and suggesting lower-impact alternatives.

## Project Structure

This monorepo contains two sibling applications:

```
ecooverlay/
├── ecooverlay_web/     # Next.js 15 web application
└── ecooverlay_ios/     # SwiftUI iOS application
```

### ecooverlay_web

Next.js web application providing:
- RESTful API with OpenAPI documentation
- PostgreSQL database with Prisma ORM
- Clerk authentication (Passkeys/WebAuthn)
- Stripe payment integration
- Cloudflare R2 storage
- Sentry + OpenTelemetry observability

**Tech Stack**: Next.js 15, TypeScript 5, Tailwind CSS, shadcn/ui, Prisma 5, PostgreSQL 16

[Web App Documentation →](./ecooverlay_web/README.md)

### ecooverlay_ios

Native iOS application providing:
- Barcode scanning with camera
- AR overlay for carbon footprint visualization
- Passkey authentication
- Client-side AES-GCM encryption
- StoreKit integration

**Tech Stack**: SwiftUI, Combine, CryptoKit, AVFoundation, AuthenticationServices

[iOS App Documentation →](./ecooverlay_ios/README.md)

## Key Features

### Core Functionality
- **Product Scanning**: Scan UPC barcodes to retrieve product data
- **Carbon Footprint**: Display detailed GHG Protocol emissions (Scope 1, 2, 3)
- **Alternative Suggestions**: Recommend lower-carbon alternatives
- **Impact Tracking**: Track personal carbon savings over time

### Security & Privacy
- **Passkey-First Authentication**: No passwords, biometric-based security
- **End-to-End Encryption**: Client-side encryption for sensitive data
- **GDPR Compliance**: Data export and deletion (DSR)
- **Privacy-First**: Server only stores ciphertext for sensitive blobs

### Monetization
- Free tier with basic features
- Premium subscription ($2.99/mo) with advanced analytics
- Green brand partnerships
- Data licensing (aggregated, anonymized)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 16 with pgvector extension
- Xcode 15+ (for iOS development)
- Clerk account
- Stripe account
- Cloudflare R2 bucket

### Quick Start (Web)

```bash
cd ecooverlay_web
npm install
cp .env.example .env
# Edit .env with your credentials
npx prisma generate
npx prisma db push
npm run dev
```

### Quick Start (iOS)

```bash
cd ecooverlay_ios
# Open in Xcode
open EcoOverlay.xcodeproj
# Build and run
```

## Architecture

### Data Model

- **Product**: Product catalog (UPC, name, brand, category)
- **Footprint**: Carbon footprint data with GHG Protocol scopes
- **AltSuggestion**: Lower-carbon alternatives with delta calculations
- **User**: User accounts, roles, subscriptions

### API Surface

- `GET /api/health` - Health check
- `GET /api/product/{upc}` - Get product by UPC
- `POST /api/product/{upc}` - Create product
- `GET /api/footprint/{productId}` - Get footprints
- `POST /api/footprint/{productId}` - Add footprint data
- `GET /api/alternates/{productId}` - Get alternatives

Full OpenAPI spec available at `/api/openapi`

## Development

### Web Development

```bash
cd ecooverlay_web
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run linter
```

### iOS Development

Open `ecooverlay_ios/EcoOverlay.xcodeproj` in Xcode and use standard iOS development workflow.

## Deployment

### Web
Deploy to Vercel, Netlify, or any Node.js hosting platform. Ensure:
- Environment variables configured
- Database migrated
- Webhooks configured (Clerk, Stripe)

### iOS
Submit to App Store via Xcode:
1. Archive build
2. Upload to App Store Connect
3. Submit for review

## License

Proprietary - All Rights Reserved

## Support

For issues and questions, please contact the development team.
