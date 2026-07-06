# ali-sum scraper-cli

Standalone daily-sync runner. Reuses the same scraping recipe/adapter code as
`apps/extension`, driven by Playwright instead of a browser extension —
see `docs/design/DESIGN_BRIEF-scheduled-sync.md` for the full design.

## Setup

```bash
npx playwright install chromium   # one-time, needs full (non-headless-shell) chromium
npm -w apps/scraper-cli run login # opens a browser window — log into AliExpress manually
```

Save an API token (same token the extension's "Connect" flow generates):

```bash
mkdir -p apps/scraper-cli/.data
echo '<token>' > apps/scraper-cli/.data/token
```

Or set `ALI_SUM_TOKEN` in the environment instead of a file.

## Run

```bash
npm -w apps/scraper-cli run sync        # incremental sync (headless)
npm -w apps/scraper-cli run sync:headed # incremental sync with visible browser
npm -w apps/scraper-cli run sync:full   # ignore watermark, full re-scan
ALI_SUM_HEADED=1 npm -w apps/scraper-cli run sync   # watch it run
```

## Env vars

- `ALI_SUM_API_BASE` — defaults to `http://localhost:3000`
- `ALI_SUM_TOKEN` — API bearer token (overrides `.data/token`)
- `ALI_SUM_HEADED` — set to `1` to run headed instead of headless
- `ALI_SUM_ALIEXPRESS_USERNAME` / `ALI_SUM_ALIEXPRESS_PASSWORD` — optional auto-login fallback for headless-only environments; more fragile than the one-time manual `login` flow since AliExpress can still challenge a password login with CAPTCHA/device verification.

## Scheduling

Point your OS scheduler (macOS `launchd`, Windows Task Scheduler) at
`npm -w apps/scraper-cli run sync` on whatever daily cadence you want.
