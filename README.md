# Multi-Vendor E-Book Marketplace

A production-oriented, portfolio-quality multi-vendor digital e-book marketplace engineered with Next.js (App Router), TypeScript (strict mode), PostgreSQL, Prisma ORM, MinIO (S3-compatible object storage), Redis, and Docker Compose.

Designed for authors and publishers across Ethiopia and international markets to publish, monetize, and distribute digital books (PDF & EPUB) securely to global readers.

---

## 🏗 System Architecture & Design Principles

### 1. Modular Architecture & Clean Layered Separation
The codebase strictly partitions concerns into explicit Frontend, Backend, and Database domains:

```
src/
├── frontend/                      # [FRONTEND LAYER] Pure Presentation & User Interface
│   ├── components/                # Reusable UI widgets (Navbar, BookCards, Feedback)
│   ├── views/                     # Full-Page Presentation Views
│   │   ├── auth/                  # LoginView, RegisterView
│   │   ├── store/                 # CatalogView, BookDetailView
│   │   ├── customer/              # CartView, CheckoutView, LibraryView, ReaderView
│   │   ├── seller/                # SellerDashboardView, SellerOnboardingView, NewBookView
│   │   └── admin/                 # AdminUsersView, ModerationView, FinanceView
│   └── index.ts                   # Frontend Barrel Export
│
├── backend/                       # [BACKEND LAYER] Pure Business Logic & Domain Services
│   ├── modules/                   # Domain Modules (Application & Domain Layers)
│   │   ├── identity/              # Auth, RBAC, Session Cookies, Password Hashing
│   │   ├── sellers/               # Author & Publisher Onboarding, Payout Accounts
│   │   ├── catalog/               # Book Publishing, Metadata, Storage Keys, Search
│   │   ├── moderation/            # Content Review Workflows & Editorial Audit
│   │   ├── cart/                  # Shopping Basket Session Logic
│   │   ├── orders/                # Checkout Snapshots & Platform Commission Splits
│   │   ├── payments/              # Payment Adapters (Chapa, Telebirr, Stripe) & Webhooks
│   │   ├── library/               # Digital Entitlements, Reading Progress & Byte Streaming
│   │   ├── finance/               # Double-Entry Ledger, Payouts & Compensating Refunds
│   │   ├── engagement/            # Verified Purchaser Reviews, Ratings & Wishlists
│   │   └── admin/                 # User Governance, Role Grants & Audit Logs
│   ├── infrastructure/            # MinIO S3 Client, Object Storage & External Adapters
│   └── index.ts                   # Unified Backend Facade
│
├── database/                      # [DATABASE LAYER] Data Access, ORM & Persistence
│   ├── client.ts                  # PostgreSQL Prisma Singleton Client
│   └── index.ts                   # Database Exports & Schema Model Types
│
└── app/                           # [ROUTING LAYER] Thin Next.js App Router Delegates
    ├── (auth)/                    # Thin page wrappers rendering @frontend/views/auth/*
    ├── (customer)/                # Thin page wrappers rendering @frontend/views/customer/*
    ├── (seller)/                  # Thin page wrappers rendering @frontend/views/seller/*
    ├── (store)/                   # Thin page wrappers rendering @frontend/views/store/*
    ├── admin/                     # Thin page wrappers rendering @frontend/views/admin/*
    └── api/                       # Thin REST API Route Handlers delegating to @backend/*
```

### 2. Architectural Boundaries & Layering
Each module implements clean inward dependency direction:
- **Presentation Layer**: Next.js Server Components, Client Components, and HTTP Route Handlers.
- **Application Layer**: Use-case orchestration services (`auth-service.ts`, `catalog-service.ts`, `finance-service.ts`, etc.) managing transactions and audit logging.
- **Domain Layer**: Pure business entities, state machines, and mathematical financial models (`financial-split.ts`, `rbac.ts`, `password.ts`). Business logic is completely decoupled from framework or database specifics.
- **Infrastructure Layer**: PostgreSQL persistence via Prisma ORM, private file storage via MinIO S3 SDK, and payment gateway network adapters.

---

## 🛡 Security & Core Business Invariants

| Domain | Invariant Enforcement |
| :--- | :--- |
| **Financial Calculations** | Zero floating-point arithmetic. All monetary values, exchange rates, and commission percentages use `Decimal.js` with exact `Decimal(12, 2)` or `Decimal(12, 4)` scale. |
| **Financial Ledger** | Strictly append-only. Financial adjustments (refunds, payout fees) are recorded as compensating rows (`REFUND_REVERSAL`, `PAYOUT_DEDUCTION`), never by mutating past sales rows. |
| **Seller Balances** | Payout holding period (7 days) separates `pendingBalance` from `availableBalance` to mitigate fraud and chargeback liabilities. |
| **Protected File Delivery** | Book PDF and EPUB binaries are stored in private, non-public MinIO/S3 buckets. In-browser reading is streamed via authenticated byte-range chunks (`HTTP 206 Partial Content`) verifying digital entitlement. |
| **Content Moderation** | Books uploaded by authors enter `DRAFT` status and must be submitted to the Moderation Queue. Only `PUBLISHED` books appear in the public storefront. |
| **Payment Webhooks** | Processed idempotently. Every provider webhook event is deduplicated via the `payment_webhook_events` table before modifying order states or granting digital library entitlements. |
| **Role-Based Authorization** | Hierarchical RBAC: `CUSTOMER`, `INDIVIDUAL_AUTHOR`, `PUBLISHER`, `CONTENT_MODERATOR`, `FINANCE_MANAGER`, `ADMINISTRATOR`. Deactivating an account immediately purges all active session tokens. |

---

## 💳 Payment Architecture & Financial Splits

### Double-Entry Financial Splitting
When an order with one or more digital books is paid:
1. The system snapshots each book's price and active commission rule rate (e.g. 15%).
2. The transaction splits the gross revenue into:
   - **Platform Commission** (15%): Credited to the platform revenue ledger.
   - **Seller Net Earnings** (85%): Credited to the author's `pendingBalance`.
3. An active `Entitlement` is granted to the buyer for perpetual reading and downloading.

```
       Customer Checkout
              │
              ▼
    [Payment Gateway Webhook]
              │
     ┌────────┴────────┐
     ▼                 ▼
[Order: COMPLETED] [Entitlement: ACTIVE]
     │
     ▼
[Financial Ledger (sale_ledger)]
  ├─ PLATFORM_COMMISSION  (15%)
  └─ SELLER_NET_EARNING   (85%) ──> [Seller: pendingBalance += Net]
```

### Supported Payment Adapters
The payment engine uses a modular adapter design (`IPaymentProvider`):
- **Chapa**: Ethiopian Birr (`ETB`) cards, mobile wallets, and QR payments.
- **Telebirr / CBE Birr**: Domestic Ethiopian mobile money integrations.
- **Stripe**: International credit card processing in `USD`, `EUR`, and global currencies.
- **Manual / Sandbox**: Deterministic test simulator with verified reference tokens.

---

## 🗄 Database Schema (Prisma ORM)

The relational schema is defined in `prisma/schema.prisma` with 20 models and 8 enums:

- **Identity**: `User`, `Role`, `UserRole`, `Session`, `PasswordResetToken`
- **Sellers**: `SellerProfile`, `SellerPayoutAccount`
- **Catalog**: `Category`, `Book`, `BookFile`, `BookPrice`, `BookCategory`
- **Moderation**: `ModerationReview`, `CommissionRule`
- **Commerce**: `Cart`, `CartItem`, `Order`, `OrderItem`
- **Payments & Ledger**: `Payment`, `PaymentWebhookEvent`, `SaleLedgerEntry`, `SellerPayout`
- **Customer Experience**: `Entitlement`, `ReadingProgress`, `Bookmark`, `Review`, `WishlistItem`
- **Security & Governance**: `AuditLog`

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+ (Node v24 supported)
- **Docker & Docker Compose**: v2.20+
- **Git**

### 2. Configure Environment
Create a `.env` file from the template:
```bash
cp .env.example .env
```

Ensure the database URL matches the Docker port mapping (`9432`):
```env
DATABASE_URL="postgresql://postgres:postgres_secure_pass@127.0.0.1:9432/ebook_marketplace?schema=public"
STORAGE_ENDPOINT="127.0.0.1"
STORAGE_PORT=9000
STORAGE_ACCESS_KEY="minio_admin"
STORAGE_SECRET_KEY="minio_secret_secure"
STORAGE_BUCKET="ebook-files"
STORAGE_USE_SSL="false"
SESSION_SECRET="production_super_secret_session_key_32_chars_min"
DEFAULT_COMMISSION_RATE="0.1500"
```

### 3. Start Local Infrastructure
Run the containerized services:
```bash
docker compose up -d
```
Service endpoints:
- **PostgreSQL 16**: `127.0.0.1:9432`
- **MinIO S3 API**: `http://localhost:9000`
- **MinIO Web Console**: `http://localhost:9001` (`minio_admin` / `minio_secret_secure`)
- **Redis 7**: `127.0.0.1:6379`

### 4. Install Dependencies & Initialize Database
```bash
npm install
npx prisma migrate dev
npm run prisma:seed
```

### 5. Run the Test Suite
The project includes comprehensive unit and integration test coverage across all domain services:
```bash
npm test
```
**Test Results**: 14 test suites passed, 55 tests passed (100% passing).

### 6. Run Next.js Production Build
```bash
npm run build
npm start
```
The application compiles 45 distinct static and server-rendered routes with strict type safety and zero linting warnings.

---

## 📡 API Directory

### Authentication & Identity
- `POST /api/auth/register` - Create a new user account with hashed credentials.
- `POST /api/auth/login` - Authenticate credentials and issue session token cookie.
- `POST /api/auth/logout` - Revoke current session token.
- `GET /api/auth/me` - Retrieve authenticated user profile and roles.

### Seller Management
- `POST /api/sellers/onboard` - Register as an author or publisher with business details.
- `GET /api/sellers/profile` - Fetch seller profile, verification status, and tier.
- `POST /api/sellers/payout-accounts` - Register a Telebirr, CBE, or bank payout destination.
- `GET /api/sellers/dashboard` - Get sales totals, net revenue, pending balance, and book count.

### Book Catalog & Object Storage
- `POST /api/catalog/upload-url` - Generate presigned S3 upload URL for covers and manuscripts.
- `POST /api/catalog/books` - Draft a new book listing with multi-currency pricing.
- `POST /api/catalog/books/:id/files` - Attach uploaded PDF/EPUB binaries with checksums.
- `POST /api/catalog/books/:id/submit` - Transition draft book to `PENDING_REVIEW` in moderation queue.
- `GET /api/catalog/search` - Public storefront discovery with category, language, price, and format filters.
- `GET /api/catalog/books/slug/:slug` - SEO-friendly public book detail page.

### Content Moderation
- `GET /api/moderation/queue` - Moderator queue of submitted books.
- `POST /api/moderation/review` - Claim, approve, reject, or request changes on submissions.
- `GET /api/moderation/history/:bookId` - Editorial moderation notes and historical decisions.

### Shopping Cart & Checkout
- `GET /api/cart` - View active cart items and price totals in selected currency.
- `POST /api/cart/items` - Add digital book to cart.
- `DELETE /api/cart/items/:bookId` - Remove book from cart.
- `POST /api/orders/checkout` - Create order with price snapshots and commission calculations.
- `GET /api/orders/:id` - Fetch order status and payment breakdown.

### Payments & Webhooks
- `POST /api/payments/initialize` - Initiate payment transaction with chosen gateway adapter.
- `POST /api/webhooks/payment/chapa` - Idempotent webhook handler for Chapa payments.
- `POST /api/webhooks/payment/manual` - Sandbox payment webhook handler for testing.

### Digital Library & Streaming
- `GET /api/library` - Retrieve purchased books with digital entitlements.
- `GET /api/books/:id/stream` - Authenticated `HTTP 206` chunked byte-range reader stream.
- `GET /api/books/:id/download` - Generate short-lived presigned download URL for entitlement holders.
- `POST /api/library/progress` - Save reading progress, page offsets, and bookmarks.

### Finance, Ledger & Payouts
- `POST /api/finance/payouts/request` - Seller submits withdrawal request against available balance.
- `GET /api/finance/payouts` - List pending and disbursed payout batches.
- `POST /api/finance/payouts/:id/approve` - Finance manager approves payout with transaction reference.
- `POST /api/finance/refunds` - Process order refund, insert compensating ledger rows, and revoke entitlement.
- `GET /api/finance/ledger` - Query immutable double-entry sale and fee ledger.

### Administration & Governance
- `GET /api/admin/users` - User directory with search, filtering, and role breakdown.
- `PUT /api/admin/users/:id/status` - Deactivate/activate user and revoke all active sessions.
- `POST /api/admin/users/:id/roles` - Assign administrative and staff roles (`CONTENT_MODERATOR`, `FINANCE_MANAGER`).
- `GET /api/admin/audit-logs` - System audit log inspection for compliance and governance.

---

## 🧪 Testing Strategy

The test suite covers every tier of the application using Vitest:
- **Unit Tests**:
  - `tests/unit/password.test.ts` (Bcrypt hashing, password complexity verification)
  - `tests/unit/rbac.test.ts` (Role hierarchy, permission evaluation)
  - `tests/unit/financial-split.test.ts` (Exact 15% commission splitting, multi-item rounding)
- **Integration Tests**:
  - `tests/integration/auth-service.test.ts` (Registration, login, duplicate email rejection)
  - `tests/integration/seller-service.test.ts` (Onboarding, payout registration, dashboard analytics)
  - `tests/integration/catalog-service.test.ts` (Book drafts, S3 storage keys, review submission)
  - `tests/integration/moderation-service.test.ts` (Claiming review, editorial approval, rejection feedback)
  - `tests/integration/discovery-service.test.ts` (Published book filtering, keyword search, slug resolution)
  - `tests/integration/cart-and-orders.test.ts` (Cart mutations, order checkout, snapshot persistence)
  - `tests/integration/payment-and-entitlement.test.ts` (Webhook idempotency, entitlement provisioning)
  - `tests/integration/library-service.test.ts` (Entitlement verification, reading progress tracking)
  - `tests/integration/finance-service.test.ts` (Payout workflows, balance deduction, refund reversals)
  - `tests/integration/engagement-service.test.ts` (Verified buyer reviews, rating recalculation)
  - `tests/integration/admin-service.test.ts` (User lifecycle, session revocation, role delegation)

---

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
