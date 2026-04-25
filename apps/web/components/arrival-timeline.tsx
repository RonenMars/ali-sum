"use client";

import { formatAmount } from "@/lib/format";
import { getShippingStatus } from "@/lib/shipping-status";

interface TimelineItem {
  id: string;
  title: string;
  imageUrl: string | null;
}

interface TimelineOrder {
  id: string;
  aliOrderId: string;
  totalAmount: number;
  currency: string;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  estimatedDelivery: Date | string | null;
  items: TimelineItem[];
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  return target.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ArrivalTimeline({ orders }: { orders: TimelineOrder[] }) {
  const withDelivery = orders
    .filter((o) => o.estimatedDelivery)
    .sort((a, b) => {
      const aTime = new Date(a.estimatedDelivery!).getTime();
      const bTime = new Date(b.estimatedDelivery!).getTime();
      return aTime - bTime;
    });

  if (withDelivery.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
        No estimated delivery dates available.
      </div>
    );
  }

  // Group by date
  const grouped = new Map<string, TimelineOrder[]>();
  for (const order of withDelivery) {
    const d = new Date(order.estimatedDelivery!);
    const key = d.toISOString().split("T")[0];
    const existing = grouped.get(key) || [];
    existing.push(order);
    grouped.set(key, existing);
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return (
    <div className="relative space-y-0">
      {Array.from(grouped.entries()).map(([dateKey, dateOrders], groupIdx) => {
        const date = new Date(dateKey + "T00:00:00");
        const isPast = date < now;
        const isToday = date.getTime() === now.getTime();

        return (
          <div key={dateKey} className="relative flex gap-4">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`h-3 w-3 rounded-full shrink-0 mt-1 ring-2 ring-background ${
                  isToday
                    ? "bg-primary"
                    : isPast
                      ? "bg-[color:var(--positive)]"
                      : "bg-muted-foreground/40"
                }`}
              />
              {groupIdx < grouped.size - 1 && (
                <div className="w-px flex-1 bg-border" />
              )}
            </div>

            {/* Content */}
            <div className="pb-6 flex-1 min-w-0">
              {/* Date header */}
              <div className="flex items-baseline gap-2 mb-2">
                <p className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>
                  {date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeDate(date)}
                </span>
              </div>

              {/* Orders for this date */}
              <div className="space-y-2">
                {dateOrders.map((order) => {
                  const statusInfo = getShippingStatus(order.status);
                  return (
                    <div
                      key={order.id}
                      className="rounded-lg border bg-card p-3 flex items-start gap-3"
                    >
                      {/* Product images stack */}
                      <div className="flex -space-x-2 shrink-0">
                        {order.items.slice(0, 3).map((item, i) =>
                          item.imageUrl ? (
                            <img
                              key={item.id}
                              src={item.imageUrl}
                              alt=""
                              className="h-9 w-9 rounded border-2 border-card object-cover"
                              style={{ zIndex: 3 - i }}
                            />
                          ) : (
                            <div
                              key={item.id}
                              className="h-9 w-9 rounded border-2 border-card bg-muted flex items-center justify-center text-[10px] text-muted-foreground"
                              style={{ zIndex: 3 - i }}
                            >
                              ?
                            </div>
                          )
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate" title={order.items.map((i) => i.title).join(", ")}>
                          {order.items[0]?.title || "Unknown item"}
                          {order.items.length > 1 && (
                            <span className="text-muted-foreground">
                              {" "}+{order.items.length - 1} more
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                          {order.trackingNumber && (
                            <span className="text-[10px] text-muted-foreground font-mono truncate">
                              {order.trackingNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <p className="text-xs font-medium whitespace-nowrap shrink-0">
                        {formatAmount(order.totalAmount, order.currency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
