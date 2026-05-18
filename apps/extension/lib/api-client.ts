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

export async function fetchWatermark(): Promise<{ aliOrderId: string; orderDate: string } | null> {
  const [apiBase, token] = await Promise.all([getApiBase(), getToken()]);
  if (!token) return null;

  try {
    const res = await fetch(`${apiBase}/api/orders/sync-watermark`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.aliOrderId ? data : null;
  } catch {
    return null;
  }
}

const BATCH_SIZE = 50;

export async function syncOrders(
  orders: ScrapedOrder[],
  onProgress?: (uploaded: number, total: number) => void,
): Promise<SyncResult> {
  const [apiBase, token] = await Promise.all([getApiBase(), getToken()]);

  if (!token) {
    throw new Error("Not authenticated. Please connect your account first.");
  }

  let totalCreated = 0;
  let totalSkipped = 0;
  let syncLogId = "";

  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    const batch = orders.slice(i, i + BATCH_SIZE);
    onProgress?.(i, orders.length);

    const res = await fetch(`${apiBase}/api/orders/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orders: batch }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      if (body && body.created === 0 && typeof body.skipped === "number" && body.skipped > 0) {
        totalSkipped += body.skipped;
        syncLogId = body.syncLogId || syncLogId;
        continue;
      }
      throw new Error(
        `Sync failed on batch ${Math.floor(i / BATCH_SIZE) + 1}: ${body ? JSON.stringify(body) : res.statusText}`,
      );
    }

    const result: SyncResult = await res.json();
    totalCreated += result.created;
    totalSkipped += result.skipped;
    syncLogId = result.syncLogId;
  }

  onProgress?.(orders.length, orders.length);
  return { created: totalCreated, skipped: totalSkipped, syncLogId };
}
