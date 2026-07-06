import { ScraperAdapter, ScraperElement } from "./scraper-adapter";

function asRoot(root?: ScraperElement): ParentNode {
  return (root as ParentNode) || document;
}

export const domAdapter: ScraperAdapter = {
  async queryAll(selector, root) {
    return Array.from(asRoot(root).querySelectorAll<HTMLElement>(selector));
  },

  async queryOne(selector, root) {
    return asRoot(root).querySelector<HTMLElement>(selector);
  },

  async text(element) {
    return (element as HTMLElement)?.innerText?.trim() ?? "";
  },

  async attr(element, name) {
    return (element as HTMLElement)?.getAttribute(name) ?? null;
  },

  async click(element) {
    (element as HTMLElement).click();
  },

  async hover(element) {
    const el = element as HTMLElement;
    el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  },

  async scrollIntoView(element) {
    (element as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
  },

  async waitForSelector(selector, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (document.querySelector(selector)) return true;
      await new Promise((r) => setTimeout(r, 300));
    }
    return false;
  },

  async count(selector) {
    return document.querySelectorAll(selector).length;
  },

  async bodyText() {
    return document.body.innerText || "";
  },
};
