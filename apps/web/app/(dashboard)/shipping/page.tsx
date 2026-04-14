import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/format";
import { getShippingStatus, SHIPPING_STATUS_FILTERS } from "@/lib/shipping-status";
import { DateRangeFilter } from "@/components/date-range-filter";
import { ShippingStatusFilter } from "@/components/shipping-status-filter";
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
  searchParams: Promise<{
    page?: string;
    from?: string;
    to?: string;
    status?: string;
  }>;
}

// Map canonical filter labels back to regex patterns for Prisma `contains` queries.
// We use multiple `OR` conditions since Prisma can't do regex filtering natively.
function buildStatusFilter(filterLabel: string): { status: { contains: string; mode: "insensitive" } }[] | undefined {
  const entry = STATUS_KEYWORD_MAP[filterLabel as keyof typeof STATUS_KEYWORD_MAP];
  if (!entry) return undefined;
  return entry.map((kw) => ({ status: { contains: kw, mode: "insensitive" as const } }));
}

// Keywords that should match each canonical filter label
const STATUS_KEYWORD_MAP: Record<string, string[]> = {
  "Payment Pending": ["payment pending", "awaiting payment", "unpaid"],
  "Payment Accepted": ["payment accepted", "paid", "payment complete"],
  "Processing": ["processing", "preparing", "seller ship"],
  "Shipped": ["shipped", "dispatched"],
  "In Transit": ["in transit", "on the way"],
  "Out for Delivery": ["out for delivery", "delivering"],
  "Delivered": ["delivered", "order complete", "completed", "received"],
  "Return / Refund": ["return", "refund"],
  "Cancelled": ["cancel"],
};

export default async function ShippingPage({ searchParams }: PageProps) {
  const session = await auth();
  const userId = session!.user!.id!;

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 25;

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

  const statusConditions = params.status ? buildStatusFilter(params.status) : undefined;

  const where = {
    userId,
    ...(Object.keys(dateFilter).length && { orderDate: dateFilter }),
    ...(statusConditions && { OR: statusConditions }),
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

  // Stats: count by normalized status group
  const allOrders = await prisma.order.findMany({
    where: { userId },
    select: { status: true },
  });

  const statusCounts: Record<string, number> = {};
  for (const o of allOrders) {
    const info = getShippingStatus(o.status);
    statusCounts[info.label] = (statusCounts[info.label] ?? 0) + 1;
  }

  const totalPages = Math.ceil(total / limit);

  const paginationParams = (p: number) => {
    const sp = new URLSearchParams();
    if (params.from) sp.set("from", params.from);
    if (params.to) sp.set("to", params.to);
    if (params.status) sp.set("status", params.status);
    sp.set("page", String(p));
    return sp.toString();
  };

  const IN_TRANSIT_LABELS = ["Shipped", "In Transit", "Out for Delivery"];
  const inTransitCount = IN_TRANSIT_LABELS.reduce((sum, l) => sum + (statusCounts[l] ?? 0), 0);
  const deliveredCount = statusCounts["Delivered"] ?? 0;
  const pendingCount = (statusCounts["Payment Pending"] ?? 0) + (statusCounts["Processing"] ?? 0) + (statusCounts["Payment Accepted"] ?? 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Shipping</h1>
          <p className="text-muted-foreground text-sm">
            Track your package shipping status and delivery estimates
          </p>
        </div>
        <Suspense>
          <DateRangeFilter />
        </Suspense>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="In Transit" count={inTransitCount} className="text-indigo-600" />
        <SummaryCard label="Delivered" count={deliveredCount} className="text-green-600" />
        <SummaryCard label="Pending / Processing" count={pendingCount} className="text-amber-600" />
        <SummaryCard label="Total Orders" count={allOrders.length} className="text-foreground" />
      </div>

      {/* Filters + table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-base">
            {total} order{total !== 1 ? "s" : ""}
            {params.status ? ` · ${params.status}` : ""}
            {params.from || params.to ? " in range" : ""}
          </CardTitle>
          <Suspense>
            <ShippingStatusFilter />
          </Suspense>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No orders match the selected filters.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Shipping Status</TableHead>
                    <TableHead>Tracking Number</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Est. Delivery</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const statusInfo = getShippingStatus(order.status);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <a
                            href={`https://www.aliexpress.com/p/order/detail.html?orderId=${order.aliOrderId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline text-blue-600"
                          >
                            {order.aliOrderId}
                          </a>
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">
                          {order.sellerName || "—"}
                        </TableCell>
                        <TableCell>
                          <span title={order.items.map((i) => i.title).join(", ")}>
                            {order.items.length}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {order.trackingNumber || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {order.carrier || "—"}
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <a
                        href={`/shipping?${paginationParams(page - 1)}`}
                        className="px-3 py-1.5 text-sm border rounded-md hover:bg-accent"
                      >
                        Previous
                      </a>
                    )}
                    {page < totalPages && (
                      <a
                        href={`/shipping?${paginationParams(page + 1)}`}
                        className="px-3 py-1.5 text-sm border rounded-md hover:bg-accent"
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

function SummaryCard({
  label,
  count,
  className,
}: {
  label: string;
  count: number;
  className?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl font-bold tabular-nums ${className}`}>{count}</p>
      </CardContent>
    </Card>
  );
}
