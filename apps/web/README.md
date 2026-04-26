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
├── dashboard/        # DashboardShell, MobileTabBar, ExtensionTokenRow, etc.
└── ui/               # shadcn/ui components
lib/                  # Prisma client, auth config, API auth middleware, date-filter constants
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

## Date Filtering

All dashboard pages share a date-range filter. Presets and the default are defined in `lib/date-filter.ts`:

- `DATE_PRESETS` — the ordered list of preset options shown in the UI
- `DEFAULT_DATE_PRESET` — the preset applied on first visit (currently **"This month"**)
- `getDefaultDateRange()` — called server-side to compute the fallback date range when no URL params are present

To change the default filter, update `DEFAULT_DATE_PRESET` in `lib/date-filter.ts`.

## Commands

```bash
npm run dev            # Dev server on :3000
npm run build          # Production build
npx prisma generate    # Regenerate Prisma client
npx prisma migrate dev # Run migrations
```
