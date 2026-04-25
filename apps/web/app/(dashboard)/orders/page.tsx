import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/format";
import { getShippingStatus } from "@/lib/shipping-status";
import { DateRangeFilter } from "@/components/date-range-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PageProps {
  searchParams: Promise<{ page?: string; from?: string; to?: string }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const session = await auth();
  const userId = session!.user!.id!;

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 20;

  const fromDate = params.from ? new Date(params.from) : undefined;
  let toDate: Date | undefined;
  if (params.to) {
    toDate = new Date(params.to);
    toDate.setDate(toDate.getDate() + 1);
  }

  const dateFilter = {
    ...(fromDate && { gte: fromDate }),
    ...(toDate && { lt: toDate }),
  };
  const where = {
    userId,
    ...(Object.keys(dateFilter).length && { orderDate: dateFilter }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { orderDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const paginationParams = (p: number) => {
    const sp = new URLSearchParams();
    if (params.from) sp.set("from", params.from);
    if (params.to) sp.set("to", params.to);
    sp.set("page", String(p));
    return sp.toString();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground text-sm">
            {total} orders{params.from || params.to ? " in range" : " total"}
          </p>
        </div>
        <Suspense>
          <DateRangeFilter />
        </Suspense>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No orders yet. Sync your AliExpress orders using the Chrome extension.
            </p>
          ) : (
            <>
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
                      <TableRow key={order.id}>
                        <TableCell>
                          {new Date(order.orderDate).toLocaleDateString()}
                        </TableCell>
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
                        <TableCell>{order.sellerName || "—"}</TableCell>
                        <TableCell className="max-w-[280px]">
                          {order.items.length > 0 ? (
                            <div className="flex items-center gap-2">
                              {order.items[0].imageUrl && (
                                <img
                                  src={order.items[0].imageUrl}
                                  alt=""
                                  className="h-8 w-8 rounded object-cover shrink-0"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs truncate" title={order.items[0].title}>
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <a
                        href={`/orders?${paginationParams(page - 1)}`}
                        className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted transition-colors"
                      >
                        Previous
                      </a>
                    )}
                    {page < totalPages && (
                      <a
                        href={`/orders?${paginationParams(page + 1)}`}
                        className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted transition-colors"
                      >
                        Next
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
