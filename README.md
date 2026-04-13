# ali-sum

A web app + Chrome extension that scans your AliExpress order history and displays expense analytics.

## Overview

ali-sum connects to your AliExpress account via a Chrome extension, syncs your order history to a database, and provides a dashboard with spending analytics — totals, breakdowns by time period and seller, and visual charts.

Inspired by [ali-t](https://github.com/RonenMars/ali-t).

## How It Works

1. **Register** on the web app and generate an API token
2. **Install** the Chrome extension and paste your token
3. **Navigate** to your AliExpress order history page
4. **Click Sync** in the extension popup — it scrapes your orders and sends them to the backend
5. **View analytics** on the dashboard

## Features

- Chrome extension syncs AliExpress order history automatically
- Summary cards: total spent, order count, average order value, items purchased
- Spending over time (weekly / monthly / yearly) with area charts
- Top sellers breakdown with bar charts
- Paginated order history table with status badges
- Sync history tracking
- Multi-user support with JWT authentication

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS v4 + shadcn/ui |
| Backend | Next.js API routes |
| Database | PostgreSQL + Prisma v7 |
| Auth | NextAuth.js v5 (credentials + JWT) |
| Charts | Recharts |
| Extension | Chrome Manifest V3 + esbuild |

## Project Structure

```
ali-sum/
├── apps/
│   ├── web/                    # Next.js dashboard + API
│   │   ├── app/
│   │   │   ├── (auth)/         # Login & register pages
│   │   │   ├── (dashboard)/    # Overview, spending, sellers, orders, settings
│   │   │   └── api/            # Auth, orders sync, analytics endpoints
│   │   ├── components/
│   │   │   ├── charts/         # SpendingChart, SellersChart, SummaryCards
│   │   │   ├── dashboard/      # DashboardShell, ExtensionTokenButton
│   │   │   └── ui/             # shadcn/ui components
│   │   ├── lib/                # Prisma client, auth config, API auth middleware
│   │   └── prisma/             # Schema & migrations
│   └── extension/              # Chrome extension
│       ├── popup/              # Extension popup UI
│       ├── content/            # AliExpress order page scraper
│       ├── background/         # Service worker (sync orchestration)
│       └── lib/                # API client, shared types
└── package.json                # npm workspaces root
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted, e.g. [Neon](https://neon.tech))

### Web App

```bash
# Install dependencies (from repo root)
npm install

# Configure environment
cd apps/web
cp .env .env.local
# Edit .env.local with your DATABASE_URL and a random AUTH_SECRET

# Set up database
npx prisma migrate dev

# Start dev server
npm run dev
```

The app runs at `http://localhost:3000`.

### Chrome Extension

```bash
cd apps/extension
npm install
npm run build
```

Load in Chrome:
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `apps/extension/` directory

### Connecting the Extension

1. Register/login at `http://localhost:3000`
2. Go to Settings → Generate Token
3. Copy the token
4. Open the extension popup → Connect Account
5. Navigate to your [AliExpress order page](https://www.aliexpress.com/p/order/index.html)
6. Click "Sync Now"

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

## Status

MVP scaffold is complete. The content script DOM selectors (`apps/extension/content/scraper.ts`) need to be implemented by inspecting live AliExpress order pages.

## License

MIT
