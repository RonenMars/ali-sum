import { ScrapedOrder, ScrapedOrderItem } from "../lib/types";
import { ScraperAdapter, ScraperElement } from "./adapters/scraper-adapter";
import { transforms, TransformName } from "./scraper-transforms";
import recipe from "./scraper-recipe.json";

type Recipe = typeof recipe;

function applyTransform(name: TransformName | undefined, value: string): string | number {
  if (!name) return value;
  return transforms[name](value);
}

// --- Human-like behavior helpers ---

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function humanDelay(minMs: number, maxMs: number): Promise<void> {
  return new Promise((r) => setTimeout(r, randomBetween(minMs, maxMs)));
}

async function randomScroll(adapter: ScraperAdapter): Promise<void> {
  // Only meaningful in a real DOM; Playwright-style adapters can no-op.
  if (typeof window === "undefined") return;
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  if (maxY <= 0) return;
  const currentY = window.scrollY;
  const offset = randomBetween(-400, 400);
  const targetY = Math.max(0, Math.min(maxY, currentY + offset));
  window.scrollTo({ top: targetY, behavior: "smooth" });
}

export async function detectCaptcha(adapter: ScraperAdapter): Promise<boolean> {
  const cfg = recipe.ordersPage.captcha;
  const body = await adapter.bodyText();
  for (const pattern of cfg.textMatches) {
    if (new RegExp(pattern, "i").test(body)) return true;
  }
  for (const selector of cfg.selectors) {
    if (await adapter.queryOne(selector)) return true;
  }
  return false;
}

// AliExpress occasionally shows an informational modal (e.g. "payable amount has
// changed due to exchange rate") on top of the order list. It blocks pagination
// and hover-based tracking scraping silently — force:true clicks/hovers don't
// error even when an element is covered by an overlay — so it must be dismissed
// proactively rather than relying on an exception to surface it.
export async function dismissDialogs(adapter: ScraperAdapter): Promise<boolean> {
  const cfg = recipe.ordersPage.dismissibleDialogs;
  const body = await adapter.bodyText();
  const isPresent = cfg.textMatches.some((pattern) => new RegExp(pattern, "i").test(body));
  if (!isPresent) return false;

  const labelRe = new RegExp(cfg.confirmButtonLabelMatch, "i");
  const candidates = await adapter.queryAll(cfg.confirmButtonSelector);
  for (const btn of candidates) {
    const label = await adapter.text(btn);
    if (labelRe.test(label)) {
      await adapter.click(btn);
      return true;
    }
  }
  return false;
}

async function scrapeImageUrl(adapter: ScraperAdapter, container: ScraperElement): Promise<string> {
  const { cleanImageUrl } = transforms as unknown as { cleanImageUrl: (u: string) => string };

  const img = await adapter.queryOne("img", container);
  if (img) {
    const lazySrc =
      (await adapter.attr(img, "src")) ||
      (await adapter.attr(img, "data-src")) ||
      (await adapter.attr(img, "data-lazyload-src")) ||
      (await adapter.attr(img, "data-lazy-src")) ||
      (await adapter.attr(img, "data-original")) ||
      (await adapter.attr(img, "data-origin-src"));
    if (lazySrc && /alicdn\.com/i.test(lazySrc)) return cleanImageUrl(lazySrc);
    if (lazySrc) return lazySrc;
  }

  // Order thumbnails render as an inline `style="background-image: url(...)"` on the
  // container div (or a descendant) rather than an <img> tag — read the attribute
  // directly so this works identically in a real DOM and under Playwright.
  const targets = [container, ...(await adapter.queryAll("*", container))];
  for (const target of targets) {
    const style = (await adapter.attr(target, "style")) || "";
    const match = style.match(/url\(['"]?(https?[^'")\s]+)['"]?\)/);
    if (match) {
      const url = match[1];
      return /alicdn\.com/i.test(url) ? cleanImageUrl(url) : url;
    }
  }

  return "";
}

async function scrapeItems(adapter: ScraperAdapter, orderEl: ScraperElement): Promise<ScrapedOrderItem[]> {
  const cfg = recipe.ordersPage.orders.items;
  const items: ScrapedOrderItem[] = [];
  const itemEls = await adapter.queryAll(cfg.rootSelector, orderEl);

  for (const itemEl of itemEls) {
    const titleField = cfg.fields.title;
    const titleEl = await adapter.queryOne(titleField.selector, itemEl);
    const titleAttr = titleEl ? await adapter.attr(titleEl, titleField.attr) : null;
    const titleText = titleEl ? await adapter.text(titleEl) : "";
    const fallbackTitleEl = await adapter.queryOne(titleField.fallbackTextSelector, itemEl);
    const fallbackTitleText = fallbackTitleEl ? await adapter.text(fallbackTitleEl) : "";
    const title = titleAttr || titleText || fallbackTitleText || titleField.default;

    const linkEl = await adapter.queryOne(cfg.fields.productUrl.selector, itemEl);
    const productUrl = (linkEl ? await adapter.attr(linkEl, "href") : null) || cfg.fields.productUrl.default;

    const imgContainerEl = await adapter.queryOne(cfg.imageContainerSelector, itemEl);
    const imageUrl = imgContainerEl ? await scrapeImageUrl(adapter, imgContainerEl) : "";

    const priceEl = await adapter.queryOne(cfg.fields.price.selector, itemEl);
    const priceText = priceEl ? await adapter.text(priceEl) : "";
    const price = priceText ? (applyTransform("parsePrice", priceText) as number) : cfg.fields.price.default;

    const qtyEl = await adapter.queryOne(cfg.fields.quantity.selector, itemEl);
    const qtyText = (qtyEl ? await adapter.text(qtyEl) : "") || cfg.fields.quantity.default;
    const quantity = parseInt(qtyText.replace(/[^0-9]/g, ""), 10) || 1;

    items.push({ title, price, quantity, imageUrl, productUrl });
  }

  return items;
}

async function scrapeTracking(
  adapter: ScraperAdapter,
  orderEl: ScraperElement,
): Promise<{ trackingNumber?: string; carrier?: string; estimatedDelivery?: string }> {
  const cfg = recipe.ordersPage.orders.tracking;

  const logisticEl = await adapter.queryOne(cfg.logisticsSelector, orderEl);
  if (logisticEl) {
    const text = await adapter.text(logisticEl);
    const match = text.match(new RegExp(cfg.trackingNumberPattern));
    if (match) return { trackingNumber: match[1] };
  }

  const trackLinks = await adapter.queryAll(cfg.trackLinkSelector, orderEl);
  for (const link of trackLinks) {
    const href = await adapter.attr(link, "href");
    if (!href) continue;
    try {
      const url = new URL(href);
      for (const param of cfg.trackLinkParams) {
        const trackId = url.searchParams.get(param);
        if (trackId) return { trackingNumber: trackId };
      }
    } catch {
      // malformed URL — skip
    }
  }

  for (const attrName of cfg.dataAttrs) {
    const direct = await adapter.attr(orderEl, attrName);
    if (direct) return { trackingNumber: direct };
    const nested = await adapter.queryOne(`[${attrName}]`, orderEl);
    if (nested) {
      const val = await adapter.attr(nested, attrName);
      if (val) return { trackingNumber: val };
    }
  }

  return {};
}

async function findTrackOrderButton(adapter: ScraperAdapter, orderEl: ScraperElement): Promise<ScraperElement | null> {
  const cfg = recipe.ordersPage.orders.tracking;
  const candidates = await adapter.queryAll(cfg.trackOrderButtonSelector, orderEl);
  const labelRe = new RegExp(cfg.trackOrderButtonLabelMatch, "i");
  for (const el of candidates) {
    const label = await adapter.text(el);
    if (labelRe.test(label)) return el;
  }
  return null;
}

export async function scrapeOrdersFromPage(adapter: ScraperAdapter): Promise<ScrapedOrder[]> {
  const cfg = recipe.ordersPage.orders;
  const orders: ScrapedOrder[] = [];
  const orderEls = await adapter.queryAll(cfg.rootSelector);

  console.log(`[ali-sum] Found ${orderEls.length} order elements on page`);

  for (const orderEl of orderEls) {
    try {
      const headerInfo = await adapter.queryOne(cfg.headerInfoSelector, orderEl);
      const infoDivs = headerInfo ? await adapter.queryAll(":scope > div", headerInfo) : [];

      const orderDateStr = infoDivs[0] ? await adapter.text(infoDivs[0]) : "";
      const orderIdStr = infoDivs.length ? await adapter.text(infoDivs[infoDivs.length - 1]) : "";

      const idField = cfg.fields.aliOrderId;
      let aliOrderId = applyTransform(idField.transform as TransformName, orderIdStr) as string;

      if (!aliOrderId) {
        for (const fallback of idField.fallbacks) {
          const el = await adapter.queryOne(fallback.selector, orderEl);
          if (!el) continue;
          const raw =
            fallback.source === "attr" ? (await adapter.attr(el, fallback.attr)) || "" : await adapter.text(el);
          aliOrderId = applyTransform(fallback.transform as TransformName, raw) as string;
          if (aliOrderId) break;
        }
      }

      if (!aliOrderId) {
        console.warn("[ali-sum] Could not determine order ID, skipping element");
        continue;
      }

      const orderDate = applyTransform(cfg.fields.orderDate.transform as TransformName, orderDateStr) as string;

      const statusEl = await adapter.queryOne(cfg.fields.status.selector, orderEl);
      const status = (statusEl ? await adapter.text(statusEl) : "") || cfg.fields.status.default;

      const storeEl = await adapter.queryOne(cfg.fields.sellerName.selector, orderEl);
      const sellerName = (storeEl ? await adapter.text(storeEl) : "") || cfg.fields.sellerName.default;

      const items = await scrapeItems(adapter, orderEl);
      const tracking = await scrapeTracking(adapter, orderEl);

      const trackBtn = await findTrackOrderButton(adapter, orderEl);
      const trackingPageUrl = trackBtn ? (await adapter.attr(trackBtn, "href")) || undefined : undefined;

      const totalEls = await adapter.queryAll(cfg.totalSelector, orderEl);
      const totalTexts = await Promise.all(totalEls.map((e) => adapter.text(e)));
      const totalText = totalTexts.join("");
      const totalAmount = totalText
        ? (applyTransform("parsePrice", totalText) as number)
        : items.reduce((s, i) => s + i.price * i.quantity, 0);
      const currency = totalText ? (applyTransform("parseCurrency", totalText) as string) : "USD";

      orders.push({
        aliOrderId,
        orderDate,
        totalAmount,
        currency,
        status,
        sellerName,
        // Shipping cost is only shown on the order detail page, not the list page
        shippingCost: 0,
        ...tracking,
        trackingPageUrl,
        items,
      });
    } catch (err) {
      console.error("[ali-sum] Error scraping order element:", err);
    }
  }

  console.log(`[ali-sum] Scraped ${orders.length} orders`);
  return orders;
}

async function findLoadMoreButton(adapter: ScraperAdapter): Promise<ScraperElement | null> {
  const cfg = recipe.ordersPage.pagination;
  const buttons = await adapter.queryAll(cfg.loadMoreSelector);
  for (const btn of buttons) {
    const disabled = (btn as HTMLButtonElement)?.disabled;
    if (disabled) continue;
    const spanEl = await adapter.queryOne("span", btn);
    const label = (spanEl ? await adapter.text(spanEl) : "") || (await adapter.text(btn));
    if (cfg.labelMatches.some((m) => new RegExp(m, "i").test(label))) {
      return btn;
    }
  }
  return null;
}

export async function hasNextPage(adapter: ScraperAdapter): Promise<boolean> {
  return (await findLoadMoreButton(adapter)) !== null;
}

export async function clickLoadMore(adapter: ScraperAdapter): Promise<boolean> {
  const cfg = recipe.ordersPage.pagination;
  const btn = await findLoadMoreButton(adapter);
  if (!btn) return false;

  await adapter.scrollIntoView(btn);
  await humanDelay(1500, 4000);

  const beforeCount = await adapter.count(recipe.ordersPage.orders.rootSelector);
  await adapter.click(btn);

  const deadline = Date.now() + cfg.waitForNewItemsMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 300));
    const nowCount = await adapter.count(recipe.ordersPage.orders.rootSelector);
    if (nowCount > beforeCount) return true;
  }
  return false;
}

function parsePopoverDeliveryDate(text: string): string | undefined {
  const match = text.match(/([A-Z][a-z]{2,8}\.?\s+\d{1,2},?\s*\d{4})/);
  if (match) {
    const d = new Date(match[1]);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  const noYear = text.match(/([A-Z][a-z]{2,8}\.?\s+\d{1,2})/);
  if (noYear) {
    const cleaned = noYear[1].replace(".", "");
    const d = new Date(`${cleaned}, ${new Date().getFullYear()}`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return undefined;
}

async function scrapePopoverContent(
  adapter: ScraperAdapter,
): Promise<{ trackingNumber?: string; estimatedDelivery?: string }> {
  const cfg = recipe.ordersPage.trackingPopover;
  const popover = await adapter.queryVisible(cfg.containerSelector);
  if (!popover) return {};

  const trackingEl = await adapter.queryOne(cfg.trackingNumberSelector, popover);
  const trackingNumber = trackingEl ? (await adapter.text(trackingEl)) || undefined : undefined;

  const titleDiv = await adapter.queryOne(cfg.titleContainerSelector, popover);
  let estimatedDelivery: string | undefined;
  if (titleDiv) {
    const firstP = await adapter.queryOne(cfg.titleFirstParagraphSelector, titleDiv);
    const dateSpan = firstP ? await adapter.queryOne("span", firstP) : null;
    const dateText = (dateSpan ? await adapter.text(dateSpan) : "") || (firstP ? await adapter.text(firstP) : "");
    if (dateText) estimatedDelivery = parsePopoverDeliveryDate(dateText);
  }

  return { trackingNumber, estimatedDelivery };
}

async function waitForPopoverGone(adapter: ScraperAdapter, timeoutMs = 3000): Promise<void> {
  const selector = recipe.ordersPage.trackingPopover.containerSelector;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!(await adapter.queryVisible(selector))) return;
    await new Promise((r) => setTimeout(r, 200));
  }
}

async function waitForVisiblePopover(adapter: ScraperAdapter, timeoutMs: number): Promise<boolean> {
  const selector = recipe.ordersPage.trackingPopover.containerSelector;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await adapter.queryVisible(selector)) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

export async function scrapeTrackingFromPopovers(
  adapter: ScraperAdapter,
  allowedOrderIds?: Set<string>,
): Promise<{
  trackingMap: Record<string, { trackingNumber?: string; estimatedDelivery?: string }>;
  captchaDetected: boolean;
}> {
  const cfg = recipe.ordersPage.orders;
  const trackingMap: Record<string, { trackingNumber?: string; estimatedDelivery?: string }> = {};
  const orderEls = await adapter.queryAll(cfg.rootSelector);

  for (let i = 0; i < orderEls.length; i++) {
    const orderEl = orderEls[i];

    if (await detectCaptcha(adapter)) {
      console.warn("[ali-sum] CAPTCHA detected, aborting popover scraping");
      return { trackingMap, captchaDetected: true };
    }
    await dismissDialogs(adapter);

    const headerInfo = await adapter.queryOne(cfg.headerInfoSelector, orderEl);
    const infoDivs = headerInfo ? await adapter.queryAll(":scope > div", headerInfo) : [];
    const orderIdStr = infoDivs.length ? await adapter.text(infoDivs[infoDivs.length - 1]) : "";
    const aliOrderId = applyTransform("parseOrderId", orderIdStr) as string;
    if (!aliOrderId) continue;
    if (allowedOrderIds && !allowedOrderIds.has(aliOrderId)) continue;

    const trackBtn = await findTrackOrderButton(adapter, orderEl);
    if (!trackBtn) continue;

    // Occasional idle pause — ~20% chance to "take a break" (4-9s)
    if (Math.random() < 0.2) {
      await randomScroll(adapter);
      await humanDelay(4000, 9000);
    }

    await adapter.scrollIntoView(trackBtn);
    await humanDelay(1000, 2500);

    await adapter.hover(trackBtn);

    const popoverAppeared = await waitForVisiblePopover(adapter, 3000);

    if (popoverAppeared) {
      await humanDelay(500, 1500);
      const data = await scrapePopoverContent(adapter);
      if (data.trackingNumber || data.estimatedDelivery) {
        trackingMap[aliOrderId] = data;
      }
    }

    // Dismiss popover by moving the hover elsewhere, then wait for it to disappear
    // so the next iteration doesn't read stale content from this one.
    const bodyEl = await adapter.queryOne("body");
    if (bodyEl) await adapter.hover(bodyEl);
    await waitForPopoverGone(adapter);

    // Randomized pause between hovers (2.5–6s)
    await humanDelay(2500, 6000);
  }

  return { trackingMap, captchaDetected: false };
}

export async function scrapeTrackingDetailPage(
  adapter: ScraperAdapter,
): Promise<{ trackingNumber?: string; carrier?: string; estimatedDelivery?: string }> {
  const cfg = recipe.ordersPage.trackingDetailPage;

  const trackingEl = await adapter.queryOne(cfg.trackingNumberSelector);
  const carrierEl = await adapter.queryOne(cfg.carrierSelector);
  const deliveryEl = await adapter.queryOne(cfg.deliverySelector);

  const trackingNumber = trackingEl ? (await adapter.text(trackingEl)) || undefined : undefined;
  const carrier = carrierEl ? (await adapter.text(carrierEl)) || undefined : undefined;

  let estimatedDelivery: string | undefined;
  if (deliveryEl) {
    const text = await adapter.text(deliveryEl);
    // Format: "Delivery: Apr. 24 - May. 14" — use the end date of the range
    const rangeMatch = text.match(/-\s*([A-Z][a-z]{2,8}\.?\s+\d{1,2})/);
    const singleMatch = text.match(/([A-Z][a-z]{2,8}\.?\s+\d{1,2})/);
    const dateStr = rangeMatch ? rangeMatch[1] : singleMatch ? singleMatch[1] : null;
    if (dateStr) {
      const cleaned = dateStr.replace(".", "");
      const year = new Date().getFullYear();
      const d = new Date(`${cleaned}, ${year}`);
      if (!isNaN(d.getTime())) {
        estimatedDelivery = d.toISOString();
      }
    }
  }

  return { trackingNumber, carrier, estimatedDelivery };
}
