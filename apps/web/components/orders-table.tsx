"use client";

import { formatAmount } from "@/lib/format";
import { getShippingStatus } from "@/lib/shipping-status";
import {
  OpenOrderLink,
  useOpenOrder,
} from "@/components/order-detail/open-order-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderItem {
  id: string;
  title: string;
  imageUrl: string | null;
}

export interface OrdersTableOrder {
  id: string;
  aliOrderId: string;
  orderDate: Date | string;
  totalAmount: number;
  currency: string;
  status: string;
  sellerName: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  items: OrderItem[];
}

/**
 * Orders index — mobile card list + desktop table. Every order is clickable
 * and opens the AliExpress detail page in a new tab.
 */
export function OrdersTable({ orders }: { orders: OrdersTableOrder[] }) {
  const openOrder = useOpenOrder();

  if (orders.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No orders yet. Sync your AliExpress orders using the Chrome extension.
      </p>
    );
  }

  return (
    <>
      {/* Mobile: clickable stacked cards */}
      <ul className="flex flex-col divide-y divide-border md:hidden">
        {orders.map((order) => {
          const statusInfo = getShippingStatus(order.status);
          const firstItem = order.items[0];
          return (
            <li key={order.id}>
              <OpenOrderLink
                orderId={order.id}
                aliOrderId={order.aliOrderId}
                className="flex flex-col gap-2 px-1 py-3 transition-colors hover:bg-card/50 focus-visible:bg-card/60 focus-visible:outline-none"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs font-medium text-primary">
                      {order.aliOrderId}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right text-sm font-medium tabular-nums">
                    {formatAmount(order.totalAmount, order.currency)}
                  </div>
                </div>

                {firstItem && (
                  <div className="flex items-center gap-2">
                    {firstItem.imageUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={firstItem.imageUrl}
                        alt=""
                        className="size-9 shrink-0 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs" title={firstItem.title}>
                        {firstItem.title}
                      </p>
                      {order.items.length > 1 && (
                        <p className="text-[10px] text-muted-foreground">
                          +{order.items.length - 1} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                  <span
                    className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </span>
                  {order.sellerName && (
                    <span className="truncate">{order.sellerName}</span>
                  )}
                </div>

                {order.trackingNumber && (
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {order.trackingNumber}
                    {order.carrier && (
                      <span className="ml-1 font-sans text-muted-foreground/70">
                        ({order.carrier})
                      </span>
                    )}
                  </p>
                )}
              </OpenOrderLink>
            </li>
          );
        })}
      </ul>

      {/* Desktop: clickable table rows */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Shipping Status</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const statusInfo = getShippingStatus(order.status);
              return (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-card/60"
                  onClick={() => openOrder(order.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openOrder(order.id);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  aria-label={`Open order ${order.aliOrderId}`}
                >
                  <TableCell>
                    {new Date(order.orderDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-primary">
                    {order.aliOrderId}
                  </TableCell>
                  <TableCell>{order.sellerName || "—"}</TableCell>
                  <TableCell className="max-w-[280px]">
                    {order.items.length > 0 ? (
                      <div className="flex items-center gap-2">
                        {order.items[0].imageUrl && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={order.items[0].imageUrl}
                            alt=""
                            className="h-8 w-8 rounded object-cover shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p
                            className="text-xs truncate"
                            title={order.items[0].title}
                          >
                            {order.items[0].title}
                          </p>
                          {order.items.length > 1 && (
                            <p className="text-[10px] text-muted-foreground">
                              +{order.items.length - 1} more
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ${statusInfo.className}`}
                    >
                      {statusInfo.label}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {order.trackingNumber ? (
                      <span title={order.carrier ?? undefined}>
                        {order.trackingNumber}
                        {order.carrier && (
                          <span className="ml-1 font-sans text-[10px] text-muted-foreground/70">
                            ({order.carrier})
                          </span>
                        )}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatAmount(order.totalAmount, order.currency)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
