# PRD — ali-sum: AliExpress Order Analytics Dashboard

**Version:** 1.0  
**Status:** Design Review Ready  
**Stack:** Next.js 16 (App Router) · Tailwind CSS v4 · shadcn/ui (base-ui) · Recharts v3 · PostgreSQL

---

## 1. Product Overview

### 1.1 What It Is
ali-sum is a **personal analytics dashboard** for AliExpress shoppers. A companion Chrome extension scrapes order data directly from aliexpress.com and syncs it to the dashboard, where users can track spending trends, top sellers, package statuses, and delivery timelines — all in one clean interface.

### 1.2 Problem Statement
AliExpress has no native analytics. Power shoppers who place dozens of orders per month have no visibility into:
- How much they've spent over time
- Which sellers they buy from most
- Which packages are in transit right now
- How their spending trends month-over-month

### 1.3 Target Users

**Primary Persona — The Frequent Buyer**
- Places 10–50 orders/month on AliExpress
- Mixes personal and small-business purchasing
- Cares about budget awareness and delivery tracking
- Uses desktop/laptop primarily; checks status on mobile

**Secondary Persona — The Small Reseller**
- Buys in bulk from 5–20 recurring sellers
- Needs seller-level spend breakdowns
- Wants fast access to tracking numbers

### 1.4 Core Value Proposition
> "See your entire AliExpress history in one dashboard — spending, sellers, and shipping — synced automatically."

---

## 2. Application Architecture (Designer Reference)

### 2.1 Routes & Pages

| Route | Type | Purpose |
|---|---|---|
| `/login` | Auth | Email + password sign in |
| `/register` | Auth | Account creation |
| `/` | Dashboard | Overview: summary cards, charts, recent orders |
| `/spending` | Dashboard | Spending trends over time (weekly/monthly/yearly) |
| `/sellers` | Dashboard | Top sellers by spend + full seller table |
| `/orders` | Dashboard | Paginated full order history with filters |
| `/shipping` | Dashboard | Package tracking, status distribution, delivery timeline |
| `/settings` | Dashboard | Account info, Chrome extension token, sync history |

### 2.2 Data Model (for designers)
Each **Order** has: date, seller name, total amount, currency, shipping status, tracking number, estimated delivery, and line items. Orders are synced by the Chrome extension; the dashboard only reads and visualizes.

### 2.3 Key Constraints
- **No Radix UI** — uses `@base-ui/react` (no `asChild` prop pattern)
- **Tailwind v4** — CSS variables in `oklch()` color space
- **Server Components** — most pages fetch server-side; charts are client components
- **shadcn/ui v4 (base-nova style)** — component palette is available
- **Recharts v3** — all data visualizations

---

## 4. Feature Specifications

### 4.1 Overview Page (`/`)

**Purpose:** At-a-glance spending snapshot for the selected date range.

**Components:**
- **Page header**: Title + description + date range filter (right-aligned)
- **Summary cards** (4-up grid): Total Spent, Total Orders, Avg Order Value, Items Purchased — each with colored icon
- **Charts** (2-col grid):
  - Spending Over Time (area chart, monthly by default)
  - Top Sellers (horizontal bar chart, top 5)
  - Shipping Status (donut chart)
- **Recent Orders** (table): Date, Order ID (linked), Seller, Items, Total — with "Load More"

**Date Filter Behavior:**
- Presets: This week · Last 7 days · This month · Last 30 days · Last 3 months · This year
- Custom date range inputs
- Persisted in `localStorage` across page navigations
- Default: "This month"

**Empty State:** When no orders synced — message with CTA to install Chrome extension.

---

### 4.2 Spending Page (`/spending`)

**Purpose:** Deep-dive into spending patterns with period granularity control.

**Components:**
- Page header + date range filter
- Period tabs: Weekly · Monthly · Yearly
- Summary mini-cards: Total Spent + Total Orders for selected range
- Large area chart (full-width): spending by selected period
- Loading skeleton when fetching

**Interaction:** Period tab change triggers API refetch; date filter change does the same.

---

### 4.3 Sellers Page (`/sellers`)

**Purpose:** Identify top sellers by lifetime spend.

**Components:**
- Horizontal bar chart: Top 10 sellers by total spend
- Full sellers table: Rank, Seller Name, Order Count, Total Spent

**Note:** No date filter on this page (lifetime view).

---

### 4.4 Orders Page (`/orders`)

**Purpose:** Browsable, filterable order history.

**Components:**
- Page header + date range filter
- Order count context line ("142 orders in range")
- Full-width table: Date, Order ID (external link), Seller, Items (with tooltip), Shipping Status (badge), Tracking Number + Carrier, Total
- Pagination (20 per page): page indicator + Previous/Next links

**Status Badges:** Inline colored labels — delivered (green), in transit (blue), pending (amber), other (gray).

---

### 4.5 Shipping Page (`/shipping`)

**Purpose:** Package tracking view grouped by shipment.

**Components:**
- Page header + date range filter
- **Clickable status cards** (4-up): In Transit, Delivered, Pending, Total — click to filter table below
- Charts (2-col): Status distribution donut + Delivery timeline bar chart (grouped by week)
- Status filter dropdown (above table)
- **Package table** (grouped by tracking number): expandable rows that reveal individual orders under a shared tracking number
- Pagination (25 per page)

**Interaction:** Clicking a status card sets URL `?status=` param and filters the table. Clicking again deselects.

---

### 4.6 Settings Page (`/settings`)

**Purpose:** Account management + Chrome extension connection.

**Components:**
- Account card: Email, Name, Member since
- Chrome Extension card: description + "Generate Token" button → copies JWT to clipboard
- Sync History card: last 10 syncs — timestamp, status badge (completed/failed/running), orders found / new counts, error message if failed

---

## 5. UX Requirements

### 5.1 Navigation
- Desktop sidebar might be collapsible
- Active nav item: filled primary (orange-red) background, white text
- Sidebar width: 240px
- User section pinned to bottom of sidebar with dropdown (Settings + Sign Out)

### 5.2 Date Range Filter
- Present on: Overview, Orders, Shipping (Spending has its own inline variant)
- Position: top-right of page header, right-aligned
- Must not wrap/overlap page title on 1280px+ viewports

### 5.3 Loading States
- Current: "Loading..." text placeholder in chart containers
- **Desired:** Skeleton loaders matching the card/chart dimensions for perceived performance

### 5.4 Empty States
- Currently: plain text centered in containers
- **Desired:** Icon + headline + descriptive text (+ CTA where actionable, e.g. "Install Chrome Extension")

### 5.5 Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| `< 768px` | Hamburger + overlay sidebar; single-column cards; horizontal scroll tables |
| `768px–1024px` | Desktop sidebar; 2-col summary cards; 1-col charts |
| `1024px+` | Desktop sidebar; 4-col summary cards; 2-col charts |

### 5.6 Accessibility
- All interactive elements keyboard-navigable
- Status badges: color + text (not color alone)
- Focus rings: match brand primary color
- External links: `target="_blank"` + `rel="noopener noreferrer"`
- Form inputs: explicit `<label>` associations via `htmlFor`/`id`

### 5.7 Interaction Patterns
- **Hover lift:** Status cards and clickable cards should translate up slightly (`-translate-y-px`) on hover
- **Transition speed:** 150ms for color/shadow transitions
- **No modals:** All interactions are inline or navigational
- **No client-side routing animations** currently (simple page transitions acceptable)

---

## 6. Visual Design Direction

### 6.1 Aesthetic
- **Clean analytics dashboard** — professional, data-forward
- **Warm brand identity** — orange-red primary references AliExpress without copying it
- **Information density:** medium — enough data visible to be useful; not cluttered
- **Dark mode primary**, light mode available via system preference

---

## 7. Additional features

| Gap | Current State | Ideal State |
|---|---|---|
| **Skeleton loading** | Text "Loading..." | Shimmer skeletons matching content shape |
| **Empty states** | Plain text | Icon + headline + CTA |
| **Order item detail** | Items count only | Expandable row showing item titles |
| **Sync status** | Settings page only | Subtle indicator when extension is syncing |
| **First-time flow** | No onboarding | 2-step: generate token → paste in extension |
| **Currency support** | Single primary currency | Multi-currency with conversion toggle |
| **Dark mode** | CSS variables defined, no toggle | System-preference auto + manual toggle |
| **Search/filter on orders** | Date range only | Full-text seller/item search |