import { ScrapedOrder, SyncResult } from "./types";

export async function getApiBase(): Promise<string> {
  const result = await chrome.storage.local.get("apiBase");
  return result.apiBase || __API_BASE__;
}

export async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get("token");
  return result.token || null;
}

export async function whoami(): Promise<{ id: string; email: string } | null> {
  const [apiBase, token] = await Promise.all([getApiBase(), getToken()]);
  if (!token) return null;

  const res = await fetch(`${apiBase}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  return res.json();
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
    const body = await res.json().catch(() => null);
    // If all orders were already synced (skipped with no new ones), treat as success
    if (body && body.created === 0 && typeof body.skipped === "number" && body.skipped > 0) {
      return body as SyncResult;
    }
    throw new Error(`Sync failed: ${body ? JSON.stringify(body) : res.statusText}`);
  }

  return res.json();
}
