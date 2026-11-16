# Multi-Vendor E-Book Marketplace

A production-oriented multi-vendor digital e-book marketplace engineered with Next.js (App Router), TypeScript, PostgreSQL, Prisma ORM, MinIO (S3-compatible object storage), and Docker Compose.

---

## 🏗 Architecture Highlights

- **Modular Monolith**: Strict vertical domain separation (`src/modules/*`) with clean layered boundaries (Presentation $\rightarrow$ Application $\rightarrow$ Domain $\rightarrow$ Infrastructure).
- **Relational Integrity & PostgreSQL**: UUIDv4 primary keys, PostgreSQL 16, and full referential integrity.
- **Strict Financial Accounting**: Immutable append-only ledger (`sale_ledger`), automated 15% platform commission calculation, atomic order snapshots, and zero floating-point math (`Decimal.js` with `Decimal(12, 2)` / `Decimal(12, 4)` scale).
- **Private Object Storage**: Raw book binaries (PDF and EPUB) are stored in private MinIO/S3 buckets and served via authenticated chunked range streaming (`HTTP 206`) and ex-libris stamped downloads.
- **Multi-Gateway Ready**: Modular adapter architecture for Telebirr, CBE Birr, Chapa, Stripe, and PayPal with idempotent webhook processing.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ or v20+)
- [Docker & Docker Compose](https://www.docker.com/)

### 2. Configure Environment
Copy the example environment configuration:
```bash
cp .env.example .env
```

### 3. Start Local Infrastructure
Start PostgreSQL 16, MinIO, and Redis 7 in the background:
```bash
docker compose up -d
```
- **PostgreSQL**: `127.0.0.1:9432`
- **MinIO S3 API**: `http://localhost:9000`
- **MinIO Console**: `http://localhost:9001` (`minio_admin` / `minio_secret_secure`)
- **Redis**: `127.0.0.1:6379`

### 4. Install Dependencies & Migrate Database
```bash
npm install
npx prisma migrate dev
npm run prisma:seed
```

### 5. Run Development Server & Tests
```bash
# Run unit & integration tests
npm test

# Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
├── prisma/
│   ├── schema.prisma          # Complete relational schema & constraints
│   ├── migrations/            # Baseline database migrations
│   └── seed.ts                # Seed script for roles, rules, and categories
├── src/
│   ├── app/                   # Next.js App Router (Storefront, Portals, API)
│   ├── config/                # Environment schema validation (Zod)
│   ├── infrastructure/        # Prisma singleton, S3 adapter, Redis queue
│   ├── lib/                   # Pure utilities (Decimal money math, RFC 7807 errors)
│   └── modules/               # Vertical business modules
│       ├── identity/          # Auth, sessions, RBAC guards
│       ├── sellers/           # Seller profiles, onboarding, payout accounts
│       ├── catalog/           # Books, categories, pricing, formats
│       ├── moderation/        # Content review queues & status transitions
│       ├── cart/              # Cart state & multi-seller aggregation
│       ├── orders/            # Order item snapshots & checkout
│       ├── payments/          # Payment adapters & webhook idempotency
│       ├── finance/           # Immutable sales ledger, balances & payouts
│       └── library/           # Entitlements, progress tracking, bookmarks
├── tests/
│   ├── unit/                  # Business math, commission calculations
│   └── integration/           # Repositories & API integration
├── docker-compose.yml         # Containerized local environment
└── package.json
```
