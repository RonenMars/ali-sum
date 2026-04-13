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
  // Wait for page to load
  await new Promise<void>((resolve) => {
    const listener = (tabId: number, info: chrome.tabs.TabChangeInfo) => {
      if (tabId === tab.id && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });

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

async function startSync() {
  try {
    broadcastProgress({ status: "syncing", currentPage: 1, totalPages: null, ordersFound: 0 });

    const tabId = await findOrOpenOrdersTab();
    const allOrders: ScrapedOrder[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      broadcastProgress({
        status: "syncing",
        currentPage: page,
        totalPages: null,
        ordersFound: allOrders.length,
      });

      const result = await scrapeTab(tabId);
      allOrders.push(...result.orders);
      hasMore = result.hasNextPage;

      if (hasMore) {
        // TODO: Click next page button and wait for load
        page++;
      }
    }

    if (allOrders.length > 0) {
      await syncOrders(allOrders);
    }

    await chrome.storage.local.set({
      lastSync: new Date().toISOString(),
      orderCount: allOrders.length,
    });

    broadcastProgress({
      status: "completed",
      currentPage: page,
      totalPages: page,
      ordersFound: allOrders.length,
    });
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
