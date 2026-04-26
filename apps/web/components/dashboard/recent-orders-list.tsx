import * as React from "react";

import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/format";
import { getShippingStatus } from "@/lib/shipping-status";
import { aliOrderDetailUrl, ALI_ORDER_LINK_PROPS } from "@/lib/order-url";

export interface RecentOrderItem {
  id: string;
  imageUrl: string | null;
  title: string;
}

export interface RecentOrder {
  id: string;
  aliOrderId: string;
  orderDate: Date;
  sellerName: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  items: RecentOrderItem[];
}

interface RecentOrdersListProps {
  orders: RecentOrder[];
  className?: string;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function RecentOrdersList({ orders, className }: RecentOrdersListProps) {
  if (orders.length === 0) {
    return (
      <p className="px-6 py-12 text-center text-sm text-muted-foreground">
        No orders yet. Install the Chrome extension and sync your AliExpress
        orders.
      </p>
    );
  }

  return (
    <ul className={cn("divide-y divide-border", className)}>
      {orders.map((order) => {
        const firstItem = order.items[0];
        const moreCount = Math.max(0, order.items.length - 1);
        const status = getShippingStatus(order.status);

        return (
          <li key={order.id}>
            <a
              href={aliOrderDetailUrl(order.aliOrderId)}
              {...ALI_ORDER_LINK_PROPS}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-card/50 focus-visible:bg-card/60 focus-visible:outline-none"
              aria-label={`Open order ${order.aliOrderId} on AliExpress`}
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded border border-border bg-background">
                {firstItem?.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={firstItem.imageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full bg-card" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {firstItem?.title ?? "Order"}
                  {moreCount > 0 && (
                    <span className="ml-2 text-xs font-medium text-muted-foreground">
                      +{moreCount} more
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {order.sellerName ?? "Unknown seller"} ·{" "}
                  {dateFormatter.format(order.orderDate)}
                </p>
              </div>

              <span
                className={cn(
                  "hidden shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:inline-block",
                  status.className
                )}
              >
                {status.label}
              </span>

              <div className="shrink-0 text-right leading-tight">
                <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  {formatAmount(order.totalAmount, order.currency)}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  #{order.aliOrderId.slice(-6)}
                </p>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
