# Shared Scraper Flow Tech Spec

## Goal

Define one declarative scraping flow that can be used by both:

- The Chrome extension content script in `apps/extension/content/scraper.ts`
- A Playwright-based local/debug/test runner

The verifiable outcome is that selector and flow changes can be made once in a structured recipe file, while runtime-specific code handles DOM access, user actions, waiting, and navigation.

## Non-Goals

- Do not bundle Playwright into the Chrome extension runtime.
- Do not replace TypeScript parsing logic with a large JSON programming language.
- Do not rewrite the extension sync orchestration in `apps/extension/background/service-worker.ts`.
- Do not change the existing backend API contract for scraped orders.

## Current Problem

`scraper.ts` currently contains several concerns in one file:

- AliExpress selectors
- Field extraction
- Data transforms
- Human-like browser actions
- Pagination behavior
- CAPTCHA detection
- Chrome extension message handling

Playwright would be useful for debugging and testing the scraper, but Playwright cannot be used directly inside a Manifest V3 Chrome extension. The extension should keep using content scripts for production scraping, while Playwright should reuse the same scraping definition from outside the browser.

## Proposed Design

Create a small shared scraper engine driven by a JSON recipe.

The JSON recipe describes stable, declarative scraping concerns:

- Page URL
- Root selectors
- Field selectors
- Attribute/text extraction
- Named transforms
- Pagination selectors
- CAPTCHA indicators
- Optional action flows such as hover, click, wait, and scroll

Runtime-specific adapters execute the recipe:

- `domAdapter`: uses `document.querySelectorAll`, `HTMLElement.innerText`, `HTMLElement.click`, and browser DOM APIs inside the extension content script.
- `playwrightAdapter`: uses `page.locator`, `locator.evaluate`, `locator.click`, `locator.hover`, `page.waitForSelector`, and page navigation.

## File Layout

Proposed files:

```text
apps/extension/content/scraper.ts
apps/extension/content/scraper-core.ts
apps/extension/content/scraper-recipe.json
apps/extension/content/scraper-transforms.ts
apps/extension/content/adapters/dom-adapter.ts
apps/extension/content/adapters/playwright-adapter.ts
```

Responsibilities:

- `scraper.ts`: Chrome extension message listener only.
- `scraper-core.ts`: recipe interpreter and shared scrape orchestration.
- `scraper-recipe.json`: selectors, field mappings, and simple action flow.
- `scraper-transforms.ts`: named transform functions such as `parsePrice`, `parseCurrency`, and `parseOrderDate`.
- `dom-adapter.ts`: production adapter for content scripts.
- `playwright-adapter.ts`: debug/test adapter for Playwright.

## Recipe Shape

Example structure:

```json
{
  "ordersPage": {
    "url": "https://www.aliexpress.com/p/order/index.html",
    "captcha": {
      "textMatches": ["please slide to verify", "unusual traffic"],
      "selectors": [
        "#baxia-dialog-content",
        ".baxia-dialog",
        "#nc_1_wrapper",
        ".nc-container"
      ]
    },
    "orders": {
      "rootSelector": ".order-item",
      "fields": {
        "aliOrderId": {
          "selector": ".order-item-header-right-info > div:last-child",
          "source": "text",
          "transform": "parseOrderId",
          "fallbacks": [
            {
              "selector": "div.order-item-header > div.order-item-header-right > a",
              "source": "attr",
              "attr": "href",
              "transform": "parseOrderIdFromUrl"
            }
          ]
        },
        "orderDate": {
          "selector": ".order-item-header-right-info > div:first-child",
          "source": "text",
          "transform": "parseOrderDate"
        },
        "status": {
          "selector": ".order-item-header-status-text",
          "source": "text",
          "default": "Unknown"
        },
        "sellerName": {
          "selector": ".order-item-store",
          "source": "text",
          "default": ""
        }
      }
    },
    "pagination": {
      "loadMoreSelector": "button.comet-btn.comet-btn-large.comet-btn-borderless",
      "labelMatches": ["view orders", "load more", "next"],
      "waitForNewItemsMs": 15000
    }
  }
}
```

## Adapter Contract

The shared engine should depend on a small adapter interface:

```ts
export type ScraperElement = unknown;

export type ScraperAdapter = {
  queryAll(selector: string, root?: ScraperElement): Promise<ScraperElement[]>;
  queryOne(selector: string, root?: ScraperElement): Promise<ScraperElement | null>;
  text(element: ScraperElement): Promise<string>;
  attr(element: ScraperElement, name: string): Promise<string | null>;
  click(element: ScraperElement): Promise<void>;
  hover(element: ScraperElement): Promise<void>;
  scrollIntoView(element: ScraperElement): Promise<void>;
  waitForSelector(selector: string, timeoutMs: number): Promise<boolean>;
  count(selector: string): Promise<number>;
  bodyText(): Promise<string>;
};
```

The engine should not know whether it is running in a content script or Playwright.

## Transform Contract

JSON should reference named transforms. The implementation remains in TypeScript:

```ts
export type TransformName =
  | "parseOrderId"
  | "parseOrderIdFromUrl"
  | "parseOrderDate"
  | "parsePrice"
  | "parseCurrency"
  | "cleanImageUrl";
```

Transforms are intentionally code, not JSON. This keeps parsing logic testable and avoids turning the recipe into a fragile scripting language.

## Execution Flow

### Chrome Extension

1. `service-worker.ts` sends `SCRAPE_ORDERS` to the AliExpress tab.
2. `scraper.ts` receives the message.
3. `scraper.ts` calls `runScraper(recipe, domAdapter)`.
4. The shared engine returns `ScrapedOrder[]` and pagination state.
5. `scraper.ts` sends the result back to the service worker.

### Playwright

1. A Playwright script opens the AliExpress orders page.
2. The script calls `runScraper(recipe, playwrightAdapter(page))`.
3. The shared engine executes the same recipe through Playwright.
4. The script can log, snapshot, diff, or assert scraped output.

## Incremental Migration Plan

### Phase 1: Extract Pure Logic

Move parsing and normalization helpers out of `scraper.ts` into `scraper-transforms.ts`.

Verification:

- Extension build still passes.
- `scraper.ts` behavior is unchanged.

### Phase 2: Extract Selectors

Move selectors and simple field mappings into `scraper-recipe.json`.

Verification:

- Existing extension scrape flow still returns the same fields.
- A selector-only change can be made without editing scraper orchestration code.

### Phase 3: Add DOM Adapter

Introduce `ScraperAdapter` and make the content script use `domAdapter`.

Verification:

- `SCRAPE_ORDERS`, `LOAD_MORE`, and `SCRAPE_TRACKING_DETAIL` still work from the extension.

### Phase 4: Add Playwright Adapter

Add a Playwright adapter and a local debug/test script.

Verification:

- The Playwright runner can open a page and execute the same recipe.
- The output shape matches `ScrapedOrder[]`.

### Phase 5: Move More Flow Into Recipe

Move low-risk action configuration into JSON:

- Load-more button matching
- CAPTCHA selectors/text
- Tracking popover selectors
- Wait timeouts

Verification:

- Extension and Playwright continue to use the same recipe.
- Runtime-specific behavior stays inside adapters.

## Design Constraints

- Keep the recipe declarative.
- Keep parsing and branching-heavy logic in TypeScript.
- Prefer named transforms over inline expressions.
- Keep the adapter interface small.
- Avoid adding abstractions until both the extension and Playwright need them.
- Preserve the existing extension message API unless a later task explicitly changes it.

## Risks

- A recipe DSL can become too expressive and harder to debug than TypeScript.
- Playwright and DOM APIs differ in subtle ways around visibility, hover behavior, and waiting.
- AliExpress changes markup frequently, so the recipe must stay easy to inspect and update.
- CAPTCHA behavior should be detected and surfaced, not bypassed.

## Success Criteria

- One recipe file is the source of truth for selectors and simple scrape flow.
- The Chrome extension can scrape using the recipe through a DOM adapter.
- Playwright can scrape or test using the same recipe through a Playwright adapter.
- Transform logic remains in TypeScript and is shared by both runtimes.
- Future selector updates do not require duplicating changes between extension and Playwright code.
