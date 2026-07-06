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
// on aliexpress.com/p/order/index.html and re-verify the selectors in
// scraper-recipe.json.

import { domAdapter } from "./adapters/dom-adapter";
import {
  scrapeOrdersFromPage,
  hasNextPage,
  clickLoadMore,
  scrapeTrackingFromPopovers,
  scrapeTrackingDetailPage,
  detectCaptcha,
} from "./scraper-core";

// Listen for scrape requests from the service worker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SCRAPE_ORDERS") {
    scrapeOrdersFromPage(domAdapter).then(async (orders) => {
      sendResponse({
        type: "SCRAPE_RESULT",
        orders,
        hasNextPage: await hasNextPage(domAdapter),
      });
    });
    return true; // async response
  }

  if (message.type === "LOAD_MORE") {
    clickLoadMore(domAdapter).then(async (loaded) => {
      sendResponse({ type: "LOAD_MORE_RESULT", loaded, hasNextPage: await hasNextPage(domAdapter) });
    });
    return true; // async response
  }

  if (message.type === "SCRAPE_TRACKING_POPOVERS") {
    scrapeTrackingFromPopovers(domAdapter).then(({ trackingMap, captchaDetected }) => {
      sendResponse({ type: "SCRAPE_TRACKING_POPOVERS_RESULT", trackingMap, captchaDetected });
    });
    return true; // async response
  }

  if (message.type === "SCRAPE_TRACKING_DETAIL") {
    // Tracking page is client-rendered — poll for elements to appear.
    const deadline = Date.now() + 10000;
    const poll = async () => {
      while (Date.now() < deadline) {
        if (await detectCaptcha(domAdapter)) {
          return { ...(await scrapeTrackingDetailPage(domAdapter)), captchaDetected: true };
        }
        const el = document.querySelector(
          '[class*="logistic-info-v2--mailNoValue"], [class*="logistic-info-v2--carrierTitle"]'
        );
        if (el) break;
        await new Promise((r) => setTimeout(r, 300));
      }
      return { ...(await scrapeTrackingDetailPage(domAdapter)), captchaDetected: false };
    };
    poll().then((result) => {
      sendResponse({ type: "SCRAPE_TRACKING_DETAIL_RESULT", ...result });
    });
    return true; // async response
  }

  return false;
});

console.log("[ali-sum] Content script loaded on AliExpress order page");
