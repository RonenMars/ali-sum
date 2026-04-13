// Popup script — vanilla TS (no React needed for this simple UI)

const $ = (id: string) => document.getElementById(id)!;

const statusText = $("status-text");
const lastSyncEl = $("last-sync");
const orderCountEl = $("order-count");
const btnSync = $("btn-sync") as HTMLButtonElement;
const btnDashboard = $("btn-dashboard") as HTMLButtonElement;
const btnConnect = $("btn-connect") as HTMLButtonElement;
const connectPrompt = $("connect-prompt");
const mainView = $("main-view");
const progressContainer = $("progress-container");
const progressText = $("progress-text");
const errorContainer = $("error-container");
const errorText = $("error-text");

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

async function loadStatus() {
  const result = await chrome.storage.local.get(["token", "lastSync", "orderCount"]);

  if (!result.token) {
    connectPrompt.style.display = "block";
    mainView.style.display = "none";
    return;
  }

  connectPrompt.style.display = "none";
  mainView.style.display = "block";

  statusText.textContent = "Connected";
  statusText.className = "value connected";

  if (result.lastSync) {
    lastSyncEl.textContent = formatDate(result.lastSync);
  }
  if (result.orderCount) {
    orderCountEl.textContent = String(result.orderCount);
  }
}

// Listen for sync progress updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SYNC_PROGRESS") {
    const { progress } = message;

    if (progress.status === "syncing") {
      btnSync.disabled = true;
      btnSync.textContent = "Syncing...";
      statusText.textContent = "Syncing";
      statusText.className = "value syncing";
      progressContainer.style.display = "block";
      errorContainer.style.display = "none";
      progressText.textContent = `Scanning page ${progress.currentPage}... (${progress.ordersFound} orders found)`;
    }

    if (progress.status === "completed") {
      btnSync.disabled = false;
      btnSync.textContent = "Sync Now";
      statusText.textContent = "Connected";
      statusText.className = "value connected";
      progressContainer.style.display = "none";
      loadStatus(); // Refresh counts
    }

    if (progress.status === "failed") {
      btnSync.disabled = false;
      btnSync.textContent = "Sync Now";
      statusText.textContent = "Error";
      statusText.className = "value disconnected";
      progressContainer.style.display = "none";
      errorContainer.style.display = "block";
      errorText.textContent = progress.error || "Sync failed";
    }
  }
});

btnSync.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "START_SYNC" });
});

btnDashboard.addEventListener("click", async () => {
  const result = await chrome.storage.local.get("apiBase");
  const base = result.apiBase || __API_BASE__;
  chrome.tabs.create({ url: base });
});

btnConnect.addEventListener("click", async () => {
  const result = await chrome.storage.local.get("apiBase");
  const base = result.apiBase || __API_BASE__;
  chrome.tabs.create({ url: `${base}/login` });
});

// Initialize
loadStatus();
