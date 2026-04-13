# ali-sum extension

Chrome Manifest V3 extension for scraping AliExpress order history.

## Tech Stack

- **Bundler:** esbuild
- **Language:** Vanilla TypeScript (no React)
- **Manifest:** Chrome Manifest V3

## Key Patterns

### Extension ↔ Backend Communication

Extension stores API token in `chrome.storage.local`. Content script runs on `aliexpress.com/p/order/*` and scrapes DOM. Service worker orchestrates pagination and POSTs to `/api/orders/sync` on the web backend.

### Content Script (Incomplete)

`content/scraper.ts` has placeholder DOM scraping logic. The CSS selectors for AliExpress order pages need to be reverse-engineered from live pages using DevTools. The `ScrapedOrder` interface in `lib/types.ts` defines the expected data shape.

### Popup

Vanilla HTML/CSS/JS popup — no framework. Handles token input and sync trigger.

## Commands

```bash
npm run build   # Build to dist/
npm run watch   # Watch mode
```
