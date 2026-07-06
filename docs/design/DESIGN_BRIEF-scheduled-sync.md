# ali-sum — Scheduled Sync Tech Spec

**Product:** ali-sum — AliExpress Order History Analytics
**Surface:** Chrome extension (`apps/extension`) + standalone runner (`apps/scraper-cli`)
**Date:** July 2026

---

## Goal

Run the existing order sync (`startSync()` in `background/service-worker.ts`) automatically on a daily cadence, without a person clicking "Sync Now" in the popup every day.

## Constraints (apply to both options)

- Sync requires an authenticated AliExpress session (real browser cookies) — cannot run in a fresh/incognito profile or a bot-detected headless context.
- `startSync()` navigates real tabs, adds randomized human-like delays, and can encounter a CAPTCHA (`captchaDetected`), which today is surfaced in the popup for the user to solve manually. No scheduling approach removes this ceiling — a CAPTCHA still needs a human within some window afterward, or that day's sync is partial.
- The extension has no existing scheduling primitive (`manifest.json` requests no `alarms` permission; there is no `chrome.alarms` call anywhere in the codebase).

## Option A — `chrome.alarms` in the extension (Recommended)

### Design

Add Chrome's built-in alarm API so the service worker wakes itself up daily and calls the same `startSync()` path the popup button already uses.

- `manifest.json`: add `"alarms"` to `permissions`.
- `background/service-worker.ts`:
  - On extension install/startup, call `chrome.alarms.create("daily-sync", { periodInMinutes: 24 * 60 })` (guard with `chrome.alarms.get` so reinstall/reload doesn't stack duplicate alarms).
  - Add `chrome.alarms.onAlarm.addListener((alarm) => { if (alarm.name === "daily-sync") startSync(); })`.
  - Reuse `startSync()` as-is — no changes to sync logic, pagination, tracking enrichment, or upload.
- Popup: no changes required. Optionally surface "Auto-sync: daily" as a status line reading from `chrome.storage.local` (out of scope unless requested).

### Requirements to actually fire

- Chrome must be running (doesn't need to be the focused/foreground window, background/minimized is fine).
- The extension must be installed and enabled — already true for normal use.
- `chrome.alarms` persists across service-worker restarts and browser relaunches once created; no OS-level configuration needed.

### Failure handling

- If `startSync()` throws or hits a CAPTCHA, `broadcastProgress` already records `status: "failed"` / the captcha message into `currentProgress` and `chrome.storage.local`. Next popup open shows the stale/error state — this already works today for manual syncs, so no new failure-surfacing code is needed.
- No retry logic is added — if Chrome wasn't running at the scheduled time, `chrome.alarms` fires as soon as Chrome next starts (Chrome's documented behavior for missed persistent alarms), not "twice to catch up."

### Diff size

Small: one manifest permission line, ~10-15 lines in the service worker (alarm creation + listener). No new files.

### Tradeoffs

| | |
|---|---|
| **Pros** | No OS setup, no separate driver script, works identically on Mac/Windows/Linux, survives Chrome restarts, smallest possible diff |
| **Cons** | Only fires while Chrome is running; can't wake a fully shut-down machine or launch Chrome itself; still needs occasional manual CAPTCHA-solving |

## Option B — Standalone Playwright runner (implemented, `apps/scraper-cli`)

### Design

Rather than driving the extension from outside via CDP, a separate `apps/scraper-cli` workspace runs the *entire* scrape+sync flow itself, independent of the extension and of Chrome-the-application. It reuses the same recipe-driven scraping logic added in the Phase 1-3 refactor:

- `content/scraper-core.ts`, `content/scraper-recipe.json`, and `content/scraper-transforms.ts` are imported directly from `apps/extension` (same monorepo, relative import — no shared package needed for three files).
- A new `ScraperAdapter` implementation, `playwright-adapter.ts`, drives a real `Page` via Playwright's `Locator` API instead of `document.querySelector`.
- `sync.ts` is a Node port of `service-worker.ts`'s `startSync()` — same watermark logic, same pagination loop, same popover/detail-page tracking enrichment, same human-like delays — but calls the scraper-core functions directly instead of relaying `chrome.tabs.sendMessage` to a content script (there's no content-script boundary to cross in a plain Playwright script).
- `api-client.ts` is a Node port of the extension's API client, using the platform `fetch` (Node ≥18) instead of `chrome.storage.local` for the token.

Two auth concerns, each independent of the other:

1. **AliExpress session** (`auth.ts`): `chromium.launchPersistentContext()` against a fixed profile directory (`apps/scraper-cli/.data/chrome-profile`, gitignored). First run (`npm run login`) opens headed so the user logs in manually once; the session cookie persists in that profile for all future runs. A credential-based auto-login fallback (`ALI_SUM_ALIEXPRESS_USERNAME`/`PASSWORD` env vars) exists for headless-only environments, but is more fragile — AliExpress can still challenge a password login with a CAPTCHA or device verification, same ceiling as manual login.
2. **ali-sum API token** (`config.ts`): the same long-lived Bearer JWT the extension stores in `chrome.storage.local`, here read from `ALI_SUM_TOKEN` env var or a local file (`apps/scraper-cli/.data/token`, gitignored). Generated once from the web app the same way the extension popup's "Connect" flow does; no backend changes were needed since `/api/orders/sync` and `/api/orders/sync-watermark` already accept any valid Bearer token regardless of caller.

Scheduling this daily is now a plain OS-scheduler-runs-a-script problem, not a browser-automation problem:

- macOS: a `launchd` `.plist` with `StartCalendarInterval` running `npm -w apps/scraper-cli run sync` (headless by default; `ALI_SUM_HEADED=1` forces a visible window if desired).
- Windows: a Task Scheduler task running the same command.

No CDP wiring, no `--load-extension`, no `chrome-remote-interface` dependency, no profile-lock juggling with an already-running Chrome — this runner owns its own dedicated Chromium profile, entirely separate from the user's everyday browser.

### Requirements to actually fire

- The user's Mac/Windows session must be logged in/active at the scheduled time (same as any `launchd`/Task Scheduler job — it cannot power on a fully shut-down machine).
- The persistent profile must already have a valid AliExpress session (`npm run login` run at least once); otherwise a headless scheduled run fails fast with an explicit error instead of hanging on a login form.
- Full (non-shell) Chromium must be installed via `npx playwright install chromium` — the headless-shell variant some environments cache by default doesn't support the headed login flow.

### Failure handling

- CAPTCHA ceiling is identical to the extension: `sync.ts` checks `detectCaptcha()` the same way `service-worker.ts` does and stops enrichment early, logging a message pointing at `npm run login` to re-authenticate/solve it manually.
- Unlike a raw CDP approach, failures are visible for free: this runs as a foreground Node process under the OS scheduler, so stdout/stderr and the exit code are exactly what `launchd`/Task Scheduler already capture in their own logs — no extra `chrome.notifications` plumbing needed.
- No retry logic — a failed scheduled run just waits for the next scheduled trigger, same behavior as Option A.

### Diff size

One new workspace (`apps/scraper-cli`): `package.json`, `tsconfig.json`, and 6 small source files (`run.ts`, `auth.ts`, `config.ts`, `api-client.ts`, `sync.ts`, `adapters/playwright-adapter.ts`), all reusing existing extension logic rather than duplicating it. One new dependency (`playwright`, already present in the monorepo for `apps/web` E2E tests, just not previously in this workspace).

### Tradeoffs

| | |
|---|---|
| **Pros** | Fully unattended after one-time login (no Chrome-the-app needs to be open, no extension involved at all); reuses 100% of the recipe/adapter refactor rather than re-deriving scraping logic; failure/log visibility is free via the OS scheduler's own log capture; identical code path can run headed on demand for debugging |
| **Cons** | Separate Chromium profile from the user's everyday browser (session can go stale independently and needs its own re-login); a second place selectors could theoretically drift from (mitigated by sharing `scraper-core.ts`/`scraper-recipe.json` directly, not a fork); one more workspace to keep dependencies current in |

## Recommendation

Both options are real, implemented, and kept side by side — they solve different problems and neither replaces the other:

- **Option A (`chrome.alarms`)** is the right default for "sync automatically while I'm using this computer normally with Chrome open." Smallest possible footprint, zero new processes, uses the browser the user already has open for everything else.
- **Option B (`apps/scraper-cli`)** is the right choice for "sync on a schedule regardless of whether I have Chrome open, without touching the extension at all" — e.g. a scheduled task on a machine where Chrome isn't kept running, or where using the everyday browser profile for automated scraping isn't desired. It fully replaces the *scheduling* need, not the extension itself: the extension stays installed and useful for on-demand manual syncs and for connecting a new account.

Pick based on whether "Chrome already open" is a safe assumption for the daily schedule; Option B removes that assumption entirely at the cost of a second, independently-authenticated browser profile to keep alive.
