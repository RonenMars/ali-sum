import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DateRangeFilter } from "@/components/date-range-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdersTable } from "@/components/orders-table";

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
          <OrdersTable orders={orders} />

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
        </CardContent>
      </Card>
    </div>
  );
}
