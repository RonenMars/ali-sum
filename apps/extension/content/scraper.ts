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

function scrapeImageUrl(el: HTMLElement): string {
  // Image is often set as background-image on a div
  const style = el.getAttribute("style") || "";
  const bgMatch = style.match(/url\(['"]?(https?[^'")\s]+)['"]?\)/);
  if (bgMatch) return bgMatch[1];
  const img = el.querySelector<HTMLImageElement>("img");
  return img?.src || "";
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

  if (message.type === "SCRAPE_TRACKING_DETAIL") {
    // Tracking page is client-rendered — poll for elements to appear.
    const deadline = Date.now() + 10000;
    const poll = async () => {
      while (Date.now() < deadline) {
        const el = document.querySelector(
          '[class*="logistic-info-v2--mailNoValue"], [class*="logistic-info-v2--carrierTitle"]'
        );
        if (el) break;
        await new Promise((r) => setTimeout(r, 300));
      }
      return scrapeTrackingDetailPage();
    };
    poll().then((result) => {
      sendResponse({ type: "SCRAPE_TRACKING_DETAIL_RESULT", ...result });
    });
    return true; // async response
  }

  return false;
});

console.log("[ali-sum] Content script loaded on AliExpress order page");
