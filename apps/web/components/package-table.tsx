"use client";

import { Fragment, useState } from "react";
import { ExternalLink } from "lucide-react";
import { formatAmount } from "@/lib/format";
import { getShippingStatus } from "@/lib/shipping-status";
import { aliOrderDetailUrl, ALI_ORDER_LINK_PROPS } from "@/lib/order-url";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function openOrder(aliOrderId: string) {
  window.open(aliOrderDetailUrl(aliOrderId), "_blank", "noopener,noreferrer");
}

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

  // Sort packages by estimated delivery (soonest first), then by order date
  packages.sort((a, b) => {
    const aDate = a.estimatedDelivery ? new Date(a.estimatedDelivery).getTime() : Infinity;
    const bDate = b.estimatedDelivery ? new Date(b.estimatedDelivery).getTime() : Infinity;
    return aDate - bDate;
  });

  return { packages, ungrouped };
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
      <p className="text-sm text-muted-foreground py-8 text-center">
        No orders match the selected filters.
      </p>
    );
  }

  return (
    <>
      {/* Mobile: stacked card list */}
      <ul className="flex flex-col divide-y divide-border md:hidden">
        {packages.map((pkg) => {
          const isOpen = expanded.has(pkg.trackingNumber);
          const statusInfo = getShippingStatus(pkg.status);
          return (
            <li key={pkg.trackingNumber} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => toggle(pkg.trackingNumber)}
                className="flex w-full items-start justify-between gap-3 text-left"
                aria-expanded={isOpen}
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-mono text-xs font-medium">
                    <span className="text-muted-foreground">
                      {isOpen ? "▾" : "▸"}
                    </span>
                    {pkg.trackingNumber}
                  </p>
                  {pkg.carrier && (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {pkg.carrier}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm font-medium tabular-nums">
                  {formatAmount(pkg.totalAmount, pkg.currency)}
                </div>
              </button>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                <span
                  className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium ${statusInfo.className}`}
                >
                  {statusInfo.label}
                </span>
                <span>
                  {pkg.orders.length} {pkg.orders.length === 1 ? "order" : "orders"} · {pkg.itemCount} {pkg.itemCount === 1 ? "item" : "items"}
                </span>
                {pkg.estimatedDelivery && (
                  <span>
                    ETA {new Date(pkg.estimatedDelivery).toLocaleDateString()}
                  </span>
                )}
              </div>

              {isOpen && (
                <ul className="flex flex-col gap-2 rounded-md bg-muted/30 p-2">
                  {pkg.orders.map((order) => (
                    <li key={order.id}>
                      <a
                        href={aliOrderDetailUrl(order.aliOrderId)}
                        {...ALI_ORDER_LINK_PROPS}
                        className="flex flex-col gap-2 rounded-md p-2 transition-colors hover:bg-card focus-visible:bg-card focus-visible:outline-none"
                        aria-label={`Open order ${order.aliOrderId} on AliExpress`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="inline-flex items-center gap-1 truncate font-mono text-xs text-primary">
                            {order.aliOrderId}
                            <ExternalLink className="size-3 opacity-60" aria-hidden />
                          </span>
                          <span className="text-xs font-medium tabular-nums">
                            {formatAmount(order.totalAmount, order.currency)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(order.orderDate).toLocaleDateString()}
                          {order.sellerName ? ` · ${order.sellerName}` : ""}
                        </p>
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt=""
                                className="size-7 shrink-0 rounded object-cover"
                              />
                            )}
                            <span className="min-w-0 flex-1 truncate text-xs" title={item.title}>
                              {item.title}
                              {item.quantity > 1 && (
                                <span className="ml-1 text-[10px] text-muted-foreground">
                                  x{item.quantity}
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                              {formatAmount(item.price, order.currency)}
                            </span>
                          </div>
                        ))}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}

        {ungrouped.length > 0 && packages.length > 0 && (
          <li className="py-2 text-[11px] font-medium text-muted-foreground">
            Orders without tracking
          </li>
        )}

        {ungrouped.map((order) => {
          const statusInfo = getShippingStatus(order.status);
          const firstItem = order.items[0];
          return (
            <li key={order.id}>
              <a
                href={aliOrderDetailUrl(order.aliOrderId)}
                {...ALI_ORDER_LINK_PROPS}
                className="flex flex-col gap-2 py-3 transition-colors hover:bg-card/50 focus-visible:bg-card/60 focus-visible:outline-none"
                aria-label={`Open order ${order.aliOrderId} on AliExpress`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-1 truncate font-mono text-xs text-primary">
                    {order.aliOrderId}
                    <ExternalLink className="size-3 opacity-60" aria-hidden />
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {formatAmount(order.totalAmount, order.currency)}
                  </span>
                </div>
                {firstItem && (
                  <div className="flex items-center gap-2">
                    {firstItem.imageUrl && (
                      <img
                        src={firstItem.imageUrl}
                        alt=""
                        className="size-8 shrink-0 rounded object-cover"
                      />
                    )}
                    <span className="truncate text-xs" title={firstItem.title}>
                      {firstItem.title}
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                  <span
                    className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </span>
                  {order.sellerName && <span className="truncate">{order.sellerName}</span>}
                  {order.estimatedDelivery && (
                    <span>
                      ETA {new Date(order.estimatedDelivery).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </a>
            </li>
          );
        })}
      </ul>

      {/* Desktop: full table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
        <TableRow>
          <TableHead className="w-8"></TableHead>
          <TableHead>Tracking Number</TableHead>
          <TableHead>Carrier</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Orders</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Est. Delivery</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {packages.map((pkg) => {
          const isOpen = expanded.has(pkg.trackingNumber);
          const statusInfo = getShippingStatus(pkg.status);
          return (
            <Fragment key={pkg.trackingNumber}>
              <TableRow
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => toggle(pkg.trackingNumber)}
              >
                <TableCell className="text-muted-foreground">
                  {isOpen ? "▾" : "▸"}
                </TableCell>
                <TableCell className="font-mono text-xs font-medium">
                  {pkg.trackingNumber}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {pkg.carrier || "—"}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </span>
                </TableCell>
                <TableCell>{pkg.orders.length}</TableCell>
                <TableCell>{pkg.itemCount}</TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  {pkg.estimatedDelivery
                    ? new Date(pkg.estimatedDelivery).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap">
                  {formatAmount(pkg.totalAmount, pkg.currency)}
                </TableCell>
              </TableRow>
              {isOpen &&
                pkg.orders.map((order) => (
                  <Fragment key={order.id}>
                    <TableRow
                      className="cursor-pointer bg-muted/30 hover:bg-muted/60"
                      role="link"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        openOrder(order.aliOrderId);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          openOrder(order.aliOrderId);
                        }
                      }}
                      aria-label={`Open order ${order.aliOrderId} on AliExpress`}
                    >
                      <TableCell></TableCell>
                      <TableCell className="font-mono text-xs text-primary" colSpan={2}>
                        <span className="inline-flex items-center gap-1">
                          {order.aliOrderId}
                          <ExternalLink className="size-3 opacity-60" aria-hidden />
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                        {order.sellerName || "—"}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell>{order.items.length}</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right text-xs whitespace-nowrap">
                        {formatAmount(order.totalAmount, order.currency)}
                      </TableCell>
                    </TableRow>
                    {order.items.map((item) => (
                      <TableRow key={item.id} className="bg-muted/10">
                        <TableCell colSpan={2}></TableCell>
                        <TableCell colSpan={4}>
                          <div className="flex items-center gap-2 py-0.5">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt=""
                                className="h-7 w-7 rounded object-cover shrink-0"
                              />
                            )}
                            <span className="text-xs truncate max-w-[260px]" title={item.title}>
                              {item.title}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-[10px] text-muted-foreground">x{item.quantity}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          {formatAmount(item.price, order.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
            </Fragment>
          );
        })}

        {ungrouped.length > 0 && packages.length > 0 && (
          <TableRow>
            <TableCell
              colSpan={8}
              className="text-xs text-muted-foreground py-3 font-medium"
            >
              Orders without tracking
            </TableCell>
          </TableRow>
        )}

        {ungrouped.map((order) => {
          const statusInfo = getShippingStatus(order.status);
          return (
            <TableRow
              key={order.id}
              className="cursor-pointer hover:bg-card/60"
              role="link"
              tabIndex={0}
              onClick={() => openOrder(order.aliOrderId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openOrder(order.aliOrderId);
                }
              }}
              aria-label={`Open order ${order.aliOrderId} on AliExpress`}
            >
              <TableCell></TableCell>
              <TableCell className="font-mono text-xs text-primary">
                <span className="inline-flex items-center gap-1">
                  {order.aliOrderId}
                  <ExternalLink className="size-3 opacity-60" aria-hidden />
                </span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {order.sellerName || "—"}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap ${statusInfo.className}`}
                >
                  {statusInfo.label}
                </span>
              </TableCell>
              <TableCell></TableCell>
              <TableCell className="max-w-[200px]">
                {order.items.length > 0 ? (
                  <div className="flex items-center gap-2">
                    {order.items[0].imageUrl && (
                      <img
                        src={order.items[0].imageUrl}
                        alt=""
                        className="h-7 w-7 rounded object-cover shrink-0"
                      />
                    )}
                    <span className="text-xs truncate" title={order.items[0].title}>
                      {order.items[0].title}
                    </span>
                  </div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-xs whitespace-nowrap">
                {order.estimatedDelivery
                  ? new Date(order.estimatedDelivery).toLocaleDateString()
                  : "—"}
              </TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap">
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
