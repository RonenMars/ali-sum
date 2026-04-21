import { ScrapedOrder, ScrapedOrderItem } from "../lib/types";

// Content script that runs on AliExpress order pages
// Listens for messages from the service worker to scrape order data
//
// Selectors verified against aliexpress.com/p/order/index.html as of 2024-2025.
// Sources:
//   - peter-tanner/AliExpress-Invoice-Downloader (confirmed working on current page)
//   - greasyfork #490901 "AliExpress Parse Orders Information to CSV"
//   - greasyfork #454191 "Total of all Aliexpress purchases"
//   - greasyfork #559652 "AliExpress auto-load more orders"
//
// NOTE: AliExpress ships frequent UI changes. If scraping breaks, open DevTools
// on aliexpress.com/p/order/index.html and re-verify the selectors below.

// --- Human-like behavior helpers ---

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function humanDelay(minMs: number, maxMs: number): Promise<void> {
  return new Promise((r) => setTimeout(r, randomBetween(minMs, maxMs)));
}

function randomScroll(): void {
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  if (maxY <= 0) return;
  const currentY = window.scrollY;
  // Scroll a small random offset from current position (±100-400px)
  const offset = randomBetween(-400, 400);
  const targetY = Math.max(0, Math.min(maxY, currentY + offset));
  window.scrollTo({ top: targetY, behavior: "smooth" });
}

function scrollToElement(el: HTMLElement): void {
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function detectCaptcha(): boolean {
  // AliExpress shows a modal with "slide to verify" when it detects bot-like traffic.
  // Check for common CAPTCHA indicators.
  const body = document.body.innerText || "";
  if (/please\s+slide\s+to\s+verify/i.test(body)) return true;
  if (/unusual\s+traffic/i.test(body)) return true;
  if (document.querySelector("#baxia-dialog-content, .baxia-dialog, #nc_1_wrapper, .nc-container")) return true;
  return false;
}

function parsePrice(text: string): number {
  // Strip everything except digits and the last decimal separator
  const cleaned = text.replace(/[^0-9.,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function parseCurrency(text: string): string {
  if (/US\s*\$|USD/.test(text)) return "USD";
  if (/€|EUR/.test(text)) return "EUR";
  if (/£|GBP/.test(text)) return "GBP";
  if (/¥|CNY|JPY/.test(text)) return "CNY";
  if (/₪|ILS|NIS/.test(text)) return "ILS";
  // Fallback: grab first uppercase letter sequence
  const m = text.match(/([A-Z]{3})/);
  return m ? m[1] : "USD";
}

function parseOrderDate(text: string): string {
  // Input: "Order date: Jan 01, 2024" or "Jan 01, 2024" or similar
  const cleaned = text.replace(/Order\s+date[:\s]*/i, "").trim();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function cleanImageUrl(url: string): string {
  // Normalize AliExpress CDN image URLs to a consistent thumbnail size
  // and strip query parameters for cleaner storage.
  try {
    const u = new URL(url);
    u.search = "";
    // Normalize to 640x640 for consistent quality
    return u.toString().replace(/_\d+x\d+\.\w+$/, "_640x640.jpg");
  } catch {
    return url;
  }
}

function scrapeImageUrl(el: HTMLElement): string {
  // Strategy 1: HTML img tags with lazy-loading support
  // AliExpress uses various lazy-load attributes depending on the component.
  const img = el.querySelector<HTMLImageElement>("img");
  if (img) {
    const lazySrc =
      img.getAttribute("src") ||
      img.getAttribute("data-src") ||
      img.getAttribute("data-lazyload-src") ||
      img.getAttribute("data-lazy-src") ||
      img.getAttribute("data-original") ||
      img.getAttribute("data-origin-src");
    if (lazySrc && /alicdn\.com/i.test(lazySrc)) {
      return cleanImageUrl(lazySrc);
    }
    // Fallback: any img src even if not alicdn
    if (lazySrc) return lazySrc;
  }

  // Strategy 2: CSS background-image on the element or its children
  const targets = [el, ...Array.from(el.querySelectorAll<HTMLElement>("*"))];
  for (const target of targets) {
    const style = target.getAttribute("style") || "";
    const bgMatch = style.match(/url\(['"]?(https?[^'")\s]+)['"]?\)/);
    if (bgMatch) {
      const url = bgMatch[1];
      if (/alicdn\.com/i.test(url)) return cleanImageUrl(url);
      return url;
    }
    // Also check computed background-image
    const computed = window.getComputedStyle(target).backgroundImage;
    if (computed && computed !== "none") {
      const match = computed.match(/url\(['"]?(https?[^'")\s]+)['"]?\)/);
      if (match) {
        const url = match[1];
        if (/alicdn\.com/i.test(url)) return cleanImageUrl(url);
        return url;
      }
    }
  }

  return "";
}

function scrapeItems(orderEl: HTMLElement): ScrapedOrderItem[] {
  const items: ScrapedOrderItem[] = [];
  const itemEls = orderEl.querySelectorAll<HTMLElement>(".order-item-content-body");

  for (const itemEl of Array.from(itemEls)) {
    // Title: prefer title attribute over innerText (handles truncation)
    const titleEl = itemEl.querySelector<HTMLElement>(
      ".order-item-content-info-name span[title]"
    );
    const title =
      titleEl?.getAttribute("title") ||
      titleEl?.innerText.trim() ||
      itemEl.querySelector<HTMLElement>(".order-item-content-info-name")?.innerText.trim() ||
      "";

    // Product URL
    const linkEl = itemEl.querySelector<HTMLAnchorElement>("a");
    const productUrl = linkEl?.href || "";

    // Image URL
    const imgContainerEl = itemEl.querySelector<HTMLElement>(".order-item-content-img");
    const imageUrl = imgContainerEl ? scrapeImageUrl(imgContainerEl) : "";

    // Unit price — first div inside the quantity/price block
    const priceEl = itemEl.querySelector<HTMLElement>(
      ".order-item-content-info-number div:first-child"
    );
    const price = priceEl ? parsePrice(priceEl.innerText) : 0;

    // Quantity — text like "x2" or "2"
    const qtyEl = itemEl.querySelector<HTMLElement>(
      ".order-item-content-info-number-quantity"
    );
    const qtyText = qtyEl?.innerText.trim() || "1";
    const quantity = parseInt(qtyText.replace(/[^0-9]/g, ""), 10) || 1;

    items.push({ title, price, quantity, imageUrl, productUrl });
  }

  return items;
}

function scrapeTracking(orderEl: HTMLElement): {
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
} {
  // Tracking info is shown in the order card for shipped/awaiting-delivery orders.
  // Selectors verified against aliexpress.com/p/order/index.html — re-verify in
  // DevTools if AliExpress ships a UI update.

  // Pattern 1: dedicated logistics text element (shown for shipped/awaiting orders)
  const logisticEl = orderEl.querySelector<HTMLElement>(
    ".order-item-content-opt-logistics, .order-item-logistics, [class*='logistics']"
  );
  if (logisticEl) {
    const text = logisticEl.innerText.trim();
    // Tracking numbers are typically 10–30 alphanumeric chars; extract the first match.
    const match = text.match(/\b([A-Z]{2}[0-9]{8,}[A-Z]{2}|[A-Z0-9]{10,30})\b/);
    if (match) return { trackingNumber: match[1] };
  }

  // Pattern 2: "Track Order" / "Track shipment" link — href often contains orderId
  // and a separate trackId or logisticsNo query param.
  const trackLinks = orderEl.querySelectorAll<HTMLAnchorElement>(
    "a[href*='track'], a[href*='logistic'], a[href*='logistics']"
  );
  for (const link of Array.from(trackLinks)) {
    try {
      const url = new URL(link.href);
      const trackId =
        url.searchParams.get("trackId") ||
        url.searchParams.get("logisticsNo") ||
        url.searchParams.get("tracking");
      if (trackId) return { trackingNumber: trackId };
    } catch {
      // malformed URL — skip
    }
  }

  // Pattern 3: data-* attribute on the order element or its children
  const trackAttr =
    orderEl.getAttribute("data-tracking") ||
    orderEl.querySelector("[data-tracking]")?.getAttribute("data-tracking") ||
    orderEl.querySelector("[data-logistics-no]")?.getAttribute("data-logistics-no");
  if (trackAttr) return { trackingNumber: trackAttr };

  return {};
}

function scrapeOrdersFromPage(): ScrapedOrder[] {
  const orders: ScrapedOrder[] = [];
  const orderEls = document.querySelectorAll<HTMLElement>(".order-item");

  console.log(`[ali-sum] Found ${orderEls.length} order elements on page`);

  for (const orderEl of Array.from(orderEls)) {
    try {
      // --- Order ID and Date ---
      // Both live inside .order-item-header-right-info:
      //   first child  → "Order date: Jan 01, 2024"
      //   last child   → "Order ID: 1234567890123 Copy"
      const headerInfo = orderEl.querySelector<HTMLElement>(
        ".order-item-header-right-info"
      );
      const infoDivs = headerInfo
        ? Array.from(headerInfo.querySelectorAll<HTMLElement>(":scope > div"))
        : [];

      const orderDateStr = infoDivs[0]?.innerText || "";
      const orderIdStr = infoDivs[infoDivs.length - 1]?.innerText || "";

      let aliOrderId = orderIdStr
        .replace(/Order\s+ID[:\s]*/i, "")
        .replace(/Copy/gi, "")
        .trim();

      // Fallback: extract from link href (?orderId=…)
      if (!aliOrderId) {
        const link = orderEl.querySelector<HTMLAnchorElement>(
          "div.order-item-header > div.order-item-header-right > a"
        );
        if (link?.href) {
          try {
            aliOrderId =
              new URL(link.href).searchParams.get("orderId") || "";
          } catch {
            // malformed URL
          }
        }
      }

      if (!aliOrderId) {
        console.warn("[ali-sum] Could not determine order ID, skipping element");
        continue;
      }

      // --- Status ---
      const statusEl = orderEl.querySelector<HTMLElement>(
        ".order-item-header-status-text"
      );
      const status = statusEl?.innerText.trim() || "Unknown";

      // --- Seller name ---
      const storeEl = orderEl.querySelector<HTMLElement>(".order-item-store");
      const sellerName = storeEl?.innerText.trim() || "";

      // --- Items ---
      const items = scrapeItems(orderEl);

      // --- Tracking (only present for shipped / awaiting-delivery orders) ---
      const tracking = scrapeTracking(orderEl);

      // --- Tracking page URL (for detail-page scraping fallback) ---
      const trackBtn = Array.from(orderEl.querySelectorAll<HTMLAnchorElement>("a.order-item-btn"))
        .find((a) => /track\s*order/i.test(a.textContent || ""));
      const trackingPageUrl = trackBtn?.href || undefined;

      // --- Total amount ---
      // .order-item-content-opt-price-total contains currency + amount as child spans
      const totalEls = orderEl.querySelectorAll<HTMLElement>(
        ".order-item-content-opt-price-total span"
      );
      const totalText = Array.from(totalEls)
        .map((e) => e.innerText)
        .join("");
      const totalAmount = totalText
        ? parsePrice(totalText)
        : items.reduce((s, i) => s + i.price * i.quantity, 0);
      const currency = totalText ? parseCurrency(totalText) : "USD";

      orders.push({
        aliOrderId,
        orderDate: parseOrderDate(orderDateStr),
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

function findLoadMoreButton(): HTMLButtonElement | null {
  // The order list uses a "View orders" / "Load more" button instead of traditional pagination.
  // Selector confirmed by greasyfork #559652 "AliExpress auto-load more orders".
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    "button.comet-btn.comet-btn-large.comet-btn-borderless"
  );
  for (const btn of Array.from(buttons)) {
    if (btn.disabled) continue;
    const label = btn.querySelector("span")?.textContent || btn.textContent || "";
    if (/view\s+orders|load\s+more|next/i.test(label)) {
      return btn;
    }
  }
  return null;
}

function hasNextPage(): boolean {
  return findLoadMoreButton() !== null;
}

async function clickLoadMore(): Promise<boolean> {
  const btn = findLoadMoreButton();
  if (!btn) return false;

  // Scroll to the button first, pause, then click — like a real user
  scrollToElement(btn);
  await humanDelay(1500, 4000);

  const beforeCount = document.querySelectorAll(".order-item").length;
  btn.click();

  // Wait for new order items to appear, or timeout.
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 300));
    const nowCount = document.querySelectorAll(".order-item").length;
    if (nowCount > beforeCount) return true;
  }
  return false;
}

function scrapeTrackingDetailPage(): {
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
} {
  const trackingEl = document.querySelector<HTMLElement>('[class*="logistic-info-v2--mailNoValue"]');
  const carrierEl = document.querySelector<HTMLElement>('[class*="logistic-info-v2--carrierTitle"]');
  const deliveryEl = document.querySelector<HTMLElement>('[class*="arrival-time-v2--title"]');

  const trackingNumber = trackingEl?.innerText.trim() || undefined;
  const carrier = carrierEl?.innerText.trim() || undefined;

  let estimatedDelivery: string | undefined;
  if (deliveryEl) {
    const text = deliveryEl.innerText.trim();
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

function parsePopoverDeliveryDate(text: string): string | undefined {
  // Format: "May 14, 2026" — already includes year
  const match = text.match(/([A-Z][a-z]{2,8}\.?\s+\d{1,2},?\s*\d{4})/);
  if (match) {
    const d = new Date(match[1]);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  // Fallback: no year, e.g. "May 14"
  const noYear = text.match(/([A-Z][a-z]{2,8}\.?\s+\d{1,2})/);
  if (noYear) {
    const cleaned = noYear[1].replace(".", "");
    const d = new Date(`${cleaned}, ${new Date().getFullYear()}`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return undefined;
}

function scrapePopoverContent(): {
  trackingNumber?: string;
  estimatedDelivery?: string;
} {
  const popover = document.querySelector<HTMLElement>(".order-track-popover");
  if (!popover) return {};

  // Tracking number: <p class="tracking-number-title">Tracking number:&nbsp;<span>XXX</span></p>
  const trackingEl = popover.querySelector<HTMLElement>(".tracking-number-title span");
  const trackingNumber = trackingEl?.innerText.trim() || undefined;

  // Estimated delivery: first <p> inside .order-track-popover-title
  // Format: "Estimated delivery date:&nbsp;<span>May 14, 2026</span>"
  const titleDiv = popover.querySelector<HTMLElement>(".order-track-popover-title");
  let estimatedDelivery: string | undefined;
  if (titleDiv) {
    const firstP = titleDiv.querySelector<HTMLElement>("p:not(.tracking-number-title)");
    const dateSpan = firstP?.querySelector<HTMLElement>("span");
    const dateText = dateSpan?.innerText.trim() || firstP?.innerText.trim() || "";
    if (dateText) {
      estimatedDelivery = parsePopoverDeliveryDate(dateText);
    }
  }

  return { trackingNumber, estimatedDelivery };
}

async function scrapeTrackingFromPopovers(): Promise<{
  trackingMap: Record<string, { trackingNumber?: string; estimatedDelivery?: string }>;
  captchaDetected: boolean;
}> {
  const trackingMap: Record<string, { trackingNumber?: string; estimatedDelivery?: string }> = {};
  const orderEls = document.querySelectorAll<HTMLElement>(".order-item");

  const orderArr = Array.from(orderEls);
  for (let i = 0; i < orderArr.length; i++) {
    const orderEl = orderArr[i];

    // Check for CAPTCHA before each hover
    if (detectCaptcha()) {
      console.warn("[ali-sum] CAPTCHA detected, aborting popover scraping");
      return { trackingMap, captchaDetected: true };
    }

    // Extract order ID
    const headerInfo = orderEl.querySelector<HTMLElement>(".order-item-header-right-info");
    const infoDivs = headerInfo
      ? Array.from(headerInfo.querySelectorAll<HTMLElement>(":scope > div"))
      : [];
    const orderIdStr = infoDivs[infoDivs.length - 1]?.innerText || "";
    const aliOrderId = orderIdStr
      .replace(/Order\s+ID[:\s]*/i, "")
      .replace(/Copy/gi, "")
      .trim();
    if (!aliOrderId) continue;

    // Find "Track order" button
    const trackBtn = Array.from(orderEl.querySelectorAll<HTMLAnchorElement>("a.order-item-btn"))
      .find((a) => /track\s*order/i.test(a.textContent || ""));
    if (!trackBtn) continue;

    // Occasional idle pause — ~20% chance to "take a break" (4-9s)
    if (Math.random() < 0.2) {
      randomScroll();
      await humanDelay(4000, 9000);
    }

    // Scroll the order into view before hovering
    scrollToElement(trackBtn);
    await humanDelay(1000, 2500);

    // Hover to trigger popover
    trackBtn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    trackBtn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    // Wait for popover to render (it's lazy-loaded via React portal)
    const deadline = Date.now() + 3000;
    let popover: HTMLElement | null = null;
    while (Date.now() < deadline) {
      popover = document.querySelector<HTMLElement>(".order-track-popover");
      if (popover) break;
      await new Promise((r) => setTimeout(r, 200));
    }

    if (popover) {
      // Brief pause to "read" the popover content
      await humanDelay(500, 1500);
      const data = scrapePopoverContent();
      if (data.trackingNumber || data.estimatedDelivery) {
        trackingMap[aliOrderId] = data;
      }
    }

    // Dismiss popover
    trackBtn.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
    trackBtn.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));

    // Randomized pause between hovers (2.5–6s)
    await humanDelay(2500, 6000);
  }

  return { trackingMap, captchaDetected: false };
}

// Listen for scrape requests from the service worker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SCRAPE_ORDERS") {
    const orders = scrapeOrdersFromPage();
    sendResponse({
      type: "SCRAPE_RESULT",
      orders,
      hasNextPage: hasNextPage(),
    });
    return false;
  }

  if (message.type === "LOAD_MORE") {
    clickLoadMore().then((loaded) => {
      sendResponse({ type: "LOAD_MORE_RESULT", loaded, hasNextPage: hasNextPage() });
    });
    return true; // async response
  }

  if (message.type === "SCRAPE_TRACKING_POPOVERS") {
    scrapeTrackingFromPopovers().then(({ trackingMap, captchaDetected }) => {
      sendResponse({ type: "SCRAPE_TRACKING_POPOVERS_RESULT", trackingMap, captchaDetected });
    });
    return true; // async response
  }

  if (message.type === "SCRAPE_TRACKING_DETAIL") {
    // Tracking page is client-rendered — poll for elements to appear.
    const deadline = Date.now() + 10000;
    const poll = async () => {
      while (Date.now() < deadline) {
        if (detectCaptcha()) {
          return { ...scrapeTrackingDetailPage(), captchaDetected: true };
        }
        const el = document.querySelector(
          '[class*="logistic-info-v2--mailNoValue"], [class*="logistic-info-v2--carrierTitle"]'
        );
        if (el) break;
        await new Promise((r) => setTimeout(r, 300));
      }
      return { ...scrapeTrackingDetailPage(), captchaDetected: false };
    };
    poll().then((result) => {
      sendResponse({ type: "SCRAPE_TRACKING_DETAIL_RESULT", ...result });
    });
    return true; // async response
  }

  return false;
});

console.log("[ali-sum] Content script loaded on AliExpress order page");
