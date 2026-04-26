import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShippingStatus } from "@/lib/shipping-status";
import { DateRangeFilter } from "@/components/date-range-filter";
import { ShippingStatusFilter } from "@/components/shipping-status-filter";
import { ShippingStatusCards } from "@/components/shipping-status-cards";
import { PackageTable } from "@/components/package-table";
import { ShippingStatusChart } from "@/components/charts/shipping-status-chart";
import { DeliveryTimelineChart } from "@/components/charts/delivery-timeline-chart";
import { ArrivalTimeline } from "@/components/arrival-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  "Processing": ["processing", "preparing", "seller ship", "ready to ship"],
  "Shipped": ["shipped", "dispatched"],
  "In Transit": ["in transit", "on the way", "awaiting delivery"],
  "Out for Delivery": ["out for delivery", "delivering"],
  "Delivered": ["delivered", "order complete", "completed", "received"],
  "Return / Refund": ["return", "refund"],
  "Cancelled": ["cancel"],
};

function getWeekLabel(date: Date): string {
  // Get Monday of the week
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  return monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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

  const dateWhere = {
    userId,
    ...(Object.keys(dateFilter).length && { orderDate: dateFilter }),
  };

  const [orders, total, allOrdersInRange, timelineOrders] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { orderDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
    prisma.order.findMany({
      where: dateWhere,
      select: { status: true, trackingNumber: true, estimatedDelivery: true },
    }),
    // Orders with estimated delivery for the arrival timeline
    prisma.order.findMany({
      where: {
        ...dateWhere,
        estimatedDelivery: { not: null },
      },
      include: {
        items: { select: { id: true, title: true, imageUrl: true } },
      },
      orderBy: { estimatedDelivery: "asc" },
      take: 20,
    }),
  ]);

  // Status counts from all orders in date range (ignoring status filter)
  const statusCounts: Record<string, number> = {};
  for (const o of allOrdersInRange) {
    const info = getShippingStatus(o.status);
    statusCounts[info.label] = (statusCounts[info.label] ?? 0) + 1;
  }

  const IN_TRANSIT_LABELS = ["Shipped", "In Transit", "Out for Delivery"];
  const inTransitCount = IN_TRANSIT_LABELS.reduce((sum, l) => sum + (statusCounts[l] ?? 0), 0);
  const deliveredCount = statusCounts["Delivered"] ?? 0;
  const pendingCount = (statusCounts["Payment Pending"] ?? 0) + (statusCounts["Processing"] ?? 0) + (statusCounts["Payment Accepted"] ?? 0);
  const otherCount = allOrdersInRange.length - inTransitCount - deliveredCount - pendingCount;

  // Chart data: status distribution
  const statusChartData = [
    { label: "In Transit", count: inTransitCount },
    { label: "Delivered", count: deliveredCount },
    { label: "Pending / Processing", count: pendingCount },
    ...(otherCount > 0 ? [{ label: "Other", count: otherCount }] : []),
  ];

  // Chart data: delivery timeline (group by week)
  const weekCounts = new Map<string, number>();
  for (const o of allOrdersInRange) {
    if (!o.estimatedDelivery) continue;
    const d = new Date(o.estimatedDelivery);
    const weekKey = getWeekLabel(d);
    weekCounts.set(weekKey, (weekCounts.get(weekKey) ?? 0) + 1);
  }
  // Sort by actual date — re-derive Monday for sorting
  const deliveryTimeline = Array.from(weekCounts.entries())
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => {
      // Parse "Mon DD" back to a date for sorting
      const parse = (label: string) => new Date(`${label}, ${new Date().getFullYear()}`).getTime();
      return parse(a.week) - parse(b.week);
    });

  const totalPages = Math.ceil(total / limit);

  const paginationParams = (p: number) => {
    const sp = new URLSearchParams();
    if (params.from) sp.set("from", params.from);
    if (params.to) sp.set("to", params.to);
    if (params.status) sp.set("status", params.status);
    sp.set("page", String(p));
    return sp.toString();
  };

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

      {/* Clickable summary cards */}
      <Suspense>
        <ShippingStatusCards
          inTransitCount={inTransitCount}
          deliveredCount={deliveredCount}
          pendingCount={pendingCount}
          totalCount={allOrdersInRange.length}
        />
      </Suspense>

      {/* Filters + package table — primary actionable content */}
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
          <PackageTable orders={orders} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`/shipping?${paginationParams(page - 1)}`}
                    className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted transition-colors"
                  >
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={`/shipping?${paginationParams(page + 1)}`}
                    className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted transition-colors"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Arrival timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estimated Arrivals</CardTitle>
        </CardHeader>
        <CardContent>
          <ArrivalTimeline orders={timelineOrders} />
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ShippingStatusChart data={statusChartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <DeliveryTimelineChart data={deliveryTimeline} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
