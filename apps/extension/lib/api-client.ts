import { ScrapedOrder, SyncResult } from "./types";

const API_BASE = "http://localhost:3000"; // TODO: make configurable

export async function getApiBase(): Promise<string> {
  const result = await chrome.storage.local.get("apiBase");
  return result.apiBase || API_BASE;
}

export async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get("token");
  return result.token || null;
}

export async function syncOrders(orders: ScrapedOrder[]): Promise<SyncResult> {
  const [apiBase, token] = await Promise.all([getApiBase(), getToken()]);

  if (!token) {
    throw new Error("Not authenticated. Please connect your account first.");
  }

  const res = await fetch(`${apiBase}/api/orders/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ orders }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Sync failed: ${error}`);
  }

  return res.json();
}
