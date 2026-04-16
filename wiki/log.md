# Wiki Activity Log

## 2026-04-16 — tracking scraping + upsert on re-sync

- **Extension:** Added `scrapeTracking()` to `apps/extension/content/scraper.ts` with three fallback strategies: logistics text element selector, track-order link `href` query params (`trackId` / `logisticsNo` / `tracking`), and `data-*` attributes.
- **Extension types:** Extended `ScrapedOrder` interface in `apps/extension/lib/types.ts` with optional `trackingNumber`, `carrier`, and `estimatedDelivery` fields.
- **Sync route:** `apps/web/app/api/orders/sync/route.ts` now upserts existing orders (updates `status`, `trackingNumber`, `carrier`, `estimatedDelivery`) instead of skipping them. New and existing orders are processed in a single `$transaction`.

## 2026-04-14 — skeleton created

- Action: setup
- Notes: wiki/ folder created by wiki-setup.sh. Run /wiki-init to populate.
