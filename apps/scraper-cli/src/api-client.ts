import { ScrapedOrder, SyncResult } from "../../extension/lib/types";
import { API_BASE, getToken } from "./config";

interface SyncWatermark {
  aliOrderId: string;
  orderDate: string;
  terminalAliOrderIds: string[];
}

export async function whoami(): Promise<{ id: string; email: string } | null> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchWatermark(): Promise<SyncWatermark | null> {
  try {
    const res = await fetch(`${API_BASE}/api/orders/sync-watermark`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.aliOrderId
      ? { ...data, terminalAliOrderIds: data.terminalAliOrderIds ?? [] }
      : null;
  } catch {
    return null;
  }
}

const BATCH_SIZE = 50;

export async function syncOrders(
  orders: ScrapedOrder[],
  onProgress?: (uploaded: number, total: number) => void,
): Promise<SyncResult> {
  const token = getToken();

  let totalCreated = 0;
  let totalSkipped = 0;
  let syncLogId = "";

  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    const batch = orders.slice(i, i + BATCH_SIZE);
    onProgress?.(i, orders.length);

    const res = await fetch(`${API_BASE}/api/orders/sync`, {
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
