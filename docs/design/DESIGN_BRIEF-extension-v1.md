# ali-sum — Chrome Extension Design Brief

**Product:** ali-sum — AliExpress Order History Analytics
**Surface:** Chrome browser extension popup
**Date:** April 2026

---

## Executive Summary

**What you're designing:** A compact, single-purpose Chrome extension popup. Its one job is to let users trigger a sync of their AliExpress order history, monitor progress, and confirm the result. No navigation, no analytics, no dashboard — just focused utility.

**This is a greenfield design.** No existing UI, no established brand, no committed color palette. Visual identity is defined in the companion Web App Design Brief — this surface must inherit and apply that system, not invent its own.

**The relationship to the web app:** The extension is infrastructure. Users install it, connect it once, and use it to push data into the web dashboard. The web dashboard is where they spend their time. The extension popup is what they glance at while they're on AliExpress.

**Three non-negotiable design goals:**
1. **Glanceable** — the user should understand the current state in under two seconds
2. **One action at a time** — each state presents exactly one primary action; no cognitive load
3. **Visual consistency with the web app** — same color vocabulary, same type treatment, same component feel; the extension should feel like a satellite of the same product, not a different app

**Open questions — what's yours to resolve vs. what needs a stakeholder decision:**

| Question | Owner |
|----------|-------|
| Extension popup depth after sync: functional summary only, or mini-dashboard preview (recent orders, in-transit count)? | **Stakeholder** |
| Should the popup display the user's name / account info when connected? | **Designer** — your call |
| Error messaging detail level: generic "sync failed" or specific reason when available? | **Designer** — your call |

---

## 1. What This Product Is

ali-sum is an AliExpress order history analytics platform. It has two surfaces:

1. **Web dashboard** (primary) — where users explore spending patterns, track packages, and browse order history. Described in the Web App Design Brief.
2. **Chrome extension popup** (this brief) — a lightweight companion that scrapes the user's AliExpress order pages and sends the data to the dashboard.

The extension operates on AliExpress order history pages. When the user clicks "Sync Now," the extension reads their order history page by page and uploads the data to their ali-sum account. The popup shows progress and outcome.

The extension does not display analytics or replace the dashboard. Its purpose ends when the sync completes and the user clicks through to the web app.

---

## 2. The User in This Context

The same user as the web app, but in a different moment. They are:

- Actively browsing AliExpress — probably just placed an order or checking something
- Wanting to pull in new orders without going through any ceremony
- Glancing at the popup, not studying it — they'll spend five to fifteen seconds here

Their questions at this moment are narrower than on the dashboard:
- Is the extension connected to my account?
- Did my last sync pick up my recent orders?
- Is a sync running right now?
- Did the sync succeed?

---

## 3. Design Philosophy

**Functional, not decorative.** The popup exists to do one thing. Every design decision should serve that function. Resist the urge to fill space.

**Calm progress.** Syncing can take time — it may page through dozens of order pages. The experience should feel controlled and transparent, not anxious. Show real progress, offer a cancel option, don't leave the user wondering.

**Outcome clarity.** When a sync completes, the user should know immediately whether it worked, how many orders were found, and where to go next. No ambiguity.

**Consistent with the web app.** A user who spends time on the dashboard should recognize the extension immediately — same colors, same type feel, same badge vocabulary. It's a satellite of the same product.

---

## 4. The Five States

The popup must handle exactly five states. Every pixel of every state should be designed explicitly.

---

### State 1: Not Connected

**When it appears:** The user has installed the extension but hasn't entered an API token yet. This is the first-time experience.

**What it must show:**
- A clear explanation of what needs to happen: connect to the ali-sum dashboard to enable syncing
- A labeled input field for the API token
- A "Connect" or "Save" action
- A link to the Settings page on the dashboard (where the token is generated)

**How it should feel:**
- Not an error — this is expected for a new user
- The instruction sequence should be scannable, not a wall of text: generate token → copy it → paste it here
- The link to Settings should be prominent enough to actually click — users need to go there first

---

### State 2: Connected, Idle

**When it appears:** The token is saved and valid. No sync is running.

**What it must show:**
- A confirmation that the extension is connected (account identifier optional — see Open Questions)
- When the last sync ran (relative time: "2 hours ago") and how many orders it found
- A prominent "Sync Now" button — this is the primary action

**How it should feel:**
- Reassuring. The user should land here and feel: "everything is set up, I'm good."
- "Sync Now" is the hero of this state — it should be unmissable
- Last sync information is context, not the star

---

### State 3: Syncing

**When it appears:** A sync is in progress.

**What it must show:**
- A progress indicator — page X of Y (e.g. "Scanning page 3 of 12")
- A cancel option
- Elapsed or estimated time is optional but helpful if achievable

**How it should feel:**
- Transparent — the user should feel informed, not left waiting in the dark
- The progress should update in real time as pages are processed
- The cancel option should be accessible but not tempting — place it where it won't be accidentally tapped, but don't hide it
- No spinner-only states — raw progress numbers are more reassuring than an indefinite animation

---

### State 4: Sync Complete

**When it appears:** The sync finished successfully.

**What it must show:**
- A clear success signal
- Summary: total orders found, how many were new (e.g. "247 orders found — 12 new")
- A prominent "View Dashboard" link/button

**How it should feel:**
- A brief moment of satisfaction — the job is done
- "View Dashboard" is the only action that matters here; it should be the primary visual focus
- The summary gives the user confidence that the sync was meaningful, not empty

---

### State 5: Sync Error

**When it appears:** The sync failed — network issue, session expired on AliExpress, server error, etc.

**What it must show:**
- A clear error signal (not buried, not ambiguous)
- A human-readable message explaining what went wrong — as specific as the available information allows
- A "Try Again" action
- Optionally: a link to the dashboard for more detail or to check sync history

**How it should feel:**
- Not alarming, but honest — something went wrong and here's what to do
- The error message should never be a raw technical string
- Recovery should feel within reach: one tap to retry

---

## 5. Component Intentions

### Layout

The popup is a fixed-width, variable-height surface (approximately 360–400px wide, up to ~520px tall). It has no navigation — one state fills the full surface at a time. Generous padding; nothing should feel cramped.

### Primary Action Button

Each state has one primary action. It should be visually dominant — full width or close to it, high contrast. States 2, 4, and 5 each have one; State 1 has one; State 3's primary action is cancel (lower visual emphasis than the sync button).

### Progress Indicator

For State 3, prefer a combination of a progress bar and a text label ("Page 3 of 12") over a spinner alone. Real numbers are more calming than animation.

### Status/Connection Badge

A small inline indicator showing connected vs. not connected. Uses the same semantic color vocabulary as the web app (green for connected/success, red for error).

### Link to Dashboard

Appears in States 1, 4, and optionally 5. Should feel like a navigation action, not a button — a clear link with an external or arrow indicator to signal it opens the web app.

---

## 6. Visual Direction

### Personality

Same as the web app — personal, calm, trustworthy. The popup is smaller and more utilitarian, so decoration is even less appropriate here than on the dashboard. Every element should earn its space.

### Color

Inherit the full color system defined in the Web App Design Brief:
- Same brand accent for the primary action button
- Same semantic colors for status signals (success, error, in-progress)
- Same surface hierarchy for background and card-like containers
- Dark mode should be supported if the web app supports it

Do not introduce new colors or treatments in the extension that don't exist in the web app's system.

### Typography

Same type choices as the web app. Numbers (order counts, page progress) should feel authoritative — use the same tabular numeral treatment. The popup is small; body text should be legible at the constraints of the popup width without requiring the user to squint.

### Motion

Minimal:
- Progress bar fills smoothly as pages are processed
- State transitions (e.g. Syncing → Complete) can have a brief, subtle fade
- No decorative animations
- Respect `prefers-reduced-motion`

---

## 7. Empty, Loading, and Error States

### Loading

When the popup first opens and is determining the current state (checking stored token, fetching last sync info), show a brief skeleton or neutral placeholder — not a blank white popup.

### Error (State 5)

See the five states above. The error state is explicit and fully designed — not a fallback.

### Empty sync result

Edge case: a sync completes but finds zero orders (e.g. the user has no order history, or the page structure wasn't recognized). Design this distinctly from a sync error — it succeeded technically but found nothing. The message should prompt the user to check whether they're on the correct AliExpress order page.

---

## 8. Accessibility

- All interactive elements keyboard-navigable with visible focus indicators
- Color is never the only signal — status indicators use both color and text/icon
- Progress updates announced to screen readers via ARIA live regions
- The token input field has a visible, persistent label
- Animations respect `prefers-reduced-motion`

---

*This brief covers the extension popup only. For the full product context, visual system, and component language, refer to the Web App Design Brief. The extension must feel like a satellite of the same product — not a standalone tool with its own identity.*
