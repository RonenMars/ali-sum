# ali-sum — Design Continuation Prompt

Self-contained prompt for continuing the **Midnight Violet** design language for ali-sum across the Next.js web app and the Capacitor iOS mobile shell. Paste into Stitch's chat or hand to a future Claude session.

---

You are continuing the **Midnight Violet** design system for **ali-sum**, an AliExpress order analytics product. There is already an established design language and a partial set of components shipped to the codebase (`apps/web/components/ui/`). Your job is to extend it cohesively and produce both **web (responsive desktop-first)** and **mobile (iOS app-first, 390×844)** screens for the missing surfaces, plus any new reusable primitives needed.

## Established design system (do not drift from this)

**Tokens** (already in `apps/web/app/globals.css`)
- Canvas: `#0B0712` (warm violet-black)
- Surface: `#150F1F` · Border: `#251A37`
- Text: `#F4F0FF` / muted `#A89DC2` / subtle `#6E6486`
- Primary (violet): `#A78BFA` · Soft halo: `#2A1F4A`
- Magenta (secondary): `#F0ABFC` (used only for spending chart gradient + accents)
- Positive `#4ADE80` · Warning `#FBBF24` · Info `#38BDF8` · Destructive `#F87171`

**Typography:** Geist Sans everywhere; Geist Mono for IDs, tracking numbers, currency. Hero KPI 44–48 px / -0.02 em / 600. H1 24 px. Eyebrow 11 px uppercase tracked +0.08 em / 600. Body 14 px / 400. Captions 12 px / 500 muted.

**Layout:** 16 px-radius hairline cards, no drop shadows, generous whitespace. The single concession to "shadow" is a soft violet halo (`--accent-soft`) behind hero numbers only. Web shell = 240 px persistent left rail + 32 px page padding + 1200 px max content. Mobile = top app bar + content + fixed 5-tab bottom bar.

**Vibe:** Linear / Vercel / Arc-grade dark fintech polish. Numbers are the hero. Surgical violet accents — only on logo, active state, primary chart line + fill, sellers bars, the spend KPI's gradient sparkline + glow, and small letter avatars. Everything else is neutral grayscale on dark.

## Components already built (reuse, don't reinvent)

`KpiCard` (default + `hero` variant with halo + gradient sparkline) · `Sparkline` (SVG with optional gradient) · `StatusPill` (dot + label, tones: in-transit / delivered / pending / info / muted) · `StackedStatusBar` (full-width segmented bar + 2-col legend) · `SellerRow` (letter avatar + bar + total) · `SegmentedFilter` (pill tab control) · plus shadcn/ui (`Card`, `Button`, `Avatar`, `DropdownMenu`, `Table`, `Tabs`, `Separator`, `Badge`).

## Screens to design next

For each: produce a **desktop variant (1440×900)** AND a **mobile variant (390×844)**. Keep all screens internally consistent and consistent with the existing Overview dashboard.

1. **Spending detail** — month-over-month area chart at hero scale, breakdown by category bars, currency-mix donut, MoM table. Filters: period, currency, seller.
2. **Sellers directory** — searchable list view with sortable columns (Seller, Orders, Total, Avg Order, Last Purchase). Click into a **Seller detail** sub-screen showing that seller's spend timeline, top items, repeat-rate KPI, and recent orders list.
3. **Orders index** — dense table with global search, status multi-select chips, date range, and per-row expand revealing items, tracking, totals breakdown, raw status.
4. **Order detail** — full-page modal or route. Hero card with status pill + tracking timeline (steps: Paid → Processing → Shipped → In Transit → Out for Delivery → Delivered), items list with thumbnails, totals, seller, "Open on AliExpress" link.
5. **Shipping** — refine the existing screen. Add a **delivery calendar/agenda view** (mobile) and an **active shipments map-less timeline** showing ETA + days-since-shipped per package. Empty states designed.
6. **Settings** — sectioned: Account, Currencies + display preferences, Chrome Extension (token issuance), Notifications, Data & Privacy (export, delete), Sync history (already exists — restyle).
7. **Auth** — Login + Register + magic-link/forgot-password. Centered card on dark canvas with a subtle violet glow behind the form.
8. **Onboarding / extension-connect** — first-run flow: install extension → connect token → run first sync → see results. 3 steps, progress indicator at top, big CTA bottom.
9. **Empty states + skeletons** — for every screen above. Empty = friendly illustration-free monochrome with a single CTA.
10. **Notifications inbox (mobile)** — sheet from top tab, grouped by today / earlier, tap-to-dismiss.

## New reusable primitives to introduce (and ship to `components/ui/`)

- `PageHeader` — H1 + subtitle + right-side action slot (filter / button)
- `EmptyState` — icon (lucide), title, body, CTA
- `Skeleton` — shimmer-free, just muted blocks with the right shape (KPI shell, chart shell, row)
- `Money` / `OrderId` / `Date` — typographic atoms with the correct mono / tabular treatment baked in
- `TrackingStepper` — vertical (mobile) and horizontal (desktop) variant; steps with completed / current / pending states
- `CalendarAgenda` — day-grouped list, used for shipping ETAs (and reusable elsewhere)
- `Toast` — bottom-anchored, violet edge for info, positive/warning/destructive tones
- `BottomSheet` (mobile) — drag-to-dismiss, used for filters and item details on small screens
- `Drawer` (desktop) — right-side slide-in for order detail without leaving context
- `MetricDelta` — the up/down chip already used inside `KpiCard`, lifted into a standalone primitive
- `Avatar.Letter` — variant of existing `Avatar` with violet-tinted bg and initial (already used in `SellerRow`, formalize it)
- `Tag` — small filter chip distinct from `StatusPill`; clickable / dismissible variants

## Quality bar

- Each screen must have realistic seeded data (real-feeling product names: USB-C cable, smart plug, mechanical keyboard switch tester, mini desk lamp, silicone phone case, etc., real seller names). No lorem ipsum.
- Tooltips, hover states, focus rings (violet, 2 px) all designed in.
- A11y: 4.5:1 contrast on body text, semantic landmarks shown in the design (sidebar = nav, main = main).
- Responsive breakpoints noted: ≥1280 desktop, 768–1279 tablet (sidebar collapses to icons), <768 mobile (sidebar replaced by bottom tab bar). Show all three for at least one screen so the responsive logic is unambiguous.
- Motion: 120 ms ease-out hover, 200 ms filter changes, 240 ms route transitions. Charts animate in once on mount.
- Don'ts: no drop shadows, no gradients on surfaces (only on the spending chart fill + the spend KPI sparkline), no emoji in UI, no colored card backgrounds behind KPI numbers — keep canvas calm and let violet do the work.

## Output format

For each screen, deliver:
1. A high-fidelity Stitch frame (desktop and mobile).
2. A short component map: which existing primitives are used, which new primitives this screen introduces (and why).
3. Empty-state and skeleton variants in the same frame group.

When designing, prefer composing existing primitives over inventing new ones. Only add a new primitive to `components/ui/` if it will be reused in 2+ places.
