# ali-sum web

Next.js 16 dashboard and API backend for AliExpress order analytics.

## Setup

```bash
# From repo root
npm install

# Configure environment
cp .env .env.local
# Edit .env.local: DATABASE_URL, AUTH_SECRET, AUTH_URL

# Database
npx prisma migrate dev
npx prisma generate

# Dev server
npm run dev
```

Runs at `http://localhost:3000`.

## Structure

```
app/
├── (auth)/           # Login & register pages
├── (dashboard)/      # Overview, spending, sellers, orders, settings
└── api/              # Auth, orders sync, analytics endpoints
components/
├── charts/           # SpendingChart, SellersChart, SummaryCards
├── dashboard/        # DashboardShell, ExtensionTokenButton
└── ui/               # shadcn/ui components
lib/                  # Prisma client, auth config, API auth middleware
prisma/               # Schema & migrations
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| GET | `/api/auth/extension-token` | Generate extension JWT |
| POST | `/api/orders/sync` | Receive scraped orders from extension |
| GET | `/api/orders` | Paginated order list |
| GET | `/api/analytics/summary` | Total spent, order count, averages |
| GET | `/api/analytics/spending` | Time-series spending (week/month/year) |
| GET | `/api/analytics/sellers` | Top sellers by spend |

## Commands

```bash
npm run dev            # Dev server on :3000
npm run build          # Production build
npx prisma generate    # Regenerate Prisma client
npx prisma migrate dev # Run migrations
```
