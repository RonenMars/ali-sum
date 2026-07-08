import type { Page } from "playwright";
import type { ScrapedOrder } from "../../extension/lib/types";
import {
  applyTrackingMap,
  getOrderIdsToEnrich,
  selectOrdersNeedingTrackingDetail,
  selectOrdersToSync,
} from "../../extension/lib/tracking-sync";
import {
  scrapeOrdersFromPage,
  hasNextPage,
  clickLoadMore,
  scrapeTrackingFromPopovers,
  scrapeTrackingDetailPage,
  detectCaptcha,
  humanDelay,
} from "../../extension/content/scraper-core";
import { createPlaywrightAdapter } from "./adapters/playwright-adapter";
import { fetchWatermark, syncOrders } from "./api-client";
import { logger } from "./logger";

const MAX_PAGES = 200;
const ORDERS_URL = "https://www.aliexpress.com/p/order/index.html";

export async function runSync(page: Page, options: { fullSync: boolean }): Promise<void> {
  const adapter = createPlaywrightAdapter(page);

  await page.goto(ORDERS_URL, { waitUntil: "domcontentloaded" });

  const watermark = options.fullSync ? null : await fetchWatermark();
  const orderStates = watermark?.orderStates ?? new Map();
  let hitWatermark = false;
  const ordersById = new Map<string, ScrapedOrder>();
  let pageNum = 1;
  let hasMore = true;

  while (hasMore && pageNum <= MAX_PAGES) {
    logger.info({ pageNum, ordersSoFar: ordersById.size }, "Scanning page");

    const orders = await scrapeOrdersFromPage(adapter);
    const sizeBefore = ordersById.size;
    for (const order of orders) {
      if (order.aliOrderId) ordersById.set(order.aliOrderId, order);
    }
    const addedThisPage = ordersById.size - sizeBefore;
    hasMore = await hasNextPage(adapter);

    if (watermark?.aliOrderId && orders.some((o) => o.aliOrderId === watermark.aliOrderId)) {
      logger.info({ aliOrderId: watermark.aliOrderId }, "Hit watermark order, stopping pagination");
      hitWatermark = true;
      break;
    }

    if (!hasMore) break;

    // Random pause between pages (3–8s) to mimic reading/scrolling
    await humanDelay(3000, 8000);

    const loaded = await clickLoadMore(adapter);
    hasMore = await hasNextPage(adapter);

    // Stop if the button didn't actually produce new items AND we also didn't
    // pick up any new orders this iteration — prevents infinite loops if
    // AliExpress changes UI or the button is disabled.
    if (!loaded && addedThisPage === 0) {
      logger.debug({ pageNum }, "No new orders and load-more produced nothing, stopping pagination");
      break;
    }

    pageNum++;
  }

  if (watermark && !hitWatermark && pageNum > MAX_PAGES) {
    logger.warn(
      { aliOrderId: watermark.aliOrderId, maxPages: MAX_PAGES },
      "Watermark order not seen after max pages — treating as full scan",
    );
  }

  const allOrders = Array.from(ordersById.values());
  const orderIdsToEnrich = getOrderIdsToEnrich(allOrders, orderStates);

  logger.info(
    { totalScanned: allOrders.length, toEnrich: orderIdsToEnrich.size },
    "Finished scanning order list",
  );

  // Enrich orders with tracking details from list-page hover popovers first.
  let popoverCaptcha = false;
  if (orderIdsToEnrich.size > 0) {
    logger.info("Fetching tracking info from popovers...");
    const trackingResult = await scrapeTrackingFromPopovers(adapter, orderIdsToEnrich);
    popoverCaptcha = trackingResult.captchaDetected;
    if (popoverCaptcha) logger.warn("CAPTCHA detected while fetching popover tracking info");
    applyTrackingMap(allOrders, trackingResult.trackingMap);
  }

  // Fallback: navigate to each remaining order's tracking page directly.
  const enrichableOrders = allOrders.filter((o) => orderIdsToEnrich.has(o.aliOrderId));
  const ordersNeedingTracking = selectOrdersNeedingTrackingDetail(enrichableOrders);

  let captchaDetected = popoverCaptcha;
  if (!captchaDetected && ordersNeedingTracking.length > 0) {
    logger.info({ count: ordersNeedingTracking.length }, "Fetching tracking detail pages");
    for (let i = 0; i < ordersNeedingTracking.length; i++) {
      if (i > 0) await humanDelay(4000, 10000);

      const order = ordersNeedingTracking[i];
      try {
        await page.goto(order.trackingPageUrl!, { waitUntil: "domcontentloaded" });
        if (await detectCaptcha(adapter)) {
          logger.warn({ aliOrderId: order.aliOrderId }, "CAPTCHA detected on tracking detail page, aborting tracking fetch");
          captchaDetected = true;
          break;
        }
        const detail = await scrapeTrackingDetailPage(adapter);
        if (detail.trackingNumber) order.trackingNumber = detail.trackingNumber;
        if (detail.carrier) order.carrier = detail.carrier;
        if (detail.estimatedDelivery) order.estimatedDelivery = detail.estimatedDelivery;
      } catch (err) {
        logger.warn({ err, aliOrderId: order.aliOrderId }, "Failed to fetch tracking detail page");
      }
    }
  }

  const { ordersToSync, skippedUnchanged } = selectOrdersToSync(allOrders, orderStates);

  logger.info(
    { toSync: ordersToSync.length, skippedUnchanged },
    "Prepared orders for upload",
  );

  let created = 0;
  let serverSkipped = 0;
  if (ordersToSync.length > 0) {
    logger.info({ count: ordersToSync.length }, "Uploading orders to backend");
    const result = await syncOrders(ordersToSync, (uploaded, total) => {
      logger.debug({ uploaded, total }, "Upload progress");
    });
    created = result.created;
    serverSkipped = result.skipped;
  } else if (allOrders.length > 0) {
    logger.info("Already up to date; skipping backend upload");
  }

  if (captchaDetected) {
    logger.warn("CAPTCHA detected during this run — some tracking info may be missing. Solve it by running with --login-only and re-sync.");
  }
  if (hitWatermark) {
    logger.info("Stopped at last delivered order (watermark)");
  }

  logger.info(
    { created, serverSkipped, uploaded: ordersToSync.length, skippedUnchanged },
    ordersToSync.length === 0 && skippedUnchanged > 0 ? "Already up to date" : "Sync complete",
  );
}
