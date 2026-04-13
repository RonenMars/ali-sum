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

## Running Locally

### Quick start

```bash
./setup.sh
```

The script handles Steps 1–7 automatically (deps, env, DB migration, extension build) and prints instructions for the remaining manual steps.

---

### Manual setup

#### Prerequisites

- Node.js 18+
- A PostgreSQL database — [Neon](https://neon.tech) is recommended (free tier works)

#### 1. Install dependencies

```bash
# From the repo root
npm install
```

### 2. Configure environment

```bash
cp apps/web/.env.example apps/web/.env
```

Edit `apps/web/.env`:

```env
DATABASE_URL="postgresql://..."   # your Neon or local Postgres connection string
AUTH_SECRET="..."                 # random string, e.g. output of: openssl rand -base64 32
AUTH_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
cd apps/web
npx prisma migrate dev
```

### 4. Start the web app

```bash
# From repo root
npm -w apps/web run dev
```

Open `http://localhost:3000`.

### 5. Create an account

Go to `http://localhost:3000/register` and sign up.

### 6. Get your extension token

After logging in, go to **Settings** → **Generate Token** and copy the token.

### 7. Build the Chrome extension

```bash
npm -w apps/extension run build
```

Output goes to `apps/extension/dist/`.

### 8. Load the extension in Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `apps/extension` folder

### 9. Connect the extension

Click the ali-sum icon in Chrome, paste your token from Step 6, and click **Connect**.

### 10. Sync your orders

1. Navigate to `https://www.aliexpress.com/p/order/index.html` (must be logged in to AliExpress)
2. Click the extension icon → **Sync Now**
3. Orders are scraped and sent to `localhost:3000/api/orders/sync`

### 11. View analytics

Go back to `http://localhost:3000` — the dashboard shows spending summaries, charts, and order history.

---

**Tip:** Run `npm -w apps/extension run watch` while developing the extension for automatic rebuilds. After each rebuild, click the refresh icon on `chrome://extensions`.

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

MVP is complete and functional. The content script (`apps/extension/content/scraper.ts`) uses DOM selectors verified against the current AliExpress order page. AliExpress ships frequent UI changes — if scraping breaks, open DevTools on the order page and re-check the selectors listed in that file.

## License

MIT
