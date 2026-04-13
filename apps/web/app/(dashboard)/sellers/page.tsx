import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/format";
import { SellersChart } from "@/components/charts/sellers-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function getSellers(userId: string) {
  const sellers = await prisma.order.groupBy({
    by: ["sellerName"],
    where: { userId, sellerName: { not: null } },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 50,
  });

  return sellers.map((s) => ({
    name: s.sellerName || "Unknown",
    totalSpent: Math.round((s._sum.totalAmount || 0) * 100) / 100,
    orderCount: s._count,
  }));
}

export default async function SellersPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const [sellers, primaryOrder] = await Promise.all([
    getSellers(userId),
    prisma.order.findFirst({ where: { userId }, select: { currency: true }, orderBy: { orderDate: "desc" } }),
  ]);
  const primaryCurrency = primaryOrder?.currency ?? "USD";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Sellers</h1>
        <p className="text-muted-foreground text-sm">
          See which sellers you spend the most with
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Sellers by Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <SellersChart data={sellers.slice(0, 10)} currency={primaryCurrency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Sellers</CardTitle>
        </CardHeader>
        <CardContent>
          {sellers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No seller data yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.map((seller) => (
                  <TableRow key={seller.name}>
                    <TableCell className="font-medium">{seller.name}</TableCell>
                    <TableCell className="text-right">
                      {seller.orderCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(seller.totalSpent, primaryCurrency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
