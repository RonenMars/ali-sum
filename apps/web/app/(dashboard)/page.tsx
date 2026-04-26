import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getDefaultDateRange } from "@/lib/date-filter";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SummaryCards } from "@/components/charts/summary-cards";
import { SpendingChart } from "@/components/charts/spending-chart";
import { getShippingStatus } from "@/lib/shipping-status";
import { DateRangeFilter } from "@/components/date-range-filter";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { ShippingStatusOverview } from "@/components/dashboard/shipping-status-overview";
import { RecentOrdersList } from "@/components/dashboard/recent-orders-list";
import { SellerRow } from "@/components/ui/seller-row";
import { LoadMoreButton } from "@/components/load-more-button";
import { ResetRecentLimit } from "@/components/reset-recent-limit";
import { formatAmount } from "@/lib/format";
import Link from "next/link";

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
  const where = {
    userId,
    ...(Object.keys(dateFilter).length && { orderDate: dateFilter }),
  };

  const [orderAgg, itemCount, sellerGroups] = await Promise.all([
    prisma.order.aggregate({
      where,
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
      _count: true,
    }),
    prisma.orderItem.count({ where: { order: where } }),
    prisma.order.groupBy({
      by: ["sellerName"],
      where: { ...where, sellerName: { not: null } },
      _count: true,
    }),
  ]);

  return {
    totalSpent: orderAgg._sum.totalAmount || 0,
    totalOrders: orderAgg._count,
    avgOrderValue: orderAgg._avg.totalAmount || 0,
    totalItems: itemCount,
    uniqueSellers: sellerGroups.length,
  };
}

async function getSpendingSeries(
  userId: string,
  fromDate?: Date,
  toDate?: Date
) {
  const dateFilter = {
    ...(fromDate && { gte: fromDate }),
    ...(toDate && { lt: toDate }),
  };
  const where = {
    userId,
    ...(Object.keys(dateFilter).length && { orderDate: dateFilter }),
  };

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

async function getTopSellers(
  userId: string,
  fromDate?: Date,
  toDate?: Date
) {
  const dateFilter = {
    ...(fromDate && { gte: fromDate }),
    ...(toDate && { lt: toDate }),
  };
  const where = {
    userId,
    sellerName: { not: null },
    ...(Object.keys(dateFilter).length && { orderDate: dateFilter }),
  };

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

async function getShippingStatusCounts(
  userId: string,
  fromDate?: Date,
  toDate?: Date
) {
  const dateFilter = {
    ...(fromDate && { gte: fromDate }),
    ...(toDate && { lt: toDate }),
  };
  const where = {
    userId,
    ...(Object.keys(dateFilter).length && { orderDate: dateFilter }),
  };

  const orders = await prisma.order.findMany({
    where,
    select: { status: true },
  });

  const IN_TRANSIT_LABELS = ["Shipped", "In Transit", "Out for Delivery"];
  let inTransit = 0,
    delivered = 0,
    pending = 0,
    processing = 0;
  for (const o of orders) {
    const label = getShippingStatus(o.status).label;
    if (IN_TRANSIT_LABELS.includes(label)) inTransit++;
    else if (label === "Delivered") delivered++;
    else if (["Payment Pending", "Payment Accepted"].includes(label)) pending++;
    else if (label === "Processing") processing++;
  }
  const other = orders.length - inTransit - delivered - pending - processing;

  return {
    total: orders.length,
    segments: [
      { key: "in-transit", label: "In Transit", count: inTransit, colorClass: "bg-primary" },
      { key: "delivered", label: "Delivered", count: delivered, colorClass: "bg-[color:var(--positive)]" },
      { key: "pending", label: "Pending", count: pending, colorClass: "bg-muted-foreground/40" },
      { key: "processing", label: "Processing", count: processing, colorClass: "bg-[color:var(--info)]" },
      ...(other > 0
        ? [
            {
              key: "other",
              label: "Other",
              count: other,
              colorClass: "bg-muted-foreground/30",
            },
          ]
        : []),
    ],
  };
}

async function getRecentOrders(
  userId: string,
  fromDate?: Date,
  toDate?: Date,
  limit = 5
) {
  const dateFilter = {
    ...(fromDate && { gte: fromDate }),
    ...(toDate && { lt: toDate }),
  };
  const where = {
    userId,
    ...(Object.keys(dateFilter).length && { orderDate: dateFilter }),
  };

  return prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { orderDate: "desc" },
    take: limit,
  });
}

const rangeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatRange(from?: string, to?: string) {
  if (!from && !to) return "All time";
  const fromLabel = from
    ? rangeFormatter.format(new Date(from))
    : "Earliest";
  const toLabel = to ? rangeFormatter.format(new Date(to)) : "Today";
  return `${fromLabel} – ${toLabel}`;
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

  const [summary, spending, sellers, shippingStatus, recentOrders, primaryOrder] =
    await Promise.all([
      getSummary(userId, fromDate, toDate),
      getSpendingSeries(userId, fromDate, toDate),
      getTopSellers(userId, fromDate, toDate),
      getShippingStatusCounts(userId, fromDate, toDate),
      getRecentOrders(userId, fromDate, toDate, recentLimit),
      prisma.order.findFirst({
        where: { userId },
        select: { currency: true },
        orderBy: { orderDate: "desc" },
      }),
    ]);
  const primaryCurrency = primaryOrder?.currency ?? "USD";

  const loadMoreParams = new URLSearchParams();
  if (from) loadMoreParams.set("from", from);
  if (to) loadMoreParams.set("to", to);
  loadMoreParams.set("recentLimit", String(recentLimit + 5));
  const loadMoreHref = `/?${loadMoreParams.toString()}`;

  const spendingTrend = spending.map((s) => s.amount);
  const topSellerSpend = sellers[0]?.totalSpent ?? 0;
  const firstName =
    (session.user.name || session.user.email || "there").split(/[\s@]+/)[0] ||
    "there";

  return (
    <div className="space-y-8">
      <Suspense>
        <ResetRecentLimit />
      </Suspense>

      {/* Greeting + date filter */}
      <div className="flex flex-col gap-6">
        <DashboardGreeting
          name={firstName}
          rangeLabel={formatRange(effectiveFrom, effectiveTo)}
        />
        <Suspense>
          <DateRangeFilter />
        </Suspense>
      </div>

      {/* KPI strip: hero + 2x2 mini grid */}
      <SummaryCards {...summary} currency={primaryCurrency} spendingTrend={spendingTrend} />

      {/* Charts row: spending (8) + shipping (4) */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <section className="col-span-12 overflow-hidden rounded-xl border border-border bg-card p-6 xl:col-span-8">
          <header className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Spending Trends
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-primary" />
              Spend
            </div>
          </header>
          <SpendingChart data={spending} currency={primaryCurrency} />
        </section>

        <section className="col-span-12 flex flex-col rounded-xl border border-border bg-card p-6 xl:col-span-4">
          <header className="mb-2">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Shipping Status
            </h2>
          </header>
          <ShippingStatusOverview
            total={shippingStatus.total}
            segments={shippingStatus.segments}
            detailHref="/shipping"
          />
        </section>
      </div>

      {/* Lists row: recent orders (8) + top sellers (4) */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <section className="col-span-12 overflow-hidden rounded-xl border border-border bg-card xl:col-span-8">
          <header className="flex items-center justify-between border-b border-border px-6 py-5">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Recent Orders
            </h2>
            <Link
              href="/orders"
              className="text-xs font-bold text-primary hover:text-primary/80"
            >
              View all
            </Link>
          </header>
          <RecentOrdersList orders={recentOrders} />
          {recentOrders.length >= recentLimit &&
            recentLimit < summary.totalOrders && (
              <div className="flex justify-center border-t border-border px-6 py-4">
                <LoadMoreButton href={loadMoreHref} />
              </div>
            )}
        </section>

        <section className="col-span-12 rounded-xl border border-border bg-card p-6 xl:col-span-4">
          <header className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Top Sellers
            </h2>
            <Link
              href="/sellers"
              className="text-xs font-bold text-primary hover:text-primary/80"
            >
              View all
            </Link>
          </header>
          {sellers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No seller data yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {sellers.map((s) => (
                <li key={s.name}>
                  <SellerRow
                    name={s.name}
                    total={formatAmount(s.totalSpent, primaryCurrency)}
                    ratio={topSellerSpend > 0 ? s.totalSpent / topSellerSpend : 0}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
