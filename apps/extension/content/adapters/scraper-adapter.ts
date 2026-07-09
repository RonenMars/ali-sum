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
  // Returns the currently-visible match for `selector`, not just the first in DOM
  // order — needed when a page renders one hidden instance per row (e.g. popovers).
  queryVisible(selector: string): Promise<ScraperElement | null>;
  bodyText(): Promise<string>;
};
