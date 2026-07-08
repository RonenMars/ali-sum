import type { ScrapedOrder } from "./types";

export type TrackingMap = Record<string, { trackingNumber?: string; estimatedDelivery?: string }>;

export interface OrderSyncState {
  aliOrderId: string;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  estimatedDelivery: string | null;
}

function normalizeString(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function stringsDiffer(next?: string | null, previous?: string | null): boolean {
  return normalizeString(next) !== normalizeString(previous);
}

function optionalStringDiffers(next: string | undefined, previous: string | null): boolean {
  if (next === undefined) return false;
  return stringsDiffer(next, previous);
}

function datesDiffer(next?: string | null, previous?: string | null): boolean {
  const normalizedNext = normalizeString(next);
  const normalizedPrevious = normalizeString(previous);

  if (!normalizedNext && !normalizedPrevious) return false;
  if (!normalizedNext || !normalizedPrevious) return true;

  const nextTime = new Date(normalizedNext).getTime();
  const previousTime = new Date(normalizedPrevious).getTime();
  if (!Number.isNaN(nextTime) && !Number.isNaN(previousTime)) {
    return nextTime !== previousTime;
  }

  return normalizedNext !== normalizedPrevious;
}

function optionalDateDiffers(next: string | undefined, previous: string | null): boolean {
  if (next === undefined) return false;
  return datesDiffer(next, previous);
}

const TERMINAL_STATUS_PATTERNS = [
  /delivered/i,
  /order\s*complete/i,
  /completed/i,
  /received/i,
  /cancel/i,
  /refund/i,
] as const;

function isTerminalStatus(status: string): boolean {
  return TERMINAL_STATUS_PATTERNS.some((pattern) => pattern.test(status.trim()));
}

function isMissingDbTracking(state: OrderSyncState): boolean {
  return !state.trackingNumber || !state.carrier || !state.estimatedDelivery;
}

export function hasOrderShippingStateChanged(
  order: Pick<ScrapedOrder, "status" | "trackingNumber" | "carrier" | "estimatedDelivery">,
  existingState?: OrderSyncState,
): boolean {
  if (!existingState) return true;

  return (
    stringsDiffer(order.status, existingState.status) ||
    optionalStringDiffers(order.trackingNumber, existingState.trackingNumber) ||
    optionalStringDiffers(order.carrier, existingState.carrier) ||
    optionalDateDiffers(order.estimatedDelivery, existingState.estimatedDelivery)
  );
}

export function getOrderIdsToEnrich(
  orders: ScrapedOrder[],
  orderStates: Map<string, OrderSyncState>,
): Set<string> {
  return new Set(
    orders
      .filter((o) => {
        const state = orderStates.get(o.aliOrderId);
        if (!state) return true;
        return stringsDiffer(o.status, state.status) || !isTerminalStatus(o.status) || isMissingDbTracking(state);
      })
      .map((o) => o.aliOrderId),
  );
}

export function applyTrackingMap(orders: ScrapedOrder[], trackingMap: TrackingMap): void {
  for (const order of orders) {
    const detail = trackingMap[order.aliOrderId];
    if (detail?.trackingNumber) order.trackingNumber = detail.trackingNumber;
    if (detail?.estimatedDelivery) order.estimatedDelivery = detail.estimatedDelivery;
  }
}

export function selectOrdersToSync(
  orders: ScrapedOrder[],
  orderStates: Map<string, OrderSyncState>,
): { ordersToSync: ScrapedOrder[]; skippedUnchanged: number } {
  const ordersToSync = orders.filter((o) => hasOrderShippingStateChanged(o, orderStates.get(o.aliOrderId)));

  return {
    ordersToSync,
    skippedUnchanged: orders.length - ordersToSync.length,
  };
}

export function selectOrdersNeedingTrackingDetail(orders: ScrapedOrder[]): ScrapedOrder[] {
  return orders.filter((o) => o.trackingPageUrl && !o.trackingNumber);
}
