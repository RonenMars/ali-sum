import assert from "node:assert/strict";
import { test } from "node:test";
import type { ScrapedOrder } from "../apps/extension/lib/types";
import { hasOrderShippingStateChanged, type OrderSyncState } from "../apps/extension/lib/tracking-sync";

const baseOrder: Pick<ScrapedOrder, "status" | "trackingNumber" | "carrier" | "estimatedDelivery"> = {
  status: "Delivered",
  trackingNumber: "TRACK123",
  carrier: "Carrier",
  estimatedDelivery: "2026-07-08T00:00:00.000Z",
};

const baseState: OrderSyncState = {
  aliOrderId: "1",
  status: "Delivered",
  trackingNumber: "TRACK123",
  carrier: "Carrier",
  estimatedDelivery: "2026-07-08T00:00:00.000Z",
};

test("new order is selected", () => {
  assert.equal(hasOrderShippingStateChanged(baseOrder, undefined), true);
});

test("status-changed order is selected", () => {
  assert.equal(
    hasOrderShippingStateChanged({ ...baseOrder, status: "Awaiting delivery" }, baseState),
    true,
  );
});

test("tracking/ETA/carrier-changed order is selected", () => {
  assert.equal(hasOrderShippingStateChanged({ ...baseOrder, trackingNumber: "TRACK456" }, baseState), true);
  assert.equal(hasOrderShippingStateChanged({ ...baseOrder, carrier: "Other Carrier" }, baseState), true);
  assert.equal(
    hasOrderShippingStateChanged({ ...baseOrder, estimatedDelivery: "2026-07-09T00:00:00.000Z" }, baseState),
    true,
  );
});

test("unchanged order is skipped", () => {
  assert.equal(hasOrderShippingStateChanged(baseOrder, baseState), false);
});

test("unknown scraped tracking fields are skipped", () => {
  assert.equal(hasOrderShippingStateChanged({ status: "Delivered" }, baseState), false);
});

test("whitespace-only status differences are skipped", () => {
  assert.equal(hasOrderShippingStateChanged({ ...baseOrder, status: " Delivered " }, baseState), false);
});

test("equivalent ISO dates are skipped", () => {
  assert.equal(
    hasOrderShippingStateChanged({ ...baseOrder, estimatedDelivery: "2026-07-08T03:00:00.000+03:00" }, baseState),
    false,
  );
});
