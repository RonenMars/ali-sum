import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getDefaultDateRange } from "@/lib/date-filter";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SummaryCards } from "@/components/charts/summary-cards";
import { SpendingChart } from "@/components/charts/spending-chart";
import { SellersChart } from "@/components/charts/sellers-chart";
import { ShippingStatusChart } from "@/components/charts/shipping-status-chart";
import { getShippingStatus } from "@/lib/shipping-status";
import { DateRangeFilter } from "@/components/date-range-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/lib/format";
import { LoadMoreButton } from "@/components/load-more-button";
import { ResetRecentLimit } from "@/components/reset-recent-limit";

function parseDateRange(from?: string, to?: string) {
  const fromDate = from ? new Date(from) : undefined;
  let toDate: Date | undefined;
  if (to) {
    toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1);
  }
  return { fromDate, toDate };
}

async function getSummary(userId: string, fromDate?: Date, toDate?: Date) {
  const dateFilter = {
    ...(fromDate && { gte: fromDate }),
    ...(toDate && { lt: toDate }),
  };
  const where = { userId, ...(Object.keys(dateFilter).length && { orderDate: dateFilter }) };

  const [orderAgg, itemCount] = await Promise.all([
    prisma.order.aggregate({
      where,
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
      _count: true,
    }),
    prisma.orderItem.count({ where: { order: where } }),
  ]);

  return {
    totalSpent: orderAgg._sum.totalAmount || 0,
    totalOrders: orderAgg._count,
    avgOrderValue: orderAgg._avg.totalAmount || 0,
    totalItems: itemCount,
  };
}

async function getSpendingSeries(userId: string, fromDate?: Date, toDate?: Date) {
  const dateFilter = {
    ...(fromDate && { gte: fromDate }),
    ...(toDate && { lt: toDate }),
  };
  const where = { userId, ...(Object.keys(dateFilter).length && { orderDate: dateFilter }) };

  const orders = await prisma.order.findMany({
    where,
    select: { orderDate: true, totalAmount: true },
    orderBy: { orderDate: "asc" },
  });

  const grouped = new Map<string, { amount: number; orderCount: number }>();
  for (const order of orders) {
    const d = new Date(order.orderDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = grouped.get(key) || { amount: 0, orderCount: 0 };
    existing.amount += order.totalAmount;
    existing.orderCount += 1;
    grouped.set(key, existing);
  }

  return Array.from(grouped.entries()).map(([period, data]) => ({
    period,
    amount: Math.round(data.amount * 100) / 100,
    orderCount: data.orderCount,
  }));
}

async function getTopSellers(userId: string, fromDate?: Date, toDate?: Date) {
  const dateFilter = {
    ...(fromDate && { gte: fromDate }),
    ...(toDate && { lt: toDate }),
  };
  const where = { userId, sellerName: { not: null }, ...(Object.keys(dateFilter).length && { orderDate: dateFilter }) };

  const sellers = await prisma.order.groupBy({
    by: ["sellerName"],
    where,
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 5,
  });

  return sellers.map((s) => ({
    name: s.sellerName || "Unknown",
    totalSpent: Math.round((s._sum.totalAmount || 0) * 100) / 100,
    orderCount: s._count,
  }));
}

async function getShippingStatusCounts(userId: string, fromDate?: Date, toDate?: Date) {
  const dateFilter = {
    ...(fromDate && { gte: fromDate }),
    ...(toDate && { lt: toDate }),
  };
  const where = { userId, ...(Object.keys(dateFilter).length && { orderDate: dateFilter }) };

  const orders = await prisma.order.findMany({
    where,
    select: { status: true },
  });

  const IN_TRANSIT_LABELS = ["Shipped", "In Transit", "Out for Delivery"];
  let inTransit = 0, delivered = 0, pending = 0;
  for (const o of orders) {
    const label = getShippingStatus(o.status).label;
    if (IN_TRANSIT_LABELS.includes(label)) inTransit++;
    else if (label === "Delivered") delivered++;
    else if (["Payment Pending", "Processing", "Payment Accepted"].includes(label)) pending++;
  }
  const other = orders.length - inTransit - delivered - pending;

  return [
    { label: "In Transit", count: inTransit },
    { label: "Delivered", count: delivered },
    { label: "Pending / Processing", count: pending },
    ...(other > 0 ? [{ label: "Other", count: other }] : []),
  ];
}

async function getRecentOrders(userId: string, fromDate?: Date, toDate?: Date, limit = 5) {
  const dateFilter = {
    ...(fromDate && { gte: fromDate }),
    ...(toDate && { lt: toDate }),
  };
  const where = { userId, ...(Object.keys(dateFilter).length && { orderDate: dateFilter }) };

  return prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { orderDate: "desc" },
    take: limit,
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; recentLimit?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;

  const { from, to, recentLimit: recentLimitParam } = await searchParams;
  const defaultRange = getDefaultDateRange();
  const effectiveFrom = from ?? defaultRange.from;
  const effectiveTo = to ?? defaultRange.to;
  const { fromDate, toDate } = parseDateRange(effectiveFrom, effectiveTo);
  const recentLimit = Math.max(5, parseInt(recentLimitParam || "5"));

  const [summary, spending, sellers, shippingStatus, recentOrders, primaryOrder] = await Promise.all([
    getSummary(userId, fromDate, toDate),
    getSpendingSeries(userId, fromDate, toDate),
    getTopSellers(userId, fromDate, toDate),
    getShippingStatusCounts(userId, fromDate, toDate),
    getRecentOrders(userId, fromDate, toDate, recentLimit),
    prisma.order.findFirst({ where: { userId }, select: { currency: true }, orderBy: { orderDate: "desc" } }),
  ]);
  const primaryCurrency = primaryOrder?.currency ?? "USD";

  const loadMoreParams = new URLSearchParams();
  if (from) loadMoreParams.set("from", from);
  if (to) loadMoreParams.set("to", to);
  loadMoreParams.set("recentLimit", String(recentLimit + 5));
  const loadMoreHref = `/?${loadMoreParams.toString()}`;

  return (
    <div className="space-y-8">
      <Suspense>
        <ResetRecentLimit />
      </Suspense>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Your AliExpress spending overview
          </p>
        </div>
        <Suspense>
          <DateRangeFilter />
        </Suspense>
      </div>

      <SummaryCards {...summary} currency={primaryCurrency} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingChart data={spending} currency={primaryCurrency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            <SellersChart data={sellers} currency={primaryCurrency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shipping Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ShippingStatusChart data={shippingStatus} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No orders yet. Install the Chrome extension and sync your AliExpress orders.
            </p>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Date</th>
                    <th className="text-left py-2 font-medium">Order ID</th>
                    <th className="text-left py-2 font-medium">Seller</th>
                    <th className="text-left py-2 font-medium">Items</th>
                    <th className="text-right py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-2">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      <td className="py-2 font-mono text-xs">
                        <a
                          href={`https://www.aliexpress.com/p/order/detail.html?orderId=${order.aliOrderId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-blue-600"
                        >
                          {order.aliOrderId}
                        </a>
                      </td>
                      <td className="py-2">{order.sellerName || "—"}</td>
                      <td className="py-2 max-w-[220px]">
                        {order.items.length > 0 ? (
                          <div className="flex items-center gap-2">
                            {order.items[0].imageUrl && (
                              <img
                                src={order.items[0].imageUrl}
                                alt=""
                                className="h-7 w-7 rounded object-cover shrink-0"
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
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatAmount(order.totalAmount, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {recentOrders.length >= recentLimit && recentLimit < summary.totalOrders && (
              <div className="mt-4 flex justify-center">
                <LoadMoreButton href={loadMoreHref} />
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
