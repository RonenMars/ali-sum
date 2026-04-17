# ali-sum — Design Brief

**Product:** ali-sum — AliExpress Order History Analytics
**Platform:** Web dashboard + Chrome Extension popup
**Date:** April 2026

---

## Executive Summary

A one-page orientation for designers coming in fast. Read this first; everything below expands on it.

**What you're designing:** A personal finance-adjacent analytics dashboard for a frequent AliExpress shopper. Not enterprise. Not a marketing site. A calm, trustworthy data tool — think Monarch Money or Linear, not Mixpanel or Datadog.

**What already exists:** A fully functional app with no distinct visual identity. Sidebar nav, stat cards, four chart types, a date filter, orders table, shipping page with collapsible package grouping, settings page, and a Chrome extension popup. The orange brand accent is established and committed. Dark mode is structurally wired. Typography has no hierarchy beyond size — that's the primary gap.

**Three non-negotiable design goals:**
1. **Trust at a glance** — numbers feel authoritative the moment the page loads
2. **Spending clarity in under three seconds** — the answer to "how much have I spent this month" must be immediate
3. **Package anxiety relief** — shipping feels like a calm status board, not a raw data dump

**Color system at a glance:**

| Role | Color | Used for |
|------|-------|----------|
| Brand accent | Warm orange | CTAs, active states, primary interactions only — never for data encoding |
| Delivered / Success | Green | Consistently everywhere |
| In Transit / Info | Blue | Consistently everywhere |
| Awaiting Delivery | Blue (lighter) | Consistently everywhere |
| Ready to Ship | Teal | Consistently everywhere |
| Pending / Processing | Amber | Consistently everywhere |
| Error | Red | Consistently everywhere |
| Running / Syncing | Animated blue | Consistently everywhere |

**Open questions — what's yours to resolve vs. what needs a decision first:**

| Question | Owner |
|----------|-------|
| Navigation order (should Shipping move up?) | **Stakeholder** — don't design around this until resolved |
| Global vs. per-page date filter | **Stakeholder** — affects every page |
| Mobile as a purpose-built surface vs. responsive adaptation | **Stakeholder** — determines scope |
| Extension popup: functional-only or mini-dashboard after sync? | **Stakeholder** |
| Dashboard density: high-density vs. editorial/scrollable | **Designer** — your call |
| Sellers page: keep both chart and table, or drop one? | **Designer** — your call |
| Personalized narrative insights ("you spent 40% more this month") | **Stakeholder** — out of scope unless confirmed |

---

## 1. What This Product Is

ali-sum is a personal analytics dashboard for AliExpress shoppers. A companion Chrome extension pulls in a user's order history automatically. From that point on, the dashboard gives them a living view of their spending habits, package statuses, and seller relationships — all in one place.

The product has two surfaces:

1. **Web dashboard** — the primary experience, desktop-first with mobile support
2. **Extension popup** — a lightweight companion for triggering syncs and checking status

The core value proposition is **clarity**: turning a noisy, hard-to-search order history into answers.

---

## 2. The Users

**Primary: The Frequent AliExpress Shopper**

Someone who orders regularly from AliExpress and is frustrated by its native UI — no spending summaries, scattered tracking, hard to search history. They want a clean personal-finance-adjacent view of their AliExpress activity, similar to how Mint or Copilot treats bank transactions. Comfortable with technology but not a developer.

**Key questions they ask daily:**
- How much have I spent this month / this year?
- Where is my package right now?
- Who are my most-bought-from sellers?
- Did my last sync pick up the new orders?

**Secondary: The Small Reseller**

Buys in bulk from a consistent set of sellers. Cares about seller-level spend breakdowns and fast access to tracking numbers. More analytical than the primary user.

---

## 3. What Exists Today

The app works end-to-end but uses a default, generic visual language. It's functional but has no distinct brand identity, no visual hierarchy that maps to user priorities, and inconsistent information density across pages.

What's already built:
- Sidebar navigation with six sections: Overview, Spending, Sellers, Orders, Shipping, Settings
- Summary stat cards (Total Spent, Order Count, Avg Order Value, Items Purchased)
- Charts: spending over time (area), top sellers (horizontal bar), shipping status (donut), delivery timeline (bar)
- Date range filter with preset options and custom date inputs
- Full orders table with pagination
- Shipping page with clickable status cards, package grouping by tracking number, and collapsible detail rows
- Settings page for account info and extension token management
- Chrome extension popup for sync trigger

The current palette uses a warm orange primary — committed, not up for debate. Dark mode is structurally supported. The typography is clean but undifferentiated — no hierarchy beyond size.

---

## 4. Design Philosophy

**Personal, not enterprise.** This is one person's data — it should feel warm and approachable, not like a B2B SaaS dashboard. Think Monarch Money or Copilot: clean, opinionated design with genuine attention to data density.

**Trust at a glance.** The first thing a user sees should communicate "your data is here, organized, and correct." Numbers need to feel authoritative. No ambiguity about what a figure represents.

**Progressive disclosure.** Surface summaries first, details on demand. The dashboard should not overwhelm; users drill in when they care.

**Package anxiety relief.** For active shoppers, "where is my stuff" is a daily question. The shipping section should feel like a calm, organized status board.

**Spending clarity above all.** The spending story — how much, over what period, to whom — is the most valuable insight. It should be answerable in under three seconds.

**Avoid:** generic startup dashboard aesthetics (gradient cards, decorative blobs, excessively rounded everything), heavy decoration that competes with data, dark-and-neon "war room" data visualization vibes.

---

## 5. Information Architecture

Six sections and their actual priority to users. The current nav order does not match this — see the Executive Summary for whether to reorder before designing.

| Priority | Section | What the user is asking |
|----------|----------|------------------------|
| 1 | **Overview** | Give me the snapshot — what's happening? |
| 2 | **Shipping** | Where are my packages? |
| 3 | **Spending** | How much am I spending and on what? |
| 4 | **Orders** | Let me find a specific order |
| 5 | **Sellers** | Who do I buy from most? |
| 6 | **Settings** | Connect extension, manage account |

---

## 6. Pages

### 6.1 Overview

**What it's for:** Quick orientation. Where am I, what's happening, any surprises?

**What it must show:**
- Four summary stat cards: Total Spent, Order Count, Average Order Value, Items Purchased
- A spending trend chart (the shape of spending over the selected period)
- A snapshot of top sellers — not the full list, just the top three to five
- A shipping status snapshot: how many packages in transit, delivered, pending
- Recent orders — a feed of the last several, not a full table
- Date range controls that govern all data on the page

**How it should feel:**
- The stat cards are the hero. Large numbers, immediately readable. Everything else is supporting context.
- Charts are secondary — they show patterns, not the primary answer.
- Recent orders should feel like a live feed: minimal, focused on what's new.
- The date filter controls everything on the page. Its position and affordance should be impossible to miss.
- Empty state (no synced orders yet) must clearly guide the user toward setting up the extension.

---

### 6.2 Spending

**What it's for:** A focused deep-dive into spending patterns over time.

**What it must show:**
- A large chart of spending, grouped by the selected period granularity
- Aggregate stats for the selected range: Total Spent and Order Count
- A period toggle: weekly / monthly / yearly
- Date range filter

**How it should feel:**
- This is a single-chart page. The chart should breathe and take up meaningful space — it is the whole point.
- The period toggle should feel natural and quick to switch — not buried in a dropdown.
- Tooltips should show formatted currency and the exact period being hovered.

---

### 6.3 Sellers

**What it's for:** Understanding seller relationships — who gets the most business.

**What it must show:**
- A ranked visual comparison of top sellers by total spend
- A full list with order count and total spent per seller

**How it should feel:**
- Seller names can be long. The chart needs room for them — handle truncation gracefully with tooltips for full names.
- The visual and the table show the same data. They should feel complementary — the chart for visual comparison, the table for exact numbers. Whether both earn their space is a designer decision (see Executive Summary).
- Linking seller names to their AliExpress storefronts would be high value.

---

### 6.4 Orders

**What it's for:** Browse and find specific orders. The full, filterable history.

**What it must show:**
- Date range filter
- A paginated table: Date, Order ID (linked back to AliExpress), Seller, Item Count, Status, Tracking Number, Total
- Page navigation

**How it should feel:**
- The Order ID link should be obvious but not visually dominant.
- Status badges use the same color vocabulary as everywhere else in the app.
- Tracking numbers are long and technical — they should be visually distinct from surrounding text and easy to copy.
- Relative dates ("3 days ago") with absolute date on hover reduce cognitive load for recent orders.

---

### 6.5 Shipping

**What it's for:** Package tracking center. Likely the most-visited page for active shoppers.

**What it must show:**
- Status summary cards at the top: In Transit, Delivered, Pending/Processing, Total — each clickable to filter the table below
- A status distribution chart and a delivery timeline chart
- A package table grouped by tracking number, with collapsible rows that expand to show individual orders sharing that shipment

**How it should feel:**
- This is the most complex page. Interactions must be crystal clear.
- The status cards serve double duty: summary *and* filter. Their active/selected state must be unambiguous. Clicking again deselects.
- The package grouping is a key differentiator. One shipment can contain multiple orders. The collapsed state should be easy to scan; expanding should feel natural.
- For in-transit packages, estimated delivery dates are the highest-anxiety piece of information — they should be prominent.
- Status colors must be consistent everywhere (see color system in Executive Summary).
- An empty filter state (no packages match the selected status) needs a friendly, clear message — not a blank void.

---

### 6.6 Settings

**What it's for:** Account management and connecting the Chrome extension.

**What it must show:**
- Account info: email, display name, member since
- Extension connection: a generate-token action that produces a copyable token, with clear step-by-step instructions
- Sync history: recent syncs with timestamp, status, orders found, new orders added, and any errors

**How it should feel:**
- The extension connection flow is a critical path for new users. It must be dead simple — a clear sequence of steps, not a wall of text.
- Copying the token should have a clear success moment: a brief visual confirmation.
- Sync history helps users debug ("did my sync work?") — success and failure states need to be immediately readable.
- This page doesn't need to be visually interesting. Calm and utilitarian is exactly right.

---

## 7. Component Intentions

### Stat Cards

The stat card's job is to deliver a number with authority. The number is the focal point. The label identifies what it is. An optional trend indicator (up/down with delta) gives context. An icon can aid scanning but must never compete with the number.

### Charts

All charts share a consistent visual language: the same color vocabulary, formatted tooltips, graceful empty states, and skeleton loaders that match each chart's shape.

- **Spending (area/line):** Subtle gradient fill under the line, clear zero reference, muted axis labels. Calm and readable, not dramatic.
- **Top Sellers (horizontal bar):** Bar length for comparison; value at the end for precision. Seller name left-aligned.
- **Status Distribution (donut):** Center text shows the total. Legend makes each segment identifiable without relying on color alone.
- **Delivery Timeline (bar):** Readable even when many weeks are shown. Tooltip surfaces the exact week range and count.

### Tables

Tables are the detail layer. Easy to scan: sticky header, subtle row differentiation, clear column alignment. Rows that are interactive need a clear affordance. Empty and loading states need intentional design — not just blank space.

### Date Range Filter

Preset options: This week, Last 7 days, This month, Last 30 days, Last 3 months, This year. Plus a custom from/to input. The active preset should look clearly selected — filled, not just underlined. The default is "This month." On mobile it should collapse into a compact control.

### Status Badges

Used across Orders, Shipping, and Sync History. Always use both color and text — never color alone.

| Status | Color |
|--------|-------|
| Delivered | Green |
| In Transit | Blue |
| Awaiting Delivery | Blue (lighter) |
| Ready to Ship | Teal |
| Pending / Processing | Amber |
| Error | Red |
| Success | Green |
| Running / Syncing | Animated blue |

### Sidebar Navigation

Fixed on desktop. Slide-in drawer on mobile. The active item has a filled background — not just a dot or underline. Icon and label are always visible together. User identity pinned to the bottom. Brand mark at the top.

---

## 8. Visual Direction

### Personality

**Keywords:** Personal, trustworthy, data-rich but approachable, calm, efficient.

This should feel like a well-organized personal finance tool — not a toy, not an enterprise dashboard. Reference points: Monarch Money (warm, personal, data-dense), Copilot (opinionated, clean), Linear (tight typography, purposeful hierarchy).

**Avoid:**
- Generic "startup dashboard" aesthetics — gradient cards, decorative blobs, excessively rounded everything
- Heavy decoration that competes with data
- The dark-and-neon "data visualization" look — this is a personal tool, not a war room

### Color

The warm orange primary is the established brand accent. Build the full palette around it with intention:

- **Brand accent (orange):** Reserved for primary interactions, active states, and CTAs. Not for encoding data in charts — that creates confusion when the same color means both "my brand" and "this data category."
- **Semantic colors:** See the color system in the Executive Summary. These are non-negotiable and must be consistent everywhere they appear — card, chart, badge, filter pill.
- **Surface hierarchy:** Three distinct levels — background, card, elevated card.
- **Text hierarchy:** Three distinct weights — primary, secondary, muted.

Dark mode is a first-class variant, not an afterthought inversion of light mode.

### Typography

Numbers — especially currency amounts — need to feel authoritative. This means numerals that align vertically in tables and don't shift width between values (use tabular figures). Tracking numbers and order IDs should visually read as technical strings, distinct from surrounding prose. At least three text weights are needed for meaningful hierarchy.

### Spacing and Layout

Cards should breathe — generous internal padding. Charts should never feel cramped against card edges. Table rows need enough height for comfortable scanning without feeling padded for its own sake. Content centered with a maximum width on wide screens — not edge-to-edge.

### Motion

Minimal and purposeful:
- Page transitions: none, or nearly none — this is a data tool, not a marketing site
- Chart entrance animations: subtle, on initial load only — not on every filter change
- Loading states: skeleton loaders shaped like the content they replace
- Collapsible rows: smooth, quick accordion
- Copy-to-clipboard: brief visual confirmation, then rest
- Every animation should feel like the UI breathing, not performing
- All animations respect `prefers-reduced-motion`

---

## 9. Responsive Behavior

**Mobile:** Sidebar hidden behind a hamburger. Single-column stat cards. Charts simplified or horizontally scrollable. Tables show only the most essential columns. The date filter collapses into a single control.

**Tablet:** Two-column stat cards. Sidebar present but may collapse to a narrower form.

**Desktop:** Full sidebar, four-column stat cards, two-column chart grid.

**Wide desktop:** Content centered with a maximum width — not edge-to-edge.

Note: whether mobile gets a purpose-built layout optimized for "where are my packages?" is a stakeholder decision (see Executive Summary). Until resolved, design for responsive adaptation of the desktop experience.

---

## 10. Chrome Extension Popup

The popup is a compact, single-purpose surface. No navigation. Its job is to trigger syncs, show progress, and confirm results. Same visual language and color meaning as the web app.

**The five states it must handle:**

1. **Not connected** — prompt to enter an API token with clear instructions and a link to the Settings page on the dashboard
2. **Connected, idle** — when the last sync happened and how many orders it found; a prominent "Sync Now" button
3. **Syncing** — live progress, with a cancel option
4. **Sync complete** — brief success summary (orders found, new orders) and a prominent link to the dashboard
5. **Sync error** — a clear, human-readable message and a retry option

---

## 11. Empty, Loading, and Error States

Every data surface needs explicit design for all three states. These are not edge cases — they are critical moments in the experience.

### Empty states

- **New user, no synced data** — the most important empty state. Must not feel like a broken page. Should read as an invitation: "Your dashboard is ready. Here's how to fill it." Guide the user toward the next step with a clear CTA.
- **Filter returns no results** — friendly, specific message ("No orders in this date range") with an option to clear the filter.
- **No packages match the selected status** — same principle: clear, friendly, actionable.

### Loading states

Skeleton loaders that match the shape and proportions of the content they replace. Charts get a skeleton at the correct aspect ratio. Stat cards get a placeholder where the number will appear. Tables get skeleton rows. No generic spinners.

### Error states

Meaningful messages. Retry button where applicable. Never expose technical details or raw errors to the user.

---

## 12. First-Time Onboarding

A new user who registers and visits the dashboard currently sees an empty UI with no guidance. This is a critical gap.

**The intended sequence:**

1. Register → land on the dashboard
2. Dashboard shows an intentional empty state: "Your dashboard is empty. Connect the Chrome extension to import your AliExpress orders." → CTA leads to Settings
3. Settings walks the user through the connection: generate a token → copy it → paste it into the extension → trigger a sync
4. After the first sync completes, the dashboard populates automatically

Consider a persistent "Get started" banner or progress checklist that stays visible until the first sync is complete.

---

## 13. Accessibility

- All interactive elements keyboard-navigable with visible focus indicators
- Color is never the only signal — all badges use text labels alongside color
- Charts have text alternatives accessible to screen readers
- Form labels always visible — no placeholder-only labels
- Loading and error states announced to screen readers
- Animations respect `prefers-reduced-motion`

---

*This brief is a starting point, not a cage. Challenge any assumption — especially around information architecture and layout — if there's a better experience to be found. Unresolved stakeholder questions are flagged in the Executive Summary; resolve those before committing to layouts that depend on them.*
