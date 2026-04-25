"use client";

import { useState } from "react";
import { formatAmount } from "@/lib/format";
import { getShippingStatus } from "@/lib/shipping-status";
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
            <>
              <TableRow
                key={pkg.trackingNumber}
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
                  <>
                    <TableRow key={order.id} className="bg-muted/30">
                      <TableCell></TableCell>
                      <TableCell className="font-mono text-xs" colSpan={2}>
                        <a
                          href={`https://www.aliexpress.com/p/order/detail.html?orderId=${order.aliOrderId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-primary"
                        >
                          {order.aliOrderId}
                        </a>
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
                  </>
                ))}
            </>
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
            <TableRow key={order.id}>
              <TableCell></TableCell>
              <TableCell className="font-mono text-xs">
                <a
                  href={`https://www.aliexpress.com/p/order/detail.html?orderId=${order.aliOrderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-primary"
                >
                  {order.aliOrderId}
                </a>
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
  );
}
