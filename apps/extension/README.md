# ali-sum extension

Chrome Manifest V3 extension that scrapes AliExpress order history and syncs it to the ali-sum backend.

## Setup

```bash
# From repo root
npm install

# Build
cd apps/extension
npm run build
```

Load in Chrome:
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `apps/extension/` directory

## Usage

1. Register/login at the web app
2. Go to Settings → Generate Token
3. Copy the token into the extension popup → Connect Account
4. Navigate to your AliExpress order page
5. Click "Sync Now"

## Structure

```
background/     # Service worker — sync orchestration
content/        # Content script — AliExpress order page scraper
popup/          # Extension popup UI (vanilla HTML/CSS/JS)
lib/            # API client, shared types
icons/          # Extension icons
manifest.json   # Chrome Manifest V3
```

## Commands

```bash
npm run build   # Build to dist/
npm run watch   # Watch mode
```

## Status

The content script DOM selectors (`content/scraper.ts`) have placeholder logic. The CSS selectors for AliExpress order pages need to be reverse-engineered from live pages using DevTools.
