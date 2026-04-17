# ali-sum — Product Brief

**Product:** AliExpress Order History Analytics  
**Platform:** Web Dashboard + Chrome Extension

---

## What It Is

ali-sum is a personal analytics dashboard for AliExpress shoppers. A companion Chrome extension scrapes order data directly from AliExpress and syncs it to the dashboard, where users can track spending trends, top sellers, package statuses, and delivery timelines — all in one place.

The core value is **clarity**: turning a noisy order history into actionable insights.

---

## Who It's For

**The Frequent AliExpress Shopper**

Someone who orders regularly from AliExpress and is frustrated by its native UI — no spending summaries, scattered tracking, hard to search history. They want a clean personal-finance-adjacent view of their AliExpress activity, similar to how Mint or Copilot treats bank transactions.

**Key questions they ask daily:**
- How much have I spent this month / this year?
- Where is my package right now?
- Who are my most-bought-from sellers?
- Did my last sync pick up the new orders?

---

## Design Philosophy

**Personal, not enterprise.** This is one person's data — it should feel warm and approachable, not like a B2B SaaS dashboard. Think Monarch Money or Copilot: clean, opinionated design with genuine attention to data density.

**Trust at a glance.** The first thing a user sees should communicate "your data is here, organized, and correct." Numbers need to feel authoritative. No ambiguity about what a figure represents.

**Progressive disclosure.** Surface summaries first, details on demand. The dashboard should not overwhelm; users drill in when they care.

**Package anxiety relief.** For active shoppers, "where is my stuff" is a daily question. The shipping section should feel like a calm, organized status board.

**Spending clarity above all.** The spending story — how much, over what period, to whom — is the most valuable insight. It should be answerable in under three seconds.

Avoid: generic startup dashboard aesthetics, heavy decoration that competes with data, dark-and-neon "war room" data visualization vibes.

---

## Information Architecture

Six sections, in order of how often users actually visit them:

| Section | Core User Question |
|---------|-------------------|
| **Overview** | Give me the snapshot — what's happening? |
| **Shipping** | Where are my packages? |
| **Spending** | How much am I spending and on what? |
| **Orders** | Let me find a specific order |
| **Sellers** | Who do I buy from most? |
| **Settings** | Connect extension, manage account |

> Note: The current nav order (Overview, Spending, Sellers, Orders, Shipping, Settings) doesn't match usage priority. Shipping is likely the most-visited page for active shoppers and deserves higher placement.

---

## Pages

### Overview

**Purpose:** Quick orientation — where am I, what's happening, any surprises?

The page centers on four headline numbers: total spent, order count, average order value, and items purchased. These are the hero — visually dominant, the first thing eyes land on. Charts (spending trend, top sellers, shipping snapshot) provide supporting context, not the main event. A recent orders feed rounds out the page, showing the last handful of orders like a live feed rather than a formal table.

A date range filter controls the scope of all data on the page. Its position and affordance should be unmissable.

Empty state (no synced orders) is a critical first impression — it should clearly guide the user toward the extension setup, not feel like an error.

---

### Spending

**Purpose:** Deep dive into spending patterns over time.

A single focused page built around one large chart. The user can switch between weekly, monthly, and yearly granularity with a simple toggle. Two supporting numbers — total spent and order count for the selected range — give context to the chart. The page should breathe; the chart is the star.

---

### Sellers

**Purpose:** Understand seller relationships — who gets the most business.

A horizontal bar chart ranks the top sellers by spend. A full table shows the complete list with exact figures. Both show the same data but serve different purposes: the chart enables visual comparison, the table enables precise lookup. They should feel complementary, not redundant.

Seller names can be long — the chart design must handle truncation gracefully, with tooltips for full names.

---

### Orders

**Purpose:** Browse and find specific orders; full history.

A paginated table of every order. The date column could show relative time ("3 days ago") with the absolute date on hover — this reduces cognitive load for recent orders. Status is communicated visually with a badge. Tracking numbers are technical and long — they deserve a distinct visual treatment that signals "you can copy this."

The most important affordance on each row is the link back to AliExpress — it should be obvious but not visually dominant.

---

### Shipping

**Purpose:** Package tracking center — what's in transit, what arrived, what's pending.

This is the most complex page and likely the most visited. It has three layers:

1. **Summary cards** at the top showing counts by status (In Transit, Delivered, Pending, Total). These are interactive — clicking a card filters the table below. Their active/selected state must be crystal clear.

2. **Charts** showing status distribution and delivery timeline by week, for a bird's-eye view of what's coming when.

3. **Package table** grouped by tracking number. A single shipment can contain multiple orders — the collapsible grouping is a key differentiator. In its collapsed state, it should be easy to scan. In its expanded state, it reveals individual orders under that shipment.

Status color vocabulary must be consistent across the entire app — the same color for "in transit" appears on the card, the chart, the badge, and the filter pill.

Estimated delivery dates should be prominent for in-transit packages. That's the highest-anxiety information on the page.

---

### Settings

**Purpose:** Account management and Chrome extension connection.

Three sections: account info, extension connection, and sync history.

The extension connection flow is a critical path for new users. It must be dead simple: generate a token, copy it, paste it into the extension. The copy interaction should have clear success feedback.

Sync history answers the question "did my sync work?" — the last ten syncs with timestamps and status. Color-coded: success is reassuring, error is clear, running is animated.

This page does not need to be visually complex. Calm and utilitarian is appropriate.

---

## Components

### Summary Cards

The focal point is a large primary number — currency amount or count. A label provides context. An optional trend indicator (up/down with delta) adds temporal meaning. Four-up on desktop, two-up on tablet, single column on mobile.

### Charts

All charts share consistent status color vocabulary, formatted tooltips with currency and date context, graceful empty states, and loading skeletons that match the chart shape.

- **Spending (area/line):** Subtle gradient fill, clear zero line
- **Sellers (horizontal bar):** Value label at end of bar, seller name left-aligned
- **Status distribution (donut):** Center text showing total, legend with labels and counts
- **Delivery timeline (bar):** Week labels readable even when many weeks are shown

### Tables

Sticky header on scroll. Empty state uses an illustration and instructional copy, not just "no data." Loading states use skeleton rows that match the real row height. Row interactions (like expanding a shipment) have a clear affordance.

### Date Range Filter

Preset time periods (this week, last 7 days, this month, last 30 days, last 3 months, this year) plus custom date inputs. The active preset should be clearly selected, not just underlined. This filter appears on Overview, Orders, and Shipping — Spending has its own inline period toggle.

### Status Badges

A consistent badge vocabulary used across Orders, Shipping, and Sync History:

| Status | Meaning |
|--------|---------|
| Delivered | Arrived |
| In Transit | On its way |
| Pending / Processing | Not yet shipped |
| Awaiting Delivery | Last-mile handoff |
| Ready to Ship | Picked up, not yet moving |
| Error | Sync or data failure |
| Running | In progress (animated) |

Color is always paired with a text label — never color alone.

### Navigation

Fixed sidebar on desktop. Slide-in drawer on mobile with backdrop overlay. Active item gets a filled/highlighted background, not just a colored line indicator. User identity lives at the bottom with a sign-out affordance. The brand mark sits at the top.

---

## Chrome Extension Popup

A separate surface with a single purpose: trigger syncs and monitor status. No navigation, no sidebar — just focused utility.

**Five states:**

1. **Not connected** — Prompt to enter the API token with clear instructions and a link to the Settings page
2. **Connected, idle** — Last sync time, order count from last sync, and a "Sync Now" button
3. **Syncing** — Progress indicator showing current page and total, with a cancel option
4. **Sync complete** — Summary of how many orders were found and how many were new, with a prominent "View Dashboard" link
5. **Error** — Clear error message with a retry option

The popup is used while the user is actively on AliExpress. They want to start a sync and see it succeed. The design should be glanceable, not studied.

---

## Empty & Loading States

Every data surface needs explicit design for three conditions:

**Empty (no data)**

The most important empty state is the new user who hasn't synced yet. This should not feel like an error — it's an onboarding moment. The UI should clearly guide the user toward the action that fills the app with data: install extension → connect token → sync. An illustrated empty state with a clear call to action works well here.

Filter-induced empty states ("no orders in this date range") need a friendly message and an easy way to clear the filter.

**Loading**

Skeleton loaders that match the shape of the content they replace. Charts show a loading skeleton at the correct aspect ratio. Stat cards show a placeholder where the number will appear. Tables show skeleton rows.

**Error**

A meaningful message, not "something went wrong." A retry button where applicable. Never raw error output.

---

## Onboarding

The first-time experience is underdeveloped. A new user who signs up sees an empty UI with no guidance. The ideal flow:

1. Register → land on the dashboard
2. Dashboard (empty state) → "Your dashboard is empty. Connect the Chrome extension to import your AliExpress orders." → CTA to Settings
3. Settings → step-by-step extension connection: install → copy token → paste in extension → sync
4. Post-sync → dashboard populates automatically

Consider a persistent "get started" banner or checklist on the dashboard until the first sync is complete.

---

## Responsive Behavior

**Mobile:** Single-column layout, charts that reflow or scroll horizontally, a collapsed filter that expands on tap. The primary mobile question is "where are my packages?" — consider whether mobile gets a purpose-built layout optimized for that, rather than a compressed version of the desktop dashboard.

**Tablet:** Two-column stat cards, sidebar may collapse.

**Desktop:** Full sidebar, four-column stat cards, side-by-side charts.

**Wide:** Content centered with a max width — not edge-to-edge.

---

## Interaction Principles

- Page transitions: minimal — this is a data tool, not a marketing site
- Chart animations: subtle entrance on initial load only, not on every filter change
- Hover, focus, and active states must all be visually distinct from each other
- Copy-to-clipboard: brief success state with visual confirmation
- Collapsible rows: smooth, quick accordion

---

## Open Questions

1. **Nav order:** Should nav priority match user behavior (Shipping near the top) rather than conceptual hierarchy (Overview first)?

2. **Dashboard density:** Should the overview be high-density (everything at a glance) or editorial (one focal insight at a time, scrollable)?

3. **Sellers chart vs. table:** Both show the same data. Is the chart earning its space, or should one be removed?

4. **Global date filter:** Currently per-page. Would a global date context — always visible, always in sync — work better for a "reporting" mental model?

5. **Personalized insights:** Could the dashboard surface narrative insights ("You've spent 40% more this month than last month") as a separate design pattern from raw numbers?

6. **Extension popup depth:** Should the popup show a mini-dashboard preview after sync, or stay purely functional?

7. **Mobile priority:** Should mobile get a purpose-built layout for "where are my packages?" rather than a responsive adaptation of the desktop?

---

*This brief is a starting point, not a constraint. Challenge any assumption here — especially around information architecture and layout — if there's a better experience to be found.*
