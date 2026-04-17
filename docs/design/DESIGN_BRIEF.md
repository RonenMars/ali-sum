# ali-sum Chrome Extension — Design Brief

**For:** Professional UI/UX Designer  
**Surface:** Chrome Extension Popup  
**Date:** April 2026

---

## 1. What This Extension Does

ali-sum is a Chrome extension that imports a user's AliExpress order history into a personal analytics dashboard. The popup is the user's only direct interface with the extension — it's where they connect their account, trigger syncs, and follow along while their data is imported.

The sync process has three meaningful phases that happen in sequence:

1. **Scraping** — The extension works through the user's AliExpress order list, collecting orders one page at a time
2. **Tracking enrichment** — For orders that have shipment tracking, the extension retrieves carrier and estimated delivery information
3. **Uploading** — Everything collected is sent to the backend in batches

Each phase takes a different amount of time and has a different character. The popup must communicate this process in a way that keeps the user informed without creating anxiety.

---

## 2. Who Uses This

A person who shops on AliExpress regularly and wants a cleaner view of their spending and shipping history. They've already set up the ali-sum dashboard and now use this popup to keep their data fresh.

**Three usage patterns:**

- **First-time setup** (happens once): Connect account → confirm it worked → run first sync
- **Periodic sync** (happens every week or two): Open popup → start sync → watch it run → see the result → go to dashboard
- **Quick status check**: Open popup, glance at last sync time and order count, close

These are short interactions. Users don't spend time in the popup — they act or confirm, then move on. The popup should reward that: make the right action obvious, confirm it worked, get out of the way.

---

## 3. Current Problems to Solve

These are the most important UX failures in the current design, in priority order:

1. **A misleading warning creates anxiety during sync.** The popup currently warns users not to close it during a sync. This is false — the sync continues running in the background whether or not the popup is open. The warning should be replaced with the accurate, reassuring message: "Sync is running in the background — you can close this."

2. **Progress gives no sense of how far along things are.** The user has no idea how long a sync will take or which phase they're in. Phase labels and even rough progress ("fetching tracking info for 12 of 34 orders") dramatically reduce the sense of uncertainty.

3. **The first-time connection experience is cold.** New users see a brief prompt with no context. A sentence or two explaining the two-step setup (connect → sync) would reduce drop-off and confusion.

4. **There is no success moment.** When a sync finishes, the UI silently refreshes. The user deserves a clear acknowledgment — something that says "done, here's what we found" — before the popup settles back to its idle state.

5. **The manual account connection path is hidden.** Users who prefer to connect by copying a token from the web app's settings page have to discover a buried option. This is a real use case and deserves equal standing with the primary connection flow.

---

## 4. States to Design

The popup lives in one of these states at any given moment. Each needs a distinct, purposeful design.

### Not Connected

The user hasn't connected their account yet, or their connection has expired.

There are two ways to connect:
- **Automatic:** Click "Connect Account," which opens the web app and handles everything automatically. When it completes, the popup updates on its own.
- **Manual:** Copy a token from the web app's settings page and paste it here.

These two paths should feel like equal options, not a primary action and a hidden fallback. The tone should be welcoming — this is setup, not an error.

If the connection expired (the user was previously connected), the messaging should acknowledge that: "you were connected, you just need to reconnect" reads differently from "you've never connected."

### Connected, Idle

The user is connected and nothing is running.

The popup should show:
- Confirmation that the account is connected
- When the last sync happened (in relative terms — "2 hours ago," "3 days ago," "never")
- How many total orders have been synced

The primary action is **Sync Now**. If the user has never synced before, the popup should make it especially clear that this is the natural next step.

Disconnecting should be possible but not prominent — it's a rare action and a destructive one. It should require a confirmation before anything happens.

### Syncing

A sync is actively running. This is the most complex state.

The three phases feel meaningfully different to the user:
- **Scraping** is iterative and open-ended — the extension doesn't know upfront how many pages there are
- **Tracking enrichment** is the slowest phase, with a known count of orders to visit
- **Uploading** is fast and final

The design should make the current phase visible and communicate progress within it. Even approximate feedback ("fetching tracking for order 8 of 23") is far better than a generic spinner.

The primary action button should visually reflect that work is in progress — not just be disabled, but clearly communicate "this is happening."

One important note: the user can close the popup during a sync and reopen it later. The popup should resume showing accurate state — it's not managing the sync itself, just reflecting it.

### Sync Completed

The sync finished. Three possible outcomes:

- **New orders found** — the most satisfying result; make it feel like a win
- **Already up to date** — no new orders, but that's fine; confirm it clearly
- **Partially blocked** — tracking info couldn't be fetched because AliExpress showed a CAPTCHA; this is a partial success, not a failure, and the user needs to know they can re-sync to get the missing tracking info

In all cases, offer to open the dashboard — that's almost always where the user wants to go next.

### Sync Failed

Something went wrong. The user needs to know what happened (in plain language, not a technical error message) and what they can do about it.

Always offer a retry. If the failure suggests the connection is broken, surface the reconnect option.

---

## 5. Visual Direction

### Tone

Calm and trustworthy. This extension runs in the background, opens browser tabs, and touches the user's personal order data. The design should communicate "this is under control" at every step — not urgent, not alarming unless something genuinely went wrong.

### Brand

The popup should feel like a sibling of the ali-sum web dashboard — same personality, same visual language, adapted to a compact dark format. The web app uses a warm orange as its primary accent; that same accent should appear here for primary actions and key moments.

### Dark Theme

The popup uses a dark color scheme. This is intentional — keep it.

### Semantic Color

Color should carry meaning consistently:
- **Green** for success and confirmed states
- **Blue** for in-progress and informational states  
- **Amber** for warnings that require attention but aren't failures
- **Red** for errors only

The same color for two different meanings (currently orange is used for both the brand accent and warnings) creates confusion. Separate them.

### Progress Visualization

The current design shows a single line of text during sync. Progress should be visual. Three options worth exploring:

- A **phase step indicator** (Scraping → Tracking → Uploading) with a progress bar per phase — clearest, highest effort
- A **single animated bar** with phase-aware label — simpler, still meaningful
- A **live counter** with a spinner and phase text — minimal, still better than text alone

The tracking enrichment phase is the most opaque and the longest — whatever approach is chosen, this phase especially needs more than just text.

---

## 6. Flow Diagrams

### Connection Flow

```
[Open popup, no account]
        ↓
[Not Connected state]
        ↓
  ┌─────┴──────┐
  ↓            ↓
[Connect     [Manual
 Account]     token]
  ↓            ↓
[Web app    [Paste token
 opens]      + save]
  ↓            ↓
[Auto-handoff resolves]
        ↓
[Connected, Idle — never synced]
        ↓
[Nudge: "Ready to sync"]
```

### Sync Flow

```
[Connected, Idle]
        ↓
  [Sync Now]
        ↓
[Syncing — Phase 1: Scraping]
  "Reading your order list…"
  Page X, Y orders found so far
        ↓
[Syncing — Phase 2: Tracking]
  "Fetching tracking info…"
  X of Y orders
        ↓
[Syncing — Phase 3: Uploading]
  "Saving to your dashboard…"
        ↓
  ┌─────┴──────────┐
  ↓                ↓
[Complete:       [Complete:
 new orders]      up to date]
  ↓                ↓
[Open Dashboard offered]
```

### Error & Recovery Flow

```
[Syncing]
    ↓ (failure)
[Sync Failed]
  Plain-language message
  ↓            ↓
[Try Again]  [Reconnect] ← if token issue
```

---

## 7. Full State Inventory

| State | What the user sees | Primary action |
|-------|-------------------|----------------|
| Not connected, first time | Setup prompt, two connection options | Connect Account |
| Not connected, expired | Re-connect prompt with context | Reconnect |
| Waiting for auto-connect | "Waiting for connection…" | — (auto-resolves) |
| Connected, never synced | Status + strong nudge to sync | Sync Now |
| Connected, has history | Status, last sync, order count | Sync Now |
| Syncing — scraping | Phase 1 progress | — |
| Syncing — tracking | Phase 2 progress, count | — |
| Syncing — uploading | Phase 3 progress | — |
| Complete — new orders | Success moment, count of new orders | Open Dashboard |
| Complete — up to date | Confirmation, no new orders | Open Dashboard |
| Complete — CAPTCHA blocked | Partial success, guidance to re-sync | Re-sync / Dashboard |
| Failed | Plain-language error, retry | Try Again |
| Disconnect confirmation | Inline confirm prompt | Confirm / Cancel |

---

## 8. What Not to Do

- **Do not add a light mode.** The dark popup is intentional and correct for the context.
- **Do not add navigation or multiple screens.** The popup is single-purpose. State transitions replace navigation.
- **Do not design for scrolling.** Everything should be visible without scrolling. If a state needs more space, tighten the layout.
- **Do not over-design.** This is a utility tool. Restraint is the right aesthetic — the goal is clarity and efficiency, not visual richness.

---

*The popup is small but it's the user's primary touchpoint with the extension. Every state transition is a moment of communication.*
