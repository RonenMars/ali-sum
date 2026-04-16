# ali-sum

AliExpress order history analytics — web dashboard + Chrome extension.

## Architecture

Monorepo with npm workspaces:

- `apps/web/` — Next.js 16 (App Router), Tailwind v4, shadcn/ui (base-ui, not radix)
- `apps/extension/` — Chrome Manifest V3, bundled with esbuild

## Tech Stack

- **Framework:** Next.js 16.2 with App Router
- **UI:** Tailwind CSS v4 + shadcn/ui v4 (uses `@base-ui/react`, NOT radix — no `asChild` prop)
- **DB:** PostgreSQL + Prisma v7 (requires driver adapter `@prisma/adapter-pg` — `new PrismaClient({ adapter })`)
- **Auth:** NextAuth v5 beta with Credentials provider, JWT sessions
- **Charts:** Recharts v3
- **Extension:** esbuild bundling, vanilla TS popup (no React)

## Key Patterns

### Prisma v7

Prisma client is generated to `lib/generated/prisma/`. Import from `@/lib/generated/prisma/client` (no index file). Always use the singleton from `@/lib/prisma.ts` — it switches adapters at runtime: `PrismaPg` for PostgreSQL (production), `BetterSqlite3` when `DATABASE_URL` starts with `file:` (E2E tests).

### Auth

Two auth flows: web sessions (NextAuth cookie) and extension API calls (Bearer JWT). Both handled by `lib/api-auth.ts` → `getAuthUserId(req)`. Extension tokens are long-lived JWTs issued at `/api/auth/extension-token`.

### Dashboard Pages

Route groups: `(auth)/` for login/register, `(dashboard)/` for authenticated pages. Dashboard layout in `(dashboard)/layout.tsx` checks session and redirects to `/login`. Dashboard pages use Server Components fetching via Prisma directly. Charts are client components.

### Date Filter

All dashboard pages share a date-range filter. The single source of truth is `apps/web/lib/date-filter.ts`, which exports `DATE_PRESETS`, `DEFAULT_DATE_PRESET` (currently `"This month"`), `DATE_FILTER_STORAGE_KEY`, and `getDefaultDateRange()`. Do not duplicate preset arrays in page components — import from this file. `getDefaultDateRange()` is used server-side in `app/(dashboard)/page.tsx` as the fallback when no URL params are present.

### Extension ↔ Backend Communication

Extension stores API token in `chrome.storage.local`. Content script on `aliexpress.com/p/order/*` scrapes DOM. Service worker orchestrates pagination and POSTs to `/api/orders/sync`. Orders are upserted by `(userId, aliOrderId)` unique constraint.

## Commands

```bash
# Web app
npm -w apps/web run dev          # Dev server on :3000
npm -w apps/web run build        # Production build
npm -w apps/web run test:e2e     # Playwright E2E tests (SQLite, no Postgres needed)
npx prisma generate              # Regenerate Prisma client (run from apps/web/)
npx prisma migrate dev           # Run migrations (run from apps/web/)

# Extension
npm -w apps/extension run build  # Build to dist/
npm -w apps/extension run watch  # Watch mode
```

## Environment Variables (apps/web/.env)

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — NextAuth secret for JWT signing
- `AUTH_URL` — Base URL (http://localhost:3000 in dev)

## Content Script

`apps/extension/content/scraper.ts` scrapes order list pages. Selectors were verified against `aliexpress.com/p/order/index.html` — re-verify in DevTools if AliExpress ships a UI update.

Tracking is scraped via `scrapeTracking()` using three fallback strategies:
1. `.order-item-content-opt-logistics` / `[class*='logistics']` text — regex extracts the tracking number
2. `<a href*='track'>` / `<a href*='logistic'>` — parses `trackId`, `logisticsNo`, or `tracking` query params
3. `data-tracking` / `data-logistics-no` attributes on the order element

`ScrapedOrder` in `apps/extension/lib/types.ts` defines the full data shape including optional `trackingNumber`, `carrier`, and `estimatedDelivery`.

### Sync upsert behaviour

`/api/orders/sync` creates new orders and updates existing ones in a single Prisma `$transaction`. Fields updated on re-sync: `status`, `trackingNumber`, `carrier`, `estimatedDelivery` (only when present in the scraped payload).
