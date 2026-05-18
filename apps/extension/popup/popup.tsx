// Popup script — vanilla TS (no React needed for this simple UI)
import { whoami } from "../lib/api-client";

const $ = (id: string) => document.getElementById(id)!;

const statusText = $("status-text");
const lastSyncEl = $("last-sync");
const orderCountEl = $("order-count");
const btnSync = $("btn-sync") as HTMLButtonElement;
const linkFullSync = $("link-full-sync") as HTMLAnchorElement;
const btnDashboard = $("btn-dashboard") as HTMLButtonElement;
const btnConnect = $("btn-connect") as HTMLButtonElement;
const btnDisconnect = $("btn-disconnect") as HTMLButtonElement;
const btnSaveToken = $("btn-save-token") as HTMLButtonElement;
const tokenInput = $("token-input") as HTMLInputElement;
const tokenError = $("token-error");
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

  // Verify the stored token is still valid against the backend
  const user = await whoami();
  if (!user) {
    // Token invalid or expired — clear it and show connect prompt
    await chrome.storage.local.remove(["token", "lastSync", "orderCount"]);
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
      errorText.className = "error";
      progressText.textContent = progress.message
        ? progress.message
        : `Scanning page ${progress.currentPage}... (${progress.ordersFound} orders found)`;
    }

    if (progress.status === "completed") {
      btnSync.disabled = false;
      btnSync.textContent = "Sync Now";
      statusText.textContent = "Connected";
      statusText.className = "value connected";
      progressContainer.style.display = "none";
      if (progress.message) {
        errorContainer.style.display = "block";
        errorText.className = "info";
        errorText.textContent = progress.message;
      }
      loadStatus(); // Refresh counts
    }

    if (progress.status === "failed") {
      btnSync.disabled = false;
      btnSync.textContent = "Sync Now";
      statusText.textContent = "Error";
      statusText.className = "value disconnected";
      progressContainer.style.display = "none";
      errorContainer.style.display = "block";
      errorText.className = "error";
      errorText.textContent = progress.error || "Sync failed";
    }
  }
});

btnSync.addEventListener("click", (e) => {
  chrome.runtime.sendMessage({ type: "START_SYNC", fullSync: e.shiftKey });
});

linkFullSync.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.sendMessage({ type: "START_SYNC", fullSync: true });
});

btnDashboard.addEventListener("click", async () => {
  const result = await chrome.storage.local.get("apiBase");
  const base = result.apiBase || __API_BASE__;
  chrome.tabs.create({ url: base });
});

btnConnect.addEventListener("click", async () => {
  const result = await chrome.storage.local.get("apiBase");
  const base = result.apiBase || __API_BASE__;
  const extensionId = chrome.runtime.id;
  chrome.tabs.create({
    url: `${base}/extension-connect?extensionId=${encodeURIComponent(extensionId)}`,
  });
});

btnSaveToken.addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  tokenError.style.display = "none";

  if (!token) {
    tokenError.textContent = "Token is required";
    tokenError.style.display = "block";
    return;
  }

  await chrome.storage.local.set({ token });
  tokenInput.value = "";
  loadStatus();
});

btnDisconnect.addEventListener("click", async () => {
  await chrome.storage.local.remove(["token", "lastSync", "orderCount"]);
  loadStatus();
});

// Refresh status when token is written from an external source (web handoff)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.token) {
    loadStatus();
  }
});

// Initialize
loadStatus();
