"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/format";
import { getShippingStatus } from "@/lib/shipping-status";
import { OpenOrderLink } from "@/components/order-detail/open-order-link";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

interface Order {
  id: string;
  aliOrderId: string;
  orderDate: Date | string;
  totalAmount: number;
  currency: string;
  status: string;
  sellerName: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  estimatedDelivery: Date | string | null;
  items: OrderItem[];
}

interface PackageGroup {
  trackingNumber: string;
  carrier: string | null;
  estimatedDelivery: Date | string | null;
  orders: Order[];
  totalAmount: number;
  currency: string;
  itemCount: number;
  status: string;
}

function groupByTracking(orders: Order[]): {
  packages: PackageGroup[];
  ungrouped: Order[];
} {
  const grouped = new Map<string, Order[]>();
  const ungrouped: Order[] = [];

  for (const order of orders) {
    if (order.trackingNumber) {
      const existing = grouped.get(order.trackingNumber) || [];
      existing.push(order);
      grouped.set(order.trackingNumber, existing);
    } else {
      ungrouped.push(order);
    }
  }

  const packages: PackageGroup[] = [];
  for (const [trackingNumber, groupOrders] of grouped) {
    const first = groupOrders[0];
    packages.push({
      trackingNumber,
      carrier: first.carrier,
      estimatedDelivery: first.estimatedDelivery,
      orders: groupOrders,
      totalAmount: groupOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      currency: first.currency,
      itemCount: groupOrders.reduce((sum, o) => sum + o.items.length, 0),
      status: first.status,
    });
  }

  packages.sort((a, b) => {
    const aDate = a.estimatedDelivery
      ? new Date(a.estimatedDelivery).getTime()
      : Infinity;
    const bDate = b.estimatedDelivery
      ? new Date(b.estimatedDelivery).getTime()
      : Infinity;
    return aDate - bDate;
  });

  return { packages, ungrouped };
}

const etaFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function isActiveStatus(label: string): boolean {
  return ["In Transit", "Out for Delivery", "Shipped"].includes(label);
}

interface ItemRow {
  order: Order;
  item: OrderItem;
}

function flattenItems(orders: Order[]): ItemRow[] {
  return orders.flatMap((order) => order.items.map((item) => ({ order, item })));
}

export function PackageTable({ orders }: { orders: Order[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { packages, ungrouped } = groupByTracking(orders);

  const toggle = (trackingNumber: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(trackingNumber)) next.delete(trackingNumber);
      else next.add(trackingNumber);
      return next;
    });
  };

  if (packages.length === 0 && ungrouped.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No orders match the selected filters.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {packages.map((pkg) => {
        const isOpen = expanded.has(pkg.trackingNumber);
        const status = getShippingStatus(pkg.status);
        const items = flattenItems(pkg.orders);

        return (
          <div
            key={pkg.trackingNumber}
            className="overflow-hidden rounded-2xl border border-border bg-card transition-colors"
          >
            <button
              type="button"
              onClick={() => toggle(pkg.trackingNumber)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-card/60 focus-visible:bg-card/60 focus-visible:outline-none"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-primary"
                >
                  {isOpen ? (
                    <ChevronDown className="size-5" />
                  ) : (
                    <ChevronRight className="size-5" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-bold text-foreground">
                    {pkg.trackingNumber}
                  </p>
                  <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                    {pkg.carrier ?? "Carrier unknown"} · {pkg.itemCount}{" "}
                    {pkg.itemCount === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="hidden flex-col items-end gap-0.5 sm:flex">
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Est. Arrival
                  </span>
                  <span className="font-mono text-[11px] font-bold text-primary">
                    {pkg.estimatedDelivery
                      ? etaFormatter.format(new Date(pkg.estimatedDelivery))
                      : "—"}
                  </span>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                    status.className
                  )}
                >
                  {isActiveStatus(status.label) && (
                    <span
                      aria-hidden
                      className="size-1.5 animate-pulse rounded-full bg-current"
                    />
                  )}
                  {status.label}
                </span>
                <span className="hidden text-right md:block">
                  <span className="font-mono text-sm font-bold tabular-nums text-foreground">
                    {formatAmount(pkg.totalAmount, pkg.currency)}
                  </span>
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border bg-background/30">
                <ul className="divide-y divide-border/60 px-4">
                  {items.map(({ order, item }) => (
                    <li key={item.id}>
                      <OpenOrderLink
                        orderId={order.id}
                        aliOrderId={order.aliOrderId}
                        className="flex items-center gap-3 py-3 transition-colors hover:bg-card/60 focus-visible:outline-none"
                      >
                        {item.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="size-10 shrink-0 rounded-md border border-border object-cover"
                          />
                        ) : (
                          <div className="size-10 shrink-0 rounded-md border border-border bg-card" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {order.sellerName ?? "Unknown seller"} · Qty{" "}
                            {String(item.quantity).padStart(2, "0")}
                          </p>
                        </div>
                        <span className="font-mono text-xs font-bold tabular-nums text-foreground">
                          {formatAmount(item.price, order.currency)}
                        </span>
                      </OpenOrderLink>
                    </li>
                  ))}
                </ul>
                {pkg.estimatedDelivery && (
                  <div className="flex items-center gap-2 border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
                    <MapPin className="size-3.5 text-primary" />
                    Estimated arrival{" "}
                    {dateFormatter.format(new Date(pkg.estimatedDelivery))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {ungrouped.length > 0 && (
        <>
          <p className="px-2 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Orders without tracking
          </p>
          <ul className="space-y-2">
            {ungrouped.map((order) => {
              const status = getShippingStatus(order.status);
              const firstItem = order.items[0];
              return (
                <li
                  key={order.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <OpenOrderLink
                    orderId={order.id}
                    aliOrderId={order.aliOrderId}
                    className="flex items-center gap-3 p-3 transition-colors hover:bg-card/60 focus-visible:outline-none"
                  >
                    {firstItem?.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={firstItem.imageUrl}
                        alt=""
                        className="size-10 shrink-0 rounded-md border border-border object-cover"
                      />
                    ) : (
                      <div className="size-10 shrink-0 rounded-md border border-border bg-background" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {firstItem?.title ?? `Order ${order.aliOrderId}`}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {order.sellerName ?? "Unknown seller"} ·{" "}
                        {dateFormatter.format(new Date(order.orderDate))}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        status.className
                      )}
                    >
                      {status.label}
                    </span>
                    <span className="font-mono text-xs font-bold tabular-nums text-foreground">
                      {formatAmount(order.totalAmount, order.currency)}
                    </span>
                  </OpenOrderLink>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
