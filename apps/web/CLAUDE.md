@AGENTS.md

# ali-sum web

Next.js 16 App Router dashboard + API backend.

## Tech Stack

- **Framework:** Next.js 16.2 with App Router
- **UI:** Tailwind CSS v4 + shadcn/ui v4 (uses `@base-ui/react`, NOT radix — no `asChild` prop)
- **DB:** PostgreSQL + Prisma v7 (requires driver adapter `@prisma/adapter-pg`)
- **Auth:** NextAuth v5 beta with Credentials provider, JWT sessions
- **Charts:** Recharts v3

## Key Patterns

### Prisma v7

Prisma client is generated to `lib/generated/prisma/`. Import from `@/lib/generated/prisma/client` (no index file). Always use the singleton from `@/lib/prisma.ts` — it switches adapters at runtime: `PrismaPg` for PostgreSQL (production), `BetterSqlite3` when `DATABASE_URL` starts with `file:` (E2E tests).

### Auth

Two auth flows: web sessions (NextAuth cookie) and extension API calls (Bearer JWT). Both handled by `lib/api-auth.ts` → `getAuthUserId(req)`. Extension tokens are long-lived JWTs issued at `/api/auth/extension-token`.

### Dashboard Pages

Route groups: `(auth)/` for login/register, `(dashboard)/` for authenticated pages. Dashboard layout in `(dashboard)/layout.tsx` checks session and redirects to `/login`. Dashboard pages use Server Components fetching via Prisma directly. Charts are client components.

### Orders Sync

Extension POSTs scraped orders to `/api/orders/sync`. Orders are upserted by `(userId, aliOrderId)` unique constraint.

## Commands

```bash
npm run dev            # Dev server on :3000
npm run build          # Production build
npm run test:e2e       # Playwright E2E tests (SQLite, no Postgres needed)
npx prisma generate    # Regenerate Prisma client
npx prisma migrate dev # Run migrations
```

## Environment Variables (.env)

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — NextAuth secret for JWT signing
- `AUTH_URL` — Base URL (http://localhost:3000 in dev)
