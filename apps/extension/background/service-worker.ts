import { syncOrders, getToken, fetchWatermark } from "../lib/api-client";
import { SyncProgress, ScrapedOrder, TrackingDetail } from "../lib/types";
import {
  applyTrackingMap,
  getOrderIdsToEnrich,
  selectOrdersNeedingTrackingDetail,
  selectOrdersToSync,
  type TrackingMap,
} from "../lib/tracking-sync";

let pendingFullSync = false;

let currentProgress: SyncProgress = {
  status: "idle",
  currentPage: 0,
  totalPages: null,
  ordersFound: 0,
};

function broadcastProgress(progress: SyncProgress) {
  currentProgress = progress;
  chrome.runtime.sendMessage({ type: "SYNC_PROGRESS", progress }).catch(() => {
    // Popup may not be open — ignore
  });
}

function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    const listener = (tid: number, info: chrome.tabs.TabChangeInfo) => {
      if (tid === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function findOrOpenOrdersTab(): Promise<number> {
  const tabs = await chrome.tabs.query({ url: "https://*.aliexpress.com/p/order/*" });
  if (tabs.length > 0 && tabs[0].id) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    return tabs[0].id;
  }

  const tab = await chrome.tabs.create({
    url: "https://www.aliexpress.com/p/order/index.html",
    active: true,
  });
  await waitForTabLoad(tab.id!);

  return tab.id!;
}

function sendScrapeMessage(
  tabId: number,
): Promise<{ orders: ScrapedOrder[]; hasNextPage: boolean }> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type: "SCRAPE_ORDERS" }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

function sendLoadMoreMessage(
  tabId: number,
): Promise<{ loaded: boolean; hasNextPage: boolean }> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type: "LOAD_MORE" }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

function sendTrackingPopoversMessage(
  tabId: number,
  allowedOrderIds: Set<string>,
): Promise<{
  trackingMap: TrackingMap;
  captchaDetected?: boolean;
}> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      { type: "SCRAPE_TRACKING_POPOVERS", allowedOrderIds: Array.from(allowedOrderIds) },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response || { trackingMap: {} });
      },
    );
  });
}

function sendTrackingDetailMessageRaw(
  tabId: number,
): Promise<TrackingDetail & { captchaDetected?: boolean }> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type: "SCRAPE_TRACKING_DETAIL" }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response || {});
    });
  });
}

async function sendTrackingDetailMessage(
  tabId: number,
): Promise<TrackingDetail & { captchaDetected?: boolean }> {
  try {
    return await sendTrackingDetailMessageRaw(tabId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/Receiving end does not exist|Could not establish connection/i.test(msg)) {
      throw err;
    }
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["dist/scraper.js"],
    });
    return sendTrackingDetailMessageRaw(tabId);
  }
}


async function scrapeTab(tabId: number): Promise<{ orders: ScrapedOrder[]; hasNextPage: boolean }> {
  try {
    return await sendScrapeMessage(tabId);
  } catch (err) {
    // Content script likely isn't loaded (e.g. tab was open before extension reload).
    // Inject it on-demand and retry once.
    const msg = err instanceof Error ? err.message : String(err);
    if (!/Receiving end does not exist|Could not establish connection/i.test(msg)) {
      throw err;
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["dist/scraper.js"],
    });

    return sendScrapeMessage(tabId);
  }
}

const MAX_PAGES = 200;
const BATCH_SIZE = 50;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function humanDelay(minMs: number, maxMs: number): Promise<void> {
  return new Promise((r) => setTimeout(r, randomBetween(minMs, maxMs)));
}

async function startSync() {
  try {
    broadcastProgress({ status: "syncing", currentPage: 1, totalPages: null, ordersFound: 0 });

    const tabId = await findOrOpenOrdersTab();
    const watermark = pendingFullSync ? null : await fetchWatermark();
    pendingFullSync = false;
    const orderStates = watermark?.orderStates ?? new Map();
    let hitWatermark = false;
    const ordersById = new Map<string, ScrapedOrder>();
    const uploadedIds = new Set<string>();
    let popoverCaptcha = false;
    let page = 1;
    let hasMore = true;

    // Enrich + upload orders accumulated since the last flush, so partial
    // progress reaches the backend even if the scan crashes or hits a CAPTCHA.
    async function flushBatch() {
      const batch = Array.from(ordersById.values()).filter((o) => !uploadedIds.has(o.aliOrderId));
      if (batch.length === 0) return;

      const orderIdsToEnrich = getOrderIdsToEnrich(batch, orderStates);
      if (orderIdsToEnrich.size > 0 && !popoverCaptcha) {
        const { trackingMap, captchaDetected } = await sendTrackingPopoversMessage(tabId, orderIdsToEnrich);
        popoverCaptcha = captchaDetected === true;
        applyTrackingMap(batch, trackingMap);
      }

      const { ordersToSync } = selectOrdersToSync(batch, orderStates);
      for (const order of batch) uploadedIds.add(order.aliOrderId);
      if (ordersToSync.length === 0) return;

      await syncOrders(ordersToSync, (uploaded, total) => {
        broadcastProgress({
          status: "syncing",
          currentPage: page,
          totalPages: null,
          ordersFound: ordersById.size,
          message: `Uploading batch... (${uploaded}/${total})`,
        });
      });
    }

    while (hasMore && page <= MAX_PAGES) {
      broadcastProgress({
        status: "syncing",
        currentPage: page,
        totalPages: null,
        ordersFound: ordersById.size,
      });

      const result = await scrapeTab(tabId);
      const sizeBefore = ordersById.size;
      for (const order of result.orders) {
        if (order.aliOrderId) ordersById.set(order.aliOrderId, order);
      }
      const addedThisPage = ordersById.size - sizeBefore;
      hasMore = result.hasNextPage;

      if (ordersById.size - uploadedIds.size >= BATCH_SIZE) {
        await flushBatch();
      }

      if (watermark?.aliOrderId && result.orders.some((o) => o.aliOrderId === watermark.aliOrderId)) {
        hitWatermark = true;
        break;
      }

      if (!hasMore) break;

      // Random pause between pages (3–8s) to mimic reading/scrolling
      await humanDelay(3000, 8000);

      // Click "View orders" / "Load more" and wait for new items to render.
      const loadMore = await sendLoadMoreMessage(tabId);
      hasMore = loadMore.hasNextPage;

      // Stop if the button didn't actually produce new items AND we also
      // didn't pick up any new orders this iteration — prevents infinite loops
      // if AliExpress changes UI or the button is disabled.
      if (!loadMore.loaded && addedThisPage === 0) {
        break;
      }

      page++;
    }

    if (watermark && !hitWatermark && page > MAX_PAGES) {
      console.warn(
        `[ali-sum] Watermark order ${watermark.aliOrderId} not seen after ${MAX_PAGES} pages — treating as full scan.`,
      );
    }

    await flushBatch();

    const allOrders = Array.from(ordersById.values());
    const orderIdsToEnrich = getOrderIdsToEnrich(allOrders, orderStates);

    // Enrich orders with tracking details by navigating to each order's
    // tracking page. Only orders that have a "Track order" link are visited.
    let captchaDetected = popoverCaptcha;
    const enrichableOrders = allOrders.filter((o) => orderIdsToEnrich.has(o.aliOrderId));
    const ordersWithTracking = selectOrdersNeedingTrackingDetail(enrichableOrders);
    const ordersTouchedByFallback: ScrapedOrder[] = [];

    if (!captchaDetected && ordersWithTracking.length > 0) {
      // Open a dedicated tab for tracking page navigation
      const trackTab = await chrome.tabs.create({ active: false });
      const trackTabId = trackTab.id!;

      for (let i = 0; i < ordersWithTracking.length; i++) {
        // Random pause between tracking page navigations (4–10s)
        if (i > 0) await humanDelay(4000, 10000);

        const order = ordersWithTracking[i];

        broadcastProgress({
          status: "syncing",
          currentPage: page,
          totalPages: page,
          ordersFound: allOrders.length,
          message: `Fetching tracking ${i + 1}/${ordersWithTracking.length}...`,
        });

        try {
          await chrome.tabs.update(trackTabId, { url: order.trackingPageUrl });
          await waitForTabLoad(trackTabId);

          const detail = await sendTrackingDetailMessage(trackTabId);
          if ((detail as TrackingDetail & { captchaDetected?: boolean }).captchaDetected) {
            captchaDetected = true;
            break;
          }
          if (detail.trackingNumber) order.trackingNumber = detail.trackingNumber;
          if (detail.carrier) order.carrier = detail.carrier;
          if (detail.estimatedDelivery) order.estimatedDelivery = detail.estimatedDelivery;
          ordersTouchedByFallback.push(order);
        } catch (err) {
          console.warn(`[ali-sum] Failed to fetch tracking for ${order.aliOrderId}:`, err);
        }
      }

      await chrome.tabs.remove(trackTabId);
    }

    const { ordersToSync, skippedUnchanged } = selectOrdersToSync(ordersTouchedByFallback, orderStates);

    if (ordersToSync.length > 0) {
      await syncOrders(ordersToSync, (uploaded, total) => {
        broadcastProgress({
          status: "syncing",
          currentPage: page,
          totalPages: page,
          ordersFound: allOrders.length,
          message: `Uploading orders to server... (${uploaded}/${total})`,
        });
      });
    }

    await chrome.storage.local.set({
      lastSync: new Date().toISOString(),
      orderCount: allOrders.length,
    });

    const captchaSuffix = captchaDetected
      ? " — CAPTCHA detected, some tracking info may be missing. Solve it in the browser and re-sync."
      : "";
    const watermarkSuffix = hitWatermark ? " — stopped at last delivered order" : "";
    const message =
      ordersToSync.length === 0 && skippedUnchanged > 0
        ? `Already up to date (${skippedUnchanged} order${skippedUnchanged !== 1 ? "s" : ""} unchanged)${captchaSuffix}${watermarkSuffix}`
        : ordersToSync.length > 0
          ? `${ordersToSync.length} changed order${ordersToSync.length !== 1 ? "s" : ""} synced${captchaSuffix}${watermarkSuffix}`
          : captchaDetected
            ? "CAPTCHA detected — solve it in the browser and re-sync for tracking info"
            : undefined;

    broadcastProgress({
      status: "completed",
      currentPage: page,
      totalPages: page,
      ordersFound: allOrders.length,
      message,
    });
    // Reset stored reference so future GET_STATUS calls show accurate count.
    currentProgress = {
      status: "completed",
      currentPage: page,
      totalPages: page,
      ordersFound: allOrders.length,
    };
  } catch (error) {
    broadcastProgress({
      status: "failed",
      currentPage: currentProgress.currentPage,
      totalPages: null,
      ordersFound: currentProgress.ordersFound,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Seed a build-time dev token into storage if none is set yet. Baked into the
// bundle via `DEV_TOKEN` in apps/extension/.env — intended for local dev only.
if (__DEV_TOKEN__) {
  chrome.storage.local.get("token").then((result) => {
    if (!result.token) {
      chrome.storage.local.set({ token: __DEV_TOKEN__ });
    }
  });
}

// Listen for handoff messages from the web app (externally_connectable)
chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SET_TOKEN" && typeof message.token === "string") {
    chrome.storage.local.set({ token: message.token }).then(() => {
      sendResponse({ ok: true });
    });
    return true; // Async response
  }
  sendResponse({ ok: false, error: "Unknown message" });
  return false;
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "START_SYNC") {
    pendingFullSync = message.fullSync === true;
    startSync();
    sendResponse({ ok: true });
  }

  if (message.type === "GET_STATUS") {
    chrome.storage.local.get(["lastSync", "orderCount", "token"]).then((result) => {
      sendResponse({
        type: "STATUS",
        lastSync: result.lastSync || null,
        orderCount: result.orderCount || 0,
        connected: !!result.token,
      });
    });
    return true; // Async response
  }

  return false;
});
