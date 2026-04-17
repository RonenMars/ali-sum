# ali-sum — Design Brief

**For:** Professional UI/UX Designer  
**Product:** ali-sum — AliExpress Order History Analytics  
**Platform:** Web (responsive) + Chrome Extension popup  
**Date:** April 2026

---

## 1. Product Overview

ali-sum is a personal analytics dashboard that connects to a user's AliExpress order history via a Chrome extension. After a one-time sync, users get a living view of their spending habits, package tracking, and seller relationships — all in one place.

The product has two surfaces:

1. **Web App** — The primary analytics dashboard (Next.js, desktop-first with mobile support)
2. **Chrome Extension Popup** — A lightweight companion for triggering syncs and monitoring status

The core value proposition is **clarity**: turning a noisy order history into actionable insights (how much am I spending, on what, from whom, and where are my packages right now).

---

## 2. Target Users

**Primary User: The Frequent AliExpress Shopper**

- Orders regularly from AliExpress (10–200+ orders per year)
- Frustrated by AliExpress's own UI — hard to search history, no spending summaries, tracking is scattered
- Wants a clean personal finance-adjacent view of their AliExpress activity
- Tech-comfortable enough to install a Chrome extension and connect it to a web app
- Not a developer, but not afraid of tools

**Mental Model:** Similar to how Mint or Copilot treats bank transactions — I want someone to categorize, visualize, and surface patterns from my raw order data without me having to think about it.

**Key Jobs to Be Done:**
- "How much have I spent on AliExpress this month / year?"
- "Where is my package right now?"
- "Who are my most-bought-from sellers?"
- "Did my last sync pick up the new orders?"

---

## 3. Current State

The app currently works end-to-end but uses a default shadcn/Tailwind visual language — functional, but generic. There is no distinct brand identity, no visual hierarchy that maps to user priorities, and the information density is inconsistent across pages.

**What exists today:**
- Sidebar navigation with 6 sections: Overview, Spending, Sellers, Orders, Shipping, Settings
- Summary stat cards (Total Spent, Order Count, Avg Order Value, Items Purchased)
- Charts: Area (spending over time), Horizontal Bar (top sellers), Donut (shipping status distribution), Bar (delivery timeline)
- Date range filter with preset pills and custom date inputs
- Orders table with pagination
- Shipping page with clickable status cards, package grouping by tracking number, and collapsible detail rows
- Settings page for account info and extension token management
- Chrome extension popup for sync trigger

**Color palette (current):** Orange-on-white primary, OKLCH color space, dark mode supported. Chart accents: blue, green, purple, yellow.

**Typography (current):** Geist Sans + Geist Mono. Clean but unstyled beyond size scale.

---

## 4. Design Goals

### 4.1 Primary Goals

1. **Trust at a glance.** The first thing a user sees should communicate "your data is here, organized, and correct." Numbers need to feel authoritative — precise typography, clear labels, no ambiguity about what a figure represents.

2. **Spending clarity above all.** The spending story (how much, over what period, to whom) is the most valuable insight. The design should make it effortless to answer "how much have I spent this month" in under 3 seconds.

3. **Package anxiety relief.** For active shoppers, "where is my stuff" is a daily question. The shipping section should feel like a status board — calm, organized, and reassuring.

4. **Progressive disclosure.** Surface summaries first, details on demand. The dashboard should not overwhelm; users drill in when they care.

### 4.2 Secondary Goals

- Feel personal, not enterprise. This is a tool for one person's data — it should feel warm and approachable, not like a B2B SaaS dashboard.
- Support dark mode gracefully. Many users will use this at night.
- Handle empty and loading states with care — a new user with zero synced orders is a critical first impression.
- Mobile-friendly, even if not mobile-first. The sidebar collapses; pages should be readable on a phone.

---

## 5. Information Architecture

The six top-level sections and their priority order:

| Priority | Section | Core User Question |
|----------|----------|-------------------|
| 1 | **Overview** | Give me the snapshot — what's happening? |
| 2 | **Shipping** | Where are my packages? |
| 3 | **Spending** | How much am I spending and on what? |
| 4 | **Orders** | Let me find a specific order |
| 5 | **Sellers** | Who do I buy from most? |
| 6 | **Settings** | Connect extension, manage account |

The current nav order (Overview, Spending, Sellers, Orders, Shipping, Settings) does not match usage priority. Consider whether nav order should reflect the actual user journey, especially since Shipping is likely the most-visited page for active shoppers.

---

## 6. Page-by-Page Design Requirements

### 6.1 Overview (Dashboard Home)

**Purpose:** Quick orientation — where am I, what's happening, any surprises?

**Must have:**
- 4 summary stat cards: Total Spent, Order Count, Avg Order Value, Items Purchased
- Spending trend chart (area or line, over selected date range)
- Top sellers snapshot (3–5, not all)
- Shipping status snapshot (at-a-glance counts: in transit, delivered, pending)
- Recent orders (last 5–10)
- Date range filter controls

**Design considerations:**
- The date range filter controls the scope of ALL data on this page — its position and affordance should be unmissable
- Stat cards are the hero of this page; they should be visually dominant with large numerals
- Charts are secondary — supporting context, not the star
- Recent orders should feel like a live feed, not a full table — minimal columns, focused on recent activity
- Empty state (no synced orders) needs to clearly guide the user toward the extension setup

### 6.2 Spending Page

**Purpose:** Deep dive into spending patterns over time

**Must have:**
- Large area or line chart of spending over selectable periods (weekly / monthly / yearly grouping)
- Aggregate stats for selected range: Total Spent, Order Count
- Period toggle (week / month / year granularity)
- Date range filter (presets + custom)

**Design considerations:**
- This is a single-chart focused page — the chart should breathe and take up meaningful space
- Period granularity toggle (weekly/monthly/yearly) should feel like a natural toggle, not a dropdown
- Y-axis should automatically format to K/M for large values
- Hover tooltips should show formatted currency + period label
- Consider whether a cumulative vs. per-period toggle adds value

### 6.3 Sellers Page

**Purpose:** Understand seller relationships — who gets the most business

**Must have:**
- Top 10 sellers bar chart (horizontal, ranked by spend)
- Full seller table: Seller name, Order Count, Total Spent
- Sorting on table columns

**Design considerations:**
- Seller names can be long — the horizontal bar chart needs generous left margin or truncation with tooltip
- The chart and table are redundant (both show the same data) — consider whether they serve different purposes (chart = visual comparison, table = full list with exact numbers) and ensure they feel complementary, not duplicated
- If seller names link to AliExpress search or store, that's a high-value addition

### 6.4 Orders Page

**Purpose:** Browse and find specific orders; full history

**Must have:**
- Date range filter
- Paginated table (20 per page): Date, Order ID (linked), Seller, Item Count, Status badge, Tracking number, Total amount
- Page navigation (previous/next + page indicator)

**Design considerations:**
- Order ID is a link to AliExpress — make this affordance obvious but not visually dominant
- Status badges need a clear, consistent color vocabulary (see Shipping section)
- Tracking numbers are long and technical — monospace font, possibly truncated with copy-to-clipboard
- The date column could be relative ("3 days ago") with absolute on hover — reduces cognitive load for recent orders
- Consider a search/filter bar for seller name or order ID lookup

### 6.5 Shipping Page

**Purpose:** Package tracking center — what's in transit, what arrived, what's pending

**Must have:**
- Status summary cards: In Transit, Delivered, Pending/Processing, Total — clickable to filter
- Shipping status distribution chart (donut/pie)
- Delivery timeline chart (by estimated delivery week)
- Package table grouped by tracking number, with collapsible detail rows
- Status filter dropdown

**Design considerations:**
- This is the most complex page — it has the most interactive elements and the most data
- Status cards at the top serve double duty (summary + filter) — their interactive affordance needs to be crystal clear (hover state, active/selected state)
- The package grouping by tracking number is a key differentiator — a single "shipment" can contain multiple orders. The collapsible UI should feel natural and be easy to scan in the collapsed state
- Status color vocabulary must be consistent across the entire app (cards, badges, charts, pills):
  - In Transit → Blue
  - Delivered → Green
  - Pending / Processing → Amber/Yellow
  - Unknown / Other → Gray
- Estimated delivery dates should be prominent for in-transit packages — that's the highest-anxiety information
- Empty filter state (no packages match selected status) needs a clear, friendly message

### 6.6 Settings Page

**Purpose:** Account management + Chrome extension connection

**Must have:**
- Account info section: Email, Display Name, Member Since
- Extension connection section: Generate token → copy token → paste in extension
- Sync history table: Last 10 syncs with timestamp, status (success/error), orders found, new orders, duration

**Design considerations:**
- The extension connection flow is a critical path for new users — it must be dead simple
- The token copy interaction should have clear success feedback (checkmark, "Copied!" state)
- Sync history is useful for debugging ("did my sync work?") — status should be clearly color-coded (success = green, error = red, running = animated)
- This page does not need to be visually complex — calm, utilitarian layout is appropriate

---

## 7. Component System Requirements

### 7.1 Stat Cards

- Large primary number (currency or count) — this is the focal point
- Label below or above (smaller, muted)
- Optional trend indicator (up/down arrow + percentage or delta)
- Optional icon (tasteful, not decorative noise)
- 4-up grid layout on desktop, 2-up on tablet, single column on mobile

### 7.2 Charts

All charts should share:
- Consistent color vocabulary (see §8.2)
- Responsive containers — no horizontal overflow on mobile
- Formatted tooltips (currency with symbol, dates with context)
- Graceful empty states
- Loading skeletons that match the chart shape

Chart-specific:
- **Area/Line (Spending):** Subtle gradient fill, clear zero line, axis labels in muted color
- **Horizontal Bar (Sellers):** Consistent bar height, value label at end of bar, seller name left-aligned
- **Donut (Status Distribution):** Center text showing total count, legend with status labels and counts
- **Bar (Delivery Timeline):** Week label readable even when many weeks shown, tooltip shows exact count + week range

### 7.3 Data Tables

- Sticky header on scroll
- Alternating row backgrounds (subtle) or hover highlight
- Column alignment: text left, numbers right, badges centered
- Loading skeleton rows
- Empty state: centered illustration + instructional copy
- Row click affordance if rows are interactive (shipping package rows)

### 7.4 Date Range Filter

- Preset pills: "This week", "Last 7 days", "This month", "Last 30 days", "Last 3 months", "This year"
- Custom date inputs: from / to date pickers
- Active preset should be clearly selected (filled, not just underlined)
- On mobile, consider a compact collapsed version that expands on tap

### 7.5 Status Badges

A consistent badge component used across Orders, Shipping, and Sync History:

| Status | Color |
|--------|-------|
| Delivered | Green |
| In Transit | Blue |
| Pending | Amber |
| Processing | Amber |
| Awaiting Delivery | Blue (lighter) |
| Ready to Ship | Teal/Cyan |
| Error | Red |
| Success | Green |
| Running | Animated blue |

### 7.6 Navigation (Sidebar)

- Desktop: fixed sidebar, 240–280px wide
- Mobile: slide-in drawer with backdrop overlay
- Active item: filled/highlighted background, not just a colored indicator
- Icon + label always visible (not icon-only collapsed state, unless a toggle is provided)
- Brand mark at top: consider whether the logo needs visual weight or can be minimal wordmark
- User identity at bottom: avatar + name + sign-out affordance
- Section grouping or dividers if nav grows beyond 6 items

---

## 8. Visual Design Direction

### 8.1 Personality & Tone

**Keywords:** Personal, trustworthy, data-rich but approachable, calm, efficient

The app should feel like a well-organized personal finance tool — not a toy, not an enterprise dashboard. Think: Monarch Money, Copilot, or Linear — clean opinionated design with genuine attention to data density.

Avoid:
- Generic "startup dashboard" aesthetics (gradient cards, blobs, overly rounded everything)
- Heavy decoration that competes with data
- Dark-and-neon "data visualization" aesthetic (this is a personal tool, not a war room)

### 8.2 Color Philosophy

The existing orange primary (`oklch(0.62 0.21 28)`) is warm and distinct — consider keeping it as the brand accent while building a more considered palette around it.

**Recommended palette structure:**
- **Brand accent:** Orange (primary interactions, active states, primary CTAs)
- **Semantic colors:** Green (delivered, success), Blue (in transit, info), Amber (pending, warning), Red (error)
- **Surface hierarchy:** Background → Card → Elevated Card — three distinct surface levels
- **Text hierarchy:** Primary → Secondary → Tertiary/Muted — three distinct text weights

Color usage guidelines:
- Reserve orange for interactive affordances and brand moments — not for data encoding (it creates confusion when used for both)
- Chart colors should be drawn from the semantic palette where applicable (status charts) and from a neutral accent palette for non-semantic data (seller rankings, spending trends)
- Dark mode is required — design light mode first, then dark mode as a first-class variant (not an afterthought inversion)

### 8.3 Typography

Requirements:
- Numbers (especially currency amounts) need a tabular/lining numeral variant — digits should align vertically in tables and not shift width between values
- Tracking numbers and Order IDs should use a monospace face
- At least 3 distinct text weights for hierarchy
- Minimum 14px for body text, 12px for tertiary labels

Suggestions:
- Consider a numeric-optimized font for stat card hero numbers (Inter, Instrument Sans, or similar with good numeral rendering)
- Code/mono for IDs and tracking numbers

### 8.4 Spacing & Layout

- Use a consistent 8px base grid
- Cards should have generous internal padding (20–24px) — data tools should breathe
- Charts need horizontal breathing room — avoid touching card edges
- Table rows: 44–48px height for comfortable scanning
- Consistent section spacing between filter controls and content (16–24px)

### 8.5 Motion & Interaction

- Page transitions: none or minimal — this is a data tool, not a marketing site
- Chart animations: subtle entrance animation on initial load only (not on re-filter)
- Interactive states: hover, focus, active — all three must be visually distinct
- Loading states: skeleton loaders that match content shape, not generic spinners
- Copy-to-clipboard: 1-second success state with visual confirmation
- Collapsible rows: smooth accordion with 150–200ms ease

---

## 9. Responsive Breakpoints

| Breakpoint | Layout Behavior |
|------------|----------------|
| < 640px (mobile) | Sidebar hidden → hamburger menu, single column cards, simplified charts |
| 640–1024px (tablet) | 2-column stat cards, sidebar may collapse to icon-only |
| 1024–1280px (desktop) | Full sidebar + content, 3-4 column stat cards |
| > 1280px (wide) | Content max-width with centered layout (1280–1440px max) |

**Mobile-specific considerations:**
- Charts must be horizontally scrollable or reflow to a simpler representation on small screens
- Table columns should prioritize: Date, Status, Amount — other columns collapse or move to detail row
- Filters should collapse into a "Filter" button that opens a bottom sheet or modal
- The date range filter is used constantly — its mobile affordance must be simple and quick

---

## 10. Chrome Extension Popup

The extension popup is a separate surface with unique constraints:

**Constraints:**
- Fixed width: 320–400px
- Variable height: 400–600px max
- No sidebar, no navigation — single-purpose UI
- Lightweight — no heavy frameworks

**Required states:**
1. **Not connected:** Prompt to enter API token (clear instructions, link to settings page)
2. **Connected, idle:** Show last sync time, order count from last sync, "Sync Now" button
3. **Syncing:** Progress indicator, "Syncing orders… (page X of Y)", cancel option
4. **Sync complete:** Success summary (X orders found, Y new), "View Dashboard" link
5. **Sync error:** Clear error message, retry option

**Design considerations:**
- The popup is used when the user is actively on AliExpress — they want to start a sync and see progress
- Brand consistency with the web app — same color tokens, typography, visual language
- "View Dashboard" CTA after sync should be prominent
- Compact design — users will glance at this, not study it

---

## 11. Empty & Loading States

Every data surface needs explicit design for three states:

### Empty (No Data)

Occurs when:
- New user who hasn't synced yet (most important)
- Date filter returns no results
- No packages match selected status filter

For new users: This is a critical onboarding moment. The empty state should not feel like an error — it should guide the user toward the action that fills the app with data (install extension → connect token → sync). This could be an illustrated empty state with a clear CTA.

For filter-induced empty states: Friendly message ("No orders in this date range") + option to clear filter.

### Loading (Data Fetching)

- Skeleton loaders that match the shape of the content they replace
- Charts should show a loading skeleton at the correct aspect ratio
- Stat cards should show a gray rectangle where the number will appear
- Tables should show 5–10 skeleton rows

### Error States

- API failure should show a meaningful message (not "Something went wrong")
- Retry button where applicable
- Never show raw error messages or stack traces

---

## 12. Onboarding Flow

The first-time user experience is currently underdeveloped. A new user who signs up and visits the dashboard sees an empty UI with no guidance.

**Recommended onboarding sequence:**

1. **Register** → Redirect to dashboard
2. **Dashboard (empty state)** → "Your dashboard is empty. Connect the Chrome extension to import your AliExpress orders." → CTA to Settings
3. **Settings → Extension section** → Step-by-step: Install extension → Copy token → Paste in extension → Click Sync
4. **Post-sync** → Dashboard populates automatically

Consider a persistent "Get started" banner or checklist on the dashboard until the first sync is complete.

---

## 13. Accessibility Requirements

- WCAG 2.1 AA minimum compliance
- All interactive elements keyboard-navigable with visible focus indicators
- Color is never the only way to convey information (all badges have text labels, not just color dots)
- Charts must have text alternatives or data tables accessible to screen readers
- Minimum contrast ratios: 4.5:1 for body text, 3:1 for large text and UI components
- Form labels always visible (no placeholder-only labels)
- Loading and error states announced to screen readers via ARIA live regions
- Reduced motion: animations respect `prefers-reduced-motion`

---

## 14. Deliverables Expected

| Deliverable | Format | Notes |
|-------------|--------|-------|
| Design system / component library | Figma | Tokens, components, states |
| Light mode designs (all 6 pages) | Figma frames | Desktop (1440px) + Mobile (375px) |
| Dark mode designs (all 6 pages) | Figma frames | Desktop only unless time permits |
| Extension popup (all 5 states) | Figma frames | 380px width |
| Empty state designs | Figma frames | Per page |
| Loading skeleton designs | Figma frames | Per page |
| Interactive prototype | Figma | Key flows: onboarding, date filter, shipping drill-down |
| Design token exports | JSON / CSS variables | For developer handoff |

---

## 15. Technical Constraints & Notes

- The UI framework is **shadcn/ui v4** built on `@base-ui/react` — **not Radix UI**. There is no `asChild` prop. The component library is already in place; the designer should expect component-level design rather than ground-up implementation
- Colors use **OKLCH color space** — design tools should export in or convert to OKLCH
- The chart library is **Recharts v3** — chart designs must be achievable within Recharts' API (no 3D charts, limited custom shape complexity)
- Fonts are loaded via **next/font** — any font changes need web-optimized variants
- The design must support **dark mode** as a first-class variant — Tailwind CSS handles this via class-based dark mode
- The codebase uses **Tailwind CSS v4** — spacing and sizing should map to 4px / 0.25rem increments

---

## 16. Open Design Questions

These are intentionally left open for the designer to explore:

1. **Navigation order:** Should nav priority match user behavior (Shipping first) rather than conceptual hierarchy (Overview first)?

2. **Dashboard density:** Should the overview page be high-density (everything at a glance) or editorial (one focal insight at a time, scrollable)?

3. **Chart/table redundancy on Sellers page:** Both the bar chart and table show the same data. Is the chart earning its space, or should one be removed?

4. **Date filter placement:** Currently per-page. Should a global date context (always visible, always in sync) work better for a "reporting" mental model?

5. **Personalization:** Could the dashboard surface personalized insights ("You've spent 40% more this month than last month") as a standalone design pattern, separate from raw numbers?

6. **Extension popup depth:** Should the popup show a mini-dashboard preview (recent orders, in-transit count) after sync, or keep it purely functional (sync trigger only)?

7. **Mobile priority:** Should mobile get a purpose-built layout optimized for "where are my packages?" rather than a responsive adaptation of the desktop dashboard?

---

*This brief is a starting point, not a constraint. The designer should feel empowered to challenge any assumption here — especially around information architecture and layout — if there is a better experience to be found.*
