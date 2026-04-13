import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SummaryCards } from "@/components/charts/summary-cards";
import { SpendingChart } from "@/components/charts/spending-chart";
import { SellersChart } from "@/components/charts/sellers-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getSummary(userId: string) {
  const [orderAgg, itemCount] = await Promise.all([
    prisma.order.aggregate({
      where: { userId },
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
      _count: true,
    }),
    prisma.orderItem.count({ where: { order: { userId } } }),
  ]);

  return {
    totalSpent: orderAgg._sum.totalAmount || 0,
    totalOrders: orderAgg._count,
    avgOrderValue: orderAgg._avg.totalAmount || 0,
    totalItems: itemCount,
  };
}

async function getSpendingSeries(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
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

async function getTopSellers(userId: string) {
  const sellers = await prisma.order.groupBy({
    by: ["sellerName"],
    where: { userId, sellerName: { not: null } },
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

async function getRecentOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { orderDate: "desc" },
    take: 5,
  });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;

  const [summary, spending, sellers, recentOrders] = await Promise.all([
    getSummary(userId),
    getSpendingSeries(userId),
    getTopSellers(userId),
    getRecentOrders(userId),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Your AliExpress spending overview
        </p>
      </div>

      <SummaryCards {...summary} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingChart data={spending} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            <SellersChart data={sellers} />
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
                        {order.aliOrderId}
                      </td>
                      <td className="py-2">{order.sellerName || "—"}</td>
                      <td className="py-2">{order.items.length}</td>
                      <td className="py-2 text-right font-medium">
                        ${order.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
