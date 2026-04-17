import { syncOrders, getToken } from "../lib/api-client";
import { SyncProgress, ScrapedOrder } from "../lib/types";

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

function sendTrackingDetailMessage(
  tabId: number,
): Promise<{ trackingNumber?: string; carrier?: string; estimatedDelivery?: string }> {
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

async function startSync() {
  try {
    broadcastProgress({ status: "syncing", currentPage: 1, totalPages: null, ordersFound: 0 });

    const tabId = await findOrOpenOrdersTab();
    const ordersById = new Map<string, ScrapedOrder>();
    let page = 1;
    let hasMore = true;

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

      if (!hasMore) break;

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

    const allOrders = Array.from(ordersById.values());

    // Enrich orders with tracking details from individual tracking pages.
    // Only fetch tracking for orders that are likely in-transit.
    const trackableOrders = allOrders.filter((o) =>
      /awaiting delivery|shipped|in transit|on the way/i.test(o.status)
    );

    if (trackableOrders.length > 0) {
      broadcastProgress({
        status: "syncing",
        currentPage: page,
        totalPages: page,
        ordersFound: allOrders.length,
        message: `Fetching tracking details (0/${trackableOrders.length})...`,
      });

      for (let i = 0; i < trackableOrders.length; i++) {
        const order = trackableOrders[i];
        try {
          await chrome.tabs.update(tabId, {
            url: `https://www.aliexpress.com/p/tracking/index.html?tradeOrderId=${order.aliOrderId}`,
          });
          await waitForTabLoad(tabId);
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ["dist/scraper.js"],
          });
          const tracking = await sendTrackingDetailMessage(tabId);
          if (tracking.trackingNumber) order.trackingNumber = tracking.trackingNumber;
          if (tracking.carrier) order.carrier = tracking.carrier;
          if (tracking.estimatedDelivery) order.estimatedDelivery = tracking.estimatedDelivery;
        } catch (err) {
          console.warn(`[ali-sum] Failed to fetch tracking for order ${order.aliOrderId}:`, err);
        }

        broadcastProgress({
          status: "syncing",
          currentPage: page,
          totalPages: page,
          ordersFound: allOrders.length,
          message: `Fetching tracking details (${i + 1}/${trackableOrders.length})...`,
        });
      }
    }

    broadcastProgress({
      status: "syncing",
      currentPage: page,
      totalPages: page,
      ordersFound: allOrders.length,
      message: `Uploading ${allOrders.length} orders to server...`,
    });

    let created = 0;
    let skipped = 0;
    if (allOrders.length > 0) {
      const result = await syncOrders(allOrders);
      created = result.created;
      skipped = result.skipped;
    }

    await chrome.storage.local.set({
      lastSync: new Date().toISOString(),
      orderCount: allOrders.length,
    });

    const message =
      created === 0 && skipped > 0
        ? `Already up to date (${skipped} order${skipped !== 1 ? "s" : ""} already synced)`
        : created > 0
          ? `${created} new order${created !== 1 ? "s" : ""} synced`
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
