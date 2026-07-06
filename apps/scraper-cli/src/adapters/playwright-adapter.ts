import type { Page, Locator } from "playwright";
import { ScraperAdapter, ScraperElement } from "../../../extension/content/adapters/scraper-adapter";

// Playwright's `:scope > div` needs a Locator root, not a raw selector string from
// document root — Locator.locator() already scopes to its own root element, so
// passing `root` as the base and calling .locator(selector) on it does the same
// thing the DOM adapter does via querySelectorAll(selector, root).
function asLocator(page: Page, root?: ScraperElement): Locator | Page {
  return (root as Locator) || page;
}

export function createPlaywrightAdapter(page: Page): ScraperAdapter {
  return {
    async queryAll(selector, root) {
      const base = asLocator(page, root);
      const locator = base.locator(selector);
      const count = await locator.count();
      const elements: ScraperElement[] = [];
      for (let i = 0; i < count; i++) elements.push(locator.nth(i));
      return elements;
    },

    async queryOne(selector, root) {
      const base = asLocator(page, root);
      const locator = base.locator(selector).first();
      return (await locator.count()) > 0 ? locator : null;
    },

    async text(element) {
      if (!element) return "";
      const locator = element as Locator;
      return ((await locator.innerText().catch(() => "")) || "").trim();
    },

    async attr(element, name) {
      if (!element) return null;
      const locator = element as Locator;
      return locator.getAttribute(name).catch(() => null);
    },

    async click(element) {
      await (element as Locator).click({ force: true }).catch(() => {});
    },

    async hover(element) {
      await (element as Locator).hover({ force: true }).catch(() => {});
    },

    async scrollIntoView(element) {
      await (element as Locator).scrollIntoViewIfNeeded().catch(() => {});
    },

    async waitForSelector(selector, timeoutMs) {
      return page
        .locator(selector)
        .first()
        .waitFor({ state: "visible", timeout: timeoutMs })
        .then(() => true)
        .catch(() => false);
    },

    async count(selector) {
      return page.locator(selector).count();
    },

    async bodyText() {
      return page.locator("body").innerText().catch(() => "");
    },
  };
}
