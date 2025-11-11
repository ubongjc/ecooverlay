# EcoOverlay Web

Next.js web application for EcoOverlay - scan products and see their carbon footprint in real-time.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: PostgreSQL 16 + Prisma 5
- **Auth**: Clerk (Passkeys/WebAuthn)
- **Payments**: Stripe
- **Storage**: Cloudflare R2
- **Observability**: Sentry + OpenTelemetry

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16 with pgvector extension
- Clerk account
- Stripe account
- Cloudflare R2 bucket

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your actual credentials.

3. Set up the database:
```bash
# Make sure PostgreSQL is running
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Documentation

OpenAPI documentation is available at `/api/openapi` when the server is running.

### Key Endpoints

- `GET /api/health` - Health check
- `GET /api/product/{upc}` - Get product by UPC
- `POST /api/product/{upc}` - Create product
- `GET /api/footprint/{productId}` - Get footprints
- `POST /api/footprint/{productId}` - Add footprint data
- `GET /api/alternates/{productId}` - Get alternatives

## Database Schema

### Core Models

- **Product**: Product catalog with UPC, name, brand, category
- **Footprint**: Carbon footprint data (Scope 1, 2, 3)
- **AltSuggestion**: Lower-carbon alternative suggestions
- **User**: User accounts and subscriptions

## Features

- Passkey authentication (WebAuthn)
- Product carbon footprint tracking
- Alternative product suggestions
- Real-time data sync
- Client-side encryption for sensitive data
- Stripe payment integration
- Data export (GDPR compliance)

## Security

- All sensitive data is encrypted client-side before upload
- Server only stores ciphertext
- Passkey-first authentication
- Role-based access control (RBAC)

## Deployment

```bash
npm run build
npm start
```

For production deployment, ensure:
1. All environment variables are set
2. Database is migrated
3. Clerk webhooks are configured
4. Stripe webhooks are configured

## License

Proprietary - All Rights Reserved
