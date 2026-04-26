import { prisma } from "@/lib/prisma";

export interface SellerSummary {
  name: string;
  totalSpent: number;
  orderCount: number;
  avgOrder: number;
  lastOrderDate: Date;
}

export interface SellersOverview {
  sellers: SellerSummary[];
  totalSellers: number;
  topSeller: SellerSummary | null;
  /** Fraction (0–1) of sellers with more than one order. */
  repeatRate: number;
  /** Most-recent order currency, used for amount formatting. */
  primaryCurrency: string;
}

/**
 * Aggregate sellers for the directory page: spend, order count, avg order,
 * last purchase date — sorted descending by total spend. Driven by Prisma
 * groupBy so all aggregation happens at the DB level.
 */
export async function getSellersOverview(
  userId: string
): Promise<SellersOverview> {
  const [groups, primaryOrder] = await Promise.all([
    prisma.order.groupBy({
      by: ["sellerName"],
      where: { userId, sellerName: { not: null } },
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
      _count: true,
      _max: { orderDate: true },
      orderBy: { _sum: { totalAmount: "desc" } },
    }),
    prisma.order.findFirst({
      where: { userId },
      select: { currency: true },
      orderBy: { orderDate: "desc" },
    }),
  ]);

  const sellers: SellerSummary[] = groups
    .filter((g) => g.sellerName && g._max.orderDate)
    .map((g) => ({
      name: g.sellerName!,
      totalSpent: Math.round((g._sum.totalAmount ?? 0) * 100) / 100,
      orderCount: g._count,
      avgOrder: Math.round((g._avg.totalAmount ?? 0) * 100) / 100,
      lastOrderDate: g._max.orderDate!,
    }));

  const repeatCount = sellers.filter((s) => s.orderCount > 1).length;
  const repeatRate = sellers.length > 0 ? repeatCount / sellers.length : 0;

  return {
    sellers,
    totalSellers: sellers.length,
    topSeller: sellers[0] ?? null,
    repeatRate,
    primaryCurrency: primaryOrder?.currency ?? "USD",
  };
}
